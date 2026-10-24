import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BriefcaseBusiness, CircleDollarSign, Image as ImageIcon, PackageCheck, Tags } from "lucide-react"
import {
    AvailabilityBadge,
    InitialsAvatar,
    PageHeading,
    ProfileStrengthCard,
    SectionHeading,
    StatCard,
} from "@/components/designer/dashboard-components"
import { getCurrentDesigner } from "@/lib/designer/get-current-designer"
import { designerServiceTable } from "@/lib/db/schema/designer-service"
import { db } from "@/lib/db"
import { count, desc, eq } from "drizzle-orm"

export const metadata: Metadata = {
    title: "Designer Dashboard — UNIFIÉE",
    description: "Manage your packaging design studio on UNIFIÉE.",
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

export default async function DesignerDashboardPage() {
    const designer = await getCurrentDesigner()
    const name = designer?.displayName || designer?.fullName || "Designer"
    const specializations = designer?.packagingDesignSpecializations ?? []
    const [listedServiceCount, servicePreview] = designer
        ? await Promise.all([
            db.select({ count: count() }).from(designerServiceTable).where(eq(designerServiceTable.designerId, designer.id)),
            db.select({
                id: designerServiceTable.id,
                title: designerServiceTable.title,
                serviceType: designerServiceTable.serviceType,
                price: designerServiceTable.price,
                pricingModel: designerServiceTable.pricingModel,
                sampleImages: designerServiceTable.sampleImages,
            })
                .from(designerServiceTable)
                .where(eq(designerServiceTable.designerId, designer.id))
                .orderBy(desc(designerServiceTable.createdAt))
                .limit(2),
        ])
        : [[{ count: 0 }], []]
    const serviceCount = listedServiceCount[0]?.count ?? 0
    const profileFields = [
        Boolean(designer?.profilePhotoUrl),
        Boolean(designer?.headline),
        Boolean(designer?.bio),
        designer?.yearsOfExperience !== null && designer?.yearsOfExperience !== undefined,
        specializations.length > 0,
        (designer?.softwareTools?.length ?? 0) > 0,
        Boolean(designer?.portfolioUrl),
        serviceCount > 0,
        Boolean(designer?.turnaroundTime),
    ]
    const completion = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100)
    const missing = [
        !designer?.profilePhotoUrl && "a profile photo",
        !designer?.bio && "a short bio",
        serviceCount === 0 && "your first service offering",
    ].filter((item): item is string => Boolean(item))
    const place = [designer?.city, designer?.state].filter(Boolean).join(", ")

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-7">
            <PageHeading
                eyebrow="Your creative workspace"
                title={`Good to have you here, ${name}.`}
                description="Keep your packaging services clear, useful, and easy for brands to browse."
            />

            <section className="relative overflow-hidden rounded-2xl bg-primary px-6 py-7 text-primary-foreground sm:px-9 sm:py-8">
                <div className="pointer-events-none absolute -right-10 -top-24 size-72 rounded-full border border-primary-foreground/10" />
                <div className="pointer-events-none absolute -right-1 -top-16 size-52 rounded-full border border-primary-foreground/10" />
                <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                        <InitialsAvatar name={name} className="size-14 border-2 border-primary-foreground/20 bg-primary-foreground/15 text-lg text-primary-foreground" />
                        <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <AvailabilityBadge status={designer?.availabilityStatus ?? null} inverted />
                                {designer?.isVerified && <span className="rounded-full bg-primary-foreground/15 px-2.5 py-1 text-xs font-medium text-primary-foreground">Verified designer</span>}
                            </div>
                            <h2 className="font-heading text-xl font-semibold">{designer?.headline || "Your next great packaging project starts here."}</h2>
                            <p className="mt-1 text-sm text-primary-foreground/70">{place || "Add your location"}{designer?.yearsOfExperience ? ` · ${designer.yearsOfExperience} years of experience` : ""}</p>
                        </div>
                    </div>
                    <Link href="/designer/profile" className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary-foreground px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-foreground/90">
                        View profile <ArrowRight className="size-4" />
                    </Link>
                </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Specialties" value={String(specializations.length)} detail="Packaging categories on your profile" icon={BriefcaseBusiness} />
                <StatCard label="Services listed" value={String(serviceCount)} detail="Individual offerings on your service page" icon={Tags} tone="secondary" />
                <StatCard label="Availability" value={designer?.availabilityStatus === "available" ? "Open" : designer?.availabilityStatus === "limited" ? "Limited" : designer?.availabilityStatus === "unavailable" ? "Closed" : "Not set"} detail="Your current booking preference" icon={PackageCheck} tone="accent" />
                <StatCard label="Earnings" value="—" detail="Payment tracking is not available yet" icon={CircleDollarSign} />
            </div>

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,0.85fr)]">
                <div className="space-y-5">
                    <SectionHeading
                        title="Your service offerings"
                        detail="Services with their own pricing, details, and work samples."
                        href="/designer/services"
                        linkText="Manage services"
                    />
                    {servicePreview.length ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {servicePreview.map((service) => (
                                <Link key={service.id} href="/designer/services" className="group overflow-hidden rounded-xl border bg-card text-card-foreground transition-colors hover:bg-accent/50">
                                    {service.sampleImages[0] ? (
                                        <Image src={service.sampleImages[0]} alt={`${service.title} sample`} width={640} height={320} unoptimized className="h-36 w-full object-cover" />
                                    ) : (
                                        <div className="flex h-36 items-center justify-center bg-muted"><ImageIcon className="size-7 text-muted-foreground" /></div>
                                    )}
                                    <div className="flex items-center justify-between gap-3 p-4">
                                        <div className="min-w-0">
                                            <p className="text-xs text-muted-foreground">{specializationLabels[service.serviceType] ?? service.serviceType.replaceAll("_", " ")}</p>
                                            <h3 className="mt-1 truncate font-heading font-semibold text-foreground">{service.title}</h3>
                                            <p className="mt-1 text-sm font-medium text-foreground">₹{Number(service.price).toLocaleString("en-IN")} <span className="text-xs font-normal text-muted-foreground">/ {service.pricingModel.replaceAll("_", " ")}</span></p>
                                        </div>
                                        <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
                            <p>Add your first service with its pricing, turnaround, deliverables, and relevant sample images.</p>
                            <Link href="/designer/services" className="mt-3 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">Add a service <ArrowRight className="size-4" /></Link>
                        </div>
                    )}

                </div>

                <aside className="space-y-5">
                    <ProfileStrengthCard completion={completion} missing={missing} />
                    <section className="rounded-xl border bg-card p-5 text-card-foreground">
                        <h2 className="font-heading font-semibold text-foreground">Studio snapshot</h2>
                        <p className="mt-1 text-sm text-muted-foreground">The essentials brands see first.</p>
                        <dl className="mt-5 space-y-4">
                            <div className="flex items-start justify-between gap-4 border-b pb-3">
                                <dt className="text-xs text-muted-foreground">Starting rate</dt>
                                <dd className="text-right text-sm font-semibold text-foreground">{designer?.startingPrice ? `₹${Number(designer.startingPrice).toLocaleString("en-IN")}` : "Not set"}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-4 border-b pb-3">
                                <dt className="text-xs text-muted-foreground">Typical turnaround</dt>
                                <dd className="text-right text-sm font-semibold text-foreground">{designer?.turnaroundTime || "Not set"}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-4">
                                <dt className="text-xs text-muted-foreground">Revisions included</dt>
                                <dd className="text-right text-sm font-semibold text-foreground">{designer?.revisionsIncluded ?? "Not set"}</dd>
                            </div>
                        </dl>
                        <Link href="/designer/profile" className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                            Review profile details <ArrowRight className="size-3.5" />
                        </Link>
                    </section>
                </aside>
            </div>
        </div>
    )
}
