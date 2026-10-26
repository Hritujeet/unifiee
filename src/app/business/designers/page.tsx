import type { Metadata } from "next"
import Link from "next/link"
import { Briefcase, FileCheck, Layers, Palette, ShieldCheck, Zap } from "lucide-react"
import { DesignerMarketplace } from "@/components/business/designer-marketplace"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getTrackedDesignerServiceIds, getDesignerListings } from "@/lib/business/marketplace"

export const metadata: Metadata = {
    title: "Explore Packaging Designers — UNIFIÉE Business",
    description: "Browse vetted packaging designers, compare structural dielines, bottle labels, and 3D mockups.",
    robots: { index: false },
}

export default async function BusinessDesignersPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    const [listings, trackedServiceIds] = await Promise.all([
        getDesignerListings(),
        session?.user ? getTrackedDesignerServiceIds(session.user.id) : Promise.resolve([]),
    ])

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-8">
            {/* 1. Header with Breadcrumb & Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20 mb-2">
                        <Palette className="size-3" />
                        <span>Creative Marketplace</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
                        Explore Packaging Designers
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl">
                        Partner with specialized packaging artists for box dielines, bottle labels, flexible pouches, and print-ready production files.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <Button asChild variant="outline" size="sm" className="text-xs h-9">
                        <Link href="/business/hired-services" className="flex items-center gap-1.5">
                            <Briefcase className="size-3.5 text-blue-500" />
                            <span>Your Hired Services</span>
                            {trackedServiceIds.length > 0 && (
                                <span className="ml-1 rounded-full bg-blue-600 px-1.5 py-0.2 text-[10px] font-bold text-white">
                                    {trackedServiceIds.length}
                                </span>
                            )}
                        </Link>
                    </Button>
                </div>
            </div>

            {/* 2. Hero Banner: Packaging Design Standards */}
            <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-7">
                <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center relative z-10">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 uppercase tracking-wider">
                            <Zap className="size-3.5" />
                            Production-First Creative Standards
                        </div>
                        <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                            Print-ready artwork, direct designer collaboration
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                            Every designer service on UNIFIÉE includes verifiable turnaround times, vector dielines (PDF/AI), bleed margins, and spot finish callouts. Track hired projects in your dashboard and seamlessly link final artwork to manufacturer RFQs.
                        </p>
                    </div>

                    {/* Feature Badges */}
                    <div className="flex flex-wrap md:flex-col gap-2.5 text-xs">
                        <div className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3.5 py-2 backdrop-blur-sm shadow-xs">
                            <FileCheck className="size-4 text-blue-500" />
                            <span className="font-medium text-foreground">Print-Ready Dielines</span>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3.5 py-2 backdrop-blur-sm shadow-xs">
                            <ShieldCheck className="size-4 text-emerald-500" />
                            <span className="font-medium text-foreground">100% Commercial Rights</span>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3.5 py-2 backdrop-blur-sm shadow-xs">
                            <Layers className="size-4 text-primary" />
                            <span className="font-medium text-foreground">Direct RFQ Integration</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. AI Smart Match */}

            {/* 4. The Marketplace Directory */}
            <DesignerMarketplace listings={listings} trackedServiceIds={trackedServiceIds} />
        </div>
    )
}
