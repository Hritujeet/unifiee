import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  GitBranch,
  Globe,
  Layers,
  Network,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FadeIn, FadeInItem, StaggerContainer } from "@/components/site/animations";
export const metadata: Metadata = {
  title: "UNIFIÉE — One system, from requirement to production",
  description:
    "UNIFIÉE is an intelligent B2B operating layer that connects the fragmented decisions, suppliers, and workflows behind food and beverage packaging operations.",
};

const metrics = [
  {
    stat: "4–6",
    label: "Vendors",
    description:
      "The average café balances separate relationships, separate invoices, and isolated delivery schedules just to execute standard packaging.",
  },
  {
    stat: "Arbitrary",
    label: "MOQs",
    description:
      "Small food and beverage businesses are consistently forced into over-ordering materials simply to secure acceptable unit pricing.",
  },
  {
    stat: "Silent",
    label: "Suppliers",
    description:
      "Suppliers routinely become unresponsive mid-order, creating catastrophic blind spots in physical supply lines.",
  },
];

const modules = [
  {
    number: "01",
    title: "AI-Powered Decision Support",
    description:
      "Moving past the passive chatbot. The platform interprets your specific operational data — dine-in ratios, material restrictions, and budget limits — to tell you exactly what packaging specification you need.",
    Icon: Brain,
  },
  {
    number: "02",
    title: "Automated Requirements-to-Production Pipeline",
    description:
      "A structured digital workflow catches layout anomalies and geometry errors before they transform into irreversible printing mistakes.",
    Icon: GitBranch,
  },
  {
    number: "03",
    title: "Dynamic Supply Matching Engine",
    description:
      "Demand is routed directly into an optimized network of validated manufacturers based on volume, location constraints, and strict quality parity.",
    Icon: Network,
  },
];

const heroImages = [
  {
    src: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80&auto=format&fit=crop",
    alt: "Branded coffee cups on a counter",
    offset: "mt-0",
  },
  {
    src: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80&auto=format&fit=crop",
    alt: "Seasonal decorated packaging cups",
    offset: "mt-8",
  },
  {
    src: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80&auto=format&fit=crop",
    alt: "Premium latte art close up",
    offset: "mt-4",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* ─── Hero ─── */}
      <section className="min-h-svh flex flex-col items-center justify-center py-30 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)`,
            backgroundSize: "72px 72px",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-background to-transparent pointer-events-none" />

        <StaggerContainer className="relative max-w-4xl mx-auto px-6 text-center">
          <FadeInItem>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.06] tracking-tight text-foreground">
              One system, from requirement to production.
            </h1>
          </FadeInItem>

          <FadeInItem delay={0.1}>
            <p className="text-base md:text-lg text-muted-foreground mt-7 max-w-xl mx-auto leading-relaxed font-light">
              UNIFIÉE is an intelligent B2B operating layer that connects the
              fragmented decisions, suppliers, and workflows behind food and
              beverage packaging operations.
            </p>
          </FadeInItem>

          <FadeInItem delay={0.2} className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Link href="/contact" className={buttonVariants({ size: "lg" })}>
              Let&apos;s Talk
            </Link>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfnqzq5UKUFp_rlQgw7518s-6Gi9Ryu4rXV316FxmEZSeI8HQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Take our Survey
            </a>
            <Link href="/about" className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "gap-2")}>
              Learn More
              <ArrowRight className="size-4" />
            </Link>
          </FadeInItem>

          {/* Image mosaic */}
          <FadeInItem delay={0.3} className="mt-14 grid grid-cols-3 gap-3 max-w-2xl mx-auto">
            {heroImages.map((img) => (
              <div
                key={img.src}
                className={`relative h-44 rounded-xl overflow-hidden border border-border ${img.offset}`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 200px"
                />
              </div>
            ))}
          </FadeInItem>
        </StaggerContainer>
      </section>

      {/* ─── Fragmentation Metrics ─── */}
      <section className="py-24 md:py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl text-foreground">
              Sourcing packaging shouldn&apos;t mean managing chaos.
            </h2>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-3 gap-px bg-border border border-border rounded-xl overflow-hidden mt-14">
            {metrics.map((m) => (
              <FadeInItem key={m.stat} className="bg-background p-8">
                <p className="font-heading text-5xl md:text-6xl font-semibold text-foreground tracking-tight">
                  {m.stat}
                </p>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mt-3">
                  {m.label}
                </p>
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                  {m.description}
                </p>
              </FadeInItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Full-bleed Showcase ─── */}
      <section className="relative h-95 md:h-115 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=85&auto=format&fit=crop"
          alt="Busy restaurant and F&B operations at scale"
          fill
          className="object-cover"
          sizes="100vw"
        />
        {/* Gradient overlay — left-weighted so text is readable */}
        <div className="absolute inset-0 bg-linear-to-r from-background via-background/75 to-background/10" />
        <div className="absolute inset-0 bg-linear-to-t from-background/60 to-transparent" />

        <FadeIn className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center">
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-4">
            The Operational Reality
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight max-w-xl text-foreground leading-snug">
            Every growing F&amp;B brand runs into the same wall.
          </h2>
          <p className="text-sm text-muted-foreground mt-4 max-w-md leading-relaxed">
            Fragmented suppliers, silent vendors, arbitrary MOQs — the physical
            layer of building a food brand was never designed to scale. UNIFIÉE
            is.
          </p>
        </FadeIn>
      </section>

      {/* ─── Platform Features ─── */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-xl text-foreground">
              Built for the actual scale of your business.
            </h2>
            <p className="text-sm text-muted-foreground font-mono">
              Three modules. One integrated workflow.
            </p>
          </FadeIn>

          <StaggerContainer className="border border-border rounded-xl overflow-hidden divide-y divide-border">
            {modules.map((mod) => {
              const Icon = mod.Icon;
              return (
                <FadeInItem
                  key={mod.number}
                  className="bg-background grid md:grid-cols-[5rem_1fr] hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-3 p-6 md:p-8 border-b md:border-b-0 md:border-r border-border">
                    <span className="text-xs font-mono text-muted-foreground">
                      {mod.number}
                    </span>
                    <div className="size-8 rounded-lg border border-border bg-background/35 flex items-center justify-center group-hover:border-primary/40 dark:group-hover:border-primary transition-colors">
                      <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <h3 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed max-w-2xl">
                      {mod.description}
                    </p>
                  </div>
                </FadeInItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Bento Grid ─── */}
      <section className="py-24 md:py-32 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="mb-12">
            <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-3">
              Platform Capabilities
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Infrastructure at every layer.
            </h2>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 auto-rows-fr gap-4">
            {/* AI Decision — 2×2 */}
            <FadeInItem className="col-span-2 row-span-2 bg-card border border-border rounded-xl p-7 flex flex-col justify-between hover:border-primary/30 dark:hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
              <div>
                <div className="size-9 rounded-lg border border-border bg-background/35 flex items-center justify-center mb-5 group-hover:border-primary/40 dark:group-hover:border-primary transition-colors">
                  <Brain className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">AI Decision Support</h3>
                <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">
                  The platform interprets operational data — dine-in ratios,
                  material restrictions, budget limits — to surface the exact
                  specification you need.
                </p>
              </div>
              <div className="mt-6 font-mono text-xs bg-muted/60 rounded-lg p-4 space-y-1.5 border border-border">
                <p className="text-muted-foreground">→ Analyzing operational profile...</p>
                <p className="font-medium">Recommended: 90gsm PE-coated kraft, 8oz taper</p>
                <p className="text-muted-foreground">Unit cost estimate: ₹4.20 – ₹4.80</p>
              </div>
            </FadeInItem>

            {/* Stat 72h */}
            <FadeInItem className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between hover:border-primary/30 dark:hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
              <Zap className="size-4 text-muted-foreground" />
              <div>
                <p className="font-heading text-4xl font-semibold mt-3 text-foreground">72h</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                  Avg. time from requirements to confirmed supplier match.
                </p>
              </div>
            </FadeInItem>

            {/* Stat 0 */}
            <FadeInItem className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between hover:border-primary/30 dark:hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
              <Globe className="size-4 text-muted-foreground" />
              <div>
                <p className="font-heading text-4xl font-semibold mt-3 text-foreground">0</p>
                <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                  MOQ overcommits on platform-matched orders.
                </p>
              </div>
            </FadeInItem>

            {/* Pipeline */}
            <FadeInItem className="col-span-2 bg-card border border-border rounded-xl p-5 hover:border-primary/30 dark:hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="size-7 rounded-md border border-border bg-background/35 flex items-center justify-center group-hover:border-primary/40 dark:group-hover:border-primary transition-colors">
                  <GitBranch className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Automated Pipeline</p>
                  <p className="text-xs text-muted-foreground font-mono">Requirement → Production</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {["Spec", "Dieline", "Review", "Supplier", "Production"].map((s, i, arr) => (
                  <div key={s} className="flex items-center gap-1 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className={`h-1 rounded-full ${i < 3 ? "bg-primary" : "bg-border"}`} />
                      <p className="text-[9px] text-muted-foreground mt-1.5 font-mono truncate">{s}</p>
                    </div>
                    {i < arr.length - 1 && <div className="size-1 rounded-full bg-border shrink-0 mb-3" />}
                  </div>
                ))}
              </div>
            </FadeInItem>

            {/* Supply matching */}
            <FadeInItem className="col-span-2 bg-card border border-border rounded-xl p-5 hover:border-primary/30 dark:hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="size-7 rounded-md border border-border bg-background/35 flex items-center justify-center group-hover:border-primary/40 dark:group-hover:border-primary transition-colors">
                  <Network className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Supply Matching Engine</p>
                  <p className="text-xs text-muted-foreground font-mono">500+ validated manufacturers</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[["Volume", 80], ["Location", 65], ["Quality", 92]].map(([label, pct]) => (
                  <div key={label} className="bg-muted rounded-md px-3 py-2.5">
                    <p className="text-[10px] text-muted-foreground font-mono mb-1.5">{label}</p>
                    <div className="h-1 bg-border rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </FadeInItem>

            {/* Adaptive strip */}
            <FadeInItem className="col-span-2 lg:col-span-4 bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:border-primary/30 dark:hover:border-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
              <div className="flex items-center gap-3.5">
                <div className="size-9 rounded-lg border border-border bg-background/35 flex items-center justify-center group-hover:border-primary/40 dark:group-hover:border-primary transition-colors">
                  <Layers className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Adaptive Packaging Infrastructure</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Physical brand assets managed as modular, iterative systems.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {["Core Identity", "Seasonal Layer", "Promotional Layer", "Localized Layer"].map((tag) => (
                  <span key={tag} className="text-xs px-2.5 py-1 border border-border rounded-md text-muted-foreground bg-background/30">
                    {tag}
                  </span>
                ))}
              </div>
            </FadeInItem>
          </StaggerContainer>
        </div>
      </section>

      {/* ─── Innovation Layer ─── */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            <FadeIn>
              <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-4">
                Adaptive Packaging
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight leading-snug text-foreground">
                Bringing the dynamism of digital branding into physical customer
                experiences.
              </h2>
              <p className="text-sm text-muted-foreground mt-5 leading-relaxed">
                Packaging should not remain a static purchase. UNIFIÉE treats
                physical brand assets as modular code. Maintain your core
                corporate identity while instantly launching localized, seasonal,
                or promotional variations without triggering a new creative cycle.
              </p>
              <ul className="mt-7 space-y-2.5">
                {[
                  "Zero new creative cycles for variant launches",
                  "Core identity preserved across all surfaces",
                  "Cultural and seasonal adaptations on-demand",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="size-4 text-primary mt-0.5 shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </FadeIn>
            <FadeIn delay={0.2} className="relative h-110 lg:h-135 w-full rounded-2xl overflow-hidden border border-border group">
              <Image
                src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000&q=80&auto=format&fit=crop"
                alt="F&B adaptive packaging modularity"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-background/90 via-background/20 to-transparent" />

              <div className="absolute bottom-8 left-8 right-8">
                <div className="inline-flex items-center gap-2 text-[10px] font-mono text-primary uppercase tracking-widest mb-3 bg-background/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50">
                  <Layers className="size-3" />
                  Dynamic Layering
                </div>
                <p className="text-xl md:text-2xl font-semibold text-foreground leading-snug tracking-tight">
                  Swap promotional assets without touching the core brand identity.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── Product Scope ─── */}
      <section className="py-24 md:py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <FadeIn className="mb-14">
            <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-4">
              Product Scope
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl text-foreground">
              Engineered for complete operational touchpoints.
            </h2>
          </FadeIn>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="relative py-28 md:py-36 border-t border-border overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=85&auto=format&fit=crop"
            alt="Cafe and F&B brand environment"
            fill
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-background/90 dark:bg-background/95" />
        </div>

        <FadeIn className="relative max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight max-w-2xl mx-auto leading-snug text-foreground">
            Build your physical brand on a single operational system.
          </h2>
          <p className="text-sm text-muted-foreground mt-5 max-w-lg mx-auto leading-relaxed">
            Shift from fragmented vendor coordination to structured packaging
            infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link href="/contact" className={buttonVariants({ size: "lg" })}>
              Get in Touch
            </Link>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfnqzq5UKUFp_rlQgw7518s-6Gi9Ryu4rXV316FxmEZSeI8HQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "gap-2")}
            >
              Take our research survey
              <ArrowRight className="size-4" />
            </a>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
