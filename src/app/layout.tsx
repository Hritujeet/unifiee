import type { Metadata } from "next";
import { DM_Sans, Geist_Mono, Roboto, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const dmSansHeading = DM_Sans({subsets:['latin'],variable:'--font-heading'});

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
      className={cn(
              "h-full antialiased",
              geistMono.variable
            , "font-sans", geist.variable, dmSansHeading.variable)}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
