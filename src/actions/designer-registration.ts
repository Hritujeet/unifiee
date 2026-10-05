"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { manufacturerTable } from "@/lib/db/schema/manufacturer";
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer";
import { business } from "@/lib/db/schema/business";
import { designerOnboardingSchema } from "@/lib/zod-schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function registerDesignerAction(data: z.infer<typeof designerOnboardingSchema>) {
    try {
        // 1. Require authenticated session
        const reqHeaders = await headers();
        const session = await auth.api.getSession({ headers: reqHeaders });
        if (!session?.user) {
            return { success: false, error: "You must be signed in to register as a designer" };
        }

        const userId = session.user.id;

        // 2. Prevent double-registration — check if already registered
        const [existingManufacturer, existingDesigner, existingBusiness] = await Promise.all([
            db.select({ id: manufacturerTable.id }).from(manufacturerTable).where(eq(manufacturerTable.userId, userId)).limit(1),
            db.select({ id: packagingDesignerTable.id }).from(packagingDesignerTable).where(eq(packagingDesignerTable.userId, userId)).limit(1),
            db.select({ id: business.id }).from(business).where(eq(business.userId, userId)).limit(1),
        ]);

        if (existingManufacturer.length > 0) return { success: false, error: "You are already registered as a manufacturer" };
        if (existingDesigner.length > 0) return { success: false, error: "You are already registered as a designer" };
        if (existingBusiness.length > 0) return { success: false, error: "You are already registered as a business" };

        // 3. Validate form data
        const parsed = designerOnboardingSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: "Invalid form data" };
        }

        const validData = parsed.data;
        
        // Ensure additional links are grouped
        const additionalLinks: any = {};
        if (validData.behance) additionalLinks.behance = validData.behance;
        if (validData.dribbble) additionalLinks.dribbble = validData.dribbble;
        if (validData.instagram) additionalLinks.instagram = validData.instagram;
        if (validData.linkedin) additionalLinks.linkedin = validData.linkedin;
        if (validData.website) additionalLinks.website = validData.website;

        // 4. Insert
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
        if (error.code === "23505") {
            return { success: false, error: "Email or phone already registered" };
        }
        return { success: false, error: "Something went wrong. Please try again." };
    }
}
