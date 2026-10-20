import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { vendorQuotationsTable } from '@/lib/db/schema/vendor-quotation'
import { businessRequirementsTable } from '@/lib/db/schema/business-requirement'
import { getAuthenticatedVendor } from '@/actions/vendor-actions'
import { QuotationsView } from '@/components/manufacturer/quotations-view'
import { desc, eq } from 'drizzle-orm'

export const metadata: Metadata = {
    title: "Quotations — UNIFIÉE Vendor",
    description: "Review custom packaging RFQs and manage your formal commercial quotations.",
    robots: { index: false },
}

export default async function QuotationsPage() {
    const vendor = await getAuthenticatedVendor()

    if (!vendor) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground text-sm">Please sign in as a vendor to view quotations.</p>
            </div>
        )
    }

    const rows = await db
        .select({
            quote: vendorQuotationsTable,
            requirementTitle: businessRequirementsTable.title,
        })
        .from(vendorQuotationsTable)
        .leftJoin(
            businessRequirementsTable,
            eq(vendorQuotationsTable.requirementId, businessRequirementsTable.id)
        )
        .where(eq(vendorQuotationsTable.vendorId, vendor.manufacturerId))
        .orderBy(desc(vendorQuotationsTable.createdAt))

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6 text-foreground pb-12">
            <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Custom Quotations & RFQs
                    </h1>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Review customer quote requests and submit tailored pricing proposals.
                    </p>
                </div>
            </div>

            <QuotationsView initialQuotations={rows} />
        </div>
    )
}
