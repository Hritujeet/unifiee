import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { JsonLd, organizationSchema } from "@/components/seo/json-ld";
import { siteConfig, siteUrl } from "@/lib/seo/site-config";
import { DM_Sans, Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import TanstackQueryProvider from "@/components/providers/tanstack-query-providers";
import { ThemeProvider } from "@/components/providers/theme-provider";
import NextTopLoader from "nextjs-toploader";
import { TooltipProvider } from "@/components/ui/tooltip";

const dmSansHeading = DM_Sans({ subsets: ['latin'], variable: '--font-heading' });

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteConfig.title,
    template: siteConfig.titleTemplate,
  },
  description: siteConfig.description,
  alternates: { canonical: siteUrl },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteUrl,
    images: [{ url: siteConfig.ogImage, alt: siteConfig.title }],
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitterHandle,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  verification: {
    google: "GOOGLE_SEARCH_CONSOLE_VERIFICATION",
    other: { "msvalidate.01": "BING_WEBMASTER_VERIFICATION" },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={cn(
        "h-full antialiased",
        geistMono.variable
        , "font-sans", geist.variable, dmSansHeading.variable)}
    >
      <body>
        <JsonLd schema={organizationSchema()} />
        {/* Inline theme hydration script — prevents flash of wrong theme on navigation/redirects */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})()`,
          }}
        />
        <NextTopLoader color="#2563eb" showSpinner={false} height={1.5} />
        <ThemeProvider>
          <TanstackQueryProvider>
            <TooltipProvider>
              <Toaster />
              {children}
            </TooltipProvider>
          </TanstackQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
