import { boolean, index, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core"
import { business } from "./business"

export const packagingUseEnum = pgEnum("packaging_use", [
    "coffee",
    "food",
    "dessert",
    "delivery",
    "takeaway",
    "other",
])

export const packagingTypeEnum = pgEnum("packaging_type", [
    "cups",
    "boxes",
    "bags",
    "cutlery",
    "containers",
    "custom",
])

export const businessRequirementStatusEnum = pgEnum("business_requirement_status", [
    "requirement_received",
    "quoted",
    "order_confirmed",
    "in_production",
    "shipped",
    "delivered",
    "cancelled",
])

export const businessRequirementsTable = pgTable("business_requirements", {
    id: uuid("id").primaryKey().notNull(),
    businessId: uuid("business_id")
        .notNull()
        .references(() => business.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    packagingUse: packagingUseEnum("packaging_use").notNull(),
    packagingType: packagingTypeEnum("packaging_type").notNull(),
    quantity: varchar("quantity", { length: 120 }).notNull(),
    size: varchar("size", { length: 255 }).notNull(),
    material: varchar("material", { length: 255 }).notNull(),
    brandingNeeded: boolean("branding_needed").notNull().default(false),
    deliveryLocation: text("delivery_location").notNull(),
    requiredByDate: varchar("required_by_date", { length: 120 }).notNull(),
    rawDescription: text("raw_description"),
    status: businessRequirementStatusEnum("status").notNull().default("requirement_received"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
    index("business_requirements_business_idx").on(table.businessId),
    index("business_requirements_status_idx").on(table.status),
    index("business_requirements_created_idx").on(table.createdAt),
])

export type BusinessRequirement = typeof businessRequirementsTable.$inferSelect
export type NewBusinessRequirement = typeof businessRequirementsTable.$inferInsert
