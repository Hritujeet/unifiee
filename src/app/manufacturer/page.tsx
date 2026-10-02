import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: "Dashboard — UNIFIÉE Vendor",
    description: "Manage your vendor operations on UNIFIÉE — view orders, submit quotations, and update your supplier profile.",
    robots: { index: false },
}

const page = () => {
    return (
        <div>Vendor Dashboard</div>
    )
}

export default page