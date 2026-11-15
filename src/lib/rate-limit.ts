import type { NextRequest } from "next/server";
import { ApiError } from "./api";

type Bucket = { count: number; resetAt: number };

const globalForLimiter = globalThis as typeof globalThis & { __clinovaBuckets?: Map<string, Bucket> };
const buckets = (globalForLimiter.__clinovaBuckets ??= new Map<string, Bucket>());

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/**
 * Tiny in-memory fixed-window rate limiter for sensitive endpoints
 * (login, register, contact, booking). Swap for Redis when running multiple instances.
 */
export function rateLimit(req: NextRequest, name: string, limit: number, windowMs: number, extraKey = "") {
  const key = `${name}:${clientIp(req)}:${extraKey}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    const retry = Math.ceil((bucket.resetAt - now) / 1000);
    throw new ApiError(429, `Too many attempts. Please try again in ${retry > 60 ? Math.ceil(retry / 60) + " minutes" : retry + " seconds"}.`);
  }
}
