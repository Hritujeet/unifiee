import { siteConfig, siteUrl } from "@/lib/seo/site-config"

type JsonLdObject = Record<string, unknown>

export type ProductSchemaInput = {
    name: string
    description: string
    url: string
    sku?: string
    image?: string
    price?: string | number
    currency?: string
    availability?: "InStock" | "OutOfStock" | "PreOrder"
    ratingValue?: number
    ratingCount?: number
}

export type BreadcrumbItem = {
    name: string
    url: string
}

export type FaqItem = {
    question: string
    answer: string
}

export function organizationSchema(): JsonLdObject {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: siteConfig.name,
        url: siteUrl,
        logo: `${siteUrl}${siteConfig.logo}`,
        sameAs: [
            "https://instagram.com/teamunifiee",
        ],
        contactPoint: {
            "@type": "ContactPoint",
            email: siteConfig.contactEmail,
            contactType: "customer support",
            areaServed: "IN",
            availableLanguage: ["English", "Hindi"],
        },
    }
}

export function softwareApplicationSchema(): JsonLdObject {
    return {
        "@context": "https://schema.org",
        "@type": ["SoftwareApplication", "Service"],
        name: siteConfig.name,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: siteUrl,
        description: siteConfig.description,
        provider: {
            "@type": "Organization",
            name: siteConfig.name,
            url: siteUrl,
        },
    }
}

export function productSchema(input: ProductSchemaInput): JsonLdObject {
    const schema: JsonLdObject = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: input.name,
        description: input.description,
        url: input.url,
        ...(input.sku ? { sku: input.sku } : {}),
        ...(input.image ? { image: input.image } : {}),
    }

    if (input.price !== undefined) {
        schema.offers = {
            "@type": "Offer",
            price: input.price,
            priceCurrency: input.currency ?? "INR",
            availability: `https://schema.org/${input.availability ?? "InStock"}`,
            url: input.url,
        }
    }

    if (input.ratingValue !== undefined && input.ratingCount !== undefined) {
        schema.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: input.ratingValue,
            ratingCount: input.ratingCount,
        }
    }

    return schema
}

export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLdObject {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
        })),
    }
}

export function breadcrumbsFromPathname(pathname: string): BreadcrumbItem[] {
    const segments = pathname.split("/").filter(Boolean)
    return [
        { name: "Home", url: "/" },
        ...segments.map((segment, index) => ({
            name: segment.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
            url: `/${segments.slice(0, index + 1).join("/")}`,
        })),
    ]
}

export function faqPageSchema(items: FaqItem[]): JsonLdObject {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
            },
        })),
    }
}

export function JsonLd({ schema }: { schema: JsonLdObject | JsonLdObject[] }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    )
}
