/**
 * S3 key layout for wedding files. Pure TypeScript with no runtime deps, so the Lambdas, the
 * Next.js client (src/lib/storage/files.ts) and tools/migrations can all import it.
 *
 *   weddings/{weddingId}/public/{kind}/{timestamp}-{sanitizedName}   shown on public sites
 *   weddings/{weddingId}/private/{kind}/{timestamp}-{sanitizedName}  owners only (contracts: + readers)
 *
 * Clients never get direct S3 access to these keys; every read and write is presigned by the
 * storage-access Lambda after it checks Wedding.owners / Wedding.readers.
 */

export const PUBLIC_KINDS = ['hero', 'logo', 'story', 'registry', 'gallery', 'guestbook'] as const;
export const PRIVATE_KINDS = ['contracts', 'chat', 'moodboard', 'exports'] as const;

export type PublicKind = (typeof PUBLIC_KINDS)[number];
export type PrivateKind = (typeof PRIVATE_KINDS)[number];
export type FileKind = PublicKind | PrivateKind;
export type Visibility = 'public' | 'private';

/** Kinds guests may upload to from a public site (always image-only). */
export const GUEST_UPLOAD_KINDS = ['gallery', 'guestbook'] as const;
export type GuestUploadKind = (typeof GUEST_UPLOAD_KINDS)[number];

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const MB = 1024 * 1024;

export interface KindRule {
  visibility: Visibility;
  contentTypes: string[];
  /** Max object size in bytes, enforced by the presigned POST policy (content-length-range). */
  maxBytes: number;
}

export const KIND_RULES: Record<FileKind, KindRule> = {
  hero: { visibility: 'public', contentTypes: IMAGE_TYPES, maxBytes: 15 * MB },
  logo: { visibility: 'public', contentTypes: [...IMAGE_TYPES, 'image/svg+xml'], maxBytes: 5 * MB },
  story: { visibility: 'public', contentTypes: IMAGE_TYPES, maxBytes: 15 * MB },
  registry: { visibility: 'public', contentTypes: IMAGE_TYPES, maxBytes: 10 * MB },
  gallery: { visibility: 'public', contentTypes: [...IMAGE_TYPES, ...VIDEO_TYPES], maxBytes: 200 * MB },
  guestbook: { visibility: 'public', contentTypes: [...IMAGE_TYPES, ...VIDEO_TYPES], maxBytes: 100 * MB },
  contracts: {
    visibility: 'private',
    contentTypes: ['application/pdf', 'application/msword', DOCX, 'image/jpeg', 'image/png'],
    maxBytes: 25 * MB,
  },
  chat: { visibility: 'private', contentTypes: [...IMAGE_TYPES, DOCX, XLSX], maxBytes: 10 * MB },
  moodboard: { visibility: 'private', contentTypes: IMAGE_TYPES, maxBytes: 15 * MB },
  exports: { visibility: 'private', contentTypes: ['application/pdf', 'application/zip', 'text/csv'], maxBytes: 100 * MB },
};

/** Guest uploads are stricter than owner uploads: images only, 15 MB. */
export const GUEST_RULE = { contentTypes: IMAGE_TYPES, maxBytes: 15 * MB };

export const isFileKind = (k: unknown): k is FileKind => typeof k === 'string' && k in KIND_RULES;
export const visibilityOf = (kind: FileKind): Visibility => KIND_RULES[kind].visibility;

/** Map a file extension to a content type for when the browser reports none (e.g. .docx on some OSes). */
export function guessContentType(fileName: string): string | undefined {
  const ext = fileName.toLowerCase().split('.').pop() || '';
  return ({
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
    heic: 'image/heic', heif: 'image/heif', svg: 'image/svg+xml', mp4: 'video/mp4', mov: 'video/quicktime',
    pdf: 'application/pdf', doc: 'application/msword', docx: DOCX, xlsx: XLSX, zip: 'application/zip', csv: 'text/csv',
  } as Record<string, string>)[ext];
}

/** Keep letters, digits, dot, dash, underscore. Collapse the rest, cap the length, keep the extension. */
export function sanitizeFileName(name: string): string {
  const base = (name || 'file').split(/[\\/]/).pop() || 'file';
  let safe = base.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/_+/g, '_').replace(/^[._]+/, '');
  if (!safe) safe = 'file';
  if (safe.length > 100) {
    const dot = safe.lastIndexOf('.');
    const ext = dot > 0 && safe.length - dot <= 10 ? safe.slice(dot) : '';
    safe = safe.slice(0, 100 - ext.length) + ext;
  }
  return safe;
}

const ID_RE = /^[A-Za-z0-9_-]{1,100}$/;

export function buildKey(weddingId: string, kind: FileKind, fileName: string, now = Date.now()): string {
  if (!ID_RE.test(weddingId)) throw new Error('Invalid weddingId');
  return `weddings/${weddingId}/${visibilityOf(kind)}/${kind}/${now}-${sanitizeFileName(fileName)}`;
}

export interface ParsedKey {
  weddingId: string;
  visibility: Visibility;
  kind: FileKind;
  fileName: string;
}

/** Strictly parse a new-layout key. Returns null for anything else (legacy keys, traversal, bad kinds). */
export function parseKey(key: unknown): ParsedKey | null {
  if (typeof key !== 'string' || key.length > 1024 || key.includes('..') || key.includes('\\')) return null;
  const parts = key.split('/');
  if (parts.length !== 5 || parts[0] !== 'weddings') return null;
  const [, weddingId, visibility, kind, fileName] = parts;
  if (!ID_RE.test(weddingId) || !fileName || !isFileKind(kind)) return null;
  if (visibility !== 'public' && visibility !== 'private') return null;
  if (KIND_RULES[kind].visibility !== visibility) return null;
  return { weddingId, visibility, kind, fileName };
}

/**
 * Pre-migration key prefixes. Until tools/migrations/move-storage-keys.ts has run and the
 * follow-up deploy sets ALLOW_LEGACY_KEYS=false, getFileUrl still presigns these with the same
 * audience the old storage rules had: LEGACY_PUBLIC_PREFIXES for anyone, LEGACY_AUTH_PREFIXES for
 * any signed-in user. They're never writable.
 */
export const LEGACY_PUBLIC_PREFIXES = ['gallery/', 'story/', 'logo/', 'guestbook/', 'registry/'];
export const LEGACY_AUTH_PREFIXES = ['assets/', 'chat/'];
export const LEGACY_PREFIXES = [...LEGACY_PUBLIC_PREFIXES, ...LEGACY_AUTH_PREFIXES];

export const isLegacyKey = (key: string) =>
  !key.includes('..') && LEGACY_PREFIXES.some((p) => key.startsWith(p) && key.length > p.length);
