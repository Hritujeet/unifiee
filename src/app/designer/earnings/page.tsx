import type { Metadata } from "next"
import { ArrowDownToLine, CircleDollarSign, Info } from "lucide-react"
import { EmptyState, PageHeading } from "@/components/designer/dashboard-components"
import { getCurrentDesigner } from "@/lib/designer/get-current-designer"
import { db } from "@/lib/db"
import { businessHiredServiceTable } from "@/lib/db/schema/business-hired-service"
import { and, eq, sql } from "drizzle-orm"

export const metadata: Metadata = {
    title: "Earnings — UNIFIÉE Designer",
    description: "View completed order values and payment activity for your design services.",
    robots: { index: false },
}

export const dynamic = "force-dynamic"

export default async function DesignerEarningsPage() {
    const designer = await getCurrentDesigner()

    let totalCompletedOrderValue = 0
    let completedOrdersCount = 0

    if (designer) {
        const stats = await db
            .select({
                total: sql<string>`coalesce(sum(price), '0')`,
                count: sql<number>`count(*)`,
            })
            .from(businessHiredServiceTable)
            .where(and(
                eq(businessHiredServiceTable.designerId, designer.id),
                eq(businessHiredServiceTable.status, "completed")
            ))

        totalCompletedOrderValue = Number(stats[0]?.total || 0)
        completedOrdersCount = Number(stats[0]?.count || 0)
    }

    return (
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
    )
}
