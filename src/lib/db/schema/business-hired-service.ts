import { index, integer, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { business } from "./business"
import { designerServiceTable } from "./designer-service"
import { packagingDesignerTable, pricingModelEnum } from "./packaging-designer"

export const hiredServiceStatusEnum = pgEnum("hired_service_status", [
    "active",
    "in_review",
    "completed",
])

export const businessHiredServiceTable = pgTable("business_hired_services", {
    id: uuid("id").primaryKey().notNull(),
    businessId: uuid("business_id").notNull().references(() => business.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => designerServiceTable.id, { onDelete: "set null" }),
    designerId: uuid("designer_id").references(() => packagingDesignerTable.id, { onDelete: "set null" }),
    serviceTitle: varchar("service_title", { length: 160 }).notNull(),
    designerName: varchar("designer_name", { length: 300 }).notNull(),
    designerEmail: varchar("designer_email", { length: 255 }).notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    pricingModel: pricingModelEnum("pricing_model").notNull(),
    turnaroundDays: integer("turnaround_days").notNull(),
    sampleImage: text("sample_image"),
    notes: text("notes"),
    status: hiredServiceStatusEnum("status").notNull().default("active"),
    hiredAt: timestamp("hired_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()).notNull(),
}, (table) => [
    uniqueIndex("business_hired_services_business_service_active_unique")
        .on(table.businessId, table.serviceId)
        .where(sql`${table.status} = 'active'`),
    index("business_hired_services_business_status_idx").on(table.businessId, table.status),
])
