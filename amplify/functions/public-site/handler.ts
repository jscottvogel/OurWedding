import type { AppSyncResolverEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'crypto';

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
};

const ROOT_DOMAIN = (process.env.ROOT_DOMAIN || 'weddingsteward.com').toLowerCase();

type Item = Record<string, any>;

// ---------------------------------------------------------------- helpers

class PublicError extends Error {}

const now = () => new Date().toISOString();

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
    return {
      success: true,
      attending,
      guestName: guest.firstName,
      confirmationEmail: previousEmail || email || null,
      coupleNames: `${wedding.coupleName1} & ${wedding.coupleName2}`,
      siteSlug: site.slug,
    };
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
    if (mediaKey && !mediaKey.startsWith('guestbook/')) throw new PublicError('Invalid media key');
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
    if (!fileKey.startsWith('gallery/') || fileKey.includes('..')) throw new PublicError('Invalid file key');
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
  const op = ops[event.info.fieldName];
  if (!op) throw new Error(`Unknown operation ${event.info.fieldName}`);
  try {
    return await op(event.arguments || {}, event);
  } catch (err) {
    if (err instanceof PublicError) throw err;
    // Log the error type only, never request arguments, since they can contain PII or passwords.
    console.error(`public-site ${event.info.fieldName} failed:`, (err as Error)?.name, (err as Error)?.message);
    throw new Error('Internal error');
  }
};
