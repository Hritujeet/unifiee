"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { vendorTable } from "@/lib/db/schema/vendor";
import { business } from "@/lib/db/schema/business";
import { eq } from "drizzle-orm";

export type UserRole = "vendor" | "business" | "none";

export async function getUserRole(): Promise<UserRole> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return "none";

        const userId = session.user.id;

        const [vendorRow, businessRow] = await Promise.all([
            db
                .select({ id: vendorTable.id })
                .from(vendorTable)
                .where(eq(vendorTable.userId, userId))
                .limit(1),
            db
                .select({ id: business.id })
                .from(business)
                .where(eq(business.userId, userId))
                .limit(1),
        ]);

        if (vendorRow.length > 0) return "vendor";
        if (businessRow.length > 0) return "business";
        return "none";
    } catch (error) {
        console.error("getUserRole error:", error);
        return "none";
    }
}
