export const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://unifiee.com").replace(/\/+$/, "")

export const siteConfig = {
    name: "UNIFIÉE",
    url: siteUrl,
    title: "UNIFIÉE - B2B F&B Packaging & Branding",
    titleTemplate: "%s | UNIFIÉE - B2B F&B Packaging & Branding",
    description:
        "UNIFIÉE connects F&B businesses with packaging manufacturers, suppliers, and designers through one B2B procurement and branding workflow.",
    twitterHandle: "@unifiee",
    ogImage: "/LogoLight.png",
    logo: "/LogoLight.png",
    contactEmail: "teamunifiee@gmail.com",
} as const
