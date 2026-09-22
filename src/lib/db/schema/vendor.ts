import { pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const VENDOR_TYPE = pgEnum("vendor_type", [
    "manufacturer",
    "printer",
    "supplier",
    "distributor"
])

export const vendorTable = pgTable("vendor", {
    id: uuid("id").primaryKey().unique().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    fullName: varchar("fullname", { length: 300 }).notNull(),
    companyName: varchar("companyname", { length: 500 }).notNull(),
    type: VENDOR_TYPE("vendor_type").notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 255 }).notNull().unique(),
    services: varchar("services", { length: 500 }).array(),
    vendorAddress: text(),
    gstin: varchar("gstin", { length: 15 }),
    socials: varchar("socials", { length: 500 }).array(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
});