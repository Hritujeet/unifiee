"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema/business"
import {
    businessOrdersTable,
    businessOrderItemsTable,
} from "@/lib/db/schema/business-order"
import { businessRequirementsTable } from "@/lib/db/schema/business-requirement"
import { manufacturerTable } from "@/lib/db/schema/manufacturer"
import { offeringsTable } from "@/lib/db/schema/offering"
import {
    orderFulfillmentMilestonesTable,
    orderShipmentsTable,
    type OrderFulfillmentMilestone,
} from "@/lib/db/schema/vendor-fulfillment"
import { orderArtworkProofsTable, orderIssuesTable } from "@/lib/db/schema/order-lifecycle"
import { vendorQuotationsTable } from "@/lib/db/schema/vendor-quotation"
import { and, desc, eq, inArray, isNull } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { beginIdempotency, completeIdempotency, idempotencyResponse } from "@/lib/server/idempotency"
import { canTransition, type OrderStatus } from "@/lib/orders/lifecycle"
import { checkRateLimit } from "@/lib/server/rate-limit"

export type OrderActionResult<T = unknown> = {
    success: boolean
    error?: string
    data?: T
}

const addressSchema = z.object({
    line1: z.string().trim().min(1).max(255),
    line2: z.string().trim().max(255).optional(),
    city: z.string().trim().min(1).max(120),
    district: z.string().trim().max(120).optional(),
    state: z.string().trim().min(1).max(120),
    pincode: z.string().trim().min(1).max(16),
    country: z.string().trim().min(1).max(100).default("India"),
})

const itemSchema = z.object({
    title: z.string().trim().min(1).max(240),
    quantity: z.number().int().positive(),
    offeringId: z.string().uuid().optional(),
})

const createOrderSchema = z.object({
    quoteId: z.string().uuid(),
    businessId: z.string().uuid(),
    vendorId: z.string().uuid().optional(),
    totalAmount: z.coerce.number().nonnegative(),
    items: z.array(itemSchema).min(1),
    shippingAddress: addressSchema,
    idempotencyKey: z.string().uuid().optional(),
})

const createOfferingOrderSchema = z.object({
    offeringId: z.string().uuid(),
    businessId: z.string().uuid(),
    quantity: z.number().int().positive(),
    shippingAddress: addressSchema,
    idempotencyKey: z.string().uuid().optional(),
})

async function getBusinessForSession() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return null

    const [profile] = await db
        .select({ id: business.id })
        .from(business)
        .where(eq(business.userId, session.user.id))
        .limit(1)

    return profile ?? null
}

export async function createOrderFromQuoteAction(
    input: z.input<typeof createOrderSchema>
): Promise<OrderActionResult<{ orderId: string; orderNumber: string; status: "placed" }>> {
    let idempotencyId: string | null = null
    try {
        const parsed = createOrderSchema.safeParse(input)
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid order details." }
        }

        const profile = await getBusinessForSession()
        if (!profile || profile.id !== parsed.data.businessId) {
            return { success: false, error: "You are not authorized to create this order." }
        }
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session?.user) return { success: false, error: "You must be signed in." }
        if (!(await checkRateLimit({ keyPrefix: "order-placement", limit: 10, windowSeconds: 60 }, session.user.id)).success) {
            return { success: false, error: "Too many order attempts. Please try again shortly." }
        }
        const idempotencyKey = parsed.data.idempotencyKey ?? crypto.randomUUID()
        const requestPayload = { ...parsed.data, totalAmount: undefined }
        const idempotency = idempotencyResponse(await beginIdempotency(
            "create-order-from-quote",
            idempotencyKey,
            session.user.id,
            requestPayload,
        ))
        if (idempotency.handled) {
            return idempotency.response as OrderActionResult<{ orderId: string; orderNumber: string; status: "placed" }>
        }
        idempotencyId = idempotency.id

        const [quote] = await db
            .select({
                id: vendorQuotationsTable.id,
                vendorId: vendorQuotationsTable.vendorId,
                requirementId: vendorQuotationsTable.requirementId,
                totalPrice: vendorQuotationsTable.totalPrice,
                currency: vendorQuotationsTable.currency,
                paymentTerms: vendorQuotationsTable.paymentTerms,
                shippingTerms: vendorQuotationsTable.shippingTerms,
                quantity: vendorQuotationsTable.quantity,
                unitPrice: vendorQuotationsTable.unitPrice,
                productionLeadTimeDays: vendorQuotationsTable.productionLeadTimeDays,
                estimatedDeliveryDays: vendorQuotationsTable.estimatedDeliveryDays,
                specs: vendorQuotationsTable.specs,
                requirementTitle: businessRequirementsTable.title,
                requirementPackagingType: businessRequirementsTable.packagingType,
            })
            .from(vendorQuotationsTable)
            .innerJoin(
                businessRequirementsTable,
                eq(vendorQuotationsTable.requirementId, businessRequirementsTable.id)
            )
            .where(and(
                eq(vendorQuotationsTable.id, parsed.data.quoteId),
                eq(vendorQuotationsTable.status, "pending"),
                eq(businessRequirementsTable.businessId, profile.id),
            ))
            .limit(1)

        if (!quote) {
            const response = { success: false, error: "This offer is no longer available." }
            await completeIdempotency(idempotency.id, response)
            return response
        }
        if (parsed.data.vendorId && parsed.data.vendorId !== quote.vendorId) {
            const response = { success: false, error: "The selected vendor does not match this offer." }
            await completeIdempotency(idempotency.id, response)
            return response
        }

        const selectedOfferingId = parsed.data.items[0]?.offeringId
            ?? (typeof quote.specs?.offeringId === "string" ? quote.specs.offeringId : undefined)
        const [offering] = selectedOfferingId
            ? await db.select().from(offeringsTable).where(and(
                eq(offeringsTable.id, selectedOfferingId),
                eq(offeringsTable.vendorId, quote.vendorId),
            )).limit(1)
            : await db.select().from(offeringsTable).where(eq(offeringsTable.vendorId, quote.vendorId)).limit(1)

        const orderId = crypto.randomUUID()
        const orderNumber = `UNF-${Date.now().toString(36).toUpperCase()}`
        const total = Number(quote.totalPrice).toFixed(2)
        const firstItem = parsed.data.items[0]
        const itemQuantity = firstItem?.quantity ?? quote.quantity
        const itemTitle = firstItem?.title || quote.requirementTitle

        await db.transaction(async (tx) => {
            await tx.insert(businessOrdersTable).values({
                id: orderId,
                orderNumber,
                quoteId: quote.id,
                businessId: profile.id,
                vendorId: quote.vendorId,
                status: "placed",
                placedBy: session.user.id,
                currency: quote.currency,
                subtotal: total,
                taxTotal: "0",
                shippingTotal: "0",
                total,
                paymentTerms: quote.paymentTerms,
                shippingAddressLine1: parsed.data.shippingAddress.line1,
                shippingAddressLine2: parsed.data.shippingAddress.line2 || null,
                shippingCity: parsed.data.shippingAddress.city,
                shippingDistrict: parsed.data.shippingAddress.district || null,
                shippingState: parsed.data.shippingAddress.state,
                shippingPincode: parsed.data.shippingAddress.pincode,
                shippingCountry: parsed.data.shippingAddress.country,
            })

            await tx.insert(businessOrderItemsTable).values({
                id: crypto.randomUUID(),
                orderId,
                offeringId: offering?.id ?? null,
                status: "placed",
                titleSnapshot: itemTitle,
                quantity: itemQuantity,
                unitOfMeasureSnapshot: offering?.unitOfMeasure ?? "piece",
                unitPriceSnapshot: offering?.unitPrice ?? quote.unitPrice,
                taxPercentSnapshot: offering?.taxPercent ?? "0",
                priceIncludesTaxSnapshot: offering?.priceIncludesTax ?? false,
                fulfilmentModeSnapshot: offering?.fulfilmentMode ?? "made_to_order",
                leadTimeDaysMinSnapshot: offering?.leadTimeDaysMin ?? quote.productionLeadTimeDays,
                leadTimeDaysMaxSnapshot: offering?.leadTimeDaysMax ?? quote.estimatedDeliveryDays,
                shippingTermsSnapshot: offering?.shippingTerms ?? quote.shippingTerms,
                hsnSacCodeSnapshot: offering?.hsnSacCode ?? null,
                imageUrlSnapshot: null,
            })

            await tx.insert(orderFulfillmentMilestonesTable).values({
                id: crypto.randomUUID(),
                orderId,
                vendorId: quote.vendorId,
                stage: "order_confirmed",
                status: "placed",
                actorUserId: session.user.id,
                actorRole: "business",
                note: "The buyer accepted the vendor offer and placed this order.",
                title: "Order confirmed",
                description: "The buyer accepted the vendor offer and placed this order.",
            })

            await tx.update(vendorQuotationsTable)
                .set({ status: "accepted", acceptedAt: new Date() })
                .where(eq(vendorQuotationsTable.id, quote.id))
            await tx.update(vendorQuotationsTable)
                .set({ status: "rejected" })
                .where(and(
                    eq(vendorQuotationsTable.requirementId, quote.requirementId),
                    eq(vendorQuotationsTable.status, "pending"),
                ))
        })

        revalidatePath("/business/orders")
        revalidatePath("/business/offers")
        revalidatePath("/manufacturer/order-dashboard")
        const response = { success: true as const, data: { orderId, orderNumber, status: "placed" as const } }
        await completeIdempotency(idempotency.id, response)
        return response
    } catch (error) {
        console.error("Error creating order from quote:", error)
        if (idempotencyId) {
            await completeIdempotency(idempotencyId, { success: false, error: "Could not create the order. Please try again." })
        }
        return { success: false, error: "Could not create the order. Please try again." }
    }
}

export async function createOrderFromOfferingAction(
    input: z.input<typeof createOfferingOrderSchema>
): Promise<OrderActionResult<{ orderId: string; orderNumber: string; status: "placed" }>> {
    let idempotencyId: string | null = null
    try {
        const parsed = createOfferingOrderSchema.safeParse(input)
        if (!parsed.success) return { success: false, error: "Enter a valid quantity and shipping address." }
        const profile = await getBusinessForSession()
        if (!profile || profile.id !== parsed.data.businessId) return { success: false, error: "You are not authorized to place this order." }
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session?.user) return { success: false, error: "You must be signed in." }
        if (!(await checkRateLimit({ keyPrefix: "order-placement", limit: 10, windowSeconds: 60 }, session.user.id)).success) {
            return { success: false, error: "Too many order attempts. Please try again shortly." }
        }
        const idempotency = idempotencyResponse(await beginIdempotency(
            "create-order-from-offering",
            parsed.data.idempotencyKey ?? crypto.randomUUID(),
            session.user.id,
            parsed.data,
        ))
        if (idempotency.handled) return idempotency.response as OrderActionResult<{ orderId: string; orderNumber: string; status: "placed" }>
        idempotencyId = idempotency.id
        const [offering] = await db.select().from(offeringsTable).where(and(
            eq(offeringsTable.id, parsed.data.offeringId),
            eq(offeringsTable.status, "active"),
            isNull(offeringsTable.deletedAt),
        )).limit(1)
        if (!offering || offering.validUntil <= new Date()) {
            const response = { success: false, error: "This offering is no longer available." }
            await completeIdempotency(idempotency.id, response)
            return response
        }
        if (parsed.data.quantity < offering.minOrderQuantity ||
            (offering.maxOrderQuantity !== null && parsed.data.quantity > offering.maxOrderQuantity) ||
            parsed.data.quantity % offering.quantityStep !== 0) {
            const response = { success: false, error: `Quantity must be in increments of ${offering.quantityStep}, starting at ${offering.minOrderQuantity}.` }
            await completeIdempotency(idempotency.id, response)
            return response
        }
        const orderId = crypto.randomUUID()
        const orderNumber = `UNF-${Date.now().toString(36).toUpperCase()}`
        const subtotal = (Number(offering.unitPrice) * parsed.data.quantity).toFixed(2)
        await db.transaction(async (tx) => {
            await tx.insert(businessOrdersTable).values({
                id: orderId, orderNumber, quoteId: null, businessId: profile.id, vendorId: offering.vendorId,
                status: "placed", placedBy: session.user.id, currency: offering.currency, subtotal, taxTotal: "0", shippingTotal: "0", total: subtotal,
                paymentTerms: offering.paymentTerms, shippingAddressLine1: parsed.data.shippingAddress.line1,
                shippingAddressLine2: parsed.data.shippingAddress.line2 || null, shippingCity: parsed.data.shippingAddress.city,
                shippingDistrict: parsed.data.shippingAddress.district || null, shippingState: parsed.data.shippingAddress.state,
                shippingPincode: parsed.data.shippingAddress.pincode, shippingCountry: parsed.data.shippingAddress.country,
            })
            await tx.insert(businessOrderItemsTable).values({
                id: crypto.randomUUID(), orderId, offeringId: offering.id, status: "placed", titleSnapshot: offering.title,
                quantity: parsed.data.quantity, unitOfMeasureSnapshot: offering.unitOfMeasure, unitPriceSnapshot: offering.unitPrice,
                taxPercentSnapshot: offering.taxPercent, priceIncludesTaxSnapshot: offering.priceIncludesTax,
                fulfilmentModeSnapshot: offering.fulfilmentMode, leadTimeDaysMinSnapshot: offering.leadTimeDaysMin,
                leadTimeDaysMaxSnapshot: offering.leadTimeDaysMax, shippingTermsSnapshot: offering.shippingTerms,
                hsnSacCodeSnapshot: offering.hsnSacCode, imageUrlSnapshot: null,
            })
            await tx.insert(orderFulfillmentMilestonesTable).values({
                id: crypto.randomUUID(), orderId, vendorId: offering.vendorId, stage: "order_confirmed", status: "placed",
                actorUserId: session.user.id, actorRole: "business",
                title: "Order placed", description: "The buyer placed an order directly from a vendor offering.",
            })
        })
        revalidatePath("/business/orders")
        revalidatePath("/business/offers")
        revalidatePath("/manufacturer/order-dashboard")
        const response = { success: true as const, data: { orderId, orderNumber, status: "placed" as const } }
        await completeIdempotency(idempotency.id, response)
        return response
    } catch (error) {
        console.error("Error creating order from offering:", error)
        if (idempotencyId) await completeIdempotency(idempotencyId, { success: false, error: "Could not place the order. Please try again." })
        return { success: false, error: "Could not place the order. Please try again." }
    }
}
export async function cancelOrderAction(input: {
    orderId: string
    role: "business" | "manufacturer"
    reason: string
    idempotencyKey?: string
}): Promise<OrderActionResult<{ orderId: string }>> {
    let idempotencyId: string | null = null
    try {
        const parsed = z.object({
            orderId: z.string().uuid(),
            role: z.enum(["business", "manufacturer"]),
            reason: z.string().trim().min(3).max(1000),
            idempotencyKey: z.string().uuid().optional(),
        }).safeParse(input)
        if (!parsed.success) return { success: false, error: "A valid cancellation reason is required." }
        if (parsed.data.role !== "business") return { success: false, error: "Manufacturers cannot cancel orders; reject them before confirmation." }

        const session = await auth.api.getSession({ headers: await headers() })
        if (!session?.user) return { success: false, error: "You must be signed in." }
        const idempotency = idempotencyResponse(await beginIdempotency(
            "cancel-order",
            parsed.data.idempotencyKey ?? crypto.randomUUID(),
            session.user.id,
            parsed.data,
        ))
        if (idempotency.handled) {
            return idempotency.response as OrderActionResult<{ orderId: string }>
        }
        idempotencyId = idempotency.id

        const [buyer] = await db.select({ id: business.id }).from(business)
            .where(eq(business.userId, session.user.id)).limit(1)
        const [vendor] = await db.select({ id: manufacturerTable.id }).from(manufacturerTable)
            .where(eq(manufacturerTable.userId, session.user.id)).limit(1)
        const ownerId = parsed.data.role === "business" ? buyer?.id : vendor?.id
        const ownerColumn = parsed.data.role === "business"
            ? eq(businessOrdersTable.businessId, ownerId ?? "")
            : eq(businessOrdersTable.vendorId, ownerId ?? "")

        const [current] = await db.select({ id: businessOrdersTable.id, status: businessOrdersTable.status, vendorId: businessOrdersTable.vendorId })
            .from(businessOrdersTable)
            .where(and(eq(businessOrdersTable.id, parsed.data.orderId), ownerColumn))
            .limit(1)
        if (!current || !canTransition(current.status as OrderStatus, "cancelled", "business")) {
            const response = { success: false, error: "This order cannot be cancelled after production has started." }
            await completeIdempotency(idempotencyId, response)
            return response
        }
        const updated = await db.transaction(async (tx) => {
            const rows = await tx.update(businessOrdersTable).set({
                status: "cancelled",
                cancelledAt: new Date(),
                cancellationRole: parsed.data.role,
                cancellationReason: parsed.data.reason,
                updatedAt: new Date(),
            }).where(and(eq(businessOrdersTable.id, parsed.data.orderId), ownerColumn, eq(businessOrdersTable.status, current.status)))
                .returning({ id: businessOrdersTable.id })
            if (rows.length) {
                await tx.insert(orderFulfillmentMilestonesTable).values({
                    id: crypto.randomUUID(),
                    orderId: parsed.data.orderId,
                    vendorId: current.vendorId,
                    status: "cancelled",
                    actorUserId: session.user.id,
                    actorRole: "business",
                    stage: "order_confirmed",
                    title: "Order cancelled",
                    note: parsed.data.reason,
                })
            }
            return rows
        })

        if (!updated.length) {
            const response = { success: false, error: "This order cannot be cancelled." }
            await completeIdempotency(idempotencyId, response)
            return response
        }

        revalidatePath("/business/orders")
        revalidatePath("/manufacturer/order-dashboard")
        const response = { success: true as const, data: { orderId: updated[0].id } }
        await completeIdempotency(idempotencyId, response)
        return response
    } catch (error) {
        console.error("Error cancelling order:", error)
        if (idempotencyId) {
            await completeIdempotency(idempotencyId, { success: false, error: "Could not cancel the order. Please try again." })
        }
        return { success: false, error: "Could not cancel the order. Please try again." }
    }
}

export type BusinessOrderSummary = {
    order: typeof businessOrdersTable.$inferSelect
    vendorName: string
    requirementTitle: string | null
    packagingType: string | null
    quantity: number | null
    milestones: OrderFulfillmentMilestone[]
    shipment: typeof orderShipmentsTable.$inferSelect | null
}

export async function getBusinessOrdersAction(
    businessId?: string
): Promise<OrderActionResult<BusinessOrderSummary[]>> {
    try {
        const profile = await getBusinessForSession()
        if (!profile || (businessId && businessId !== profile.id)) {
            return { success: false, error: "Unauthorized." }
        }

        const rows = await db.select({
            order: businessOrdersTable,
            vendorName: manufacturerTable.companyName,
            requirementTitle: businessRequirementsTable.title,
            packagingType: businessRequirementsTable.packagingType,
            quantity: vendorQuotationsTable.quantity,
        }).from(businessOrdersTable)
            .innerJoin(manufacturerTable, eq(businessOrdersTable.vendorId, manufacturerTable.id))
            .leftJoin(vendorQuotationsTable, eq(businessOrdersTable.quoteId, vendorQuotationsTable.id))
            .leftJoin(businessRequirementsTable, eq(vendorQuotationsTable.requirementId, businessRequirementsTable.id))
            .where(eq(businessOrdersTable.businessId, profile.id))
            .orderBy(desc(businessOrdersTable.createdAt))

        const orderIds = rows.map(({ order }) => order.id)
        const milestones = orderIds.length
            ? await db.select().from(orderFulfillmentMilestonesTable)
                .where(inArray(orderFulfillmentMilestonesTable.orderId, orderIds))
                .orderBy(desc(orderFulfillmentMilestonesTable.completedAt))
            : []
        const shipments = orderIds.length
            ? await db.select().from(orderShipmentsTable)
                .where(inArray(orderShipmentsTable.orderId, orderIds))
            : []

        return {
            success: true,
            data: rows.map((row) => ({
                ...row,
                milestones: milestones.filter((milestone) => milestone.orderId === row.order.id),
                shipment: shipments.find((shipment) => shipment.orderId === row.order.id) ?? null,
            })),
        }
    } catch (error) {
        console.error("Error fetching business orders:", error)
        return { success: false, error: "Could not load orders." }
    }
}

export type BusinessQuoteSummary = {
    id: string
    requirementId: string
    requirementTitle: string
    packagingType: string
    vendorId: string
    vendorName: string
    vendorLocation: string
    unitPrice: string
    totalPrice: string
    quantity: number
    productionTime: string
    deliveryEstimate: string
    status: "pending" | "accepted" | "rejected" | "withdrawn" | "expired"
    receivedAt: Date
    deliveryLocation: string
}

export async function getBusinessQuotesAction(): Promise<OrderActionResult<BusinessQuoteSummary[]>> {
    try {
        const profile = await getBusinessForSession()
        if (!profile) return { success: false, error: "Unauthorized." }

        const rows = await db.select({
            id: vendorQuotationsTable.id,
            requirementId: vendorQuotationsTable.requirementId,
            requirementTitle: businessRequirementsTable.title,
            packagingType: businessRequirementsTable.packagingType,
            vendorId: vendorQuotationsTable.vendorId,
            vendorName: manufacturerTable.companyName,
            vendorLocation: manufacturerTable.manufacturerAddress,
            unitPrice: vendorQuotationsTable.unitPrice,
            totalPrice: vendorQuotationsTable.totalPrice,
            quantity: vendorQuotationsTable.quantity,
            productionLeadTimeDays: vendorQuotationsTable.productionLeadTimeDays,
            estimatedDeliveryDays: vendorQuotationsTable.estimatedDeliveryDays,
            status: vendorQuotationsTable.status,
            receivedAt: vendorQuotationsTable.createdAt,
            deliveryLocation: businessRequirementsTable.deliveryLocation,
        }).from(vendorQuotationsTable)
            .innerJoin(businessRequirementsTable, eq(vendorQuotationsTable.requirementId, businessRequirementsTable.id))
            .innerJoin(manufacturerTable, eq(vendorQuotationsTable.vendorId, manufacturerTable.id))
            .where(eq(businessRequirementsTable.businessId, profile.id))
            .orderBy(desc(vendorQuotationsTable.createdAt))

        return {
            success: true,
            data: rows.map((row) => ({
                ...row,
                vendorLocation: row.vendorLocation ?? "Location unavailable",
                productionTime: `${row.productionLeadTimeDays} days`,
                deliveryEstimate: `${row.estimatedDeliveryDays} days`,
            })),
        }
    } catch (error) {
        console.error("Error fetching business quotes:", error)
        return { success: false, error: "Could not load offers." }
    }
}

const orderIdSchema = z.object({
    orderId: z.string().uuid(),
    idempotencyKey: z.string().uuid().optional(),
})

async function getBusinessSession() {
    const session = await auth.api.getSession({ headers: await headers() })
    const profile = session?.user ? await getBusinessForSession() : null
    return session?.user && profile ? { session, profile } : null
}

export async function confirmDeliveryAction(input: z.input<typeof orderIdSchema>) {
    const parsed = orderIdSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: "Invalid order." }
    const context = await getBusinessSession()
    if (!context) return { success: false, error: "Unauthorized." }
    const [order] = await db.select({ id: businessOrdersTable.id, vendorId: businessOrdersTable.vendorId, status: businessOrdersTable.status })
        .from(businessOrdersTable)
        .where(and(eq(businessOrdersTable.id, parsed.data.orderId), eq(businessOrdersTable.businessId, context.profile.id)))
        .limit(1)
    if (!order || !canTransition(order.status as OrderStatus, "completed", "business")) {
        if (order?.status === "completed") return { success: true as const }
        return { success: false, error: "Delivery can only be confirmed after the vendor marks the order delivered." }
    }
    await db.transaction(async (tx) => {
        await tx.update(businessOrdersTable).set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
            .where(and(eq(businessOrdersTable.id, order.id), eq(businessOrdersTable.status, order.status)))
        await tx.insert(orderFulfillmentMilestonesTable).values({
            id: crypto.randomUUID(), orderId: order.id, vendorId: order.vendorId,
            status: "completed", actorUserId: context.session.user.id, actorRole: "business",
            stage: "delivered", title: "Delivery confirmed", note: "The business confirmed delivery.",
        })
    })
    revalidatePath("/business/orders")
    revalidatePath(`/business/orders/${order.id}`)
    return { success: true as const }
}

export async function raiseOrderIssueAction(input: { orderId: string; description: string; idempotencyKey?: string }) {
    const parsed = z.object({
        orderId: z.string().uuid(),
        description: z.string().trim().min(5).max(4000),
        idempotencyKey: z.string().uuid().optional(),
    }).safeParse(input)
    if (!parsed.success) return { success: false, error: "Describe the issue before submitting it." }
    const context = await getBusinessSession()
    if (!context) return { success: false, error: "Unauthorized." }
    const [order] = await db.select({ id: businessOrdersTable.id }).from(businessOrdersTable)
        .where(and(eq(businessOrdersTable.id, parsed.data.orderId), eq(businessOrdersTable.businessId, context.profile.id))).limit(1)
    if (!order) return { success: false, error: "Order not found." }
    await db.insert(orderIssuesTable).values({
        id: crypto.randomUUID(), orderId: order.id, raisedBy: context.session.user.id, description: parsed.data.description,
    })
    revalidatePath(`/business/orders/${order.id}`)
    return { success: true as const }
}

export async function approveProofAction(input: z.input<typeof orderIdSchema>) {
    return decideProof(input, "approved")
}

export async function requestProofChangesAction(input: { orderId: string; feedback: string; idempotencyKey?: string }) {
    const parsed = z.object({ orderId: z.string().uuid(), feedback: z.string().trim().min(3).max(2000), idempotencyKey: z.string().uuid().optional() }).safeParse(input)
    if (!parsed.success) return { success: false, error: "Feedback is required." }
    return decideProof(parsed.data, "changes_requested", parsed.data.feedback)
}

async function decideProof(input: z.input<typeof orderIdSchema>, status: "approved" | "changes_requested", feedback?: string) {
    const parsed = orderIdSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: "Invalid order." }
    const context = await getBusinessSession()
    if (!context) return { success: false, error: "Unauthorized." }
    const [order] = await db.select({ id: businessOrdersTable.id, vendorId: businessOrdersTable.vendorId, status: businessOrdersTable.status })
        .from(businessOrdersTable).where(and(eq(businessOrdersTable.id, parsed.data.orderId), eq(businessOrdersTable.businessId, context.profile.id))).limit(1)
    if (!order || order.status !== "proof_pending") return { success: false, error: "This order has no proof awaiting review." }
    const [proof] = await db.select().from(orderArtworkProofsTable)
        .where(and(eq(orderArtworkProofsTable.orderId, order.id), eq(orderArtworkProofsTable.status, "pending")))
        .orderBy(desc(orderArtworkProofsTable.version)).limit(1)
    if (!proof) return { success: false, error: "No pending proof was found." }
    await db.transaction(async (tx) => {
        await tx.update(orderArtworkProofsTable).set({ status, feedback: feedback ?? null, decidedBy: context.session.user.id, decidedAt: new Date() }).where(eq(orderArtworkProofsTable.id, proof.id))
        if (status === "approved") {
            await tx.update(businessOrdersTable).set({ status: "proof_approved", updatedAt: new Date() }).where(eq(businessOrdersTable.id, order.id))
            await tx.insert(orderFulfillmentMilestonesTable).values({
                id: crypto.randomUUID(), orderId: order.id, vendorId: order.vendorId, status: "proof_approved",
                actorUserId: context.session.user.id, actorRole: "business", stage: "artwork_approved",
                title: "Proof approved", note: "The business approved the artwork proof.",
            })
        }
    })
    revalidatePath("/business/orders")
    revalidatePath(`/business/orders/${order.id}`)
    return { success: true as const }
}
