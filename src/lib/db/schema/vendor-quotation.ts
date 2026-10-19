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
    "draft",
    "submitted",
    "under_review",
    "accepted",
    "rejected",
    "superseded",
    "withdrawn",
    "expired",
])

export const vendorQuotationsTable = pgTable("vendor_quotations", {
    id: uuid("id").primaryKey().notNull(),
    quoteNumber: varchar("quote_number", { length: 36 }).notNull(),
    version: integer("version").notNull().default(1),
    isLatest: boolean("is_latest").notNull().default(true),
    
    // Business requirement and vendor bindings with restrictive deletion to preserve audit trail
    requirementId: uuid("requirement_id")
        .notNull()
        .references(() => businessRequirementsTable.id, { onDelete: "restrict" }),
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => manufacturerTable.id, { onDelete: "restrict" }),
        
    status: vendorQuotationStatusEnum("status").notNull().default("submitted"),
    
    // Base financial terms (4 decimal places for high-volume packaging unit economics)
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    minOrderQuantity: integer("min_order_quantity").notNull().default(1),
    baseUnitPrice: numeric("base_unit_price", { precision: 12, scale: 4 }).notNull(),
    taxPercent: numeric("tax_percent", { precision: 5, scale: 2 }).notNull().default("18.00"),
    priceIncludesTax: boolean("price_includes_tax").notNull().default(false),
    
    // One-off tooling, setup, and sample costs
    toolingOrDieCost: numeric("tooling_or_die_cost", { precision: 12, scale: 2 }).default("0"),
    plateCharge: numeric("plate_charge", { precision: 12, scale: 2 }).default("0"),
    sampleAvailable: boolean("sample_available").notNull().default(false),
    samplePrice: numeric("sample_price", { precision: 12, scale: 2 }),
    sampleLeadTimeDays: integer("sample_lead_time_days"),
    
    // Production and logistics lead times
    productionLeadTimeDaysMin: integer("production_lead_time_days_min").notNull(),
    productionLeadTimeDaysMax: integer("production_lead_time_days_max").notNull(),
    estimatedDeliveryDays: integer("estimated_delivery_days").notNull(),
    shippingTerms: offeringShippingTermsEnum("shipping_terms").notNull(),
    paymentTerms: offeringPaymentTermsEnum("payment_terms").notNull(),
    
    // Quotation validity window
    validFrom: timestamp("valid_from").notNull().defaultNow(),
    validUntil: timestamp("valid_until").notNull(),
    
    // Immutable specification snapshot of the requirement at the moment of quoting
    specificationsSnapshot: jsonb("specifications_snapshot").$type<Record<string, unknown>>().notNull().default({}),
    attachments: jsonb("attachments").$type<Array<{
        name: string
        url: string
        sizeBytes?: number
        fileType?: string
    }>>().default([]),
    notes: text("notes"),
    rejectionReason: text("rejection_reason"),
    acceptedAt: timestamp("accepted_at"),
    
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    uniqueIndex("vendor_quotations_quote_version_unique").on(table.quoteNumber, table.version),
    index("vendor_quotations_vendor_status_idx").on(table.vendorId, table.status),
    index("vendor_quotations_requirement_idx").on(table.requirementId),
    index("vendor_quotations_validity_idx").on(table.validUntil, table.status),
    index("vendor_quotations_created_idx").on(table.createdAt),
    check("vendor_quotations_base_unit_price_check", sql`${table.baseUnitPrice} >= 0`),
    check("vendor_quotations_moq_positive_check", sql`${table.minOrderQuantity} > 0`),
    check("vendor_quotations_lead_time_range_check", sql`${table.productionLeadTimeDaysMin} >= 0 AND ${table.productionLeadTimeDaysMax} >= ${table.productionLeadTimeDaysMin}`),
    check("vendor_quotations_validity_window_check", sql`${table.validUntil} > ${table.validFrom}`),
])

/**
 * Quantity tier slabs for quotation (e.g. 5,000 pcs @ ₹3.80, 10,000 pcs @ ₹3.40).
 */
export const vendorQuotationPriceTiersTable = pgTable("vendor_quotation_price_tiers", {
    id: uuid("id").primaryKey().notNull(),
    quotationId: uuid("quotation_id")
        .notNull()
        .references(() => vendorQuotationsTable.id, { onDelete: "cascade" }),
    minQuantity: integer("min_quantity").notNull(),
    maxQuantity: integer("max_quantity"),
    unitPrice: numeric("unit_price", { precision: 12, scale: 4 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
    index("vendor_quotation_price_tiers_quotation_idx").on(table.quotationId, table.minQuantity),
    check("quotation_price_tiers_min_qty_check", sql`${table.minQuantity} > 0`),
    check("quotation_price_tiers_max_qty_check", sql`${table.maxQuantity} IS NULL OR ${table.maxQuantity} >= ${table.minQuantity}`),
    check("quotation_price_tiers_price_check", sql`${table.unitPrice} >= 0`),
])

export type VendorQuotation = typeof vendorQuotationsTable.$inferSelect
export type NewVendorQuotation = typeof vendorQuotationsTable.$inferInsert
export type VendorQuotationPriceTier = typeof vendorQuotationPriceTiersTable.$inferSelect
export type NewVendorQuotationPriceTier = typeof vendorQuotationPriceTiersTable.$inferInsert
