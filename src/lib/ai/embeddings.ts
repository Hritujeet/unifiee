if (typeof window !== "undefined") {
    throw new Error("This module can only be run on the server.");
}

import crypto from "crypto";
import { embedMany, embed } from "ai";
import { after } from "next/server";
import { db } from "@/lib/db";
import { aiDocumentsTable } from "@/lib/db/schema/ai-document";
import { eq, and } from "drizzle-orm";
import { getEmbeddingModel } from "./models";
import { stripPii } from "./privacy";
import { logAiUsage } from "./logger";
import { throttleMistral, withAiRetry } from "./rate-limit";

export const CHUNK_SIZE_CHARS = 1600; // ~400 tokens
export const CHUNK_OVERLAP_CHARS = 200; // ~50 tokens

/**
 * Computes SHA-256 hash of text for idempotent re-embedding checks.
 */
export function computeContentHash(text: string): string {
    return crypto.createHash("sha256").update(text.trim()).digest("hex");
}

/**
 * Splits long text into ~400-token chunks with ~50-token overlap,
 * prepending the entity title to each chunk for context retention.
 */
export function chunkTextWithTitle(title: string, content: string): string[] {
    const cleanContent = stripPii(content);
    const cleanTitle = stripPii(title);

    if (cleanContent.length <= CHUNK_SIZE_CHARS) {
        return [`${cleanTitle ? `${cleanTitle}\n\n` : ""}${cleanContent}`];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < cleanContent.length) {
        const end = Math.min(start + CHUNK_SIZE_CHARS, cleanContent.length);
        const chunk = cleanContent.slice(start, end).trim();
        if (chunk) {
            chunks.push(`${cleanTitle ? `${cleanTitle} (continued):\n\n` : ""}${chunk}`);
        }
        if (end >= cleanContent.length) break;
        start += CHUNK_SIZE_CHARS - CHUNK_OVERLAP_CHARS;
    }

    return chunks;
}

/**
 * Embed an array of texts using Mistral's embedding model (mistral-embed).
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
    if (!texts.length) return [];

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
        console.warn("[EMBEDDINGS] MISTRAL_API_KEY is not set. Skipping embedding generation.");
        return [];
    }

    const start = Date.now();
    await throttleMistral();

    try {
        const result = await withAiRetry(
            async () =>
                await embedMany({
                    model: getEmbeddingModel(),
                    values: texts,
                }),
            { taskName: "embedTexts" }
        );

        logAiUsage({
            task: "embedMany",
            provider: "mistral",
            modelId: "mistral-embed",
            latencyMs: Date.now() - start,
            tokens: {
                total: result.usage?.tokens ?? 0,
            },
            status: "success",
        });

        return result.embeddings;
    } catch (error) {
        logAiUsage({
            task: "embedMany",
            provider: "mistral",
            modelId: "mistral-embed",
            latencyMs: Date.now() - start,
            status: "error",
            error: String(error),
        });
        console.error("[EMBEDDINGS_ERROR]", error);
        return [];
    }
}

/**
 * Embed a single text query.
 */
export async function embedSingleQuery(query: string): Promise<number[] | null> {
    const clean = stripPii(query);
    if (!clean) return null;

    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) return null;

    const start = Date.now();
    await throttleMistral();

    try {
        const result = await withAiRetry(
            async () =>
                await embed({
                    model: getEmbeddingModel(),
                    value: clean,
                }),
            { taskName: "embedQuery" }
        );

        logAiUsage({
            task: "embedSingleQuery",
            provider: "mistral",
            modelId: "mistral-embed",
            latencyMs: Date.now() - start,
            status: "success",
        });

        return result.embedding;
    } catch (error) {
        console.error("[EMBED_QUERY_ERROR]", error);
        return null;
    }
}

/**
 * Clean templates for entity embedding.
 */
export function buildRequirementTemplate(req: {
    title: string;
    packagingUse: string;
    packagingType: string;
    quantity: string;
    size: string;
    material: string;
    brandingNeeded?: boolean;
    deliveryLocation: string;
    requiredByDate: string;
    rawDescription?: string | null;
}): string {
    return [
        `Requirement: ${stripPii(req.title)}`,
        `Packaging Use: ${req.packagingUse}`,
        `Packaging Type: ${req.packagingType}`,
        `Quantity: ${stripPii(req.quantity)}`,
        `Dimensions & Size: ${stripPii(req.size)}`,
        `Material Specifications: ${stripPii(req.material)}`,
        `Branding Needed: ${req.brandingNeeded ? "Yes, custom branding required" : "No, unbranded/standard"}`,
        `Delivery Destination: ${stripPii(req.deliveryLocation)}`,
        `Timeframe: ${stripPii(req.requiredByDate)}`,
        req.rawDescription ? `Details: ${stripPii(req.rawDescription)}` : "",
    ]
        .filter(Boolean)
        .join("; ");
}

export function buildOfferingTemplate(offer: {
    title: string;
    offeringType: string;
    description: string;
    unitPrice: string | number;
    unitOfMeasure: string;
    minOrderQuantity: number;
    fulfilmentMode: string;
    city?: string | null;
    state?: string | null;
    leadTimeDaysMin: number;
    leadTimeDaysMax: number;
}): string {
    return [
        `Packaging Offering: ${stripPii(offer.title)}`,
        `Category: ${offer.offeringType}`,
        `Description: ${stripPii(offer.description)}`,
        `Price: ₹${offer.unitPrice} per ${offer.unitOfMeasure}`,
        `Minimum Order Quantity: ${offer.minOrderQuantity} ${offer.unitOfMeasure}`,
        `Fulfilment Mode: ${offer.fulfilmentMode.replace(/_/g, " ")}`,
        `Production Lead Time: ${offer.leadTimeDaysMin}-${offer.leadTimeDaysMax} days`,
        offer.city || offer.state ? `Location: ${[offer.city, offer.state].filter(Boolean).join(", ")}` : "",
    ]
        .filter(Boolean)
        .join("; ");
}

export function buildGigTemplate(service: {
    title: string;
    serviceType: string;
    description: string;
    price: string | number;
    pricingModel: string;
    turnaroundDays: number;
    deliverables: string[];
}): string {
    return [
        `Design Service: ${stripPii(service.title)}`,
        `Service Category: ${service.serviceType.replace(/_/g, " ")}`,
        `Pricing: ₹${service.price} (${service.pricingModel.replace(/_/g, " ")})`,
        `Delivery Turnaround: ${service.turnaroundDays} days`,
        `Deliverables: ${service.deliverables.join(", ")}`,
        `Description: ${stripPii(service.description)}`,
    ]
        .filter(Boolean)
        .join("; ");
}

export function buildHelpDocTemplate(doc: {
    title: string;
    category: string;
    content: string;
    targetRole?: string;
}): string {
    return [
        `Help Guide: ${doc.title}`,
        `Category: ${doc.category}`,
        doc.targetRole ? `Applicable Role: ${doc.targetRole}` : "",
        `Content: ${stripPii(doc.content)}`,
    ]
        .filter(Boolean)
        .join("\n\n");
}

export interface SyncEntityParams {
    entityType: "requirement" | "offer" | "gig" | "designer_profile" | "help_doc";
    entityId: string;
    ownerId?: string | null;
    visibilityScope?: "public" | "private" | "role_restricted";
    title: string;
    fullText: string;
    metadata?: Record<string, unknown>;
}

/**
 * Idempotently indexes an entity into `ai_documents`.
 * Checks `contentHash` so unchanged content is never re-embedded.
 */
export async function syncEntityEmbeddings(params: SyncEntityParams): Promise<boolean> {
    const cleanContent = stripPii(params.fullText);
    const hash = computeContentHash(cleanContent);

    // 1. Check existing documents
    const existing = await db
        .select({ id: aiDocumentsTable.id, contentHash: aiDocumentsTable.contentHash })
        .from(aiDocumentsTable)
        .where(
            and(
                eq(aiDocumentsTable.entityType, params.entityType),
                eq(aiDocumentsTable.entityId, params.entityId)
            )
        );

    // If already embedded with the exact same hash, skip completely (idempotent)
    if (existing.length > 0 && existing[0]?.contentHash === hash) {
        return true;
    }

    // 2. Chunk text
    const chunks = chunkTextWithTitle(params.title, cleanContent);
    if (!chunks.length) return false;

    // 3. Generate vectors
    const embeddings = await embedTexts(chunks);
    if (!embeddings.length || embeddings.length !== chunks.length) {
        console.warn(`[EMBED_SYNC] Failed to generate vectors for ${params.entityType}:${params.entityId}`);
        return false;
    }

    // 4. Delete previous chunks if updating
    if (existing.length > 0) {
        await db
            .delete(aiDocumentsTable)
            .where(
                and(
                    eq(aiDocumentsTable.entityType, params.entityType),
                    eq(aiDocumentsTable.entityId, params.entityId)
                )
            );
    }

    // 5. Insert newly embedded chunks
    const rows = chunks.map((chunk, index) => ({
        id: crypto.randomUUID(),
        entityType: params.entityType,
        entityId: params.entityId,
        ownerId: params.ownerId || null,
        visibilityScope: params.visibilityScope || ("public" as const),
        chunkIndex: index,
        content: chunk,
        embedding: embeddings[index],
        contentHash: hash,
        embeddedAt: new Date(),
        metadata: params.metadata || {},
    }));

    await db.insert(aiDocumentsTable).values(rows);
    return true;
}

/**
 * Non-blocking helper to trigger embeddings after database saves.
 * Uses Next.js after() when running inside a request context.
 */
export function triggerEntityEmbedding(params: SyncEntityParams): void {
    try {
        after(async () => {
            try {
                await syncEntityEmbeddings(params);
            } catch (err) {
                console.error("[ASYNC_EMBED_ERROR]", err);
            }
        });
    } catch {
        // If called outside request context (e.g. background job), run floating promise
        syncEntityEmbeddings(params).catch((err) =>
            console.error("[BACKGROUND_EMBED_ERROR]", err)
        );
    }
}
