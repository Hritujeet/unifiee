import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: "Orders — UNIFIÉE Business",
    description: "Track and manage your packaging orders on UNIFIÉE — view status, supplier details, and delivery information.",
    robots: { index: false },
}

const page = () => {
    return (
        <div>Orders</div>
    )
}

export default page