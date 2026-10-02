"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { manufacturerTable } from "@/lib/db/schema/manufacturer";
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer";
import { business } from "@/lib/db/schema/business";
import { manufacturerOnboardingSchema } from "@/lib/zod-schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function registerManufacturerAction(data: z.infer<typeof manufacturerOnboardingSchema>) {
    try {
        // 1. Require authenticated session
        const reqHeaders = await headers();
        const session = await auth.api.getSession({ headers: reqHeaders });
        if (!session?.user) {
            return { success: false, error: "You must be signed in to register as a manufacturer" };
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
        const parsed = manufacturerOnboardingSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: "Invalid form data" };
        }

        const validData = parsed.data;

        // 4. Insert
        await db.insert(manufacturerTable).values({
            id: crypto.randomUUID(),
            userId,
            name: validData.fullname.split(" ")[0] || validData.fullname,
            fullName: validData.fullname,
            companyName: validData.companyFirmName,
            email: validData.email.toLowerCase(),
            phone: validData.mobile,
            services: validData.services?.map((s) => s.value).filter(Boolean) || [],
            manufacturerAddress: validData.address,
            gstin: validData.gstin || null,
            socials: validData.socials
                ?.filter((s) => s.platform && s.url)
                .map((s) => `${s.platform}:${s.url}`) || [],
        });

        return { success: true };
    } catch (error: any) {
        console.error("Manufacturer registration error:", error);
        if (error.code === "23505") {
            return { success: false, error: "Email or phone already registered" };
        }
        return { success: false, error: "Something went wrong. Please try again." };
    }
}
