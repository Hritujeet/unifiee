import {
    boolean,
    index,
    pgEnum,
    pgTable,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core"
import { manufacturerTable } from "./manufacturer"

export const bankAccountTypeEnum = pgEnum("bank_account_type", [
    "current",
    "savings",
])

export const vendorPayoutAccountsTable = pgTable("vendor_payout_accounts", {
    id: uuid("id").primaryKey().notNull(),
    vendorId: uuid("vendor_id")
        .notNull()
        .unique()
        .references(() => manufacturerTable.id, { onDelete: "cascade" }),
    accountHolderName: varchar("account_holder_name", { length: 255 }).notNull(),
    accountNumber: varchar("account_number", { length: 64 }).notNull(),
    ifscCode: varchar("ifsc_code", { length: 16 }).notNull(),
    bankName: varchar("bank_name", { length: 120 }).notNull(),
    branch: varchar("branch", { length: 120 }),
    accountType: bankAccountTypeEnum("account_type").notNull().default("current"),
    upiId: varchar("upi_id", { length: 100 }),
    isPrimary: boolean("is_primary").notNull().default(true),
    isVerified: boolean("is_verified").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    index("vendor_payout_vendor_idx").on(table.vendorId),
])

export type VendorPayoutAccount = typeof vendorPayoutAccountsTable.$inferSelect
export type NewVendorPayoutAccount = typeof vendorPayoutAccountsTable.$inferInsert
