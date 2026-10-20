import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { offeringsTable } from '@/lib/db/schema/offering'
import { getAuthenticatedVendor } from '@/actions/vendor-actions'
import { OfferingsList } from '@/components/manufacturer/offerings-list'
import { ClipboardList } from 'lucide-react'
import { and, desc, eq, isNull } from 'drizzle-orm'

export const metadata: Metadata = {
    title: "My Offerings — UNIFIÉE Vendor",
    description: "View, edit, and manage all packaging offerings you have published on the UNIFIÉE marketplace.",
    robots: { index: false },
}

export default async function ViewOfferingsPage() {
    const vendor = await getAuthenticatedVendor()

    if (!vendor) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground text-sm">Please sign in as a vendor to manage your offerings.</p>
            </div>
        )
    }

    const rows = await db
        .select()
        .from(offeringsTable)
        .where(
            and(
                eq(offeringsTable.vendorId, vendor.manufacturerId),
                isNull(offeringsTable.deletedAt)
            )
        )
        .orderBy(desc(offeringsTable.createdAt))

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6 text-foreground pb-12">
            <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        My Packaging Offerings
                    </h1>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Manage your published listings, adjust pricing, and toggle active status.
                    </p>
                </div>
            </div>

            <OfferingsList initialOfferings={rows} />
        </div>
    )
}
