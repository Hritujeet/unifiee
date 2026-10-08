import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { designerServiceTable } from "@/lib/db/schema/designer-service"
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer"

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
        specializations: listing.specializations ?? [],
        deliverables: listing.deliverables ?? [],
        sampleImages: listing.sampleImages ?? [],
    }))
}
