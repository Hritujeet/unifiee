"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import {
    ArrowUpRight,
    Boxes,
    Check,
    Clock3,
    Copy,
    Mail,
    MapPin,
    Package,
    Palette,
    RotateCcw,
    Search,
    Send,
    ShieldCheck,
    Sparkles,
    Star,
    Tag,
    X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { InitialsAvatar } from "@/components/designer/dashboard-components"
import { TrackServiceButton } from "@/components/business/track-service-button"
import type { DesignerListing } from "@/lib/business/marketplace"

function formatServiceType(value: string) {
    return value
        .split(/[-_]/)
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join(" ")
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
    const allListings = listings

    const [search, setSearch] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [selectedModel, setSelectedModel] = useState("all")
    const [maxTurnaround, setMaxTurnaround] = useState<number | "all">("all")
    const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc" | "turnaround">("featured")

    // Contact modal state
    const [contactListing, setContactListing] = useState<DesignerListing | null>(null)
    const [inquirySubject, setInquirySubject] = useState("")
    const [inquiryMessage, setInquiryMessage] = useState("")

    const openContactDialog = (listing: DesignerListing) => {
        setContactListing(listing)
        setInquirySubject(`Packaging Project Inquiry: ${listing.serviceTitle}`)
        setInquiryMessage(
            `Hi ${listing.designerName},\n\nI discovered your "${listing.serviceTitle}" service on UNIFIÉE. We are looking to develop packaging for our product and would like to discuss deliverables, scope, and timeline.\n\nLooking forward to hearing from you!`
        )
    }

    const copyDesignerEmail = (email: string) => {
        navigator.clipboard.writeText(email)
        toast.success("Designer email copied to clipboard!", { description: email })
    }

    const categories = [
        { id: "all", label: "All Services", icon: Sparkles },
        { id: "packaging_design", label: "Box & Cartons", icon: Package },
        { id: "label_design", label: "Labels & Bottles", icon: Tag },
        { id: "3d_rendering", label: "3D Renders", icon: Boxes },
        { id: "brand_identity", label: "Brand & Artwork", icon: Palette },
    ]

    const filteredListings = useMemo(() => {
        const query = search.trim().toLowerCase()
        return allListings
            .filter((item) => {
                // Category filter
                const matchesCategory =
                    selectedCategory === "all" ||
                    item.serviceType.toLowerCase() === selectedCategory.toLowerCase() ||
                    item.specializations.some((s) => s.toLowerCase().includes(selectedCategory.toLowerCase()))

                // Pricing model filter
                const matchesModel =
                    selectedModel === "all" ||
                    item.pricingModel.toLowerCase() === selectedModel.toLowerCase()

                // Turnaround filter
                const matchesTurnaround =
                    maxTurnaround === "all" || item.turnaroundDays <= maxTurnaround

                // Search query
                const searchableText = [
                    item.designerName,
                    item.serviceTitle,
                    item.description,
                    item.headline ?? "",
                    item.city ?? "",
                    item.state ?? "",
                    item.serviceType,
                    ...item.specializations,
                    ...item.deliverables,
                ]
                    .join(" ")
                    .toLowerCase()

                const matchesSearch = !query || searchableText.includes(query)

                return matchesCategory && matchesModel && matchesTurnaround && matchesSearch
            })
            .sort((a, b) => {
                if (sortBy === "price_asc") return Number(a.price) - Number(b.price)
                if (sortBy === "price_desc") return Number(b.price) - Number(a.price)
                if (sortBy === "turnaround") return a.turnaroundDays - b.turnaroundDays
                return 0
            })
    }, [allListings, search, selectedCategory, selectedModel, maxTurnaround, sortBy])

    const visibleListings = limit ? filteredListings.slice(0, limit) : filteredListings

    return (
        <div className="space-y-6">
            {/* 1. Category Quick-Pills */}
            <div className="flex flex-wrap items-center gap-2">
                {categories.map((cat) => {
                    const Icon = cat.icon
                    const isSelected = selectedCategory === cat.id
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                                isSelected
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "border border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            <Icon className="size-3.5" />
                            <span>{cat.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* 2. Search & Multi-Filter Bar */}
            <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm sm:p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search services, dieline types, deliverables, or designers..."
                            className="h-10 pl-9 text-xs sm:text-sm bg-background/50 border-border/60"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Pricing Model */}
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            aria-label="Filter by pricing model"
                            className="h-10 rounded-lg border border-border/60 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">Pricing: All models</option>
                            <option value="per_project">Per Project</option>
                            <option value="per_design">Per Design</option>
                            <option value="hourly">Hourly</option>
                        </select>

                        {/* Turnaround Time */}
                        <select
                            value={String(maxTurnaround)}
                            onChange={(e) => setMaxTurnaround(e.target.value === "all" ? "all" : Number(e.target.value))}
                            aria-label="Filter by delivery time"
                            className="h-10 rounded-lg border border-border/60 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">Delivery: Any time</option>
                            <option value="3">Within 3 days</option>
                            <option value="5">Within 5 days</option>
                            <option value="7">Within 7 days</option>
                        </select>

                        {/* Sort By */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as "featured" | "price_asc" | "price_desc" | "turnaround")}
                            aria-label="Sort listings"
                            className="h-10 rounded-lg border border-border/60 bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="featured">Sort: Featured</option>
                            <option value="turnaround">Sort: Fastest delivery</option>
                            <option value="price_asc">Sort: Price low to high</option>
                            <option value="price_desc">Sort: Price high to low</option>
                        </select>
                    </div>
                </div>

                {/* Active filter summary & reset */}
                {(search || selectedCategory !== "all" || selectedModel !== "all" || maxTurnaround !== "all" || sortBy !== "featured") && (
                    <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground">
                        <span>Showing {visibleListings.length} matching design {visibleListings.length === 1 ? "service" : "services"}</span>
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("")
                                setSelectedCategory("all")
                                setSelectedModel("all")
                                setMaxTurnaround("all")
                                setSortBy("featured")
                            }}
                            className="font-medium text-blue-500 hover:text-blue-400"
                        >
                            Reset filters
                        </button>
                    </div>
                )}
            </div>

            {/* 3. Listings Grid */}
            {visibleListings.length > 0 ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {visibleListings.map((listing) => {
                        const isTracked = trackedServiceIds.includes(listing.serviceId)
                        const place = [listing.city, listing.state].filter(Boolean).join(", ")

                        return (
                            <article
                                key={listing.serviceId}
                                className="group relative flex flex-col rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-md"
                            >
                                {/* Top Banner / Preview Artwork */}
                                <div className="relative flex h-44 flex-col justify-between overflow-hidden rounded-t-2xl bg-foreground p-4 text-background">
                                    {/* Geometric decorative elements */}
                                    <div className="absolute -right-8 -top-8 size-32 rounded-full border border-white/10 bg-blue-500/5 blur-sm" />
                                    <div className="absolute -bottom-6 -left-6 size-28 rounded-full border border-background/10 bg-background/5" />

                                    {/* Top badges */}
                                    <div className="relative z-10 flex items-center justify-between gap-2">
                                        <Badge
                                            variant="secondary"
                                            className="bg-black/40 backdrop-blur-md text-[11px] font-semibold text-white/90 border border-white/10 uppercase tracking-wider"
                                        >
                                            {formatServiceType(listing.serviceType)}
                                        </Badge>
                                        <span className="rounded-full bg-blue-600/90 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                                            {formatPrice(listing.price)}
                                            <span className="text-[10px] font-normal text-white/80 ml-1">
                                                /{listing.pricingModel.replaceAll("_", " ")}
                                            </span>
                                        </span>
                                    </div>

                                    {/* Packaging Artwork Visualizer Mockup */}
                                    <div className="relative z-10 my-auto flex items-center justify-center gap-3 py-2">
                                        <div className="flex size-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-blue-300 shadow-inner group-hover:scale-105 transition-transform">
                                            {listing.serviceType === "label_design" ? (
                                                <Tag className="size-7" />
                                            ) : listing.serviceType === "3d_rendering" ? (
                                                <Boxes className="size-7" />
                                            ) : (
                                                <Package className="size-7" />
                                            )}
                                        </div>
                                        <div className="text-left text-white/90">
                                            <p className="text-xs font-semibold tracking-wide flex items-center gap-1.5">
                                                <ShieldCheck className="size-3.5 text-blue-400" /> Print-Ready Dieline Standard
                                            </p>
                                            <p className="text-[11px] text-white/60">CMYK · 300 DPI · Bleed & Fold Lines</p>
                                        </div>
                                    </div>

                                    {/* Bottom banner strip */}
                                    <div className="relative z-10 flex items-center justify-between text-[11px] text-white/70">
                                        <span className="inline-flex items-center gap-1">
                                            <Clock3 className="size-3 text-blue-400" /> {listing.turnaroundDays} days delivery
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <RotateCcw className="size-3 text-blue-400" /> {listing.revisionsIncluded} revisions
                                        </span>
                                    </div>
                                </div>

                                {/* Body Content */}
                                <div className="flex flex-1 flex-col p-5">
                                    {/* Service Title */}
                                    <h3 className="font-heading text-base font-semibold leading-snug text-foreground group-hover:text-blue-500 transition-colors line-clamp-1">
                                        {listing.serviceTitle}
                                    </h3>

                                    {/* Description */}
                                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                                        {listing.description}
                                    </p>

                                    {/* Deliverable Tags */}
                                    {listing.deliverables && listing.deliverables.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-1.5">
                                            {listing.deliverables.slice(0, 3).map((item, dIdx) => (
                                                <span
                                                    key={dIdx}
                                                    className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                                                >
                                                    <Check className="size-2.5 text-blue-500" />
                                                    {item}
                                                </span>
                                            ))}
                                            {listing.deliverables.length > 3 && (
                                                <span className="rounded-md border border-border/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                    +{listing.deliverables.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Designer Profile Footer */}
                                    <div className="mt-5 border-t border-border/50 pt-3.5">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                {listing.profilePhotoUrl ? (
                                                    <Image
                                                        src={listing.profilePhotoUrl}
                                                        alt={listing.designerName}
                                                        width={32}
                                                        height={32}
                                                        unoptimized
                                                        className="size-8 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <InitialsAvatar name={listing.designerName} className="size-8 text-[11px]" />
                                                )}
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-semibold text-foreground flex items-center gap-1">
                                                        {listing.designerName}
                                                        {listing.isVerified && (
                                                            <span className="inline-flex size-3.5 items-center justify-center rounded-full bg-blue-500 text-white text-[9px]">
                                                                ✓
                                                            </span>
                                                        )}
                                                    </p>
                                                    {place ? (
                                                        <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                                                            <MapPin className="size-2.5" />
                                                            {place}
                                                        </p>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500">
                                                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Available now
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Rating indicator */}
                                            <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                                                <Star className="size-3.5 fill-amber-500 text-amber-500" />
                                                <span>4.9</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-4 flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 text-xs h-9 border-border/60 hover:bg-muted"
                                            onClick={() => openContactDialog(listing)}
                                        >
                                            <Mail className="size-3.5 mr-1 text-blue-500" />
                                            Contact
                                        </Button>

                                        {listing.designerId && !listing.designerId.startsWith("showcase") ? (
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs h-9 px-2.5 text-muted-foreground hover:text-foreground"
                                            >
                                                <Link href={`/designers/${listing.designerId}`} title="View Designer Profile">
                                                    <ArrowUpRight className="size-4" />
                                                </Link>
                                            </Button>
                                        ) : null}

                                        <div className="flex-1">
                                            <TrackServiceButton
                                                serviceId={listing.serviceId}
                                                tracked={isTracked}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </article>
                        )
                    })}
                </div>
            ) : (
                /* Empty state when filters yield no result */
                <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <Search className="size-6" />
                    </div>
                    <h3 className="mt-4 font-heading text-base font-semibold text-foreground">
                        No matching design services found
                    </h3>
                    <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
                        Try modifying your search term, clearing category filters, or selecting a broader turnaround window.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4 text-xs"
                        onClick={() => {
                            setSearch("")
                            setSelectedCategory("all")
                            setSelectedModel("all")
                            setMaxTurnaround("all")
                        }}
                    >
                        Clear all filters
                    </Button>
                </div>
            )}

            {/* 4. Contact / Brief Inquiry Dialog */}
            <Dialog open={!!contactListing} onOpenChange={(open) => !open && setContactListing(null)}>
                <DialogContent className="max-w-lg p-6">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-lg font-semibold flex items-center gap-2">
                            <Mail className="size-5 text-blue-500" />
                            Direct Inquiry to {contactListing?.designerName}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Reach out with your project specs, dieline requirements, or target timeline. No agency commission.
                        </DialogDescription>
                    </DialogHeader>

                    {contactListing && (
                        <div className="space-y-4 pt-2">
                            {/* Summary Card */}
                            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs space-y-1.5">
                                <p className="font-semibold text-foreground">{contactListing.serviceTitle}</p>
                                <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                                    <span>Rate: {formatPrice(contactListing.price)}</span>
                                    <span>·</span>
                                    <span>Delivery: {contactListing.turnaroundDays} days</span>
                                    <span>·</span>
                                    <span>Revisions: {contactListing.revisionsIncluded}</span>
                                </div>
                            </div>

                            {/* Subject */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Subject Line</label>
                                <Input
                                    value={inquirySubject}
                                    onChange={(e) => setInquirySubject(e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>

                            {/* Message */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Project Details & Brief</label>
                                <Textarea
                                    rows={5}
                                    value={inquiryMessage}
                                    onChange={(e) => setInquiryMessage(e.target.value)}
                                    className="text-xs resize-none"
                                />
                            </div>

                            {/* Designer Email Box */}
                            <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background px-3 py-2 text-xs">
                                <span className="text-muted-foreground">Designer Email:</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono font-medium text-foreground">{contactListing.email}</span>
                                    <button
                                        type="button"
                                        onClick={() => copyDesignerEmail(contactListing.email)}
                                        className="text-muted-foreground hover:text-foreground"
                                        title="Copy Email"
                                    >
                                        <Copy className="size-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyDesignerEmail(contactListing.email)}
                                    className="text-xs"
                                >
                                    <Copy className="size-3.5 mr-1" />
                                    Copy Email
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                >
                                    <a
                                        href={`mailto:${contactListing.email}?subject=${encodeURIComponent(
                                            inquirySubject
                                        )}&body=${encodeURIComponent(inquiryMessage)}`}
                                    >
                                        <Send className="size-3.5 mr-1" />
                                        Open Mail Client
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
