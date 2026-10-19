import {
    check,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { manufacturerTable } from "./manufacturer"
import { business } from "./business"
import { businessOrdersTable } from "./business-order"

export const vendorReviewsTable = pgTable("vendor_reviews", {
    id: uuid("id").primaryKey().notNull(),
    vendorId: uuid("vendor_id")
        .notNull()
        .references(() => manufacturerTable.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
        .notNull()
        .unique()
        .references(() => businessOrdersTable.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
        .notNull()
        .references(() => business.id, { onDelete: "cascade" }),
    overallRating: integer("overall_rating").notNull(),
    qualityRating: integer("quality_rating"),
    deliveryRating: integer("delivery_rating"),
    communicationRating: integer("communication_rating"),
    title: varchar("title", { length: 200 }),
    review: text("review"),
    vendorReply: text("vendor_reply"),
    repliedAt: timestamp("replied_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
    index("vendor_reviews_vendor_idx").on(table.vendorId),
    index("vendor_reviews_business_idx").on(table.businessId),
    check("vendor_reviews_rating_range_check", sql`${table.overallRating} >= 1 AND ${table.overallRating} <= 5`),
])

export type VendorReview = typeof vendorReviewsTable.$inferSelect
export type NewVendorReview = typeof vendorReviewsTable.$inferInsert
