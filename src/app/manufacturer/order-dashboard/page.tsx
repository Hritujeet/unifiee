import type { Metadata } from 'next'
import { getAuthenticatedVendor, getVendorOrdersWithItems } from '@/actions/vendor-actions'
import { OrderManagementView } from '@/components/manufacturer/order-management-view'

export const metadata: Metadata = {
    title: "Customer Orders — UNIFIÉE Vendor",
    description: "Review and fulfill customer requests corresponding to your packaging offerings.",
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

    const rows = await getVendorOrdersWithItems(vendor.manufacturerId)

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