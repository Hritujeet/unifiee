import type { Metadata } from "next"
import RequirementsView from "@/components/business/requirements-view"
import { getBusinessRequirementsAction } from "@/actions/business-requirements"
import { getBusinessQuotesAction, getBusinessOrdersAction } from "@/actions/order-actions"

export const metadata: Metadata = {
    title: "Requirements — UNIFIÉE Business",
    description: "Manage your packaging requirements and vendor sourcing on UNIFIÉE.",
    robots: { index: false },
}
export const dynamic = "force-dynamic"
export default async function BusinessRequirementsPage() {
    const result = await getBusinessRequirementsAction()
    const dbRequirements = result.success && result.data ? result.data : []
    const [quotesResult, ordersResult] = await Promise.all([
        getBusinessQuotesAction(),
        getBusinessOrdersAction(),
    ])

    return (
        <RequirementsView
            initialDbRequirements={dbRequirements}
            initialQuotes={quotesResult.success ? quotesResult.data ?? [] : []}
            initialOrders={ordersResult.success ? ordersResult.data ?? [] : []}
        />
    )
}

