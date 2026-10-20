import type { Metadata } from 'next'
import { PublishOfferingForm } from '@/components/manufacturer/publish-offering-form'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
    title: "Publish Offering — UNIFIÉE Vendor",
    description: "Publish a packaging offering on the UNIFIÉE vendor platform with commercial price tiers and technical specifications.",
    robots: { index: false },
}

export default function PublishOfferingPage() {
    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 text-foreground pb-12">
            {/* Page header */}
            <div className="flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                        <FileText className="size-4" />
                        <span>Packaging Publishing Studio</span>
                    </div>
                    <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Publish a Packaging Offering
                    </h1>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Configure volume pricing slabs, production lead times, substrate specifications, and eco-certifications for F&B buyers.
                    </p>
                </div>
            </div>

            <PublishOfferingForm />
        </div>
    )
}