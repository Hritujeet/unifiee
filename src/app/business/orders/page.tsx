import type { Metadata } from "next"
import OrdersView from "@/components/business/orders-view"

export const metadata: Metadata = {
    title: "Orders — UNIFIÉE Business",
    description: "Track packaging orders and supplier fulfillment across the 6-state lifecycle on UNIFIÉE.",
    robots: { index: false },
}

export default function BusinessOrdersPage() {
    return <OrdersView />
}

