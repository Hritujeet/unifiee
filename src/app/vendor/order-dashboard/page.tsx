import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: "Orders — UNIFIÉE Vendor",
    description: "View and manage all your assigned packaging orders as a vendor on UNIFIÉE.",
    robots: { index: false },
}

const page = () => {
    return (
        <div>
            Order Dashboard
        </div>
    )
}

export default page