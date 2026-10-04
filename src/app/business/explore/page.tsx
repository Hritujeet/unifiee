import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Explore Offers — UNIFIÉE Business",
    description: "Explore packaging offers from vendors on UNIFIÉE.",
    robots: { index: false },
}

export default function ExploreOffersPage() {
    return (
        <section className="space-y-2">
            <h1 className="text-2xl font-semibold">Explore Offers</h1>
            <p className="text-muted-foreground">
                Vendor offers will appear here once vendors start publishing them.
            </p>
        </section>
    )
}
