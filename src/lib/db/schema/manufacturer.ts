import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const manufacturerTable = pgTable("manufacturer", {
    id: uuid("id").primaryKey().unique().notNull(),
    userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    fullName: varchar("fullname", { length: 300 }).notNull(),
    companyName: varchar("companyname", { length: 500 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 255 }).notNull().unique(),
    packagingCategories: varchar("packaging_categories", { length: 100 }).array(),
    capabilities: varchar("capabilities", { length: 100 }).array(),
    manufacturerAddress: text("manufacturer_address"),
    gstin: varchar("gstin", { length: 15 }),
    socials: varchar("socials", { length: 500 }).array(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const manufacturer = manufacturerTable;
