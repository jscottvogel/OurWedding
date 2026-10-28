'use client';

import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../../../amplify/data/resource';
import {
  GUEST_RULE,
  KIND_RULES,
  guessContentType,
  visibilityOf,
  type FileKind,
  type GuestUploadKind,
} from '../../../amplify/functions/shared/storage-keys';

export type { FileKind, GuestUploadKind, Visibility } from '../../../amplify/functions/shared/storage-keys';

/**
 * The ONLY way browser code touches wedding files. Do not import `aws-amplify/storage`
 * elsewhere: Cognito identities have no direct S3 access to weddings/*. Every call here goes to
 * the storage-access Lambda (via AppSync), which checks Wedding.owners/readers and presigns.
 *
 *   uploadFile({ weddingId, kind, file })   owners; returns the new S3 key to store on the record
 *   uploadGuestFile({ slug, kind, file })   public-site guests (gallery, guestbook), images only
 *   getFileUrl(key) / getFileUrls(keys)     presigned GET, ~1 h; batched and cached
 *   deleteFile(key)                         owners
 */

const client = generateClient<Schema>();

type AuthMode = 'userPool' | 'apiKey';
let authModePromise: Promise<AuthMode> | null = null;
let authModeAt = 0;

/** Signed-in callers use the user pool (so private files resolve); everyone else the API key. */
function authMode(): Promise<AuthMode> {
  if (!authModePromise || Date.now() - authModeAt > 60_000) {
    authModeAt = Date.now();
    authModePromise = fetchAuthSession()
      .then((s) => (s.tokens?.idToken ? 'userPool' : 'apiKey') as AuthMode)
      .catch(() => 'apiKey' as AuthMode);
  }
  return authModePromise;
}

/** Call after sign-in / sign-out so the next request picks the right auth mode. */
export function resetStorageAuthMode() {
  authModePromise = null;
  urlCache.clear();
}

function firstError(errors?: readonly { message: string }[] | null): Error | null {
  return errors?.length ? new Error(errors[0].message) : null;
}

// ------------------------------------------------------------------ uploads

export interface UploadOptions {
  file: Blob & { name?: string };
  /** Defaults to file.name. Only used for the final path segment (sanitized server-side). */
  fileName?: string;
  /** Defaults to file.type, then a guess from the extension. */
  contentType?: string;
  onProgress?: (fraction: number) => void;
}

interface PresignedUpload {
  key: string;
  url: string;
  fields: string | Record<string, string>;
  contentType: string;
  maxBytes: number;
}

function resolveMeta(opts: UploadOptions) {
  const fileName = opts.fileName || opts.file.name || 'file';
  const contentType = opts.contentType || opts.file.type || guessContentType(fileName) || 'application/octet-stream';
  return { fileName, contentType };
}

function checkFile(file: Blob, contentType: string, rule: { contentTypes: string[]; maxBytes: number }) {
  if (!rule.contentTypes.includes(contentType.toLowerCase())) throw new Error('This file type is not supported here.');
  if (file.size > rule.maxBytes) throw new Error(`File is too large (max ${Math.round(rule.maxBytes / 1024 / 1024)} MB).`);
  if (file.size === 0) throw new Error('File is empty.');
}

/** POST the file to S3 with the presigned policy. XHR so we can report progress. */
function postToS3(p: PresignedUpload, file: Blob, onProgress?: (f: number) => void): Promise<void> {
  const fields: Record<string, string> = typeof p.fields === 'string' ? JSON.parse(p.fields) : p.fields;
  const form = new FormData();
  Object.entries(fields).forEach(([k, v]) => form.append(k, v));
  form.append('file', file); // must be the last field
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', p.url);
    if (onProgress) xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Upload failed (network error)'));
    xhr.send(form);
  });
}

/** Owner upload. Returns the S3 key (weddings/{weddingId}/{visibility}/{kind}/...). */
export async function uploadFile(opts: UploadOptions & { weddingId: string; kind: FileKind }): Promise<string> {
  const { fileName, contentType } = resolveMeta(opts);
  checkFile(opts.file, contentType, KIND_RULES[opts.kind]);
  const { data, errors } = await client.mutations.createUploadUrl(
    { weddingId: opts.weddingId, visibility: visibilityOf(opts.kind), kind: opts.kind, fileName, contentType },
    { authMode: 'userPool' },
  );
  const err = firstError(errors);
  if (err || !data) throw err || new Error('Could not prepare upload');
  await postToS3(data as PresignedUpload, opts.file, opts.onProgress);
  return data.key;
}

/** Guest upload from a public site. Goes through the rate-limited /api/website/upload-url route. */
export async function uploadGuestFile(opts: UploadOptions & { slug: string; kind: GuestUploadKind }): Promise<string> {
  const { fileName, contentType } = resolveMeta(opts);
  checkFile(opts.file, contentType, GUEST_RULE);
  const res = await fetch('/api/website/upload-url', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug: opts.slug, kind: opts.kind, fileName, contentType }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.key) throw new Error(json?.error || 'Could not prepare upload');
  await postToS3(json as PresignedUpload, opts.file, opts.onProgress);
  return json.key as string;
}

// ------------------------------------------------------------------ reads

/** Presigned URLs live 1 h server-side; reuse them for 50 min. */
const URL_TTL_MS = 50 * 60 * 1000;
const urlCache = new Map<string, { url: string | null; at: number }>();

let pending: Map<string, { resolve: (u: string | null) => void; reject: (e: unknown) => void }[]> | null = null;

async function flush(batch: NonNullable<typeof pending>) {
  const keys = Array.from(batch.keys());
  try {
    const mode = await authMode();
    for (let i = 0; i < keys.length; i += 100) {
      const chunk = keys.slice(i, i + 100);
      const { data, errors } = await client.queries.getFileUrls({ keys: chunk }, { authMode: mode });
      const err = firstError(errors);
      if (err) throw err;
      const found = new Map((data || []).filter(Boolean).map((r) => [r!.key, r!.url ?? null]));
      for (const k of chunk) {
        const url = found.get(k) ?? null;
        urlCache.set(k, { url, at: Date.now() });
        batch.get(k)!.forEach((w) => w.resolve(url));
      }
    }
  } catch (e) {
    keys.forEach((k) => {
      if (!urlCache.has(k)) batch.get(k)!.forEach((w) => w.reject(e));
    });
  }
}

/**
 * Presigned GET URL for a key, or null if it doesn't exist / the caller can't read it.
 * Calls made in the same tick (e.g. a gallery of <StorageImage>s) are coalesced into one
 * getFileUrls request.
 */
export function getFileUrl(key: string): Promise<string | null> {
  if (!key) return Promise.resolve(null);
  if (/^(https?:|data:|blob:)/.test(key)) return Promise.resolve(key); // already a URL
  const hit = urlCache.get(key);
  if (hit && Date.now() - hit.at < URL_TTL_MS) return Promise.resolve(hit.url);
  return new Promise((resolve, reject) => {
    if (!pending) {
      pending = new Map();
      const batch = pending;
      setTimeout(() => {
        pending = null;
        void flush(batch);
      }, 0);
    }
    const waiters = pending.get(key) || [];
    waiters.push({ resolve, reject });
    pending.set(key, waiters);
  });
}

/** Resolve many keys at once. Unreadable keys are omitted from the result. */
export async function getFileUrls(keys: (string | null | undefined)[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(keys.filter((k): k is string => !!k)));
  const urls = await Promise.all(unique.map((k) => getFileUrl(k).catch(() => null)));
  const out: Record<string, string> = {};
  unique.forEach((k, i) => { if (urls[i]) out[k] = urls[i]!; });
  return out;
}

// ------------------------------------------------------------------ delete

export async function deleteFile(key: string): Promise<void> {
  const { errors } = await client.mutations.deleteFile({ key }, { authMode: 'userPool' });
  const err = firstError(errors);
  if (err) throw err;
  urlCache.delete(key);
}

/** Display name for a key: the original file name without the `{timestamp}-` prefix. */
export function fileDisplayName(key: string): string {
  const last = key.split('/').pop() || key;
  return last.replace(/^\d{10,}-/, '');
}
