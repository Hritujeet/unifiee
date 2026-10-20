"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { businessHiredServiceTable } from "@/lib/db/schema/business-hired-service"
import { business } from "@/lib/db/schema/business"
import { designerServiceTable } from "@/lib/db/schema/designer-service"
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer"
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/server/rate-limit"

type HireActionResult = { success: boolean; error?: string }

async function getCurrentBusiness() {
    const reqHeaders = await headers()
    const session = await auth.api.getSession({ headers: reqHeaders })
    if (!session?.user) return { session: null, businessProfile: null, reqHeaders }

    const [businessProfile] = await db
        .select({ id: business.id })
        .from(business)
        .where(eq(business.userId, session.user.id))
        .limit(1)

    return { session, businessProfile: businessProfile ?? null, reqHeaders }
}

export async function trackHiredDesignerService(serviceId: string): Promise<HireActionResult> {
    const parsedId = z.string().uuid("Invalid service ID format.").safeParse(serviceId)
    if (!parsedId.success) return { success: false, error: "Invalid designer service." }

    const { session, businessProfile, reqHeaders } = await getCurrentBusiness()
    if (!session?.user || !businessProfile) {
        return { success: false, error: "Sign in with a business account to track hired services." }
    }

    const clientIp = getClientIpFromHeaders(reqHeaders)
    const rateCheck = await checkRateLimit(
        {
            keyPrefix: "track-hired",
            limit: 20,
            windowSeconds: 300,
        },
        `${businessProfile.id}:${clientIp}`
    )

    if (!rateCheck.success) {
        return { success: false, error: "Too many requests. Please wait a moment." }
    }

    const [listing] = await db
        .select({
            serviceId: designerServiceTable.id,
            designerId: packagingDesignerTable.id,
            serviceTitle: designerServiceTable.title,
            designerName: packagingDesignerTable.displayName,
            fullName: packagingDesignerTable.fullName,
            designerEmail: packagingDesignerTable.email,
            price: designerServiceTable.price,
            pricingModel: designerServiceTable.pricingModel,
            turnaroundDays: designerServiceTable.turnaroundDays,
            sampleImage: designerServiceTable.sampleImages,
        })
        .from(designerServiceTable)
        .innerJoin(packagingDesignerTable, eq(designerServiceTable.designerId, packagingDesignerTable.id))
        .where(and(
            eq(designerServiceTable.id, parsedId.data),
            eq(designerServiceTable.status, "active"),
            eq(packagingDesignerTable.isActive, true),
        ))
        .limit(1)

    if (!listing) return { success: false, error: "This designer service is no longer available." }

    try {
        await db.insert(businessHiredServiceTable).values({
            id: crypto.randomUUID(),
            businessId: businessProfile.id,
            serviceId: listing.serviceId,
            designerId: listing.designerId,
            serviceTitle: listing.serviceTitle,
            designerName: listing.designerName || listing.fullName,
            designerEmail: listing.designerEmail,
            price: listing.price,
            pricingModel: listing.pricingModel,
            turnaroundDays: listing.turnaroundDays,
            sampleImage: listing.sampleImage?.[0] ?? null,
        })
    } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
            return { success: false, error: "This service is already in your hired-services list." }
        }
        console.error("Could not track hired designer service:", error)
        return { success: false, error: "Could not track this service. Please try again." }
    }

    revalidatePath("/business")
    revalidatePath("/business/designers")
    revalidatePath("/business/hired-services")
    return { success: true }
}

const customProjectSchema = z.object({
    serviceTitle: z.string().trim().min(3, "Project title must be at least 3 characters.").max(160, "Project title cannot exceed 160 characters."),
    designerName: z.string().trim().min(2, "Designer name is required.").max(200, "Designer name is too long."),
    designerEmail: z.string().trim().toLowerCase().email("Valid designer email is required.").max(255),
    price: z.coerce.number().positive("Price must be greater than zero.").max(999999999, "Price is too large."),
    pricingModel: z.enum(["per_project", "hourly", "per_design"]),
    turnaroundDays: z.coerce.number().int("Turnaround must be an integer.").min(1).max(365),
})

export async function trackCustomProject(data: {
    serviceTitle: string
    designerName: string
    designerEmail: string
    price: number | string
    pricingModel: "per_project" | "hourly" | "per_design"
    turnaroundDays: number | string
}): Promise<HireActionResult> {
    const parsed = customProjectSchema.safeParse(data)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid project details." }
    }

    const { session, businessProfile, reqHeaders } = await getCurrentBusiness()
    if (!session?.user || !businessProfile) {
        return { success: false, error: "Sign in with a business account to track hired services." }
    }

    const clientIp = getClientIpFromHeaders(reqHeaders)
    const rateCheck = await checkRateLimit(
        {
            keyPrefix: "track-custom",
            limit: 15,
            windowSeconds: 300,
        },
        `${businessProfile.id}:${clientIp}`
    )

    if (!rateCheck.success) {
        return { success: false, error: "Too many project submissions. Please wait a moment." }
    }

    try {
        await db.insert(businessHiredServiceTable).values({
            id: crypto.randomUUID(),
            businessId: businessProfile.id,
            serviceTitle: parsed.data.serviceTitle,
            designerName: parsed.data.designerName,
            designerEmail: parsed.data.designerEmail,
            price: parsed.data.price.toFixed(2),
            pricingModel: parsed.data.pricingModel,
            turnaroundDays: parsed.data.turnaroundDays,
            status: "active",
        })
    } catch (error) {
        console.error("Could not add custom hired project:", error)
        return { success: false, error: "Could not track this project. Please try again." }
    }

    revalidatePath("/business")
    revalidatePath("/business/hired-services")
    return { success: true }
}

export async function completeHiredDesignerService(hiredServiceId: string): Promise<HireActionResult> {
    const parsedId = z.string().uuid("Invalid hired service ID.").safeParse(hiredServiceId)
    if (!parsedId.success) return { success: false, error: "Invalid hired service." }

    const { session, businessProfile } = await getCurrentBusiness()
    if (!session?.user || !businessProfile) {
        return { success: false, error: "Sign in with a business account to manage hired services." }
    }

    try {
        const updated = await db
            .update(businessHiredServiceTable)
            .set({ status: "completed", completedAt: new Date() })
            .where(and(
                eq(businessHiredServiceTable.id, parsedId.data),
                eq(businessHiredServiceTable.businessId, businessProfile.id),
                eq(businessHiredServiceTable.status, "active"),
            ))
            .returning({ id: businessHiredServiceTable.id })

        if (!updated.length) return { success: false, error: "This active service could not be found." }
    } catch (error) {
        console.error("Could not complete hired designer service:", error)
        return { success: false, error: "Could not update this service. Please try again." }
    }

    revalidatePath("/business/hired-services")
    revalidatePath("/business")
    return { success: true }
}
