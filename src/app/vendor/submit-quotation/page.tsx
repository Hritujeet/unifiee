import type { Metadata } from 'next'
import { SubmitQuotationForm } from '@/components/vendors/submit-quotation-form'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
    title: "Submit Quotation — UNIFIÉE Vendor",
    description: "Submit a pricing quotation for an open packaging order on the UNIFIÉE vendor platform.",
    robots: { index: false },
}

export default function SubmitQuotationPage() {
    return (
        <div className="mx-auto max-w-2xl">
            {/* Page header */}
            <div className="mb-8 flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-5" />
                </div>
                <div>
                    <h1 className="font-heading text-xl font-semibold text-foreground">Submit a Quotation</h1>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Fill in the details below to send a competitive quote to the business.
                    </p>
                </div>
            </div>

            <SubmitQuotationForm />
        </div>
    )
}