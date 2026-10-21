import { FadeIn, FadeInItem, StaggerContainer } from "@/components/site/animations";

const painPoints = [
  {
    label: "01 / DECIDE",
    title: "Requirements are hard to define.",
    description:
      "Material, format, finish, and quantity all matter. Without guidance, it is difficult to know what to ask for.",
  },
  {
    label: "02 / SOURCE",
    title: "Suppliers are hard to compare.",
    description:
      "The right partner depends on practical details like minimum order, location, price, and lead time.",
  },
  {
    label: "03 / COORDINATE",
    title: "Costs and conversations get scattered.",
    description:
      "Quotes, artwork, approvals, and delivery details often live across separate people and message threads.",
  },
  {
    label: "04 / REPEAT",
    title: "Every new launch can feel like a reset.",
    description:
      "Seasonal and promotional packaging should build on a brand, not require starting the creative process from scratch.",
  },
];

export function ProblemSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <FadeIn>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Sourcing packaging shouldn&apos;t mean managing chaos.
          </h2>
        </FadeIn>

        <StaggerContainer className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {painPoints.map((point) => (
            <FadeInItem
              key={point.label}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group rounded-2xl border border-border/70 bg-card/40 p-6 transition-colors duration-300 hover:border-primary/30 hover:bg-card/80 sm:p-7"
            >
              <p className="font-mono text-[10px] tracking-[0.18em] text-primary uppercase">
                {point.label}
              </p>
              <h3 className="mt-7 text-lg font-medium leading-snug tracking-tight text-foreground">
                {point.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{point.description}</p>
            </FadeInItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

export function ChaosStatementSection() {
  return (
    <section className="relative overflow-hidden py-32 md:py-44">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, color-mix(in oklch, var(--foreground) 22%, transparent) 1px, transparent 0),
            linear-gradient(to right, color-mix(in oklch, var(--primary) 8%, transparent), transparent 40%, color-mix(in oklch, var(--primary) 8%, transparent))
          `,
          backgroundSize: "28px 28px, 100% 100%",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_72%)]" />
      <div className="pointer-events-none absolute -left-24 top-1/2 size-80 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 size-72 rounded-full bg-primary/10 blur-3xl" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]" aria-hidden>
        <defs>
          <pattern id="chaos-lines" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M0 60h120M60 0v120" fill="none" stroke="currentColor" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#chaos-lines)" />
      </svg>
      <FadeIn className="relative mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          UNIFIÉE eliminates the chaos.
        </h2>
      </FadeIn>
    </section>
  );
}
