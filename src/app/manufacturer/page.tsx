import type { Metadata } from 'next'
import React from 'react'
import { getVendorDashboardData } from '@/actions/vendor-actions'
import VendorDashboardView from '@/components/manufacturer/vendor-dashboard-view'

export const metadata: Metadata = {
    title: "Dashboard — UNIFIÉE Vendor",
    description: "Track earnings, manage orders, and monitor your published packaging catalog on UNIFIÉE.",
    robots: { index: false },
}

export default async function ManufacturerDashboardPage() {
    const data = await getVendorDashboardData()

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground text-sm">Please sign in as a registered vendor to access the dashboard.</p>
            </div>
        )
    }

    return (
        <div className="w-full">
            <VendorDashboardView
                vendorName={data.vendor.vendorName}
                companyName={data.vendor.companyName}
                metrics={data.metrics}
                recentOrders={data.orders.slice(0, 5)}
                recentOfferings={data.offerings.slice(0, 5)}
            />
        </div>
    )
}