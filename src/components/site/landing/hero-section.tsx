import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FadeIn, FadeInItem, StaggerContainer } from "@/components/site/animations";
import { ProductFrame } from "@/components/site/landing/product-frame";
import { BusinessDashboardPreview } from "@/components/site/landing/dashboard-previews";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-44 pb-8 md:pt-52 md:pb-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, var(--color-foreground) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_70%)]" />

      <StaggerContainer className="relative mx-auto max-w-3xl px-6 text-center">
        <FadeInItem>
          <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            B2B packaging infrastructure
          </p>
          <h1 className="text-[2.4rem] leading-[1.08] font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
            One system, from requirement to production.
          </h1>
        </FadeInItem>
        <FadeInItem delay={0.08}>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed font-light text-muted-foreground">
            UNIFIÉE is the operating layer for F&amp;B packaging — decisions, vendors, design, and orders in one place.
          </p>
        </FadeInItem>
        <FadeInItem delay={0.16} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
            Get started
          </Link>
          <Link href="/contact" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}>
            Talk to us
            <ArrowRight className="size-4" />
          </Link>
        </FadeInItem>
      </StaggerContainer>

      <FadeIn
        delay={0.15}
        blur={false}
        viewport={{ once: true, amount: 0.05 }}
        className="relative mx-auto mt-14 max-w-6xl px-4 sm:px-6"
      >
        <ProductFrame url="app.unifiee.com/business">
          <div className="max-h-[520px] overflow-hidden">
            <BusinessDashboardPreview />
          </div>
        </ProductFrame>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-background to-transparent md:h-40" />
      </FadeIn>
    </section>
  );
}
