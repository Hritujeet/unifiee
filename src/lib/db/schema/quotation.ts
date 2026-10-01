import {
    integer,
    jsonb,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { vendorTable } from "./vendor";
import { business } from "./business";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const QUOTATION_STATUS = pgEnum("quotation_status", [
    "pending",       // submitted, awaiting business review
    "under_review",  // business has opened it
    "accepted",      // business accepted this quotation
    "rejected",      // business rejected this quotation
]);

export const QUOTATION_CURRENCY = pgEnum("quotation_currency", [
    "INR",
    "USD",
    "EUR",
]);

// ─── Line-item type (stored as JSONB array) ───────────────────────────────────
// Each row: { name, description, qty, unit, unitPrice }
// totalAmount on the parent row is pre-calculated at submit time.

export type QuotationLineItem = {
    name: string;
    description?: string;
    qty: number;
    unit: string;          // e.g. "pcs", "kg", "sets"
    unitPrice: number;     // stored as float in JSON; always in the chosen currency
};

// ─── Table ────────────────────────────────────────────────────────────────────

export const quotationTable = pgTable("quotation", {
    id: uuid("id").primaryKey().unique().notNull(),

    // Who submitted
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => vendorTable.id, { onDelete: "cascade" }),

    // Which business / order this quotation is for
    businessId: uuid("business_id")
        .notNull()
        .references(() => business.id, { onDelete: "cascade" }),

    // A free-form reference to the order this quotation responds to.
    // In future this will be a FK to an orders table.
    orderRef: varchar("order_ref", { length: 100 }).notNull(),

    // Core content
    currency: QUOTATION_CURRENCY("currency").default("INR").notNull(),

    // Pre-computed total (sum of qty × unitPrice for all line items).
    // Stored as numeric for precision.
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),

    // JSONB array of QuotationLineItem
    lineItems: jsonb("line_items").$type<QuotationLineItem[]>().notNull(),

    // Optional vendor-facing notes / terms
    notes: text("notes"),

    // Quotation validity window
    validFrom: timestamp("valid_from").defaultNow().notNull(),
    validUntil: timestamp("valid_until").notNull(),

    status: QUOTATION_STATUS("status").default("pending").notNull(),

    // Rejection reason filled by business
    rejectionReason: text("rejection_reason"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export type Quotation = typeof quotationTable.$inferSelect;
export type NewQuotation = typeof quotationTable.$inferInsert;
