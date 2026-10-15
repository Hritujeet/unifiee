import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { designerServiceTable } from "@/lib/db/schema/designer-service"
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer"
import { businessHiredServiceTable } from "@/lib/db/schema/business-hired-service"
import { business } from "@/lib/db/schema/business"

export type DesignerListing = {
    designerId: string
    designerName: string
    email: string
    headline: string | null
    city: string | null
    state: string | null
    profilePhotoUrl: string | null
    availabilityStatus: string | null
    isVerified: boolean | null
    specializations: string[]
    serviceId: string
    serviceTitle: string
    description: string
    serviceType: string
    pricingModel: string
    price: string
    turnaroundDays: number
    revisionsIncluded: number
    deliverables: string[]
    sampleImages: string[]
}

export type HiredDesignerService = {
    id: string
    serviceId: string | null
    designerId: string | null
    serviceTitle: string
    designerName: string
    designerEmail: string
    price: string
    pricingModel: string
    turnaroundDays: number
    sampleImage: string | null
    status: "active" | "completed"
    hiredAt: Date
    completedAt: Date | null
}

async function getBusinessId(userId: string) {
    const [profile] = await db
        .select({ id: business.id })
        .from(business)
        .where(eq(business.userId, userId))
        .limit(1)

    return profile?.id
}

export async function getDesignerListings(): Promise<DesignerListing[]> {
    const listings = await db
        .select({
            designerId: packagingDesignerTable.id,
            displayName: packagingDesignerTable.displayName,
            fullName: packagingDesignerTable.fullName,
            email: packagingDesignerTable.email,
            headline: packagingDesignerTable.headline,
            city: packagingDesignerTable.city,
            state: packagingDesignerTable.state,
            profilePhotoUrl: packagingDesignerTable.profilePhotoUrl,
            availabilityStatus: packagingDesignerTable.availabilityStatus,
            isVerified: packagingDesignerTable.isVerified,
            specializations: packagingDesignerTable.packagingDesignSpecializations,
            serviceId: designerServiceTable.id,
            serviceTitle: designerServiceTable.title,
            description: designerServiceTable.description,
            serviceType: designerServiceTable.serviceType,
            pricingModel: designerServiceTable.pricingModel,
            price: designerServiceTable.price,
            turnaroundDays: designerServiceTable.turnaroundDays,
            revisionsIncluded: designerServiceTable.revisionsIncluded,
            deliverables: designerServiceTable.deliverables,
            sampleImages: designerServiceTable.sampleImages,
        })
        .from(designerServiceTable)
        .innerJoin(packagingDesignerTable, eq(designerServiceTable.designerId, packagingDesignerTable.id))
        .where(and(
            eq(designerServiceTable.status, "active"),
            eq(packagingDesignerTable.isActive, true),
        ))
        .orderBy(desc(designerServiceTable.createdAt))
        .limit(100)

    return listings.map((listing) => ({
        ...listing,
        designerName: listing.displayName || listing.fullName,
        specializations: (listing.specializations && listing.specializations.length > 0)
            ? listing.specializations
            : [listing.serviceType],
        deliverables: listing.deliverables ?? [],
        sampleImages: listing.sampleImages ?? [],
    }))
}

export async function getBusinessHiredServices(userId: string): Promise<HiredDesignerService[]> {
    const businessId = await getBusinessId(userId)
    if (!businessId) return []

    return db
        .select({
            id: businessHiredServiceTable.id,
            serviceId: businessHiredServiceTable.serviceId,
            designerId: businessHiredServiceTable.designerId,
            serviceTitle: businessHiredServiceTable.serviceTitle,
            designerName: businessHiredServiceTable.designerName,
            designerEmail: businessHiredServiceTable.designerEmail,
            price: businessHiredServiceTable.price,
            pricingModel: businessHiredServiceTable.pricingModel,
            turnaroundDays: businessHiredServiceTable.turnaroundDays,
            sampleImage: businessHiredServiceTable.sampleImage,
            status: businessHiredServiceTable.status,
            hiredAt: businessHiredServiceTable.hiredAt,
            completedAt: businessHiredServiceTable.completedAt,
        })
        .from(businessHiredServiceTable)
        .where(eq(businessHiredServiceTable.businessId, businessId))
        .orderBy(desc(businessHiredServiceTable.hiredAt))
}

export async function getTrackedDesignerServiceIds(userId: string): Promise<string[]> {
    const businessId = await getBusinessId(userId)
    if (!businessId) return []

    const tracked = await db
        .select({ serviceId: businessHiredServiceTable.serviceId })
        .from(businessHiredServiceTable)
        .where(and(
            eq(businessHiredServiceTable.businessId, businessId),
            eq(businessHiredServiceTable.status, "active"),
        ))

    return tracked.flatMap(({ serviceId }) => serviceId ? [serviceId] : [])
}
