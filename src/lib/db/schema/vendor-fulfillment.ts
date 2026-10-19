import {
    boolean,
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

export const fulfillmentWorkflowTypeEnum = pgEnum("fulfillment_workflow_type", [
    "ready_stock",
    "made_to_order",
    "service",
])

export const orderFulfillmentStageEnum = pgEnum("order_fulfillment_stage", [
    "order_confirmed",
    "artwork_submitted",
    "artwork_approved",
    "tooling_and_plates_ready",
    "raw_material_sourced",
    "in_production",
    "quality_check_passed",
    "packed",
    "dispatched",
    "out_for_delivery",
    "delivered",
    "cancelled",
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

/**
 * Order Fulfillment Milestones Table.
 * Supports flexible workflows for both standard-stock orders (skip artwork/production)
 * and customized packaging orders (full pre-press, tooling, and manufacturing sequence).
 */
export const orderFulfillmentMilestonesTable = pgTable("order_fulfillment_milestones", {
    id: uuid("id").primaryKey().notNull(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => businessOrdersTable.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => manufacturerTable.id, { onDelete: "restrict" }),
    workflowType: fulfillmentWorkflowTypeEnum("workflow_type").notNull().default("made_to_order"),
    stage: orderFulfillmentStageEnum("stage").notNull(),
    stageSequence: integer("stage_sequence").notNull().default(1),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description"),
    proofImages: jsonb("proof_images").$type<Array<{
        url: string
        caption?: string
        uploadedAt: string
    }>>().default([]),
    isCompleted: boolean("is_completed").notNull().default(false),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
    index("order_milestones_order_idx").on(table.orderId),
    index("order_milestones_vendor_idx").on(table.vendorId),
    index("order_milestones_stage_idx").on(table.orderId, table.stage),
    index("order_milestones_workflow_idx").on(table.workflowType, table.stage),
])

export const orderShipmentsTable = pgTable("order_shipments", {
    id: uuid("id").primaryKey().notNull(),
    orderId: uuid("order_id")
        .notNull()
        .references(() => businessOrdersTable.id, { onDelete: "cascade" }),
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => manufacturerTable.id, { onDelete: "restrict" }),
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
    index("order_shipments_tracking_idx").on(table.trackingNumber),
    check("order_shipments_boxes_positive_check", sql`${table.numberOfBoxes} > 0`),
])

export type OrderFulfillmentMilestone = typeof orderFulfillmentMilestonesTable.$inferSelect
export type NewOrderFulfillmentMilestone = typeof orderFulfillmentMilestonesTable.$inferInsert

export type OrderShipment = typeof orderShipmentsTable.$inferSelect
export type NewOrderShipment = typeof orderShipmentsTable.$inferInsert
