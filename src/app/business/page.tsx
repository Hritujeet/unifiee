import type { Metadata } from "next"
import Link from "next/link"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema/business"
import { businessHiredServiceTable } from "@/lib/db/schema/business-hired-service"
import { headers } from "next/headers"
import BusinessDashboardView from "@/components/business/dashboard-view"
import { getBusinessRequirementsAction } from "@/actions/business-requirements"
import { getBusinessOrdersAction, getBusinessQuotesAction } from "@/actions/order-actions"
import type { Requirement, Quotation, Order } from "@/lib/business/types"
import { ArrowRight, FileCheck2, Sparkles } from "lucide-react"

export const metadata: Metadata = {
    title: "Dashboard — UNIFIÉE Business",
    description: "Manage packaging requirements, review vendor offers, and track orders in progress on UNIFIÉE.",
    robots: { index: false },
}

export const dynamic = "force-dynamic"

export default async function BusinessDashboardPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    const userId = session?.user.id

    const businessProfile = userId
        ? await db
              .select({ id: business.id, businessName: business.businessName, fullName: business.fullName })
              .from(business)
              .where(eq(business.userId, userId))
              .limit(1)
        : []

    const profile = businessProfile[0]
    const displayName = profile?.businessName || profile?.fullName || "Unifiée"

    const [requirementsResult, quotesResult, ordersResult, pendingDeliveries] = await Promise.all([
        getBusinessRequirementsAction(),
        getBusinessQuotesAction(),
        getBusinessOrdersAction(),
        profile?.id
            ? db
                  .select({
                      id: businessHiredServiceTable.id,
                      serviceTitle: businessHiredServiceTable.serviceTitle,
                      designerName: businessHiredServiceTable.designerName,
                  })
                  .from(businessHiredServiceTable)
                  .where(and(
                      eq(businessHiredServiceTable.businessId, profile.id),
                      eq(businessHiredServiceTable.status, "delivered")
                  ))
            : Promise.resolve([]),
    ])

    const quotes = quotesResult.success ? quotesResult.data ?? [] : []
    const requirements: Requirement[] = (requirementsResult.success ? requirementsResult.data ?? [] : []).map((requirement) => ({
        id: requirement.id,
        title: requirement.title,
        packagingUse: requirement.packagingUse,
        packagingType: requirement.packagingType,
        quantity: requirement.quantity,
        size: requirement.size,
        material: requirement.material,
        brandingNeeded: requirement.brandingNeeded,
        deliveryLocation: requirement.deliveryLocation,
        requiredByDate: requirement.requiredByDate,
        status: ({
            requirement_received: "Requirement Received",
            quoted: "Quoted",
            order_confirmed: "Order Confirmed",
            in_production: "In Production",
            shipped: "Shipped",
            delivered: "Delivered",
        } as Record<string, Requirement["status"]>)[requirement.status] ?? "Requirement Received",
        createdAt: requirement.createdAt.toISOString(),
        quotesCount: quotes.filter((quote) => quote.requirementId === requirement.id).length,
        rawDescription: requirement.rawDescription ?? undefined,
    }))

    const quotations: Quotation[] = quotes.map((quote) => ({
        id: quote.id,
        requirementId: quote.requirementId,
        requirementTitle: quote.requirementTitle,
        packagingType: quote.packagingType as Quotation["packagingType"],
        vendorName: quote.vendorName,
        vendorLocation: quote.vendorLocation,
        unitPrice: `₹${Number(quote.unitPrice).toLocaleString("en-IN")}`,
        totalPrice: `₹${Number(quote.totalPrice).toLocaleString("en-IN")}`,
        quantity: `${quote.quantity} units`,
        productionTime: quote.productionTime,
        deliveryEstimate: quote.deliveryEstimate,
        status: quote.status === "pending" || quote.status === "accepted" || quote.status === "rejected"
            ? quote.status
            : "rejected",
        receivedAt: quote.receivedAt.toISOString(),
    }))

    const orders: Order[] = (ordersResult.success ? ordersResult.data ?? [] : []).map(({ order, vendorName, requirementTitle, packagingType, quantity }) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        requirementId: order.quoteId ?? order.id,
        requirementTitle: requirementTitle ?? order.orderNumber,
        packagingType: (packagingType ?? "custom") as Order["packagingType"],
        vendorName,
        vendorLocation: "",
        quantity: quantity ? `${quantity} units` : "",
        totalPrice: `₹${Number(order.total).toLocaleString("en-IN")}`,
        status: ({
            draft: "Requirement Received",
            submitted: "Requirement Received",
            confirmed: "Order Confirmed",
            processing: "In Production",
            shipped: "Shipped",
            delivered: "Delivered",
            cancelled: "Requirement Received",
        } as Record<string, Order["status"]>)[order.status] ?? "Order Confirmed",
        paid: false,
        deliveryLocation: [order.shippingCity, order.shippingState].filter(Boolean).join(", "),
        estimatedDelivery: "",
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
    }))

    return (
        <div className="w-full space-y-6">
            {pendingDeliveries.length > 0 && (
                <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 shadow-xs">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 shrink-0">
                                <FileCheck2 className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                                    <span>Needs Your Action:</span>
                                    <span className="font-normal text-muted-foreground">
                                        {pendingDeliveries.length} packaging design {pendingDeliveries.length === 1 ? "delivery awaits" : "deliveries await"} your review
                                    </span>
                                </h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    Latest from {pendingDeliveries[0].designerName}: &ldquo;{pendingDeliveries[0].serviceTitle}&rdquo;
                                </p>
                            </div>
                        </div>

                        <Link
                            href={`/business/hired-services/${pendingDeliveries[0].id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors shrink-0"
                        >
                            <span>Review Delivery</span>
                            <ArrowRight className="size-3.5" />
                        </Link>
                    </div>
                </div>
            )}

            <BusinessDashboardView
                businessName={displayName}
                initialRequirements={requirements}
                initialQuotations={quotations}
                initialOrders={orders}
            />
        </div>
    )
}
