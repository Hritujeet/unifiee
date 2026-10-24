"use client"

import { useState, useTransition } from "react"
import { Sparkles, ChevronDown, Loader2, X, Brain, Check, Clock3, RotateCcw, MapPin, Star, Mail, Copy, ArrowUpRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { InitialsAvatar } from "@/components/designer/dashboard-components"
import { TrackServiceButton } from "@/components/business/track-service-button"
import { toast } from "sonner"
import Image from "next/image"
import Link from "next/link"
import type { BusinessRequirement } from "@/lib/db/schema/business-requirement"
import type { DesignerListing } from "@/lib/business/marketplace"

interface MatchedListing extends DesignerListing {
    matchScore: number
}

interface Props {
    requirements: BusinessRequirement[]
    trackedServiceIds?: string[]
    onResultsChange?: (listings: MatchedListing[] | null) => void
}

function formatPrice(value: string) {
    const amount = Number(value)
    return Number.isFinite(amount) ? `₹${amount.toLocaleString("en-IN")}` : "Contact for pricing"
}

function matchLabel(score: number): { label: string; color: string } {
    if (score >= 0.75) return { label: "Excellent match", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" }
    if (score >= 0.55) return { label: "Strong match", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" }
    if (score >= 0.40) return { label: "Good match", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" }
    return { label: "Potential match", color: "text-muted-foreground bg-muted border-border/60" }
}

export function RequirementSmartMatch({ requirements, trackedServiceIds = [], onResultsChange }: Props) {
    const [selectedId, setSelectedId] = useState<string>("")
    const [results, setResults] = useState<MatchedListing[] | null>(null)
    const [requirementTitle, setRequirementTitle] = useState<string>("")
    const [isPending, startTransition] = useTransition()
    const [contactListing, setContactListing] = useState<MatchedListing | null>(null)

    const selectedRequirement = requirements.find((r) => r.id === selectedId)

    const handleSearch = () => {
        if (!selectedId) {
            toast.error("Please select a saved requirement first.")
            return
        }

        startTransition(async () => {
            try {
                const res = await fetch("/api/ai/requirements/search-designers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ requirementId: selectedId, limit: 10 }),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Search failed.")

                const listings: MatchedListing[] = data.listings ?? []
                setResults(listings)
                setRequirementTitle(data.requirementTitle ?? "")
                onResultsChange?.(listings)

                if (listings.length === 0) {
                    toast.info("No matching designer services found for this requirement yet. Services are indexed as designers publish them.")
                } else {
                    toast.success(`Found ${listings.length} matching designer${listings.length !== 1 ? "s" : ""} for your requirement.`)
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Smart search failed."
                toast.error(msg)
            }
        })
    }

    const handleClear = () => {
        setResults(null)
        setRequirementTitle("")
        setSelectedId("")
        onResultsChange?.(null)
    }

    const copyEmail = (email: string) => {
        navigator.clipboard.writeText(email)
        toast.success("Email copied!", { description: email })
    }

    if (requirements.length === 0) return null

    return (
        <div className="space-y-4">
            {/* Smart Match Panel */}
            <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-card to-card p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2.5">
                        <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/15">
                                <Brain className="size-4 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground leading-tight">Smart Requirement Match</p>
                                <p className="text-[11px] text-muted-foreground">Uses AI to find designers whose services align with your saved packaging requirement</p>
                            </div>
                        </div>

                        {/* Requirement selector */}
                        <div className="relative">
                            <select
                                value={selectedId}
                                onChange={(e) => setSelectedId(e.target.value)}
                                disabled={isPending}
                                aria-label="Select a saved requirement"
                                className="w-full appearance-none rounded-xl border border-border/60 bg-background/70 px-4 py-2.5 pr-9 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50"
                            >
                                <option value="">— Select a saved requirement —</option>
                                {requirements.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.title} · {r.packagingType} · {r.packagingUse}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        </div>

                        {/* Requirement details pill */}
                        {selectedRequirement && (
                            <div className="flex flex-wrap gap-1.5 text-[11px]">
                                <span className="rounded-full border border-border/60 bg-muted px-2.5 py-0.5 text-muted-foreground capitalize">{selectedRequirement.packagingUse}</span>
                                <span className="rounded-full border border-border/60 bg-muted px-2.5 py-0.5 text-muted-foreground capitalize">{selectedRequirement.packagingType}</span>
                                <span className="rounded-full border border-border/60 bg-muted px-2.5 py-0.5 text-muted-foreground">{selectedRequirement.material}</span>
                                {selectedRequirement.brandingNeeded && (
                                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-blue-500">Custom branding</span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:flex-col sm:items-stretch">
                        <Button
                            onClick={handleSearch}
                            disabled={!selectedId || isPending}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-10 gap-2 min-w-[160px]"
                            size="sm"
                        >
                            {isPending ? (
                                <><Loader2 className="size-3.5 animate-spin" />Searching…</>
                            ) : (
                                <><Zap className="size-3.5" />Find Matching Designers</>
                            )}
                        </Button>
                        {results !== null && (
                            <Button
                                onClick={handleClear}
                                variant="outline"
                                size="sm"
                                className="text-xs h-10 border-border/60"
                            >
                                <X className="size-3.5 mr-1" /> Clear
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results Banner */}
            {results !== null && (
                <div className="space-y-4">
                    {results.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                    <Sparkles className="size-4 text-blue-500" />
                                    <span className="font-semibold text-foreground">{results.length} matched</span>
                                    <span className="text-muted-foreground">for &ldquo;{requirementTitle}&rdquo;</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] font-medium border-blue-500/30 text-blue-500 bg-blue-500/5">
                                    AI-ranked by relevance
                                </Badge>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {results.map((listing) => {
                                    const isTracked = trackedServiceIds.includes(listing.serviceId)
                                    const place = [listing.city, listing.state].filter(Boolean).join(", ")
                                    const { label: matchLbl, color: matchColor } = matchLabel(listing.matchScore)
                                    const pct = Math.round(listing.matchScore * 100)

                                    return (
                                        <article
                                            key={listing.serviceId}
                                            className="group relative flex flex-col rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-md"
                                        >
                                            {/* Match score banner */}
                                            <div className="flex items-center justify-between rounded-t-2xl border-b border-border/40 bg-muted/30 px-4 py-2">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${matchColor}`}>
                                                    <Sparkles className="size-3" />
                                                    {matchLbl}
                                                </span>
                                                <span className="text-[11px] font-bold tabular-nums text-foreground/60">{pct}% match</span>
                                            </div>

                                            {/* Card body */}
                                            <div className="flex flex-1 flex-col p-5">
                                                <h3 className="font-heading text-sm font-semibold leading-snug text-foreground group-hover:text-blue-500 transition-colors line-clamp-2">
                                                    {listing.serviceTitle}
                                                </h3>
                                                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                                                    {listing.description}
                                                </p>

                                                {/* Pricing + turnaround row */}
                                                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                                                    <span className="font-bold text-foreground">{formatPrice(listing.price)}</span>
                                                    <span className="text-muted-foreground/60">·</span>
                                                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                        <Clock3 className="size-3 text-blue-400" />{listing.turnaroundDays} days
                                                    </span>
                                                    <span className="text-muted-foreground/60">·</span>
                                                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                                                        <RotateCcw className="size-3 text-blue-400" />{listing.revisionsIncluded} revisions
                                                    </span>
                                                </div>

                                                {/* Deliverable tags */}
                                                {listing.deliverables.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                                        {listing.deliverables.slice(0, 3).map((item, i) => (
                                                            <span
                                                                key={i}
                                                                className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                                                            >
                                                                <Check className="size-2.5 text-blue-500" />{item}
                                                            </span>
                                                        ))}
                                                        {listing.deliverables.length > 3 && (
                                                            <span className="rounded-md border border-border/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                                +{listing.deliverables.length - 3} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Designer footer */}
                                                <div className="mt-4 border-t border-border/50 pt-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            {listing.profilePhotoUrl ? (
                                                                <Image
                                                                    src={listing.profilePhotoUrl}
                                                                    alt={listing.designerName}
                                                                    width={28}
                                                                    height={28}
                                                                    unoptimized
                                                                    className="size-7 rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <InitialsAvatar name={listing.designerName} className="size-7 text-[10px]" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="truncate text-xs font-semibold text-foreground flex items-center gap-1">
                                                                    {listing.designerName}
                                                                    {listing.isVerified && (
                                                                        <span className="inline-flex size-3 items-center justify-center rounded-full bg-blue-500 text-white text-[8px]">✓</span>
                                                                    )}
                                                                </p>
                                                                {place ? (
                                                                    <p className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                                                        <MapPin className="size-2.5" />{place}
                                                                    </p>
                                                                ) : (
                                                                    <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                                                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />Available now
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                                                            <Star className="size-3 fill-amber-500" /><span>4.9</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="mt-3 flex items-center gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 text-xs h-8 border-border/60"
                                                        onClick={() => setContactListing(listing)}
                                                    >
                                                        <Mail className="size-3.5 mr-1 text-blue-500" />Contact
                                                    </Button>
                                                    {!listing.designerId.startsWith("showcase") && (
                                                        <Button asChild variant="ghost" size="sm" className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground">
                                                            <Link href={`/designers/${listing.designerId}`}>
                                                                <ArrowUpRight className="size-4" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    <div className="flex-1">
                                                        <TrackServiceButton serviceId={listing.serviceId} tracked={isTracked} />
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                                <Brain className="size-6 text-muted-foreground" />
                            </div>
                            <h3 className="mt-4 font-heading text-sm font-semibold text-foreground">No matches found yet</h3>
                            <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
                                Designer services are indexed as they are published. Check back after more designers have joined the platform, or browse the full marketplace below.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Inline contact dialog */}
            {contactListing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setContactListing(null)}>
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-heading text-base font-semibold flex items-center gap-2">
                                    <Mail className="size-4 text-blue-500" />Contact {contactListing.designerName}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">{contactListing.serviceTitle}</p>
                            </div>
                            <button onClick={() => setContactListing(null)} className="text-muted-foreground hover:text-foreground">
                                <X className="size-4" />
                            </button>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs">
                            <span className="text-muted-foreground">Designer email:</span>
                            <div className="flex items-center gap-2">
                                <span className="font-mono font-medium">{contactListing.email}</span>
                                <button onClick={() => copyEmail(contactListing.email)} className="text-muted-foreground hover:text-foreground">
                                    <Copy className="size-3.5" />
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="text-xs" onClick={() => copyEmail(contactListing.email)}>
                                <Copy className="size-3.5 mr-1" />Copy Email
                            </Button>
                            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                                <a href={`mailto:${contactListing.email}?subject=Packaging Project Inquiry: ${encodeURIComponent(contactListing.serviceTitle)}&body=${encodeURIComponent(`Hi ${contactListing.designerName},\n\nI found your "${contactListing.serviceTitle}" service on UNIFIÉE and believe it aligns with our packaging requirement "${requirementTitle}". We would like to discuss scope, deliverables, and timeline.\n\nLooking forward to hearing from you!`)}`}>
                                    <Mail className="size-3.5 mr-1" />Open Mail
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
