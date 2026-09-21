import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FadeIn, FadeInItem, StaggerContainer } from "@/components/animations";

export const metadata: Metadata = {
  title: "About — UNIFIÉE",
  description:
    "UNIFIÉE was founded to resolve the structural inefficiency at the heart of F&B packaging procurement. Physical brand assets should be as scalable and adaptive as software.",
};

const comparisonRows = [
  {
    metric: "Primary Deliverable",
    legacy: "Design is treated as a one-off service or asset",
    platform: "Technology-enabled infrastructure is the core product",
  },
  {
    metric: "Ecosystem Interaction",
    legacy: "Client manually contacts and balances isolated vendors",
    platform: "Platform dynamically bridges the demand-supply loop",
  },
  {
    metric: "Artificial Intelligence",
    legacy: "Used passively for content generation or reference layout",
    platform: "Functions as an active workflow and decision-support layer",
  },
  {
    metric: "Asset Lifecycle",
    legacy: "Packaging parameters remain completely static",
    platform: "Packaging is managed as an adaptive, iterative brand system",
  },
  {
    metric: "Revenue Model",
    legacy: "Heavily dependent on manual human service hours",
    platform: "Driven by scalable platform transactions and network value",
  },
];

const flywheel = [
  {
    step: "01",
    label: "Data Ingestion",
    detail:
      "Manufacturing constraints, dieline geometry tolerances, and seasonal demand patterns feed the system continuously.",
  },
  {
    step: "02",
    label: "Optimization Loop",
    detail:
      "The system recalibrates supplier-demand matching parameters on every completed transaction.",
  },
  {
    step: "03",
    label: "Network Value",
    detail:
      "Each matched order improves prediction accuracy and reduces resource allocation gaps.",
  },
  {
    step: "04",
    label: "Scale Compounding",
    detail:
      "The platform's matching capability compounds as the supplier network and order history expand.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">

      {/* ─── Manifesto ─── */}
      <section className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <StaggerContainer className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            <FadeInItem>
              <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-6">
                Our Foundation
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.06]">
                Unifying fragmented F&amp;B infrastructure.
              </h1>
            </FadeInItem>

            <FadeInItem delay={0.2} className="space-y-4 self-end">
              <p className="text-sm text-muted-foreground leading-relaxed">
                The transition from a design idea on a computer screen to a
                physical package held in a consumer&apos;s hand remains deeply
                broken for growing enterprises. Every day, independent operators
                waste dozens of operational hours trying to bridge information
                gaps, negotiate asymmetric pricing structures, and coordinate
                production variables over disconnected channels.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                UNIFIÉE was founded to resolve this structural inefficiency. We
                believe that physical brand assets should be as scalable,
                adaptive, and clear as software. By standardizing technical
                requirements, automating repetitive coordination, and mapping
                the supply ecosystem into a structured database, we let
                technology shoulder the operational weight.
              </p>
            </FadeInItem>
          </StaggerContainer>

          <FadeIn delay={0.4} className="mt-14 relative h-80 md:h-110 rounded-xl overflow-hidden border border-border">
            <Image
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1400&q=80&auto=format&fit=crop"
              alt="Modern infrastructure representing the UNIFIÉE platform"
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 1280px"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-r from-background/80 via-background/40 to-transparent" />
            <div className="absolute bottom-8 left-8 max-w-sm">
              <p className="font-heading text-xl md:text-2xl font-semibold text-foreground leading-snug tracking-tight">
                Physical operations deserve software-grade infrastructure.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Comparison Table ─── */}
      <section className="py-24 md:py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="mb-12">
            <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-4">
              Structural Comparison
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl text-foreground">
              Engineered for scale, not billable hours.
            </h2>
          </FadeIn>

          <div className="border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 bg-muted/40">
              <div className="p-4 text-[10px] font-mono text-muted-foreground tracking-widest uppercase border-r border-border">
                Metric
              </div>
              <div className="p-4 text-[10px] font-mono text-muted-foreground tracking-widest uppercase border-r border-border">
                Legacy Approach
              </div>
              <div className="p-4 text-[10px] font-mono text-primary tracking-widest uppercase">
                UNIFIÉE Platform
              </div>
            </div>

            {comparisonRows.map((row, i) => (
              <div
                key={row.metric}
                className={`grid grid-cols-3 border-t border-border ${i % 2 === 1 ? "bg-muted/20" : "bg-background"}`}
              >
                <div className="p-4 border-r border-border">
                  <p className="text-sm font-medium text-foreground">{row.metric}</p>
                </div>
                <div className="p-4 border-r border-border">
                  <p className="text-sm text-muted-foreground leading-relaxed">{row.legacy}</p>
                </div>
                <div className="p-4">
                  <p className="text-sm text-foreground leading-relaxed">{row.platform}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Data Flywheel ─── */}
      <section className="py-24 md:py-32 border-t border-border bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-4">
              The Data Flywheel
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Built on continuous business intelligence.
            </h2>
            <p className="text-sm text-muted-foreground mt-5 leading-relaxed">
              As the platform continuously processes structured data points —
              ranging from manufacturing constraints and dieline geometry
              tolerances to seasonal demand spikes — the underlying system
              optimizes itself. Over time, the platform&apos;s ability to match
              your project with the perfect supplier improves automatically.
            </p>
          </FadeIn>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {flywheel.map((item) => (
              <FadeInItem
                key={item.step}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors"
              >
                <span className="text-xs font-mono text-primary">{item.step}</span>
                <h3 className="text-base font-semibold mt-4 text-foreground">{item.label}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.detail}</p>
              </FadeInItem>
            ))}
          </StaggerContainer>

          <div className="mt-8 flex items-center justify-center gap-2">
            {flywheel.map((item, i) => (
              <div key={item.step} className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-primary/50" />
                {i < flywheel.length - 1 && <div className="w-10 h-px bg-border" />}
              </div>
            ))}
            <span className="ml-2 text-xs font-mono text-muted-foreground">continuous</span>
          </div>
        </div>
      </section>

      {/* ─── Ecosystem CTA ─── */}
      <section className="py-24 md:py-32 border-t border-border">
        <StaggerContainer className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <FadeInItem>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-snug text-foreground">
              Help shape the next layer of F&amp;B infrastructure.
            </h2>
          </FadeInItem>
          <FadeInItem delay={0.2}>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We are not engineering this platform inside a silo. UNIFIÉE is
              built directly alongside the real restaurant founders, cloud
              kitchen teams, and café operators who experience these distribution
              bottlenecks daily.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-3 mt-7">
              <Link href="/contact" className={buttonVariants({ size: "lg" })}>
                Get in Touch
              </Link>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfnqzq5UKUFp_rlQgw7518s-6Gi9Ryu4rXV316FxmEZSeI8HQ/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "gap-2")}
              >
                Take our survey
                <ArrowRight className="size-4" />
              </a>
            </div>
          </FadeInItem>
        </StaggerContainer>
      </section>
    </div>
  );
}
