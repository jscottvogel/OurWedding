/**
 * Production data migration for the tenant-isolation release.
 *
 * Idempotent. Dry-run by default; pass --apply to write.
 *
 *   npx tsx tools/migrations/backfill-owners.ts --api-id <appsyncApiId> --user-pool-id <poolId> [--env NONE] [--phase pre|post] [--apply]
 *
 * Phase "pre" (run BEFORE deploying the new schema, safe under old schema):
 *   1. Derive each wedding's owners/readers from WeddingMember -> Profile.cognitoSub
 *      (admin/planner -> owners, vendor -> readers). Falls back to the legacy `owner`
 *      attribute ("sub::username") on the Wedding / WeddingMember records.
 *   2. Write `owners` (and `readers` on Wedding/Vendor/RunSheetItem) onto every
 *      wedding-scoped record. MoodPins inherit via their MoodBoard.
 *   3. Guestbook entries with no isApproved get isApproved=true (old default) so they stay visible.
 *   4. Cognito users with no group are added to `planner` (or `vendor` if they are only
 *      vendor members) - the new middleware denies users without a group.
 *
 * Phase "post" (run AFTER deploy, once the SitePassword table exists):
 *   - Re-runs the "pre" steps (catches records created during the deploy window), then
 *   - moves plaintext WebsiteConfig.sitePassword into SitePassword as an scrypt hash and
 *     removes the plaintext attribute.
 *
 * Requires AWS credentials with DynamoDB read/write on the Amplify tables and
 * cognito-idp:ListUsers/AdminListGroupsForUser/AdminAddUserToGroup.
 */
import { DynamoDBClient, paginateListTables } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import {
  CognitoIdentityProviderClient,
  paginateListUsers,
  AdminListGroupsForUserCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { randomBytes, randomUUID, scryptSync } from 'crypto';

type Item = Record<string, any>;

const args = process.argv.slice(2);
const arg = (name: string, def?: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const APPLY = args.includes('--apply');
const API_ID = arg('api-id');
const USER_POOL_ID = arg('user-pool-id');
const ENV = arg('env', 'NONE')!;
const PHASE = arg('phase', 'pre') as 'pre' | 'post';

if (!API_ID || !USER_POOL_ID) {
  console.error('Usage: --api-id <id> --user-pool-id <id> [--env NONE] [--phase pre|post] [--apply]');
  process.exit(1);
}

const ddb = new DynamoDBClient({});
const doc = DynamoDBDocumentClient.from(ddb, { marshallOptions: { removeUndefinedValues: true } });
const cognito = new CognitoIdentityProviderClient({});

const READER_MODELS = new Set(['Wedding', 'Vendor', 'RunSheetItem']);
// Handled specially or not wedding-scoped.
const SKIP_MODELS = new Set(['Wedding', 'Profile', 'MoodPin', 'SitePassword']);

const stats: Record<string, number> = {};
const bump = (k: string, n = 1) => (stats[k] = (stats[k] || 0) + n);

async function discoverTables(): Promise<Record<string, string>> {
  const suffix = `-${API_ID}-${ENV}`;
  const tables: Record<string, string> = {};
  for await (const page of paginateListTables({ client: ddb }, {})) {
    for (const name of page.TableNames || []) {
      if (name.endsWith(suffix)) tables[name.slice(0, -suffix.length)] = name;
    }
  }
  if (!tables.Wedding) throw new Error(`No Wedding table found with suffix ${suffix}`);
  return tables;
}

async function scanAll(table: string): Promise<Item[]> {
  const out: Item[] = [];
  let ExclusiveStartKey: Item | undefined;
  do {
    const res = await doc.send(new ScanCommand({ TableName: table, ExclusiveStartKey }));
    out.push(...(res.Items || []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return out;
}

const subFromLegacyOwner = (owner?: string) => (owner ? owner.split('::')[0] : undefined);
const sameSet = (a: string[] = [], b: string[] = []) =>
  a.length === b.length && a.every((x) => b.includes(x));

async function setAccess(table: string, item: Item, owners: string[], readers?: string[]) {
  const ownersOk = sameSet(item.owners, owners);
  const readersOk = readers === undefined || sameSet(item.readers, readers);
  if (ownersOk && readersOk) return bump('records.unchanged');
  bump('records.updated');
  if (!APPLY) return;
  const names: Item = { '#o': 'owners' };
  const values: Item = { ':o': owners };
  let expr = 'SET #o = :o';
  if (readers !== undefined) {
    names['#r'] = 'readers';
    values[':r'] = readers;
    expr += ', #r = :r';
  }
  await doc.send(new UpdateCommand({
    TableName: table,
    Key: { id: item.id },
    UpdateExpression: expr,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  }));
}

function hashPassword(password: string): string {
  // Must match amplify/functions/public-site/handler.ts
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

async function main() {
  console.log(`Phase=${PHASE} apply=${APPLY} api=${API_ID} env=${ENV}`);
  const T = await discoverTables();
  console.log('Tables:', Object.keys(T).sort().join(', '));

  // --- 1. Derive access per wedding ---
  const profiles = T.Profile ? await scanAll(T.Profile) : [];
  const subByProfile = new Map(profiles.map((p) => [p.id, p.cognitoSub as string]));
  const members = T.WeddingMember ? await scanAll(T.WeddingMember) : [];
  const weddings = await scanAll(T.Wedding);

  const access = new Map<string, { owners: Set<string>; readers: Set<string> }>();
  const roleBySub = new Map<string, Set<string>>();
  for (const w of weddings) {
    const a = { owners: new Set<string>(w.owners || []), readers: new Set<string>(w.readers || []) };
    const legacy = subFromLegacyOwner(w.owner);
    if (legacy) a.owners.add(legacy);
    access.set(w.id, a);
  }
  for (const m of members) {
    const a = access.get(m.weddingId);
    const sub = subByProfile.get(m.profileId) || subFromLegacyOwner(m.owner);
    if (!a || !sub) { bump('members.unresolved'); continue; }
    const role = m.role || 'admin';
    if (!roleBySub.has(sub)) roleBySub.set(sub, new Set());
    roleBySub.get(sub)!.add(role);
    if (role === 'admin' || role === 'planner') a.owners.add(sub);
    else if (role === 'vendor') a.readers.add(sub);
  }
  // A sub can't be both; owners wins.
  for (const a of access.values()) for (const s of a.owners) a.readers.delete(s);

  const orphans = weddings.filter((w) => access.get(w.id)!.owners.size === 0);
  if (orphans.length) {
    console.warn(`\n!! ${orphans.length} wedding(s) have no resolvable owner (will be inaccessible):`);
    for (const w of orphans) console.warn(`   ${w.id} ${w.slug} (${w.coupleName1} & ${w.coupleName2})`);
  }

  const ownersOf = (weddingId?: string) => (weddingId ? access.get(weddingId) : undefined);

  // --- 2. Backfill records ---
  for (const w of weddings) {
    const a = access.get(w.id)!;
    await setAccess(T.Wedding, w, [...a.owners], [...a.readers]);
  }
  const boardWedding = new Map<string, string>();
  for (const [model, table] of Object.entries(T)) {
    if (SKIP_MODELS.has(model)) continue;
    const items = await scanAll(table);
    for (const item of items) {
      if (model === 'MoodBoard' && item.weddingId) boardWedding.set(item.id, item.weddingId);
      if (!item.weddingId) { bump(`skipped.noWeddingId.${model}`); continue; }
      const a = ownersOf(item.weddingId);
      if (!a) { bump(`skipped.unknownWedding.${model}`); continue; }
      const owners = [...a.owners];
      // WeddingMember: the member themself must keep access to their own row.
      if (model === 'WeddingMember') {
        const self = subByProfile.get(item.profileId) || subFromLegacyOwner(item.owner);
        if (self && !owners.includes(self)) owners.push(self);
      }
      await setAccess(table, item, owners, READER_MODELS.has(model) ? [...a.readers] : undefined);

      if (model === 'WebsiteGuestbook' && item.isApproved === undefined) {
        bump('guestbook.approvedBackfill');
        if (APPLY) await doc.send(new UpdateCommand({
          TableName: table, Key: { id: item.id },
          UpdateExpression: 'SET isApproved = :t', ExpressionAttributeValues: { ':t': true },
        }));
      }
    }
  }
  if (T.MoodPin) {
    for (const pin of await scanAll(T.MoodPin)) {
      const a = ownersOf(pin.weddingId || boardWedding.get(pin.moodBoardId));
      if (!a) { bump('skipped.unknownWedding.MoodPin'); continue; }
      await setAccess(T.MoodPin, pin, [...a.owners]);
    }
  }

  // --- 3. Cognito groups ---
  for await (const page of paginateListUsers({ client: cognito }, { UserPoolId: USER_POOL_ID })) {
    for (const u of page.Users || []) {
      const groups = await cognito.send(new AdminListGroupsForUserCommand({ UserPoolId: USER_POOL_ID, Username: u.Username! }));
      if ((groups.Groups || []).length > 0) { bump('users.hasGroup'); continue; }
      const sub = u.Attributes?.find((x) => x.Name === 'sub')?.Value;
      const roles = (sub && roleBySub.get(sub)) || new Set<string>();
      const group = roles.size > 0 && [...roles].every((r) => r === 'vendor') ? 'vendor' : 'planner';
      bump(`users.addTo.${group}`);
      if (APPLY) await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId: USER_POOL_ID, Username: u.Username!, GroupName: group }));
    }
  }

  // --- 4. Post-deploy: plaintext site passwords -> SitePassword hashes ---
  if (PHASE === 'post') {
    if (!T.SitePassword) throw new Error('SitePassword table not found - deploy the new schema first');
    const existing = new Set((await scanAll(T.SitePassword)).map((p) => p.weddingId));
    for (const cfg of await scanAll(T.WebsiteConfig)) {
      if (!cfg.sitePassword) continue;
      const a = ownersOf(cfg.weddingId);
      if (!existing.has(cfg.weddingId)) {
        bump('passwords.migrated');
        if (APPLY) {
          const now = new Date().toISOString();
          await doc.send(new PutCommand({
            TableName: T.SitePassword,
            Item: {
              id: randomUUID(), __typename: 'SitePassword', weddingId: cfg.weddingId,
              passwordHash: hashPassword(String(cfg.sitePassword)),
              owners: a ? [...a.owners] : [], createdAt: now, updatedAt: now,
            },
          }));
        }
      }
      bump('passwords.plaintextRemoved');
      if (APPLY) await doc.send(new UpdateCommand({
        TableName: T.WebsiteConfig, Key: { id: cfg.id }, UpdateExpression: 'REMOVE sitePassword',
      }));
    }
  }

  console.log('\nSummary', APPLY ? '(applied)' : '(DRY RUN - nothing written)');
  console.table(stats);
  if (orphans.length) process.exitCode = 2;
}

main().catch((e) => { console.error(e); process.exit(1); });
