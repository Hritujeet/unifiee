"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { manufacturerTable } from "@/lib/db/schema/manufacturer";
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer";
import { business } from "@/lib/db/schema/business";
import { manufacturerOnboardingSchema } from "@/lib/zod-schema";
import { checkRateLimit, getClientIpFromHeaders } from "@/lib/server/rate-limit";
import { eq, or } from "drizzle-orm";
import { z } from "zod";

export async function registerManufacturerAction(data: z.infer<typeof manufacturerOnboardingSchema>) {
    const inputMobile = data?.mobile || "";
    const inputEmail = data?.email || "";

    try {
        const reqHeaders = await headers();
        const clientIp = getClientIpFromHeaders(reqHeaders);

        // 1. Require authenticated session
        const session = await auth.api.getSession({ headers: reqHeaders });
        if (!session?.user) {
            return {
                success: false,
                error: "You must be signed in to register as a manufacturer. Please log in or refresh your session."
            };
        }

        const userId = session.user.id;

        // 2. Server-side Rate Limiting (max 5 registration attempts per 10 minutes)
        const rateCheck = await checkRateLimit(
            {
                keyPrefix: "manufacturer-reg",
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
                error: "This account is already registered as a Manufacturer."
            };
        }
        if (existingDesigner.length > 0) {
            return {
                success: false,
                error: "This account is already registered as a Packaging Designer. Each vendor account can only hold one vendor role."
            };
        }
        if (existingBusiness.length > 0) {
            return {
                success: false,
                error: "This account is registered as an F&B Business. Buyer accounts cannot register as manufacturers."
            };
        }

        // 4. Validate form data
        const parsed = manufacturerOnboardingSchema.safeParse(data);
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

        // Check if phone or email is already registered by another manufacturer
        const existingContact = await db
            .select({ id: manufacturerTable.id, phone: manufacturerTable.phone, email: manufacturerTable.email })
            .from(manufacturerTable)
            .where(
                or(
                    eq(manufacturerTable.phone, validData.mobile),
                    eq(manufacturerTable.email, validData.email.toLowerCase())
                )
            )
            .limit(1);

        if (existingContact.length > 0) {
            if (existingContact[0].phone === validData.mobile) {
                return {
                    success: false,
                    error: `The mobile number '${validData.mobile}' is already registered with another manufacturer profile. Please provide a different phone number.`
                };
            }
            if (existingContact[0].email === validData.email.toLowerCase()) {
                return {
                    success: false,
                    error: `The email address '${validData.email}' is already registered with another manufacturer profile.`
                };
            }
        }

        // 5. Insert
        await db.insert(manufacturerTable).values({
            id: crypto.randomUUID(),
            userId,
            name: validData.fullname.split(" ")[0] || validData.fullname,
            fullName: validData.fullname,
            companyName: validData.companyFirmName,
            email: validData.email.toLowerCase(),
            phone: validData.mobile,
            packagingCategories: validData.packagingCategories,
            capabilities: validData.capabilities,
            manufacturerAddress: validData.address,
            gstin: validData.gstin || null,
            socials: validData.socials
                ?.filter((s) => s.platform && s.url)
                .map((s) => `${s.platform}:${s.url}`) || [],
        });

        return { success: true };
    } catch (error: any) {
        console.error("Manufacturer registration error:", error);
        const dbError = error?.cause || error;
        if (dbError?.code === "23505" || error?.code === "23505") {
            const detail = String(dbError?.detail || dbError?.constraint || "").toLowerCase();
            if (detail.includes("phone") || detail.includes("mobile")) {
                return {
                    success: false,
                    error: `The mobile number '${inputMobile}' is already registered with an existing manufacturer profile.`
                };
            }
            if (detail.includes("email")) {
                return {
                    success: false,
                    error: `The email address '${inputEmail}' is already registered with an existing manufacturer profile.`
                };
            }
            if (detail.includes("user_id")) {
                return {
                    success: false,
                    error: "Your user account already has a registered manufacturer profile."
                };
            }
            return {
                success: false,
                error: "Duplicate entry: A manufacturer profile with these credentials already exists."
            };
        }

        const rawMessage = dbError?.message || error?.message || "Unknown database error";
        return {
            success: false,
            error: `Registration could not be completed: ${rawMessage}`
        };
    }
}
