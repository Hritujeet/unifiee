"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { manufacturerTable } from "@/lib/db/schema/manufacturer";
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer";
import { business } from "@/lib/db/schema/business";
import { eq } from "drizzle-orm";

export type UserRole = "manufacturer" | "designer" | "business" | "none";

export async function getUserRole(): Promise<UserRole> {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return "none";

        const userId = session.user.id;

        const [manufacturerRow, designerRow, businessRow] = await Promise.all([
            db
                .select({ id: manufacturerTable.id })
                .from(manufacturerTable)
                .where(eq(manufacturerTable.userId, userId))
                .limit(1),
            db
                .select({ id: packagingDesignerTable.id })
                .from(packagingDesignerTable)
                .where(eq(packagingDesignerTable.userId, userId))
                .limit(1),
            db
                .select({ id: business.id })
                .from(business)
                .where(eq(business.userId, userId))
                .limit(1),
        ]);

        if (manufacturerRow.length > 0) return "manufacturer";
        if (designerRow.length > 0) return "designer";
        if (businessRow.length > 0) return "business";
        return "none";
    } catch (error) {
        console.error("getUserRole error:", error);
        return "none";
    }
}
