import Image from "next/image";
import { CheckCircle2, Layers } from "lucide-react";

const benefits = [
  "Zero new creative cycles for variant launches",
  "Core identity preserved across all surfaces",
  "Cultural and seasonal adaptations on-demand",
];

export function AdaptivePackagingSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          {/* Text column */}
          <div>
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
                <li
                  key={benefit}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Image column */}
          <div className="group relative h-[22rem] w-full overflow-hidden rounded-2xl border border-border shadow-xs sm:h-110 lg:h-125">
            <Image
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000&q=80&auto=format&fit=crop"
              alt="Warm café interior inspiring a seasonal packaging collection"
              fill
              className="object-cover transition-transform duration-700 "
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/35 to-transparent" />
            <div className="absolute top-4 right-4 left-4 flex items-start justify-between gap-3 sm:top-5 sm:right-5 sm:left-5">
              <div className="rounded-xl border border-white/15 bg-black/35 px-3 py-2 ">
                <p className="font-mono text-[9px] tracking-[0.16em] text-white/60 uppercase">Packaging system</p>
                <p className="mt-0.5 text-xs font-medium text-white">Bluebird Café</p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2.5 py-1.5 font-mono text-[9px] text-white/85 ">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                04 variants
              </div>
            </div>
            <div className="absolute right-5 bottom-5 left-5 sm:right-8 sm:bottom-8 sm:left-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 font-mono text-[10px] tracking-widest text-primary uppercase ">
                <Layers className="size-3" />
                Core + seasonal layer
              </div>
              <p className="max-w-md text-lg leading-snug font-semibold tracking-tight text-white sm:text-xl md:text-2xl">
                A living packaging system, built around one consistent brand.
              </p>
              <div className="mt-4 flex items-center gap-2" aria-label="Brand color palette">
                <span className="size-3 rounded-full border border-white/35 bg-[#f4e7d0]" />
                <span className="size-3 rounded-full border border-white/35 bg-[#245c49]" />
                <span className="size-3 rounded-full border border-white/35 bg-[#d5895a]" />
                <span className="ml-1 font-mono text-[9px] tracking-wide text-white/65">BRAND PALETTE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
