/**
 * In-memory token-bucket rate limiter.
 *
 * NOTE: state is kept per server instance. On serverless/multi-instance hosting (e.g. Amplify
 * Hosting SSR) each instance has its own buckets, so this is best-effort abuse protection,
 * not a hard guarantee. For stronger limits use AWS WAF rate-based rules or a shared store
 * such as DynamoDB or Redis.
 */
interface Bucket { tokens: number; updated: number }
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, capacity: number, refillPerMinute: number): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: capacity, updated: now };
  b.tokens = Math.min(capacity, b.tokens + ((now - b.updated) / 60000) * refillPerMinute);
  b.updated = now;
  const allowed = b.tokens >= 1;
  if (allowed) b.tokens -= 1;
  buckets.set(key, b);
  if (buckets.size > 10000) {
    buckets.forEach((v, k) => { if (now - v.updated > 10 * 60000) buckets.delete(k); });
  }
  return allowed;
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  return (fwd?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown').trim();
}
