/**
 * DEFERRED: PHASE 2 TRANSACTION & COMPLIANCE MODULE
 * 
 * Per CEO review directive:
 * "Invoicing, payouts, and settlement functionality should remain deferred until our
 * transaction and compliance model is clear. Let's keep the current implementation focused
 * while ensuring the core data model can support the later phases."
 * 
 * Pending Clarifications for Phase 2:
 * 1. Bank account penny drop verification (via RazorpayX / Cashfree / Setu).
 * 2. Automated PAN-GSTIN-Bank name matching for anti-fraud & vendor KYC.
 * 3. Escrow disbursement rules tied to delivery confirmation and milestone sign-offs.
 * 4. TDS certificate generation (Form 16A) under Section 194-O.
 */

import {
    boolean,
    index,
    pgEnum,
    pgTable,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core"
import { manufacturerTable } from "../manufacturer"

export const bankAccountTypeEnum = pgEnum("bank_account_type", [
    "current",
    "savings",
])

export const vendorPayoutAccountsTable = pgTable("vendor_payout_accounts", {
    id: uuid("id").primaryKey().notNull(),
    vendorId: uuid("vendor_id")
        .notNull()
        .unique()
        .references(() => manufacturerTable.id, { onDelete: "restrict" }),
    accountHolderName: varchar("account_holder_name", { length: 255 }).notNull(),
    accountNumber: varchar("account_number", { length: 64 }).notNull(),
    ifscCode: varchar("ifsc_code", { length: 16 }).notNull(),
    bankName: varchar("bank_name", { length: 120 }).notNull(),
    branch: varchar("branch", { length: 120 }),
    accountType: bankAccountTypeEnum("account_type").notNull().default("current"),
    upiId: varchar("upi_id", { length: 100 }),
    isPrimary: boolean("is_primary").notNull().default(true),
    isVerified: boolean("is_verified").notNull().default(false),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    index("vendor_payout_vendor_idx").on(table.vendorId),
])

export type VendorPayoutAccount = typeof vendorPayoutAccountsTable.$inferSelect
export type NewVendorPayoutAccount = typeof vendorPayoutAccountsTable.$inferInsert
