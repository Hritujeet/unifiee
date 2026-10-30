import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProductFrame } from "@/components/site/landing/product-frame";
import { BusinessDashboardPreview } from "@/components/site/landing/dashboard-previews";
import { HeroDotField } from "@/components/site/landing/hero-dot-field";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-44 pb-8 md:pt-52 md:pb-12">
      {/* Interactive canvas dot field animation */}
      <HeroDotField />

      {/* Top ambient radial gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_70%)]" />

      {/* Copy */}
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
          B2B packaging infrastructure
        </p>
        <h1 className="text-[2.4rem] leading-[1.08] font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
          One System | From Requirement to Delivery
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed font-light text-muted-foreground">
          UNIFIÉE is the operating layer for F&amp;B packaging — decisions, vendors, design, and orders in one place.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
            Get started
          </Link>
          <Link
            href="/contact"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}
          >
            Talk to us
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* Product banner */}
      <div className="relative mx-auto mt-10 max-w-6xl px-3 sm:mt-14 sm:px-6">
        <ProductFrame url="app.unifiee.com/business">
          <div className="max-h-[300px] overflow-hidden sm:max-h-[400px] lg:max-h-[520px]">
            <BusinessDashboardPreview />
          </div>
        </ProductFrame>
        {/* Bottom subtle fade into next section */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-background to-transparent md:h-40" />
      </div>
    </section>
  );
}