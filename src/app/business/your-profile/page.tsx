import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: "Your Profile — UNIFIÉE Business",
    description: "View and manage your F&B business profile, brand details, and account settings on UNIFIÉE.",
    robots: { index: false },
}

const page = () => {
    return (
        <div>Your profile</div>
    )
}

export default page