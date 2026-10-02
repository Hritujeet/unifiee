"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { business } from "@/lib/db/schema/business";
import { manufacturerTable } from "@/lib/db/schema/manufacturer";
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer";
import { businessOnboardingSchema } from "@/lib/zod-schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function registerBusinessAction(data: z.infer<typeof businessOnboardingSchema>) {
    try {
        // 1. Require authenticated session
        const reqHeaders = await headers();
        const session = await auth.api.getSession({ headers: reqHeaders });
        if (!session?.user) {
            return { success: false, error: "You must be signed in to register as a business" };
        }

        const userId = session.user.id;

        // 2. Prevent double-registration
        const [existingBusiness, existingManufacturer, existingDesigner] = await Promise.all([
            db.select({ id: business.id }).from(business).where(eq(business.userId, userId)).limit(1),
            db.select({ id: manufacturerTable.id }).from(manufacturerTable).where(eq(manufacturerTable.userId, userId)).limit(1),
            db.select({ id: packagingDesignerTable.id }).from(packagingDesignerTable).where(eq(packagingDesignerTable.userId, userId)).limit(1),
        ]);

        if (existingBusiness.length > 0) {
            return { success: false, error: "You are already registered as a business" };
        }
        if (existingManufacturer.length > 0 || existingDesigner.length > 0) {
            return { success: false, error: "You are already registered as a vendor and cannot register as a business" };
        }

        // 3. Validate form data
        const parsed = businessOnboardingSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: "Invalid form data" };
        }

        const validData = parsed.data;

        // 4. Insert
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
    } catch (error: any) {
        console.error("Business registration error:", error);
        if (error.code === "23505") {
            return { success: false, error: "Email or phone already registered" };
        }
        return { success: false, error: "Something went wrong. Please try again." };
    }
}
