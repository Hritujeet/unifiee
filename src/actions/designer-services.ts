"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
    designerServiceTable,
    designerServicePackagesTable,
    designerServiceExtrasTable,
} from "@/lib/db/schema/designer-service"
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer"
import { getFormDataLines, getFormDataValue } from "@/lib/server/form-data"
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/server/rate-limit"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"
import {
    triggerEntityEmbedding,
    triggerRemoveEntityEmbedding,
    buildGigTemplate,
} from "@/lib/ai/embeddings"

// Package schema definition
const packageInputSchema = z.object({
    tier: z.enum(["basic", "standard", "premium"]),
    name: z.string().trim().min(2, "Package name must be at least 2 characters.").max(100),
    description: z.string().trim().min(5, "Package description is required.").max(1000),
    price: z.coerce.number().positive("Price must be greater than zero.").max(9999999),
    deliveryDays: z.coerce.number().int().min(1, "Delivery must be at least 1 day.").max(90),
    revisionsIncluded: z.coerce.number().int().min(-1, "-1 for unlimited, or 0+").max(100),
    deliverables: z.array(z.string().trim().min(1)).min(1, "Include at least one deliverable."),
    sourceFilesIncluded: z.boolean().default(false),
    commercialUseIncluded: z.boolean().default(true),
})

const extraInputSchema = z.object({
    name: z.string().trim().min(2).max(100),
    price: z.coerce.number().positive().max(999999),
    extraDays: z.coerce.number().int().min(0).max(30).default(0),
})

const gigInputSchema = z.object({
    id: z.string().uuid().optional(),
    title: z.string().trim().min(5, "Title must be at least 5 characters.").max(160, "Title is too long."),
    slug: z.string().trim().min(3).max(200).optional(),
    category: z.enum([
        "dieline_structural",
        "label_sticker",
        "logo_brand_identity",
        "3d_mockup_render",
        "full_packaging_set",
    ]),
    description: z.string().trim().min(20, "Add detailed description.").max(5000),
    tags: z.array(z.string().trim().min(1).max(50)).max(15).default([]),
    packagingTypes: z.array(z.string().trim().min(1)).max(20).default([]),
    softwareUsed: z.array(z.string().trim().min(1)).max(20).default([]),
    sampleImages: z.array(z.string().url().refine((url) => /^https:\/\//i.test(url), "Images must use HTTPS URLs."))
        .min(1, "Provide at least one sample image URL.")
        .max(6, "Maximum 6 sample images."),
    faq: z.array(z.object({
        question: z.string().trim().min(3).max(200),
        answer: z.string().trim().min(3).max(1000),
    })).max(10).default([]),
    packages: z.array(packageInputSchema).min(1, "At least Basic package is required.").max(3),
    extras: z.array(extraInputSchema).max(10).default([]),
    status: z.enum(["draft", "published", "paused"]).default("published"),
})

export type GigFormValues = z.infer<typeof gigInputSchema>

export type ActionResult<T = unknown> = {
    success: boolean
    error?: string
    data?: T
}

function generateSlug(title: string, suffix?: string): string {
    const base = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 150)
    const shortId = suffix || crypto.randomUUID().slice(0, 8)
    return `${base}-${shortId}`
}

/**
 * Save or publish a Fiverr-style packaging designer gig
 */
export async function saveDesignerGig(input: GigFormValues): Promise<ActionResult<{ gigId: string; slug: string }>> {
    const parsed = gigInputSchema.safeParse(input)
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid gig details." }
    }

    const reqHeaders = await headers()
    const session = await auth.api.getSession({ headers: reqHeaders })
    if (!session?.user) {
        return { success: false, error: "Please sign in as a designer." }
    }

    const [designer] = await db
        .select()
        .from(packagingDesignerTable)
        .where(eq(packagingDesignerTable.userId, session.user.id))
        .limit(1)

    if (!designer) {
        return { success: false, error: "Designer profile not found." }
    }

    // If publishing, enforce profile completeness
    if (parsed.data.status === "published") {
        const hasBio = Boolean(designer.bio && designer.bio.trim().length >= 10)
        const hasSpecialization = Boolean(
            (designer.packagingDesignSpecializations && designer.packagingDesignSpecializations.length > 0) ||
            (designer.specializations && designer.specializations.length > 0)
        )

        if (!hasBio || !hasSpecialization) {
            return {
                success: false,
                error: "Profile completeness required to publish: please complete your bio and add at least one specialization in your Profile.",
            }
        }
    }

    // Rate limiting: max 30 gig edits per 10 minutes
    const clientIp = getClientIpFromHeaders(reqHeaders)
    const rateCheck = await checkRateLimit(
        { keyPrefix: "save-gig", limit: 30, windowSeconds: 600 },
        `${designer.id}:${clientIp}`
    )
    if (!rateCheck.success) {
        return { success: false, error: "Too many requests. Please wait a moment." }
    }

    const gigId = parsed.data.id || crypto.randomUUID()
    const slug = parsed.data.slug || generateSlug(parsed.data.title)

    // Basic package is mandatory
    const basicPackage = parsed.data.packages.find((p) => p.tier === "basic")
    if (!basicPackage) {
        return { success: false, error: "Basic package tier is mandatory." }
    }

    try {
        await db.transaction(async (tx) => {
            // Check if gig exists
            const [existing] = await tx
                .select({ id: designerServiceTable.id })
                .from(designerServiceTable)
                .where(and(
                    eq(designerServiceTable.id, gigId),
                    eq(designerServiceTable.designerId, designer.id)
                ))
                .limit(1)

            if (existing) {
                // Update gig
                await tx.update(designerServiceTable).set({
                    title: parsed.data.title,
                    slug,
                    category: parsed.data.category,
                    description: parsed.data.description,
                    tags: parsed.data.tags,
                    packagingTypes: parsed.data.packagingTypes,
                    softwareUsed: parsed.data.softwareUsed,
                    faq: parsed.data.faq,
                    sampleImages: parsed.data.sampleImages,
                    status: parsed.data.status,
                    deletedAt: null,
                    // Legacy column sync
                    price: basicPackage.price.toFixed(2),
                    turnaroundDays: basicPackage.deliveryDays,
                    revisionsIncluded: basicPackage.revisionsIncluded === -1 ? 99 : basicPackage.revisionsIncluded,
                    deliverables: basicPackage.deliverables,
                    updatedAt: new Date(),
                }).where(eq(designerServiceTable.id, gigId))
            } else {
                // Insert new gig
                await tx.insert(designerServiceTable).values({
                    id: gigId,
                    designerId: designer.id,
                    title: parsed.data.title,
                    slug,
                    category: parsed.data.category,
                    description: parsed.data.description,
                    tags: parsed.data.tags,
                    packagingTypes: parsed.data.packagingTypes,
                    softwareUsed: parsed.data.softwareUsed,
                    faq: parsed.data.faq,
                    sampleImages: parsed.data.sampleImages,
                    status: parsed.data.status,
                    // Legacy columns
                    price: basicPackage.price.toFixed(2),
                    turnaroundDays: basicPackage.deliveryDays,
                    revisionsIncluded: basicPackage.revisionsIncluded === -1 ? 99 : basicPackage.revisionsIncluded,
                    deliverables: basicPackage.deliverables,
                    serviceType: "packaging_design",
                    pricingModel: "per_project",
                })
            }

            // Sync packages
            await tx.delete(designerServicePackagesTable).where(eq(designerServicePackagesTable.serviceId, gigId))
            for (const pkg of parsed.data.packages) {
                await tx.insert(designerServicePackagesTable).values({
                    id: crypto.randomUUID(),
                    serviceId: gigId,
                    tier: pkg.tier,
                    name: pkg.name,
                    description: pkg.description,
                    price: pkg.price.toFixed(2),
                    deliveryDays: pkg.deliveryDays,
                    revisionsIncluded: pkg.revisionsIncluded,
                    deliverables: pkg.deliverables,
                    sourceFilesIncluded: pkg.sourceFilesIncluded,
                    commercialUseIncluded: pkg.commercialUseIncluded,
                })
            }

            // Sync extras
            await tx.delete(designerServiceExtrasTable).where(eq(designerServiceExtrasTable.serviceId, gigId))
            if (parsed.data.extras && parsed.data.extras.length > 0) {
                for (const extra of parsed.data.extras) {
                    await tx.insert(designerServiceExtrasTable).values({
                        id: crypto.randomUUID(),
                        serviceId: gigId,
                        name: extra.name,
                        price: extra.price.toFixed(2),
                        extraDays: extra.extraDays,
                    })
                }
            }
        })

        // Sync vector embedding:
        // Embed when published, remove if draft or paused
        if (parsed.data.status === "published") {
            triggerEntityEmbedding({
                entityType: "gig",
                entityId: gigId,
                ownerId: designer.id,
                visibilityScope: "public",
                title: parsed.data.title,
                fullText: buildGigTemplate({
                    title: parsed.data.title,
                    serviceType: parsed.data.category,
                    description: parsed.data.description,
                    price: basicPackage.price,
                    pricingModel: "package",
                    turnaroundDays: basicPackage.deliveryDays,
                    deliverables: basicPackage.deliverables,
                }),
                metadata: {
                    title: parsed.data.title,
                    category: parsed.data.category,
                    price: basicPackage.price,
                    designerId: designer.id,
                    slug,
                },
            })
        } else {
            triggerRemoveEntityEmbedding("gig", gigId)
        }
    } catch (err) {
        console.error("Error saving gig:", err)
        return { success: false, error: "Could not save this gig. Please try again." }
    }

    revalidatePath("/designer")
    revalidatePath("/designer/services")
    revalidatePath("/business/designers")
    return { success: true, data: { gigId, slug } }
}

/**
 * Toggle gig pause / published state
 */
export async function toggleGigStatus(gigId: string, nextStatus: "published" | "paused"): Promise<ActionResult> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false, error: "Unauthorized." }

    const [designer] = await db
        .select({ id: packagingDesignerTable.id })
        .from(packagingDesignerTable)
        .where(eq(packagingDesignerTable.userId, session.user.id))
        .limit(1)

    if (!designer) return { success: false, error: "Designer profile not found." }

    const [gig] = await db
        .select()
        .from(designerServiceTable)
        .where(and(
            eq(designerServiceTable.id, gigId),
            eq(designerServiceTable.designerId, designer.id)
        ))
        .limit(1)

    if (!gig) return { success: false, error: "Gig not found." }

    try {
        await db.update(designerServiceTable)
            .set({ status: nextStatus, updatedAt: new Date() })
            .where(eq(designerServiceTable.id, gigId))

        if (nextStatus === "published") {
            triggerEntityEmbedding({
                entityType: "gig",
                entityId: gigId,
                ownerId: designer.id,
                visibilityScope: "public",
                title: gig.title,
                fullText: buildGigTemplate({
                    title: gig.title,
                    serviceType: gig.category || gig.serviceType,
                    description: gig.description,
                    price: gig.price,
                    pricingModel: gig.pricingModel,
                    turnaroundDays: gig.turnaroundDays,
                    deliverables: gig.deliverables,
                }),
                metadata: {
                    title: gig.title,
                    designerId: designer.id,
                    slug: gig.slug,
                },
            })
        } else {
            triggerRemoveEntityEmbedding("gig", gigId)
        }
    } catch (error) {
        console.error("Error toggling gig status:", error)
        return { success: false, error: "Could not update gig status." }
    }

    revalidatePath("/designer/services")
    revalidatePath("/business/designers")
    return { success: true }
}

/**
 * Soft delete a gig
 */
export async function deleteGigAction(gigId: string): Promise<ActionResult> {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false, error: "Unauthorized." }

    const [designer] = await db
        .select({ id: packagingDesignerTable.id })
        .from(packagingDesignerTable)
        .where(eq(packagingDesignerTable.userId, session.user.id))
        .limit(1)

    if (!designer) return { success: false, error: "Designer profile not found." }

    try {
        await db.update(designerServiceTable)
            .set({
                deletedAt: new Date(),
                status: "paused",
                updatedAt: new Date(),
            })
            .where(and(
                eq(designerServiceTable.id, gigId),
                eq(designerServiceTable.designerId, designer.id)
            ))

        triggerRemoveEntityEmbedding("gig", gigId)
    } catch (error) {
        console.error("Error deleting gig:", error)
        return { success: false, error: "Could not delete gig." }
    }

    revalidatePath("/designer/services")
    revalidatePath("/business/designers")
    return { success: true }
}

// ---------------------------------------------------------------------------
// Legacy backward-compatibility actions
// ---------------------------------------------------------------------------

export async function createDesignerService(formData: FormData): Promise<{ success: boolean; error?: string }> {
    if (!(formData instanceof FormData)) {
        return { success: false, error: "Invalid service submission." }
    }

    const title = String(getFormDataValue(formData, "title") || "")
    const description = String(getFormDataValue(formData, "description") || "")
    const price = Number(getFormDataValue(formData, "price") || 5000)
    const turnaroundDays = Number(getFormDataValue(formData, "turnaroundDays") || 7)
    const revisionsIncluded = Number(getFormDataValue(formData, "revisionsIncluded") || 2)
    const deliverables = (getFormDataLines(formData, "deliverables") as string[]) || []
    const sampleImages = (getFormDataLines(formData, "sampleImages") as string[]) || []

    return saveDesignerGig({
        title,
        description,
        category: "dieline_structural",
        sampleImages: sampleImages.length ? sampleImages : ["https://images.unsplash.com/photo-1544816155-12df9643f363"],
        packages: [
            {
                tier: "basic",
                name: "Standard Package",
                description: description || "Complete packaging artwork design",
                price,
                deliveryDays: turnaroundDays,
                revisionsIncluded,
                deliverables: deliverables.length ? deliverables : ["Print-ready vector PDF"],
                sourceFilesIncluded: false,
                commercialUseIncluded: true,
            },
        ],
        status: "published",
        extras: [],
        faq: [],
        packagingTypes: [],
        softwareUsed: [],
        tags: [],
    })
}

export async function deleteDesignerService(serviceId: string): Promise<{ success: boolean; error?: string }> {
    return deleteGigAction(serviceId)
}
