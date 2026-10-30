import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
    AlertCircle,
    ArrowRight,
    BriefcaseBusiness,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    FileCheck2,
    Image as ImageIcon,
    PackageCheck,
    RotateCcw,
    Sparkles,
    Star,
    Tags,
} from "lucide-react"
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
import { businessHiredServiceTable } from "@/lib/db/schema/business-hired-service"
import { business } from "@/lib/db/schema/business"
import { db } from "@/lib/db"
import { and, count, desc, eq, sql } from "drizzle-orm"
import { getDeadlineInfo, type HiredServiceStatus } from "@/lib/hired-services/lifecycle"

export const metadata: Metadata = {
    title: "Designer Studio Dashboard — UNIFIÉE",
    description: "Manage your packaging design studio, active orders, and client revisions on UNIFIÉE.",
    robots: { index: false },
}

export const dynamic = "force-dynamic"

export default async function DesignerDashboardPage() {
    const designer = await getCurrentDesigner()
    const name = designer?.displayName || designer?.fullName || "Designer"
    const specializations = designer?.packagingDesignSpecializations ?? []

    let serviceCount = 0
    let servicePreview: any[] = []
    let ordersNeedingAction: any[] = []
    let stateCounts: Record<string, number> = {
        requested: 0,
        active: 0,
        delivered: 0,
        revision_requested: 0,
        completed: 0,
    }
    let totalCompletedValue = 0

    if (designer) {
        // Query listed services
        const [servicesRes, previewRes] = await Promise.all([
            db.select({ count: count() }).from(designerServiceTable).where(eq(designerServiceTable.designerId, designer.id)),
            db.select({
                id: designerServiceTable.id,
                slug: designerServiceTable.slug,
                title: designerServiceTable.title,
                category: designerServiceTable.category,
                price: designerServiceTable.price,
                sampleImages: designerServiceTable.sampleImages,
                status: designerServiceTable.status,
            })
                .from(designerServiceTable)
                .where(eq(designerServiceTable.designerId, designer.id))
                .orderBy(desc(designerServiceTable.createdAt))
                .limit(4),
        ])

        serviceCount = servicesRes[0]?.count ?? 0
        servicePreview = previewRes

        // Query orders for counts and actions
        const orders = await db
            .select({
                id: businessHiredServiceTable.id,
                serviceTitle: businessHiredServiceTable.serviceTitle,
                businessName: business.businessName,
                status: businessHiredServiceTable.status,
                dueAt: businessHiredServiceTable.dueAt,
                hiredAt: businessHiredServiceTable.hiredAt,
                price: businessHiredServiceTable.price,
                revisionsUsed: businessHiredServiceTable.revisionsUsed,
                revisionsIncluded: businessHiredServiceTable.revisionsIncluded,
            })
            .from(businessHiredServiceTable)
            .innerJoin(business, eq(businessHiredServiceTable.businessId, business.id))
            .where(eq(businessHiredServiceTable.designerId, designer.id))
            .orderBy(desc(businessHiredServiceTable.hiredAt))

        for (const o of orders) {
            stateCounts[o.status] = (stateCounts[o.status] || 0) + 1
            if (o.status === "completed") {
                totalCompletedValue += Number(o.price) || 0
            }

            // Flag orders needing action:
            // 1. requested
            // 2. revision_requested
            // 3. active and due soon or late
            const deadline = getDeadlineInfo(o.dueAt)
            if (
                o.status === "requested" ||
                o.status === "revision_requested" ||
                (o.status === "active" && (deadline.isLate || (deadline.daysRemaining !== null && deadline.daysRemaining <= 2)))
            ) {
                ordersNeedingAction.push({
                    ...o,
                    deadline,
                })
            }
        }
    }

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
        serviceCount === 0 && "your first published gig",
    ].filter((item): item is string => Boolean(item))

    const place = [designer?.city, designer?.state].filter(Boolean).join(", ")

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-7">
            <PageHeading
                eyebrow="Creative Workspace"
                title={`Good to have you here, ${name}.`}
                description="Manage your packaging gigs, respond to incoming business requests, and submit artwork deliverables."
            />

            {/* Studio Header Banner */}
            <section className="relative overflow-hidden rounded-2xl bg-primary px-6 py-7 text-primary-foreground sm:px-9 sm:py-8">
                <div className="pointer-events-none absolute -right-10 -top-24 size-72 rounded-full border border-primary-foreground/10" />
                <div className="pointer-events-none absolute -right-1 -top-16 size-52 rounded-full border border-primary-foreground/10" />
                <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                        <InitialsAvatar
                            name={name}
                            className="size-14 border-2 border-primary-foreground/20 bg-primary-foreground/15 text-lg text-primary-foreground"
                        />
                        <div>
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                                <AvailabilityBadge status={designer?.availabilityStatus ?? null} inverted />
                                {designer?.isVerified && (
                                    <span className="rounded-full bg-primary-foreground/15 px-2.5 py-1 text-xs font-medium text-primary-foreground">
                                        Verified designer
                                    </span>
                                )}
                            </div>
                            <h2 className="font-heading text-xl font-semibold">
                                {designer?.headline || "Your packaging design workspace."}
                            </h2>
                            <p className="mt-1 text-sm text-primary-foreground/70">
                                {place || "India"} · {designer?.yearsOfExperience ? `${designer.yearsOfExperience} years exp` : "Professional packaging designer"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/designer/services"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-foreground px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
                        >
                            <span>Manage Gigs</span>
                            <ArrowRight className="size-3.5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Quick Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Gigs listed"
                    value={String(serviceCount)}
                    detail="Individual service packages published"
                    icon={Tags}
                />
                <StatCard
                    label="Active orders"
                    value={String(stateCounts.active + stateCounts.revision_requested)}
                    detail="Contracts in progress"
                    icon={BriefcaseBusiness}
                    tone="secondary"
                />
                <StatCard
                    label="Completed orders"
                    value={String(stateCounts.completed)}
                    detail="Artwork deliveries accepted"
                    icon={CheckCircle2}
                    tone="accent"
                />
                <StatCard
                    label="Completed order value"
                    value={`₹${totalCompletedValue.toLocaleString("en-IN")}`}
                    detail="Total value of finished client contracts"
                    icon={CircleDollarSign}
                />
            </div>

            {/* Urgent: Orders Needing Action */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                            <AlertCircle className="size-4 text-amber-500" />
                            <span>Orders needing your action</span>
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            New requests requiring acceptance, revisions requested by clients, and approaching deadlines.
                        </p>
                    </div>
                    <Link
                        href="/designer/orders"
                        className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1"
                    >
                        <span>View all orders</span>
                        <ArrowRight className="size-3" />
                    </Link>
                </div>

                {ordersNeedingAction.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {ordersNeedingAction.map((o) => (
                            <Link
                                key={o.id}
                                href={`/designer/orders/${o.id}`}
                                className="group rounded-2xl border border-border/60 bg-card p-4 shadow-xs hover:border-blue-500/40 hover:shadow-sm transition-all space-y-3"
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                        o.status === "requested"
                                            ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                            : o.status === "revision_requested"
                                            ? "bg-orange-500/10 text-orange-600 border border-orange-500/20"
                                            : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                    }`}>
                                        {o.status === "requested" ? "New Request" : o.status === "revision_requested" ? "Revision Pass" : "Due Soon"}
                                    </span>
                                    <span className="font-heading text-xs font-bold text-foreground">
                                        ₹{Number(o.price).toLocaleString("en-IN")}
                                    </span>
                                </div>

                                <div className="space-y-0.5">
                                    <h3 className="font-heading text-xs font-semibold text-foreground line-clamp-1 group-hover:text-blue-500 transition-colors">
                                        {o.serviceTitle}
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground">{o.businessName}</p>
                                </div>

                                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                                    <span className={`flex items-center gap-1 ${o.deadline.isLate ? "text-rose-500 font-semibold" : ""}`}>
                                        <Clock3 className="size-3" />
                                        {o.deadline.label}
                                    </span>
                                    <span className="font-medium text-blue-500 group-hover:underline">Open &rarr;</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-card p-6 text-center text-xs text-muted-foreground">
                        <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-2" />
                        <p className="font-semibold text-foreground">You are completely up to date!</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                            No pending requests or urgent revision passes requiring your response.
                        </p>
                    </div>
                )}
            </section>

            {/* Main Grid: Listed Gigs & Profile Strength */}
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,0.85fr)]">
                <div className="space-y-5">
                    <SectionHeading
                        title="Your listed packaging gigs"
                        detail="Fiverr-style service offerings with Basic, Standard, and Premium packages."
                        href="/designer/services"
                        linkText="Manage all gigs"
                    />

                    {servicePreview.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {servicePreview.map((service) => (
                                <Link
                                    key={service.id}
                                    href="/designer/services"
                                    className="group overflow-hidden rounded-2xl border border-border/60 bg-card text-card-foreground shadow-xs transition-all hover:border-blue-500/40"
                                >
                                    {service.sampleImages[0] ? (
                                        <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
                                            <Image
                                                src={service.sampleImages[0]}
                                                alt={service.title}
                                                fill
                                                unoptimized
                                                className="object-cover"
                                            />
                                            <div className="absolute left-2.5 top-2.5">
                                                <span className="rounded-full bg-black/60 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                                                    {service.status}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex aspect-16/10 w-full items-center justify-center bg-muted text-muted-foreground">
                                            <ImageIcon className="size-7" />
                                        </div>
                                    )}

                                    <div className="p-4 space-y-2">
                                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider capitalize">
                                            {service.category?.replace(/_/g, " ") || "Packaging Design"}
                                        </span>
                                        <h3 className="font-heading font-semibold text-xs text-foreground line-clamp-1 group-hover:text-blue-500 transition-colors">
                                            {service.title}
                                        </h3>
                                        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/40">
                                            <span className="text-muted-foreground">Starting price</span>
                                            <span className="font-bold text-foreground">
                                                ₹{Number(service.price).toLocaleString("en-IN")}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-border/60 bg-card p-8 text-center text-xs text-muted-foreground space-y-2">
                            <Tags className="size-6 text-muted-foreground/40 mx-auto" />
                            <p className="font-semibold text-foreground">Create your first packaging gig</p>
                            <p>Tiered packages help businesses order dielines, labels, and 3D mockups effortlessly.</p>
                            <Link href="/designer/services" className="inline-block pt-1 font-semibold text-primary hover:underline">
                                Publish a gig &rarr;
                            </Link>
                        </div>
                    )}
                </div>

                <aside className="space-y-5">
                    <ProfileStrengthCard completion={completion} missing={missing} />

                    <section className="rounded-2xl border border-border/60 bg-card p-5 text-card-foreground shadow-xs space-y-4 text-xs">
                        <h2 className="font-heading font-semibold text-foreground text-sm">Studio Performance</h2>
                        <dl className="space-y-3">
                            <div className="flex justify-between border-b border-border/40 pb-2">
                                <dt className="text-muted-foreground">Completed Orders</dt>
                                <dd className="font-bold text-foreground">{stateCounts.completed}</dd>
                            </div>
                            <div className="flex justify-between border-b border-border/40 pb-2">
                                <dt className="text-muted-foreground">Active Work in Progress</dt>
                                <dd className="font-bold text-blue-500">{stateCounts.active + stateCounts.revision_requested}</dd>
                            </div>
                            <div className="flex justify-between border-b border-border/40 pb-2">
                                <dt className="text-muted-foreground">Platform Commission</dt>
                                <dd className="font-bold text-emerald-500">0% (Direct)</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Response Expectation</dt>
                                <dd className="font-medium text-foreground">&lt; 48 hours</dd>
                            </div>
                        </dl>
                    </section>
                </aside>
            </div>
        </div>
    )
}
