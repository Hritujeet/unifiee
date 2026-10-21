import {
  ArrowRight,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Package,
  PackageCheck,
  Palette,
  Plus,
  Shield,
  ShieldCheck,
  Tag,
  Tags,
  Truck,
} from "lucide-react";

const stages = [true, true, true, true, false, false];

export function BusinessDashboardPreview() {
  return (
    <div className="flex min-h-[420px] bg-background text-left">
      <aside className="hidden w-48 shrink-0 border-r border-border/50 bg-sidebar p-3 sm:block">
        <div className="mb-5 flex items-center gap-2 px-1">
          <div className="flex size-6 items-center justify-center rounded-md bg-blue-600 text-[11px] font-bold text-white">
            U
          </div>
          <div className="leading-tight">
            <p className="text-[11px] font-semibold">Unifiée</p>
            <p className="text-[9px] text-muted-foreground">Business</p>
          </div>
        </div>
        <nav className="space-y-0.5 text-[11px]">
          <PreviewNav active icon={LayoutDashboard} label="Dashboard" />
          <p className="px-2 pt-3 pb-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
            Procure
          </p>
          <PreviewNav icon={FileText} label="Requirements" />
          <PreviewNav icon={Tag} label="Offers" />
          <PreviewNav icon={Package} label="Orders" />
          <p className="px-2 pt-3 pb-1 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
            Explore
          </p>
          <PreviewNav icon={Building2} label="Vendors" />
          <PreviewNav icon={Palette} label="Designers" />
          <PreviewNav icon={Briefcase} label="Hired services" />
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-heading text-base font-semibold tracking-tight sm:text-lg">
              Good afternoon, Bluebird Café
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              2 items are waiting for your review.
            </p>
          </div>
          <span className="inline-flex h-8 items-center gap-1 rounded-xl bg-blue-600 px-3 text-[11px] font-medium text-white">
            <Plus className="size-3.5" />
            New requirement
          </span>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2.5">
          <p className="mb-2 text-[11px] font-semibold">Needs your review</p>
          <div className="flex items-center justify-between gap-2 border-t border-border/40 py-1.5 text-[11px]">
            <span className="flex items-center gap-2 font-medium">
              <Tag className="size-3.5 text-amber-500" />
              3 offers received for Pizza box 12 in
            </span>
            <span className="rounded-md border border-amber-500/40 px-2 py-0.5 text-amber-500">
              Review offers
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border/40 py-1.5 text-[11px]">
            <span className="flex items-center gap-2 font-medium">
              <Palette className="size-3.5 text-amber-500" />
              Artwork proof ready for Paper cups 8 oz
            </span>
            <span className="rounded-md border border-amber-500/40 px-2 py-0.5 text-amber-500">
              Review proof
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            ["Open requirements", "2"],
            ["Offers to review", "3"],
            ["Orders in progress", "2"],
            ["Ordered this month", "₹48,200"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border/60 p-3">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="mt-1 text-lg font-semibold tracking-tight">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-border/60 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border/40 px-3 py-2.5">
              <p className="text-xs font-semibold">Active orders</p>
              <p className="text-[10px] text-blue-500">Review all orders</p>
            </div>
            <div className="divide-y divide-border/40 px-3">
              {[
                ["Paper cups 8 oz", "GreenCup Solutions", "In Production", 4],
                ["Pizza box 12 in", "Kraft & Co.", "Shipped", 5],
              ].map(([title, vendor, status, filled]) => (
                <div key={title} className="grid grid-cols-[1.2fr_2fr_auto] items-center gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{title}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{vendor}</p>
                  </div>
                  <div className="flex gap-1">
                    {stages.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${i < Number(filled) ? "bg-blue-600" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-medium whitespace-nowrap">{status}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs font-semibold">Start with AI intake</p>
              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                Describe what you need. We turn it into a requirement and match vendors.
              </p>
              <span className="mt-2 flex h-8 items-center justify-center rounded-lg border text-[10px] font-medium">
                Describe your packaging
              </span>
            </div>
            <div className="rounded-xl border border-border/60 p-3">
              <p className="text-xs font-semibold">Explore</p>
              <div className="mt-2 space-y-1.5 text-[10px] text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Building2 className="size-3" /> Explore vendors
                </p>
                <p className="flex items-center gap-2">
                  <Palette className="size-3" /> Explore designers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VendorDashboardPreview() {
  return (
    <div className="min-h-[380px] space-y-4 bg-background p-4 text-left sm:p-5">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 via-background to-primary/5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            <ShieldCheck className="size-3" />
            Verified Packaging Partner
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Instant Escrow Settlement Enabled
          </span>
        </div>
        <p className="font-heading mt-2 text-xl font-semibold tracking-tight">
          Good afternoon, GreenCup Solutions
        </p>
        <p className="mt-1 max-w-lg text-[11px] text-muted-foreground">
          Manage offerings, review buyer orders, and track escrow on the UNIFIÉE supply network.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {[
          ["Total Revenue", "₹2,40,000", IndianRupee, "Across 18 orders"],
          ["In Escrow", "₹36,400", Shield, "Released on delivery"],
          ["Settled & Paid", "₹2,03,600", ShieldCheck, "Completed to bank"],
          ["Active Orders", "4", Truck, "In production or dispatched"],
        ].map(([label, value, Icon, detail]) => {
          const MetricIcon = Icon as typeof IndianRupee;
          return (
            <div key={String(label)} className="rounded-xl border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {label as string}
                </p>
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MetricIcon className="size-3.5" />
                </span>
              </div>
              <p className="mt-2 text-lg font-semibold tracking-tight">{value as string}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{detail as string}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60">
          <div className="border-b border-border/40 px-3 py-2.5">
            <p className="text-xs font-semibold">Recent Customer Orders</p>
          </div>
          <div className="space-y-2 p-3">
            {[
              ["UNI-1842", "Bluebird Café", "processing", "₹12,400"],
              ["UNI-1837", "North Roast", "shipped", "₹8,900"],
            ].map(([id, buyer, status, total]) => (
              <div key={id} className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2.5">
                <div>
                  <p className="font-mono text-xs font-semibold">{id}</p>
                  <p className="text-[10px] text-muted-foreground">Buyer: {buyer}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold">{total}</p>
                  <p className="text-[9px] uppercase text-muted-foreground">{status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border/60">
          <div className="border-b border-border/40 px-3 py-2.5">
            <p className="text-xs font-semibold">Live Catalog</p>
          </div>
          <div className="space-y-2 p-3">
            {[
              ["PE-coated 8oz cups", "₹4.20 / unit", "MOQ 5,000"],
              ["12-in kraft pizza box", "₹11.50 / unit", "MOQ 2,000"],
            ].map(([title, price, moq]) => (
              <div key={title} className="rounded-xl border border-border/70 px-3 py-2.5">
                <p className="text-xs font-semibold">{title}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {price} · {moq}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DesignerStudioPreview() {
  return (
    <div className="min-h-[380px] space-y-4 bg-background p-4 text-left sm:p-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Your creative workspace
        </p>
        <p className="font-heading mt-1 text-xl font-semibold tracking-tight">
          Good to have you here, Ananya.
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Keep your packaging services clear, useful, and easy for brands to browse.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-primary px-5 py-5 text-primary-foreground">
        <div className="pointer-events-none absolute -right-8 -top-16 size-40 rounded-full border border-primary-foreground/10" />
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full border-2 border-primary-foreground/20 bg-primary-foreground/15 text-sm font-semibold">
            AS
          </span>
          <div>
            <p className="text-[10px] font-semibold">Available for work · Verified designer</p>
            <p className="font-heading text-sm font-semibold">
              Dieline-accurate packaging for QSR and café brands.
            </p>
            <p className="text-[11px] text-primary-foreground/70">Jaipur · 6 years of experience</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {[
          ["Specialties", "5", BriefcaseBusiness],
          ["Services listed", "4", Tags],
          ["Availability", "Open", PackageCheck],
          ["Earnings", "₹86,000", CircleDollarSign],
        ].map(([label, value, Icon]) => {
          const StatIcon = Icon as typeof Tags;
          return (
            <div key={String(label)} className="rounded-xl border bg-card p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">{label as string}</p>
                  <p className="font-heading mt-1 text-xl font-semibold">{value as string}</p>
                </div>
                <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <StatIcon className="size-4" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <p className="text-xs font-semibold">Your service offerings</p>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {[
            ["Paper cup identity system", "₹18,000 / project"],
            ["Seasonal sleeve variants", "₹9,500 / set"],
          ].map(([title, price]) => (
            <div key={title} className="overflow-hidden rounded-xl border bg-card">
              <div className="h-16 bg-linear-to-br from-muted to-muted/40" />
              <div className="flex items-center justify-between p-3">
                <div>
                  <p className="text-[10px] text-muted-foreground">Paper cups</p>
                  <p className="text-xs font-semibold">{title}</p>
                  <p className="mt-0.5 text-[11px]">{price}</p>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewNav({
  icon: Icon,
  label,
  active = false,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
        active ? "bg-muted text-foreground" : "text-muted-foreground"
      }`}
    >
      <Icon className="size-3.5" />
      {label}
    </div>
  );
}
