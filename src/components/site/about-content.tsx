"use client";

import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Check,
  CircleDot,
  Layers3,
  Network,
  PackageCheck,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, type Variants } from "motion/react";

const comparisonRows = [
  {
    metric: "Requirements",
    legacy: "Technical details are pieced together through manual conversations.",
    platform: "Guided briefs turn a business need into a clear specification.",
  },
  {
    metric: "Supplier discovery",
    legacy: "Businesses search and compare vendors across scattered channels.",
    platform: "Relevant partners can be explored around practical criteria.",
  },
  {
    metric: "Order coordination",
    legacy: "Quotes, approvals, and updates live in separate places.",
    platform: "A connected workflow brings each step into view.",
  },
  {
    metric: "Brand evolution",
    legacy: "Every seasonal update can become a new creative project.",
    platform: "Adaptable layers build on a consistent core identity.",
  },
];

const flywheel = [
  {
    step: "01",
    label: "Understand the need",
    detail: "Capture the product, quantity, budget, and packaging goals behind a request.",
    icon: Sparkles,
  },
  {
    step: "02",
    label: "Structure the brief",
    detail: "Make material, format, and production requirements easier to communicate.",
    icon: Layers3,
  },
  {
    step: "03",
    label: "Connect the ecosystem",
    detail: "Bring businesses and relevant supply-side partners into a shared workflow.",
    icon: Network,
  },
  {
    step: "04",
    label: "Move toward delivery",
    detail: "Keep offers, approvals, and order progress connected as work moves forward.",
    icon: PackageCheck,
  },
];

const motionEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
const revealVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: motionEase },
  },
};
const staggerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.06 } },
};

export function AboutContent() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden px-6 pb-20 pt-44 md:pb-28 md:pt-52">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035] dark:opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, var(--color-foreground) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={staggerVariants}
            className="grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20"
          >
            <motion.div variants={revealVariants}>
              <p className="mb-5 font-mono text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                About UNIFIÉE
              </p>
              <h1 className="max-w-3xl text-4xl leading-[1.06] font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Physical operations deserve software-grade infrastructure.
              </h1>
            </motion.div>
            <motion.div variants={revealVariants} className="space-y-4 pb-1">
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                For growing F&amp;B businesses, packaging touches many moving
                parts: requirements, design, supplier discovery, production, and
                delivery. Today, those steps can be difficult to coordinate
                across disconnected people and channels.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                UNIFIÉE is being built to bring that work into one clearer
                system—helping businesses turn an idea into a practical brief,
                connect with relevant partners, and follow the process forward.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, delay: 0.12, ease: motionEase }}
            className="mt-14 md:mt-20"
          >
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/50 p-6 shadow-[0_30px_90px_-55px_rgba(0,0,0,0.65)] backdrop-blur-sm sm:p-10">
              <div className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
                    One connected workflow
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                    From a need to a delivered package.
                  </h2>
                </div>
                <div className="flex size-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                  <Boxes className="size-5" />
                </div>
              </div>
              <div className="relative mt-8 grid gap-3 sm:grid-cols-4">
                {flywheel.map((item, index) => (
                  <div key={item.step} className="relative rounded-2xl border border-border/70 bg-background/65 p-4">
                    <div className="flex items-center justify-between">
                      <item.icon className="size-4 text-primary" />
                      <span className="font-mono text-[10px] text-muted-foreground">{item.step}</span>
                    </div>
                    <p className="mt-5 text-sm font-medium">{item.label}</p>
                    {index < flywheel.length - 1 && (
                      <div className="absolute -right-2.5 top-1/2 z-10 hidden size-5 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground sm:flex">
                        <ArrowRight className="size-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-t border-border/70 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={revealVariants}
            className="mb-10 max-w-2xl"
          >
            <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              A clearer way to work
            </p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Less fragmentation. More connected decisions.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              UNIFIÉE is designed as an operating layer for packaging workflows—not a
              standalone design service or another supplier list.
            </p>
          </motion.div>

          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/40">
            <div className="hidden grid-cols-[0.72fr_1fr_1fr] border-b border-border/70 bg-muted/35 sm:grid">
              <p className="p-5 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Workflow</p>
              <p className="border-l border-border/70 p-5 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Disconnected approach</p>
              <p className="border-l border-border/70 p-5 font-mono text-[10px] tracking-widest text-primary uppercase">With UNIFIÉE</p>
            </div>
            {comparisonRows.map((row, index) => (
              <motion.div
                key={row.metric}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={revealVariants}
                whileHover={{ backgroundColor: "var(--color-muted)" }}
                className={cn(
                  "grid gap-4 border-b border-border/60 p-5 last:border-b-0 sm:grid-cols-[0.72fr_1fr_1fr] sm:gap-0 sm:p-0",
                  index % 2 === 1 && "bg-muted/15",
                )}
              >
                <div className="flex items-center gap-2 sm:p-5">
                  <CircleDot className="size-3.5 shrink-0 text-primary" />
                  <p className="text-sm font-medium">{row.metric}</p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground sm:border-l sm:border-border/70 sm:p-5">
                  <span className="mb-1 block font-mono text-[9px] tracking-widest uppercase sm:hidden">Disconnected</span>
                  {row.legacy}
                </p>
                <p className="text-sm leading-relaxed text-foreground sm:border-l sm:border-border/70 sm:p-5">
                  <span className="mb-1 flex items-center gap-1 font-mono text-[9px] tracking-widest text-primary uppercase sm:hidden">
                    <Check className="size-3" /> UNIFIÉE
                  </span>
                  {row.platform}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border/70 py-20 md:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,color-mix(in_oklch,var(--primary)_11%,transparent),transparent_65%)]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={revealVariants}
            className="mb-10 max-w-2xl"
          >
            <p className="mb-3 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              The workflow
            </p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Designed to connect every step.
            </h2>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerVariants}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            {flywheel.map((item) => (
              <motion.div
                key={item.step}
                variants={revealVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="rounded-2xl border border-border/70 bg-card/60 p-6 transition-colors hover:border-primary/30"
              >
                <div className="flex items-center justify-between">
                  <item.icon className="size-4 text-primary" />
                  <span className="font-mono text-[10px] tracking-widest text-muted-foreground">{item.step}</span>
                </div>
                <h3 className="mt-7 text-base font-semibold tracking-tight">{item.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="px-6 py-20 md:py-28">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, ease: motionEase }}
          className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-border/70 bg-card/50 p-8 md:p-12"
        >
          <div className="pointer-events-none absolute -right-16 -top-32 size-80 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="mb-4 font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Build with us</p>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Help shape a more connected packaging workflow.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                We&apos;re building alongside the F&amp;B businesses and supply-side partners who work through these challenges every day.
              </p>
            </div>
            <Link href="/contact" className={cn(buttonVariants({ size: "lg" }), "shrink-0 gap-2 rounded-full")}>
              Talk to us
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
