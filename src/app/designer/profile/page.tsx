import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, BriefcaseBusiness, Clock3, ExternalLink, Globe2, MapPin, Sparkles, Wrench } from "lucide-react"
import { AvailabilityBadge, InitialsAvatar, PageHeading } from "@/components/designer/dashboard-components"
import { DesignerProfileEditor } from "@/components/designer/designer-profile-editor"
import { getCurrentDesigner } from "@/lib/designer/get-current-designer"

export const metadata: Metadata = {
    title: "My Profile — UNIFIÉE Designer",
    description: "Review the professional profile and portfolio details on your UNIFIÉE designer account.",
    robots: { index: false },
}

const labelize = (value: string) =>
    value.split(/[-_]/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" ")

export default async function DesignerProfilePage() {
    const designer = await getCurrentDesigner()
    const name = designer?.displayName || designer?.fullName || "Designer"
    const location = [designer?.city, designer?.state, designer?.country].filter(Boolean).join(", ")
    const links = [
        ["Behance", designer?.additionalLinks?.behance],
        ["Dribbble", designer?.additionalLinks?.dribbble],
        ["Instagram", designer?.additionalLinks?.instagram],
        ["LinkedIn", designer?.additionalLinks?.linkedin],
        ["Website", designer?.additionalLinks?.website],
    ].filter((entry): entry is [string, string] => Boolean(entry[1]))

    return (
        <div className="mx-auto w-full max-w-[1440px] space-y-7">
            <PageHeading
                eyebrow="Your public presence"
                title="Designer profile"
                description="The introduction, experience, and service details that help brands get to know your studio."
                action={designer ? (
                    <div className="flex flex-wrap gap-2">
                        <DesignerProfileEditor designer={designer} />
                        <Link href={`/designers/${designer.id}`} className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                            <ExternalLink className="size-4" /> View public profile
                        </Link>
                    </div>
                ) : undefined}
            />

            <section className="overflow-hidden rounded-xl border bg-card text-card-foreground">
                <div className="h-28 bg-muted" />
                <div className="px-5 pb-6 sm:px-8">
                    <div className="-mt-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-end gap-4">
                            <InitialsAvatar name={name} className="size-[4.5rem] border-4 border-card bg-primary/10 text-xl shadow-sm" />
                            <div className="pb-1">
                                <h2 className="font-heading text-xl font-semibold text-foreground">{name}</h2>
                                {location && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3.5" />{location}</p>}
                            </div>
                        </div>
                        <AvailabilityBadge status={designer?.availabilityStatus ?? null} />
                    </div>
                    <div className="mt-5 max-w-3xl">
                        <h3 className="font-heading text-lg font-semibold text-foreground">{designer?.headline || "Packaging designer"}</h3>
                        <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{designer?.bio || "Add a short introduction so brands can learn about your approach, experience, and what makes your studio a great fit."}</p>
                    </div>
                </div>
            </section>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.75fr)]">
                <div className="space-y-5">
                    <section className="rounded-xl border bg-card p-5 text-card-foreground sm:p-6">
                        <div className="flex items-center gap-2">
                            <BriefcaseBusiness className="size-4 text-primary" />
                            <h2 className="font-heading font-semibold text-foreground">Packaging design specialties</h2>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {(designer?.packagingDesignSpecializations ?? []).length ? designer?.packagingDesignSpecializations?.map((item) => (
                                <span key={item} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">{labelize(item)}</span>
                            )) : <p className="text-sm text-muted-foreground">No packaging specialties added yet.</p>}
                        </div>
                    </section>

                    <section className="rounded-xl border bg-card p-5 text-card-foreground sm:p-6">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4 text-primary" />
                            <h2 className="font-heading font-semibold text-foreground">Industries & design experience</h2>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {(designer?.industriesServed ?? []).length ? designer?.industriesServed?.map((item) => (
                                <span key={item} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">{labelize(item)}</span>
                            )) : <p className="text-sm text-muted-foreground">No industries added yet.</p>}
                        </div>
                        <div className="mt-5 border-t pt-4 text-sm text-muted-foreground">
                            {designer?.yearsOfExperience !== null && designer?.yearsOfExperience !== undefined
                                ? `${designer.yearsOfExperience} years of professional experience`
                                : "Experience details not provided"}
                        </div>
                    </section>

                    <section className="rounded-xl border bg-card p-5 text-card-foreground sm:p-6">
                        <div className="flex items-center gap-2">
                            <Wrench className="size-4 text-primary" />
                            <h2 className="font-heading font-semibold text-foreground">Tools & languages</h2>
                        </div>
                        <div className="mt-4 grid gap-5 sm:grid-cols-2">
                            <div>
                                <p className="mb-2 text-xs font-medium text-muted-foreground">Design tools</p>
                                <div className="flex flex-wrap gap-2">
                                    {(designer?.softwareTools ?? []).length ? designer?.softwareTools?.map((tool) => (
                                        <span key={tool} className="rounded-md border px-2.5 py-1.5 text-xs text-foreground">{labelize(tool)}</span>
                                    )) : <p className="text-sm text-muted-foreground">No tools listed.</p>}
                                </div>
                            </div>
                            <div>
                                <p className="mb-2 text-xs font-medium text-muted-foreground">Languages</p>
                                <div className="flex flex-wrap gap-2">
                                    {(designer?.languages ?? []).length ? designer?.languages?.map((language) => (
                                        <span key={language} className="rounded-md border px-2.5 py-1.5 text-xs text-foreground">{labelize(language)}</span>
                                    )) : <p className="text-sm text-muted-foreground">No languages listed.</p>}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <aside className="space-y-5">
                    <section className="rounded-xl border bg-card p-5 text-card-foreground">
                        <h2 className="font-heading font-semibold text-foreground">Project details</h2>
                        <dl className="mt-4 space-y-4">
                            <div className="flex items-start justify-between gap-3 border-b pb-3">
                                <dt className="text-xs text-muted-foreground">Pricing model</dt>
                                <dd className="text-right text-sm font-medium text-foreground">{designer?.pricingModel ? labelize(designer.pricingModel) : "Not set"}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3 border-b pb-3">
                                <dt className="text-xs text-muted-foreground">Starting price</dt>
                                <dd className="text-right text-sm font-medium text-foreground">{designer?.startingPrice ? `₹${Number(designer.startingPrice).toLocaleString("en-IN")}` : "Not set"}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3 border-b pb-3">
                                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="size-3.5" />Turnaround</dt>
                                <dd className="text-right text-sm font-medium text-foreground">{designer?.turnaroundTime || "Not set"}</dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <dt className="text-xs text-muted-foreground">Revisions included</dt>
                                <dd className="text-right text-sm font-medium text-foreground">{designer?.revisionsIncluded ?? "Not set"}</dd>
                            </div>
                        </dl>
                    </section>

                    <section className="rounded-xl border bg-card p-5 text-card-foreground">
                        <div className="flex items-center gap-2">
                            <Globe2 className="size-4 text-primary" />
                            <h2 className="font-heading font-semibold text-foreground">Around the web</h2>
                        </div>
                        <div className="mt-4 space-y-3">
                            {designer?.portfolioUrl && (
                                <a href={designer.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3.5 py-3 text-sm font-medium text-foreground hover:bg-accent">
                                    <span>Portfolio & work samples</span><ArrowUpRight className="size-4" />
                                </a>
                            )}
                            {links.map(([label, url]) => (
                                <a key={label} href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3.5 py-3 text-sm font-medium text-foreground hover:bg-accent">
                                    <span>{label}</span><ArrowUpRight className="size-4" />
                                </a>
                            ))}
                            {!designer?.portfolioUrl && links.length === 0 && <p className="text-sm text-muted-foreground">No portfolio links added yet.</p>}
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    )
}
