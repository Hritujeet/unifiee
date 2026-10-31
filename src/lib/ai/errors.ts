/**
 * AI Error Mapping and normalization.
 * Transforms low-level provider/HTTP errors into safe, human-friendly errors.
 * Never exposes raw internal traces, API keys, or stack information to clients.
 */

export type AiErrorCode =
    | "MISSING_API_KEY"
    | "RATE_LIMIT_EXCEEDED"
    | "QUOTA_EXHAUSTED"
    | "SAFETY_BLOCKED"
    | "TIMEOUT"
    | "NETWORK_ERROR"
    | "VALIDATION_FAILED"
    | "INTERNAL_AI_ERROR";

export interface FriendlyAiError {
    code: AiErrorCode;
    message: string;
    retryAfterSeconds?: number;
    canRetry: boolean;
}

export function isRateLimitOrQuotaError(err: unknown): boolean {
    const errorString = String(err).toLowerCase();
    const messageLower = (err instanceof Error ? err.message : errorString).toLowerCase();
    return (
        messageLower.includes("429") ||
        messageLower.includes("rate limit") ||
        messageLower.includes("rate_limit") ||
        messageLower.includes("quota") ||
        messageLower.includes("resource_exhausted") ||
        messageLower.includes("credit") ||
        messageLower.includes("balance") ||
        messageLower.includes("billing") ||
        messageLower.includes("insufficient_quota") ||
        messageLower.includes("over_quota") ||
        messageLower.includes("too many requests") ||
        errorString.includes("429") ||
        errorString.includes("quota") ||
        errorString.includes("resource_exhausted") ||
        errorString.includes("credit")
    );
}

export function mapAiError(err: unknown): FriendlyAiError {
    const errorString = String(err);
    const messageLower = (err instanceof Error ? err.message : errorString).toLowerCase();

    // 1. Missing API Keys
    if (
        messageLower.includes("api key") &&
        (messageLower.includes("missing") ||
            messageLower.includes("not found") ||
            messageLower.includes("unauthorized") ||
            messageLower.includes("401"))
    ) {
        return {
            code: "MISSING_API_KEY",
            message: "AI service is currently not configured. Please contact support or verify API keys.",
            canRetry: false,
        };
    }

    // 2. Rate Limits & Quotas (429, RESOURCE_EXHAUSTED, Out of Credits)
    if (isRateLimitOrQuotaError(err)) {
        // Attempt to extract retry delay from error if present
        let retryDelay = 15;
        const match = messageLower.match(/retry after (\d+)/i) || messageLower.match(/in (\d+)s/i);
        if (match && match[1]) {
            retryDelay = parseInt(match[1], 10);
        }

        return {
            code: "RATE_LIMIT_EXCEEDED",
            message: `The AI is currently busy handling high demand. Please try again in about ${retryDelay} seconds.`,
            retryAfterSeconds: retryDelay,
            canRetry: true,
        };
    }

    // 3. Safety blocks & content moderation
    if (
        messageLower.includes("safety") ||
        messageLower.includes("blocked") ||
        messageLower.includes("harm_category") ||
        messageLower.includes("inappropriate") ||
        messageLower.includes("content moderation")
    ) {
        return {
            code: "SAFETY_BLOCKED",
            message: "The request could not be processed due to content safety policies. Please adjust your input.",
            canRetry: false,
        };
    }

    // 4. Timeouts & Network
    if (
        messageLower.includes("timeout") ||
        messageLower.includes("etimedout") ||
        messageLower.includes("abort") ||
        messageLower.includes("deadline exceeded")
    ) {
        return {
            code: "TIMEOUT",
            message: "The AI request took too long to respond. Please check your connection and try again.",
            retryAfterSeconds: 3,
            canRetry: true,
        };
    }

    if (
        messageLower.includes("fetch failed") ||
        messageLower.includes("network") ||
        messageLower.includes("econnrefused") ||
        messageLower.includes("enotfound")
    ) {
        return {
            code: "NETWORK_ERROR",
            message: "Unable to reach the AI service. Please check your internet connection.",
            retryAfterSeconds: 5,
            canRetry: true,
        };
    }

    // 5. Schema / Validation failures
    if (messageLower.includes("zod") || messageLower.includes("validation")) {
        return {
            code: "VALIDATION_FAILED",
            message: "The AI output could not be formatted into the required fields. Please try again or rephrase.",
            retryAfterSeconds: 2,
            canRetry: true,
        };
    }

    // Fallback
    return {
        code: "INTERNAL_AI_ERROR",
        message: "An unexpected error occurred while processing your AI request. Please try again in a moment.",
        retryAfterSeconds: 5,
        canRetry: true,
    };
}
