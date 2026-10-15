import type { Metadata } from "next"
import RequirementsView from "@/components/business/requirements-view"

export const metadata: Metadata = {
    title: "Requirements — UNIFIÉE Business",
    description: "Manage your packaging requirements and vendor sourcing on UNIFIÉE.",
    robots: { index: false },
}

export default function BusinessRequirementsPage() {
    return <RequirementsView />
}

