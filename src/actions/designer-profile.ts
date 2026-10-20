"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer"
import { designerPackagingSpecializationValues } from "@/lib/zod-schema"
import { getFormDataLines, getFormDataValue, getOptionalFormDataText } from "@/lib/server/form-data"
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/server/rate-limit"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

const optionalNumber = z.preprocess(
    (value) => value === "" || value === null || value === undefined ? undefined : value,
    z.coerce.number().finite().min(0).max(999_999_999_999.99).optional(),
)

const secureUrl = z.string().trim().max(2048, "URL is too long.").url("Enter a valid URL.")
    .refine((value) => /^https:\/\//i.test(value), "Use an HTTPS URL.")
const optionalUrl = secureUrl.optional()
const requiredInteger = (minimum: number, maximum: number) => z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? Number.NaN : value,
    z.coerce.number().finite().int().min(minimum).max(maximum),
)

const profileSchema = z.object({
    fullName: z.string().trim().min(2, "Enter your name.").max(300),
    displayName: z.string().trim().max(300).optional(),
    phone: z.string().trim().max(40, "Phone number is too long.")
        .regex(/^\+?[\d\s().-]+$/, "Enter a valid phone number.")
        .refine((value) => {
            const digits = value.replace(/\D/g, "").length
            return digits >= 10 && digits <= 15
        }, "Enter a phone number with 10 to 15 digits."),
    profilePhotoUrl: optionalUrl,
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    headline: z.string().trim().max(500).optional(),
    bio: z.string().trim().max(5000).optional(),
    yearsOfExperience: requiredInteger(0, 80),
    specializations: z.array(z.string().trim().min(1).max(100)).max(30),
    packagingDesignSpecializations: z.array(z.enum(designerPackagingSpecializationValues)).min(1, "Choose at least one packaging specialty."),
    softwareTools: z.array(z.string().trim().min(1).max(100)).max(30),
    languages: z.array(z.string().trim().min(1).max(100)).max(30),
    industriesServed: z.array(z.string().trim().min(1).max(100)).max(30),
    portfolioUrl: secureUrl,
    behance: optionalUrl,
    dribbble: optionalUrl,
    instagram: optionalUrl,
    linkedin: optionalUrl,
    website: optionalUrl,
    pricingModel: z.enum(["per_project", "hourly", "per_design"]),
    startingPrice: optionalNumber,
    hourlyRate: optionalNumber,
    chargesNotes: z.string().trim().max(2000).optional(),
    turnaroundTime: z.string().trim().max(255).optional(),
    revisionsIncluded: requiredInteger(0, 100),
    availabilityStatus: z.enum(["available", "limited", "unavailable"]),
})

export async function updateDesignerProfile(formData: FormData) {
    if (!(formData instanceof FormData)) {
        return { success: false, error: "Invalid profile submission." }
    }

    const reqHeaders = await headers()
    const session = await auth.api.getSession({ headers: reqHeaders })
    if (!session?.user) {
        return { success: false, error: "Please sign in again to update your profile." }
    }

    // Rate limiting: max 20 profile updates per 10 minutes
    const clientIp = getClientIpFromHeaders(reqHeaders)
    const rateCheck = await checkRateLimit(
        {
            keyPrefix: "update-profile",
            limit: 20,
            windowSeconds: 600,
        },
        `${session.user.id}:${clientIp}`
    )

    if (!rateCheck.success) {
        return { success: false, error: "Too many profile updates. Please wait a moment." }
    }

    const parsed = profileSchema.safeParse({
        fullName: getFormDataValue(formData, "fullName"),
        displayName: getOptionalFormDataText(formData, "displayName"),
        phone: getFormDataValue(formData, "phone"),
        profilePhotoUrl: getOptionalFormDataText(formData, "profilePhotoUrl"),
        city: getOptionalFormDataText(formData, "city"),
        state: getOptionalFormDataText(formData, "state"),
        country: getOptionalFormDataText(formData, "country"),
        headline: getOptionalFormDataText(formData, "headline"),
        bio: getOptionalFormDataText(formData, "bio"),
        yearsOfExperience: getFormDataValue(formData, "yearsOfExperience"),
        specializations: getFormDataLines(formData, "specializations", /[\n,]/),
        packagingDesignSpecializations: getFormDataLines(formData, "packagingDesignSpecializations"),
        softwareTools: getFormDataLines(formData, "softwareTools", /[\n,]/),
        languages: getFormDataLines(formData, "languages", /[\n,]/),
        industriesServed: getFormDataLines(formData, "industriesServed", /[\n,]/),
        portfolioUrl: getFormDataValue(formData, "portfolioUrl"),
        behance: getOptionalFormDataText(formData, "behance"),
        dribbble: getOptionalFormDataText(formData, "dribbble"),
        instagram: getOptionalFormDataText(formData, "instagram"),
        linkedin: getOptionalFormDataText(formData, "linkedin"),
        website: getOptionalFormDataText(formData, "website"),
        pricingModel: getFormDataValue(formData, "pricingModel"),
        startingPrice: getFormDataValue(formData, "startingPrice"),
        hourlyRate: getFormDataValue(formData, "hourlyRate"),
        chargesNotes: getOptionalFormDataText(formData, "chargesNotes"),
        turnaroundTime: getOptionalFormDataText(formData, "turnaroundTime"),
        revisionsIncluded: getFormDataValue(formData, "revisionsIncluded"),
        availabilityStatus: getFormDataValue(formData, "availabilityStatus"),
    })

    if (!parsed.success) {
        return {
            success: false,
            error: parsed.error.issues[0]?.message ?? "Check your profile details and try again.",
        }
    }

    const { behance, dribbble, instagram, linkedin, website, ...profile } = parsed.data
    const additionalLinks = Object.fromEntries(
        Object.entries({ behance, dribbble, instagram, linkedin, website }).filter(([, value]) => value),
    )

    try {
        const updated = await db
            .update(packagingDesignerTable)
            .set({
                ...profile,
                profilePhotoUrl: profile.profilePhotoUrl || null,
                displayName: profile.displayName || null,
                city: profile.city || null,
                state: profile.state || null,
                country: profile.country || null,
                headline: profile.headline || null,
                bio: profile.bio || null,
                startingPrice: profile.startingPrice?.toString() ?? null,
                hourlyRate: profile.hourlyRate?.toString() ?? null,
                chargesNotes: profile.chargesNotes || null,
                turnaroundTime: profile.turnaroundTime || null,
                additionalLinks: Object.keys(additionalLinks).length ? additionalLinks : null,
                updatedAt: new Date(),
            })
            .where(eq(packagingDesignerTable.userId, session.user.id))
            .returning({ id: packagingDesignerTable.id })

        if (updated.length === 0) {
            return { success: false, error: "Designer profile not found." }
        }
    } catch (error) {
        console.error("Designer profile update error:", error)
        return { success: false, error: "Could not save your profile. Please try again." }
    }

    revalidatePath("/designer")
    revalidatePath("/designer/profile")
    revalidatePath("/designer/services")
    return { success: true }
}
