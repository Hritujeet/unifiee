import type { Metadata } from "next"
import { PageHeading } from "@/components/designer/dashboard-components"
import { DesignerMarketplace } from "@/components/business/designer-marketplace"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getTrackedDesignerServiceIds } from "@/lib/business/marketplace"
import { getDesignerListings } from "@/lib/business/marketplace"

export const metadata: Metadata = {
    title: "Hire Packaging Designers — UNIFIÉE Business",
    description: "Browse packaging design services, compare portfolios and pricing, and contact designers.",
    robots: { index: false },
}

export default async function BusinessDesignersPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    const [listings, trackedServiceIds] = await Promise.all([
        getDesignerListings(),
        session?.user ? getTrackedDesignerServiceIds(session.user.id) : Promise.resolve([]),
    ])

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-7">
            <PageHeading
                eyebrow="Creative talent"
                title="Find your next design partner."
                description="Compare real packaging design services, see what is included, and contact the designer whose work fits your brand."
            />
            <section className="rounded-xl border bg-muted/40 p-4 sm:p-5">
                <p className="text-sm leading-6 text-muted-foreground">
                    Every service includes clear pricing, delivery time, revisions, and deliverables. Open a designer profile to review their portfolio and experience before reaching out.
                </p>
            </section>
            <DesignerMarketplace listings={listings} trackedServiceIds={trackedServiceIds} />
        </div>
    )
}
