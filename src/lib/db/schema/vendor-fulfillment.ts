import {
    check,
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
import { sql } from "drizzle-orm"
import { manufacturerTable } from "./manufacturer"
import { businessOrdersTable } from "./business-order"

export const orderFulfillmentStageEnum = pgEnum("order_fulfillment_stage", [
    "order_confirmed",
    "artwork_approved",
    "raw_material_sourced",
    "in_production",
    "quality_check_passed",
    "packed",
    "dispatched",
    "delivered",
])

export const shipmentStatusEnum = pgEnum("shipment_status", [
    "label_created",
    "picked_up",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "failed",
    "returned",
])

export const orderFulfillmentMilestonesTable = pgTable("order_fulfillment_milestones", {
    id: uuid("id").primaryKey().notNull(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => businessOrdersTable.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => manufacturerTable.id, { onDelete: "cascade" }),
    stage: orderFulfillmentStageEnum("stage").notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description"),
    proofImages: jsonb("proof_images").$type<Array<{
        url: string
        caption?: string
        uploadedAt: string
    }>>().default([]),
    completedAt: timestamp("completed_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
    index("order_milestones_order_idx").on(table.orderId),
    index("order_milestones_vendor_idx").on(table.vendorId),
    index("order_milestones_stage_idx").on(table.orderId, table.stage),
])

export const orderShipmentsTable = pgTable("order_shipments", {
    id: uuid("id").primaryKey().notNull(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => businessOrdersTable.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => manufacturerTable.id, { onDelete: "cascade" }),
    courierPartner: varchar("courier_partner", { length: 120 }).notNull(),
    trackingNumber: varchar("tracking_number", { length: 120 }).notNull(),
    trackingUrl: text("tracking_url"),
    packageWeightKg: numeric("package_weight_kg", { precision: 8, scale: 2 }),
    numberOfBoxes: integer("number_of_boxes").notNull().default(1),
    status: shipmentStatusEnum("status").notNull().default("label_created"),
    dispatchedAt: timestamp("dispatched_at").notNull().defaultNow(),
    estimatedDeliveryDate: timestamp("estimated_delivery_date"),
    deliveredAt: timestamp("delivered_at"),
    deliveryProofUrl: text("delivery_proof_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    index("order_shipments_order_idx").on(table.orderId),
    index("order_shipments_vendor_idx").on(table.vendorId),
    check("order_shipments_boxes_positive_check", sql`${table.numberOfBoxes} > 0`),
])

export type OrderFulfillmentMilestone = typeof orderFulfillmentMilestonesTable.$inferSelect
export type NewOrderFulfillmentMilestone = typeof orderFulfillmentMilestonesTable.$inferInsert
export type OrderShipment = typeof orderShipmentsTable.$inferSelect
export type NewOrderShipment = typeof orderShipmentsTable.$inferInsert
