import type { Metadata } from "next"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { business } from "@/lib/db/schema/business"
import { headers } from "next/headers"
import BusinessDashboardView from "@/components/business/dashboard-view"
import { getBusinessRequirementsAction } from "@/actions/business-requirements"
import { getBusinessOrdersAction, getBusinessQuotesAction } from "@/actions/order-actions"
import type { Requirement, Quotation, Order } from "@/lib/business/types"

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
              .select({ businessName: business.businessName, fullName: business.fullName })
              .from(business)
              .where(eq(business.userId, userId))
              .limit(1)
        : []

    const profile = businessProfile[0]
    const displayName = profile?.businessName || profile?.fullName || "Unifiée"

    const [requirementsResult, quotesResult, ordersResult] = await Promise.all([
        getBusinessRequirementsAction(),
        getBusinessQuotesAction(),
        getBusinessOrdersAction(),
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
        <div className="w-full">
            <BusinessDashboardView
                businessName={displayName}
                initialRequirements={requirements}
                initialQuotations={quotations}
                initialOrders={orders}
            />
        </div>
    )
}
