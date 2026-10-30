import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getHiredServiceWorkspace } from "@/lib/business/marketplace"
import { HiredServiceWorkspace } from "@/components/hired-services/hired-service-workspace"

export const metadata: Metadata = {
    title: "Order Workspace — UNIFIÉE Business",
    description: "Collaborate with your hired packaging designer on deliverables, revisions, and proofs.",
    robots: { index: false },
}

export const dynamic = "force-dynamic"

export default async function BusinessHiredServiceOrderPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
        redirect("/sign-in")
    }

    const workspaceData = await getHiredServiceWorkspace(id, session.user.id)
    if (!workspaceData) {
        notFound()
    }

    return <HiredServiceWorkspace data={workspaceData} />
}

