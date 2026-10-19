/**
 * DEFERRED: PHASE 2 TRANSACTION & COMPLIANCE MODULE
 * 
 * Per CEO review directive:
 * "Invoicing, payouts, and settlement functionality should remain deferred until our
 * transaction and compliance model is clear. Let's keep the current implementation focused
 * while ensuring the core data model can support the later phases."
 * 
 * Pending Clarifications for Phase 2:
 * 1. Marketplace Model vs. Merchant of Record (MoR) status under Indian GST laws.
 * 2. Mandatory e-Invoicing integration (IRN generation & B2B QR code) for entities with turnover > ₹5 Cr.
 * 3. Section 194-O Income Tax (TDS on e-commerce operators @ 0.1% / 1%).
 * 4. Section 52 GST TCS (Tax Collected at Source @ 1%).
 * 5. Escrow / Nodal settlement account architecture compliant with RBI Payment Aggregator guidelines.
 */

import {
    check,
    index,
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
import { manufacturerTable } from "../manufacturer"
import { business } from "../business"
import { businessOrdersTable } from "../business-order"

export const vendorInvoiceStatusEnum = pgEnum("vendor_invoice_status", [
    "draft",
    "issued",
    "paid",
    "partially_paid",
    "overdue",
    "cancelled",
])

export const vendorInvoicesTable = pgTable("vendor_invoices", {
    id: uuid("id").primaryKey().notNull(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => businessOrdersTable.id, { onDelete: "restrict" }),
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => manufacturerTable.id, { onDelete: "restrict" }),
    businessId: uuid("business_id")
        .notNull()
        .references(() => business.id, { onDelete: "restrict" }),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
    taxTotal: numeric("tax_total", { precision: 14, scale: 2 }).notNull().default("0"),
    shippingTotal: numeric("shipping_total", { precision: 14, scale: 2 }).notNull().default("0"),
    grandTotal: numeric("grand_total", { precision: 14, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    hsnSacBreakdown: jsonb("hsn_sac_breakdown").$type<Array<{
        hsnCode: string
        description?: string
        taxableAmount: number
        ratePercent: number
        cgstAmount?: number
        sgstAmount?: number
        igstAmount?: number
    }>>().default([]),
    eWayBillNumber: varchar("eway_bill_number", { length: 50 }),
    invoicePdfUrl: text("invoice_pdf_url"),
    status: vendorInvoiceStatusEnum("status").notNull().default("issued"),
    dueDate: timestamp("due_date"),
    paidAt: timestamp("paid_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    uniqueIndex("vendor_invoices_invoice_number_unique").on(table.invoiceNumber),
    index("vendor_invoices_vendor_status_idx").on(table.vendorId, table.status),
    index("vendor_invoices_order_idx").on(table.orderId),
    index("vendor_invoices_business_idx").on(table.businessId),
    check("vendor_invoices_amounts_check", sql`${table.subtotal} >= 0 AND ${table.taxTotal} >= 0 AND ${table.grandTotal} >= 0`),
])

export type VendorInvoice = typeof vendorInvoicesTable.$inferSelect
export type NewVendorInvoice = typeof vendorInvoicesTable.$inferInsert
