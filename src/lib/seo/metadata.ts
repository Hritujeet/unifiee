import type { Metadata } from "next"
import { siteConfig, siteUrl } from "./site-config"

export type ConstructMetadataInput = {
    title: string
    description: string
    image?: string
    canonicalUrl?: string
    noIndex?: boolean
}

export function constructMetadata({
    title,
    description,
    image = siteConfig.ogImage,
    canonicalUrl,
    noIndex = false,
}: ConstructMetadataInput): Metadata {
    const resolvedImage = image.startsWith("http") ? image : `${siteUrl}${image}`
    const canonical = canonicalUrl
        ? canonicalUrl.startsWith("http") ? canonicalUrl : `${siteUrl}${canonicalUrl}`
        : undefined

    return {
        title,
        description,
        metadataBase: new URL(siteUrl),
        alternates: canonical ? { canonical } : undefined,
        robots: noIndex ? { index: false, follow: false } : undefined,
        openGraph: {
            type: "website",
            url: canonical,
            title,
            description,
            siteName: siteConfig.name,
            locale: "en_IN",
            images: [{ url: resolvedImage, alt: title }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            site: siteConfig.twitterHandle,
            images: [resolvedImage],
        },
    }
}
