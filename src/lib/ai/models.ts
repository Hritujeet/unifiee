import { createMistral } from "@ai-sdk/mistral";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModelV4, EmbeddingModelV4 } from "@ai-sdk/provider";
import { isRateLimitOrQuotaError } from "./errors";

export const MODEL_IDS = {
    MISTRAL_CHAT: "mistral-small-latest" as const,
    MISTRAL_EMBED: "mistral-embed" as const,
    GEMINI_FLASH: (process.env.GEMINI_MODEL || "gemini-3.5-flash-lite") as string,
} as const;

export const EMBEDDING_DIMENSION = 1024;

// Providers instantiated with robust environment variable fallback
export const mistralProvider = createMistral({
    apiKey: process.env.MISTRAL_API_KEY,
});

export const googleProvider = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
});

export type AiTask =
    | "assistant_chat"
    | "navigation_help"
    | "suggested_replies"
    | "short_rewrite"
    | "field_suggestions"
    | "intent_classification"
    | "query_rewriting"
    | "conversation_title"
    | "gig_creation_assist"
    | "profile_bio_writer"
    | "delivery_message_helper"
    | "requirement_builder"
    | "brief_summarization"
    | "rag_synthesis"
    | "multi_step_reasoning";

export interface ModelRoute {
    model: LanguageModelV4;
    provider: "mistral" | "google";
    modelId: string;
    task: AiTask;
    temperature: number;
    maxOutputTokens: number;
}

const TASK_CONFIGS: Record<
    AiTask,
    {
        provider: "mistral" | "google";
        temperature: number;
        maxOutputTokens: number;
    }
> = {
    // Interactive & Assistant tasks (Gemini 3.5 Flash-Lite)
    assistant_chat: { provider: "google", temperature: 0.3, maxOutputTokens: 2048 },
    navigation_help: { provider: "google", temperature: 0.1, maxOutputTokens: 512 },
    suggested_replies: { provider: "google", temperature: 0.5, maxOutputTokens: 1024 },
    short_rewrite: { provider: "google", temperature: 0.6, maxOutputTokens: 1024 },
    field_suggestions: { provider: "google", temperature: 0.4, maxOutputTokens: 1024 },
    intent_classification: { provider: "google", temperature: 0.0, maxOutputTokens: 512 },
    query_rewriting: { provider: "google", temperature: 0.1, maxOutputTokens: 512 },
    conversation_title: { provider: "google", temperature: 0.3, maxOutputTokens: 256 },
    gig_creation_assist: { provider: "google", temperature: 0.5, maxOutputTokens: 2048 },
    profile_bio_writer: { provider: "google", temperature: 0.7, maxOutputTokens: 2048 },
    delivery_message_helper: { provider: "google", temperature: 0.4, maxOutputTokens: 1536 },

    // Heavy reasoning & extraction tasks
    requirement_builder: { provider: "google", temperature: 0.1, maxOutputTokens: 2048 },
    brief_summarization: { provider: "google", temperature: 0.2, maxOutputTokens: 2048 },
    rag_synthesis: { provider: "google", temperature: 0.2, maxOutputTokens: 2048 },
    multi_step_reasoning: { provider: "google", temperature: 0.1, maxOutputTokens: 2048 },
};

export function getModel(task: AiTask): ModelRoute {
    const config = TASK_CONFIGS[task] || { provider: "google", temperature: 0.3, maxOutputTokens: 512 };

    if (config.provider === "google") {
        return {
            model: googleProvider(MODEL_IDS.GEMINI_FLASH),
            provider: "google",
            modelId: MODEL_IDS.GEMINI_FLASH,
            task,
            temperature: config.temperature,
            maxOutputTokens: config.maxOutputTokens,
        };
    }

    return {
        model: mistralProvider(MODEL_IDS.MISTRAL_CHAT),
        provider: "mistral",
        modelId: MODEL_IDS.MISTRAL_CHAT,
        task,
        temperature: config.temperature,
        maxOutputTokens: config.maxOutputTokens,
    };
}

/**
 * Escalation routing: for heavy schema-following reasoning.
 */
export function getEscalationModel(task: AiTask): ModelRoute {
    const config = TASK_CONFIGS[task] || { temperature: 0.1, maxOutputTokens: 1024 };
    return {
        model: googleProvider(MODEL_IDS.GEMINI_FLASH),
        provider: "google",
        modelId: MODEL_IDS.GEMINI_FLASH,
        task,
        temperature: Math.min(config.temperature, 0.2),
        maxOutputTokens: config.maxOutputTokens,
    };
}

/**
 * Fallback routing when a provider encounters 429 quota exhaustion.
 */
export function getFallbackModel(task: AiTask): ModelRoute | null {
    const primary = getModel(task);

    // If primary was Mistral, fall back to Gemini Flash
    if (primary.provider === "mistral") {
        return {
            model: googleProvider(MODEL_IDS.GEMINI_FLASH),
            provider: "google",
            modelId: MODEL_IDS.GEMINI_FLASH,
            task,
            temperature: primary.temperature,
            maxOutputTokens: primary.maxOutputTokens,
        };
    }

    // If primary was Google, fall back to Mistral if configured
    if (primary.provider === "google" && process.env.MISTRAL_API_KEY) {
        return {
            model: mistralProvider(MODEL_IDS.MISTRAL_CHAT),
            provider: "mistral",
            modelId: MODEL_IDS.MISTRAL_CHAT,
            task,
            temperature: primary.temperature,
            maxOutputTokens: primary.maxOutputTokens,
        };
    }

    return null;
}

/**
 * Executes an AI generation/stream operation with automatic fallback on 429 quota exhaustion.
 */
export async function executeWithFallback<T>(
    task: AiTask,
    execute: (route: ModelRoute) => Promise<T>
): Promise<T> {
    const primary = getModel(task);
    const start = Date.now();

    try {
        return await execute(primary);
    } catch (error: unknown) {
        const isQuotaOrRateLimit = isRateLimitOrQuotaError(error);
        const fallback = getFallbackModel(task);

        if (isQuotaOrRateLimit && fallback) {
            console.warn(
                `[AI_FALLBACK] Primary model ${primary.modelId} (${primary.provider}) hit rate limit/quota/credits. Failing over to ${fallback.modelId} (${fallback.provider})...`
            );
            try {
                return await execute(fallback);
            } catch (fallbackErr) {
                console.warn(`[AI_FALLBACK_FAILED] Fallback model ${fallback.modelId} also encountered an error:`, fallbackErr);
            }
        }

        if (error && typeof error === "object") {
            (error as Record<string, unknown>).isRateLimit = isQuotaOrRateLimit;
        }
        throw error;
    }
}

/**
 * Returns Mistral's embedding model with 1024 dimensions.
 */
export function getEmbeddingModel(): EmbeddingModelV4 {
    return mistralProvider.embedding(MODEL_IDS.MISTRAL_EMBED);
}

