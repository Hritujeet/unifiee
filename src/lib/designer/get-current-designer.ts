import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

export async function getCurrentDesigner() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return null

    const [designer] = await db
        .select()
        .from(packagingDesignerTable)
        .where(eq(packagingDesignerTable.userId, session.user.id))
        .limit(1)

    return designer ?? null
}
