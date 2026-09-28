"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { vendorTable } from "@/lib/db/schema/vendor";
import { business } from "@/lib/db/schema/business";
import { vendorOnboardingSchema } from "@/lib/zod-schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export async function registerVendorAction(data: z.infer<typeof vendorOnboardingSchema>) {
    try {
        // 1. Require authenticated session
        const reqHeaders = await headers();
        const session = await auth.api.getSession({ headers: reqHeaders });
        if (!session?.user) {
            return { success: false, error: "You must be signed in to register as a vendor" };
        }

        const userId = session.user.id;

        // 2. Prevent double-registration — check if already a vendor OR business
        const [existingVendor, existingBusiness] = await Promise.all([
            db.select({ id: vendorTable.id }).from(vendorTable).where(eq(vendorTable.userId, userId)).limit(1),
            db.select({ id: business.id }).from(business).where(eq(business.userId, userId)).limit(1),
        ]);

        if (existingVendor.length > 0) {
            return { success: false, error: "You are already registered as a vendor" };
        }
        if (existingBusiness.length > 0) {
            return { success: false, error: "You are already registered as a business and cannot register as a vendor" };
        }

        // 3. Validate form data
        const parsed = vendorOnboardingSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: "Invalid form data" };
        }

        const validData = parsed.data;

        // 4. Insert
        await db.insert(vendorTable).values({
            id: crypto.randomUUID(),
            userId,
            name: validData.fullname.split(" ")[0] || validData.fullname,
            fullName: validData.fullname,
            companyName: validData.companyFirmName,
            type: validData.vendorType,
            email: validData.email.toLowerCase(),
            phone: validData.mobile,
            services: validData.services?.map((s) => s.value).filter(Boolean) || [],
            vendorAddress: validData.address,
            gstin: validData.gstin || null,
            socials: validData.socials
                ?.filter((s) => s.platform && s.url)
                .map((s) => `${s.platform}:${s.url}`) || [],
        });

        return { success: true };
    } catch (error: any) {
        console.error("Vendor registration error:", error);
        if (error.code === "23505") {
            return { success: false, error: "Email or phone already registered" };
        }
        return { success: false, error: "Something went wrong. Please try again." };
    }
}
