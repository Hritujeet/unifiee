/**
 * Data privacy and PII sanitization utilities.
 * Strips emails, phone numbers, payment information, and sensitive identifiers
 * before text is sent to LLM providers or embedded into vectors.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// Match Indian and international 10-14 digit phone numbers with optional country code (+91, etc.)
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
// Indian GSTIN pattern (15 chars: 2 digits state + 10 chars PAN + 1 entity num + 'Z' + 1 checksum)
const GSTIN_REGEX = /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/gi;
// Credit/Debit card numbers (13-19 digits)
const CARD_REGEX = /\b(?:\d{4}[-\s]?){3}\d{1,4}\b/g;

export function stripPii(input: string | null | undefined): string {
    if (!input) return "";

    return input
        .replace(EMAIL_REGEX, "[REDACTED_EMAIL]")
        .replace(PHONE_REGEX, "[REDACTED_PHONE]")
        .replace(GSTIN_REGEX, "[REDACTED_GSTIN]")
        .replace(CARD_REGEX, "[REDACTED_CARD]")
        .trim();
}

/**
 * Strips PII from object values recursively.
 */
export function sanitizeObjectForAi<T extends Record<string, unknown>>(obj: T): T {
    const clean: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        // Skip explicitly private fields
        if (/password|secret|token|bank|account|ifsc|phone|email/i.test(key)) {
            clean[key] = "[REDACTED]";
            continue;
        }

        if (typeof value === "string") {
            clean[key] = stripPii(value);
        } else if (value && typeof value === "object" && !Array.isArray(value)) {
            clean[key] = sanitizeObjectForAi(value as Record<string, unknown>);
        } else if (Array.isArray(value)) {
            clean[key] = value.map((item) =>
                typeof item === "string" ? stripPii(item) : item
            );
        } else {
            clean[key] = value;
        }
    }

    return clean as T;
}
