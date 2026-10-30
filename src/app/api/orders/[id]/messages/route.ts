import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { businessHiredServiceTable, hiredServiceMessagesTable } from "@/lib/db/schema/business-hired-service"
import { business } from "@/lib/db/schema/business"
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer"
import { and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: orderId } = await params
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [order] = await db
        .select({
            id: businessHiredServiceTable.id,
            businessUserId: business.userId,
            designerUserId: packagingDesignerTable.userId,
        })
        .from(businessHiredServiceTable)
        .leftJoin(business, eq(businessHiredServiceTable.businessId, business.id))
        .leftJoin(packagingDesignerTable, eq(businessHiredServiceTable.designerId, packagingDesignerTable.id))
        .where(eq(businessHiredServiceTable.id, orderId))
        .limit(1)

    if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const isParticipant =
        order.businessUserId === session.user.id || order.designerUserId === session.user.id
    if (!isParticipant) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const messages = await db
        .select()
        .from(hiredServiceMessagesTable)
        .where(eq(hiredServiceMessagesTable.orderId, orderId))
        .orderBy(hiredServiceMessagesTable.createdAt)

    return NextResponse.json({ messages })
}

