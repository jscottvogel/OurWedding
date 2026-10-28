import type { AppSyncResolverEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { timingSafeEqual } from 'crypto';
import {
  GUEST_RULE,
  GUEST_UPLOAD_KINDS,
  KIND_RULES,
  LEGACY_AUTH_PREFIXES,
  LEGACY_PUBLIC_PREFIXES,
  buildKey,
  guessContentType,
  isFileKind,
  isLegacyKey,
  parseKey,
  type FileKind,
} from '../shared/storage-keys';

/**
 * storage-access: the only way clients read or write wedding files.
 *
 *   createUploadUrl(weddingId, visibility, kind, fileName, contentType)  owners only
 *   getFileUrl(key) / getFileUrls(keys)    public keys: anyone (API key ok); private: owners,
 *                                          plus Wedding.readers for `contracts`
 *   deleteFile(key)                        owners only
 *   createGuestUploadUrl(internalKey, slug, kind, fileName, contentType)
 *                                          public site guests, via the rate-limited Next route
 *                                          /api/website/upload-url (internalKey = INTERNAL_API_SECRET)
 *
 * Uploads use a presigned POST (5 min) so the policy can pin Content-Type AND enforce a
 * content-length-range; a presigned PUT can't limit size.
 */

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

const BUCKET = process.env.STORAGE_BUCKET_NAME!;
const T = { wedding: process.env.TABLE_WEDDING!, config: process.env.TABLE_WEBSITE_CONFIG! };
const ALLOW_LEGACY_KEYS = process.env.ALLOW_LEGACY_KEYS !== 'false';

const UPLOAD_EXPIRES = 5 * 60;
const GET_EXPIRES = 60 * 60;
const MAX_BATCH = 200;

type Item = Record<string, any>;
class PublicError extends Error {}

function callerSub(event: AppSyncResolverEvent<any>): string | undefined {
  const sub = (event.identity as { sub?: string } | null | undefined)?.sub;
  return typeof sub === 'string' && sub ? sub : undefined;
}

function requireInternalKey(key: unknown) {
  const expected = process.env.INTERNAL_API_SECRET || '';
  const a = Buffer.from(expected);
  const b = Buffer.from(typeof key === 'string' ? key : '');
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) throw new PublicError('Unauthorized');
}

async function getItem(table: string, id: string): Promise<Item | undefined> {
  const res = await doc.send(new GetCommand({ TableName: table, Key: { id } }));
  return res.Item;
}

async function queryFirst(table: string, index: string, key: string, value: string): Promise<Item | undefined> {
  const res = await doc.send(new QueryCommand({
    TableName: table,
    IndexName: index,
    KeyConditionExpression: '#k = :v',
    ExpressionAttributeNames: { '#k': key },
    ExpressionAttributeValues: { ':v': value },
    Limit: 1,
  }));
  return res.Items?.[0];
}

/** Per-invocation Wedding cache so a batch of keys from one wedding costs one GetItem. */
function weddingLoader() {
  const cache = new Map<string, Promise<Item | undefined>>();
  return (id: string) => {
    if (!cache.has(id)) cache.set(id, getItem(T.wedding, id));
    return cache.get(id)!;
  };
}

async function requireOwner(weddingId: string, sub: string | undefined, load = weddingLoader()) {
  if (!sub) throw new PublicError('Unauthorized');
  const wedding = await load(weddingId);
  if (!wedding || !(wedding.owners || []).includes(sub)) throw new PublicError('Unauthorized');
  return wedding;
}

function validateUpload(kind: unknown, fileName: unknown, contentType: unknown, guest: boolean) {
  if (!isFileKind(kind)) throw new PublicError('Invalid kind');
  if (guest && !(GUEST_UPLOAD_KINDS as readonly string[]).includes(kind)) throw new PublicError('Invalid kind');
  if (typeof fileName !== 'string' || !fileName.trim() || fileName.length > 255) throw new PublicError('Invalid file name');
  const ct = (typeof contentType === 'string' && contentType.trim() ? contentType : guessContentType(fileName) || '')
    .toLowerCase().split(';')[0].trim();
  const rule = guest ? GUEST_RULE : KIND_RULES[kind];
  if (!rule.contentTypes.includes(ct)) throw new PublicError(`File type not allowed for ${kind}`);
  return { kind: kind as FileKind, fileName: fileName.trim(), contentType: ct, maxBytes: rule.maxBytes };
}

async function presignUpload(key: string, contentType: string, maxBytes: number) {
  const { url, fields } = await createPresignedPost(s3, {
    Bucket: BUCKET,
    Key: key,
    Conditions: [['content-length-range', 1, maxBytes], ['eq', '$Content-Type', contentType]],
    Fields: { 'Content-Type': contentType },
    Expires: UPLOAD_EXPIRES,
  });
  return {
    key,
    url,
    fields: JSON.stringify(fields),
    contentType,
    maxBytes,
    expiresAt: new Date(Date.now() + UPLOAD_EXPIRES * 1000).toISOString(),
  };
}

const presignGet = (key: string) =>
  getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: GET_EXPIRES });

/** May this caller read `key`? sub is undefined for API-key (public) callers. */
async function canRead(key: string, sub: string | undefined, load: ReturnType<typeof weddingLoader>): Promise<boolean> {
  const parsed = parseKey(key);
  if (parsed) {
    if (parsed.visibility === 'public') return true;
    if (!sub) return false;
    const wedding = await load(parsed.weddingId);
    if (!wedding) return false;
    if ((wedding.owners || []).includes(sub)) return true;
    return parsed.kind === 'contracts' && (wedding.readers || []).includes(sub);
  }
  // Pre-migration keys keep the audience the old storage rules gave them (read-only).
  if (ALLOW_LEGACY_KEYS && isLegacyKey(key)) {
    if (LEGACY_PUBLIC_PREFIXES.some((p) => key.startsWith(p))) return true;
    if (LEGACY_AUTH_PREFIXES.some((p) => key.startsWith(p))) return !!sub;
  }
  return false;
}

const ops: Record<string, (args: any, event: AppSyncResolverEvent<any>) => Promise<unknown>> = {
  async createUploadUrl({ weddingId, visibility, kind, fileName, contentType }, event) {
    const v = validateUpload(kind, fileName, contentType, false);
    if (visibility && visibility !== KIND_RULES[v.kind].visibility) throw new PublicError('Visibility does not match kind');
    await requireOwner(String(weddingId || ''), callerSub(event));
    return presignUpload(buildKey(String(weddingId), v.kind, v.fileName), v.contentType, v.maxBytes);
  },

  async getFileUrl({ key }, event) {
    if (!(await canRead(String(key || ''), callerSub(event), weddingLoader()))) throw new PublicError('Not authorized');
    return presignGet(key);
  },

  async getFileUrls({ keys }, event) {
    if (!Array.isArray(keys)) throw new PublicError('keys must be a list');
    const unique = Array.from(new Set(keys.filter((k): k is string => typeof k === 'string' && !!k)));
    if (unique.length > MAX_BATCH) throw new PublicError(`At most ${MAX_BATCH} keys per call`);
    const sub = callerSub(event);
    const load = weddingLoader();
    return Promise.all(unique.map(async (key) => ({
      key,
      // Unauthorized or malformed keys come back with url = null so one bad key doesn't fail a gallery.
      url: (await canRead(key, sub, load)) ? await presignGet(key) : null,
    })));
  },

  async deleteFile({ key }, event) {
    const parsed = parseKey(key);
    if (!parsed) throw new PublicError('Invalid key');
    await requireOwner(parsed.weddingId, callerSub(event));
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  },

  async createGuestUploadUrl({ internalKey, slug, kind, fileName, contentType }) {
    requireInternalKey(internalKey);
    const v = validateUpload(kind, fileName, contentType, true);
    const s = typeof slug === 'string' ? decodeURIComponent(slug).trim().toLowerCase() : '';
    if (!s || s.length > 100) throw new PublicError('Site not found');

    // Same resolution order as public-site resolveSite(): WebsiteConfig.subdomain, then Wedding.slug.
    let config = await queryFirst(T.config, 'bySubdomain', 'subdomain', s);
    let weddingId = config?.weddingId as string | undefined;
    if (!config) {
      const wedding = await queryFirst(T.wedding, 'bySlug', 'slug', s);
      if (wedding) {
        weddingId = wedding.id;
        config = await queryFirst(T.config, 'byWeddingId', 'weddingId', wedding.id);
      }
    }
    if (!weddingId || !config) throw new PublicError('Site not found');
    // Only live sites accept guest uploads. There is no separate "uploads enabled" flag in the schema.
    if (!['PUBLISHED', 'POST_WEDDING'].includes(config.publishStatus)) throw new PublicError('Uploads are not open for this site');

    return presignUpload(buildKey(weddingId, v.kind, v.fileName), v.contentType, v.maxBytes);
  },
};

export const handler = async (event: AppSyncResolverEvent<any>) => {
  const op = ops[event.info.fieldName];
  if (!op) throw new Error(`Unknown operation ${event.info.fieldName}`);
  try {
    return await op(event.arguments || {}, event);
  } catch (err) {
    if (err instanceof PublicError) throw err;
    console.error(`storage-access ${event.info.fieldName} failed:`, (err as Error)?.name, (err as Error)?.message);
    throw new Error('Internal error');
  }
};
