import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/seo/site-config"

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: ["/", "/packaging", "/suppliers", "/pricing", "/about", "/blog"],
                disallow: [
                    "/business/",
                    "/manufacturer/",
                    "/designer/",
                    "/api/",
                    "/admin/",
                    "/sign-in",
                    "/sign-up",
                    "/onboarding",
                ],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    }
}
