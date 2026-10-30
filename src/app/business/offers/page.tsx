import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema/business"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import DbOffersView from "@/components/business/db-offers-view"
import { getBusinessQuotesAction } from "@/actions/order-actions"

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

    return <DbOffersView quotes={result.data ?? []} businessId={profile?.id ?? ""} />
}
