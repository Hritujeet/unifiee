"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

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
        <div>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Sourcing packaging shouldn&apos;t mean managing chaos.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {painPoints.map((point) => (
            <div
              key={point.label}
              className="group rounded-2xl border border-border/70 bg-card/40 p-6 transition-all duration-300 hover:-translate-y-1 dark:hover:border-blue-400/30 hover:border-primary/30 hover:bg-card/80 sm:p-7"
            >
              <p className="font-mono text-[10px] tracking-[0.18em] text-primary dark:text-blue-400 uppercase">
                {point.label}
              </p>
              <h3 className="mt-7 text-lg font-medium leading-snug tracking-tight text-foreground">
                {point.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ChaosStatementSection() {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // The outer section creates scroll travel for the pinned sequence.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Scale smoothly from 0.75 → 1 as the user scrolls
  const scale = useTransform(
    scrollYProgress,
    [0, 0.65],
    prefersReduced ? [1, 1] : [0.75, 1],
  );

  // Smooth opacity and gentle lift for the overline label
  const labelOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const labelY = useTransform(scrollYProgress, [0, 0.35], [0, -12]);

  // Fade the headline in progressively
  const headlineOpacity = useTransform(scrollYProgress, [0.1, 0.55], [0.4, 1]);

  return (
    /*
     * The outer div is 200vh tall (100vh pinned, 100vh travel).
     * overflow-x-clip prevents the decorative blur circles from creating horizontal overflow.
     */
    <div
      ref={containerRef}
      className="relative md:h-[200vh] overflow-x-clip"
    >
      {/* Background decoration */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, color-mix(in oklch, var(--foreground) 22%, transparent) 1px, transparent 0),
            linear-gradient(to right, color-mix(in oklch, var(--primary) 8%, transparent), transparent 40%, color-mix(in oklch, var(--primary) 8%, transparent))
          `,
          backgroundSize: "28px 28px, 100% 100%",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_72%)]" />
      <div className="pointer-events-none absolute -left-24 top-1/2 size-80 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--primary)_16%,transparent)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute -right-24 top-1/3 size-72 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--primary)_12%,transparent)_0%,transparent_70%)]" />
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]" aria-hidden>
        <defs>
          <pattern id="chaos-lines" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M0 60h120M60 0v120" fill="none" stroke="currentColor" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#chaos-lines)" />
      </svg>

      {/* Sticky centred content */}
      <div className="relative md:sticky md:top-0 md:h-screen flex items-center justify-center overflow-hidden py-32 md:py-0">
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          {/* Overline label that lifts and fades out smoothly */}
          <motion.p
            style={{
              opacity: prefersReduced ? 1 : labelOpacity,
              y: prefersReduced ? 0 : labelY,
            }}
            className="mb-6 font-mono text-xs tracking-widest text-muted-foreground uppercase hidden md:block"
          >
            The operating layer
          </motion.p>

          {/* Main headline — scales and sharpens into view with GPU acceleration */}
          <motion.h2
            style={{
              scale: prefersReduced ? 1 : scale,
              opacity: prefersReduced ? 1 : headlineOpacity,
              willChange: "transform, opacity",
            }}
            className="transform-gpu text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            UNIFIÉE eliminates the chaos.
          </motion.h2>
        </div>
      </div>
    </div>
  );
}
