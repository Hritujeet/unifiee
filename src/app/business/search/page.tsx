import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import { PageHeading } from "@/components/designer/dashboard-components"
import { DesignerMarketplace } from "@/components/business/designer-marketplace"
import { Button } from "@/components/ui/button"
import { getDesignerListings } from "@/lib/business/marketplace"
import { getTrackedDesignerServiceIds } from "@/lib/business/marketplace"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const metadata: Metadata = {
    title: "Search UNIFIÉE — Business",
    description: "Search designer services and explore packaging vendors on UNIFIÉE.",
    robots: { index: false },
}

export default async function SearchMarketplacePage() {
    const session = await auth.api.getSession({ headers: await headers() })
    const [listings, trackedServiceIds] = await Promise.all([
        getDesignerListings(),
        session?.user ? getTrackedDesignerServiceIds(session.user.id) : Promise.resolve([]),
    ])

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-7">
            <PageHeading
                eyebrow="Marketplace search"
                title="Search design services."
                description="Search by service, designer, packaging specialty, or deliverable."
                action={
                    <Button asChild variant="outline">
                        <Link href="/business/explore">Browse packaging vendors <ArrowRight className="size-4" /></Link>
                    </Button>
                }
            />
            <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Search className="size-4 text-primary" />
                    Search results update as you type. Use a specialty filter to narrow the list.
                </div>
            </div>
            <DesignerMarketplace listings={listings} trackedServiceIds={trackedServiceIds} />
        </div>
    )
}
