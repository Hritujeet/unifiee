import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import {
    designerServiceTable,
    designerServicePackagesTable,
    designerServiceExtrasTable,
    type DesignerServicePackage,
    type DesignerServiceExtra,
} from "@/lib/db/schema/designer-service"
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer"
import {
    businessHiredServiceTable,
    hiredServiceDeliveriesTable,
    hiredServiceEventsTable,
    hiredServiceMessagesTable,
    designerReviewsTable,
    businessSavedServicesTable,
    type BusinessHiredService,
    type HiredServiceDelivery,
    type HiredServiceEvent,
    type HiredServiceMessage,
    type DesignerReview,
} from "@/lib/db/schema/business-hired-service"
import { business } from "@/lib/db/schema/business"
import { evaluateAutoTransitions } from "@/lib/hired-services/lifecycle"

export type DesignerPackageTier = "basic" | "standard" | "premium"

export type DesignerListing = {
    designerId: string
    designerName: string
    email?: string
    headline: string | null
    bio?: string | null
    city: string | null
    state: string | null
    profilePhotoUrl: string | null
    availabilityStatus: string | null
    isVerified: boolean | null
    specializations: string[]
    softwareTools: string[]
    completedOrders: number
    ratingAvg: number
    ratingCount: number
    serviceId: string
    serviceSlug: string
    serviceTitle: string
    category: string
    description: string
    tags: string[]
    packagingTypes: string[]
    softwareUsed: string[]
    sampleImages: string[]
    price: string // Starting price (Basic package)
    pricingModel: string
    turnaroundDays: number
    revisionsIncluded: number
    deliverables: string[]
    packages?: DesignerServicePackage[]
}

export type HiredDesignerService = BusinessHiredService & {
    unreadMessagesCount?: number
}

async function getBusinessId(userId: string): Promise<string | null> {
    const [profile] = await db
        .select({ id: business.id })
        .from(business)
        .where(eq(business.userId, userId))
        .limit(1)

    return profile?.id ?? null
}

/**
 * Fetch marketplace gig listings
 */
export async function getDesignerListings(): Promise<DesignerListing[]> {
    const rawGigs = await db
        .select({
            designerId: packagingDesignerTable.id,
            displayName: packagingDesignerTable.displayName,
            fullName: packagingDesignerTable.fullName,
            email: packagingDesignerTable.email,
            headline: packagingDesignerTable.headline,
            bio: packagingDesignerTable.bio,
            city: packagingDesignerTable.city,
            state: packagingDesignerTable.state,
            profilePhotoUrl: packagingDesignerTable.profilePhotoUrl,
            availabilityStatus: packagingDesignerTable.availabilityStatus,
            isVerified: packagingDesignerTable.isVerified,
            specializations: packagingDesignerTable.packagingDesignSpecializations,
            softwareTools: packagingDesignerTable.softwareTools,
            serviceId: designerServiceTable.id,
            serviceSlug: designerServiceTable.slug,
            serviceTitle: designerServiceTable.title,
            category: designerServiceTable.category,
            description: designerServiceTable.description,
            serviceType: designerServiceTable.serviceType,
            pricingModel: designerServiceTable.pricingModel,
            legacyPrice: designerServiceTable.price,
            legacyTurnaround: designerServiceTable.turnaroundDays,
            legacyRevisions: designerServiceTable.revisionsIncluded,
            legacyDeliverables: designerServiceTable.deliverables,
            tags: designerServiceTable.tags,
            packagingTypes: designerServiceTable.packagingTypes,
            softwareUsed: designerServiceTable.softwareUsed,
            sampleImages: designerServiceTable.sampleImages,
            ratingAvg: designerServiceTable.ratingAvg,
            ratingCount: designerServiceTable.ratingCount,
        })
        .from(designerServiceTable)
        .innerJoin(packagingDesignerTable, eq(designerServiceTable.designerId, packagingDesignerTable.id))
        .where(and(
            eq(designerServiceTable.status, "published"),
            isNull(designerServiceTable.deletedAt),
            eq(packagingDesignerTable.isActive, true)
        ))
        .orderBy(desc(designerServiceTable.ratingAvg), desc(designerServiceTable.createdAt))
        .limit(100)

    if (!rawGigs.length) return []

    const serviceIds = rawGigs.map((g) => g.serviceId)

    // Fetch packages for all gigs
    const packages = await db
        .select()
        .from(designerServicePackagesTable)
        .where(inArray(designerServicePackagesTable.serviceId, serviceIds))

    // Count completed orders per designer
    const completedCounts = await db
        .select({
            designerId: businessHiredServiceTable.designerId,
            count: sql<number>`count(*)`,
        })
        .from(businessHiredServiceTable)
        .where(eq(businessHiredServiceTable.status, "completed"))
        .groupBy(businessHiredServiceTable.designerId)

    const completedMap = new Map<string, number>()
    for (const c of completedCounts) {
        if (c.designerId) completedMap.set(c.designerId, Number(c.count))
    }

    const packagesByService = new Map<string, DesignerServicePackage[]>()
    for (const pkg of packages) {
        const list = packagesByService.get(pkg.serviceId) || []
        list.push(pkg)
        packagesByService.set(pkg.serviceId, list)
    }

    return rawGigs.map((item) => {
        const gigPackages = packagesByService.get(item.serviceId) || []
        const basicPkg = gigPackages.find((p) => p.tier === "basic")

        const price = basicPkg ? basicPkg.price : item.legacyPrice
        const turnaroundDays = basicPkg ? basicPkg.deliveryDays : item.legacyTurnaround
        const revisionsIncluded = basicPkg ? basicPkg.revisionsIncluded : item.legacyRevisions
        const deliverables = basicPkg?.deliverables?.length ? basicPkg.deliverables : item.legacyDeliverables

        return {
            designerId: item.designerId,
            designerName: item.displayName || item.fullName,
            headline: item.headline,
            bio: item.bio,
            city: item.city,
            state: item.state,
            profilePhotoUrl: item.profilePhotoUrl,
            availabilityStatus: item.availabilityStatus,
            isVerified: item.isVerified,
            specializations: (item.specializations && item.specializations.length > 0)
                ? item.specializations
                : [item.category || item.serviceType],
            softwareTools: item.softwareTools || item.softwareUsed || [],
            completedOrders: completedMap.get(item.designerId) || 0,
            ratingAvg: Number(item.ratingAvg) || 5.0,
            ratingCount: item.ratingCount || 0,
            serviceId: item.serviceId,
            serviceSlug: item.serviceSlug || item.serviceId,
            serviceTitle: item.serviceTitle,
            category: item.category || "dieline_structural",
            description: item.description,
            tags: item.tags || [],
            packagingTypes: item.packagingTypes || [],
            softwareUsed: item.softwareUsed || [],
            sampleImages: item.sampleImages || [],
            price: String(price),
            pricingModel: item.pricingModel || "package",
            turnaroundDays,
            revisionsIncluded,
            deliverables: deliverables || [],
            packages: gigPackages,
        }
    })
}

/**
 * Fetch full gig details by slug or ID
 */
export async function getDetailedGigBySlug(slugOrId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)

    const [gig] = await db
        .select({
            id: designerServiceTable.id,
            slug: designerServiceTable.slug,
            designerId: designerServiceTable.designerId,
            title: designerServiceTable.title,
            category: designerServiceTable.category,
            description: designerServiceTable.description,
            tags: designerServiceTable.tags,
            packagingTypes: designerServiceTable.packagingTypes,
            softwareUsed: designerServiceTable.softwareUsed,
            faq: designerServiceTable.faq,
            sampleImages: designerServiceTable.sampleImages,
            ratingAvg: designerServiceTable.ratingAvg,
            ratingCount: designerServiceTable.ratingCount,
            status: designerServiceTable.status,
            createdAt: designerServiceTable.createdAt,
            // Designer details
            designerName: packagingDesignerTable.displayName,
            fullName: packagingDesignerTable.fullName,
            headline: packagingDesignerTable.headline,
            bio: packagingDesignerTable.bio,
            city: packagingDesignerTable.city,
            state: packagingDesignerTable.state,
            profilePhotoUrl: packagingDesignerTable.profilePhotoUrl,
            isVerified: packagingDesignerTable.isVerified,
            availabilityStatus: packagingDesignerTable.availabilityStatus,
            softwareTools: packagingDesignerTable.softwareTools,
            specializations: packagingDesignerTable.packagingDesignSpecializations,
            portfolioUrl: packagingDesignerTable.portfolioUrl,
            portfolioImages: packagingDesignerTable.portfolioImages,
            yearsOfExperience: packagingDesignerTable.yearsOfExperience,
            email: packagingDesignerTable.email,
        })
        .from(designerServiceTable)
        .innerJoin(packagingDesignerTable, eq(designerServiceTable.designerId, packagingDesignerTable.id))
        .where(
            isUuid
                ? eq(designerServiceTable.id, slugOrId)
                : eq(designerServiceTable.slug, slugOrId)
        )
        .limit(1)

    if (!gig || gig.status !== "published") return null

    // Fetch packages
    const packages = await db
        .select()
        .from(designerServicePackagesTable)
        .where(eq(designerServicePackagesTable.serviceId, gig.id))
        .orderBy(designerServicePackagesTable.price)

    // Fetch extras
    const extras = await db
        .select()
        .from(designerServiceExtrasTable)
        .where(eq(designerServiceExtrasTable.serviceId, gig.id))

    // Fetch reviews
    const reviews = await db
        .select({
            id: designerReviewsTable.id,
            rating: designerReviewsTable.rating,
            communicationRating: designerReviewsTable.communicationRating,
            qualityRating: designerReviewsTable.qualityRating,
            asDescribedRating: designerReviewsTable.asDescribedRating,
            text: designerReviewsTable.text,
            designerReply: designerReviewsTable.designerReply,
            designerRepliedAt: designerReviewsTable.designerRepliedAt,
            createdAt: designerReviewsTable.createdAt,
            businessName: business.businessName,
            businessType: business.businessType,
        })
        .from(designerReviewsTable)
        .leftJoin(business, eq(designerReviewsTable.businessId, business.id))
        .where(eq(designerReviewsTable.serviceId, gig.id))
        .orderBy(desc(designerReviewsTable.createdAt))
        .limit(20)

    // Completed orders count for designer
    const [completedRes] = await db
        .select({ count: sql<number>`count(*)` })
        .from(businessHiredServiceTable)
        .where(and(
            eq(businessHiredServiceTable.designerId, gig.designerId),
            eq(businessHiredServiceTable.status, "completed")
        ))

    // Related gigs from the same category or designer
    const relatedGigs = await db
        .select({
            id: designerServiceTable.id,
            slug: designerServiceTable.slug,
            title: designerServiceTable.title,
            category: designerServiceTable.category,
            price: designerServiceTable.price,
            sampleImages: designerServiceTable.sampleImages,
            ratingAvg: designerServiceTable.ratingAvg,
            ratingCount: designerServiceTable.ratingCount,
            designerName: packagingDesignerTable.displayName,
        })
        .from(designerServiceTable)
        .innerJoin(packagingDesignerTable, eq(designerServiceTable.designerId, packagingDesignerTable.id))
        .where(and(
            eq(designerServiceTable.status, "published"),
            sql`${designerServiceTable.id} <> ${gig.id}`
        ))
        .limit(3)

    return {
        ...gig,
        designerDisplayName: gig.designerName || gig.fullName,
        packages,
        extras,
        reviews,
        completedOrders: Number(completedRes?.count || 0),
        relatedGigs,
    }
}

/**
 * Fetch business hired services with lazy auto-completion & auto-expiry evaluation
 */
export async function getBusinessHiredServices(userId: string): Promise<HiredDesignerService[]> {
    const businessId = await getBusinessId(userId)
    if (!businessId) return []

    const orders = await db
        .select()
        .from(businessHiredServiceTable)
        .where(eq(businessHiredServiceTable.businessId, businessId))
        .orderBy(desc(businessHiredServiceTable.hiredAt))

    // Lazy check & update transitions
    const processedOrders: HiredDesignerService[] = []
    for (const order of orders) {
        const transition = evaluateAutoTransitions({
            status: order.status,
            hiredAt: order.hiredAt,
            updatedAt: order.updatedAt,
        })

        if (transition.shouldTransition) {
            await db.transaction(async (tx) => {
                await tx.update(businessHiredServiceTable)
                    .set({
                        status: transition.newStatus,
                        completedAt: transition.newStatus === "completed" ? new Date() : null,
                        updatedAt: new Date(),
                    })
                    .where(eq(businessHiredServiceTable.id, order.id))

                await tx.insert(hiredServiceEventsTable).values({
                    id: crypto.randomUUID(),
                    orderId: order.id,
                    status: transition.newStatus,
                    actorUserId: "system",
                    actorRole: "system",
                    note: transition.reason,
                })
            })
            order.status = transition.newStatus
        }

        // Count unread messages (read_at is null and not sent by this user)
        const [unread] = await db
            .select({ count: sql<number>`count(*)` })
            .from(hiredServiceMessagesTable)
            .where(and(
                eq(hiredServiceMessagesTable.orderId, order.id),
                isNull(hiredServiceMessagesTable.readAt),
                sql`${hiredServiceMessagesTable.senderId} <> ${userId}`
            ))

        processedOrders.push({
            ...order,
            unreadMessagesCount: Number(unread?.count || 0),
        })
    }

    return processedOrders
}

/**
 * Fetch full order workspace data for either business or designer
 */
export async function getHiredServiceWorkspace(orderId: string, currentUserId: string) {
    const [order] = await db
        .select({
            order: businessHiredServiceTable,
            businessName: business.businessName,
            businessOwner: business.ownerName,
            businessEmail: business.email,
            businessPhone: business.phone,
            businessAddress: business.businessAddress,
            businessUserId: business.userId,
            designerName: packagingDesignerTable.displayName,
            designerFullName: packagingDesignerTable.fullName,
            designerEmail: packagingDesignerTable.email,
            designerPhone: packagingDesignerTable.phone,
            designerPhoto: packagingDesignerTable.profilePhotoUrl,
            designerUserId: packagingDesignerTable.userId,
            gigTitle: designerServiceTable.title,
            gigSlug: designerServiceTable.slug,
            gigImages: designerServiceTable.sampleImages,
        })
        .from(businessHiredServiceTable)
        .leftJoin(business, eq(businessHiredServiceTable.businessId, business.id))
        .leftJoin(packagingDesignerTable, eq(businessHiredServiceTable.designerId, packagingDesignerTable.id))
        .leftJoin(designerServiceTable, eq(businessHiredServiceTable.serviceId, designerServiceTable.id))
        .where(eq(businessHiredServiceTable.id, orderId))
        .limit(1)

    if (!order) return null

    // Participant verification
    const isBusiness = order.businessUserId === currentUserId
    const isDesigner = order.designerUserId === currentUserId
    if (!isBusiness && !isDesigner) return null

    // Lazy auto-transition check
    const transition = evaluateAutoTransitions({
        status: order.order.status,
        hiredAt: order.order.hiredAt,
        updatedAt: order.order.updatedAt,
    })

    if (transition.shouldTransition) {
        await db.transaction(async (tx) => {
            await tx.update(businessHiredServiceTable)
                .set({
                    status: transition.newStatus,
                    completedAt: transition.newStatus === "completed" ? new Date() : null,
                    updatedAt: new Date(),
                })
                .where(eq(businessHiredServiceTable.id, order.order.id))

            await tx.insert(hiredServiceEventsTable).values({
                id: crypto.randomUUID(),
                orderId: order.order.id,
                status: transition.newStatus,
                actorUserId: "system",
                actorRole: "system",
                note: transition.reason,
            })
        })
        order.order.status = transition.newStatus
    }

    // Fetch messages
    const messages = await db
        .select()
        .from(hiredServiceMessagesTable)
        .where(eq(hiredServiceMessagesTable.orderId, orderId))
        .orderBy(hiredServiceMessagesTable.createdAt)

    // Mark messages as read for this user
    await db.update(hiredServiceMessagesTable)
        .set({ readAt: new Date() })
        .where(and(
            eq(hiredServiceMessagesTable.orderId, orderId),
            isNull(hiredServiceMessagesTable.readAt),
            sql`${hiredServiceMessagesTable.senderId} <> ${currentUserId}`
        ))

    // Fetch deliveries
    const deliveries = await db
        .select()
        .from(hiredServiceDeliveriesTable)
        .where(eq(hiredServiceDeliveriesTable.orderId, orderId))
        .orderBy(desc(hiredServiceDeliveriesTable.versionNumber))

    // Fetch timeline events
    const events = await db
        .select()
        .from(hiredServiceEventsTable)
        .where(eq(hiredServiceEventsTable.orderId, orderId))
        .orderBy(desc(hiredServiceEventsTable.createdAt))

    // Fetch review if completed
    const [review] = await db
        .select()
        .from(designerReviewsTable)
        .where(eq(designerReviewsTable.orderId, orderId))
        .limit(1)

    return {
        order: order.order,
        business: {
            id: order.order.businessId,
            name: order.businessName,
            owner: order.businessOwner,
            email: order.businessEmail,
            phone: order.businessPhone,
            address: order.businessAddress,
            userId: order.businessUserId,
        },
        designer: {
            id: order.order.designerId,
            name: order.designerName || order.designerFullName,
            email: order.designerEmail,
            phone: order.designerPhone,
            photo: order.designerPhoto,
            userId: order.designerUserId,
        },
        gig: {
            title: order.gigTitle || order.order.serviceTitle,
            slug: order.gigSlug,
            images: order.gigImages || [],
        },
        role: isBusiness ? ("business" as const) : ("designer" as const),
        messages,
        deliveries,
        events,
        review: review || null,
    }
}

/**
 * Fetch saved service IDs for a business user
 */
export async function getTrackedDesignerServiceIds(userId: string): Promise<string[]> {
    const businessId = await getBusinessId(userId)
    if (!businessId) return []

    const saved = await db
        .select({ serviceId: businessSavedServicesTable.serviceId })
        .from(businessSavedServicesTable)
        .where(eq(businessSavedServicesTable.businessId, businessId))

    return saved.map((s) => s.serviceId)
}
