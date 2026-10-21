import { CheckCircle2 } from "lucide-react";
import { FadeIn } from "@/components/site/animations";
import { ProductFrame } from "@/components/site/landing/product-frame";
import {
  BusinessDashboardPreview,
  DesignerStudioPreview,
  VendorDashboardPreview,
} from "@/components/site/landing/dashboard-previews";

const dashboardDetails = {
  business: [
    "AI intake to a structured spec",
    "Offer comparison in one queue",
    "Order tracking from confirmed to delivered",
  ],
  vendor: [
    "Live offerings with MOQ and lead time",
    "Incoming orders with buyer context",
    "Escrow visibility through delivery",
  ],
  designer: [
    "Service catalog with print-ready samples",
    "Availability and specialization on profile",
    "Optional layer — procurement still works without it",
  ],
};

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

export function DashboardsSection() {
  return (
    <section className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-7xl space-y-20 px-4 sm:space-y-24 sm:px-6 lg:space-y-28">
        <FadeIn className="max-w-2xl">
          <p className="mb-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Three operating surfaces
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Built for every side of the packaging workflow.
          </h2>
        </FadeIn>

        <div className="grid min-w-0 items-center gap-8 sm:gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
          <FadeIn>
            <p className="mb-3 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">01 — Business</p>
            <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">The business dashboard</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Brands submit a requirement, review matched offers, approve artwork, and watch production move through a single status trail — without assembling the workflow themselves.
            </p>
            <DashboardPoints items={dashboardDetails.business} />
          </FadeIn>
          <FadeIn delay={0.1}>
            <ProductFrame url="app.unifiee.com/business">
              <div className="max-h-[400px] overflow-hidden sm:max-h-[400px] lg:max-h-[430px]">
                <BusinessDashboardPreview />
              </div>
            </ProductFrame>
          </FadeIn>
        </div>

        <div className="grid min-w-0 items-center gap-8 sm:gap-10 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] lg:gap-14">
          <FadeIn className="order-2 lg:order-1" delay={0.1}>
            <ProductFrame url="app.unifiee.com/manufacturer">
              <div className="max-h-[400px] overflow-hidden sm:max-h-[400px] lg:max-h-[430px]">
                <VendorDashboardPreview />
              </div>
            </ProductFrame>
          </FadeIn>
          <FadeIn className="order-1 lg:order-2">
            <p className="mb-3 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">02 — Vendor</p>
            <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">The vendor dashboard</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Manufacturers publish a catalog, receive qualified demand, and settle through escrow — instead of waiting on informal, scattered inbound orders.
            </p>
            <DashboardPoints items={dashboardDetails.vendor} />
          </FadeIn>
        </div>

        <div className="grid min-w-0 items-center gap-8 sm:gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
          <FadeIn>
            <p className="mb-3 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">03 — Designer</p>
            <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">The designer studio</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Design is a module inside the platform, not the identity of it. Studios list packaging services, keep availability current, and attach production-aware work samples for brands that need craft — not another logo generator.
            </p>
            <DashboardPoints items={dashboardDetails.designer} />
          </FadeIn>
          <FadeIn delay={0.1}>
            <ProductFrame url="app.unifiee.com/designer">
              <div className="max-h-[400px] overflow-hidden sm:max-h-[400px] lg:max-h-[430px]">
                <DesignerStudioPreview />
              </div>
            </ProductFrame>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
