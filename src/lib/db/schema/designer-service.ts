import { json, pgEnum, pgTable, timestamp, uuid, varchar, text, numeric, integer } from "drizzle-orm/pg-core"
import { packagingDesignerTable, pricingModelEnum } from "./packaging-designer"

export const designerServiceStatusEnum = pgEnum("designer_service_status", [
    "active",
    "paused",
])

export const designerServiceTable = pgTable("designer_services", {
    id: uuid("id").primaryKey().notNull(),
    designerId: uuid("designer_id")
        .notNull()
        .references(() => packagingDesignerTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description").notNull(),
    serviceType: varchar("service_type", { length: 100 }).notNull(),
    pricingModel: pricingModelEnum("pricing_model").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    turnaroundDays: integer("turnaround_days").notNull(),
    revisionsIncluded: integer("revisions_included").notNull().default(0),
    deliverables: json("deliverables").$type<string[]>().notNull().default([]),
    sampleImages: json("sample_images").$type<string[]>().notNull().default([]),
    status: designerServiceStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
})
