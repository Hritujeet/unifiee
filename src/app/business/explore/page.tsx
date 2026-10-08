import type { Metadata } from "next"
import Link from "next/link"
import { desc } from "drizzle-orm"
import { ArrowRight, ArrowUpRight, Boxes, Factory, Mail, PackageSearch, Printer, Search } from "lucide-react"
import { PageHeading } from "@/components/designer/dashboard-components"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"
import { manufacturerTable } from "@/lib/db/schema/manufacturer"

export const metadata: Metadata = {
    title: "Explore Packaging Vendors — UNIFIÉE Business",
    description: "Discover packaging manufacturers and their production capabilities on UNIFIÉE.",
    robots: { index: false },
}

function labelize(value: string) {
    return value.split(/[-_]/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" ")
}

export default async function ExploreOffersPage() {
    const vendors = await db
        .select({
            id: manufacturerTable.id,
            name: manufacturerTable.companyName,
            contactName: manufacturerTable.fullName,
            email: manufacturerTable.email,
            categories: manufacturerTable.packagingCategories,
            capabilities: manufacturerTable.capabilities,
            address: manufacturerTable.manufacturerAddress,
        })
        .from(manufacturerTable)
        .orderBy(desc(manufacturerTable.createdAt))
        .limit(100)

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-7">
            <PageHeading
                eyebrow="Packaging marketplace"
                title="Find the right packaging partner."
                description="Explore manufacturers by the packaging categories and production capabilities they offer."
                action={
                    <Button asChild variant="outline">
                        <Link href="/business/designers">Looking for a designer? <ArrowRight className="size-4" /></Link>
                    </Button>
                }
            />

            <section className="rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-secondary/40 p-6 sm:p-8">
                <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="max-w-2xl">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><PackageSearch className="size-5" /></div>
                        <h2 className="mt-4 font-heading text-xl font-semibold">Packaging, sourced with confidence</h2>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Compare manufacturers by what they make and how they produce it. Contact a vendor directly to discuss quantities, customization, and pricing.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                        <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-2"><Boxes className="size-3.5 text-primary" /> Packaging categories</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-2"><Printer className="size-3.5 text-primary" /> Print capabilities</span>
                    </div>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h2 className="font-heading text-xl font-semibold">Registered manufacturers</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{vendors.length} {vendors.length === 1 ? "partner" : "partners"} in the network</p>
                    </div>
                    <Link href="/business/search" className="hidden items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:inline-flex">
                        Search marketplace <Search className="size-4" />
                    </Link>
                </div>

                {vendors.length ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {vendors.map((vendor) => {
                            const addressParts = vendor.address?.split(",").map((part) => part.trim()).filter(Boolean) ?? []
                            const city = addressParts.length > 1 ? addressParts[addressParts.length - 2] : addressParts[0]
                            return (
                                <article key={vendor.id} className="flex flex-col rounded-xl border bg-card p-5 text-card-foreground transition-shadow hover:shadow-md">
                                    <div className="flex items-start gap-3">
                                        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Factory className="size-5" /></span>
                                        <div className="min-w-0">
                                            <h3 className="truncate font-heading text-lg font-semibold">{vendor.name}</h3>
                                            <p className="mt-0.5 text-sm text-muted-foreground">{vendor.contactName}{city ? ` · ${city}` : ""}</p>
                                        </div>
                                    </div>
                                    <div className="mt-5">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Packaging categories</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {vendor.categories?.length ? vendor.categories.map((category) => (
                                                <span key={category} className="rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground">{labelize(category)}</span>
                                            )) : <span className="text-sm text-muted-foreground">Not specified</span>}
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Production capabilities</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {vendor.capabilities?.length ? vendor.capabilities.map((capability) => (
                                                <span key={capability} className="rounded-md border px-2.5 py-1.5 text-xs">{labelize(capability)}</span>
                                            )) : <span className="text-sm text-muted-foreground">Not specified</span>}
                                        </div>
                                    </div>
                                    <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4 mt-5">
                                        <span className="text-xs text-muted-foreground">Discuss custom requirements and pricing.</span>
                                        <Button asChild size="sm">
                                            <a href={`mailto:${vendor.email}?subject=${encodeURIComponent(`Packaging inquiry for ${vendor.name}`)}`}>
                                                Contact <Mail className="size-3.5" />
                                            </a>
                                        </Button>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 py-10 text-center">
                        <Factory className="size-8 text-muted-foreground" />
                        <h3 className="mt-3 font-heading text-lg font-semibold">Manufacturers are joining the network</h3>
                        <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">Registered packaging partners and their capabilities will appear here as they join UNIFIÉE.</p>
                    </div>
                )}
            </section>

            <section className="flex flex-col justify-between gap-4 rounded-xl border bg-muted/40 p-5 sm:flex-row sm:items-center">
                <div>
                    <h2 className="font-heading font-semibold">Need a packaging design first?</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Find a designer for concepts, labels, brand identity, and print-ready artwork.</p>
                </div>
                <Button asChild variant="outline">
                    <Link href="/business/designers">Browse design services <ArrowUpRight className="size-4" /></Link>
                </Button>
            </section>
        </div>
    )
}
