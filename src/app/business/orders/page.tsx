import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ClipboardList, PackageSearch } from "lucide-react"
import { PageHeading } from "@/components/designer/dashboard-components"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
    title: "Orders — UNIFIÉE Business",
    description: "Track packaging orders and supplier updates on UNIFIÉE.",
    robots: { index: false },
}

export default function BusinessOrdersPage() {
    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-7">
            <PageHeading
                eyebrow="Procurement"
                title="Your orders."
                description="Keep track of packaging orders and supplier updates in one place."
            />
            <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-12 text-center">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><ClipboardList className="size-6" /></span>
                <h2 className="mt-4 font-heading text-lg font-semibold">Order tracking is coming soon</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Vendor checkout and in-platform order tracking are not available yet. For now, explore registered manufacturers and contact them directly to discuss your packaging requirements.
                </p>
                <Button asChild className="mt-5">
                    <Link href="/business/explore">Explore packaging vendors <PackageSearch className="size-4" /><ArrowRight className="size-4" /></Link>
                </Button>
            </div>
        </div>
    )
}
