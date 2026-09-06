import { db } from "@/lib/db";

/**
 * Lightweight in-memory rate limiting. In-memory buckets are per-process,
 * which is sufficient for a single-node personal CMS.
 */

const buckets = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfterMs: windowMs - (now - hits[0]) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterMs: 0 };
}

/** Best-effort client IP from the forwarded headers. Honors the app's setter. */
export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for") ?? headers.get("x-real-ip");
  if (fwd) return fwd.split(",")[0].trim();
  return "local";
}

export async function failedLoginCount(ip: string, minutes = 15): Promise<number> {
  const since = new Date(Date.now() - minutes * 60 * 1000);
  return db.loginAttempt.count({
    where: { ip, success: false, createdAt: { gte: since } },
  });
}

export async function recordLoginAttempt(ip: string, success: boolean) {
  await db.loginAttempt.create({ data: { ip, success } });
}