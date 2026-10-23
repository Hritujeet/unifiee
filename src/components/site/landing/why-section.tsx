"use client";

import { Quote } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const whyCards = [
  {
    title: "Turn an idea into a clear requirement.",
    body: "Get help thinking through packaging formats, materials, and trade-offs, then shape the brief into something a supplier can respond to.",
  },
  {
    title: "Find partners by what matters to you.",
    body: "Explore supplier options around practical criteria like MOQ, lead time, location, and price tier — not just a name in a contact list.",
  },
  {
    title: "Keep the order moving in one place.",
    body: "Bring requirements, offers, approvals, and order progress into a clearer workflow from the first brief through delivery.",
  },
  {
    title: "Adapt packaging without losing your identity.",
    body: "Build seasonal and promotional variations around a consistent core brand, rather than treating every new moment like a full redesign.",
  },
];

const conversationPrompts = [
  ["Packaging decisions", "What do you need to know before choosing a format or material?"],
  ["Finding suppliers", "Which details make it difficult to compare one supplier with another?"],
  ["Managing orders", "Where does coordination take the most time once an order is underway?"],
];

/**
 * Fragmentation-to-clarity animation.
 *
 * Each card starts at a subtle scattered offset (x, y, rotation, blur)
 * and smoothly converges to its natural position as the grid enters the viewport.
 * Uses GPU-accelerated transforms and restrained offsets to prevent overflow and jitter.
 */
const scatterOffsets = [
  { x: -14, y: -8, rotate: -1.5 },
  { x: 12, y: -12, rotate: 1 },
  { x: -10, y: 10, rotate: 1.2 },
  { x: 14, y: 8, rotate: -1 },
];

function ScatterCard({
  card,
  index,
}: {
  card: (typeof whyCards)[number];
  index: number;
}) {
  const prefersReduced = useReducedMotion();
  const offset = scatterOffsets[index];

  return (
    <motion.div
      initial={
        prefersReduced
          ? false
          : {
              opacity: 0,
              x: offset.x,
              y: offset.y,
              rotate: offset.rotate,
              scale: 0.98,
            }
      }
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
      }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{
        duration: 0.55,
        delay: index * 0.07,
        ease: [0.22, 1, 0.36, 1] as const,
      }}
      className="transform-gpu rounded-2xl border border-border/70 bg-card/50 p-6 transition-all duration-300 hover:-translate-y-1 dark:hover:border-blue-400/30 hover:border-primary/30 hover:bg-card/80 sm:p-7"
    >
      <p className="font-mono text-[10px] tracking-[0.18em] text-primary dark:text-blue-400 uppercase">
        {String(index + 1).padStart(2, "0")}
      </p>
      <h3 className="mt-6 text-lg font-semibold tracking-tight text-foreground">{card.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
    </motion.div>
  );
}

const connectorVariants = {
  hidden: { opacity: 0, scaleX: 0 },
  show: {
    opacity: 1,
    scaleX: 1,
    transition: { duration: 0.55, delay: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const platformCardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, delay: 0.42, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function WhyUnifieeSection() {
  return (
    <section className="border-t border-border py-24 md:py-32 overflow-x-clip">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          className="mb-12 max-w-2xl transform-gpu"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <p className="mb-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">Why UNIFIÉE</p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            The path from requirement to production is unnecessarily complicated.
          </h2>
        </motion.div>

        {/* Scatter-to-order grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whyCards.map((card, index) => (
            <ScatterCard key={card.title} card={card} index={index} />
          ))}

          {/* Full-width connector — animates in after cards settle, conveying "unified" */}
          <motion.div
            variants={connectorVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-5% 0px" }}
            className="col-span-full my-1 flex items-center gap-3 px-1"
            style={{ originX: 0 }}
          >
            <div className="h-px flex-1 bg-border/50" />
            <span className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase opacity-60">
              connected
            </span>
            <div className="h-px flex-1 bg-border/50" />
          </motion.div>

          {/* Platform card */}
          <motion.div
            variants={platformCardVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-5% 0px" }}
            className="transform-gpu rounded-2xl border border-border/70 bg-card/50 p-7 sm:col-span-2 lg:col-span-4 lg:grid lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-12"
          >
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              One connected platform, not another isolated service.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground lg:mt-0">
              Bring decisions, design, sourcing, and order coordination into one workflow. Use the parts that help your business, and keep the process connected as your needs change.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function EarlyFeedbackSection() {
  return (
    <section className="py-24 md:py-32 overflow-x-clip">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12">
          <p className="mb-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">
            In conversation
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Built around the realities of running an F&amp;B business.
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            We&apos;re speaking with early F&amp;B teams now. This space is reserved for their feedback, shared with permission—not invented testimonials.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {conversationPrompts.map(([topic, question]) => (
            <div
              key={topic}
              className="flex min-h-52 flex-col justify-between rounded-2xl border border-border/70 bg-card/40 p-7 transition-all duration-300 hover:-translate-y-1 dark:hover:border-blue-400/30 hover:border-primary/30 hover:bg-card/80"
            >
              <Quote className="size-5 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium leading-relaxed text-foreground">{question}</p>
                <p className="mt-4 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">{topic}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
