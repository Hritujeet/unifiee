import {
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const BUSINESS_TYPE = pgEnum("businesstype", [
    "cafe",
    "restaurant",
    "qsr",
    "cloud_kitchen",
    "bakery",
]);

export const ROLE = pgEnum("role", ["owner", "manager", "procurement"]);

export const business = pgTable("business", {
    id: uuid("id").primaryKey().unique().notNull(),
    userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    fullName: varchar("fullname", { length: 300 }).notNull(),
    ownerName: varchar("ownername", { length: 300 }).notNull(),
    businessName: varchar("businessname", { length: 500 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 255 }).notNull().unique(),
    businessType: BUSINESS_TYPE("businesstype").notNull(),
    businessAddress: text().notNull(),
    role: ROLE("role").notNull(),
    gstin: varchar("gstin", { length: 15 }),
    website: varchar("website", { length: 500 }),
    socials: varchar("social", { length: 500 }).array(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
});
