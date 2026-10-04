import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
    title: "Dashboard — UNIFIÉE Business",
    description: "Manage your packaging procurement on UNIFIÉE — track orders and manage your F&B brand profile.",
    robots: { index: false },
}

const page = () => {
    return (
        <div>Business Dashboard</div>
    )
}

export default page