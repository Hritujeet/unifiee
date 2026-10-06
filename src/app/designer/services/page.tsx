import type { Metadata } from "next"
import Link from "next/link"
import { PageHeading } from "@/components/designer/dashboard-components"
import { DesignerServicesManager } from "@/components/designer/designer-services-manager"
import { designerServiceTable } from "@/lib/db/schema/designer-service"
import { getCurrentDesigner } from "@/lib/designer/get-current-designer"
import { db } from "@/lib/db"
import { desc, eq } from "drizzle-orm"

export const metadata: Metadata = {
    title: "My Services — UNIFIÉE Designer",
    description: "Review the packaging design specialties and service details on your UNIFIÉE profile.",
    robots: { index: false },
}

const specializationLabels: Record<string, string> = {
    "food-boxes": "Food boxes",
    "paper-cups": "Paper cups",
    "paper-bags": "Paper bags",
    "labels-stickers": "Labels & stickers",
    "corrugated-packaging": "Corrugated packaging",
    "takeaway-packaging": "Takeaway packaging",
    "flexible-packaging": "Flexible packaging",
    other: "Other packaging",
}

export default async function DesignerServicesPage() {
    const designer = await getCurrentDesigner()
    const specializations = designer?.packagingDesignSpecializations ?? []
    const services = designer
        ? await db
            .select()
            .from(designerServiceTable)
            .where(eq(designerServiceTable.designerId, designer.id))
            .orderBy(desc(designerServiceTable.createdAt))
        : []

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-7">
            <PageHeading
                eyebrow="Your work, your way"
                title="Services & expertise"
                description="Create individual service offerings with their own pricing, deliverables, and work samples."
            />

            <section className="space-y-4 border-b pb-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="font-heading text-lg font-semibold text-foreground">Profile specialties</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Broad packaging categories listed on your profile.</p>
                    </div>
                    <Link href="/designer/profile" className="text-sm font-medium text-primary hover:underline">Edit profile</Link>
                </div>
                {specializations.length ? (
                    <div className="flex flex-wrap gap-2">
                        {specializations.map((specialization) => (
                            <span key={specialization} className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-foreground">
                                {specializationLabels[specialization] ?? specialization}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
                        No specialties added yet. <Link href="/designer/profile" className="font-semibold text-primary hover:underline">Add packaging specialties</Link> to help brands find you.
                    </div>
                )}
            </section>

            <section className="space-y-4">
                <div>
                    <h2 className="font-heading text-lg font-semibold text-foreground">Your service offerings</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Each service can have its own scope, pricing, and sample images.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded-md bg-muted px-2.5 py-1.5 font-medium text-foreground">{services.length}</span>
                    {services.length === 1 ? "service listed" : "services listed"}
                </div>
                <DesignerServicesManager services={services} />
            </section>
        </div>
    )
}
