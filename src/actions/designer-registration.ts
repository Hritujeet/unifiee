"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { manufacturerTable } from "@/lib/db/schema/manufacturer";
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer";
import { business } from "@/lib/db/schema/business";
import { designerOnboardingSchema } from "@/lib/zod-schema";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/server/rate-limit";
import { eq, or } from "drizzle-orm";
import { z } from "zod";

export async function registerDesignerAction(data: z.infer<typeof designerOnboardingSchema>) {
    const inputPhone = data?.phone || "";
    const inputEmail = data?.email || "";

    try {
        const reqHeaders = await headers();
        const clientIp = getClientIpFromHeaders(reqHeaders);

        // 1. Require authenticated session
        const session = await auth.api.getSession({ headers: reqHeaders });
        if (!session?.user) {
            return {
                success: false,
                error: "You must be signed in to register as a designer. Please log in or refresh your session."
            };
        }

        const userId = session.user.id;

        // 2. Server-side Rate Limiting (max 5 registration attempts per 10 minutes)
        const rateCheck = await checkRateLimit(
            {
                keyPrefix: "designer-reg",
                limit: 5,
                windowSeconds: 600,
            },
            `${userId}:${clientIp}`
        );

        if (!rateCheck.success) {
            return {
                success: false,
                error: `Too many registration attempts. Please wait ${rateCheck.resetInSeconds} seconds before trying again.`
            };
        }

        // 3. Prevent double-registration — check if already registered
        const [existingManufacturer, existingDesigner, existingBusiness] = await Promise.all([
            db.select({ id: manufacturerTable.id }).from(manufacturerTable).where(eq(manufacturerTable.userId, userId)).limit(1),
            db.select({ id: packagingDesignerTable.id }).from(packagingDesignerTable).where(eq(packagingDesignerTable.userId, userId)).limit(1),
            db.select({ id: business.id }).from(business).where(eq(business.userId, userId)).limit(1),
        ]);

        if (existingManufacturer.length > 0) {
            return {
                success: false,
                error: "This account is already registered as a Manufacturer. Each account can only hold one vendor role."
            };
        }
        if (existingDesigner.length > 0) {
            return {
                success: false,
                error: "You already have an active Packaging Designer profile registered with this account."
            };
        }
        if (existingBusiness.length > 0) {
            return {
                success: false,
                error: "This account is already registered as an F&B Business. Buyer accounts cannot register as designers."
            };
        }

        // 4. Validate form data
        const parsed = designerOnboardingSchema.safeParse(data);
        if (!parsed.success) {
            const firstIssues = parsed.error.issues
                .slice(0, 3)
                .map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`)
                .join("; ");
            return {
                success: false,
                error: `Form validation failed — ${firstIssues}`
            };
        }

        const validData = parsed.data;

        // Check if phone or email is already registered by another designer
        const existingContact = await db
            .select({ id: packagingDesignerTable.id, phone: packagingDesignerTable.phone, email: packagingDesignerTable.email })
            .from(packagingDesignerTable)
            .where(
                or(
                    eq(packagingDesignerTable.phone, validData.phone),
                    eq(packagingDesignerTable.email, validData.email.toLowerCase())
                )
            )
            .limit(1);

        if (existingContact.length > 0) {
            if (existingContact[0].phone === validData.phone) {
                return {
                    success: false,
                    error: `The mobile number '${validData.phone}' is already registered with another designer profile. Please use a different phone number.`
                };
            }
            if (existingContact[0].email === validData.email.toLowerCase()) {
                return {
                    success: false,
                    error: `The email address '${validData.email}' is already registered with another designer profile.`
                };
            }
        }
        
        // Ensure additional links are grouped securely
        const additionalLinks: Record<string, string> = {};
        if (validData.behance) additionalLinks.behance = validData.behance;
        if (validData.dribbble) additionalLinks.dribbble = validData.dribbble;
        if (validData.instagram) additionalLinks.instagram = validData.instagram;
        if (validData.linkedin) additionalLinks.linkedin = validData.linkedin;
        if (validData.website) additionalLinks.website = validData.website;

        // 5. Insert
        await db.insert(packagingDesignerTable).values({
            id: crypto.randomUUID(),
            userId,
            fullName: validData.fullName,
            displayName: validData.displayName || null,
            email: validData.email.toLowerCase(),
            phone: validData.phone,
            city: validData.city,
            state: validData.state,
            headline: validData.headline,
            bio: validData.bio || null,
            yearsOfExperience: validData.yearsOfExperience || 0,
            specializations: validData.specializations,
            packagingDesignSpecializations: validData.packagingDesignSpecializations,
            softwareTools: validData.softwareTools,
            industriesServed: validData.industriesServed || [],
            portfolioUrl: validData.portfolioUrl,
            additionalLinks: Object.keys(additionalLinks).length > 0 ? additionalLinks : null,
            pricingModel: validData.pricingModel,
            startingPrice: validData.startingPrice?.toString() || null,
            turnaroundTime: validData.turnaroundTime || null,
            revisionsIncluded: validData.revisionsIncluded || 0,
            availabilityStatus: validData.availabilityStatus,
        });

        return { success: true };
    } catch (error: any) {
        console.error("Designer registration error:", error);
        const dbError = error?.cause || error;
        if (dbError?.code === "23505" || error?.code === "23505") {
            const detail = String(dbError?.detail || dbError?.constraint || "").toLowerCase();
            if (detail.includes("phone")) {
                return {
                    success: false,
                    error: `The mobile number '${inputPhone}' is already registered in the system. Please use a different phone number.`
                };
            }
            if (detail.includes("email")) {
                return {
                    success: false,
                    error: `The email address '${inputEmail}' is already registered with an existing designer profile.`
                };
            }
            if (detail.includes("user_id")) {
                return {
                    success: false,
                    error: "Your user account already has a registered designer profile."
                };
            }
            return {
                success: false,
                error: "Duplicate entry: A designer profile with these credentials already exists."
            };
        }

        const rawMessage = dbError?.message || error?.message || "Unknown database error";
        return {
            success: false,
            error: `Registration could not be completed: ${rawMessage}`
        };
    }
}
