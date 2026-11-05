// Sliding-window limiter. In-memory, so it is per server instance; use Redis/Upstash for multi-instance production.
const hits = new Map<string, number[]>();
export function rateLimit(key: string, max: number, windowMs: number, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs);
  if (recent.length >= max) { hits.set(key, recent); return false; }
  recent.push(now); hits.set(key, recent); return true;
}
