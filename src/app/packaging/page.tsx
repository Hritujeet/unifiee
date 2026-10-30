import type { Metadata } from "next"
import Link from "next/link"
import { asc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { offeringTypesTable } from "@/lib/db/schema/offering"
import { constructMetadata } from "@/lib/seo/metadata"
import { JsonLd, breadcrumbSchema, softwareApplicationSchema } from "@/components/seo/json-ld"
import { siteUrl } from "@/lib/seo/site-config"

export const metadata: Metadata = constructMetadata({
    title: "F&B Packaging Catalog",
    description: "Explore packaging categories for cafés, restaurants, cloud kitchens, and food brands.",
    canonicalUrl: "/packaging",
})

export default async function PackagingCatalogPage() {
    const categories = await db.select({
        key: offeringTypesTable.key,
        name: offeringTypesTable.displayName,
    }).from(offeringTypesTable)
        .where(eq(offeringTypesTable.vendorType, "manufacturer"))
        .orderBy(asc(offeringTypesTable.displayName))

    return (
        <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
            <JsonLd schema={[
                softwareApplicationSchema(),
                breadcrumbSchema([
                    { name: "Home", url: "/" },
                    { name: "Packaging", url: "/packaging" },
                ]),
            ]} />
            <div>
                <h1 className="font-heading text-4xl font-semibold tracking-tight">F&B packaging catalog</h1>
                <p className="mt-3 max-w-2xl text-muted-foreground">
                    Discover packaging categories and connect with manufacturers for your next procurement requirement.
                </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                    <Link key={category.key} href={`/packaging/${category.key}`} className="rounded-xl border bg-card p-5 transition-colors hover:bg-accent">
                        <h2 className="font-heading text-lg font-semibold">{category.name}</h2>
                        <p className="mt-2 text-sm text-muted-foreground">Explore {category.name.toLowerCase()} offerings.</p>
                    </Link>
                ))}
            </div>
            <p className="text-sm text-muted-foreground">
                Looking for a specific format? <Link href={`${siteUrl}/business`} className="text-primary hover:underline">Create a requirement</Link>.
            </p>
        </div>
    )
}
