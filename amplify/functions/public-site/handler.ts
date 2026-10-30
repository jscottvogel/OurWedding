import type { AppSyncResolverEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';
import { parseKey } from '../shared/storage-keys';
import { verifyUnsubscribeToken } from '../shared/unsubscribe';

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

const T = {
  wedding: process.env.TABLE_WEDDING!,
  config: process.env.TABLE_WEBSITE_CONFIG!,
  sitePassword: process.env.TABLE_SITE_PASSWORD!,
  guest: process.env.TABLE_GUEST!,
  guestTag: process.env.TABLE_GUEST_TAG!,
  moodBoard: process.env.TABLE_MOOD_BOARD!,
  moodPin: process.env.TABLE_MOOD_PIN!,
  analytics: process.env.TABLE_WEBSITE_ANALYTICS!,
  guestbook: process.env.TABLE_WEBSITE_GUESTBOOK!,
  gallery: process.env.TABLE_GALLERY_UPLOAD!,
  seatingTable: process.env.TABLE_SEATING_TABLE!,
  serveAccess: process.env.TABLE_SERVE_ACCESS!,
  vendor: process.env.TABLE_VENDOR!,
  vendorTask: process.env.TABLE_VENDOR_TASK!,
  profile: process.env.TABLE_PROFILE!,
};

const ROOT_DOMAIN = (process.env.ROOT_DOMAIN || 'weddingsteward.com').toLowerCase();

type Item = Record<string, any>;

// ---------------------------------------------------------------- helpers

class PublicError extends Error {}

const now = () => new Date().toISOString();

/** A guest-submitted key must be a new-layout public key of `kind` inside this site's wedding. */
function isGuestKeyFor(key: string, kind: 'gallery' | 'guestbook', weddingId: string): boolean {
  const parsed = parseKey(key);
  return !!parsed && parsed.kind === kind && parsed.weddingId === weddingId;
}

function requireInternalKey(key: unknown) {
  const expected = process.env.INTERNAL_API_SECRET || '';
  const given = typeof key === 'string' ? key : '';
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new PublicError('Unauthorized');
  }
}

function str(v: unknown, max: number, field: string, required = false): string | undefined {
  if (v === undefined || v === null || v === '') {
    if (required) throw new PublicError(`${field} is required`);
    return undefined;
  }
  if (typeof v !== 'string') throw new PublicError(`${field} must be a string`);
  const t = v.trim();
  if (t.length > max) throw new PublicError(`${field} is too long`);
  if (required && !t) throw new PublicError(`${field} is required`);
  return t || undefined;
}

async function queryAll(table: string, indexName: string, key: string, value: string): Promise<Item[]> {
  const out: Item[] = [];
  let ExclusiveStartKey: Item | undefined;
  do {
    const res = await doc.send(new QueryCommand({
      TableName: table,
      IndexName: indexName,
      KeyConditionExpression: '#k = :v',
      ExpressionAttributeNames: { '#k': key },
      ExpressionAttributeValues: { ':v': value },
      ExclusiveStartKey,
    }));
    out.push(...(res.Items || []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return out;
}

async function queryFirst(table: string, indexName: string, key: string, value: string): Promise<Item | undefined> {
  const res = await doc.send(new QueryCommand({
    TableName: table,
    IndexName: indexName,
    KeyConditionExpression: '#k = :v',
    ExpressionAttributeNames: { '#k': key },
    ExpressionAttributeValues: { ':v': value },
    Limit: 1,
  }));
  return res.Items?.[0];
}

async function getItem(table: string, id: string): Promise<Item | undefined> {
  const res = await doc.send(new GetCommand({ TableName: table, Key: { id } }));
  return res.Item;
}

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
}

interface ResolvedSite {
  weddingId: string;
  slug: string;
  config?: Item;
}

/** Find a site by slug (WebsiteConfig.subdomain or Wedding.slug) or by full hostname. */
async function resolveSite(args: { slug?: string | null; host?: string | null }): Promise<ResolvedSite | null> {
  let slug = args.slug ? decodeURIComponent(args.slug).trim().toLowerCase() : undefined;

  if (!slug && args.host) {
    const host = normalizeHost(args.host);
    if (host.endsWith(`.${ROOT_DOMAIN}`)) {
      const sub = host.slice(0, -(ROOT_DOMAIN.length + 1));
      if (sub && sub !== 'www' && !sub.includes('.')) slug = sub;
    } else {
      const bare = host.replace(/^www\./, '');
      const config =
        (await queryFirst(T.config, 'byCustomDomain', 'customDomain', bare)) ||
        (await queryFirst(T.config, 'byCustomDomain', 'customDomain', `www.${bare}`));
      if (config) return { weddingId: config.weddingId, slug: config.subdomain, config };
      return null;
    }
  }
  if (!slug || slug.length > 100) return null;

  const config = await queryFirst(T.config, 'bySubdomain', 'subdomain', slug);
  if (config) return { weddingId: config.weddingId, slug: config.subdomain, config };

  const wedding = await queryFirst(T.wedding, 'bySlug', 'slug', slug);
  if (!wedding) return null;
  const cfg = await queryFirst(T.config, 'byWeddingId', 'weddingId', wedding.id);
  return { weddingId: wedding.id, slug: cfg?.subdomain || wedding.slug, config: cfg };
}

async function requireSite(slug: string): Promise<ResolvedSite & { wedding: Item }> {
  const site = await resolveSite({ slug });
  if (!site) throw new PublicError('Site not found');
  const wedding = await getItem(T.wedding, site.weddingId);
  if (!wedding) throw new PublicError('Site not found');
  return { ...site, wedding };
}

/** Public writes may identify the site by slug or by weddingId. */
async function requirePublicSite(args: { slug?: string | null; weddingId?: string | null }) {
  if (args.slug) return requireSite(args.slug);
  const id = str(args.weddingId, 100, 'weddingId', true)!;
  const wedding = await getItem(T.wedding, id);
  if (!wedding) throw new PublicError('Site not found');
  return { weddingId: wedding.id as string, slug: wedding.slug as string, wedding };
}

function siteAccess(site: ResolvedSite) {
  return {
    weddingId: site.weddingId,
    slug: site.slug,
    passwordProtected: !!site.config?.passwordProtected,
    publishStatus: site.config?.publishStatus || 'DRAFT',
  };
}

// scrypt password hashing: "scrypt$<saltB64>$<hashB64>"
const SCRYPT_KEYLEN = 64;
function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}
function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltB64, hashB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, { N: 16384, r: 8, p: 1 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function publicGuest(g: Item) {
  return {
    id: g.id,
    firstName: g.firstName,
    lastName: g.lastName ?? '',
    rsvpStatus: g.rsvpStatus ?? 'PENDING',
    mealChoice: g.mealChoice ?? '',
    dietaryOther: g.dietaryOther ?? '',
    tags: g.tags ?? '',
    maxGuests: g.maxGuests ?? 1,
  };
}

const norm = (s: unknown) => (typeof s === 'string' ? s.trim().toLowerCase() : '');

function rsvpStatus(attending: unknown): 'CONFIRMED' | 'DECLINED' | 'PENDING' {
  return attending === true ? 'CONFIRMED' : attending === false ? 'DECLINED' : 'PENDING';
}

function callerSub(event: AppSyncResolverEvent<any>): string {
  const sub = (event.identity as any)?.sub as string | undefined;
  if (!sub) throw new PublicError('Unauthorized');
  return sub;
}

/** Profiles are few and owner-scoped; a filtered scan avoids depending on the generated GSI name. */
async function profileVendorIds(sub: string): Promise<string[]> {
  const out: string[] = [];
  let ExclusiveStartKey: Item | undefined;
  do {
    const res = await doc.send(new ScanCommand({
      TableName: T.profile,
      FilterExpression: 'cognitoSub = :s',
      ExpressionAttributeValues: { ':s': sub },
      ProjectionExpression: 'vendorId',
      ExclusiveStartKey,
    }));
    for (const p of res.Items || []) if (p.vendorId) out.push(p.vendorId);
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return out;
}

/**
 * May `sub` act as this vendor? Wedding owners always may. A vendor user must be in
 * Vendor.readers AND have a Profile linked to this vendorId (inviteUser adds every vendor user to
 * the readers of every Vendor in the wedding, so readers alone isn't specific enough).
 */
async function canActForVendor(sub: string, vendor: Item): Promise<boolean> {
  const wedding = await getItem(T.wedding, vendor.weddingId);
  if ((wedding?.owners || []).includes(sub)) return true;
  if (!(vendor.readers || []).includes(sub)) return false;
  return (await profileVendorIds(sub)).includes(vendor.id);
}

/** Serve cards work from the day before to the day after the wedding, in any timezone. */
function inServeWindow(weddingDate: unknown, nowMs = Date.now()): boolean {
  if (typeof weddingDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(weddingDate)) return false;
  const day = Date.parse(`${weddingDate}T00:00:00Z`);
  const H = 3600_000;
  // Local midnight of (date - 1) at UTC+14 .. local end of (date + 1) at UTC-12.
  return nowMs >= day - 24 * H - 14 * H && nowMs <= day + 48 * H + 12 * H;
}

const firstWord = (s: unknown) => (typeof s === 'string' ? s.trim().split(/\s+/)[0] || '' : '');

// ---------------------------------------------------------------- operations

const ops: Record<string, (args: any, event: AppSyncResolverEvent<any>) => Promise<unknown>> = {
  async getWeddingBySlug({ slug }) {
    const site = await resolveSite({ slug });
    if (!site) return null;
    const wedding = await getItem(T.wedding, site.weddingId);
    if (!wedding) return null;
    // Don't expose membership lists publicly.
    return { ...wedding, owners: null, readers: null };
  },

  async getMoodBoardByShareToken({ token }) {
    const t = str(token, 200, 'token', true)!;
    if (t.length < 8) return null;
    const board = await queryFirst(T.moodBoard, 'byShareToken', 'shareToken', t);
    if (!board || board.shareToken !== t) return null;
    const pins = await queryAll(T.moodPin, 'byMoodBoardId', 'moodBoardId', board.id);
    return {
      id: board.id,
      title: board.title,
      weddingId: board.weddingId,
      pins: pins.map((p) => ({
        id: p.id, imageKey: p.imageKey, sourceUrl: p.sourceUrl, title: p.title, notes: p.notes, tags: p.tags,
      })),
    };
  },

  async getSiteAccess({ slug, host }) {
    const site = await resolveSite({ slug, host });
    return site ? siteAccess(site) : null;
  },

  async verifySitePassword({ internalKey, slug, password }) {
    requireInternalKey(internalKey);
    const pw = str(password, 200, 'password', true)!;
    const site = await resolveSite({ slug });
    if (!site) return null;
    if (!site.config?.passwordProtected) return siteAccess(site);
    const record = await getItem(T.sitePassword, site.weddingId);
    if (!record?.passwordHash || !verifyPassword(pw, record.passwordHash)) return null;
    return siteAccess(site);
  },

  async lookupRsvpGuest({ internalKey, slug, firstName, lastName }) {
    requireInternalKey(internalKey);
    const first = norm(str(firstName, 100, 'firstName', true));
    const last = norm(str(lastName, 100, 'lastName', true));
    const site = await requireSite(slug);
    const guests = await queryAll(T.guest, 'byWeddingId', 'weddingId', site.weddingId);
    const match = guests.find((g) => norm(g.firstName) === first && norm(g.lastName) === last);
    if (!match) return { found: false };
    const party = guests.filter((g) => g.primaryGuestId === match.id);
    const tags = await queryAll(T.guestTag, 'byWeddingId', 'weddingId', site.weddingId);
    return {
      found: true,
      guest: publicGuest(match),
      partyMembers: party.map(publicGuest),
      publicTags: tags.filter((t) => t.isPublic).map((t) => ({ id: t.id, name: t.name })),
    };
  },

  async submitRsvp({ internalKey, slug, payload }) {
    requireInternalKey(internalKey);
    const p = typeof payload === 'string' ? JSON.parse(payload) : payload;
    if (!p || typeof p !== 'object') throw new PublicError('Invalid payload');
    const site = await requireSite(slug);
    const { wedding } = site;

    if (wedding.rsvpDeadline) {
      const deadline = new Date(`${wedding.rsvpDeadline}T23:59:59Z`).getTime();
      if (Date.now() > deadline) throw new PublicError('The RSVP deadline has passed');
    }

    const guestId = str(p.guestId, 100, 'guestId', true)!;
    const guest = await getItem(T.guest, guestId);
    if (!guest || guest.weddingId !== site.weddingId) throw new PublicError('Guest not found');

    const attending = p.attending === true;
    const previousEmail: string | undefined = guest.email || undefined;
    const email = str(p.email, 254, 'email');
    const phone = str(p.phone, 40, 'phone');
    const ts = now();

    await doc.send(new UpdateCommand({
      TableName: T.guest,
      Key: { id: guest.id },
      UpdateExpression:
        'SET rsvpStatus = :s, mealChoice = :m, dietaryOther = :d, tags = :t, email = :e, phone = :p, updatedAt = :u',
      ExpressionAttributeValues: {
        ':s': attending ? 'CONFIRMED' : 'DECLINED',
        ':m': attending ? (str(p.mealChoice, 200, 'mealChoice') ?? null) : null,
        ':d': attending ? (str(p.dietaryOther, 1000, 'dietaryOther') ?? null) : null,
        ':t': str(p.tags, 1000, 'tags') ?? guest.tags ?? null,
        ':e': email ?? guest.email ?? null,
        ':p': phone ?? guest.phone ?? null,
        ':u': ts,
      },
    }));

    const members: any[] = Array.isArray(p.partyMembers) ? p.partyMembers : [];
    const maxExtra = Math.max(0, (guest.maxGuests ?? 1) - 1);
    if (members.length > maxExtra) throw new PublicError(`Your invitation allows ${maxExtra} additional guest(s)`);

    for (const m of members) {
      const firstName = str(m.firstName, 100, 'firstName');
      if (!firstName) continue;
      const fields = {
        firstName,
        lastName: str(m.lastName, 100, 'lastName') ?? null,
        rsvpStatus: rsvpStatus(m.attending),
        mealChoice: m.attending ? (str(m.mealChoice, 200, 'mealChoice') ?? null) : null,
        dietaryOther: m.attending ? (str(m.dietaryOther, 1000, 'dietaryOther') ?? null) : null,
        tags: str(m.tags, 1000, 'tags') ?? null,
      };
      if (m.id) {
        const existing = await getItem(T.guest, String(m.id));
        if (!existing || existing.primaryGuestId !== guest.id || existing.weddingId !== site.weddingId) {
          throw new PublicError('Party member not found');
        }
        await doc.send(new UpdateCommand({
          TableName: T.guest,
          Key: { id: existing.id },
          UpdateExpression:
            'SET firstName = :f, lastName = :l, rsvpStatus = :s, mealChoice = :m, dietaryOther = :d, tags = :t, updatedAt = :u',
          ExpressionAttributeValues: {
            ':f': fields.firstName, ':l': fields.lastName, ':s': fields.rsvpStatus, ':m': fields.mealChoice,
            ':d': fields.dietaryOther, ':t': fields.tags, ':u': ts,
          },
        }));
      } else {
        await doc.send(new PutCommand({
          TableName: T.guest,
          Item: {
            __typename: 'Guest',
            id: randomUUID(),
            weddingId: site.weddingId,
            owners: wedding.owners ?? guest.owners ?? [],
            primaryGuestId: guest.id,
            maxGuests: 1,
            attendingCount: 1,
            ...fields,
            createdAt: ts,
            updatedAt: ts,
          },
        }));
      }
    }

    // Confirmation goes to the address already on file. If there wasn't one, it goes to the new address.
    // Opted-out guests get no confirmation; guestId lets the route add a signed unsubscribe link.
    return {
      success: true,
      attending,
      guestName: guest.firstName,
      guestId: guest.id,
      confirmationEmail: guest.emailOptOut ? null : previousEmail || email || null,
      coupleNames: `${wedding.coupleName1} & ${wedding.coupleName2}`,
      siteSlug: site.slug,
    };
  },

  async findSeat({ internalKey, slug, name }) {
    requireInternalKey(internalKey);
    const parts = (str(name, 200, 'name', true) || '').toLowerCase().split(/\s+/).filter(Boolean);
    // First AND last name are required, which makes enumerating the guest list impractical.
    if (parts.length < 2) return { enabled: true, found: false, needLastName: true };
    const site = await requireSite(slug);
    if (!site.config?.seatFinderEnabled || site.config.publishStatus === 'DRAFT') return { enabled: false, found: false };
    const first = parts[0];
    const last = parts.slice(1).join(' ');
    const guests = await queryAll(T.guest, 'byWeddingId', 'weddingId', site.weddingId);
    const matches = guests.filter((g) => norm(g.firstName) === first && norm(g.lastName) === last);
    const match = matches.find((g) => g.tableId) || matches[0];
    if (!match) return { enabled: true, found: false };
    if (!match.tableId) return { enabled: true, found: true, tableName: null, tablemates: [] };
    const table = await getItem(T.seatingTable, match.tableId);
    if (!table || table.weddingId !== site.weddingId) return { enabled: true, found: true, tableName: null, tablemates: [] };
    const tablemates = guests
      .filter((g) => g.tableId === table.id && g.id !== match.id)
      .map((g) => firstWord(g.firstName))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return { enabled: true, found: true, tableName: table.tableName || 'Your table', tablemates };
  },

  async getServeCard({ internalKey, token, guestId }) {
    requireInternalKey(internalKey);
    const t = str(token, 200, 'token', true)!;
    const gid = str(guestId, 100, 'guestId', true)!;
    if (t.length < 16) return { valid: false };
    const access = await queryFirst(T.serveAccess, 'byServeToken', 'token', t);
    if (!access || access.token !== t || !access.enabled) return { valid: false };
    const wedding = await getItem(T.wedding, access.weddingId);
    if (!wedding) return { valid: false };
    if (!inServeWindow(wedding.weddingDate)) return { valid: false, outsideWindow: true };
    const guest = await getItem(T.guest, gid);
    if (!guest || guest.weddingId !== access.weddingId) return { valid: false };
    // Plus-ones normally carry their own tableId; fall back to the primary guest's table.
    let tableId: string | undefined = guest.tableId;
    if (!tableId && guest.primaryGuestId) {
      const primary = await getItem(T.guest, guest.primaryGuestId);
      if (primary && primary.weddingId === access.weddingId) tableId = primary.tableId;
    }
    const table = tableId ? await getItem(T.seatingTable, tableId) : undefined;
    return {
      valid: true,
      firstName: firstWord(guest.firstName),
      tableName: table && table.weddingId === access.weddingId ? table.tableName || null : null,
      mealChoice: guest.mealChoice || null,
      dietary: {
        vegetarian: !!guest.dietaryVegetarian,
        vegan: !!guest.dietaryVegan,
        glutenFree: !!guest.dietaryGlutenFree,
        nutFree: !!guest.dietaryNutFree,
      },
    };
  },

  async unsubscribeGuest({ internalKey, token }) {
    requireInternalKey(internalKey);
    const guestId = verifyUnsubscribeToken(String(token || ''));
    if (!guestId) throw new PublicError('Invalid link');
    const guest = await getItem(T.guest, guestId);
    if (!guest) return true; // already deleted: nothing left to email
    await doc.send(new UpdateCommand({
      TableName: T.guest,
      Key: { id: guestId },
      UpdateExpression: 'SET emailOptOut = :t, updatedAt = :u',
      ExpressionAttributeValues: { ':t': true, ':u': now() },
    }));
    return true;
  },

  async requestDataDeletion({ internalKey, slug }) {
    requireInternalKey(internalKey);
    const site = await requireSite(slug);
    const owners: string[] = site.wedding.owners || [];
    const emails = new Set<string>();
    for (const sub of owners.slice(0, 10)) {
      const res = await doc.send(new ScanCommand({
        TableName: T.profile,
        FilterExpression: 'cognitoSub = :s',
        ExpressionAttributeValues: { ':s': sub },
        ProjectionExpression: 'email',
      }));
      for (const p of res.Items || []) if (typeof p.email === 'string' && p.email.includes('@')) emails.add(p.email);
    }
    return {
      recipients: Array.from(emails),
      coupleNames: `${site.wedding.coupleName1} & ${site.wedding.coupleName2}`,
    };
  },

  async setVendorTaskDone({ taskId, isDone }, event) {
    const sub = callerSub(event);
    const task = await getItem(T.vendorTask, str(taskId, 100, 'taskId', true)!);
    if (!task) throw new PublicError('Task not found');
    const vendor = await getItem(T.vendor, task.vendorId);
    if (!vendor || vendor.weddingId !== task.weddingId || !(await canActForVendor(sub, vendor))) {
      throw new PublicError('Unauthorized');
    }
    const done = isDone === true;
    const ts = now();
    const res = await doc.send(new UpdateCommand({
      TableName: T.vendorTask,
      Key: { id: task.id },
      UpdateExpression: 'SET isDone = :d, doneAt = :at, doneBy = :by, updatedAt = :u',
      ExpressionAttributeValues: { ':d': done, ':at': done ? ts : null, ':by': done ? sub : null, ':u': ts },
      ReturnValues: 'ALL_NEW',
    }));
    const a = res.Attributes || {};
    return { id: a.id, vendorId: a.vendorId, isDone: !!a.isDone, doneAt: a.doneAt ?? null, doneBy: a.doneBy ?? null };
  },

  async vendorCheckIn({ vendorId }, event) {
    const sub = callerSub(event);
    const vendor = await getItem(T.vendor, str(vendorId, 100, 'vendorId', true)!);
    if (!vendor || !(await canActForVendor(sub, vendor))) throw new PublicError('Unauthorized');
    const ts = now();
    await doc.send(new UpdateCommand({
      TableName: T.vendor,
      Key: { id: vendor.id },
      UpdateExpression: 'SET arrivedAt = :a, updatedAt = :u',
      ExpressionAttributeValues: { ':a': ts, ':u': ts },
    }));
    return ts;
  },

  async recordSiteView({ internalKey, slug }) {
    requireInternalKey(internalKey);
    const site = await resolveSite({ slug });
    if (!site?.config) return false;
    const ts = now();
    const dateString = ts.slice(0, 10);
    const wedding = await getItem(T.wedding, site.weddingId);
    await doc.send(new UpdateCommand({
      TableName: T.config,
      Key: { id: site.config.id },
      UpdateExpression: 'ADD viewCount :one',
      ExpressionAttributeValues: { ':one': 1 },
    }));
    await doc.send(new UpdateCommand({
      TableName: T.analytics,
      Key: { id: `${site.weddingId}_${dateString}` },
      UpdateExpression:
        'ADD #views :one SET weddingId = :w, dateString = :d, #owners = if_not_exists(#owners, :o), ' +
        '#tn = :tn, createdAt = if_not_exists(createdAt, :ts), updatedAt = :ts',
      ExpressionAttributeNames: { '#views': 'views', '#owners': 'owners', '#tn': '__typename' },
      ExpressionAttributeValues: {
        ':one': 1, ':w': site.weddingId, ':d': dateString, ':o': wedding?.owners ?? [], ':tn': 'WebsiteAnalytics', ':ts': ts,
      },
    }));
    return true;
  },

  async submitGuestbookEntry(args) {
    const site = await requirePublicSite(args);
    const guestName = str(args.guestName, 100, 'guestName', true)!;
    const message = str(args.message, 2000, 'message');
    const songRequest = str(args.songRequest, 300, 'songRequest');
    if (!message && !songRequest && !args.mediaKey) throw new PublicError('Message is required');
    const mediaKey = str(args.mediaKey, 500, 'mediaKey');
    if (mediaKey && !isGuestKeyFor(mediaKey, 'guestbook', site.weddingId)) throw new PublicError('Invalid media key');
    const messageType = ['GUESTBOOK', 'SONG_REQUEST', 'BOTH'].includes(args.messageType)
      ? args.messageType
      : songRequest && message ? 'BOTH' : songRequest ? 'SONG_REQUEST' : 'GUESTBOOK';
    const ts = now();
    await doc.send(new PutCommand({
      TableName: T.guestbook,
      Item: {
        __typename: 'WebsiteGuestbook',
        id: randomUUID(),
        weddingId: site.weddingId,
        owners: site.wedding.owners ?? [],
        guestName,
        message,
        songRequest,
        messageType,
        mediaKey,
        mediaType: str(args.mediaType, 100, 'mediaType'),
        isApproved: false,
        isDeleted: false,
        createdAt: ts,
        updatedAt: ts,
      },
    }));
    return true;
  },

  async submitGalleryUpload(args) {
    const site = await requirePublicSite(args);
    const fileKey = str(args.fileKey, 500, 'fileKey', true)!;
    if (!isGuestKeyFor(fileKey, 'gallery', site.weddingId)) throw new PublicError('Invalid file key');
    const size = Number.isInteger(args.fileSizeBytes) ? args.fileSizeBytes : undefined;
    const ts = now();
    await doc.send(new PutCommand({
      TableName: T.gallery,
      Item: {
        __typename: 'GalleryUpload',
        id: randomUUID(),
        weddingId: site.weddingId,
        owners: site.wedding.owners ?? [],
        uploaderName: str(args.uploaderName, 100, 'uploaderName', true),
        fileKey,
        fileType: str(args.fileType, 100, 'fileType'),
        fileSizeBytes: size,
        caption: str(args.caption, 500, 'caption'),
        uploadedAt: ts,
        isDeleted: false,
        showOnWebsite: true,
        createdAt: ts,
        updatedAt: ts,
      },
    }));
    return true;
  },

  async setSitePassword({ weddingId, password }, event) {
    const sub = (event.identity as any)?.sub as string | undefined;
    if (!sub) throw new PublicError('Unauthorized');
    const wedding = await getItem(T.wedding, String(weddingId));
    if (!wedding || !(wedding.owners || []).includes(sub)) throw new PublicError('Unauthorized');

    if (!password) {
      await doc.send(new DeleteCommand({ TableName: T.sitePassword, Key: { id: wedding.id } }));
      return true;
    }
    if (typeof password !== 'string' || password.length < 4 || password.length > 128) {
      throw new PublicError('Password must be 4-128 characters');
    }
    const ts = now();
    await doc.send(new PutCommand({
      TableName: T.sitePassword,
      Item: {
        __typename: 'SitePassword',
        id: wedding.id,
        weddingId: wedding.id,
        owners: wedding.owners,
        passwordHash: hashPassword(password),
        createdAt: ts,
        updatedAt: ts,
      },
    }));
    return true;
  },
};

export const handler = async (event: AppSyncResolverEvent<any>) => {
  // Amplify Gen 2 function resolvers put fieldName at the top level; classic AppSync uses info.
  const fieldName: string = (event as any).fieldName ?? (event as any).info?.fieldName;
  const op = ops[fieldName];
  if (!op) throw new Error(`Unknown operation ${fieldName}`);
  try {
    return await op(event.arguments || {}, event);
  } catch (err) {
    if (err instanceof PublicError) throw err;
    // Log the error type only, never request arguments, since they can contain PII or passwords.
    console.error(`public-site ${fieldName} failed:`, (err as Error)?.name, (err as Error)?.message);
    throw new Error('Internal error');
  }
};
