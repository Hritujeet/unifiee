import type { Metadata } from "next"
import Link from "next/link"
import { and, asc, eq, isNull } from "drizzle-orm"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { offeringsTable, offeringTypesTable } from "@/lib/db/schema/offering"
import { constructMetadata } from "@/lib/seo/metadata"
import { JsonLd, breadcrumbSchema } from "@/components/seo/json-ld"
import { siteUrl } from "@/lib/seo/site-config"

type Props = { params: Promise<{ slug: string }> }

async function getCategory(slug: string) {
    const [category] = await db.select({
        key: offeringTypesTable.key,
        name: offeringTypesTable.displayName,
    }).from(offeringTypesTable).where(and(
        eq(offeringTypesTable.key, slug),
        eq(offeringTypesTable.vendorType, "manufacturer"),
    )).limit(1)
    return category
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const category = await getCategory(slug)
    if (!category) return constructMetadata({ title: "Packaging category", description: "Explore F&B packaging categories.", noIndex: true })
    return constructMetadata({
        title: `${category.name} Packaging`,
        description: `Compare ${category.name.toLowerCase()} packaging offerings from manufacturers serving F&B businesses.`,
        canonicalUrl: `/packaging/${category.key}`,
    })
}

export default async function PackagingCategoryPage({ params }: Props) {
    const { slug } = await params
    const category = await getCategory(slug)
    if (!category) notFound()

    const offerings = await db.select({
        id: offeringsTable.id,
        title: offeringsTable.title,
        description: offeringsTable.description,
        unitPrice: offeringsTable.unitPrice,
        currency: offeringsTable.currency,
        unitOfMeasure: offeringsTable.unitOfMeasure,
        updatedAt: offeringsTable.updatedAt,
    }).from(offeringsTable).where(and(
        eq(offeringsTable.offeringType, category.key),
        eq(offeringsTable.status, "active"),
        isNull(offeringsTable.deletedAt),
    )).orderBy(asc(offeringsTable.title))

    const categoryUrl = `${siteUrl}/packaging/${category.key}`
    return (
        <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
            <JsonLd schema={breadcrumbSchema([
                { name: "Home", url: "/" },
                { name: "Packaging", url: "/packaging" },
                { name: category.name, url: categoryUrl },
            ])} />
            <div>
                <h1 className="font-heading text-4xl font-semibold tracking-tight">{category.name} packaging</h1>
                <p className="mt-3 max-w-2xl text-muted-foreground">
                    Packaging options from active manufacturers on the UNIFIÉE marketplace.
                </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {offerings.map((offering) => (
                    <Link key={offering.id} href={`/packaging/${category.key}/${offering.id}`} className="rounded-xl border bg-card p-5 transition-colors hover:bg-accent">
                        <h2 className="font-heading text-lg font-semibold">{offering.title}</h2>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{offering.description}</p>
                        <p className="mt-4 text-sm font-semibold">₹{Number(offering.unitPrice).toLocaleString("en-IN")} / {offering.unitOfMeasure}</p>
                    </Link>
                ))}
            </div>
            {!offerings.length && <p className="text-sm text-muted-foreground">No active offerings are available in this category yet.</p>}
        </div>
    )
}
