import type { Metadata } from "next"
import Link from "next/link"
import { and, eq, isNull } from "drizzle-orm"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { offeringsTable, offeringTypesTable } from "@/lib/db/schema/offering"
import { constructMetadata } from "@/lib/seo/metadata"
import { JsonLd, breadcrumbSchema, productSchema } from "@/components/seo/json-ld"
import { siteUrl } from "@/lib/seo/site-config"

type Props = { params: Promise<{ slug: string; id: string }> }

async function getOffering(slug: string, id: string) {
    const [row] = await db.select({
        id: offeringsTable.id,
        title: offeringsTable.title,
        description: offeringsTable.description,
        unitPrice: offeringsTable.unitPrice,
        currency: offeringsTable.currency,
        unitOfMeasure: offeringsTable.unitOfMeasure,
        status: offeringsTable.status,
        categoryKey: offeringTypesTable.key,
        categoryName: offeringTypesTable.displayName,
        updatedAt: offeringsTable.updatedAt,
    }).from(offeringsTable)
        .innerJoin(offeringTypesTable, eq(offeringsTable.offeringType, offeringTypesTable.key))
        .where(and(
            eq(offeringsTable.id, id),
            eq(offeringsTable.offeringType, slug),
            eq(offeringsTable.status, "active"),
            isNull(offeringsTable.deletedAt),
        )).limit(1)
    return row
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug, id } = await params
    const offering = await getOffering(slug, id)
    if (!offering) return constructMetadata({ title: "Packaging offering", description: "Explore F&B packaging offerings.", noIndex: true })
    return constructMetadata({
        title: offering.title,
        description: offering.description,
        canonicalUrl: `/packaging/${offering.categoryKey}/${offering.id}`,
    })
}

export default async function PackagingProductPage({ params }: Props) {
    const { slug, id } = await params
    const offering = await getOffering(slug, id)
    if (!offering) notFound()

    const productUrl = `${siteUrl}/packaging/${offering.categoryKey}/${offering.id}`
    return (
        <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
            <JsonLd schema={[
                productSchema({
                    name: offering.title,
                    description: offering.description,
                    url: productUrl,
                    sku: offering.id,
                    price: offering.unitPrice,
                    currency: offering.currency,
                }),
                breadcrumbSchema([
                    { name: "Home", url: "/" },
                    { name: "Packaging", url: "/packaging" },
                    { name: offering.categoryName, url: `/packaging/${offering.categoryKey}` },
                    { name: offering.title, url: productUrl },
                ]),
            ]} />
            <div>
                <Link href={`/packaging/${offering.categoryKey}`} className="text-sm text-primary hover:underline">
                    ← {offering.categoryName}
                </Link>
                <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight">{offering.title}</h1>
                <p className="mt-4 text-lg leading-8 text-muted-foreground">{offering.description}</p>
            </div>
            <div className="rounded-xl border bg-card p-6">
                <p className="text-sm text-muted-foreground">Starting price</p>
                <p className="mt-1 text-2xl font-semibold">₹{Number(offering.unitPrice).toLocaleString("en-IN")} / {offering.unitOfMeasure}</p>
                <Link href="/sign-up" className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                    Start a packaging requirement
                </Link>
            </div>
        </div>
    )
}
