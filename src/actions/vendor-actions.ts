"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { manufacturerTable } from "@/lib/db/schema/manufacturer"
import {
    offeringsTable,
} from "@/lib/db/schema/offering"
import {
    businessOrdersTable,
    businessOrderItemsTable,
} from "@/lib/db/schema/business-order"
import { orderFulfillmentMilestonesTable, orderShipmentsTable } from "@/lib/db/schema/vendor-fulfillment"
import { business } from "@/lib/db/schema/business"
import { eq, and, desc, isNull, inArray, count, sum, gte } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import crypto from "crypto"
import { triggerEntityEmbedding, buildOfferingTemplate } from "@/lib/ai/embeddings"
import { beginIdempotency, completeIdempotency, idempotencyResponse } from "@/lib/server/idempotency"
import { z } from "zod"
import { canTransition, type OrderStatus } from "@/lib/orders/lifecycle"
import { orderArtworkProofsTable } from "@/lib/db/schema/order-lifecycle"
import { orderIssuesTable } from "@/lib/db/schema/order-lifecycle"
import { checkRateLimit } from "@/lib/server/rate-limit"

export interface VendorAuthContext {
    userId: string
    manufacturerId: string
    companyName: string
    vendorName: string
}

export async function getAuthenticatedVendor(): Promise<VendorAuthContext | null> {
    const reqHeaders = await headers()
    const session = await auth.api.getSession({ headers: reqHeaders })
    if (!session?.user) return null

    const rows = await db
        .select({
            id: manufacturerTable.id,
            companyName: manufacturerTable.companyName,
            name: manufacturerTable.name,
            fullName: manufacturerTable.fullName,
            address: manufacturerTable.manufacturerAddress,
        })
        .from(manufacturerTable)
        .where(eq(manufacturerTable.userId, session.user.id))
        .limit(1)

    if (rows.length === 0) return null

    const m = rows[0]
    return {
        userId: session.user.id,
        manufacturerId: m.id,
        companyName: m.companyName || m.fullName || "Apex Packaging",
        vendorName: m.name || m.fullName || "Vendor",
    }
}

// ── Helper to fetch orders along with requested offering items ──────────────
export async function getVendorOrdersWithItems(vendorId: string) {
    const rawOrders = await db
        .select({
            order: businessOrdersTable,
            buyerName: business.businessName,
            buyerEmail: business.email,
            buyerPhone: business.phone,
        })
        .from(businessOrdersTable)
        .leftJoin(business, eq(businessOrdersTable.businessId, business.id))
        .where(eq(businessOrdersTable.vendorId, vendorId))
        .orderBy(desc(businessOrdersTable.createdAt))

    if (rawOrders.length === 0) return []

    const orderIds = rawOrders.map((o) => o.order.id)
    const items = await db
        .select()
        .from(businessOrderItemsTable)
        .where(inArray(businessOrderItemsTable.orderId, orderIds))
    const shipments = await db
        .select()
        .from(orderShipmentsTable)
        .where(inArray(orderShipmentsTable.orderId, orderIds))

    return rawOrders.map((o) => ({
        ...o,
        items: items.filter((item) => item.orderId === o.order.id),
        shipment: shipments.find((shipment) => shipment.orderId === o.order.id) ?? null,
    }))
}

export async function getVendorOrders(input: { status?: string; search?: string; page?: number } = {}) {
    const vendor = await getAuthenticatedVendor()
    if (!vendor) return { success: false as const, error: "Unauthorized.", data: [] }
    const rows = await getVendorOrdersWithItems(vendor.manufacturerId)
    const search = input.search?.trim().toLowerCase()
    const filtered = rows.filter((row) => {
        const statusMatch = !input.status || input.status === "all" || row.order.status === input.status
        const searchMatch = !search ||
            row.order.orderNumber.toLowerCase().includes(search) ||
            (row.buyerName ?? "").toLowerCase().includes(search) ||
            row.items.some((item) => item.titleSnapshot.toLowerCase().includes(search))
        return statusMatch && searchMatch
    })
    const page = Math.max(1, input.page ?? 1)
    return { success: true as const, data: filtered.slice((page - 1) * 25, page * 25), total: filtered.length }
}

export async function getVendorOrderDetail(orderId: string) {
    const vendor = await getAuthenticatedVendor()
    if (!vendor) return { success: false as const, error: "Unauthorized." }
    const [row] = await db.select({
        order: businessOrdersTable,
        buyerName: business.businessName,
        buyerEmail: business.email,
        buyerPhone: business.phone,
    }).from(businessOrdersTable)
        .innerJoin(business, eq(businessOrdersTable.businessId, business.id))
        .where(and(eq(businessOrdersTable.id, orderId), eq(businessOrdersTable.vendorId, vendor.manufacturerId))).limit(1)
    if (!row) return { success: false as const, error: "Order not found." }
    const [items, milestones, proofs, shipment, issues] = await Promise.all([
        db.select().from(businessOrderItemsTable).where(eq(businessOrderItemsTable.orderId, orderId)),
        db.select().from(orderFulfillmentMilestonesTable).where(eq(orderFulfillmentMilestonesTable.orderId, orderId)).orderBy(desc(orderFulfillmentMilestonesTable.createdAt)),
        db.select().from(orderArtworkProofsTable).where(eq(orderArtworkProofsTable.orderId, orderId)).orderBy(desc(orderArtworkProofsTable.version)),
        db.select().from(orderShipmentsTable).where(eq(orderShipmentsTable.orderId, orderId)).orderBy(desc(orderShipmentsTable.createdAt)).limit(1),
        db.select().from(orderIssuesTable).where(eq(orderIssuesTable.orderId, orderId)).orderBy(desc(orderIssuesTable.createdAt)),
    ])
    const confirmed = !["placed", "rejected"].includes(row.order.status)
    return {
        success: true as const,
        data: {
            ...row,
            buyerName: confirmed ? row.buyerName : null,
            buyerEmail: confirmed ? row.buyerEmail : null,
            buyerPhone: confirmed ? row.buyerPhone : null,
            items, milestones, proofs, shipment: shipment[0] ?? null, issues,
        },
    }
}

export async function getVendorDashboardStats() {
    const vendor = await getAuthenticatedVendor()
    if (!vendor) return { success: false as const, error: "Unauthorized." }
    const [counts, value] = await Promise.all([
        db.select({ status: businessOrdersTable.status, count: count() }).from(businessOrdersTable)
            .where(eq(businessOrdersTable.vendorId, vendor.manufacturerId)).groupBy(businessOrdersTable.status),
        db.select({ total: sum(businessOrdersTable.total) }).from(businessOrdersTable)
            .where(and(eq(businessOrdersTable.vendorId, vendor.manufacturerId), gte(businessOrdersTable.createdAt, new Date(new Date().getFullYear(), new Date().getMonth(), 1)))),
    ])
    const byStatus = Object.fromEntries(counts.map((row) => [row.status, Number(row.count)]))
    return {
        success: true as const,
        data: {
            placed: byStatus.placed ?? 0,
            awaitingProofApproval: byStatus.proof_pending ?? 0,
            inProduction: (byStatus.in_production ?? 0) + (byStatus.quality_check ?? 0),
            readyToDispatch: byStatus.quality_check ?? 0,
            dispatched: byStatus.dispatched ?? 0,
            completed: (byStatus.delivered ?? 0) + (byStatus.completed ?? 0),
            totalOrderValueThisMonth: value[0]?.total ?? "0",
        },
    }
}

export async function createOrderShipmentAction(input: {
    orderId: string
    courierPartner: string
    trackingNumber: string
    trackingUrl?: string
    numberOfBoxes?: number
    estimatedDeliveryDate?: string
    notes?: string
    idempotencyKey?: string
}) {
    let idempotencyId: string | null = null
    try {
        const parsed = z.object({
            orderId: z.string().uuid(),
            courierPartner: z.string().trim().min(2).max(120),
            trackingNumber: z.string().trim().min(2).max(120),
            trackingUrl: z.string().url().optional().or(z.literal("")),
            numberOfBoxes: z.coerce.number().int().positive().max(10000).default(1),
            estimatedDeliveryDate: z.string().optional(),
            notes: z.string().trim().max(2000).optional(),
            idempotencyKey: z.string().uuid().optional(),
        }).safeParse(input)
        if (!parsed.success) return { success: false, error: "Enter valid courier and tracking details." }
        const vendor = await getAuthenticatedVendor()
        if (!vendor) return { success: false, error: "Unauthorized." }
        if (!(await checkRateLimit({ keyPrefix: "vendor-order-action", limit: 30, windowSeconds: 60 }, vendor.userId)).success) {
            return { success: false, error: "Too many order updates. Please try again shortly." }
        }
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session?.user) return { success: false, error: "You must be signed in." }
        const idempotency = idempotencyResponse(await beginIdempotency(
            "create-order-shipment",
            parsed.data.idempotencyKey ?? crypto.randomUUID(),
            session.user.id,
            parsed.data,
        ))
        if (idempotency.handled) return idempotency.response
        idempotencyId = idempotency.id
        const [order] = await db.select({
            id: businessOrdersTable.id,
            status: businessOrdersTable.status,
        }).from(businessOrdersTable).where(and(
            eq(businessOrdersTable.id, parsed.data.orderId),
            eq(businessOrdersTable.vendorId, vendor.manufacturerId),
        )).limit(1)
        if (!order || order.status !== "quality_check") {
            const response = { success: false, error: "Only orders that passed quality check can be dispatched." }
            await completeIdempotency(idempotency.id, response)
            return response
        }
        await db.transaction(async (tx) => {
            await tx.insert(orderShipmentsTable).values({
                id: crypto.randomUUID(),
                orderId: order.id,
                vendorId: vendor.manufacturerId,
                courierPartner: parsed.data.courierPartner,
                trackingNumber: parsed.data.trackingNumber,
                trackingUrl: parsed.data.trackingUrl || null,
                numberOfBoxes: parsed.data.numberOfBoxes,
                status: "label_created",
                estimatedDeliveryDate: parsed.data.estimatedDeliveryDate ? new Date(parsed.data.estimatedDeliveryDate) : null,
                notes: parsed.data.notes || null,
            })
            await tx.update(businessOrdersTable).set({
                status: "dispatched",
                dispatchedAt: new Date(),
                expectedDeliveryDate: parsed.data.estimatedDeliveryDate ? new Date(parsed.data.estimatedDeliveryDate) : null,
                updatedAt: new Date(),
            })
                .where(and(eq(businessOrdersTable.id, order.id), eq(businessOrdersTable.status, "quality_check")))
            await tx.insert(orderFulfillmentMilestonesTable).values({
                id: crypto.randomUUID(),
                orderId: order.id,
                vendorId: vendor.manufacturerId,
                status: "dispatched",
                actorUserId: vendor.userId,
                actorRole: "manufacturer",
                note: parsed.data.notes || null,
                stage: "dispatched",
                title: "Dispatched",
                description: `Shipment handed to ${parsed.data.courierPartner}.`,
            })
            await tx.update(businessOrderItemsTable).set({ status: "dispatched" })
                .where(eq(businessOrderItemsTable.orderId, order.id))
        })
        revalidatePath("/manufacturer/order-dashboard")
        revalidatePath("/business/orders")
        const response = { success: true as const }
        await completeIdempotency(idempotency.id, response)
        return response
    } catch (error) {
        console.error("Error creating shipment:", error)
        if (idempotencyId) await completeIdempotency(idempotencyId, { success: false, error: "Could not create shipment." })
        return { success: false, error: "Could not create shipment." }
    }
}

// ── 1. Fetch Vendor Dashboard Data from Real DB ─────────────────────────────
export async function getVendorDashboardData() {
    const vendor = await getAuthenticatedVendor()
    if (!vendor) return null

    // Run parallel queries against real database
    const [offerings, orders] = await Promise.all([
        // Real offerings
        db
            .select()
            .from(offeringsTable)
            .where(
                and(
                    eq(offeringsTable.vendorId, vendor.manufacturerId),
                    isNull(offeringsTable.deletedAt)
                )
            )
            .orderBy(desc(offeringsTable.createdAt)),

        // Real orders with requested offering items
        getVendorOrdersWithItems(vendor.manufacturerId),
    ])

    // Calculate actual earnings
    const nonCancelledOrders = orders.filter((o) => o.order.status !== "cancelled")
    const grossEarnings = nonCancelledOrders.reduce(
        (sum, o) => sum + parseFloat(o.order.total || "0"),
        0
    )
    const activeOrdersCount = nonCancelledOrders.filter(
        (o) => o.order.status !== "delivered"
    ).length

    return {
        vendor,
        metrics: {
            grossEarnings,
            totalOrders: nonCancelledOrders.length,
            activeOrdersCount,
            publishedOfferingsCount: offerings.length,
            activeOfferingsCount: offerings.filter((o) => o.status === "active").length,
        },
        offerings,
        orders,
    }
}

// ── 2. Create Packaging Offering (Direct DB Insert) ──────────────────────────
export interface CreateOfferingInput {
    category: string
    title: string
    description: string
    unitOfMeasure: "piece" | "pack" | "carton" | "kg" | "litre" | "roll" | "set"
    unitPrice: number
    taxPercent?: number
    priceIncludesTax?: boolean
    minOrderQuantity: number
    maxOrderQuantity?: number
    quantityStep?: number
    stockAvailable?: number
    fulfilmentMode: "made_to_order" | "ready_stock" | "service"
    leadTimeDaysMin: number
    leadTimeDaysMax: number
    shippingTerms: "vendor_pays" | "buyer_pays" | "included" | "pickup_only"
    city: string
    state: string
    pincode: string
    material?: string
    size?: string
    status?: "active" | "draft"
}

export async function createOfferingAction(input: CreateOfferingInput) {
    try {
        const vendor = await getAuthenticatedVendor()
        if (!vendor) {
            return { success: false, error: "Unauthorized. Please sign in as a vendor." }
        }

        const offeringId = crypto.randomUUID()
        const now = new Date()
        const validUntil = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) // 6 months

        await db.insert(offeringsTable).values({
            id: offeringId,
            vendorId: vendor.manufacturerId,
            vendorType: "manufacturer",
            offeringType: input.category,
            title: input.title,
            description: input.description,
            unitOfMeasure: input.unitOfMeasure,
            unitPrice: input.unitPrice.toFixed(4),
            currency: "INR",
            minOrderQuantity: input.minOrderQuantity,
            maxOrderQuantity: input.maxOrderQuantity || null,
            quantityStep: input.quantityStep || 1,
            stockAvailable: input.stockAvailable || null,
            fulfilmentMode: input.fulfilmentMode,
            leadTimeDaysMin: input.leadTimeDaysMin,
            leadTimeDaysMax: input.leadTimeDaysMax,
            taxPercent: (input.taxPercent ?? 18).toFixed(2),
            priceIncludesTax: input.priceIncludesTax ?? false,
            shippingTerms: input.shippingTerms,
            addressLine1: `${input.city} Manufacturing Facility`,
            city: input.city,
            state: input.state,
            pincode: input.pincode,
            country: "India",
            paymentTerms: "advance_50",
            sampleAvailable: true,
            validFrom: now,
            validUntil: validUntil,
            status: input.status || "active",
            attributes: {
                material: input.material || "Standard Packaging Board",
                size: input.size || "Standard",
            },
            createdBy: vendor.userId,
            createdAt: now,
            updatedAt: now,
        })

        // Index offering in vector database for buyer discovery
        triggerEntityEmbedding({
            entityType: "offer",
            entityId: offeringId,
            ownerId: vendor.manufacturerId,
            visibilityScope: "public",
            title: input.title,
            fullText: buildOfferingTemplate({
                title: input.title,
                offeringType: input.category,
                description: input.description,
                unitPrice: input.unitPrice,
                unitOfMeasure: input.unitOfMeasure,
                minOrderQuantity: input.minOrderQuantity,
                fulfilmentMode: input.fulfilmentMode,
                city: input.city,
                state: input.state,
                leadTimeDaysMin: input.leadTimeDaysMin,
                leadTimeDaysMax: input.leadTimeDaysMax,
            }),
            metadata: {
                title: input.title,
                category: input.category,
                unitPrice: input.unitPrice,
                minOrderQuantity: input.minOrderQuantity,
                vendorId: vendor.manufacturerId,
            },
        })

        revalidatePath("/manufacturer")
        revalidatePath("/manufacturer/offerings")
        return { success: true, offeringId }
    } catch (err: unknown) {
        console.error("Error creating offering:", err)
        const msg = err instanceof Error ? err.message : "Failed to publish offering."
        return { success: false, error: msg }
    }
}

// ── 3. Toggle Offering Status ────────────────────────────────────────────────
export async function toggleOfferingStatusAction(
    offeringId: string,
    newStatus: "active" | "paused" | "draft"
) {
    try {
        const vendor = await getAuthenticatedVendor()
        if (!vendor) return { success: false, error: "Unauthorized" }

        await db
            .update(offeringsTable)
            .set({ status: newStatus, updatedAt: new Date() })
            .where(
                and(
                    eq(offeringsTable.id, offeringId),
                    eq(offeringsTable.vendorId, vendor.manufacturerId)
                )
            )

        revalidatePath("/manufacturer")
        revalidatePath("/manufacturer/offerings")
        return { success: true }
    } catch (err: unknown) {
        console.error("Error toggling status:", err)
        return { success: false, error: "Failed to update offering status." }
    }
}

// ── 4. Delete Offering (Soft Delete) ─────────────────────────────────────────
export async function deleteOfferingAction(offeringId: string) {
    try {
        const vendor = await getAuthenticatedVendor()
        if (!vendor) return { success: false, error: "Unauthorized" }

        await db
            .update(offeringsTable)
            .set({ deletedAt: new Date() })
            .where(
                and(
                    eq(offeringsTable.id, offeringId),
                    eq(offeringsTable.vendorId, vendor.manufacturerId)
                )
            )

        revalidatePath("/manufacturer")
        revalidatePath("/manufacturer/offerings")
        return { success: true }
    } catch (err: unknown) {
        console.error("Error deleting offering:", err)
        return { success: false, error: "Failed to delete offering." }
    }
}

const transitionSchema = z.object({
    orderId: z.string().uuid(),
    to: z.enum(["confirmed", "rejected", "cancelled", "proof_pending", "proof_approved", "in_production", "quality_check", "delivered"]),
    reason: z.string().trim().min(3).max(1000).optional(),
    idempotencyKey: z.string().uuid().optional(),
})

export async function uploadProofAction(input: {
    orderId: string
    fileUrl: string
    note?: string
    idempotencyKey?: string
}) {
    const parsed = z.object({
        orderId: z.string().uuid(),
        fileUrl: z.string().url(),
        note: z.string().trim().max(2000).optional(),
        idempotencyKey: z.string().uuid().optional(),
    }).safeParse(input)
    if (!parsed.success) return { success: false, error: "A valid proof URL is required." }
    const vendor = await getAuthenticatedVendor()
    if (!vendor) return { success: false, error: "Unauthorized." }
    if (!(await checkRateLimit({ keyPrefix: "vendor-order-action", limit: 30, windowSeconds: 60 }, vendor.userId)).success) {
        return { success: false, error: "Too many order updates. Please try again shortly." }
    }
    const [order] = await db.select({ id: businessOrdersTable.id, status: businessOrdersTable.status })
        .from(businessOrdersTable).where(and(eq(businessOrdersTable.id, parsed.data.orderId), eq(businessOrdersTable.vendorId, vendor.manufacturerId))).limit(1)
    if (!order || !canTransition(order.status as OrderStatus, "proof_pending", "manufacturer")) {
        return { success: false, error: "A proof can only be uploaded after the order is confirmed." }
    }
    const [latest] = await db.select({ version: orderArtworkProofsTable.version }).from(orderArtworkProofsTable)
        .where(eq(orderArtworkProofsTable.orderId, order.id)).orderBy(desc(orderArtworkProofsTable.version)).limit(1)
    await db.transaction(async (tx) => {
        await tx.insert(orderArtworkProofsTable).values({
            id: crypto.randomUUID(), orderId: order.id, version: (latest?.version ?? 0) + 1,
            fileUrl: parsed.data.fileUrl, uploadedBy: vendor.userId,
        })
        await tx.update(businessOrdersTable).set({ status: "proof_pending", updatedAt: new Date() })
            .where(and(eq(businessOrdersTable.id, order.id), eq(businessOrdersTable.status, order.status)))
        await tx.insert(orderFulfillmentMilestonesTable).values({
            id: crypto.randomUUID(), orderId: order.id, vendorId: vendor.manufacturerId, status: "proof_pending",
            actorUserId: vendor.userId, actorRole: "manufacturer", stage: "artwork_approved",
            title: "Proof uploaded", note: parsed.data.note ?? null,
        })
    })
    revalidatePath("/manufacturer/order-dashboard")
    revalidatePath("/business/orders")
    return { success: true as const }
}

export async function transitionVendorOrderAction(input: z.input<typeof transitionSchema>) {
    let idempotencyId: string | null = null
    try {
        const parsed = transitionSchema.safeParse(input)
        if (!parsed.success) return { success: false, error: "Invalid order transition." }
        if ((parsed.data.to === "rejected" || parsed.data.to === "cancelled") && !parsed.data.reason) {
            return { success: false, error: "A reason is required for rejection or cancellation." }
        }
        const vendor = await getAuthenticatedVendor()
        if (!vendor) return { success: false, error: "Unauthorized" }
        if (!(await checkRateLimit({ keyPrefix: "vendor-order-action", limit: 30, windowSeconds: 60 }, vendor.userId)).success) {
            return { success: false, error: "Too many order updates. Please try again shortly." }
        }
        const idempotency = idempotencyResponse(await beginIdempotency(
            "transition-vendor-order",
            parsed.data.idempotencyKey ?? crypto.randomUUID(),
            vendor.userId,
            parsed.data,
        ))
        if (idempotency.handled) return idempotency.response
        idempotencyId = idempotency.id

        const [order] = await db
            .select({
                id: businessOrdersTable.id,
                status: businessOrdersTable.status,
                vendorId: businessOrdersTable.vendorId,
            })
            .from(businessOrdersTable)
            .where(and(
                eq(businessOrdersTable.id, parsed.data.orderId),
                eq(businessOrdersTable.vendorId, vendor.manufacturerId),
            ))
            .limit(1)

        if (!order) {
            const response = { success: false, error: "Order not found." }
            await completeIdempotency(idempotencyId, response)
            return response
        }
        if (order.status === parsed.data.to) {
            const response = { success: true as const }
            await completeIdempotency(idempotencyId, response)
            return response
        }

        if (!canTransition(order.status as OrderStatus, parsed.data.to, "manufacturer")) {
            const response = { success: false, error: `Order cannot move from ${order.status} to ${parsed.data.to}.` }
            await completeIdempotency(idempotencyId, response)
            return response
        }

        const updates: Record<string, unknown> = {
            status: parsed.data.to,
            updatedAt: new Date(),
        }
        if (parsed.data.to === "confirmed") updates.confirmedAt = new Date()
        if (parsed.data.to === "delivered") {
            updates.deliveredAt = new Date()
        }
        if (parsed.data.to === "rejected") updates.rejectReason = parsed.data.reason
        if (parsed.data.to === "cancelled") {
            updates.cancelReason = parsed.data.reason
            updates.cancelledAt = new Date()
            updates.cancellationRole = "manufacturer"
            updates.cancellationReason = parsed.data.reason
        }

        const milestoneByStatus: Partial<Record<OrderStatus, { stage: "order_confirmed" | "artwork_approved" | "raw_material_sourced" | "in_production" | "quality_check_passed" | "packed" | "dispatched" | "delivered"; title: string; description?: string }>> = {
            confirmed: {
                stage: "order_confirmed" as const,
                title: "Order confirmed",
                description: "The manufacturer accepted the buyer order.",
            },
            proof_pending: {
                stage: "artwork_approved",
                title: "Proof pending",
            },
            proof_approved: {
                stage: "artwork_approved",
                title: "Proof approved",
            },
            in_production: {
                stage: "in_production",
                title: "In production",
            },
            quality_check: {
                stage: "quality_check_passed",
                title: "Quality check",
            },
            delivered: {
                stage: "delivered",
                title: "Delivered",
            },
        }

        await db.transaction(async (tx) => {
            const updated = await tx.update(businessOrdersTable)
                .set(updates)
                .where(and(
                    eq(businessOrdersTable.id, parsed.data.orderId),
                    eq(businessOrdersTable.vendorId, vendor.manufacturerId),
                    eq(businessOrdersTable.status, order.status),
                ))
                .returning({ id: businessOrdersTable.id })
            if (!updated.length) throw new Error("ORDER_STATE_CHANGED")

            const milestone = milestoneByStatus[parsed.data.to]
            if (milestone) {
                await tx.insert(orderFulfillmentMilestonesTable).values({
                    id: crypto.randomUUID(),
                    orderId: parsed.data.orderId,
                    vendorId: vendor.manufacturerId,
                    status: parsed.data.to,
                    actorUserId: vendor.userId,
                    actorRole: "manufacturer",
                    note: parsed.data.reason || null,
                    ...milestone,
                })
            }

            await tx.update(businessOrderItemsTable)
                .set({ status: parsed.data.to })
                .where(eq(businessOrderItemsTable.orderId, parsed.data.orderId))
        })

        revalidatePath("/manufacturer")
        revalidatePath("/manufacturer/order-dashboard")
        revalidatePath("/business/orders")
        const response = { success: true as const }
        await completeIdempotency(idempotencyId, response)
        return response
    } catch (err: unknown) {
        console.error("Error updating order:", err)
        if (idempotencyId) {
            const error = err instanceof Error && err.message === "ORDER_STATE_CHANGED"
                ? "The order was updated by another request. Refresh and try again."
                : "Failed to update order status."
            await completeIdempotency(idempotencyId, { success: false, error })
        }
        return { success: false, error: "Failed to update order status." }
    }
}

export async function confirmOrderAction(orderId: string, idempotencyKey?: string) {
    return transitionVendorOrderAction({ orderId, to: "confirmed", idempotencyKey })
}

export async function rejectOrderAction(orderId: string, reason: string, idempotencyKey?: string) {
    return transitionVendorOrderAction({ orderId, to: "rejected", reason, idempotencyKey })
}

export async function cancelVendorOrderAction(orderId: string, reason: string, idempotencyKey?: string) {
    return transitionVendorOrderAction({ orderId, to: "cancelled", reason, idempotencyKey })
}

export async function dispatchOrderAction(input: {
    orderId: string
    courier: string
    trackingNumber: string
    trackingUrl?: string
    eta: string
    idempotencyKey?: string
}) {
    return createOrderShipmentAction({
        orderId: input.orderId,
        courierPartner: input.courier,
        trackingNumber: input.trackingNumber,
        trackingUrl: input.trackingUrl,
        estimatedDeliveryDate: input.eta,
        idempotencyKey: input.idempotencyKey,
    })
}

export async function respondToIssueAction(input: {
    orderId: string
    issueId: string
    response: string
    idempotencyKey?: string
}) {
    const parsed = z.object({
        orderId: z.string().uuid(),
        issueId: z.string().uuid(),
        response: z.string().trim().min(3).max(4000),
        idempotencyKey: z.string().uuid().optional(),
    }).safeParse(input)
    if (!parsed.success) return { success: false, error: "A response is required." }
    const vendor = await getAuthenticatedVendor()
    if (!vendor) return { success: false, error: "Unauthorized." }
    const [issue] = await db.select({ id: orderIssuesTable.id }).from(orderIssuesTable)
        .innerJoin(businessOrdersTable, eq(orderIssuesTable.orderId, businessOrdersTable.id))
        .where(and(
            eq(orderIssuesTable.id, parsed.data.issueId),
            eq(orderIssuesTable.orderId, parsed.data.orderId),
            eq(businessOrdersTable.vendorId, vendor.manufacturerId),
        )).limit(1)
    if (!issue) return { success: false, error: "Issue not found." }
    await db.update(orderIssuesTable).set({ vendorResponse: parsed.data.response }).where(eq(orderIssuesTable.id, issue.id))
    revalidatePath("/manufacturer/order-dashboard")
    revalidatePath(`/manufacturer/orders/${parsed.data.orderId}`)
    return { success: true as const }
}

export async function resolveIssueAction(input: { orderId: string; issueId: string; idempotencyKey?: string }) {
    const parsed = z.object({ orderId: z.string().uuid(), issueId: z.string().uuid(), idempotencyKey: z.string().uuid().optional() }).safeParse(input)
    if (!parsed.success) return { success: false, error: "Invalid issue." }
    const vendor = await getAuthenticatedVendor()
    if (!vendor) return { success: false, error: "Unauthorized." }
    const [issue] = await db.select({ id: orderIssuesTable.id }).from(orderIssuesTable)
        .innerJoin(businessOrdersTable, eq(orderIssuesTable.orderId, businessOrdersTable.id))
        .where(and(eq(orderIssuesTable.id, parsed.data.issueId), eq(orderIssuesTable.orderId, parsed.data.orderId), eq(businessOrdersTable.vendorId, vendor.manufacturerId))).limit(1)
    if (!issue) return { success: false, error: "Issue not found." }
    await db.update(orderIssuesTable).set({ status: "resolved", resolvedAt: new Date() }).where(eq(orderIssuesTable.id, issue.id))
    revalidatePath("/manufacturer/order-dashboard")
    revalidatePath(`/manufacturer/orders/${parsed.data.orderId}`)
    return { success: true as const }
}

export async function updateVendorNotesAction(input: { orderId: string; notes: string; idempotencyKey?: string }) {
    const parsed = z.object({ orderId: z.string().uuid(), notes: z.string().trim().max(4000), idempotencyKey: z.string().uuid().optional() }).safeParse(input)
    if (!parsed.success) return { success: false, error: "Invalid notes." }
    const vendor = await getAuthenticatedVendor()
    if (!vendor) return { success: false, error: "Unauthorized." }
    const updated = await db.update(businessOrdersTable).set({ vendorNotes: parsed.data.notes, updatedAt: new Date() })
        .where(and(eq(businessOrdersTable.id, parsed.data.orderId), eq(businessOrdersTable.vendorId, vendor.manufacturerId))).returning({ id: businessOrdersTable.id })
    if (!updated.length) return { success: false, error: "Order not found." }
    revalidatePath(`/manufacturer/orders/${parsed.data.orderId}`)
    return { success: true as const }
}

export async function advanceOrderAction(orderId: string, to: "in_production" | "quality_check", idempotencyKey?: string) {
    return transitionVendorOrderAction({ orderId, to, idempotencyKey })
}

export async function startProductionAction(orderId: string, idempotencyKey?: string) {
    return transitionVendorOrderAction({ orderId, to: "in_production", idempotencyKey })
}

export async function markQualityCheckAction(orderId: string, note?: string, idempotencyKey?: string) {
    return transitionVendorOrderAction({ orderId, to: "quality_check", reason: note, idempotencyKey })
}

export async function markDeliveredAction(orderId: string, idempotencyKey?: string) {
    return transitionVendorOrderAction({ orderId, to: "delivered", idempotencyKey })
}
