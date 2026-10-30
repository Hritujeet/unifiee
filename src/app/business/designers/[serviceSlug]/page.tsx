import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getDetailedGigBySlug, getTrackedDesignerServiceIds } from "@/lib/business/marketplace"
import { GigDetailView } from "@/components/business/gig-detail-view"

export async function generateMetadata({
    params,
}: {
    params: Promise<{ serviceSlug: string }>
}): Promise<Metadata> {
    const { serviceSlug } = await params
    const gig = await getDetailedGigBySlug(serviceSlug)
    if (!gig) return { title: "Design Service — UNIFIÉE" }

    return {
        title: `${gig.title} by ${gig.designerDisplayName} — UNIFIÉE`,
        description: gig.description.slice(0, 160),
    }
}

export default async function BusinessGigDetailPage({
    params,
}: {
    params: Promise<{ serviceSlug: string }>
}) {
    const { serviceSlug } = await params
    const gig = await getDetailedGigBySlug(serviceSlug)
    if (!gig) {
        notFound()
    }

    const session = await auth.api.getSession({ headers: await headers() })
    const savedIds = session?.user ? await getTrackedDesignerServiceIds(session.user.id) : []
    const isSaved = savedIds.includes(gig.id)

    return (
        <div className="mx-auto w-full max-w-[1440px] px-2 sm:px-4 py-4">
            <GigDetailView gig={gig} isSavedInitially={isSaved} />
        </div>
    )
}

