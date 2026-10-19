import {
    boolean,
    check,
    foreignKey,
    index,
    integer,
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
import { user } from "./auth-schema"

export const offeringVendorTypeEnum = pgEnum("offering_vendor_type", [
    "manufacturer",
    "supplier",
    "vendor",
    "distributor",
])

export const offeringStatusEnum = pgEnum("offering_status", [
    "draft",
    "active",
    "paused",
    "expired",
    "archived",
])

export const offeringFulfilmentModeEnum = pgEnum("offering_fulfilment_mode", [
    "made_to_order",
    "ready_stock",
    "service",
])

export const offeringUnitEnum = pgEnum("offering_unit", [
    "piece",
    "pack",
    "carton",
    "kg",
    "litre",
    "roll",
    "set",
    "hour",
    "project",
])

export const offeringShippingTermsEnum = pgEnum("offering_shipping_terms", [
    "vendor_pays",
    "buyer_pays",
    "included",
    "pickup_only",
])

export const offeringPaymentTermsEnum = pgEnum("offering_payment_terms", [
    "advance_100",
    "advance_50",
    "on_delivery",
    "net_15",
    "net_30",
])

export const catalogProductStatusEnum = pgEnum("catalog_product_status", [
    "draft",
    "published",
    "archived",
])

/**
 * Standardized Master Catalog Products Table.
 * Decouples standardized product specifications and taxonomy from vendor-specific commercial terms,
 * allowing multiple vendors to list offerings against the same standardized product SKU.
 */
export const catalogProductsTable = pgTable("catalog_products", {
    id: uuid("id").primaryKey().notNull(),
    sku: varchar("sku", { length: 64 }).notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    description: text("description").notNull(),
    vendorType: offeringVendorTypeEnum("vendor_type").notNull().default("manufacturer"),
    categoryKey: varchar("category_key", { length: 100 }).notNull(),
    unitOfMeasure: offeringUnitEnum("unit_of_measure").notNull(),
    specifications: jsonb("specifications").$type<Record<string, unknown>>().notNull().default({}),
    images: jsonb("images").$type<Array<{
        url: string
        isPrimary?: boolean
        caption?: string
    }>>().default([]),
    benchmarkUnitPrice: varchar("benchmark_unit_price", { length: 32 }),
    defaultLeadTimeDays: integer("default_lead_time_days"),
    isCustomizable: boolean("is_customizable").notNull().default(false),
    status: catalogProductStatusEnum("status").notNull().default("published"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    uniqueIndex("catalog_products_sku_unique").on(table.sku),
    index("catalog_products_category_idx").on(table.categoryKey),
    index("catalog_products_status_idx").on(table.status),
])

export type CatalogProduct = typeof catalogProductsTable.$inferSelect
export type NewCatalogProduct = typeof catalogProductsTable.$inferInsert

export const offeringTypesTable = pgTable("offering_types", {
    key: varchar("key", { length: 100 }).primaryKey(),
    displayName: varchar("display_name", { length: 160 }).notNull(),
    vendorType: offeringVendorTypeEnum("vendor_type").notNull(),
    fieldDefinitions: jsonb("field_definitions").$type<Array<{
        name: string
        label: string
        type: string
        required?: boolean
        options?: string[]
        unit?: string
    }>>().notNull().default([]),
    schemaVersion: integer("schema_version").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    uniqueIndex("offering_types_vendor_key_unique").on(table.vendorType, table.key),
])

export const offeringsTable = pgTable("offerings", {
    id: uuid("id").primaryKey().notNull(),
    catalogProductId: uuid("catalog_product_id").references(() => catalogProductsTable.id, { onDelete: "set null" }),
    vendorId: uuid("vendor_id").notNull().references(() => manufacturerTable.id, { onDelete: "restrict" }),
    vendorType: offeringVendorTypeEnum("vendor_type").notNull().default("manufacturer"),
    offeringType: varchar("offering_type", { length: 100 }).notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),
    title: varchar("title", { length: 240 }).notNull(),
    description: text("description").notNull(),
    unitOfMeasure: offeringUnitEnum("unit_of_measure").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 4 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    minOrderQuantity: integer("min_order_quantity").notNull().default(1),
    maxOrderQuantity: integer("max_order_quantity"),
    quantityStep: integer("quantity_step").notNull().default(1),
    stockAvailable: integer("stock_available"),
    fulfilmentMode: offeringFulfilmentModeEnum("fulfilment_mode").notNull(),
    leadTimeDaysMin: integer("lead_time_days_min").notNull(),
    leadTimeDaysMax: integer("lead_time_days_max").notNull(),
    taxPercent: numeric("tax_percent", { precision: 5, scale: 2 }).notNull().default("0"),
    hsnSacCode: varchar("hsn_sac_code", { length: 32 }),
    priceIncludesTax: boolean("price_includes_tax").notNull().default(false),
    shippingTerms: offeringShippingTermsEnum("shipping_terms").notNull(),
    shippingCostNote: text("shipping_cost_note"),
    addressLine1: varchar("address_line_1", { length: 255 }).notNull(),
    addressLine2: varchar("address_line_2", { length: 255 }),
    city: varchar("city", { length: 120 }).notNull(),
    district: varchar("district", { length: 120 }),
    state: varchar("state", { length: 120 }).notNull(),
    pincode: varchar("pincode", { length: 16 }).notNull(),
    country: varchar("country", { length: 100 }).notNull().default("India"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    paymentTerms: offeringPaymentTermsEnum("payment_terms").notNull(),
    sampleAvailable: boolean("sample_available").notNull().default(false),
    samplePrice: numeric("sample_price", { precision: 12, scale: 2 }),
    validFrom: timestamp("valid_from").notNull().defaultNow(),
    validUntil: timestamp("valid_until").notNull(),
    status: offeringStatusEnum("status").notNull().default("draft"),
    attributes: jsonb("attributes").$type<Record<string, unknown>>().notNull().default({}),
    createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
}, (table) => [
    foreignKey({
        name: "offerings_type_vendor_fk",
        columns: [table.vendorType, table.offeringType],
        foreignColumns: [offeringTypesTable.vendorType, offeringTypesTable.key],
    }).onDelete("restrict"),
    index("offerings_catalog_product_idx").on(table.catalogProductId),
    index("offerings_vendor_id_idx").on(table.vendorId),
    index("offerings_vendor_type_idx").on(table.vendorType),
    index("offerings_offering_type_idx").on(table.offeringType),
    index("offerings_status_valid_until_idx").on(table.status, table.validUntil),
    index("offerings_state_city_idx").on(table.state, table.city),
    check("offerings_unit_price_nonnegative_check", sql`${table.unitPrice} >= 0`),
    check("offerings_min_order_quantity_positive_check", sql`${table.minOrderQuantity} > 0`),
    check("offerings_max_order_quantity_check", sql`${table.maxOrderQuantity} IS NULL OR ${table.maxOrderQuantity} >= ${table.minOrderQuantity}`),
    check("offerings_quantity_step_positive_check", sql`${table.quantityStep} > 0`),
    check("offerings_stock_nonnegative_check", sql`${table.stockAvailable} IS NULL OR ${table.stockAvailable} >= 0`),
    check("offerings_lead_time_check", sql`${table.leadTimeDaysMin} >= 0 AND ${table.leadTimeDaysMax} >= ${table.leadTimeDaysMin}`),
    check("offerings_tax_percent_check", sql`${table.taxPercent} >= 0 AND ${table.taxPercent} <= 100`),
    check("offerings_validity_window_check", sql`${table.validUntil} > ${table.validFrom}`),
    check("offerings_vendor_type_supported_check", sql`${table.vendorType} = 'manufacturer'`),
])

export const offeringPriceTiersTable = pgTable("offering_price_tiers", {
    id: uuid("id").primaryKey().notNull(),
    offeringId: uuid("offering_id").notNull().references(() => offeringsTable.id, { onDelete: "cascade" }),
    minQuantity: integer("min_quantity").notNull(),
    maxQuantity: integer("max_quantity"),
    unitPrice: numeric("unit_price", { precision: 12, scale: 4 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
    index("offering_price_tiers_offering_idx").on(table.offeringId, table.minQuantity),
    check("offering_price_tiers_min_quantity_positive_check", sql`${table.minQuantity} > 0`),
    check("offering_price_tiers_max_quantity_check", sql`${table.maxQuantity} IS NULL OR ${table.maxQuantity} >= ${table.minQuantity}`),
    check("offering_price_tiers_unit_price_nonnegative_check", sql`${table.unitPrice} >= 0`),
])

export const offeringImagesTable = pgTable("offering_images", {
    id: uuid("id").primaryKey().notNull(),
    offeringId: uuid("offering_id").notNull().references(() => offeringsTable.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
    index("offering_images_offering_order_idx").on(table.offeringId, table.displayOrder),
])

export type OfferingType = typeof offeringTypesTable.$inferSelect
export type NewOfferingType = typeof offeringTypesTable.$inferInsert

export type Offering = typeof offeringsTable.$inferSelect
export type NewOffering = typeof offeringsTable.$inferInsert

export type OfferingPriceTier = typeof offeringPriceTiersTable.$inferSelect
export type NewOfferingPriceTier = typeof offeringPriceTiersTable.$inferInsert

export type OfferingImage = typeof offeringImagesTable.$inferSelect
export type NewOfferingImage = typeof offeringImagesTable.$inferInsert
