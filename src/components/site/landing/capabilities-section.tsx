import {
  Brain,
  GitBranch,
  Globe,
  Layers,
  Network,
  Zap,
} from "lucide-react";
import { FadeIn, FadeInItem, StaggerContainer } from "@/components/site/animations";

export function CapabilitiesSection() {
  return (
    <section id="platform" className="scroll-mt-24 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn className="mb-12">
          <p className="mb-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Platform Capabilities
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Infrastructure at every layer.
          </h2>
        </FadeIn>

        <StaggerContainer className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FadeInItem className="relative col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-7 sm:col-span-2 lg:row-span-2">
            <div>
              <div className="mb-5 flex size-9 items-center justify-center rounded-lg border border-border bg-muted">
                <Brain className="size-4 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">AI Decision Support</h3>
              <p className="mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                The platform interprets operational data — dine-in ratios, material restrictions, budget limits — to surface the exact specification you need.
              </p>
            </div>
            <div className="mt-8 overflow-hidden rounded-xl border border-border bg-muted/40 font-mono text-[11px]">
              <div className="border-b border-border/60 px-4 py-2 text-muted-foreground">intake · live</div>
              <div className="space-y-1.5 p-4">
                <p className="text-muted-foreground">→ Analyzing operational profile...</p>
                <p className="font-medium text-foreground">Recommended: 90gsm PE-coated kraft, 8oz taper</p>
                <p className="text-muted-foreground">Unit cost estimate: ₹4.20 – ₹4.80</p>
              </div>
            </div>
          </FadeInItem>

          <FadeInItem className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-6">
            <Zap className="size-4 text-muted-foreground" />
            <div>
              <p className="font-heading mt-6 text-3xl font-semibold tracking-tight text-foreground">One brief</p>
              <p className="mt-2 text-xs leading-snug text-muted-foreground">
                Start with what you need. Shape it into a structured requirement.
              </p>
            </div>
          </FadeInItem>

          <FadeInItem className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-6">
            <Globe className="size-4 text-muted-foreground" />
            <div>
              <p className="font-heading mt-6 text-3xl font-semibold tracking-tight text-foreground">More clarity</p>
              <p className="mt-2 text-xs leading-snug text-muted-foreground">
                Compare supplier offers with the details that shape the decision.
              </p>
            </div>
          </FadeInItem>

          <FadeInItem className="col-span-1 rounded-2xl border border-border/70 bg-card p-6 sm:col-span-2">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-md border border-border bg-muted">
                <GitBranch className="size-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Automated Pipeline</p>
                <p className="font-mono text-xs text-muted-foreground">Requirement → Production</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {["Spec", "Dieline", "Review", "Supplier", "Production"].map((step, index, steps) => (
                <div key={step} className="flex min-w-0 flex-1 items-center gap-1">
                  <div className="min-w-0 flex-1">
                    <div className={`h-1 rounded-full ${index < 3 ? "bg-primary" : "bg-border"}`} />
                    <p className="mt-1.5 truncate font-mono text-[9px] text-muted-foreground">{step}</p>
                  </div>
                  {index < steps.length - 1 && <div className="mb-3 size-1 shrink-0 rounded-full bg-border" />}
                </div>
              ))}
            </div>
          </FadeInItem>

          <FadeInItem className="col-span-1 rounded-2xl border border-border/70 bg-card p-6 sm:col-span-2">
            <div className="mb-5 flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-md border border-border bg-muted">
                <Network className="size-3.5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Supply Matching Engine</p>
                <p className="font-mono text-xs text-muted-foreground">Shortlists shaped around your criteria</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {["MOQ", "Lead time", "Location", "Price tier"].map((criterion) => (
                <span key={criterion} className="rounded-md bg-muted px-3 py-2 font-mono text-[10px] text-muted-foreground">
                  {criterion}
                </span>
              ))}
            </div>
          </FadeInItem>

          <FadeInItem className="col-span-1 flex flex-col justify-between gap-5 rounded-2xl border border-border/70 bg-card p-6 sm:col-span-2 sm:flex-row sm:items-center lg:col-span-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted">
                <Layers className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Adaptive Packaging Infrastructure</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Physical brand assets managed as modular, iterative systems.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {["Core Identity", "Seasonal Layer", "Promotional Layer", "Localized Layer"].map((tag) => (
                <span key={tag} className="rounded-md border border-border bg-background/40 px-2.5 py-1 text-xs text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </FadeInItem>
        </StaggerContainer>
      </div>
    </section>
  );
}
