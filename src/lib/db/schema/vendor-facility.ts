import {
    boolean,
    index,
    integer,
    jsonb,
    numeric,
    pgTable,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core"
import { manufacturerTable } from "./manufacturer"

export const vendorFacilitiesTable = pgTable("vendor_facilities", {
    id: uuid("id").primaryKey().notNull(),
    vendorId: uuid("vendor_id")
        .notNull()
        .unique()
        .references(() => manufacturerTable.id, { onDelete: "cascade" }),
    facilityName: varchar("facility_name", { length: 255 }),
    factoryAreaSqFt: integer("factory_area_sq_ft"),
    dailyCapacityUnits: varchar("daily_capacity_units", { length: 120 }),
    operatingSinceYear: integer("operating_since_year"),
    shiftCount: integer("shift_count").default(1),
    machinery: jsonb("machinery").$type<Array<{
        name: string
        quantity: number
        speedPerHour?: string
    }>>().default([]),
    certifications: jsonb("certifications").$type<Array<{
        name: string
        certNumber?: string
        status?: string
    }>>().default([]),
    qualityTestingMethods: jsonb("quality_testing_methods").$type<string[]>().default([]),
    minOrderValue: numeric("min_order_value", { precision: 12, scale: 2 }).default("0"),
    defaultLeadTimeDays: integer("default_lead_time_days").default(14),
    acceptsCustomOrders: boolean("accepts_custom_orders").notNull().default(true),
    factoryAudited: boolean("factory_audited").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    index("vendor_facilities_vendor_idx").on(table.vendorId),
])

export type VendorFacility = typeof vendorFacilitiesTable.$inferSelect
export type NewVendorFacility = typeof vendorFacilitiesTable.$inferInsert
