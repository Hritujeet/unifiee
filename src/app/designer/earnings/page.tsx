import type { Metadata } from "next"
import { ArrowDownToLine, CircleDollarSign } from "lucide-react"
import { EmptyState, PageHeading } from "@/components/designer/dashboard-components"

export const metadata: Metadata = {
    title: "Earnings — UNIFIÉE Designer",
    description: "View earnings and payment activity for your design services.",
    robots: { index: false },
}

export default function DesignerEarningsPage() {
    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-7">
            <PageHeading
                eyebrow="Your income"
                title="Earnings"
                description="A clear view of what your design work earns and what is ready to withdraw."
            />

            <div className="grid gap-4 sm:grid-cols-3">
                {[
                    ["Total earnings", "Not tracked in MVP"],
                    ["Available to withdraw", "Not tracked in MVP"],
                    ["Last payout", "Not tracked in MVP"],
                ].map(([label, value]) => (
                    <section key={label} className="rounded-xl border bg-card p-5 text-card-foreground">
                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                        <p className="mt-3 font-heading text-lg font-semibold text-foreground">{value}</p>
                    </section>
                ))}
            </div>

            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <ArrowDownToLine className="size-4 text-muted-foreground" />
                    <h2 className="font-heading text-lg font-semibold text-foreground">Payment activity</h2>
                </div>
                <EmptyState
                    icon={CircleDollarSign}
                    title="Payments are not connected yet"
                    description="Your service listings can show prices, but UNIFIÉE does not yet process bookings or payments. Earnings and payout totals will appear here when payment support is added."
                />
            </section>
        </div>
    )
}
