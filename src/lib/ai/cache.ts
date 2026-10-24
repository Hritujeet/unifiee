import crypto from "crypto";

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

// Periodic cleanup every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryCache) {
        if (now > entry.expiresAt) {
            memoryCache.delete(key);
        }
    }
}, 5 * 60 * 1000);

export function getAiCache<T>(key: string): T | null {
    const entry = memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
        memoryCache.delete(key);
        return null;
    }

    return entry.value as T;
}

export function setAiCache<T>(key: string, value: T, ttlSeconds: number = 600): void {
    memoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
    });
}

/**
 * Creates a deterministic cache key from arbitrary inputs.
 */
export function hashCacheKey(prefix: string, payload: unknown): string {
    const serialized = typeof payload === "string" ? payload : JSON.stringify(payload);
    const hash = crypto.createHash("sha256").update(serialized).digest("hex").slice(0, 24);
    return `${prefix}:${hash}`;
}
