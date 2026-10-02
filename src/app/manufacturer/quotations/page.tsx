import type { Metadata } from 'next'
import { QuotationsList } from '@/components/vendors/quotations-list'

export const metadata: Metadata = {
    title: "My Quotations — UNIFIÉE Vendor",
    description: "View, edit, and manage all quotations you have submitted on the UNIFIÉE vendor platform.",
    robots: { index: false },
}

export default function ViewQuotationsPage() {
    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <QuotationsList />
        </div>
    )
}
