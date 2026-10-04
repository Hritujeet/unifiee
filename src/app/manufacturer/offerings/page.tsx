import type { Metadata } from 'next'
import { OfferingsList } from '@/components/manufacturer/offerings-list'

export const metadata: Metadata = {
    title: "My Offerings — UNIFIÉE Vendor",
    description: "View, edit, and manage all offerings you have published on the UNIFIÉE vendor platform.",
    robots: { index: false },
}

export default function ViewOfferingsPage() {
    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <OfferingsList />
        </div>
    )
}
