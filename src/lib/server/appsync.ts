import outputs from '@/../amplify_outputs.json';

/**
 * Minimal AppSync client for server-side code (route handlers and Edge middleware). It uses
 * `fetch` only, so it's Edge-compatible. It authenticates with the public API key. The
 * privileged public-site mutations also require INTERNAL_API_SECRET, which only exists
 * server-side.
 */
const dataConfig = (outputs as any).data as { url?: string; api_key?: string } | undefined;

export class AppSyncError extends Error {}

export async function appsync<T = any>(query: string, variables: Record<string, unknown>): Promise<T> {
  if (!dataConfig?.url || !dataConfig.api_key) throw new AppSyncError('AppSync is not configured');
  const res = await fetch(dataConfig.url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': dataConfig.api_key },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => null)) as { data?: T; errors?: { message: string }[] } | null;
  if (!res.ok || !json || json.errors?.length) {
    throw new AppSyncError(json?.errors?.[0]?.message || `AppSync request failed (${res.status})`);
  }
  return json.data as T;
}

export function internalKey(): string {
  const key = process.env.INTERNAL_API_SECRET;
  if (!key) throw new AppSyncError('INTERNAL_API_SECRET is not set');
  return key;
}

/** AWSJSON values come back as JSON strings. */
export function parseAwsJson<T = any>(v: unknown): T | null {
  if (v == null) return null;
  if (typeof v === 'string') {
    try { return JSON.parse(v) as T; } catch { return null; }
  }
  return v as T;
}

export interface SiteAccess {
  weddingId: string;
  slug: string;
  passwordProtected: boolean;
  publishStatus: string;
}

const SITE_ACCESS_FIELDS = 'weddingId slug passwordProtected publishStatus';

export async function getSiteAccess(args: { slug?: string; host?: string }): Promise<SiteAccess | null> {
  const data = await appsync<{ getSiteAccess: SiteAccess | null }>(
    `query GetSiteAccess($slug: String, $host: String) { getSiteAccess(slug: $slug, host: $host) { ${SITE_ACCESS_FIELDS} } }`,
    args,
  );
  return data.getSiteAccess;
}

export async function verifySitePassword(slug: string, password: string): Promise<SiteAccess | null> {
  const data = await appsync<{ verifySitePassword: SiteAccess | null }>(
    `mutation Verify($k: String!, $slug: String!, $password: String!) {
       verifySitePassword(internalKey: $k, slug: $slug, password: $password) { ${SITE_ACCESS_FIELDS} } }`,
    { k: internalKey(), slug, password },
  );
  return data.verifySitePassword;
}
