import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowUpRight, BriefcaseBusiness, Building2, Clock3, MapPin, RotateCcw, Wrench } from "lucide-react"
import { AvailabilityBadge, InitialsAvatar } from "@/components/designer/dashboard-components"
import { db } from "@/lib/db"
import { designerServiceTable } from "@/lib/db/schema/designer-service"
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer"
import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"

type PublicDesignerPageProps = {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PublicDesignerPageProps): Promise<Metadata> {
    const { id } = await params
    if (!z.string().uuid().safeParse(id).success) return { title: "Designer profile — UNIFIÉE" }

    const [designer] = await db
        .select({
            displayName: packagingDesignerTable.displayName,
            fullName: packagingDesignerTable.fullName,
            headline: packagingDesignerTable.headline,
        })
        .from(packagingDesignerTable)
        .where(and(
            eq(packagingDesignerTable.id, id),
            eq(packagingDesignerTable.isActive, true),
        ))
        .limit(1)

    const name = designer?.displayName || designer?.fullName || "Packaging designer"
    return {
        title: `${name} — UNIFIÉE Designer`,
        description: designer?.headline || `Explore packaging design services by ${name}.`,
    }
}

const labelize = (value: string) =>
    value.split(/[-_]/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" ")

const serviceTypeLabels: Record<string, string> = {
    packaging_design: "Packaging design",
    label_design: "Label design",
    brand_identity: "Brand identity",
    "3d_rendering": "3D rendering",
    print_ready_artwork: "Print-ready artwork",
}

const pricingLabels: Record<string, string> = {
    per_project: "per project",
    per_design: "per design",
    hourly: "per hour",
}

export default async function PublicDesignerProfilePage({ params }: PublicDesignerPageProps) {
    const { id } = await params
    if (!z.string().uuid().safeParse(id).success) notFound()

    const [designer] = await db
        .select()
        .from(packagingDesignerTable)
        .where(and(
            eq(packagingDesignerTable.id, id),
            eq(packagingDesignerTable.isActive, true),
        ))
        .limit(1)

    if (!designer) notFound()

    const services = await db
        .select()
        .from(designerServiceTable)
        .where(and(
            eq(designerServiceTable.designerId, designer.id),
            eq(designerServiceTable.status, "published"),
        ))
        .orderBy(asc(designerServiceTable.createdAt))

    const name = designer.displayName || designer.fullName
    const location = [designer.city, designer.state, designer.country].filter(Boolean).join(", ")
    const startingRate = designer.startingPrice ? Number(designer.startingPrice) : null
    const socialLinks = [
        ["Behance", designer.additionalLinks?.behance],
        ["Dribbble", designer.additionalLinks?.dribbble],
        ["Instagram", designer.additionalLinks?.instagram],
        ["LinkedIn", designer.additionalLinks?.linkedin],
        ["Website", designer.additionalLinks?.website],
    ].filter((entry): entry is [string, string] => Boolean(entry[1]))

    return (
        <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
            <section className="overflow-hidden rounded-2xl border bg-card text-card-foreground">
                <div className="h-36 bg-muted sm:h-48" />
                <div className="px-5 pb-7 sm:px-8">
                    <div className="-mt-10 flex flex-col justify-between gap-5 sm:-mt-12 sm:flex-row sm:items-end">
                        <div className="flex items-end gap-4">
                            {designer.profilePhotoUrl ? (
                                <Image
                                    src={designer.profilePhotoUrl}
                                    alt={name}
                                    width={96}
                                    height={96}
                                    unoptimized
                                    className="size-20 rounded-xl border-4 border-card bg-background object-cover sm:size-24"
                                />
                            ) : (
                                <InitialsAvatar name={name} className="size-20 rounded-xl border-4 border-card text-2xl sm:size-24" />
                            )}
                            <div className="pb-1">
                                <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{name}</h1>
                                {location && (
                                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <MapPin className="size-4" />
                                        {location}
                                    </p>
                                )}
                            </div>
                        </div>
                        <AvailabilityBadge status={designer.availabilityStatus} />
                    </div>
                    <div className="mt-6 max-w-3xl">
                        <p className="text-sm font-medium text-primary">Packaging designer</p>
                        <h2 className="mt-1 font-heading text-xl font-semibold">{designer.headline || "Packaging design for thoughtful brands"}</h2>
                        {designer.bio && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{designer.bio}</p>}
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-[minmax(180px,0.65fr)_minmax(0,1.35fr)]">
                <article className="flex items-center gap-4 rounded-xl border bg-card p-5">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <BriefcaseBusiness className="size-5" />
                    </span>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">Professional experience</p>
                        <p className="mt-1 font-heading text-xl font-semibold">
                            {designer.yearsOfExperience !== null && designer.yearsOfExperience !== undefined
                                ? `${designer.yearsOfExperience} ${designer.yearsOfExperience === 1 ? "year" : "years"}`
                                : "Not specified"}
                        </p>
                    </div>
                </article>
                <article className="rounded-xl border bg-card p-5">
                    <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-primary" />
                        <h2 className="font-heading font-semibold">Industry experience</h2>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {designer.industriesServed?.length ? designer.industriesServed.map((industry) => (
                            <span key={industry} className="rounded-md bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground">{labelize(industry)}</span>
                        )) : <p className="text-sm text-muted-foreground">No industries listed yet.</p>}
                    </div>
                </article>
            </section>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.75fr)]">
                <section className="space-y-5">
                    <div>
                        <h2 className="font-heading text-xl font-semibold">Services</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Browse the services this designer currently offers.</p>
                    </div>
                    {services.length ? (
                        <div className="grid gap-5 md:grid-cols-2">
                            {services.map((service) => (
                                <article key={service.id} className="overflow-hidden rounded-xl border bg-card text-card-foreground">
                                    {service.sampleImages.length ? (
                                        <div className="grid h-44 grid-cols-2 gap-1 overflow-hidden bg-muted">
                                            {service.sampleImages.slice(0, 2).map((imageUrl, index) => (
                                                <Image
                                                    key={`${service.id}-${imageUrl}`}
                                                    src={imageUrl}
                                                    alt={`${service.title} sample ${index + 1}`}
                                                    width={640}
                                                    height={360}
                                                    unoptimized
                                                    className="h-full w-full object-cover"
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex h-44 items-center justify-center bg-muted text-muted-foreground">
                                            <BriefcaseBusiness className="size-8" />
                                        </div>
                                    )}
                                    <div className="space-y-4 p-5">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground">{serviceTypeLabels[service.serviceType] ?? labelize(service.serviceType)}</p>
                                            <h3 className="mt-1 font-heading text-lg font-semibold">{service.title}</h3>
                                        </div>
                                        <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{service.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {service.deliverables.map((deliverable) => (
                                                <span key={deliverable} className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">{deliverable}</span>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between gap-3 border-t pt-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Starting at</p>
                                                <p className="mt-1 font-heading text-xl font-semibold">
                                                    ₹{Number(service.price).toLocaleString("en-IN")}
                                                    <span className="ml-1 text-xs font-normal text-muted-foreground">{pricingLabels[service.pricingModel]}</span>
                                                </p>
                                            </div>
                                            <div className="space-y-1 text-right text-xs text-muted-foreground">
                                                <p className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{service.turnaroundDays} days</p>
                                                <p className="inline-flex items-center gap-1"><RotateCcw className="size-3.5" />{service.revisionsIncluded} revisions</p>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed bg-card px-6 py-10 text-center">
                            <h3 className="font-heading font-semibold">No services listed yet</h3>
                            <p className="mt-2 text-sm text-muted-foreground">This designer has not published a service offering.</p>
                        </div>
                    )}
                </section>

                <aside className="space-y-5">
                    <section className="rounded-xl border bg-card p-5">
                        <div className="flex items-center gap-2">
                            <BriefcaseBusiness className="size-4 text-primary" />
                            <h2 className="font-heading font-semibold">Packaging expertise</h2>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {(designer.packagingDesignSpecializations ?? []).map((specialty) => (
                                <span key={specialty} className="rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary">{labelize(specialty)}</span>
                            ))}
                            {!designer.packagingDesignSpecializations?.length && <p className="text-sm text-muted-foreground">No specialties listed.</p>}
                        </div>
                    </section>

                    {(designer.softwareTools?.length ?? 0) > 0 && (
                        <section className="rounded-xl border bg-card p-5">
                            <h2 className="flex items-center gap-2 font-heading font-semibold"><Wrench className="size-4 text-primary" />Design tools</h2>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {designer.softwareTools?.map((tool) => (
                                    <span key={tool} className="rounded-md border px-2.5 py-1.5 text-xs">{labelize(tool)}</span>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="space-y-4 rounded-xl border bg-card p-5">
                        <h2 className="font-heading font-semibold">Rates & portfolio</h2>
                        <div>
                            <p className="text-xs text-muted-foreground">Starting rate · {pricingLabels[designer.pricingModel ?? ""] ?? "per project"}</p>
                            <p className="mt-1 font-heading text-2xl font-semibold">
                                {startingRate && startingRate > 0
                                    ? `₹${startingRate.toLocaleString("en-IN")}`
                                    : "Project-dependent"}
                            </p>
                        </div>
                        {designer.hourlyRate && (
                            <p className="text-sm text-muted-foreground">Hourly rate: <span className="font-medium text-foreground">₹{Number(designer.hourlyRate).toLocaleString("en-IN")}</span></p>
                        )}
                        {designer.chargesNotes && <p className="text-sm leading-6 text-muted-foreground">{designer.chargesNotes}</p>}
                        {designer.turnaroundTime && <p className="text-sm text-muted-foreground">Typical turnaround: {designer.turnaroundTime}</p>}
                        <div className="flex flex-wrap gap-3 border-t pt-4">
                            <a href={designer.portfolioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                                Portfolio <ArrowUpRight className="size-4" />
                            </a>
                            {socialLinks.map(([label, url]) => (
                                <a key={label} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                                    {label} <ArrowUpRight className="size-3.5" />
                                </a>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    )
}
