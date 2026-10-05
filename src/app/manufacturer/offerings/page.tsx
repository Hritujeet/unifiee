import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: "My Offerings — UNIFIÉE Vendor",
    description: "View, edit, and manage all offerings you have published on the UNIFIÉE vendor platform.",
    robots: { index: false },
}

export default function ViewOfferingsPage() {
    return (
        <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight">My Offerings</h1>
            <p className="text-muted-foreground">
                View, edit, and manage all offerings you have published on the UNIFIÉE vendor platform.
            </p>
        </div>
    )
}   
