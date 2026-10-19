import {
    boolean,
    index,
    integer,
    jsonb,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core"
import { manufacturerTable } from "./manufacturer"

export const certificationVerificationStatusEnum = pgEnum("certification_verification_status", [
    "declared",
    "under_review",
    "verified",
    "rejected",
])

export const vendorFacilitiesTable = pgTable("vendor_facilities", {
    id: uuid("id").primaryKey().notNull(),
    vendorId: uuid("vendor_id")
        .notNull()
        .unique()
        .references(() => manufacturerTable.id, { onDelete: "restrict" }),
    facilityName: varchar("facility_name", { length: 255 }),
    factoryAreaSqFt: integer("factory_area_sq_ft"),
    dailyCapacityUnits: integer("daily_capacity_units"),
    monthlyCapacityUnits: integer("monthly_capacity_units"),
    operatingSinceYear: integer("operating_since_year"),
    shiftCount: integer("shift_count").default(1),
    
    // Capability-based matching criteria
    printingProcesses: varchar("printing_processes", { length: 64 }).array().default([]), // flexo, offset, rotogravure, digital, screen
    maxPrintColors: integer("max_print_colors").default(4),
    machineryCapabilities: jsonb("machinery_capabilities").$type<Array<{
        name: string
        category: string
        quantity: number
        speedPerHour?: string
        specifications?: Record<string, unknown>
    }>>().default([]),
    qualityTestingMethods: varchar("quality_testing_methods", { length: 120 }).array().default([]),
    
    // Certifications with strict separation of self-declared claims vs verified audit credentials
    certifications: jsonb("certifications").$type<Array<{
        id: string
        name: string // ISO 9001, FSSAI, BRC, FSC, etc.
        certNumber?: string
        issuingBody?: string
        validUntil?: string
        documentUrl?: string
        status: "declared" | "under_review" | "verified" | "rejected"
        verifiedAt?: string
        verifiedBy?: string
        rejectionReason?: string
    }>>().default([]),
    
    minOrderValue: numeric("min_order_value", { precision: 12, scale: 2 }).default("0"),
    defaultLeadTimeDays: integer("default_lead_time_days").default(14),
    acceptsCustomOrders: boolean("accepts_custom_orders").notNull().default(true),
    
    // On-site verification / factory audit status
    factoryAudited: boolean("factory_audited").notNull().default(false),
    auditReportUrl: text("audit_report_url"),
    auditedAt: timestamp("audited_at"),
    
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    index("vendor_facilities_vendor_idx").on(table.vendorId),
])

export type VendorFacility = typeof vendorFacilitiesTable.$inferSelect
export type NewVendorFacility = typeof vendorFacilitiesTable.$inferInsert
