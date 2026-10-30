import type { Metadata } from "next"
import Link from "next/link"
import { PageHeading } from "@/components/designer/dashboard-components"
import { DesignerServicesManager, type ServiceWithRelations } from "@/components/designer/designer-services-manager"
import {
    designerServiceTable,
    designerServicePackagesTable,
    designerServiceExtrasTable,
} from "@/lib/db/schema/designer-service"
import { getCurrentDesigner } from "@/lib/designer/get-current-designer"
import { db } from "@/lib/db"
import { desc, eq, inArray, isNull } from "drizzle-orm"

export const metadata: Metadata = {
    title: "My Gigs & Services — UNIFIÉE Designer",
    description: "Publish and manage your packaging design gigs, tiered pricing packages, and work samples.",
    robots: { index: false },
}

export const dynamic = "force-dynamic"

export default async function DesignerServicesPage() {
    const designer = await getCurrentDesigner()
    const specializations = designer?.packagingDesignSpecializations ?? []
    const hasBio = Boolean(designer?.bio && designer.bio.trim().length >= 10)
    const hasSpecialization = Boolean(
        (designer?.packagingDesignSpecializations && designer.packagingDesignSpecializations.length > 0) ||
        (designer?.specializations && designer.specializations.length > 0)
    )

    let servicesWithRelations: ServiceWithRelations[] = []

    if (designer) {
        const rawServices = await db
            .select()
            .from(designerServiceTable)
            .where(eq(designerServiceTable.designerId, designer.id))
            .orderBy(desc(designerServiceTable.createdAt))

        if (rawServices.length > 0) {
            const serviceIds = rawServices.map((s) => s.id)
            const packages = await db
                .select()
                .from(designerServicePackagesTable)
                .where(inArray(designerServicePackagesTable.serviceId, serviceIds))

            const extras = await db
                .select()
                .from(designerServiceExtrasTable)
                .where(inArray(designerServiceExtrasTable.serviceId, serviceIds))

            servicesWithRelations = rawServices.map((service) => ({
                ...service,
                packages: packages.filter((p) => p.serviceId === service.id),
                extras: extras.filter((e) => e.serviceId === service.id),
            }))
        }
    }

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-7">
            <PageHeading
                eyebrow="Your marketplace studio"
                title="Gigs & service packages"
                description="Publish Fiverr-style packaging gigs with Basic, Standard, and Premium packages, dielines, and 3D renders."
            />

            {/* Profile readiness alert if bio or specialization is missing */}
            {(!hasBio || !hasSpecialization) && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between gap-3">
                    <p>
                        <strong>Profile incomplete:</strong> You need to add a bio and at least one specialization to your profile before publishing gigs.
                    </p>
                    <Link href="/designer/profile" className="font-semibold text-primary hover:underline shrink-0">
                        Edit Profile
                    </Link>
                </div>
            )}

            <DesignerServicesManager
                services={servicesWithRelations}
                hasBio={hasBio}
                hasSpecialization={hasSpecialization}
            />
        </div>
    )
}
