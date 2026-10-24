if (typeof window !== "undefined") {
    throw new Error("This module can only be run on the server.");
}

import { db } from "@/lib/db";
import { aiDocumentsTable, type AiDocument } from "@/lib/db/schema/ai-document";
import { cosineDistance, sql, and, eq, or, SQL } from "drizzle-orm";
import { embedSingleQuery } from "./embeddings";

export interface SessionContext {
    userId: string;
    role: "business" | "manufacturer" | "designer" | "none";
    businessId?: string | null;
    manufacturerId?: string | null;
    designerId?: string | null;
}

export interface RetrievalFilters {
    entityType?: "requirement" | "offer" | "gig" | "designer_profile" | "help_doc";
    ownerId?: string;
    limit?: number;
    minSimilarity?: number; // e.g. 0.35 - 0.5
}

export interface SearchResultItem {
    id: string;
    entityType: string;
    entityId: string;
    ownerId: string | null;
    content: string;
    metadata: Record<string, unknown>;
    similarityScore: number;
    combinedRankScore?: number;
}

/**
 * Builds the authorization WHERE condition in SQL so that users
 * NEVER see documents they do not have permissions to access in the normal UI.
 */
export function buildAuthWhereClause(session: SessionContext): SQL {
    const ownerIds = [
        session.userId,
        session.businessId,
        session.manufacturerId,
        session.designerId,
    ].filter((id): id is string => Boolean(id));

    // A document is accessible if:
    // 1. It is public, OR
    // 2. The user is the owner, OR
    // 3. It is role-restricted and intended for the user's role
    const ownerCondition = ownerIds.length > 0
        ? sql`${aiDocumentsTable.ownerId} IN ${ownerIds}`
        : sql`FALSE`;

    return sql`(
        ${aiDocumentsTable.visibilityScope} = 'public'
        OR (${aiDocumentsTable.visibilityScope} = 'private' AND ${ownerCondition})
        OR (${aiDocumentsTable.visibilityScope} = 'role_restricted' AND (${aiDocumentsTable.metadata}->>'allowedRole' = ${session.role} OR ${ownerCondition}))
    )`;
}

/**
 * Reciprocal Rank Fusion (RRF) to merge vector and keyword search results.
 * Score = SUM(1 / (k + rank)) with k = 60.
 */
function reciprocalRankFusion(
    vectorResults: SearchResultItem[],
    textResults: SearchResultItem[],
    limit: number = 5
): SearchResultItem[] {
    const k = 60;
    const scores = new Map<string, { item: SearchResultItem; score: number }>();

    vectorResults.forEach((item, index) => {
        const rank = index + 1;
        const current = scores.get(item.id) || { item, score: 0 };
        current.score += 1 / (k + rank);
        scores.set(item.id, current);
    });

    textResults.forEach((item, index) => {
        const rank = index + 1;
        const current = scores.get(item.id) || { item, score: 0 };
        current.score += 1 / (k + rank);
        scores.set(item.id, current);
    });

    const merged = Array.from(scores.values())
        .map(({ item, score }) => ({
            ...item,
            combinedRankScore: score,
        }))
        .sort((a, b) => (b.combinedRankScore ?? 0) - (a.combinedRankScore ?? 0));

    return merged.slice(0, limit);
}

/**
 * Vector similarity search using Drizzle's native cosineDistance.
 */
export async function searchVector({
    queryVector,
    session,
    filters,
    limit = 5,
}: {
    queryVector: number[];
    session: SessionContext;
    filters?: RetrievalFilters;
    limit?: number;
}): Promise<SearchResultItem[]> {
    const minSim = filters?.minSimilarity ?? 0.35;
    const authClause = buildAuthWhereClause(session);

    const conditions: SQL[] = [
        authClause,
        sql`${aiDocumentsTable.embedding} IS NOT NULL`,
    ];

    if (filters?.entityType) {
        conditions.push(eq(aiDocumentsTable.entityType, filters.entityType));
    }
    if (filters?.ownerId) {
        conditions.push(eq(aiDocumentsTable.ownerId, filters.ownerId));
    }

    // Distance in pgvector: 0 = identical, 2 = opposite
    // Similarity = 1 - distance
    const similarityExpr = sql<number>`1 - (${cosineDistance(aiDocumentsTable.embedding, queryVector)})`;

    const rows = await db
        .select({
            id: aiDocumentsTable.id,
            entityType: aiDocumentsTable.entityType,
            entityId: aiDocumentsTable.entityId,
            ownerId: aiDocumentsTable.ownerId,
            content: aiDocumentsTable.content,
            metadata: aiDocumentsTable.metadata,
            similarity: similarityExpr,
        })
        .from(aiDocumentsTable)
        .where(and(...conditions))
        .orderBy(cosineDistance(aiDocumentsTable.embedding, queryVector))
        .limit(limit * 2);

    return rows
        .filter((r) => r.similarity >= minSim)
        .slice(0, limit)
        .map((r) => ({
            id: r.id,
            entityType: r.entityType,
            entityId: r.entityId,
            ownerId: r.ownerId,
            content: r.content,
            metadata: r.metadata,
            similarityScore: r.similarity,
        }));
}

/**
 * Full-text keyword search using PostgreSQL GIN index.
 */
export async function searchFullText({
    query,
    session,
    filters,
    limit = 5,
}: {
    query: string;
    session: SessionContext;
    filters?: RetrievalFilters;
    limit?: number;
}): Promise<SearchResultItem[]> {
    const authClause = buildAuthWhereClause(session);

    const conditions: SQL[] = [
        authClause,
        sql`to_tsvector('english', ${aiDocumentsTable.content}) @@ plainto_tsquery('english', ${query})`,
    ];

    if (filters?.entityType) {
        conditions.push(eq(aiDocumentsTable.entityType, filters.entityType));
    }
    if (filters?.ownerId) {
        conditions.push(eq(aiDocumentsTable.ownerId, filters.ownerId));
    }

    const rankExpr = sql<number>`ts_rank(to_tsvector('english', ${aiDocumentsTable.content}), plainto_tsquery('english', ${query}))`;

    const rows = await db
        .select({
            id: aiDocumentsTable.id,
            entityType: aiDocumentsTable.entityType,
            entityId: aiDocumentsTable.entityId,
            ownerId: aiDocumentsTable.ownerId,
            content: aiDocumentsTable.content,
            metadata: aiDocumentsTable.metadata,
            rank: rankExpr,
        })
        .from(aiDocumentsTable)
        .where(and(...conditions))
        .orderBy(sql`${rankExpr} DESC`)
        .limit(limit);

    return rows.map((r) => ({
        id: r.id,
        entityType: r.entityType,
        entityId: r.entityId,
        ownerId: r.ownerId,
        content: r.content,
        metadata: r.metadata,
        similarityScore: Math.min(1, r.rank),
    }));
}

/**
 * Hybrid retrieval combining Vector similarity + GIN Full-Text Search via RRF.
 * Top 3-5 results returned with strict authorization.
 */
export async function searchHybrid({
    query,
    session,
    filters,
    limit = 5,
}: {
    query: string;
    session: SessionContext;
    filters?: RetrievalFilters;
    limit?: number;
}): Promise<SearchResultItem[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // Parallel execution: embed query for vector search, while preparing FTS
    const [queryVector, textResults] = await Promise.all([
        embedSingleQuery(trimmed),
        searchFullText({ query: trimmed, session, filters, limit }).catch((err) => {
            console.warn("[FTS_SEARCH_FAILED]", err);
            return [];
        }),
    ]);

    let vectorResults: SearchResultItem[] = [];
    if (queryVector) {
        vectorResults = await searchVector({
            queryVector,
            session,
            filters,
            limit,
        }).catch((err) => {
            console.warn("[VECTOR_SEARCH_FAILED]", err);
            return [];
        });
    }

    // Merge vector and keyword results with Reciprocal Rank Fusion
    if (vectorResults.length > 0 && textResults.length > 0) {
        return reciprocalRankFusion(vectorResults, textResults, limit);
    }

    // If one provider or method returned nothing, fallback to the other
    return (vectorResults.length > 0 ? vectorResults : textResults).slice(0, limit);
}
