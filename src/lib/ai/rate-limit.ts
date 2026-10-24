/**
 * Free-tier AI Rate Limiter, Daily Budget Tracker, and Concurrency Queue.
 * Protects against 429 / quota errors by:
 * 1. Queueing bursts to stay under Mistral's ~1 RPS concurrency limit.
 * 2. Enforcing a per-user rate limit (15 requests/minute).
 * 3. Enforcing a per-user daily budget (50 requests/day).
 * 4. Exponential backoff with jitter on 429 errors.
 */

interface UserBudgetRecord {
    minuteCount: number;
    minuteResetAt: number;
    dailyCount: number;
    dailyResetAt: number;
}

const userBudgetStore = new Map<string, UserBudgetRecord>();

const USER_MINUTE_LIMIT = 15;
const USER_DAILY_LIMIT = 50;

// Periodic cleanup every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [userId, record] of userBudgetStore) {
        if (now > record.dailyResetAt) {
            userBudgetStore.delete(userId);
        }
    }
}, 5 * 60 * 1000);

export interface BudgetCheckResult {
    allowed: boolean;
    reason?: string;
    resetInSeconds?: number;
    remainingDaily: number;
}

/**
 * Checks and decrements a user's per-minute and daily AI request budget.
 */
export function checkAiBudget(userId: string): BudgetCheckResult {
    const now = Date.now();
    let record = userBudgetStore.get(userId);

    if (!record) {
        const nextMidnight = new Date();
        nextMidnight.setHours(24, 0, 0, 0);

        record = {
            minuteCount: 0,
            minuteResetAt: now + 60 * 1000,
            dailyCount: 0,
            dailyResetAt: nextMidnight.getTime(),
        };
        userBudgetStore.set(userId, record);
    }

    // Reset minute window if expired
    if (now > record.minuteResetAt) {
        record.minuteCount = 0;
        record.minuteResetAt = now + 60 * 1000;
    }

    // Reset daily window if expired
    if (now > record.dailyResetAt) {
        const nextMidnight = new Date();
        nextMidnight.setHours(24, 0, 0, 0);
        record.dailyCount = 0;
        record.dailyResetAt = nextMidnight.getTime();
    }

    // Check minute limit
    if (record.minuteCount >= USER_MINUTE_LIMIT) {
        const resetIn = Math.ceil((record.minuteResetAt - now) / 1000);
        return {
            allowed: false,
            reason: `You've made too many AI requests this minute. Please wait ${resetIn}s.`,
            resetInSeconds: resetIn,
            remainingDaily: Math.max(0, USER_DAILY_LIMIT - record.dailyCount),
        };
    }

    // Check daily limit
    if (record.dailyCount >= USER_DAILY_LIMIT) {
        const resetHours = Math.ceil((record.dailyResetAt - now) / (1000 * 60 * 60));
        return {
            allowed: false,
            reason: `You've reached your daily free AI budget (${USER_DAILY_LIMIT} requests). Resets in ${resetHours}h.`,
            resetInSeconds: Math.ceil((record.dailyResetAt - now) / 1000),
            remainingDaily: 0,
        };
    }

    // Increment usage
    record.minuteCount += 1;
    record.dailyCount += 1;

    return {
        allowed: true,
        remainingDaily: USER_DAILY_LIMIT - record.dailyCount,
    };
}

/**
 * Global queue for Mistral requests to enforce ~1 RPS concurrency ceiling on free tier.
 */
let lastMistralCallTime = 0;
const MISTRAL_MIN_INTERVAL_MS = 1100; // 1.1s spacing to guarantee < 1 req/sec

export async function throttleMistral(): Promise<void> {
    const now = Date.now();
    const elapsed = now - lastMistralCallTime;
    if (elapsed < MISTRAL_MIN_INTERVAL_MS) {
        const waitTime = MISTRAL_MIN_INTERVAL_MS - elapsed;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
    lastMistralCallTime = Date.now();
}

/**
 * Execute an AI function with exponential backoff and jitter on 429 quota errors.
 */
export async function withAiRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        initialDelayMs?: number;
        taskName?: string;
    } = {}
): Promise<T> {
    const maxRetries = options.maxRetries ?? 2;
    let delay = options.initialDelayMs ?? 1500;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: unknown) {
            const errStr = String(error).toLowerCase();
            const isRateLimit =
                errStr.includes("429") ||
                errStr.includes("rate limit") ||
                errStr.includes("resource_exhausted") ||
                errStr.includes("quota");

            if (isRateLimit && attempt < maxRetries) {
                // Add jitter (±20%)
                const jitter = delay * (0.8 + Math.random() * 0.4);
                console.warn(
                    `[AI_RETRY] 429 encountered for ${options.taskName || "task"}. Retrying attempt ${attempt + 1}/${maxRetries} after ${Math.round(jitter)}ms...`
                );
                await new Promise((res) => setTimeout(res, jitter));
                delay *= 2; // Exponential backoff
                continue;
            }

            throw error;
        }
    }

    throw new Error("Maximum retry attempts exceeded.");
}
