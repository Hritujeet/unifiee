import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: "Submit Quotation — UNIFIÉE Vendor",
    description: "Submit a pricing quotation for an open packaging order on the UNIFIÉE vendor platform.",
    robots: { index: false },
}

const page = () => {
    return (
        <div>
            Submit Quotations
        </div>
    )
}

export default page