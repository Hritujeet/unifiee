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
import { manufacturerTable } from "./manufacturer"
import { business } from "./business"
import { businessOrdersTable } from "./business-order"

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
        .references(() => manufacturerTable.id, { onDelete: "cascade" }),
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
