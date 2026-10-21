import Image from "next/image";
import { CheckCircle2, Layers } from "lucide-react";
import { FadeIn } from "@/components/site/animations";

const benefits = [
  "Zero new creative cycles for variant launches",
  "Core identity preserved across all surfaces",
  "Cultural and seasonal adaptations on-demand",
];

export function AdaptivePackagingSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-start gap-16 lg:grid-cols-2 lg:gap-24">
          <FadeIn>
            <p className="mb-4 font-mono text-xs tracking-widest text-muted-foreground uppercase">
              Adaptive Packaging
            </p>
            <h2 className="text-3xl leading-snug font-semibold tracking-tight text-foreground md:text-4xl">
              Bringing the dynamism of digital branding into physical customer
              experiences.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Packaging should not remain a static purchase. UNIFIÉE treats
              physical brand assets as modular code. Maintain your core
              corporate identity while instantly launching localized, seasonal,
              or promotional variations without triggering a new creative cycle.
            </p>
            <ul className="mt-7 space-y-2.5">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  {benefit}
                </li>
              ))}
            </ul>
          </FadeIn>
          <FadeIn delay={0.2} className="group relative h-110 w-full overflow-hidden rounded-2xl border border-border lg:h-135">
            <Image
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000&q=80&auto=format&fit=crop"
              alt="F&B adaptive packaging modularity"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute right-8 bottom-8 left-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 font-mono text-[10px] tracking-widest text-primary uppercase backdrop-blur-md">
                <Layers className="size-3" />
                Dynamic Layering
              </div>
              <p className="text-xl leading-snug font-semibold tracking-tight text-white md:text-2xl">
                Swap promotional assets without touching the core brand identity.
              </p>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
