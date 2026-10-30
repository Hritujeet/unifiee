import type { Metadata } from "next"
import DbOrdersView from "@/components/business/db-orders-view"
import { getBusinessOrdersAction } from "@/actions/order-actions"

export const metadata: Metadata = {
    title: "Orders — UNIFIÉE Business",
    description: "Track packaging orders and supplier fulfillment across the 6-state lifecycle on UNIFIÉE.",
    robots: { index: false },
}

export const dynamic = "force-dynamic"

export default async function BusinessOrdersPage() {
    const result = await getBusinessOrdersAction()
    return <DbOrdersView orders={result.data ?? []} />
}
