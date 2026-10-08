"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowUpRight, Check, Clock3, MapPin, RotateCcw, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InitialsAvatar } from "@/components/designer/dashboard-components"
import { TrackServiceButton } from "@/components/business/track-service-button"
import type { DesignerListing } from "@/lib/business/marketplace"

function formatServiceType(value: string) {
    return value.split(/[-_]/).filter(Boolean).map((part) => part[0].toUpperCase() + part.slice(1)).join(" ")
}

function formatPrice(value: string) {
    const amount = Number(value)
    return Number.isFinite(amount) ? `₹${amount.toLocaleString("en-IN")}` : "Contact for pricing"
}

export function DesignerMarketplace({
    listings,
    trackedServiceIds = [],
    limit,
}: {
    listings: DesignerListing[]
    trackedServiceIds?: string[]
    limit?: number
}) {
    const [search, setSearch] = useState("")
    const [selectedSpecialty, setSelectedSpecialty] = useState("All")
    const specialties = useMemo(
        () => ["All", ...Array.from(new Set(listings.flatMap((listing) => listing.specializations)))],
        [listings],
    )
    const filteredListings = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()
        return listings.filter((listing) => {
            const matchesSpecialty = selectedSpecialty === "All" || listing.specializations.includes(selectedSpecialty)
            const searchable = [
                listing.designerName,
                listing.serviceTitle,
                listing.description,
                listing.headline ?? "",
                listing.city ?? "",
                ...listing.specializations,
                ...listing.deliverables,
            ].join(" ").toLowerCase()
            return matchesSpecialty && (!normalizedSearch || searchable.includes(normalizedSearch))
        })
    }, [listings, search, selectedSpecialty])
    const visibleListings = limit ? filteredListings.slice(0, limit) : filteredListings

    return (
        <div className="space-y-5">
            <p className="text-xs text-muted-foreground">
                After hiring a designer directly, select “Track as hired” to manage the service here. Tracking does not place an order or process payment.
            </p>
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search services, designers, or deliverables"
                    className="h-11 pl-9"
                    aria-label="Search designer services"
                />
            </div>
            {specialties.length > 1 && (
                <div className="flex flex-wrap gap-2">
                    {specialties.map((specialty) => (
                        <Button
                            key={specialty}
                            type="button"
                            size="sm"
                            variant={selectedSpecialty === specialty ? "default" : "outline"}
                            onClick={() => setSelectedSpecialty(specialty)}
                        >
                            {specialty === "All" ? specialty : formatServiceType(specialty)}
                        </Button>
                    ))}
                </div>
            )}

            {visibleListings.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {visibleListings.map((listing) => {
                        const isTracked = trackedServiceIds.includes(listing.serviceId)
                        const place = [listing.city, listing.state].filter(Boolean).join(", ")
                        return (
                            <article key={listing.serviceId} className="flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground transition-shadow hover:shadow-md">
                                <Link href={`/designers/${listing.designerId}`} className="group block">
                                    {listing.sampleImages[0] ? (
                                        <div className="relative h-48 bg-muted">
                                            <Image src={listing.sampleImages[0]} alt={`${listing.serviceTitle} portfolio sample`} fill unoptimized className="object-cover transition-transform group-hover:scale-[1.02]" />
                                        </div>
                                    ) : (
                                        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-primary/10 via-muted to-secondary/70">
                                            <Sparkles className="size-8 text-primary/60" />
                                        </div>
                                    )}
                                    <div className="p-4 pb-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium uppercase tracking-wide text-primary">{formatServiceType(listing.serviceType)}</p>
                                                <h2 className="mt-1 line-clamp-2 font-heading text-lg font-semibold group-hover:text-primary">{listing.serviceTitle}</h2>
                                            </div>
                                            <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-medium">{formatPrice(listing.price)}</span>
                                        </div>
                                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">{listing.description}</p>
                                    </div>
                                </Link>

                                <div className="mt-auto space-y-3 px-4 pb-4 pt-2">
                                    <div className="flex items-center gap-2 border-t pt-3">
                                        {listing.profilePhotoUrl ? (
                                            <Image src={listing.profilePhotoUrl} alt="" width={36} height={36} unoptimized className="size-9 rounded-full object-cover" />
                                        ) : (
                                            <InitialsAvatar name={listing.designerName} className="size-9 text-xs" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold">
                                                {listing.designerName}
                                                {listing.isVerified && <Check className="ml-1 inline size-3.5 text-primary" aria-label="Verified designer" />}
                                            </p>
                                            {place && <p className="flex items-center gap-1 truncate text-xs text-muted-foreground"><MapPin className="size-3" />{place}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{listing.turnaroundDays} days</span>
                                        <span className="inline-flex items-center gap-1"><RotateCcw className="size-3.5" />{listing.revisionsIncluded} revisions</span>
                                        <span className="truncate">{listing.availabilityStatus === "available" ? "Available" : listing.availabilityStatus === "limited" ? "Limited availability" : "Not taking projects"}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button asChild variant="outline" className="flex-1">
                                            <Link href={`/designers/${listing.designerId}`}>Profile <ArrowUpRight className="size-4" /></Link>
                                        </Button>
                                        {listing.availabilityStatus !== "unavailable" ? (
                                            <Button asChild variant="outline" className="flex-1">
                                                <a href={`mailto:${listing.email}?subject=${encodeURIComponent(`Project inquiry: ${listing.serviceTitle}`)}`}>Contact designer</a>
                                            </Button>
                                        ) : (
                                            <Button disabled variant="outline" className="flex-1">Unavailable</Button>
                                        )}
                                        <TrackServiceButton serviceId={listing.serviceId} tracked={isTracked} />
                                    </div>
                                </div>
                            </article>
                        )
                    })}
                </div>
            ) : (
                <div className="rounded-xl border border-dashed bg-card px-6 py-12 text-center">
                    <Search className="mx-auto size-8 text-muted-foreground" />
                    <h2 className="mt-3 font-heading text-lg font-semibold">No matching design services</h2>
                    <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                        Try a different search or specialty. New designer services will show up here as they are published.
                    </p>
                </div>
            )}
        </div>
    )
}
