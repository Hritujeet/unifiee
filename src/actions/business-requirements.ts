"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema/business"
import {
    businessRequirementsTable,
    type BusinessRequirement,
} from "@/lib/db/schema/business-requirement"
import { and, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

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
})

export type CreateRequirementInput = z.infer<typeof createRequirementSchema>

export type ActionResult<T = unknown> = {
    success: boolean
    error?: string
    data?: T
}

async function getAuthenticatedBusiness() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
        return { session: null, businessProfile: null }
    }

    const [businessProfile] = await db
        .select({ id: business.id })
        .from(business)
        .where(eq(business.userId, session.user.id))
        .limit(1)

    return { session, businessProfile: businessProfile ?? null }
}

export async function createRequirementAction(
    input: CreateRequirementInput
): Promise<ActionResult<{ id: string }>> {
    try {
        const { session, businessProfile } = await getAuthenticatedBusiness()

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

        const parsed = createRequirementSchema.safeParse(input)
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message ?? "Invalid requirement data."
            return { success: false, error: firstError }
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

        revalidatePath("/business")
        revalidatePath("/business/requirements")

        return {
            success: true,
            data: { id: requirementId },
        }
    } catch (error) {
        console.error("Error creating business requirement:", error)
        const message = error instanceof Error ? error.message : "Database error while saving requirement."
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
    } catch (error) {
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

        revalidatePath("/business")
        revalidatePath("/business/requirements")
        return { success: true }
    } catch (error) {
        console.error("Error deleting requirement:", error)
        return { success: false, error: "Could not delete requirement." }
    }
}
