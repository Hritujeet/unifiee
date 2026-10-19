import {
    index,
    integer,
    jsonb,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core"
import { manufacturerTable } from "./manufacturer"
import { business } from "./business"
import { catalogProductsTable, offeringsTable } from "./offering"

export const vendorInquiryStatusEnum = pgEnum("vendor_inquiry_status", [
    "new",
    "in_discussion",
    "quote_sent",
    "declined",
    "closed",
])

export const vendorInquiriesTable = pgTable("vendor_inquiries", {
    id: uuid("id").primaryKey().notNull(),
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => manufacturerTable.id, { onDelete: "restrict" }),
    businessId: uuid("business_id")
        .notNull()
        .references(() => business.id, { onDelete: "restrict" }),
    catalogProductId: uuid("catalog_product_id").references(() => catalogProductsTable.id, { onDelete: "set null" }),
    offeringId: uuid("offering_id").references(() => offeringsTable.id, { onDelete: "set null" }),
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),
    quantityRequested: integer("quantity_requested"),
    targetUnitPrice: numeric("target_unit_price", { precision: 12, scale: 4 }),
    specifications: jsonb("specifications").$type<Record<string, unknown>>().default({}),
    status: vendorInquiryStatusEnum("status").notNull().default("new"),
    respondedAt: timestamp("responded_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    index("vendor_inquiries_vendor_status_idx").on(table.vendorId, table.status),
    index("vendor_inquiries_business_idx").on(table.businessId),
    index("vendor_inquiries_catalog_product_idx").on(table.catalogProductId),
    index("vendor_inquiries_created_idx").on(table.createdAt),
])

export type VendorInquiry = typeof vendorInquiriesTable.$inferSelect
export type NewVendorInquiry = typeof vendorInquiriesTable.$inferInsert
