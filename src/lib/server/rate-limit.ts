import { headers } from "next/headers";

interface RateLimitConfig {
  keyPrefix: string;
  limit: number;
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetInSeconds: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding rate limit store
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic pruning of expired entries every 2 minutes
const PRUNE_INTERVAL_MS = 2 * 60 * 1000;
let lastPrune = Date.now();

function pruneExpired(now: number) {
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [key, record] of rateLimitStore) {
    if (now >= record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Extracts a dependable client IP address from standard proxy headers.
 */
export function getClientIpFromHeaders(reqHeaders: Headers): string {
  const vercel = reqHeaders.get("x-vercel-forwarded-for");
  if (vercel) {
    const ip = vercel.split(",")[0]?.trim();
    if (ip) return ip;
  }

  const cloudflare = reqHeaders.get("cf-connecting-ip");
  if (cloudflare) {
    const ip = cloudflare.trim();
    if (ip) return ip;
  }

  const realIp = reqHeaders.get("x-real-ip");
  if (realIp) {
    const ip = realIp.trim();
    if (ip) return ip;
  }

  const forwarded = reqHeaders.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }

  return "127.0.0.1";
}

/**
 * Check and consume a rate limit token for a given action and identifier.
 *
 * @param config RateLimitConfig specifying prefix, max requests, and window in seconds.
 * @param identifier Custom identifier (e.g. userId or specific client ID). If omitted, falls back to client IP.
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  identifier?: string
): Promise<RateLimitResult> {
  const now = Date.now();
  pruneExpired(now);

  let id = identifier;
  if (!id) {
    try {
      const reqHeaders = await headers();
      id = getClientIpFromHeaders(reqHeaders);
    } catch {
      id = "unknown-client";
    }
  }

  const key = `${config.keyPrefix}:${id}`;
  const windowMs = config.windowSeconds * 1000;
  const existing = rateLimitStore.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      success: true,
      remaining: config.limit - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= config.limit) {
    const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      success: false,
      remaining: 0,
      resetInSeconds,
    };
  }

  existing.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    success: true,
    remaining: config.limit - existing.count,
    resetInSeconds,
  };
}
