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
    type OrderFulfillmentMilestone,
} from "@/lib/db/schema/vendor-fulfillment"
import { vendorQuotationsTable } from "@/lib/db/schema/vendor-quotation"
import { and, desc, eq, inArray } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { beginIdempotency, completeIdempotency, idempotencyResponse } from "@/lib/server/idempotency"

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
): Promise<OrderActionResult<{ orderId: string; orderNumber: string; status: "confirmed" }>> {
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
        const idempotencyKey = parsed.data.idempotencyKey ?? crypto.randomUUID()
        const requestPayload = { ...parsed.data, totalAmount: undefined }
        const idempotency = idempotencyResponse(await beginIdempotency(
            "create-order-from-quote",
            idempotencyKey,
            session.user.id,
            requestPayload,
        ))
        if (idempotency.handled) {
            return idempotency.response as OrderActionResult<{ orderId: string; orderNumber: string; status: "confirmed" }>
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
                businessId: profile.id,
                vendorId: quote.vendorId,
                status: "confirmed",
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
                status: "confirmed",
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
                title: "Order confirmed",
                description: "The buyer accepted the vendor offer and placed this order.",
            })

            await tx.update(vendorQuotationsTable)
                .set({ status: "accepted", acceptedAt: new Date() })
                .where(eq(vendorQuotationsTable.id, quote.id))
        })

        revalidatePath("/business/orders")
        revalidatePath("/business/offers")
        revalidatePath("/manufacturer/order-dashboard")
        const response = { success: true as const, data: { orderId, orderNumber, status: "confirmed" as const } }
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

        const updated = await db.update(businessOrdersTable).set({
            status: "cancelled",
            cancelledAt: new Date(),
            cancellationRole: parsed.data.role,
            cancellationReason: parsed.data.reason,
            updatedAt: new Date(),
        }).where(and(
            eq(businessOrdersTable.id, parsed.data.orderId),
            ownerColumn,
            inArray(businessOrdersTable.status, ["draft", "submitted", "confirmed"]),
        )).returning({ id: businessOrdersTable.id })

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
    milestones: OrderFulfillmentMilestone[]
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
        }).from(businessOrdersTable)
            .innerJoin(manufacturerTable, eq(businessOrdersTable.vendorId, manufacturerTable.id))
            .where(eq(businessOrdersTable.businessId, profile.id))
            .orderBy(desc(businessOrdersTable.createdAt))

        const orderIds = rows.map(({ order }) => order.id)
        const milestones = orderIds.length
            ? await db.select().from(orderFulfillmentMilestonesTable)
                .where(inArray(orderFulfillmentMilestonesTable.orderId, orderIds))
                .orderBy(desc(orderFulfillmentMilestonesTable.completedAt))
            : []

        return {
            success: true,
            data: rows.map((row) => ({
                ...row,
                milestones: milestones.filter((milestone) => milestone.orderId === row.order.id),
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
