import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { DM_Sans, Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import TanstackQueryProvider from "@/components/providers/tanstack-query-providers";
import { ThemeProvider } from "@/components/providers/theme-provider";
import NextTopLoader from "nextjs-toploader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomCursor } from "@/components/site/custom-cursor";

const dmSansHeading = DM_Sans({ subsets: ['latin'], variable: '--font-heading' });

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UNIFIÉE — B2B Packaging Infrastructure for F&B Brands",
  description:
    "UNIFIÉE is an intelligent B2B operating layer that connects the fragmented decisions, suppliers, and workflows behind food and beverage packaging operations.",
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
              <CustomCursor />
              <Toaster />
              {children}
            </TooltipProvider>
          </TanstackQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
