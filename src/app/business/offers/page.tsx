import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema/business"
import { headers } from "next/headers"
import DbOffersView from "@/components/business/db-offers-view"
import { getBusinessQuotesAction } from "@/actions/order-actions"
import { offeringsTable } from "@/lib/db/schema/offering"
import { manufacturerTable } from "@/lib/db/schema/manufacturer"
import { and, desc, eq, gt, isNull } from "drizzle-orm"

export const metadata: Metadata = {
    title: "Offers — UNIFIÉE Business",
    description: "Review and compare received vendor offers for your packaging requirements on UNIFIÉE.",
    robots: { index: false },
}

export const dynamic = "force-dynamic"

export default async function BusinessOffersPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    const [profile] = session?.user
        ? await db.select({ id: business.id }).from(business).where(eq(business.userId, session.user.id)).limit(1)
        : []
    const result = await getBusinessQuotesAction()
    const offerings = await db
        .select({
            id: offeringsTable.id,
            title: offeringsTable.title,
            description: offeringsTable.description,
            offeringType: offeringsTable.offeringType,
            unitPrice: offeringsTable.unitPrice,
            unitOfMeasure: offeringsTable.unitOfMeasure,
            minOrderQuantity: offeringsTable.minOrderQuantity,
            quantityStep: offeringsTable.quantityStep,
            leadTimeDaysMin: offeringsTable.leadTimeDaysMin,
            leadTimeDaysMax: offeringsTable.leadTimeDaysMax,
            city: offeringsTable.city,
            state: offeringsTable.state,
            vendorName: manufacturerTable.companyName,
        })
        .from(offeringsTable)
        .innerJoin(manufacturerTable, eq(offeringsTable.vendorId, manufacturerTable.id))
        .where(and(
            eq(offeringsTable.status, "active"),
            isNull(offeringsTable.deletedAt),
            gt(offeringsTable.validUntil, new Date()),
        ))
        .orderBy(desc(offeringsTable.createdAt))

    return (
        <DbOffersView
            quotes={result.data ?? []}
            offerings={offerings}
            businessId={profile?.id ?? ""}
        />
    )
}
