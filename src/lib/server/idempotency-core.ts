import crypto from "crypto"

export type StoredResponse = {
    success: boolean
    error?: string
    data?: unknown
}

export type BeginResult =
    | { kind: "new"; id: string }
    | { kind: "replay"; response: StoredResponse }
    | { kind: "conflict" }
    | { kind: "in_progress" }

function stableStringify(value: unknown): string {
    if (value === null || typeof value !== "object") return JSON.stringify(value)
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`
}

export function hashIdempotencyPayload(payload: unknown): string {
    return crypto.createHash("sha256").update(stableStringify(payload)).digest("hex")
}

export function idempotencyResponse(
    result: BeginResult,
): { handled: true; response: StoredResponse } | { handled: false; id: string } {
    if (result.kind === "new") return { handled: false, id: result.id }
    if (result.kind === "replay") return { handled: true, response: result.response }
    if (result.kind === "conflict") {
        return { handled: true, response: { success: false, error: "This idempotency key was already used with different data." } }
    }
    return { handled: true, response: { success: false, error: "This request is already being processed. Please wait and try again." } }
}
