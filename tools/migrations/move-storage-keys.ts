/**
 * One-off migration: move pre-lockdown S3 objects into the tenant-scoped key layout
 *
 *   weddings/{weddingId}/{public|private}/{kind}/{timestamp}-{name}
 *
 * and rewrite the key fields on the records that point at them.
 *
 * WHY: the old layout (gallery/, assets/, story/, logo/, guestbook/, registry/, ...) didn't
 * encode the wedding, so the storage-access Lambda can't check ownership for those objects. Until
 * this has run, storage-access serves legacy keys read-only to the same audience the old storage
 * rules allowed (ALLOW_LEGACY_KEYS, default on).
 *
 * WHAT IT TOUCHES (model.field -> kind):
 *   Wedding.heroImageKey            -> hero        (weddingId = record id)
 *   WebsiteConfig.siteLogoKey       -> logo
 *   WebsiteStory.storyImageKey      -> story
 *   WebsiteRegistry.imageKey        -> registry
 *   GalleryUpload.fileKey/thumbnailKey -> gallery
 *   WebsiteGuestbook.mediaKey       -> guestbook
 *   Vendor.contractFileKey          -> contracts
 *   MoodPin.imageKey                -> moodboard   (weddingId via MoodBoard.weddingId)
 * Ivy chat attachments (chat/) aren't referenced by any record; they are transient and are left
 * in place (delete the chat/ prefix once ALLOW_LEGACY_KEYS=false).
 *
 * SAFETY:
 *   - Dry run by default. Pass --apply to copy objects and update records.
 *   - Objects are COPIED; old objects stay until you re-run with --apply --delete-source
 *     (after verifying the app), so a failed run never loses data.
 *   - Idempotent: records already holding a weddings/... key are skipped. A record is updated
 *     with a condition on the old value, so concurrent edits aren't overwritten.
 *   - An object referenced by records of two different weddings is copied once per wedding.
 *
 * USAGE (credentials from the usual AWS env/profile; table names from the Amplify console or
 * `aws dynamodb list-tables`, they look like Wedding-<apiId>-<env>):
 *
 *   npx tsx tools/migrations/move-storage-keys.ts \
 *     --bucket <amplify-bucket-name> --table-suffix -<apiId>-<env> [--region us-east-1] \
 *     [--apply] [--delete-source]
 *
 * After a clean --apply run (and a --delete-source run), set ALLOW_LEGACY_KEYS=false on the
 * storage-access function (amplify/functions/storage-access/resource.ts) and redeploy.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { buildKey, isLegacyKey, parseKey, type FileKind } from '../../amplify/functions/shared/storage-keys';

// ------------------------------------------------------------------ args

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const BUCKET = arg('bucket');
const SUFFIX = arg('table-suffix');
const REGION = arg('region') || process.env.AWS_REGION || 'us-east-1';
const APPLY = flag('apply');
const DELETE_SOURCE = flag('delete-source');

if (!BUCKET || !SUFFIX) {
  console.error('Usage: npx tsx tools/migrations/move-storage-keys.ts --bucket <name> --table-suffix -<apiId>-<env> [--apply] [--delete-source]');
  process.exit(1);
}
if (DELETE_SOURCE && !APPLY) {
  console.error('--delete-source requires --apply');
  process.exit(1);
}

const table = (model: string) => `${model}${SUFFIX}`;
const doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});
const s3 = new S3Client({ region: REGION });

// ------------------------------------------------------------------ plan

interface FieldSpec {
  model: string;
  fields: string[];
  kind: FileKind;
  /** How to find the wedding for a record. */
  weddingIdOf: (item: Record<string, any>) => Promise<string | undefined> | string | undefined;
}

const moodBoardWedding = new Map<string, string | undefined>();
async function weddingForMoodBoard(moodBoardId?: string) {
  if (!moodBoardId) return undefined;
  if (!moodBoardWedding.has(moodBoardId)) {
    const res = await doc.send(new GetCommand({ TableName: table('MoodBoard'), Key: { id: moodBoardId } }));
    moodBoardWedding.set(moodBoardId, res.Item?.weddingId);
  }
  return moodBoardWedding.get(moodBoardId);
}

const SPECS: FieldSpec[] = [
  { model: 'Wedding', fields: ['heroImageKey'], kind: 'hero', weddingIdOf: (i) => i.id },
  { model: 'WebsiteConfig', fields: ['siteLogoKey'], kind: 'logo', weddingIdOf: (i) => i.weddingId },
  { model: 'WebsiteStory', fields: ['storyImageKey'], kind: 'story', weddingIdOf: (i) => i.weddingId },
  { model: 'WebsiteRegistry', fields: ['imageKey'], kind: 'registry', weddingIdOf: (i) => i.weddingId },
  { model: 'GalleryUpload', fields: ['fileKey', 'thumbnailKey'], kind: 'gallery', weddingIdOf: (i) => i.weddingId },
  { model: 'WebsiteGuestbook', fields: ['mediaKey'], kind: 'guestbook', weddingIdOf: (i) => i.weddingId },
  { model: 'Vendor', fields: ['contractFileKey'], kind: 'contracts', weddingIdOf: (i) => i.weddingId },
  { model: 'MoodPin', fields: ['imageKey'], kind: 'moodboard', weddingIdOf: (i) => weddingForMoodBoard(i.moodBoardId) },
];

/** Pre-lockdown prefixes that may hold objects, including ones that never had storage rules. */
const isOldKey = (key: string) =>
  isLegacyKey(key) || /^(moodboard|vendors)\/[^.]/.test(key);

// ------------------------------------------------------------------ helpers

async function* scan(tableName: string) {
  let ExclusiveStartKey: Record<string, any> | undefined;
  do {
    const res = await doc.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey }));
    for (const item of res.Items || []) yield item;
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
}

async function exists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (e: any) {
    if (e?.$metadata?.httpStatusCode === 404 || e?.name === 'NotFound') return false;
    throw e;
  }
}

/** Old key -> new key, per wedding, so shared objects/thumbnails map consistently within a run. */
const moved = new Map<string, string>();
const sourcesToDelete = new Set<string>();

function originalName(oldKey: string): string {
  // gallery/{weddingId}/{ts}-{name}, assets/hero-{ts}-{name}, story/{ts}-{name} ... -> name
  const last = oldKey.split('/').pop() || 'file';
  return last.replace(/^hero-/, '').replace(/^\d{10,}-/, '') || 'file';
}

async function moveObject(oldKey: string, weddingId: string, kind: FileKind): Promise<string | null> {
  const cacheKey = `${weddingId}|${kind}|${oldKey}`;
  if (moved.has(cacheKey)) return moved.get(cacheKey)!;
  if (!(await exists(oldKey))) {
    console.warn(`  ! missing object ${oldKey} (record left unchanged)`);
    return null;
  }
  const tsMatch = oldKey.match(/(\d{10,})-/);
  const newKey = buildKey(weddingId, kind, originalName(oldKey), tsMatch ? Number(tsMatch[1]) : Date.now());
  if (APPLY) {
    await s3.send(new CopyObjectCommand({
      Bucket: BUCKET,
      Key: newKey,
      CopySource: `${BUCKET}/${oldKey.split('/').map(encodeURIComponent).join('/')}`,
      MetadataDirective: 'COPY',
    }));
  }
  moved.set(cacheKey, newKey);
  sourcesToDelete.add(oldKey);
  return newKey;
}

// ------------------------------------------------------------------ main

async function main() {
  console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'}: bucket=${BUCKET} tables=*${SUFFIX} region=${REGION}`);
  const stats = { records: 0, updated: 0, skipped: 0, missing: 0, errors: 0 };

  for (const spec of SPECS) {
    console.log(`\n== ${spec.model} (${spec.fields.join(', ')}) -> ${spec.kind}`);
    for await (const item of scan(table(spec.model))) {
      const updates: Record<string, string> = {};
      const olds: Record<string, string> = {};
      for (const field of spec.fields) {
        const key = item[field];
        if (typeof key !== 'string' || !key) continue;
        if (parseKey(key)) { stats.skipped++; continue; }
        if (!isOldKey(key)) { console.warn(`  ? ${spec.model}/${item.id}.${field}: unrecognised key "${key}"`); continue; }
        stats.records++;
        try {
          const weddingId = await spec.weddingIdOf(item);
          if (!weddingId) { console.warn(`  ! ${spec.model}/${item.id}: no weddingId`); stats.errors++; continue; }
          const newKey = await moveObject(key, weddingId, spec.kind);
          if (!newKey) { stats.missing++; continue; }
          updates[field] = newKey;
          olds[field] = key;
          console.log(`  ${spec.model}/${item.id}.${field}: ${key} -> ${newKey}`);
        } catch (e) {
          stats.errors++;
          console.error(`  x ${spec.model}/${item.id}.${field}:`, (e as Error).message);
        }
      }
      const fields = Object.keys(updates);
      if (!fields.length || !APPLY) continue;
      try {
        await doc.send(new UpdateCommand({
          TableName: table(spec.model),
          Key: { id: item.id },
          UpdateExpression: `SET ${fields.map((f, i) => `#f${i} = :n${i}`).join(', ')}, #u = :u`,
          ConditionExpression: fields.map((_, i) => `#f${i} = :o${i}`).join(' AND '),
          ExpressionAttributeNames: { ...Object.fromEntries(fields.map((f, i) => [`#f${i}`, f])), '#u': 'updatedAt' },
          ExpressionAttributeValues: {
            ...Object.fromEntries(fields.flatMap((f, i) => [[`:n${i}`, updates[f]], [`:o${i}`, olds[f]]])),
            ':u': new Date().toISOString(),
          },
        }));
        stats.updated++;
      } catch (e) {
        stats.errors++;
        console.error(`  x update ${spec.model}/${item.id}:`, (e as Error).message);
      }
    }
  }

  if (DELETE_SOURCE) {
    if (stats.errors) {
      console.error(`\nNot deleting sources: ${stats.errors} error(s) in this run. Fix and re-run.`);
    } else {
      console.log(`\nDeleting ${sourcesToDelete.size} migrated source object(s)...`);
      for (const key of sourcesToDelete) await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    }
  }

  console.log(`\nDone. legacy refs=${stats.records} records updated=${stats.updated} already-migrated=${stats.skipped} missing objects=${stats.missing} errors=${stats.errors}`);
  if (!APPLY) console.log('Dry run only. Re-run with --apply to copy objects and update records.');
  if (stats.errors) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
