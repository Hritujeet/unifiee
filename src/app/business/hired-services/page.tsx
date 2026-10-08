import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { PageHeading } from "@/components/designer/dashboard-components"
import { HiredServicesManager } from "@/components/business/hired-services-manager"
import { getBusinessHiredServices } from "@/lib/business/marketplace"

export const metadata: Metadata = {
    title: "Hired Services — UNIFIÉE Business",
    description: "Manage your active and completed designer projects on UNIFIÉE.",
    robots: { index: false },
}

export default async function BusinessHiredServicesPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    const services = session?.user ? await getBusinessHiredServices(session.user.id) : []

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-7">
            <PageHeading
                eyebrow="Your creative projects"
                title="Hired services."
                description="Manage designer services you have hired, keep in touch, and track completed work."
            />
            <p className="rounded-lg border bg-muted/40 px-4 py-3 text-sm leading-6 text-muted-foreground">
                This tracker records projects you have arranged with a designer directly. It does not create a contract, place an order, or process payment.
            </p>
            <HiredServicesManager services={services} />
        </div>
    )
}
