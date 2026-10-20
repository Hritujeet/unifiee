import type { Metadata } from "next"
import RequirementsView from "@/components/business/requirements-view"
import { getBusinessRequirementsAction } from "@/actions/business-requirements"

export const metadata: Metadata = {
    title: "Requirements — UNIFIÉE Business",
    description: "Manage your packaging requirements and vendor sourcing on UNIFIÉE.",
    robots: { index: false },
}
export const dynamic = "force-dynamic"
export default async function BusinessRequirementsPage() {
    const result = await getBusinessRequirementsAction()
    const dbRequirements = result.success && result.data ? result.data : []

    return <RequirementsView initialDbRequirements={dbRequirements} />
}


