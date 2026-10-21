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
    <div className="flex min-h-[360px] bg-background text-left sm:min-h-[400px] lg:min-h-[420px]">
      <aside className="hidden w-48 shrink-0 border-r border-border/50 bg-sidebar p-3 md:block">
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

      <div className="min-w-0 flex-1 space-y-3 p-3 sm:space-y-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div>
            <p className="font-heading text-sm font-semibold tracking-tight sm:text-lg">
              Good afternoon, Bluebird Café
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground sm:text-[11px]">
              2 items are waiting for your review.
            </p>
          </div>
          <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-2 text-[9px] font-medium text-white sm:h-8 sm:rounded-xl sm:px-3 sm:text-[11px]">
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">New requirement</span>
            <span className="sm:hidden">New</span>
          </span>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-linear-to-br from-amber-500/[0.08] via-amber-500/[0.03] to-transparent px-2.5 py-2 sm:px-3 sm:py-2.5">
          <p className="mb-1.5 text-[10px] font-semibold sm:mb-2 sm:text-[11px]">Needs your review</p>
          <div className="flex items-center justify-between gap-2 border-t border-border/40 py-1.5 text-[9px] sm:text-[11px]">
            <span className="flex min-w-0 items-center gap-1.5 font-medium sm:gap-2">
              <Tag className="size-3.5 text-amber-500" />
              <span className="truncate">3 offers received for Pizza box 12 in</span>
            </span>
            <span className="shrink-0 rounded-md border border-amber-500/40 px-1.5 py-0.5 text-[9px] text-amber-500 sm:px-2 sm:text-[10px]">
              Review
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border/40 py-1.5 text-[9px] sm:text-[11px]">
            <span className="flex min-w-0 items-center gap-1.5 font-medium sm:gap-2">
              <Palette className="size-3.5 text-amber-500" />
              <span className="truncate">Artwork proof ready for Paper cups 8 oz</span>
            </span>
            <span className="shrink-0 rounded-md border border-amber-500/40 px-1.5 py-0.5 text-[9px] text-amber-500 sm:px-2 sm:text-[10px]">
              Review
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Open requirements", "2"],
            ["Offers to review", "3"],
            ["Orders in progress", "2"],
            ["Ordered this month", "₹48,200"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border/60 bg-card/50 p-2.5 sm:p-3">
              <p className="truncate text-[9px] text-muted-foreground sm:text-[10px]">{label}</p>
              <p className="mt-0.5 text-base font-semibold tracking-tight sm:mt-1 sm:text-lg">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid min-w-0 gap-3 lg:grid-cols-3">
          <div className="min-w-0 rounded-xl border border-border/60 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-border/40 px-3 py-2.5">
              <p className="text-xs font-semibold">Active orders</p>
              <p className="text-[10px] text-blue-500">Review all orders</p>
            </div>
            <div className="divide-y divide-border/40 px-3">
              {[
                ["Paper cups 8 oz", "GreenCup Solutions", "In Production", 4],
                ["Pizza box 12 in", "Kraft & Co.", "Shipped", 5],
              ].map(([title, vendor, status, filled]) => (
                <div key={title} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-2.5 sm:grid-cols-[minmax(0,1.2fr)_minmax(56px,2fr)_auto]">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{title}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{vendor}</p>
                  </div>
                  <p className="text-right text-[9px] font-medium whitespace-nowrap sm:order-3 sm:text-[10px]">{status}</p>
                  <div className="col-span-2 flex gap-1 sm:col-span-1 sm:order-2">
                    {stages.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 flex-1 rounded-full ${i < Number(filled) ? "bg-blue-600" : "bg-muted"}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden space-y-2 lg:block">
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
    <div className="min-h-[340px] space-y-3 bg-background p-3 text-left sm:min-h-[380px] sm:space-y-4 sm:p-5">
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-br from-primary/10 via-background to-primary/5 p-3 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary sm:text-[10px]">
            <ShieldCheck className="size-3" />
            Verified partner
          </span>
          <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground sm:text-[10px]">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            Escrow enabled
          </span>
        </div>
        <p className="font-heading mt-2 text-base font-semibold tracking-tight sm:text-xl">
          Good afternoon, GreenCup Solutions
        </p>
        <p className="mt-1 max-w-lg text-[10px] text-muted-foreground sm:text-[11px]">
          Manage offerings, review buyer orders, and track escrow in one place.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {[
          ["Total Revenue", "₹2,40,000", IndianRupee, "Across 18 orders"],
          ["In Escrow", "₹36,400", Shield, "Released on delivery"],
          ["Settled & Paid", "₹2,03,600", ShieldCheck, "Completed to bank"],
          ["Active Orders", "4", Truck, "In production or dispatched"],
        ].map(([label, value, Icon, detail]) => {
          const MetricIcon = Icon as typeof IndianRupee;
          return (
            <div key={String(label)} className="min-w-0 rounded-xl border border-border/60 bg-card/50 p-2 sm:p-3">
              <div className="flex items-center justify-between gap-1">
                <p className="truncate text-[7px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[9px]">
                  {label as string}
                </p>
                <span className="hidden size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
                  <MetricIcon className="size-3.5" />
                </span>
              </div>
              <p className="mt-1 truncate text-[11px] font-semibold tracking-tight sm:mt-2 sm:text-lg">{value as string}</p>
              <p className="mt-1 hidden truncate text-[10px] text-muted-foreground sm:block">{detail as string}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-3 2xl:grid-cols-2">
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
    <div className="min-h-[340px] space-y-3 bg-background p-3 text-left sm:min-h-[380px] sm:space-y-4 sm:p-5">
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
            <div key={title} className="group overflow-hidden rounded-xl border bg-card">
              <div className="relative flex h-20 items-center justify-center overflow-hidden bg-linear-to-br from-amber-100 via-orange-50 to-stone-200 dark:from-amber-950/50 dark:via-stone-900 dark:to-stone-800">
                <div className="absolute -left-5 -top-8 size-24 rounded-full bg-white/30 blur-2xl" />
                <div className="absolute -right-3 -bottom-10 size-24 rounded-full bg-orange-400/20 blur-2xl" />
                <div className="relative mt-1 flex h-14 w-10 flex-col items-center drop-shadow-md transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-105">
                  <div className="h-2 w-10 rounded-t-md bg-stone-200 dark:bg-stone-600" />
                  <div className="relative flex w-9 flex-1 items-center justify-center rounded-b-md bg-[#f7f2e8] text-[7px] font-semibold tracking-[0.12em] text-stone-800">
                    <span className="absolute inset-x-0 top-3 h-1 bg-emerald-700/80" />
                    <span className="relative mt-1">ROAST</span>
                  </div>
                </div>
              </div>
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
