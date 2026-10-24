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
import { business } from "@/lib/db/schema/business"
import { eq, and, desc, isNull, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import crypto from "crypto"
import { triggerEntityEmbedding, buildOfferingTemplate } from "@/lib/ai/embeddings"

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

    return rawOrders.map((o) => ({
        ...o,
        items: items.filter((item) => item.orderId === o.order.id),
    }))
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
    const settledEarnings = nonCancelledOrders
        .filter((o) => o.order.status === "delivered")
        .reduce((sum, o) => sum + parseFloat(o.order.total || "0"), 0)
    const inEscrow = nonCancelledOrders
        .filter((o) => o.order.status !== "delivered")
        .reduce((sum, o) => sum + parseFloat(o.order.total || "0"), 0)

    const activeOrdersCount = nonCancelledOrders.filter(
        (o) => o.order.status !== "delivered"
    ).length

    return {
        vendor,
        metrics: {
            grossEarnings,
            settledEarnings,
            inEscrow,
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

// ── 5. Update Order Status in Real DB ────────────────────────────────────────
export async function updateOrderStatusAction(
    orderId: string,
    newStatus: "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
) {
    try {
        const vendor = await getAuthenticatedVendor()
        if (!vendor) return { success: false, error: "Unauthorized" }

        const updates: Record<string, unknown> = {
            status: newStatus,
            updatedAt: new Date(),
        }
        if (newStatus === "delivered") {
            updates.deliveredAt = new Date()
        }

        await db
            .update(businessOrdersTable)
            .set(updates)
            .where(
                and(
                    eq(businessOrdersTable.id, orderId),
                    eq(businessOrdersTable.vendorId, vendor.manufacturerId)
                )
            )

        revalidatePath("/manufacturer")
        revalidatePath("/manufacturer/order-dashboard")
        return { success: true }
    } catch (err: unknown) {
        console.error("Error updating order:", err)
        return { success: false, error: "Failed to update order status." }
    }
}
