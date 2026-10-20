import {
    boolean,
    check,
    index,
    integer,
    jsonb,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { manufacturerTable } from "./manufacturer"
import { businessRequirementsTable } from "./business-requirement"
import {
    offeringPaymentTermsEnum,
    offeringShippingTermsEnum,
} from "./offering"

export const vendorQuotationStatusEnum = pgEnum("vendor_quotation_status", [
    "pending",
    "accepted",
    "rejected",
    "withdrawn",
    "expired",
])

export const vendorQuotationsTable = pgTable("vendor_quotations", {
    id: uuid("id").primaryKey().notNull(),
    quoteNumber: varchar("quote_number", { length: 36 }).notNull(),
    requirementId: uuid("requirement_id")
        .notNull()
        .references(() => businessRequirementsTable.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => manufacturerTable.id, { onDelete: "cascade" }),
    status: vendorQuotationStatusEnum("status").notNull().default("pending"),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    totalPrice: numeric("total_price", { precision: 14, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    quantity: integer("quantity").notNull(),
    productionLeadTimeDays: integer("production_lead_time_days").notNull(),
    estimatedDeliveryDays: integer("estimated_delivery_days").notNull(),
    sampleAvailable: boolean("sample_available").notNull().default(false),
    samplePrice: numeric("sample_price", { precision: 12, scale: 2 }),
    shippingTerms: offeringShippingTermsEnum("shipping_terms").notNull(),
    paymentTerms: offeringPaymentTermsEnum("payment_terms").notNull(),
    validUntil: timestamp("valid_until").notNull(),
    notes: text("notes"),
    specs: jsonb("specs").$type<Record<string, unknown>>().default({}),
    attachments: jsonb("attachments").$type<Array<{
        name: string
        url: string
        sizeBytes?: number
        fileType?: string
    }>>().default([]),
    rejectionReason: text("rejection_reason"),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    uniqueIndex("vendor_quotations_quote_number_unique").on(table.quoteNumber),
    index("vendor_quotations_vendor_status_idx").on(table.vendorId, table.status),
    index("vendor_quotations_requirement_idx").on(table.requirementId),
    check("vendor_quotations_unit_price_check", sql`${table.unitPrice} >= 0`),
    check("vendor_quotations_total_price_check", sql`${table.totalPrice} >= 0`),
    check("vendor_quotations_quantity_positive_check", sql`${table.quantity} > 0`),
    check("vendor_quotations_lead_time_positive_check", sql`${table.productionLeadTimeDays} >= 0`),
])

export type VendorQuotation = typeof vendorQuotationsTable.$inferSelect
export type NewVendorQuotation = typeof vendorQuotationsTable.$inferInsert
