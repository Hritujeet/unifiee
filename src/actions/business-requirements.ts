"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema/business"
import {
    businessRequirementsTable,
    type BusinessRequirement,
} from "@/lib/db/schema/business-requirement"
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/server/rate-limit"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"
import { triggerEntityEmbedding, buildRequirementTemplate } from "@/lib/ai/embeddings"
import { aiDocumentsTable } from "@/lib/db/schema/ai-document"
import { beginIdempotency, completeIdempotency, idempotencyResponse } from "@/lib/server/idempotency"

const packagingUseValues = [
    "coffee",
    "food",
    "dessert",
    "delivery",
    "takeaway",
    "other",
] as const

const packagingTypeValues = [
    "cups",
    "boxes",
    "bags",
    "cutlery",
    "containers",
    "custom",
] as const

const createRequirementSchema = z.object({
    title: z.string().trim().min(3, "Title must be at least 3 characters long.").max(255),
    packagingUse: z.enum(packagingUseValues, {
        error: "Please select a valid packaging use.",
    }),
    packagingType: z.enum(packagingTypeValues, {
        error: "Please select a valid packaging type.",
    }),
    quantity: z.string().trim().min(1, "Quantity is required.").max(120),
    size: z.string().trim().min(1, "Size or dimensions are required.").max(255),
    material: z.string().trim().min(1, "Material specification is required.").max(255),
    brandingNeeded: z.boolean().default(false),
    deliveryLocation: z.string().trim().min(2, "Delivery city/address is required.").max(1000),
    requiredByDate: z.string().trim().min(1, "Required delivery timeframe is required.").max(120),
    rawDescription: z.string().trim().max(4000).optional().nullable(),
    idempotencyKey: z.string().uuid().optional(),
})

export type CreateRequirementInput = z.infer<typeof createRequirementSchema>

export type ActionResult<T = unknown> = {
    success: boolean
    error?: string
    data?: T
}

async function getAuthenticatedBusiness() {
    const reqHeaders = await headers()
    const session = await auth.api.getSession({ headers: reqHeaders })
    if (!session?.user) {
        return { session: null, businessProfile: null, reqHeaders }
    }

    const [businessProfile] = await db
        .select({ id: business.id })
        .from(business)
        .where(eq(business.userId, session.user.id))
        .limit(1)

    return { session, businessProfile: businessProfile ?? null, reqHeaders }
}

export async function createRequirementAction(
    input: CreateRequirementInput
): Promise<ActionResult<{ id: string }>> {
    let idempotencyId: string | null = null
    try {
        const parsed = createRequirementSchema.safeParse(input)
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid requirement data." }
        }
        const { session, businessProfile, reqHeaders } = await getAuthenticatedBusiness()

        if (!session?.user) {
            return {
                success: false,
                error: "You must be signed in to submit a packaging requirement. Please log in or refresh your session.",
            }
        }

        if (!businessProfile) {
            return {
                success: false,
                error: "Only registered F&B business accounts can submit packaging requirements.",
            }
        }
        const idempotency = idempotencyResponse(await beginIdempotency(
            "create-business-requirement",
            parsed.data.idempotencyKey ?? crypto.randomUUID(),
            session.user.id,
            parsed.data,
        ))
        if (idempotency.handled) return idempotency.response as ActionResult<{ id: string }>
        idempotencyId = idempotency.id

        // Rate limit: max 10 requirement submissions per 5 minutes
        const clientIp = getClientIpFromHeaders(reqHeaders)
        const rateCheck = await checkRateLimit(
            {
                keyPrefix: "create-req",
                limit: 10,
                windowSeconds: 300,
            },
            `${businessProfile.id}:${clientIp}`
        )

        if (!rateCheck.success) {
            await completeIdempotency(idempotency.id, { success: false, error: "Too many requirements created recently. Please wait before submitting again." })
            return {
                success: false,
                error: `Too many requirements created recently. Please wait ${rateCheck.resetInSeconds} seconds before submitting again.`,
            }
        }

        const data = parsed.data
        const requirementId = crypto.randomUUID()

        await db.insert(businessRequirementsTable).values({
            id: requirementId,
            businessId: businessProfile.id,
            title: data.title,
            packagingUse: data.packagingUse,
            packagingType: data.packagingType,
            quantity: data.quantity,
            size: data.size,
            material: data.material,
            brandingNeeded: data.brandingNeeded,
            deliveryLocation: data.deliveryLocation,
            requiredByDate: data.requiredByDate,
            rawDescription: data.rawDescription || null,
            status: "requirement_received",
        })

        // Keep the requirement vector private; it is only used as this owner's query.
        triggerEntityEmbedding({
            entityType: "requirement",
            entityId: requirementId,
            ownerId: businessProfile.id,
            visibilityScope: "private",
            title: data.title,
            fullText: buildRequirementTemplate({
                title: data.title,
                packagingUse: data.packagingUse,
                packagingType: data.packagingType,
                quantity: data.quantity,
                size: data.size,
                material: data.material,
                brandingNeeded: data.brandingNeeded,
                deliveryLocation: data.deliveryLocation,
                requiredByDate: data.requiredByDate,
                rawDescription: data.rawDescription,
            }),
            metadata: {
                title: data.title,
                packagingUse: data.packagingUse,
                packagingType: data.packagingType,
                businessId: businessProfile.id,
            },
        })

        revalidatePath("/business")
        revalidatePath("/business/requirements")

        const response = {
            success: true,
            data: { id: requirementId },
        }
        await completeIdempotency(idempotency.id, response)
        return response
    } catch (error) {
        console.error("Error creating business requirement:", error)
        const message = "Failed to submit business requirement. Please try again."
        if (idempotencyId) await completeIdempotency(idempotencyId, { success: false, error: message })
        return { success: false, error: message }
    }
}

export async function getBusinessRequirementsAction(): Promise<ActionResult<BusinessRequirement[]>> {
    try {
        const { session, businessProfile } = await getAuthenticatedBusiness()

        if (!session?.user || !businessProfile) {
            return { success: true, data: [] }
        }

        const requirements = await db
            .select()
            .from(businessRequirementsTable)
            .where(eq(businessRequirementsTable.businessId, businessProfile.id))
            .orderBy(desc(businessRequirementsTable.createdAt))

        return { success: true, data: requirements }
    } catch (error: unknown) {
        const err = error as { digest?: string; message?: string };
        if (err?.digest === "DYNAMIC_SERVER_USAGE" || err?.message?.includes("Dynamic server usage")) {
            throw error;
        }
        console.error("Error fetching business requirements:", error)
        return { success: false, error: "Could not load requirements." }
    }
}

export async function deleteRequirementAction(requirementId: string): Promise<ActionResult> {
    try {
        const parsedId = z.string().uuid().safeParse(requirementId)
        if (!parsedId.success) {
            return { success: false, error: "Invalid requirement ID." }
        }

        const { session, businessProfile } = await getAuthenticatedBusiness()
        if (!session?.user || !businessProfile) {
            return { success: false, error: "Unauthorized." }
        }

        const deleted = await db
            .delete(businessRequirementsTable)
            .where(and(
                eq(businessRequirementsTable.id, parsedId.data),
                eq(businessRequirementsTable.businessId, businessProfile.id),
            ))
            .returning({ id: businessRequirementsTable.id })

        if (!deleted.length) {
            return { success: false, error: "Requirement not found or access denied." }
        }

        await db.delete(aiDocumentsTable).where(and(
            eq(aiDocumentsTable.entityType, "requirement"),
            eq(aiDocumentsTable.entityId, parsedId.data),
            eq(aiDocumentsTable.ownerId, businessProfile.id),
        ))

        revalidatePath("/business")
        revalidatePath("/business/requirements")
        return { success: true }
    } catch (error) {
        console.error("Error deleting requirement:", error)
        return { success: false, error: "Could not delete requirement." }
    }
}
