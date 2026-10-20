import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { businessOrdersTable } from '@/lib/db/schema/business-order'
import { business } from '@/lib/db/schema/business'
import { getAuthenticatedVendor } from '@/actions/vendor-actions'
import { OrderManagementView } from '@/components/manufacturer/order-management-view'
import { desc, eq } from 'drizzle-orm'

export const metadata: Metadata = {
    title: "Orders — UNIFIÉE Vendor",
    description: "Manage accepted packaging orders and update delivery status.",
    robots: { index: false },
}

export default async function OrderDashboardPage() {
    const vendor = await getAuthenticatedVendor()

    if (!vendor) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground text-sm">Please sign in as a vendor to manage your orders.</p>
            </div>
        )
    }

    const rows = await db
        .select({
            order: businessOrdersTable,
            buyerName: business.businessName,
            buyerEmail: business.email,
            buyerPhone: business.phone,
        })
        .from(businessOrdersTable)
        .leftJoin(business, eq(businessOrdersTable.businessId, business.id))
        .where(eq(businessOrdersTable.vendorId, vendor.manufacturerId))
        .orderBy(desc(businessOrdersTable.createdAt))

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6 text-foreground pb-12">
            <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Manage Orders
                    </h1>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Accept buyer orders, track production, and mark shipments dispatched.
                    </p>
                </div>
            </div>

            <OrderManagementView initialOrders={rows} />
        </div>
    )
}