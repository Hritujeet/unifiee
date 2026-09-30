import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: "Quotations — UNIFIÉE Business",
    description: "Create packaging requirements and review vendor quotations on UNIFIÉE for your F&B business.",
    robots: { index: false },
}

const page = () => {
    return (
        <div>
            Search for quotations (Create a requirement and search for quotations based on it)
        </div>
    )
}

export default page