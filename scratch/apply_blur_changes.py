import re

def update_designer_components():
    path = 'src/components/designer/dashboard-components.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    old_statcard = """export function StatCard({
    label,
    value,
    detail,
    icon: Icon,
    tone = "primary",
}: {
    label: string
    value: string
    detail: string
    icon: LucideIcon
    tone?: "primary" | "secondary" | "accent"
}) {
    const tones = {
        primary: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
    }

    return (
        <article className="rounded-xl border bg-card p-5 text-card-foreground">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">{value}</p>
                </div>
                <span className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="size-5" /></span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
        </article>
    )
}"""

    new_statcard = """export function StatCard({
    label,
    value,
    detail,
    icon: Icon,
    tone = "primary",
    comingSoon = false,
}: {
    label: string
    value: string
    detail: string
    icon: LucideIcon
    tone?: "primary" | "secondary" | "accent"
    comingSoon?: boolean
}) {
    const tones = {
        primary: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        accent: "bg-accent text-accent-foreground",
    }

    return (
        <article className="relative overflow-hidden rounded-xl border bg-card p-5 text-card-foreground">
            <div className={comingSoon ? "blur-[2.5px] select-none pointer-events-none opacity-50" : undefined}>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                        <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">{value}</p>
                    </div>
                    <span className={`flex size-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="size-5" /></span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{detail}</p>
            </div>
            {comingSoon && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px]">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-xs">
                        <Sparkles className="size-3 text-amber-500" />
                        Coming Soon
                    </span>
                </div>
            )}
        </article>
    )
}"""

    old_norm = old_statcard.replace('\r\n', '\n')
    text_norm = text.replace('\r\n', '\n')
    assert old_norm in text_norm, "Old StatCard not found in dashboard-components.tsx"
    text_norm = text_norm.replace(old_norm, new_statcard.replace('\r\n', '\n'))
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text_norm)
    print("Updated src/components/designer/dashboard-components.tsx")

def update_designer_page():
    path = 'src/app/designer/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    old_card = """                <StatCard
                    label="Completed order value"
                    value={`₹${totalCompletedValue.toLocaleString("en-IN")}`}
                    detail="Total value of finished client contracts"
                    icon={CircleDollarSign}
                />"""

    new_card = """                <StatCard
                    label="Completed order value"
                    value={`₹${totalCompletedValue.toLocaleString("en-IN")}`}
                    detail="Total value of finished client contracts"
                    icon={CircleDollarSign}
                    comingSoon
                />"""

    old_norm = old_card.replace('\r\n', '\n')
    text_norm = text.replace('\r\n', '\n')
    assert old_norm in text_norm, "Completed order value StatCard not found in src/app/designer/page.tsx"
    text_norm = text_norm.replace(old_norm, new_card.replace('\r\n', '\n'))
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text_norm)
    print("Updated src/app/designer/page.tsx")

def update_business_dashboard():
    path = 'src/components/business/dashboard-view.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    text_norm = text.replace('\r\n', '\n')

    # Add Sparkles to lucide-react imports if not present
    if 'Sparkles,' not in text_norm and 'Sparkles }' not in text_norm:
        text_norm = text_norm.replace('    Plus,\n', '    Plus,\n    Sparkles,\n')

    old_card = """                <Card className="p-4 hover:border-border transition-all">
                    <Link href="/business/orders" className="block space-y-1">
                        <span className="text-xs text-muted-foreground font-normal">
                            Ordered this month
                        </span>
                        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            {formattedOrdered}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Settled offline: {formattedPaid}
                        </p>
                    </Link>
                </Card>"""

    new_card = """                <Card className="relative overflow-hidden p-4 hover:border-border transition-all">
                    <div className="blur-[2.5px] select-none pointer-events-none opacity-50 space-y-1">
                        <span className="text-xs text-muted-foreground font-normal">
                            Ordered this month
                        </span>
                        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            {formattedOrdered}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Settled offline: {formattedPaid}
                        </p>
                    </div>
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px]">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-xs">
                            <Sparkles className="size-3 text-amber-500" />
                            Coming Soon
                        </span>
                    </div>
                </Card>"""

    assert old_card in text_norm, "Old Ordered this month Card not found in dashboard-view.tsx"
    text_norm = text_norm.replace(old_card, new_card)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text_norm)
    print("Updated src/components/business/dashboard-view.tsx")

def update_manufacturer_dashboard():
    path = 'src/components/manufacturer/vendor-dashboard-view.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    text_norm = text.replace('\r\n', '\n')

    # Add Sparkles to lucide-react imports if not present
    if 'Sparkles,' not in text_norm and 'Sparkles }' not in text_norm:
        text_norm = text_norm.replace('    Boxes,\n', '    Boxes,\n    Sparkles,\n')

    old_commercial = """                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Gross Revenue */}
                    <Card className="border shadow-xs hover:border-primary/40 transition-all hover:shadow-sm group bg-card">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Total Revenue
                                </CardDescription>
                                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <IndianRupee className="size-4" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight text-foreground mt-2">
                                ₹{metrics.grossEarnings.toLocaleString("en-IN")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-1">
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                Across <strong>{metrics.totalOrders}</strong> total orders
                            </p>
                        </CardContent>
                    </Card>

                    {/* Payment status */}
                    <Card className="border shadow-xs hover:border-amber-500/40 transition-all hover:shadow-sm group bg-card">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Payment status
                                </CardDescription>
                                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                </div>
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight text-foreground mt-2">
                                Payments not connected yet
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-1">
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                Payment is arranged offline in this prototype
                            </p>
                        </CardContent>
                    </Card>

                    {/* Settled / Paid */}
                    <Card className="border shadow-xs hover:border-emerald-500/40 transition-all hover:shadow-sm group bg-card">
                        <CardHeader className="p-5 pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    Settled & Paid
                                </CardDescription>
                                <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                    <CheckCircle2 className="size-4" />
                                </div>
                            </div>
                            <CardTitle className="text-base font-semibold tracking-tight text-foreground mt-2">
                                Payments not connected yet
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-1">
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                Payment is arranged offline in this prototype
                            </p>
                        </CardContent>
                    </Card>

                    {/* Active Orders */}"""

    new_commercial = """                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Gross Revenue */}
                    <Card className="relative overflow-hidden border shadow-xs hover:border-primary/40 transition-all hover:shadow-sm group bg-card">
                        <div className="blur-[2.5px] select-none pointer-events-none opacity-50">
                            <CardHeader className="p-5 pb-2">
                                <div className="flex items-center justify-between">
                                    <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Total Revenue
                                    </CardDescription>
                                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <IndianRupee className="size-4" />
                                    </div>
                                </div>
                                <CardTitle className="text-2xl font-black tracking-tight text-foreground mt-2">
                                    ₹{metrics.grossEarnings.toLocaleString("en-IN")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 pt-1">
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    Across <strong>{metrics.totalOrders}</strong> total orders
                                </p>
                            </CardContent>
                        </div>
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px]">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-xs">
                                <Sparkles className="size-3 text-amber-500" />
                                Coming Soon
                            </span>
                        </div>
                    </Card>

                    {/* Payment status */}
                    <Card className="relative overflow-hidden border shadow-xs hover:border-amber-500/40 transition-all hover:shadow-sm group bg-card">
                        <div className="blur-[2.5px] select-none pointer-events-none opacity-50">
                            <CardHeader className="p-5 pb-2">
                                <div className="flex items-center justify-between">
                                    <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Payment status
                                    </CardDescription>
                                    <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                                    </div>
                                </div>
                                <CardTitle className="text-2xl font-black tracking-tight text-foreground mt-2">
                                    Payments not connected yet
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 pt-1">
                                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                    Payment is arranged offline in this prototype
                                </p>
                            </CardContent>
                        </div>
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px]">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-xs">
                                <Sparkles className="size-3 text-amber-500" />
                                Coming Soon
                            </span>
                        </div>
                    </Card>

                    {/* Settled / Paid */}
                    <Card className="relative overflow-hidden border shadow-xs hover:border-emerald-500/40 transition-all hover:shadow-sm group bg-card">
                        <div className="blur-[2.5px] select-none pointer-events-none opacity-50">
                            <CardHeader className="p-5 pb-2">
                                <div className="flex items-center justify-between">
                                    <CardDescription className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Settled & Paid
                                    </CardDescription>
                                    <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                        <CheckCircle2 className="size-4" />
                                    </div>
                                </div>
                                <CardTitle className="text-base font-semibold tracking-tight text-foreground mt-2">
                                    Payments not connected yet
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 pt-1">
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                    Payment is arranged offline in this prototype
                                </p>
                            </CardContent>
                        </div>
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px]">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-xs">
                                <Sparkles className="size-3 text-amber-500" />
                                Coming Soon
                            </span>
                        </div>
                    </Card>

                    {/* Active Orders */}"""

    assert old_commercial in text_norm, "Old commercial cards not found in vendor-dashboard-view.tsx"
    text_norm = text_norm.replace(old_commercial, new_commercial)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text_norm)
    print("Updated src/components/manufacturer/vendor-dashboard-view.tsx")

def update_earnings_page():
    path = 'src/app/designer/earnings/page.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    text_norm = text.replace('\r\n', '\n')

    # Add Sparkles to lucide-react imports
    if 'Sparkles' not in text_norm:
        text_norm = text_norm.replace('from "lucide-react"', 'Sparkles, from "lucide-react"').replace('Sparkles, from "lucide-react"', 'Sparkles } from "lucide-react"').replace('{ ArrowDownToLine', '{ ArrowDownToLine, Sparkles')

    old_body = """    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-7">
            <PageHeading
                eyebrow="Your project metrics"
                title="Earnings & completed order value"
                description="Review the total value of design contracts completed directly with businesses on UNIFIÉE."
            />

            {/* Honest direct payment notice */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-3">
                <Info className="size-4 shrink-0 mt-0.5 text-blue-500" />
                <div className="space-y-1">
                    <p className="font-semibold text-foreground">Direct Offline Settlement</p>
                    <p className="leading-relaxed">
                        Payment is arranged directly between you and the hiring business. Online payments are not connected yet. Figures below reflect the total agreed contract value of your completed orders.
                    </p>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <section className="rounded-xl border border-border/60 bg-card p-5 text-card-foreground shadow-xs">
                    <p className="text-xs font-medium text-muted-foreground">Total value of completed orders</p>
                    <p className="mt-2 font-heading text-2xl font-bold text-foreground">
                        ₹{totalCompletedOrderValue.toLocaleString("en-IN")}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        {completedOrdersCount} completed {completedOrdersCount === 1 ? "project" : "projects"} (Order value, not payout)
                    </p>
                </section>

                <section className="rounded-xl border border-border/60 bg-card p-5 text-card-foreground shadow-xs">
                    <p className="text-xs font-medium text-muted-foreground">Available to withdraw</p>
                    <p className="mt-2 font-heading text-2xl font-bold text-muted-foreground">—</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        Settled directly with brand owners
                    </p>
                </section>

                <section className="rounded-xl border border-border/60 bg-card p-5 text-card-foreground shadow-xs">
                    <p className="text-xs font-medium text-muted-foreground">Platform fees deducted</p>
                    <p className="mt-2 font-heading text-2xl font-bold text-emerald-500">₹0 (0%)</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                        Zero platform commissions on direct hires
                    </p>
                </section>
            </div>

            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <ArrowDownToLine className="size-4 text-muted-foreground" />
                    <h2 className="font-heading text-lg font-semibold text-foreground">Payment activity</h2>
                </div>
                <EmptyState
                    icon={CircleDollarSign}
                    title="Online payout tracking not connected yet"
                    description="Your gigs show transparent pricing, and all client payments are settled directly between you and the hiring brand without platform deductions. Automated online escrow and payout tracking will appear here when connected."
                />
            </section>
        </div>
    )"""

    new_body = """    return (
        <div className="relative mx-auto w-full max-w-[1440px] space-y-7 min-h-[calc(100vh-12rem)]">
            {/* Background Content with Blur */}
            <div className="space-y-7 blur-[3px] select-none pointer-events-none opacity-40">
                <PageHeading
                    eyebrow="Your project metrics"
                    title="Earnings & completed order value"
                    description="Review the total value of design contracts completed directly with businesses on UNIFIÉE."
                />

                {/* Honest direct payment notice */}
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-3">
                    <Info className="size-4 shrink-0 mt-0.5 text-blue-500" />
                    <div className="space-y-1">
                        <p className="font-semibold text-foreground">Direct Offline Settlement</p>
                        <p className="leading-relaxed">
                            Payment is arranged directly between you and the hiring business. Online payments are not connected yet. Figures below reflect the total agreed contract value of your completed orders.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <section className="rounded-xl border border-border/60 bg-card p-5 text-card-foreground shadow-xs">
                        <p className="text-xs font-medium text-muted-foreground">Total value of completed orders</p>
                        <p className="mt-2 font-heading text-2xl font-bold text-foreground">
                            ₹{totalCompletedOrderValue.toLocaleString("en-IN")}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            {completedOrdersCount} completed {completedOrdersCount === 1 ? "project" : "projects"} (Order value, not payout)
                        </p>
                    </section>

                    <section className="rounded-xl border border-border/60 bg-card p-5 text-card-foreground shadow-xs">
                        <p className="text-xs font-medium text-muted-foreground">Available to withdraw</p>
                        <p className="mt-2 font-heading text-2xl font-bold text-muted-foreground">—</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            Settled directly with brand owners
                        </p>
                    </section>

                    <section className="rounded-xl border border-border/60 bg-card p-5 text-card-foreground shadow-xs">
                        <p className="text-xs font-medium text-muted-foreground">Platform fees deducted</p>
                        <p className="mt-2 font-heading text-2xl font-bold text-emerald-500">₹0 (0%)</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            Zero platform commissions on direct hires
                        </p>
                    </section>
                </div>

                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <ArrowDownToLine className="size-4 text-muted-foreground" />
                        <h2 className="font-heading text-lg font-semibold text-foreground">Payment activity</h2>
                    </div>
                    <EmptyState
                        icon={CircleDollarSign}
                        title="Online payout tracking not connected yet"
                        description="Your gigs show transparent pricing, and all client payments are settled directly between you and the hiring brand without platform deductions. Automated online escrow and payout tracking will appear here when connected."
                    />
                </section>
            </div>

            {/* Centered Blur Overlay & Coming Soon Card */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl border border-border/80 bg-card/95 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-4 ring-1 ring-amber-500/20 shadow-sm">
                        <Sparkles className="size-7" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-3">
                        Coming Soon
                    </span>
                    <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                        Earnings & Financial Dashboard
                    </h2>
                    <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
                        Automated online payouts, escrow settlement, and downloadable tax invoices will be enabled when payment gateway integration launches. In the meantime, all transactions are settled directly offline.
                    </p>
                </div>
            </div>
        </div>
    )"""

    assert old_body in text_norm, "Old body not found in earnings/page.tsx"
    text_norm = text_norm.replace(old_body, new_body)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text_norm)
    print("Updated src/app/designer/earnings/page.tsx")

def update_landing_previews():
    path = 'src/components/site/landing/dashboard-previews.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    text_norm = text.replace('\r\n', '\n')

    # Add Sparkles to lucide-react imports
    if 'Sparkles,' not in text_norm:
        text_norm = text_norm.replace('    ShieldCheck,\n', '    ShieldCheck,\n    Sparkles,\n')

    # Update Business Preview: "Ordered this month"
    old_biz_kpi = """        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
        </div>"""

    new_biz_kpi = """        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["Open requirements", "2"],
            ["Offers to review", "3"],
            ["Orders in progress", "2"],
            ["Ordered this month", "₹48,200"],
          ].map(([label, value]) => {
            const isEarnings = label === "Ordered this month";
            return (
              <div key={label} className="relative overflow-hidden rounded-xl border border-border/60 bg-card/50 p-2.5 sm:p-3">
                <div className={isEarnings ? "blur-[2px] select-none pointer-events-none opacity-50" : undefined}>
                  <p className="truncate text-[9px] text-muted-foreground sm:text-[10px]">{label}</p>
                  <p className="mt-0.5 text-base font-semibold tracking-tight sm:mt-1 sm:text-lg">{value}</p>
                </div>
                {isEarnings && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px]">
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-background/95 px-2 py-0.5 text-[9px] font-semibold text-foreground shadow-xs">
                      <Sparkles className="size-2.5 text-amber-500" />
                      Coming Soon
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>"""

    # Update Vendor Preview: Total Revenue, Pending Payment, Settled & Paid
    old_vendor_kpis = """      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {[
          ["Total Revenue", "₹2,40,000", IndianRupee, "Across 18 orders"],
          ["Pending Payment", "₹36,400", Shield, "Direct settlement"],
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
      </div>"""

    new_vendor_kpis = """      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {[
          ["Total Revenue", "₹2,40,000", IndianRupee, "Across 18 orders"],
          ["Pending Payment", "₹36,400", Shield, "Direct settlement"],
          ["Settled & Paid", "₹2,03,600", ShieldCheck, "Completed to bank"],
          ["Active Orders", "4", Truck, "In production or dispatched"],
        ].map(([label, value, Icon, detail]) => {
          const MetricIcon = Icon as typeof IndianRupee;
          const isEarnings = label !== "Active Orders";
          return (
            <div key={String(label)} className="relative overflow-hidden min-w-0 rounded-xl border border-border/60 bg-card/50 p-2 sm:p-3">
              <div className={isEarnings ? "blur-[2px] select-none pointer-events-none opacity-50" : undefined}>
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
              {isEarnings && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px]">
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-background/95 px-1.5 py-0.5 text-[8px] font-semibold text-foreground shadow-xs">
                    <Sparkles className="size-2 text-amber-500" />
                    Coming Soon
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>"""

    # Update Designer Preview: Earnings
    old_designer_kpis = """      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
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
      </div>"""

    new_designer_kpis = """      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {[
          ["Specialties", "5", BriefcaseBusiness],
          ["Services listed", "4", Tags],
          ["Availability", "Open", PackageCheck],
          ["Earnings", "₹86,000", CircleDollarSign],
        ].map(([label, value, Icon]) => {
          const StatIcon = Icon as typeof Tags;
          const isEarnings = label === "Earnings";
          return (
            <div key={String(label)} className="relative overflow-hidden rounded-xl border bg-card p-3">
              <div className={isEarnings ? "blur-[2px] select-none pointer-events-none opacity-50" : undefined}>
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
              {isEarnings && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px]">
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-background/95 px-2 py-0.5 text-[9px] font-semibold text-foreground shadow-xs">
                    <Sparkles className="size-2.5 text-amber-500" />
                    Coming Soon
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>"""

    assert old_biz_kpi in text_norm, "Old biz KPI not found in dashboard-previews.tsx"
    assert old_vendor_kpis in text_norm, "Old vendor KPIs not found in dashboard-previews.tsx"
    assert old_designer_kpis in text_norm, "Old designer KPIs not found in dashboard-previews.tsx"

    text_norm = text_norm.replace(old_biz_kpi, new_biz_kpi)
    text_norm = text_norm.replace(old_vendor_kpis, new_vendor_kpis)
    text_norm = text_norm.replace(old_designer_kpis, new_designer_kpis)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text_norm)
    print("Updated src/components/site/landing/dashboard-previews.tsx")

if __name__ == '__main__':
    update_designer_components()
    update_designer_page()
    update_business_dashboard()
    update_manufacturer_dashboard()
    update_earnings_page()
    update_landing_previews()
