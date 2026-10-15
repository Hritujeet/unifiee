import type { Metadata } from "next"
import OffersView from "@/components/business/offers-view"

export const metadata: Metadata = {
    title: "Offers — UNIFIÉE Business",
    description: "Review and compare received vendor offers for your packaging requirements on UNIFIÉE.",
    robots: { index: false },
}

export default function BusinessOffersPage() {
    return <OffersView />
}

