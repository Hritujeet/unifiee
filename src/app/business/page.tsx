import type { Metadata } from "next"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema/business"
import { headers } from "next/headers"
import BusinessDashboardView from "@/components/business/dashboard-view"

export const metadata: Metadata = {
    title: "Dashboard — UNIFIÉE Business",
    description: "Manage packaging requirements, review vendor offers, and track orders in progress on UNIFIÉE.",
    robots: { index: false },
}

export default async function BusinessDashboardPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    const userId = session?.user.id

    const businessProfile = userId
        ? await db
              .select({ businessName: business.businessName, fullName: business.fullName })
              .from(business)
              .where(eq(business.userId, userId))
              .limit(1)
        : []

    const profile = businessProfile[0]
    const displayName = profile?.businessName || profile?.fullName || "Unifiée"

    return (
        <div className="w-full">
            <BusinessDashboardView
                businessName={displayName}
                initialCounts={{
                    openRequirements: 2,
                    offersToReview: 3,
                    ordersInProgress: 1,
                    spendThisMonth: "₹0",
                }}
            />
        </div>
    )
}
