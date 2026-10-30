import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema/business"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

export async function getCurrentBusiness() {
    const reqHeaders = await headers()
    const session = await auth.api.getSession({ headers: reqHeaders })
    if (!session?.user) return null

    const [businessProfile] = await db
        .select()
        .from(business)
        .where(eq(business.userId, session.user.id))
        .limit(1)

    return businessProfile ?? null
}

