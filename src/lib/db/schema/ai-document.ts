import {
    index,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
    vector,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

/**
 * Shared embedding dimension for Mistral's embedding model (`mistral-embed`).
 * WARNING: Switching embedding models in the future produces vectors of different dimensions
 * or incompatible latent representations, which requires wiping and re-embedding all documents.
 */
export const EMBEDDING_DIM = 1024

export const aiEntityTypeEnum = pgEnum("ai_entity_type", [
    "requirement",
    "offer",
    "gig",
    "designer_profile",
    "help_doc",
])

export const aiVisibilityScopeEnum = pgEnum("ai_visibility_scope", [
    "public",
    "private",
    "role_restricted",
])

export const aiDocumentsTable = pgTable(
    "ai_documents",
    {
        id: uuid("id").primaryKey().notNull(),
        entityType: aiEntityTypeEnum("entity_type").notNull(),
        entityId: text("entity_id").notNull(),
        ownerId: text("owner_id"),
        visibilityScope: aiVisibilityScopeEnum("visibility_scope").notNull().default("public"),
        chunkIndex: integer("chunk_index").notNull().default(0),
        content: text("content").notNull(),
        embedding: vector("embedding", { dimensions: EMBEDDING_DIM }),
        contentHash: varchar("content_hash", { length: 64 }).notNull(),
        embeddedAt: timestamp("embedded_at"),
        metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    },
    (table) => [
        // HNSW vector index for approximate cosine similarity search
        index("ai_documents_embedding_hnsw_idx").using(
            "hnsw",
            table.embedding.op("vector_cosine_ops")
        ),
        // Filter and lookup BTree indexes
        index("ai_documents_entity_type_id_idx").on(table.entityType, table.entityId),
        index("ai_documents_owner_id_idx").on(table.ownerId),
        index("ai_documents_visibility_idx").on(table.visibilityScope),
        index("ai_documents_content_hash_idx").on(table.contentHash),
        // GIN full-text index for hybrid keyword search
        index("ai_documents_content_fts_idx").using(
            "gin",
            sql`to_tsvector('english', ${table.content})`
        ),
    ]
)

export type AiDocument = typeof aiDocumentsTable.$inferSelect
export type NewAiDocument = typeof aiDocumentsTable.$inferInsert
