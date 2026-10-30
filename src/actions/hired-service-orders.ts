"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
    businessHiredServiceTable,
    hiredServiceEventsTable,
    hiredServiceMessagesTable,
    hiredServiceDeliveriesTable,
    designerReviewsTable,
    businessSavedServicesTable,
    type HiredServiceStatus,
} from "@/lib/db/schema/business-hired-service"
import { designerServiceTable, designerServicePackagesTable } from "@/lib/db/schema/designer-service"
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer"
import { business } from "@/lib/db/schema/business"
import { businessOrdersTable } from "@/lib/db/schema/business-order"
import { user } from "@/lib/db/schema/auth-schema"
import { canTransition, evaluateAutoTransitions } from "@/lib/hired-services/lifecycle"
import { beginIdempotency, completeIdempotency, idempotencyResponse } from "@/lib/server/idempotency"
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/server/rate-limit"
import { sendHiredServiceEmail } from "@/lib/email/notifications"
import { and, desc, eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

export type OrderActionResult<T = unknown> = {
    success: boolean
    error?: string
    data?: T
}

// Order brief validation schema
const orderBriefSchema = z.object({
    packagingType: z.string().trim().min(2, "Select or describe the packaging type.").max(100),
    dimensions: z.string().trim().min(2, "Specify dimensions (e.g. 10x15x5 cm).").max(100),
    material: z.string().trim().min(2, "Specify target material (e.g. Kraft paper 300gsm).").max(100),
    brandName: z.string().trim().min(2, "Brand name is required.").max(100),
    tagline: z.string().trim().max(200).optional(),
    colours: z.string().trim().max(200).optional(),
    fonts: z.string().trim().max(200).optional(),
    targetAudience: z.string().trim().min(5, "Tell us a bit about your target audience.").max(500),
    referenceLinks: z.string().trim().max(1000).optional(),
    dieline: z.enum(["provided", "needed", "custom"]),
    formats: z.string().trim().min(2, "Specify formats (e.g. AI, PDF, 3D render).").max(200),
    deadline: z.string().trim().optional(),
    notes: z.string().trim().max(2000).optional(),
})

const placeOrderInputSchema = z.object({
    serviceId: z.string().uuid(),
    packageTier: z.enum(["basic", "standard", "premium"]),
    selectedExtras: z.array(z.object({
        name: z.string(),
        price: z.number(),
        extraDays: z.number(),
    })).default([]),
    brief: orderBriefSchema,
    idempotencyKey: z.string().min(8),
})

/**
 * Places a new design order with snapshotting, double-submit protection, and validation
 */
export async function placeDesignOrderAction(
    input: z.infer<typeof placeOrderInputSchema>
): Promise<OrderActionResult<{ orderId: string }>> {
    const parsed = placeOrderInputSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid order details." }
    }

    const reqHeaders = await headers()
    const session = await auth.api.getSession({ headers: reqHeaders })
    if (!session?.user) {
        return { success: false, error: "Please sign in to place an order." }
    }

    // 1. Get current business profile
    const [biz] = await db
        .select()
        .from(business)
        .where(eq(business.userId, session.user.id))
        .limit(1)

    if (!biz) {
        return { success: false, error: "Only registered business accounts can place design orders." }
    }

    // 2. Idempotency double-submit check
    const idempotency = idempotencyResponse(await beginIdempotency(
        "place-design-order",
        parsed.data.idempotencyKey,
        session.user.id,
        { serviceId: parsed.data.serviceId, tier: parsed.data.packageTier }
    ))
    if (idempotency.handled) {
        return idempotency.response as OrderActionResult<{ orderId: string }>
    }

    // 3. Rate limit: 10 orders per 15 minutes
    const clientIp = getClientIpFromHeaders(reqHeaders)
    const rateCheck = await checkRateLimit(
        { keyPrefix: "place-order", limit: 10, windowSeconds: 900 },
        `${biz.id}:${clientIp}`
    )
    if (!rateCheck.success) {
        await completeIdempotency(idempotency.id, { success: false, error: "Too many order requests. Please wait a moment." })
        return { success: false, error: "Too many order requests. Please wait a moment." }
    }

    // 4. Load gig, designer and package details
    const [gig] = await db
        .select({
            id: designerServiceTable.id,
            designerId: designerServiceTable.designerId,
            title: designerServiceTable.title,
            status: designerServiceTable.status,
            deletedAt: designerServiceTable.deletedAt,
            sampleImages: designerServiceTable.sampleImages,
            designerName: packagingDesignerTable.displayName,
            fullName: packagingDesignerTable.fullName,
            designerEmail: packagingDesignerTable.email,
            designerUserId: packagingDesignerTable.userId,
        })
        .from(designerServiceTable)
        .innerJoin(packagingDesignerTable, eq(designerServiceTable.designerId, packagingDesignerTable.id))
        .where(eq(designerServiceTable.id, parsed.data.serviceId))
        .limit(1)

    if (!gig || gig.status !== "published" || gig.deletedAt) {
        const res = { success: false, error: "This design gig is currently paused, deleted, or unavailable." }
        await completeIdempotency(idempotency.id, res)
        return res
    }

    // Block hiring own gig
    if (gig.designerUserId === session.user.id) {
        const res = { success: false, error: "You cannot order your own design gig." }
        await completeIdempotency(idempotency.id, res)
        return res
    }

    // Load selected package tier
    const [pkg] = await db
        .select()
        .from(designerServicePackagesTable)
        .where(and(
            eq(designerServicePackagesTable.serviceId, gig.id),
            eq(designerServicePackagesTable.tier, parsed.data.packageTier)
        ))
        .limit(1)

    if (!pkg) {
        const res = { success: false, error: "The selected package tier is no longer available." }
        await completeIdempotency(idempotency.id, res)
        return res
    }

    // Calculate total price and delivery days
    const basePrice = Number(pkg.price)
    const extrasTotal = parsed.data.selectedExtras.reduce((sum, e) => sum + e.price, 0)
    const totalPrice = (basePrice + extrasTotal).toFixed(2)

    const baseDays = pkg.deliveryDays
    const extrasDays = parsed.data.selectedExtras.reduce((sum, e) => sum + (e.extraDays || 0), 0)
    const totalDeliveryDays = baseDays + extrasDays

    const orderId = crypto.randomUUID()
    const designerDisplayName = gig.designerName || gig.fullName

    try {
        await db.transaction(async (tx) => {
            // Insert hired service order snapshot
            await tx.insert(businessHiredServiceTable).values({
                id: orderId,
                businessId: biz.id,
                serviceId: gig.id,
                designerId: gig.designerId,
                serviceTitle: gig.title,
                designerName: designerDisplayName,
                designerEmail: gig.designerEmail,
                packageTier: pkg.tier,
                packageName: pkg.name,
                price: totalPrice,
                deliveryDays: totalDeliveryDays,
                revisionsIncluded: pkg.revisionsIncluded,
                revisionsUsed: 0,
                extras: parsed.data.selectedExtras,
                brief: parsed.data.brief,
                sampleImage: gig.sampleImages?.[0] || null,
                status: "requested",
                pricingModel: "package",
                turnaroundDays: totalDeliveryDays,
            })

            // Record initial timeline event
            await tx.insert(hiredServiceEventsTable).values({
                id: crypto.randomUUID(),
                orderId,
                status: "requested",
                actorUserId: session.user.id,
                actorRole: "business",
                note: `Order placed for ${pkg.name} (₹${Number(totalPrice).toLocaleString("en-IN")}). Payment is arranged directly.`,
            })
        })

        // Fire-and-forget notification emails
        sendHiredServiceEmail({
            to: gig.designerEmail,
            recipientName: designerDisplayName,
            orderNumber: orderId.slice(0, 8).toUpperCase(),
            serviceTitle: gig.title,
            subject: `New Design Request: ${gig.title}`,
            headline: "You have a new project request on UNIFIÉE",
            body: `${biz.businessName} has ordered your ${pkg.name} package. Review the project brief and accept within 48 hours to start work.`,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/designer/orders/${orderId}`,
            actionLabel: "Review Project Request",
        })

        sendHiredServiceEmail({
            to: biz.email,
            recipientName: biz.ownerName || biz.businessName,
            orderNumber: orderId.slice(0, 8).toUpperCase(),
            serviceTitle: gig.title,
            subject: `Order Submitted: ${gig.title}`,
            headline: "Your packaging design request is submitted!",
            body: `Your request was sent to ${designerDisplayName}. The designer has 48 hours to accept. Note: Payment is arranged directly between you and the designer.`,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/business/hired-services/${orderId}`,
            actionLabel: "Track Your Order",
        })

        const result = { success: true, data: { orderId } }
        await completeIdempotency(idempotency.id, result)

        revalidatePath("/business/hired-services")
        revalidatePath("/designer/orders")
        return result
    } catch (error) {
        console.error("Order placement failed:", error)
        const errorRes = { success: false, error: "Failed to place order. Please try again." }
        await completeIdempotency(idempotency.id, errorRes)
        return errorRes
    }
}

/**
 * Designer responds to a project request (Accept or Decline)
 */
export async function respondToDesignRequestAction(input: {
    orderId: string
    action: "accept" | "decline"
    declineReason?: string
}): Promise<OrderActionResult> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false, error: "Unauthorized." }

    const [designer] = await db
        .select()
        .from(packagingDesignerTable)
        .where(eq(packagingDesignerTable.userId, session.user.id))
        .limit(1)

    if (!designer) return { success: false, error: "Designer profile not found." }

    const [order] = await db
        .select()
        .from(businessHiredServiceTable)
        .where(and(
            eq(businessHiredServiceTable.id, input.orderId),
            eq(businessHiredServiceTable.designerId, designer.id)
        ))
        .limit(1)

    if (!order) return { success: false, error: "Order not found." }

    const targetStatus = input.action === "accept" ? "active" : "declined"
    if (!canTransition(order.status as HiredServiceStatus, targetStatus, "designer")) {
        return { success: false, error: `Cannot transition from ${order.status} to ${targetStatus}.` }
    }

    if (input.action === "decline" && !input.declineReason?.trim()) {
        return { success: false, error: "Please provide a reason for declining." }
    }

    const now = new Date()
    const dueAt = input.action === "accept"
        ? new Date(now.getTime() + (order.deliveryDays || 7) * 24 * 60 * 60 * 1000)
        : null

    try {
        await db.transaction(async (tx) => {
            await tx.update(businessHiredServiceTable).set({
                status: targetStatus,
                dueAt: dueAt || order.dueAt,
                cancelReason: input.action === "decline" ? input.declineReason : null,
                updatedAt: now,
            }).where(eq(businessHiredServiceTable.id, order.id))

            await tx.insert(hiredServiceEventsTable).values({
                id: crypto.randomUUID(),
                orderId: order.id,
                status: targetStatus,
                actorUserId: session.user.id,
                actorRole: "designer",
                note: input.action === "accept"
                    ? `Order accepted. Work in progress. Delivery due by ${dueAt?.toLocaleDateString("en-IN")}.`
                    : `Order declined: ${input.declineReason}`,
            })
        })

        // Notify business
        const [biz] = await db.select().from(business).where(eq(business.id, order.businessId)).limit(1)
        if (biz) {
            sendHiredServiceEmail({
                to: biz.email,
                recipientName: biz.businessName,
                orderNumber: order.id.slice(0, 8).toUpperCase(),
                serviceTitle: order.serviceTitle,
                subject: input.action === "accept" ? `Order Accepted: ${order.serviceTitle}` : `Order Update: Request Declined`,
                headline: input.action === "accept" ? "Designer accepted your project!" : "Project Request Declined",
                body: input.action === "accept"
                    ? `${order.designerName} has accepted your brief and started working. Expected completion: ${dueAt?.toLocaleDateString("en-IN")}.`
                    : `${order.designerName} declined this request. Note: "${input.declineReason}".`,
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/business/hired-services/${order.id}`,
            })
        }

        revalidatePath(`/designer/orders/${order.id}`)
        revalidatePath(`/business/hired-services/${order.id}`)
        revalidatePath("/designer")
        revalidatePath("/business/hired-services")
        return { success: true }
    } catch (err) {
        console.error("Failed to respond to design request:", err)
        return { success: false, error: "Failed to update order status." }
    }
}

/**
 * Designer delivers design files / deliverables
 */
export async function deliverDesignWorkAction(input: {
    orderId: string
    files: string[]
    previewUrl?: string
    designerNote: string
}): Promise<OrderActionResult> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false, error: "Unauthorized." }

    const [designer] = await db
        .select()
        .from(packagingDesignerTable)
        .where(eq(packagingDesignerTable.userId, session.user.id))
        .limit(1)

    if (!designer) return { success: false, error: "Designer profile not found." }

    const [order] = await db
        .select()
        .from(businessHiredServiceTable)
        .where(and(
            eq(businessHiredServiceTable.id, input.orderId),
            eq(businessHiredServiceTable.designerId, designer.id)
        ))
        .limit(1)

    if (!order) return { success: false, error: "Order not found." }

    if (!canTransition(order.status as HiredServiceStatus, "delivered", "designer")) {
        return { success: false, error: `Cannot deliver artwork while order is in ${order.status} state.` }
    }

    if (!input.files || input.files.length === 0) {
        return { success: false, error: "Please attach at least one artwork file link or download URL." }
    }

    if (!input.designerNote?.trim()) {
        return { success: false, error: "Please add a delivery note describing the deliverables." }
    }

    try {
        await db.transaction(async (tx) => {
            // Count previous deliveries for versioning
            const existingDeliveries = await tx
                .select({ id: hiredServiceDeliveriesTable.id })
                .from(hiredServiceDeliveriesTable)
                .where(eq(hiredServiceDeliveriesTable.orderId, order.id))

            const nextVersion = existingDeliveries.length + 1

            await tx.insert(hiredServiceDeliveriesTable).values({
                id: crypto.randomUUID(),
                orderId: order.id,
                versionNumber: nextVersion,
                files: input.files,
                previewUrl: input.previewUrl || null,
                designerNote: input.designerNote,
            })

            await tx.update(businessHiredServiceTable).set({
                status: "delivered",
                updatedAt: new Date(),
            }).where(eq(businessHiredServiceTable.id, order.id))

            await tx.insert(hiredServiceEventsTable).values({
                id: crypto.randomUUID(),
                orderId: order.id,
                status: "delivered",
                actorUserId: session.user.id,
                actorRole: "designer",
                note: `Delivered Version ${nextVersion}: ${input.designerNote.slice(0, 200)}`,
            })
        })

        // Notify business
        const [biz] = await db.select().from(business).where(eq(business.id, order.businessId)).limit(1)
        if (biz) {
            sendHiredServiceEmail({
                to: biz.email,
                recipientName: biz.businessName,
                orderNumber: order.id.slice(0, 8).toUpperCase(),
                serviceTitle: order.serviceTitle,
                subject: `Work Delivered: ${order.serviceTitle}`,
                headline: "Designer has delivered your artwork files!",
                body: `${order.designerName} submitted a delivery for your project. Please review the files, accept delivery, or request revisions within 3 days.`,
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/business/hired-services/${order.id}`,
                actionLabel: "Review Delivered Files",
            })
        }

        revalidatePath(`/designer/orders/${order.id}`)
        revalidatePath(`/business/hired-services/${order.id}`)
        return { success: true }
    } catch (err) {
        console.error("Failed to deliver work:", err)
        return { success: false, error: "Failed to record delivery." }
    }
}

/**
 * Business responds to delivery (Accept delivery -> completed, or Request revision)
 */
export async function respondToDeliveryAction(input: {
    orderId: string
    action: "accept" | "revision"
    revisionNotes?: string
}): Promise<OrderActionResult> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false, error: "Unauthorized." }

    const [biz] = await db
        .select()
        .from(business)
        .where(eq(business.userId, session.user.id))
        .limit(1)

    if (!biz) return { success: false, error: "Business profile not found." }

    const [order] = await db
        .select()
        .from(businessHiredServiceTable)
        .where(and(
            eq(businessHiredServiceTable.id, input.orderId),
            eq(businessHiredServiceTable.businessId, biz.id)
        ))
        .limit(1)

    if (!order) return { success: false, error: "Order not found." }

    if (order.status !== "delivered") {
        return { success: false, error: "Only delivered orders can be accepted or revised." }
    }

    if (input.action === "accept") {
        try {
            await db.transaction(async (tx) => {
                await tx.update(businessHiredServiceTable).set({
                    status: "completed",
                    completedAt: new Date(),
                    updatedAt: new Date(),
                }).where(eq(businessHiredServiceTable.id, order.id))

                await tx.insert(hiredServiceEventsTable).values({
                    id: crypto.randomUUID(),
                    orderId: order.id,
                    status: "completed",
                    actorUserId: session.user.id,
                    actorRole: "business",
                    note: "Client accepted the final delivery. Project marked as Completed.",
                })
            })

            // Email designer
            sendHiredServiceEmail({
                to: order.designerEmail,
                recipientName: order.designerName,
                orderNumber: order.id.slice(0, 8).toUpperCase(),
                serviceTitle: order.serviceTitle,
                subject: `Delivery Accepted: ${order.serviceTitle}`,
                headline: "Great news! Your delivery was accepted.",
                body: `${biz.businessName} has accepted your delivered artwork. The order is now completed!`,
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/designer/orders/${order.id}`,
            })

            revalidatePath(`/designer/orders/${order.id}`)
            revalidatePath(`/business/hired-services/${order.id}`)
            return { success: true }
        } catch (err) {
            console.error("Accept delivery error:", err)
            return { success: false, error: "Could not accept delivery." }
        }
    } else {
        // Revision requested
        if (!input.revisionNotes?.trim()) {
            return { success: false, error: "Please explain the changes you are requesting." }
        }

        // Check revision limit: -1 is unlimited
        if (order.revisionsIncluded !== -1 && order.revisionsUsed >= order.revisionsIncluded) {
            return {
                success: false,
                error: `All ${order.revisionsIncluded} included revisions have already been used. Please discuss extra revisions with the designer.`,
            }
        }

        try {
            await db.transaction(async (tx) => {
                await tx.update(businessHiredServiceTable).set({
                    status: "revision_requested",
                    revisionsUsed: order.revisionsUsed + 1,
                    updatedAt: new Date(),
                }).where(eq(businessHiredServiceTable.id, order.id))

                await tx.insert(hiredServiceEventsTable).values({
                    id: crypto.randomUUID(),
                    orderId: order.id,
                    status: "revision_requested",
                    actorUserId: session.user.id,
                    actorRole: "business",
                    note: `Revision #${order.revisionsUsed + 1} requested: ${input.revisionNotes}`,
                })
            })

            sendHiredServiceEmail({
                to: order.designerEmail,
                recipientName: order.designerName,
                orderNumber: order.id.slice(0, 8).toUpperCase(),
                serviceTitle: order.serviceTitle,
                subject: `Revision Requested: ${order.serviceTitle}`,
                headline: "Client requested revisions on your delivery",
                body: `${biz.businessName} has requested changes: "${input.revisionNotes}". Revision ${order.revisionsUsed + 1} of ${order.revisionsIncluded === -1 ? "Unlimited" : order.revisionsIncluded}.`,
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/designer/orders/${order.id}`,
            })

            revalidatePath(`/designer/orders/${order.id}`)
            revalidatePath(`/business/hired-services/${order.id}`)
            return { success: true }
        } catch (err) {
            console.error("Request revision error:", err)
            return { success: false, error: "Could not request revision." }
        }
    }
}

/**
 * Cancel an order
 */
export async function cancelOrderAction(input: {
    orderId: string
    reason: string
}): Promise<OrderActionResult> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false, error: "Unauthorized." }

    if (!input.reason?.trim()) {
        return { success: false, error: "A cancellation reason is required." }
    }

    // Check if user is business or designer
    const [biz] = await db.select().from(business).where(eq(business.userId, session.user.id)).limit(1)
    const [designer] = await db.select().from(packagingDesignerTable).where(eq(packagingDesignerTable.userId, session.user.id)).limit(1)

    const [order] = await db
        .select()
        .from(businessHiredServiceTable)
        .where(eq(businessHiredServiceTable.id, input.orderId))
        .limit(1)

    if (!order) return { success: false, error: "Order not found." }

    const isBiz = biz && order.businessId === biz.id
    const isDes = designer && order.designerId === designer.id

    if (!isBiz && !isDes) {
        return { success: false, error: "You are not authorized to cancel this order." }
    }

    const actorRole = isBiz ? "business" : "designer"

    if (order.status === "completed" || order.status === "cancelled" || order.status === "declined") {
        return { success: false, error: "Cannot cancel an already completed or closed order." }
    }

    try {
        await db.transaction(async (tx) => {
            await tx.update(businessHiredServiceTable).set({
                status: "cancelled",
                cancelReason: input.reason,
                updatedAt: new Date(),
            }).where(eq(businessHiredServiceTable.id, order.id))

            await tx.insert(hiredServiceEventsTable).values({
                id: crypto.randomUUID(),
                orderId: order.id,
                status: "cancelled",
                actorUserId: session.user.id,
                actorRole,
                note: `Order cancelled by ${actorRole}. Reason: ${input.reason}`,
            })
        })

        revalidatePath(`/designer/orders/${order.id}`)
        revalidatePath(`/business/hired-services/${order.id}`)
        return { success: true }
    } catch (err) {
        console.error("Cancel order error:", err)
        return { success: false, error: "Could not cancel order." }
    }
}

/**
 * Send a message inside the order workspace
 */
export async function sendOrderMessageAction(input: {
    orderId: string
    body: string
    attachments?: string[]
}): Promise<OrderActionResult<{ messageId: string }>> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false, error: "Unauthorized." }

    if (!input.body?.trim()) {
        return { success: false, error: "Message cannot be empty." }
    }

    // Rate limit sending messages: 20 per minute
    const reqHeaders = await headers()
    const clientIp = getClientIpFromHeaders(reqHeaders)
    const rateCheck = await checkRateLimit(
        { keyPrefix: "order-msg", limit: 20, windowSeconds: 60 },
        `${session.user.id}:${clientIp}`
    )
    if (!rateCheck.success) {
        return { success: false, error: "Too many messages sent. Please slow down." }
    }

    // Verify participant
    const [order] = await db
        .select({
            id: businessHiredServiceTable.id,
            businessUserId: business.userId,
            designerUserId: packagingDesignerTable.userId,
        })
        .from(businessHiredServiceTable)
        .leftJoin(business, eq(businessHiredServiceTable.businessId, business.id))
        .leftJoin(packagingDesignerTable, eq(businessHiredServiceTable.designerId, packagingDesignerTable.id))
        .where(eq(businessHiredServiceTable.id, input.orderId))
        .limit(1)

    if (!order) return { success: false, error: "Order not found." }

    const isParticipant =
        order.businessUserId === session.user.id || order.designerUserId === session.user.id
    if (!isParticipant) {
        return { success: false, error: "You are not a participant in this order." }
    }

    const messageId = crypto.randomUUID()
    try {
        await db.insert(hiredServiceMessagesTable).values({
            id: messageId,
            orderId: input.orderId,
            senderId: session.user.id,
            body: input.body.trim(),
            attachments: input.attachments || [],
        })

        revalidatePath(`/designer/orders/${input.orderId}`)
        revalidatePath(`/business/hired-services/${input.orderId}`)
        return { success: true, data: { messageId } }
    } catch (err) {
        console.error("Message send failed:", err)
        return { success: false, error: "Failed to send message." }
    }
}

/**
 * Submit review for a completed order
 */
export async function submitDesignerReviewAction(input: {
    orderId: string
    rating: number
    communicationRating: number
    qualityRating: number
    asDescribedRating: number
    text: string
}): Promise<OrderActionResult> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false, error: "Unauthorized." }

    const [biz] = await db.select().from(business).where(eq(business.userId, session.user.id)).limit(1)
    if (!biz) return { success: false, error: "Business profile not found." }

    const [order] = await db
        .select()
        .from(businessHiredServiceTable)
        .where(and(
            eq(businessHiredServiceTable.id, input.orderId),
            eq(businessHiredServiceTable.businessId, biz.id)
        ))
        .limit(1)

    if (!order) return { success: false, error: "Order not found." }

    if (order.status !== "completed") {
        return { success: false, error: "Reviews can only be submitted after the order is completed." }
    }

    // Check if review already exists
    const [existingReview] = await db
        .select()
        .from(designerReviewsTable)
        .where(eq(designerReviewsTable.orderId, order.id))
        .limit(1)

    if (existingReview) {
        // Enforce 7-day edit window
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
        if (Date.now() - new Date(existingReview.createdAt).getTime() > sevenDaysMs) {
            return { success: false, error: "Reviews cannot be modified after 7 days." }
        }
    }

    try {
        await db.transaction(async (tx) => {
            const reviewId = existingReview?.id || crypto.randomUUID()

            if (existingReview) {
                await tx.update(designerReviewsTable).set({
                    rating: input.rating,
                    communicationRating: input.communicationRating,
                    qualityRating: input.qualityRating,
                    asDescribedRating: input.asDescribedRating,
                    text: input.text,
                    updatedAt: new Date(),
                }).where(eq(designerReviewsTable.id, reviewId))
            } else {
                await tx.insert(designerReviewsTable).values({
                    id: reviewId,
                    orderId: order.id,
                    serviceId: order.serviceId,
                    designerId: order.designerId,
                    businessId: biz.id,
                    rating: input.rating,
                    communicationRating: input.communicationRating,
                    qualityRating: input.qualityRating,
                    asDescribedRating: input.asDescribedRating,
                    text: input.text,
                })
            }

            // Materialize average rating on gig if serviceId exists
            if (order.serviceId) {
                const stats = await tx
                    .select({
                        avg: sql<number>`avg(rating)`,
                        count: sql<number>`count(*)`,
                    })
                    .from(designerReviewsTable)
                    .where(eq(designerReviewsTable.serviceId, order.serviceId))

                const avgRating = Number(stats[0]?.avg || input.rating).toFixed(2)
                const reviewCount = Number(stats[0]?.count || 1)

                await tx.update(designerServiceTable).set({
                    ratingAvg: avgRating,
                    ratingCount: reviewCount,
                }).where(eq(designerServiceTable.id, order.serviceId))
            }
        })

        revalidatePath(`/designer/orders/${order.id}`)
        revalidatePath(`/business/hired-services/${order.id}`)
        revalidatePath("/business/designers")
        return { success: true }
    } catch (err) {
        console.error("Submit review error:", err)
        return { success: false, error: "Failed to submit review." }
    }
}

/**
 * Designer replies to a review
 */
export async function replyToReviewAction(input: {
    reviewId: string
    replyText: string
}): Promise<OrderActionResult> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false, error: "Unauthorized." }

    const [designer] = await db
        .select()
        .from(packagingDesignerTable)
        .where(eq(packagingDesignerTable.userId, session.user.id))
        .limit(1)

    if (!designer) return { success: false, error: "Designer profile not found." }

    if (!input.replyText?.trim()) {
        return { success: false, error: "Reply text is required." }
    }

    try {
        await db.update(designerReviewsTable)
            .set({
                designerReply: input.replyText.trim(),
                designerRepliedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(and(
                eq(designerReviewsTable.id, input.reviewId),
                eq(designerReviewsTable.designerId, designer.id)
            ))

        revalidatePath("/business/designers")
        return { success: true }
    } catch (err) {
        console.error("Reply to review error:", err)
        return { success: false, error: "Failed to post reply." }
    }
}

/**
 * Save / Favorite a gig
 */
export async function toggleSaveGigAction(serviceId: string): Promise<OrderActionResult<{ saved: boolean }>> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false, error: "Please sign in to save gigs." }

    const [biz] = await db.select().from(business).where(eq(business.userId, session.user.id)).limit(1)
    if (!biz) return { success: false, error: "Only businesses can save gigs." }

    const [existing] = await db
        .select()
        .from(businessSavedServicesTable)
        .where(and(
            eq(businessSavedServicesTable.businessId, biz.id),
            eq(businessSavedServicesTable.serviceId, serviceId)
        ))
        .limit(1)

    try {
        if (existing) {
            await db
                .delete(businessSavedServicesTable)
                .where(eq(businessSavedServicesTable.id, existing.id))
            revalidatePath("/business/designers")
            return { success: true, data: { saved: false } }
        } else {
            await db.insert(businessSavedServicesTable).values({
                id: crypto.randomUUID(),
                businessId: biz.id,
                serviceId,
            })
            revalidatePath("/business/designers")
            return { success: true, data: { saved: true } }
        }
    } catch (err) {
        console.error("Toggle save error:", err)
        return { success: false, error: "Could not update saved status." }
    }
}

/**
 * Attach completed design artwork to a packaging production order
 */
export async function attachArtworkToOrderAction(input: {
    hiredServiceId: string
    businessOrderId: string
}): Promise<OrderActionResult> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false, error: "Unauthorized." }

    const [biz] = await db.select().from(business).where(eq(business.userId, session.user.id)).limit(1)
    if (!biz) return { success: false, error: "Business profile not found." }

    // Verify hired service is completed and belongs to business
    const [hiredService] = await db
        .select()
        .from(businessHiredServiceTable)
        .where(and(
            eq(businessHiredServiceTable.id, input.hiredServiceId),
            eq(businessHiredServiceTable.businessId, biz.id)
        ))
        .limit(1)

    if (!hiredService || hiredService.status !== "completed") {
        return { success: false, error: "Only completed design projects can be attached to production orders." }
    }

    try {
        await db.update(businessHiredServiceTable)
            .set({ linkedOrderId: input.businessOrderId, updatedAt: new Date() })
            .where(eq(businessHiredServiceTable.id, hiredService.id))

        revalidatePath(`/business/hired-services/${hiredService.id}`)
        return { success: true }
    } catch (err) {
        console.error("Attach artwork error:", err)
        return { success: false, error: "Failed to link artwork to order." }
    }
}

