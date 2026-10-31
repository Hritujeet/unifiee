"use client";

import { CheckCircle2 } from "lucide-react";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { ProductFrame } from "@/components/site/landing/product-frame";
import {
  BusinessDashboardPreview,
  DesignerStudioPreview,
  VendorDashboardPreview,
} from "@/components/site/landing/dashboard-previews";

const dashboards = [
  {
    index: "01",
    role: "Business",
    url: "app.unifiee.com/business",
    heading: "The business dashboard",
    description:
      "Brands define their packaging requirement through an AI-guided intake, review structured supplier offers side-by-side, approve print-ready artwork, and track the order from confirmation through delivery — all without assembling or managing the workflow manually.",
    features: [
      "AI-guided intake converts your brief into a supplier-ready spec",
      "Offer comparison queue with MOQ, lead time, and unit cost",
      "Artwork approval flow with version history",
      "Order status trail from confirmed to delivered",
    ],
    meta: "Designed for F&B brand teams and packaging buyers",
    Preview: BusinessDashboardPreview,
  },
  {
    index: "02",
    role: "Vendor",
    url: "app.unifiee.com/manufacturer",
    heading: "The vendor dashboard",
    description:
      "Manufacturers publish a live product catalog with capacity, MOQ, and lead time. Qualified briefs arrive directly in the offer queue. Accepted orders settle directly, giving vendors a predictable, structured demand channel instead of fragmented inbound inquiries.",
    features: [
      "Catalog management with capacity and lead-time controls",
      "Offer queue with full buyer brief context",
      "Direct payment visibility through delivery",
      "Order fulfillment status and buyer communication",
    ],
    meta: "Designed for packaging manufacturers and converters",
    Preview: VendorDashboardPreview,
  },
  {
    index: "03",
    role: "Designer",
    url: "app.unifiee.com/designer",
    heading: "The designer studio",
    description:
      "Design studios maintain a service catalog with print-ready work samples and production capabilities. Brands that need structured design attach a studio to their procurement workflow. Design is a module inside the platform — packaging procurement functions fully without it.",
    features: [
      "Service catalog with production-aware work samples",
      "Availability and specialization signals on profile",
      "Studio attached to order workflow, not a separate engagement",
      "Procurement still works without design — it is fully optional",
    ],
    meta: "Designed for packaging design studios and independent designers",
    Preview: DesignerStudioPreview,
  },
];

function DashboardPoints({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground sm:mt-6">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * A single stacking dashboard card with scroll-linked parallax.
 * - On desktop (lg+), cards stick and stack with progressive scaling and dimming.
 * - The preview and text within each card translate at differential rates for real parallax depth.
 * - All transforms are GPU-accelerated and avoid heavy blur filters during scroll scrubbing.
 */
function DashboardCard({
  db,
  cardIndex,
  totalCards,
}: {
  db: (typeof dashboards)[number];
  cardIndex: number;
  totalCards: number;
}) {
  const prefersReduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  // Entrance fade
  const entranceOpacity = useTransform(scrollYProgress, [0, 0.18], [0.35, 1]);

  // Parallax translation for the Product Preview column (pure translateY, zero re-layout)
  const previewY = useTransform(
    scrollYProgress,
    [0.1, 0.9],
    prefersReduced ? [0, 0] : [28, -28],
  );

  // Counter parallax for the text column
  const textY = useTransform(
    scrollYProgress,
    [0.1, 0.9],
    prefersReduced ? [0, 0] : [-10, 10],
  );

  // When subsequent cards stack over this card, subtly scale down and dim
  const isLastCard = cardIndex === totalCards - 1;
  const stackScale = useTransform(
    scrollYProgress,
    [0.6, 0.95],
    prefersReduced || isLastCard ? [1, 1] : [1, 0.96],
  );
  const stackOpacity = useTransform(
    scrollYProgress,
    [0.65, 0.95],
    prefersReduced || isLastCard ? [1, 1] : [1, 0.82],
  );

  const isEven = cardIndex % 2 === 0;
  // Cascading sticky top offsets so each stacked card head remains subtly layered
  const stickyTopOffsets = ["lg:top-24", "lg:top-28", "lg:top-32"];
  const topClass = stickyTopOffsets[cardIndex] || "lg:top-24";

  return (
    <div
      ref={cardRef}
      className={`relative lg:sticky ${topClass} mb-16 lg:mb-28`}
      style={{ zIndex: cardIndex + 10 }}
    >
      <motion.div
        style={{
          opacity: prefersReduced ? 1 : isLastCard ? entranceOpacity : stackOpacity,
          scale: prefersReduced ? 1 : stackScale,
          willChange: "transform, opacity",
        }}
        className="transform-gpu relative rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8 lg:p-10"
      >


        {/* Card header badge */}
        <div className="relative mb-6 flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-semibold tracking-[0.2em] text-primary">
              {db.index}
            </span>
            <span className="h-3 w-px bg-border" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
              {db.role} Layer
            </span>
          </div>
          <span className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 font-mono text-[9px] text-muted-foreground">
            {db.meta}
          </span>
        </div>

        <div
          className={`relative grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12 ${isEven ? "" : "lg:grid-flow-dense"
            }`}
        >
          {/* Text column with counter-parallax */}
          <motion.div
            style={{ y: prefersReduced ? 0 : textY, willChange: "transform" }}
            className="transform-gpu"
          >
            <h3 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {db.heading}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {db.description}
            </p>
            <DashboardPoints items={db.features} />
          </motion.div>

          {/* Product Preview column with smooth GPU translateY parallax glide */}
          <motion.div
            style={{
              y: prefersReduced ? 0 : previewY,
              willChange: "transform",
            }}
            className={`transform-gpu ${isEven ? "" : "lg:col-start-1 lg:row-start-1"}`}
          >
            <ProductFrame url={db.url}>
              <div className="max-h-[340px] overflow-hidden sm:max-h-[380px] lg:max-h-[400px]">
                <db.Preview />
              </div>
            </ProductFrame>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export function DashboardsSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="border-t border-border py-24 md:py-32 overflow-x-clip">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section heading */}
        <motion.div
          initial={prefersReduced ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
          className="transform-gpu mb-16 max-w-2xl"
        >
          <p className="mb-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Three operating surfaces
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Built for every side of the packaging workflow.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Each participant in the packaging chain — brand, manufacturer, designer — has a dedicated surface tuned to their workflow. Every surface is connected; none of them requires the others to function.
          </p>
        </motion.div>

        {/* Stacking dashboard cards with parallax */}
        <div className="relative flex flex-col">
          {dashboards.map((db, i) => (
            <DashboardCard
              key={db.index}
              db={db}
              cardIndex={i}
              totalCards={dashboards.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
