"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { business } from "@/lib/db/schema/business";
import { manufacturerTable } from "@/lib/db/schema/manufacturer";
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer";
import { businessOnboardingSchema } from "@/lib/zod-schema";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/server/rate-limit";
import { eq, or } from "drizzle-orm";
import { z } from "zod";

export async function registerBusinessAction(data: z.infer<typeof businessOnboardingSchema>) {
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
                error: "You must be signed in to register as a business. Please log in or refresh your session."
            };
        }

        const userId = session.user.id;

        // 2. Server-side Rate Limiting (max 5 registration attempts per 10 minutes)
        const rateCheck = await checkRateLimit(
            {
                keyPrefix: "business-reg",
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

        // 3. Prevent double-registration
        const [existingBusiness, existingManufacturer, existingDesigner] = await Promise.all([
            db.select({ id: business.id }).from(business).where(eq(business.userId, userId)).limit(1),
            db.select({ id: manufacturerTable.id }).from(manufacturerTable).where(eq(manufacturerTable.userId, userId)).limit(1),
            db.select({ id: packagingDesignerTable.id }).from(packagingDesignerTable).where(eq(packagingDesignerTable.userId, userId)).limit(1),
        ]);

        if (existingBusiness.length > 0) {
            return {
                success: false,
                error: "You already have a business profile registered with this account."
            };
        }
        if (existingManufacturer.length > 0) {
            return {
                success: false,
                error: "This account is registered as a Manufacturer. Vendor accounts cannot register as buyer businesses."
            };
        }
        if (existingDesigner.length > 0) {
            return {
                success: false,
                error: "This account is registered as a Packaging Designer. Vendor accounts cannot register as buyer businesses."
            };
        }

        // 4. Validate form data with hardened schema
        const parsed = businessOnboardingSchema.safeParse(data);
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

        // Check if phone or email is already registered by another business
        const existingContact = await db
            .select({ id: business.id, phone: business.phone, email: business.email })
            .from(business)
            .where(
                or(
                    eq(business.phone, validData.phone),
                    eq(business.email, validData.email.toLowerCase())
                )
            )
            .limit(1);

        if (existingContact.length > 0) {
            if (existingContact[0].phone === validData.phone) {
                return {
                    success: false,
                    error: `The mobile number '${validData.phone}' is already registered with another business profile. Please use a different phone number.`
                };
            }
            if (existingContact[0].email === validData.email.toLowerCase()) {
                return {
                    success: false,
                    error: `The email address '${validData.email}' is already registered with another business profile.`
                };
            }
        }

        // 5. Insert sanitized data
        await db.insert(business).values({
            id: crypto.randomUUID(),
            userId,
            name: validData.fullname.split(" ")[0] || validData.fullname,
            fullName: validData.fullname,
            ownerName: validData.ownerName,
            businessName: validData.businessName,
            email: validData.email.toLowerCase(),
            phone: validData.phone,
            businessType: validData.businessType,
            businessAddress: validData.businessAddress,
            role: validData.role,
            gstin: validData.gstin || null,
            website: validData.website || null,
            socials: validData.socials
                ?.filter((s) => s.platform && s.url)
                .map((s) => `${s.platform}:${s.url}`) || [],
        });

        return { success: true };
    } catch (error: unknown) {
        console.error("Business registration error:", error);
        const err = error as { cause?: { code?: string; detail?: string; constraint?: string; message?: string }; code?: string; detail?: string; constraint?: string; message?: string };
        const dbError: { code?: string; detail?: string; constraint?: string; message?: string } = (err?.cause ?? err) as { code?: string; detail?: string; constraint?: string; message?: string };
        if (dbError?.code === "23505" || err?.code === "23505") {
            const detail = String(dbError?.detail || dbError?.constraint || "").toLowerCase();
            if (detail.includes("phone")) {
                return {
                    success: false,
                    error: `The phone number '${inputPhone}' is already registered with an existing business profile.`
                };
            }
            if (detail.includes("email")) {
                return {
                    success: false,
                    error: `The email address '${inputEmail}' is already registered with an existing business profile.`
                };
            }
            if (detail.includes("user_id")) {
                return {
                    success: false,
                    error: "Your user account already has a registered business profile."
                };
            }
            return {
                success: false,
                error: "Duplicate entry: A business profile with these credentials already exists."
            };
        }

        const rawMessage = dbError?.message || err?.message || "Unknown database error";
        return {
            success: false,
            error: `Registration could not be completed: ${rawMessage}`
        };
    }
}
