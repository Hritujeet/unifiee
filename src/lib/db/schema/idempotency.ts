import { index, jsonb, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core"

export const idempotencyRecordsTable = pgTable("idempotency_records", {
    id: uuid("id").primaryKey().notNull(),
    scope: varchar("scope", { length: 120 }).notNull(),
    key: varchar("key", { length: 128 }).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    response: jsonb("response").$type<{
        success: boolean
        error?: string
        data?: unknown
    }>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
}, (table) => [
    uniqueIndex("idempotency_records_scope_key_user_unique").on(table.scope, table.key, table.userId),
    index("idempotency_records_expires_idx").on(table.expiresAt),
])
