import type { Metadata } from "next"
import { PageHeading } from "@/components/designer/dashboard-components"
import { DesignerMarketplace } from "@/components/business/designer-marketplace"
import { getDesignerListings } from "@/lib/business/marketplace"

export const metadata: Metadata = {
    title: "Saved Services — UNIFIÉE Business",
    description: "Review the designer services you have saved on UNIFIÉE.",
    robots: { index: false },
}

export default async function BusinessFavoritesPage() {
    const listings = await getDesignerListings()

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-7">
            <PageHeading
                eyebrow="Your shortlist"
                title="Saved design services."
                description="Keep your favorite designers and services together while you compare options. Saved services are stored in this browser."
            />
            <DesignerMarketplace listings={listings} favoritesOnly />
        </div>
    )
}
