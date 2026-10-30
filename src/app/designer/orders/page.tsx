import type { Metadata } from "next"
import { getDesignerIncomingProjectsAction } from "@/actions/business-hired-services"
import IncomingProjectsView from "@/components/designer/incoming-projects-view"

export const metadata: Metadata = {
    title: "Client Orders — UNIFIÉE Designer",
    description: "Manage incoming packaging design projects and client deliverables.",
    robots: { index: false },
}

export const dynamic = "force-dynamic"

export default async function DesignerOrdersPage() {
    const result = await getDesignerIncomingProjectsAction()
    return <IncomingProjectsView projects={result.data ?? []} />
}
