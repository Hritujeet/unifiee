/**
 * AI telemetry and usage logging.
 * Logs provider, model ID, task name, latency, and token metrics.
 * CRITICAL RULE: NEVER logs prompt or response body text to preserve privacy.
 */

export interface AiLogPayload {
    task: string;
    provider: "mistral" | "google";
    modelId: string;
    latencyMs: number;
    tokens?: {
        prompt?: number;
        completion?: number;
        total?: number;
    };
    status: "success" | "fallback" | "error";
    error?: string;
    userId?: string;
}

export function logAiUsage(payload: AiLogPayload): void {
    const timestamp = new Date().toISOString();
    const tokenInfo = payload.tokens
        ? `[Tokens: ${payload.tokens.total ?? (payload.tokens.prompt ?? 0) + (payload.tokens.completion ?? 0)} (prompt: ${payload.tokens.prompt ?? 0}, completion: ${payload.tokens.completion ?? 0})]`
        : "";

    console.log(
        `[AI_TELEMETRY] ${timestamp} | Task: ${payload.task} | Provider: ${payload.provider} | Model: ${payload.modelId} | Latency: ${payload.latencyMs}ms ${tokenInfo} | Status: ${payload.status}${
            payload.error ? ` | Error: ${payload.error}` : ""
        }${payload.userId ? ` | User: ${payload.userId}` : ""}`
    );
}
