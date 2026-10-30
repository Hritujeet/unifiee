import {
    boolean,
    index,
    integer,
    json,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core"
import { packagingDesignerTable } from "./packaging-designer"

export const designerServiceStatusEnum = pgEnum("designer_service_status", [
    "draft",
    "published",
    "paused",
])

export const gigCategoryEnum = pgEnum("gig_category", [
    "dieline_structural",
    "label_sticker",
    "logo_brand_identity",
    "3d_mockup_render",
    "full_packaging_set",
])

export const packageTierEnum = pgEnum("package_tier", [
    "basic",
    "standard",
    "premium",
])

export const designerServiceTable = pgTable("designer_services", {
    id: uuid("id").primaryKey().notNull(),
    designerId: uuid("designer_id")
        .notNull()
        .references(() => packagingDesignerTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 200 }),
    category: gigCategoryEnum("category"),
    description: text("description").notNull(),
    tags: json("tags").$type<string[]>().notNull().default([]),
    packagingTypes: json("packaging_types").$type<string[]>().notNull().default([]),
    softwareUsed: json("software_used").$type<string[]>().notNull().default([]),
    faq: json("faq").$type<{ question: string; answer: string }[]>().notNull().default([]),
    sampleImages: json("sample_images").$type<string[]>().notNull().default([]),
    // Legacy columns kept for backward compat with existing actions
    serviceType: varchar("service_type", { length: 100 }).notNull().default("packaging_design"),
    pricingModel: varchar("pricing_model", { length: 40 }).notNull().default("per_project"),
    price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
    turnaroundDays: integer("turnaround_days").notNull().default(7),
    revisionsIncluded: integer("revisions_included").notNull().default(2),
    deliverables: json("deliverables").$type<string[]>().notNull().default([]),
    // Rating aggregates (updated in transaction when review is saved)
    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2 }).notNull().default("0"),
    ratingCount: integer("rating_count").notNull().default(0),
    status: designerServiceStatusEnum("status").notNull().default("draft"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
    uniqueIndex("designer_services_slug_unique").on(table.slug),
    index("designer_services_designer_idx").on(table.designerId),
    index("designer_services_status_idx").on(table.status),
    index("designer_services_category_idx").on(table.category),
])

export const designerServicePackagesTable = pgTable("designer_service_packages", {
    id: uuid("id").primaryKey().notNull(),
    serviceId: uuid("service_id").notNull().references(() => designerServiceTable.id, { onDelete: "cascade" }),
    tier: packageTierEnum("tier").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    deliveryDays: integer("delivery_days").notNull(),
    revisionsIncluded: integer("revisions_included").notNull().default(2),
    deliverables: json("deliverables").$type<string[]>().notNull().default([]),
    sourceFilesIncluded: boolean("source_files_included").notNull().default(false),
    commercialUseIncluded: boolean("commercial_use_included").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
    index("designer_service_packages_service_idx").on(table.serviceId),
    uniqueIndex("designer_service_packages_service_tier_unique").on(table.serviceId, table.tier),
])

export const designerServiceExtrasTable = pgTable("designer_service_extras", {
    id: uuid("id").primaryKey().notNull(),
    serviceId: uuid("service_id").notNull().references(() => designerServiceTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    extraDays: integer("extra_days").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("designer_service_extras_service_idx").on(table.serviceId),
])

export type DesignerService = typeof designerServiceTable.$inferSelect
export type NewDesignerService = typeof designerServiceTable.$inferInsert
export type DesignerServicePackage = typeof designerServicePackagesTable.$inferSelect
export type DesignerServiceExtra = typeof designerServiceExtrasTable.$inferSelect
