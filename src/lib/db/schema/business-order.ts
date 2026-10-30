import {
    boolean,
    check,
    index,
    integer,
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
import { business } from "./business"
import { manufacturerTable } from "./manufacturer"
import {
    offeringFulfilmentModeEnum,
    offeringPaymentTermsEnum,
    offeringShippingTermsEnum,
    offeringUnitEnum,
    offeringsTable,
} from "./offering"

export const businessOrderStatusEnum = pgEnum("business_order_status", [
    "draft",
    "submitted",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
])

export const businessOrderItemStatusEnum = pgEnum("business_order_item_status", [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
])

export const businessOrdersTable = pgTable("business_orders", {
    id: uuid("id").primaryKey().notNull(),
    orderNumber: varchar("order_number", { length: 32 }).notNull(),
    businessId: uuid("business_id").notNull().references(() => business.id, { onDelete: "restrict" }),
    vendorId: uuid("vendor_id").notNull().references(() => manufacturerTable.id, { onDelete: "restrict" }),
    status: businessOrderStatusEnum("status").notNull().default("submitted"),
    currency: varchar("currency", { length: 3 }).notNull().default("INR"),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
    taxTotal: numeric("tax_total", { precision: 14, scale: 2 }).notNull().default("0"),
    shippingTotal: numeric("shipping_total", { precision: 14, scale: 2 }).notNull().default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull(),
    paymentTerms: offeringPaymentTermsEnum("payment_terms").notNull(),
    notes: text("notes"),
    shippingAddressLine1: varchar("shipping_address_line_1", { length: 255 }).notNull(),
    shippingAddressLine2: varchar("shipping_address_line_2", { length: 255 }),
    shippingCity: varchar("shipping_city", { length: 120 }).notNull(),
    shippingDistrict: varchar("shipping_district", { length: 120 }),
    shippingState: varchar("shipping_state", { length: 120 }).notNull(),
    shippingPincode: varchar("shipping_pincode", { length: 16 }).notNull(),
    shippingCountry: varchar("shipping_country", { length: 100 }).notNull().default("India"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at"),
    cancelledAt: timestamp("cancelled_at"),
    cancellationRole: varchar("cancellation_role", { length: 32 }),
    cancellationReason: text("cancellation_reason"),
}, (table) => [
    uniqueIndex("business_orders_order_number_unique").on(table.orderNumber),
    index("business_orders_business_created_idx").on(table.businessId, table.createdAt),
    index("business_orders_vendor_status_idx").on(table.vendorId, table.status),
    check("business_orders_amounts_nonnegative_check", sql`${table.subtotal} >= 0 AND ${table.taxTotal} >= 0 AND ${table.shippingTotal} >= 0 AND ${table.total} >= 0`),
])

export const businessOrderItemsTable = pgTable("business_order_items", {
    id: uuid("id").primaryKey().notNull(),
    orderId: uuid("order_id").notNull().references(() => businessOrdersTable.id, { onDelete: "cascade" }),
    offeringId: uuid("offering_id").references(() => offeringsTable.id, { onDelete: "set null" }),
    status: businessOrderItemStatusEnum("status").notNull().default("pending"),
    titleSnapshot: varchar("title_snapshot", { length: 240 }).notNull(),
    quantity: integer("quantity").notNull(),
    unitOfMeasureSnapshot: offeringUnitEnum("unit_of_measure_snapshot").notNull(),
    unitPriceSnapshot: numeric("unit_price_snapshot", { precision: 12, scale: 4 }).notNull(),
    taxPercentSnapshot: numeric("tax_percent_snapshot", { precision: 5, scale: 2 }).notNull(),
    priceIncludesTaxSnapshot: boolean("price_includes_tax_snapshot").notNull(),
    fulfilmentModeSnapshot: offeringFulfilmentModeEnum("fulfilment_mode_snapshot").notNull(),
    leadTimeDaysMinSnapshot: integer("lead_time_days_min_snapshot").notNull(),
    leadTimeDaysMaxSnapshot: integer("lead_time_days_max_snapshot").notNull(),
    shippingTermsSnapshot: offeringShippingTermsEnum("shipping_terms_snapshot").notNull(),
    hsnSacCodeSnapshot: varchar("hsn_sac_code_snapshot", { length: 32 }),
    imageUrlSnapshot: text("image_url_snapshot"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
    index("business_order_items_order_idx").on(table.orderId),
    index("business_order_items_offering_idx").on(table.offeringId),
    check("business_order_items_quantity_positive_check", sql`${table.quantity} > 0`),
    check("business_order_items_unit_price_nonnegative_check", sql`${table.unitPriceSnapshot} >= 0`),
])
