type Bucket = { tokens: number; ts: number };
const buckets = new Map<string, Bucket>();

// Simple per-key limiter. cap=burst, refill tokens/sec.
export function rateLimit(key: string, cap = 20, refillPerSec = 0.5): boolean {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: cap, ts: now };
  b.tokens = Math.min(cap, b.tokens + ((now - b.ts) / 1000) * refillPerSec);
  b.ts = now;
  if (b.tokens < 1) { buckets.set(key, b); return false; }
  b.tokens -= 1; buckets.set(key, b);
  return true;
}
