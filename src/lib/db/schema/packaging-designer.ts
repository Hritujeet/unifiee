import { pgTable, text, timestamp, uuid, varchar, boolean, integer, json, pgEnum, numeric } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const pricingModelEnum = pgEnum("pricing_model", [
    "per_project",
    "hourly",
    "per_design"
])

export const availabilityStatusEnum = pgEnum("availability_status", [
    "available",
    "limited",
    "unavailable"
])

export const packagingDesignerTable = pgTable("packaging_designers", {
    id: uuid("id").primaryKey().unique().notNull(),
    userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
    
    // Identity and contact
    fullName: varchar("full_name", { length: 300 }).notNull(),
    displayName: varchar("display_name", { length: 300 }),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 255 }).notNull().unique(),
    profilePhotoUrl: text("profile_photo_url"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 100 }),
    country: varchar("country", { length: 100 }),

    // Professional profile
    headline: varchar("headline", { length: 500 }),
    bio: text("bio"),
    yearsOfExperience: integer("years_of_experience"),
    specializations: json("specializations").$type<string[]>(),
    packagingDesignSpecializations: json("packaging_design_specializations").$type<string[]>(),
    softwareTools: json("software_tools").$type<string[]>(),
    languages: json("languages").$type<string[]>(),
    industriesServed: json("industries_served").$type<string[]>(),

    // Portfolio
    portfolioUrl: text("portfolio_url").notNull(),
    additionalLinks: json("additional_links").$type<{
        behance?: string;
        dribbble?: string;
        instagram?: string;
        linkedin?: string;
        website?: string;
    }>(),
    portfolioImages: json("portfolio_images").$type<string[]>(),

    // Pricing and availability
    pricingModel: pricingModelEnum("pricing_model"),
    startingPrice: numeric("starting_price"),
    hourlyRate: numeric("hourly_rate"),
    chargesNotes: text("charges_notes"),
    turnaroundTime: varchar("turnaround_time", { length: 255 }),
    revisionsIncluded: integer("revisions_included"),
    availabilityStatus: availabilityStatusEnum("availability_status").default("available"),

    // Meta
    isVerified: boolean("is_verified").default(false),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date()),
});
