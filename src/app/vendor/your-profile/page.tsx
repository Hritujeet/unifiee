import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: "Your Profile — UNIFIÉE Vendor",
    description: "View and manage your vendor profile, contact information, and service details on UNIFIÉE.",
    robots: { index: false },
}

const page = () => {
    return (
        <div>
            Your Profile
        </div>
    )
}

export default page