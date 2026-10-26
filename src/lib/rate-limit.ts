import { jsonError } from "@/lib/api";

/**
 * Fixed-window limiter kept in process memory. Good for a single Node server;
 * on multi-instance or serverless hosting, swap the Map for a shared store (Redis / Upstash).
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Returns a 429 response when `key` exceeded `limit` hits in `windowMs`, else null. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Response | null {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  b.count += 1;
  if (b.count <= limit) return null;
  const res = jsonError("Too many attempts. Please wait a minute and try again.", 429);
  res.headers.set("Retry-After", String(Math.ceil((b.resetAt - now) / 1000)));
  return res;
}

/** Convenience: limit by route name + client IP. */
export function limitByIp(
  req: Request,
  route: string,
  limit: number,
  windowMs: number,
) {
  return rateLimit(`${route}:${clientIp(req)}`, limit, windowMs);
}
