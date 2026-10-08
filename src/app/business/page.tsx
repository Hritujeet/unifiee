import type { Metadata } from "next"
import Link from "next/link"
import { and, count, eq } from "drizzle-orm"
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Building2, Heart, PackageSearch, Palette, ShoppingBag, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DesignerMarketplace } from "@/components/business/designer-marketplace"
import { PageHeading, SectionHeading, StatCard } from "@/components/designer/dashboard-components"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema/business"
import { designerServiceTable } from "@/lib/db/schema/designer-service"
import { manufacturerTable } from "@/lib/db/schema/manufacturer"
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer"
import { getDesignerListings } from "@/lib/business/marketplace"
import { headers } from "next/headers"

export const metadata: Metadata = {
    title: "Business Dashboard — UNIFIÉE",
    description: "Discover packaging vendors, compare designer services, and manage your sourcing on UNIFIÉE.",
    robots: { index: false },
}

export default async function BusinessDashboardPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    const userId = session?.user.id
    const [businessProfile, vendorCount, designerCount, serviceCount, listings] = await Promise.all([
        userId
            ? db.select({ businessName: business.businessName, fullName: business.fullName })
                .from(business)
                .where(eq(business.userId, userId))
                .limit(1)
            : Promise.resolve([]),
        db.select({ count: count() }).from(manufacturerTable),
        db.select({ count: count() }).from(packagingDesignerTable).where(eq(packagingDesignerTable.isActive, true)),
        db.select({ count: count() })
            .from(designerServiceTable)
            .innerJoin(packagingDesignerTable, eq(designerServiceTable.designerId, packagingDesignerTable.id))
            .where(and(
                eq(designerServiceTable.status, "active"),
                eq(packagingDesignerTable.isActive, true),
            )),
        getDesignerListings(),
    ])

    const profile = businessProfile[0]
    const displayName = profile?.businessName || profile?.fullName || session?.user.name || "your business"
    const vendorTotal = vendorCount[0]?.count ?? 0
    const designerTotal = designerCount[0]?.count ?? 0
    const serviceTotal = serviceCount[0]?.count ?? 0
    const recentServices = listings.slice(0, 3)

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-8">
            <PageHeading
                eyebrow="Your sourcing workspace"
                title={`Welcome, ${displayName}.`}
                description="Find packaging partners and creative talent for your next launch."
                action={
                    <Button asChild>
                        <Link href="/business/explore">Explore marketplace <ArrowRight className="size-4" /></Link>
                    </Button>
                }
            />

            <section className="relative overflow-hidden rounded-2xl bg-primary px-6 py-8 text-primary-foreground sm:px-9 sm:py-10">
                <div className="pointer-events-none absolute -right-16 -top-32 size-96 rounded-full border border-primary-foreground/10" />
                <div className="pointer-events-none absolute -right-2 -top-20 size-64 rounded-full border border-primary-foreground/10" />
                <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide">
                            <Sparkles className="size-3.5" /> Your next great package starts here
                        </span>
                        <h2 className="mt-4 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Everything your brand needs to move forward.</h2>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/75">
                            Source packaging from manufacturers or hire a designer to bring your brand to life — all from one workspace.
                        </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Link href="/business/explore" className="group rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 transition-colors hover:bg-primary-foreground/15">
                            <span className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/15"><PackageSearch className="size-5" /></span>
                            <span className="mt-4 block font-semibold">Source packaging</span>
                            <span className="mt-1 block text-xs leading-5 text-primary-foreground/70">Explore manufacturers and packaging categories.</span>
                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">Browse vendors <ArrowUpRight className="size-3.5" /></span>
                        </Link>
                        <Link href="/business/designers" className="group rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 transition-colors hover:bg-primary-foreground/15">
                            <span className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/15"><Palette className="size-5" /></span>
                            <span className="mt-4 block font-semibold">Hire a designer</span>
                            <span className="mt-1 block text-xs leading-5 text-primary-foreground/70">Compare creative services, pricing, and samples.</span>
                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">Find designers <ArrowUpRight className="size-3.5" /></span>
                        </Link>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Manufacturers" value={String(vendorTotal)} detail="Registered packaging partners" icon={Building2} />
                <StatCard label="Designers" value={String(designerTotal)} detail="Active creative profiles" icon={BriefcaseBusiness} tone="secondary" />
                <StatCard label="Design services" value={String(serviceTotal)} detail="Available services to explore" icon={ShoppingBag} tone="accent" />
                <Link href="/business/favorites" className="group rounded-xl border bg-card p-5 text-card-foreground transition-colors hover:bg-accent/50">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Saved services</p>
                            <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">Favorites</p>
                        </div>
                        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Heart className="size-5" /></span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Keep your shortlisted designers close.</p>
                </Link>
            </section>

            <section className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.7fr)]">
                <div className="space-y-5">
                    <SectionHeading
                        title="Designer services to explore"
                        detail="Browse real, active services published by packaging designers."
                        href="/business/designers"
                        linkText="Browse all"
                    />
                    <DesignerMarketplace listings={recentServices} limit={3} />
                </div>
                <aside className="space-y-4">
                    <div className="rounded-xl border bg-card p-5">
                        <div className="flex items-center gap-2">
                            <PackageSearch className="size-4 text-primary" />
                            <h2 className="font-heading font-semibold">Packaging marketplace</h2>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Browse registered manufacturers by the packaging categories and production capabilities they support.
                        </p>
                        <Button asChild variant="outline" className="mt-4 w-full">
                            <Link href="/business/explore">Explore manufacturers <ArrowRight className="size-4" /></Link>
                        </Button>
                    </div>
                    <div className="rounded-xl border bg-muted/40 p-5">
                        <div className="flex items-center gap-2">
                            <Heart className="size-4 text-primary" />
                            <h2 className="font-heading font-semibold">Shortlist your favorites</h2>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Save design services while comparing prices, turnaround times, and deliverables.
                        </p>
                        <Link href="/business/favorites" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                            View favorites <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </aside>
            </section>
        </div>
    )
}
