import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"
import { businessOrdersTable } from "./business-order"
import { user } from "./auth-schema"

export const orderProofStatusEnum = pgEnum("order_proof_status", ["pending", "approved", "changes_requested"])
export const orderIssueStatusEnum = pgEnum("order_issue_status", ["open", "resolved"])
export const orderActorRoleEnum = pgEnum("order_actor_role", ["business", "manufacturer", "designer", "system"])

export const orderArtworkProofsTable = pgTable("order_artwork_proofs", {
    id: uuid("id").primaryKey().notNull(),
    orderId: uuid("order_id").notNull().references(() => businessOrdersTable.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    fileUrl: text("file_url").notNull(),
    status: orderProofStatusEnum("status").notNull().default("pending"),
    feedback: text("feedback"),
    uploadedBy: text("uploaded_by").notNull().references(() => user.id, { onDelete: "restrict" }),
    decidedBy: text("decided_by").references(() => user.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
    index("order_artwork_proofs_order_idx").on(table.orderId),
    uniqueIndex("order_artwork_proofs_order_version_unique").on(table.orderId, table.version),
])

export const orderIssuesTable = pgTable("order_issues", {
    id: uuid("id").primaryKey().notNull(),
    orderId: uuid("order_id").notNull().references(() => businessOrdersTable.id, { onDelete: "cascade" }),
    raisedBy: text("raised_by").notNull().references(() => user.id, { onDelete: "restrict" }),
    description: text("description").notNull(),
    vendorResponse: text("vendor_response"),
    status: orderIssueStatusEnum("status").notNull().default("open"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
}, (table) => [
    index("order_issues_order_idx").on(table.orderId),
    index("order_issues_raised_by_idx").on(table.raisedBy),
])

export type OrderArtworkProof = typeof orderArtworkProofsTable.$inferSelect
export type OrderIssue = typeof orderIssuesTable.$inferSelect
