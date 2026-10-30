import {
    check,
    index,
    integer,
    json,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { business } from "./business"
import { designerServiceTable } from "./designer-service"
import { packagingDesignerTable } from "./packaging-designer"
import { businessOrdersTable } from "./business-order"
import { user } from "./auth-schema"

export const hiredServiceStatusEnum = pgEnum("hired_service_status", [
    "requested",
    "active",
    "delivered",
    "revision_requested",
    "completed",
    "declined",
    "cancelled",
    "expired",
    "closed",
])

export type HiredServiceStatus = (typeof hiredServiceStatusEnum.enumValues)[number]

export const businessHiredServiceTable = pgTable("business_hired_services", {
    id: uuid("id").primaryKey().notNull(),
    businessId: uuid("business_id").notNull().references(() => business.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => designerServiceTable.id, { onDelete: "set null" }),
    designerId: uuid("designer_id").references(() => packagingDesignerTable.id, { onDelete: "set null" }),
    // Snapshots at order time
    serviceTitle: varchar("service_title", { length: 160 }).notNull(),
    designerName: varchar("designer_name", { length: 300 }).notNull(),
    designerEmail: varchar("designer_email", { length: 255 }).notNull(),
    packageTier: varchar("package_tier", { length: 20 }),
    packageName: varchar("package_name", { length: 100 }),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    deliveryDays: integer("delivery_days").notNull().default(7),
    revisionsIncluded: integer("revisions_included").notNull().default(2),
    revisionsUsed: integer("revisions_used").notNull().default(0),
    extras: json("extras").$type<{ name: string; price: number; extraDays: number }[]>().default([]),
    brief: json("brief").$type<{
        packagingType?: string
        dimensions?: string
        material?: string
        brandName?: string
        tagline?: string
        colours?: string
        fonts?: string
        targetAudience?: string
        referenceLinks?: string
        dieline?: string
        formats?: string
        deadline?: string
        notes?: string
    }>(),
    dueAt: timestamp("due_at"),
    linkedOrderId: uuid("linked_order_id").references(() => businessOrdersTable.id, { onDelete: "set null" }),
    // Keep legacy columns for old rows
    sampleImage: text("sample_image"),
    notes: text("notes"),
    cancelReason: text("cancel_reason"),
    // Legacy columns kept for backward compat
    pricingModel: varchar("pricing_model", { length: 40 }).notNull().default("per_project"),
    turnaroundDays: integer("turnaround_days").notNull().default(7),
    status: hiredServiceStatusEnum("status").notNull().default("requested"),
    hiredAt: timestamp("hired_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
    index("business_hired_services_business_status_idx").on(table.businessId, table.status),
    index("business_hired_services_service_idx").on(table.serviceId),
    index("business_hired_services_designer_idx").on(table.designerId),
    index("business_hired_services_due_at_idx").on(table.dueAt),
])

export const hiredServiceEventsTable = pgTable("hired_service_events", {
    id: uuid("id").primaryKey().notNull(),
    orderId: uuid("order_id").notNull().references(() => businessHiredServiceTable.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 40 }).notNull(),
    actorUserId: text("actor_user_id"),
    actorRole: varchar("actor_role", { length: 20 }),
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("hired_service_events_order_idx").on(table.orderId),
    index("hired_service_events_created_idx").on(table.createdAt),
])

export const hiredServiceMessagesTable = pgTable("hired_service_messages", {
    id: uuid("id").primaryKey().notNull(),
    orderId: uuid("order_id").notNull().references(() => businessHiredServiceTable.id, { onDelete: "cascade" }),
    senderId: text("sender_id").references(() => user.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    attachments: json("attachments").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    readAt: timestamp("read_at"),
}, (table) => [
    index("hired_service_messages_order_idx").on(table.orderId),
    index("hired_service_messages_sender_idx").on(table.senderId),
    index("hired_service_messages_created_idx").on(table.createdAt),
])

export const hiredServiceDeliveriesTable = pgTable("hired_service_deliveries", {
    id: uuid("id").primaryKey().notNull(),
    orderId: uuid("order_id").notNull().references(() => businessHiredServiceTable.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull().default(1),
    files: json("files").$type<string[]>().notNull().default([]),
    previewUrl: text("preview_url"),
    designerNote: text("designer_note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("hired_service_deliveries_order_idx").on(table.orderId),
])

export const designerReviewsTable = pgTable("designer_reviews", {
    id: uuid("id").primaryKey().notNull(),
    orderId: uuid("order_id").notNull().unique(),
    serviceId: uuid("service_id").references(() => designerServiceTable.id, { onDelete: "set null" }),
    designerId: uuid("designer_id").references(() => packagingDesignerTable.id, { onDelete: "set null" }),
    businessId: uuid("business_id").references(() => business.id, { onDelete: "set null" }),
    rating: integer("rating").notNull(),
    communicationRating: integer("communication_rating").notNull(),
    qualityRating: integer("quality_rating").notNull(),
    asDescribedRating: integer("as_described_rating").notNull(),
    text: text("text"),
    designerReply: text("designer_reply"),
    designerRepliedAt: timestamp("designer_replied_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
    index("designer_reviews_service_idx").on(table.serviceId),
    index("designer_reviews_designer_idx").on(table.designerId),
    index("designer_reviews_business_idx").on(table.businessId),
    check("designer_reviews_rating_check", sql`${table.rating} BETWEEN 1 AND 5`),
    check("designer_reviews_comm_rating_check", sql`${table.communicationRating} BETWEEN 1 AND 5`),
    check("designer_reviews_quality_rating_check", sql`${table.qualityRating} BETWEEN 1 AND 5`),
    check("designer_reviews_as_described_check", sql`${table.asDescribedRating} BETWEEN 1 AND 5`),
])

export const businessSavedServicesTable = pgTable("business_saved_services", {
    id: uuid("id").primaryKey().notNull(),
    businessId: uuid("business_id").notNull().references(() => business.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").notNull().references(() => designerServiceTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("business_saved_services_business_idx").on(table.businessId),
    index("business_saved_services_service_idx").on(table.serviceId),
])

export type BusinessHiredService = typeof businessHiredServiceTable.$inferSelect
export type HiredServiceEvent = typeof hiredServiceEventsTable.$inferSelect
export type HiredServiceMessage = typeof hiredServiceMessagesTable.$inferSelect
export type HiredServiceDelivery = typeof hiredServiceDeliveriesTable.$inferSelect
export type DesignerReview = typeof designerReviewsTable.$inferSelect
