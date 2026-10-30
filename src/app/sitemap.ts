import type { MetadataRoute } from "next"
import { and, eq, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { offeringsTable, offeringTypesTable } from "@/lib/db/schema/offering"
import { siteUrl } from "@/lib/seo/site-config"

const staticRoutes = [
    { path: "/", priority: 1.0 },
    { path: "/about", priority: 0.8 },
    { path: "/faq", priority: 0.6 },
    { path: "/contact", priority: 0.5 },
    { path: "/packaging", priority: 0.8 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date()
    const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
        url: `${siteUrl}${route.path}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: route.priority,
    }))

    try {
        const [categories, products] = await Promise.all([
            db.select({
                key: offeringTypesTable.key,
                updatedAt: offeringTypesTable.updatedAt,
            }).from(offeringTypesTable).where(eq(offeringTypesTable.vendorType, "manufacturer")),
            db.select({
                id: offeringsTable.id,
                offeringType: offeringsTable.offeringType,
                updatedAt: offeringsTable.updatedAt,
            }).from(offeringsTable).where(and(
                eq(offeringsTable.status, "active"),
                isNull(offeringsTable.deletedAt),
            )),
        ])

        entries.push(...categories.map((category) => ({
            url: `${siteUrl}/packaging/${category.key}`,
            lastModified: category.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        })))
        entries.push(...products.map((product) => ({
            url: `${siteUrl}/packaging/${product.offeringType}/${product.id}`,
            lastModified: product.updatedAt,
            changeFrequency: "weekly" as const,
            priority: 0.6,
        })))
    } catch (error) {
        console.error("Could not build dynamic sitemap entries:", error)
    }

    return entries
}
