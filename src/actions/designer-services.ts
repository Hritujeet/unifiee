"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { designerServiceTable } from "@/lib/db/schema/designer-service"
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer"
import { getFormDataLines, getFormDataValue } from "@/lib/server/form-data"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

const serviceSchema = z.object({
    title: z.string().trim().min(3, "Add a service title.").max(160, "Keep the title under 160 characters."),
    description: z.string().trim().min(20, "Add a little more detail about this service.").max(3000),
    serviceType: z.enum(["packaging_design", "label_design", "brand_identity", "3d_rendering", "print_ready_artwork"]),
    pricingModel: z.enum(["per_project", "hourly", "per_design"]),
    price: z.coerce.number().finite().positive("Price must be greater than zero.")
        .max(9_999_999_999.99, "Price is too high."),
    turnaroundDays: z.coerce.number().int().min(1, "Turnaround must be at least one day.").max(365),
    revisionsIncluded: z.coerce.number().int().min(0).max(50),
    deliverables: z.array(z.string().trim().min(1).max(160)).max(20),
    sampleImages: z.array(z.string().max(2048, "Image URL is too long.").url()
        .refine((value) => /^https:\/\//i.test(value), "Sample images must use HTTPS URLs."))
        .min(1, "Add at least one sample image for this service.")
        .max(8, "Add no more than 8 sample images."),
})

export type CreateDesignerServiceResult = {
    success: boolean
    error?: string
}

export async function createDesignerService(formData: FormData): Promise<CreateDesignerServiceResult> {
    if (!(formData instanceof FormData)) {
        return { success: false, error: "Invalid service submission." }
    }

    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
        return { success: false, error: "Please sign in again to add a service." }
    }

    const [designer] = await db
        .select({ id: packagingDesignerTable.id })
        .from(packagingDesignerTable)
        .where(eq(packagingDesignerTable.userId, session.user.id))
        .limit(1)

    if (!designer) {
        return { success: false, error: "Designer profile not found." }
    }

    const parsed = serviceSchema.safeParse({
        title: getFormDataValue(formData, "title"),
        description: getFormDataValue(formData, "description"),
        serviceType: getFormDataValue(formData, "serviceType"),
        pricingModel: getFormDataValue(formData, "pricingModel"),
        price: getFormDataValue(formData, "price"),
        turnaroundDays: getFormDataValue(formData, "turnaroundDays"),
        revisionsIncluded: getFormDataValue(formData, "revisionsIncluded") || 0,
        deliverables: getFormDataLines(formData, "deliverables"),
        sampleImages: getFormDataLines(formData, "sampleImages"),
    })

    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message ?? "Check the service details and try again." }
    }

    try {
        await db.insert(designerServiceTable).values({
            id: crypto.randomUUID(),
            designerId: designer.id,
            ...parsed.data,
            price: parsed.data.price.toFixed(2),
        })
    } catch (error) {
        console.error("Designer service creation error:", error)
        return { success: false, error: "Could not save this service. Please try again." }
    }

    revalidatePath("/designer")
    revalidatePath("/designer/services")
    return { success: true }
}

export async function deleteDesignerService(serviceId: string): Promise<CreateDesignerServiceResult> {
    const parsedId = z.string().uuid().safeParse(serviceId)
    if (!parsedId.success) {
        return { success: false, error: "Invalid service." }
    }

    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
        return { success: false, error: "Please sign in again to manage this service." }
    }

    const [designer] = await db
        .select({ id: packagingDesignerTable.id })
        .from(packagingDesignerTable)
        .where(eq(packagingDesignerTable.userId, session.user.id))
        .limit(1)

    if (!designer) {
        return { success: false, error: "Designer profile not found." }
    }

    try {
        await db
            .delete(designerServiceTable)
            .where(and(
                eq(designerServiceTable.id, parsedId.data),
                eq(designerServiceTable.designerId, designer.id),
            ))
    } catch (error) {
        console.error("Designer service deletion error:", error)
        return { success: false, error: "Could not remove this service. Please try again." }
    }

    revalidatePath("/designer")
    revalidatePath("/designer/services")
    return { success: true }
}
