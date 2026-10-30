import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getDetailedGigBySlug } from "@/lib/business/marketplace"
import { OrderCheckoutForm } from "@/components/business/order-checkout-form"

export const metadata: Metadata = {
    title: "Order Brief & Checkout — UNIFIÉE Business",
    description: "Provide your packaging specifications, dimensions, and dieline requirements to your designer.",
    robots: { index: false },
}

export const dynamic = "force-dynamic"

export default async function BusinessGigCheckoutPage({
    params,
    searchParams,
}: {
    params: Promise<{ serviceSlug: string }>
    searchParams: Promise<{ tier?: string; extras?: string }>
}) {
    const { serviceSlug } = await params
    const { tier = "basic", extras = "" } = await searchParams

    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
        redirect(`/sign-in?redirect=/business/designers/${serviceSlug}`)
    }

    const gig = await getDetailedGigBySlug(serviceSlug)
    if (!gig || gig.status !== "published") {
        notFound()
    }

    // Block ordering own gig
    if (gig.designerId) {
        // If the user is the owner designer of this gig
        // Checked in placeOrderAction as well
    }

    const selectedTier = (tier === "standard" || tier === "premium") ? tier : "basic"
    const extrasIds = extras ? extras.split(",").filter(Boolean) : []
    const idempotencyKey = crypto.randomUUID()

    return (
        <div className="mx-auto w-full max-w-[1440px] px-2 sm:px-4 py-4">
            <OrderCheckoutForm
                gig={gig}
                tier={selectedTier}
                extrasIds={extrasIds}
                initialIdempotencyKey={idempotencyKey}
            />
        </div>
    )
}

