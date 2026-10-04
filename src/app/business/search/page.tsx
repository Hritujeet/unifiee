import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Search Offers — UNIFIÉE Business",
    description: "Search packaging offers based on your business requirements.",
    robots: { index: false },
}

export default function SearchOffersPage() {
    return (
        <section className="space-y-2">
            <h1 className="text-2xl font-semibold">Search Offers</h1>
            <p className="text-muted-foreground">
                Search for offers based on your packaging requirements once vendors start publishing them.
            </p>
        </section>
    )
}
