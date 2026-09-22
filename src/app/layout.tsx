import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { DM_Sans, Geist_Mono, Roboto, Inter, Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

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
      className={cn(
        "h-full antialiased",
        geistMono.variable
        , "font-sans", geist.variable, dmSansHeading.variable)}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
