"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import {
    ArrowRight,
    ArrowUpRight,
    Boxes,
    Check,
    Clock3,
    Copy,
    Filter,
    Heart,
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
import { toggleSaveGigAction } from "@/actions/hired-service-orders"
import type { DesignerListing } from "@/lib/business/marketplace"

const CATEGORIES = [
    { id: "all", label: "All Gigs", icon: Sparkles },
    { id: "dieline_structural", label: "Dielines & Structural", icon: Package },
    { id: "label_sticker", label: "Labels & Bottles", icon: Tag },
    { id: "logo_brand_identity", label: "Brand & Logo", icon: Palette },
    { id: "3d_mockup_render", label: "3D Renders", icon: Boxes },
    { id: "full_packaging_set", label: "Full Packaging Suite", icon: Boxes },
]

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
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [maxDeliveryDays, setMaxDeliveryDays] = useState<number | "all">("all")
    const [maxPrice, setMaxPrice] = useState<number | "all">("all")
    const [minRating, setMinRating] = useState<number | "all">("all")
    const [selectedSoftware, setSelectedSoftware] = useState<string>("all")
    const [sortBy, setSortBy] = useState<"recommended" | "price_asc" | "price_desc" | "turnaround" | "rating">("recommended")
    const [activeTab, setActiveTab] = useState<"all" | "saved">("all")

    const [savedIds, setSavedIds] = useState<string[]>(trackedServiceIds)

    // Contact modal
    const [contactListing, setContactListing] = useState<DesignerListing | null>(null)
    const [inquirySubject, setInquirySubject] = useState("")
    const [inquiryMessage, setInquiryMessage] = useState("")

    const handleToggleSave = async (serviceId: string) => {
        const isCurrentlySaved = savedIds.includes(serviceId)
        setSavedIds((prev) =>
            isCurrentlySaved ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
        )
        const res = await toggleSaveGigAction(serviceId)
        if (res.success) {
            toast.success(res.data?.saved ? "Gig saved to favorites!" : "Removed from favorites")
        } else {
            setSavedIds((prev) =>
                isCurrentlySaved ? [...prev, serviceId] : prev.filter((id) => id !== serviceId)
            )
            toast.error(res.error || "Could not update favorites.")
        }
    }

    const openContactDialog = (listing: DesignerListing) => {
        setContactListing(listing)
        setInquirySubject(`Project Inquiry: ${listing.serviceTitle}`)
        setInquiryMessage(
            `Hi ${listing.designerName},\n\nI discovered your "${listing.serviceTitle}" service on UNIFIÉE. We are looking to develop packaging for our product line and would love to discuss deliverables, scope, and timeline.\n\nLooking forward to hearing from you!`
        )
    }

    const filteredListings = useMemo(() => {
        const query = search.trim().toLowerCase()
        return listings
            .filter((item) => {
                // Saved tab filter
                if (activeTab === "saved" && !savedIds.includes(item.serviceId)) {
                    return false
                }

                // Category filter
                const matchesCategory =
                    selectedCategory === "all" ||
                    item.category?.toLowerCase() === selectedCategory.toLowerCase()

                // Delivery filter
                const matchesTurnaround =
                    maxDeliveryDays === "all" || item.turnaroundDays <= maxDeliveryDays

                // Price filter
                const priceNum = Number(item.price) || 0
                const matchesPrice = maxPrice === "all" || priceNum <= maxPrice

                // Rating filter
                const matchesRating = minRating === "all" || (item.ratingAvg >= minRating)

                // Software filter
                const matchesSoftware =
                    selectedSoftware === "all" ||
                    item.softwareTools?.some((s) => s.toLowerCase().includes(selectedSoftware.toLowerCase())) ||
                    item.softwareUsed?.some((s) => s.toLowerCase().includes(selectedSoftware.toLowerCase()))

                // Full-text search query
                const searchableText = [
                    item.designerName,
                    item.serviceTitle,
                    item.description,
                    item.headline ?? "",
                    item.category ?? "",
                    item.city ?? "",
                    item.state ?? "",
                    ...(item.specializations || []),
                    ...(item.deliverables || []),
                    ...(item.tags || []),
                    ...(item.packagingTypes || []),
                ]
                    .join(" ")
                    .toLowerCase()

                const matchesSearch = !query || searchableText.includes(query)

                return (
                    matchesCategory &&
                    matchesTurnaround &&
                    matchesPrice &&
                    matchesRating &&
                    matchesSoftware &&
                    matchesSearch
                )
            })
            .sort((a, b) => {
                if (sortBy === "price_asc") return Number(a.price) - Number(b.price)
                if (sortBy === "price_desc") return Number(b.price) - Number(a.price)
                if (sortBy === "turnaround") return a.turnaroundDays - b.turnaroundDays
                if (sortBy === "rating") return b.ratingAvg - a.ratingAvg
                return 0
            })
    }, [
        listings,
        search,
        selectedCategory,
        maxDeliveryDays,
        maxPrice,
        minRating,
        selectedSoftware,
        sortBy,
        activeTab,
        savedIds,
    ])

    const visibleListings = limit ? filteredListings.slice(0, limit) : filteredListings

    return (
        <div className="space-y-6">
            {/* Top View Selector Tabs: All Gigs vs Saved */}
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab("all")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                            activeTab === "all"
                                ? "bg-card text-foreground shadow-xs border border-border/60"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Marketplace ({listings.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("saved")}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                            activeTab === "saved"
                                ? "bg-card text-foreground shadow-xs border border-border/60"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <Heart className="size-3 text-rose-500 fill-rose-500" />
                        <span>Saved Gigs ({savedIds.length})</span>
                    </button>
                </div>
            </div>

            {/* Category Quick Pills */}
            <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    const isSelected = selectedCategory === cat.id
                    return (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                                isSelected
                                    ? "bg-blue-600 text-white shadow-xs"
                                    : "border border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            <Icon className="size-3.5" />
                            <span>{cat.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Search and Filters Bar */}
            <div className="rounded-2xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-xs space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    {/* Search Field */}
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search gigs, packaging types (e.g. coffee pouches, tin can, boxes), or designers..."
                            className="h-9.5 pl-9 text-xs sm:text-sm bg-background/50 border-border/60"
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
                        {/* Delivery Time */}
                        <select
                            value={String(maxDeliveryDays)}
                            onChange={(e) => setMaxDeliveryDays(e.target.value === "all" ? "all" : Number(e.target.value))}
                            aria-label="Filter delivery time"
                            className="h-9.5 rounded-lg border border-border/60 bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">Delivery: Any</option>
                            <option value="3">Within 3 days</option>
                            <option value="5">Within 5 days</option>
                            <option value="7">Within 7 days</option>
                        </select>

                        {/* Price Range */}
                        <select
                            value={String(maxPrice)}
                            onChange={(e) => setMaxPrice(e.target.value === "all" ? "all" : Number(e.target.value))}
                            aria-label="Filter price"
                            className="h-9.5 rounded-lg border border-border/60 bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">Budget: Any</option>
                            <option value="5000">Under ₹5,000</option>
                            <option value="10000">Under ₹10,000</option>
                            <option value="20000">Under ₹20,000</option>
                        </select>

                        {/* Minimum Rating */}
                        <select
                            value={String(minRating)}
                            onChange={(e) => setMinRating(e.target.value === "all" ? "all" : Number(e.target.value))}
                            aria-label="Filter rating"
                            className="h-9.5 rounded-lg border border-border/60 bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="all">Rating: Any</option>
                            <option value="4.5">★ 4.5 & up</option>
                            <option value="4.8">★ 4.8 & up</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            aria-label="Sort listings"
                            className="h-9.5 rounded-lg border border-border/60 bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="recommended">Sort: Recommended</option>
                            <option value="price_asc">Sort: Price Low to High</option>
                            <option value="price_desc">Sort: Price High to Low</option>
                            <option value="turnaround">Sort: Fastest Delivery</option>
                            <option value="rating">Sort: Top Rated</option>
                        </select>
                    </div>
                </div>

                {/* Filter summary */}
                {(search || selectedCategory !== "all" || maxDeliveryDays !== "all" || maxPrice !== "all" || minRating !== "all" || sortBy !== "recommended" || activeTab !== "all") && (
                    <div className="flex items-center justify-between border-t border-border/40 pt-2 text-xs text-muted-foreground">
                        <span>Showing {visibleListings.length} matching design {visibleListings.length === 1 ? "gig" : "gigs"}</span>
                        <button
                            type="button"
                            onClick={() => {
                                setSearch("")
                                setSelectedCategory("all")
                                setMaxDeliveryDays("all")
                                setMaxPrice("all")
                                setMinRating("all")
                                setSelectedSoftware("all")
                                setSortBy("recommended")
                                setActiveTab("all")
                            }}
                            className="font-medium text-blue-500 hover:underline"
                        >
                            Reset filters
                        </button>
                    </div>
                )}
            </div>

            {/* Listings Grid */}
            {visibleListings.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {visibleListings.map((listing) => {
                        const isFavorited = savedIds.includes(listing.serviceId)
                        const startingPrice = Number(listing.price).toLocaleString("en-IN")
                        const gigUrl = `/business/designers/${listing.serviceSlug || listing.serviceId}`

                        return (
                            <article
                                key={listing.serviceId}
                                className="group relative flex flex-col rounded-2xl border border-border/60 bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-md overflow-hidden"
                            >
                                {/* Cover Image (16:10 Aspect Ratio) */}
                                <Link href={gigUrl} className="relative aspect-16/10 w-full overflow-hidden bg-muted block">
                                    <GigCardImage
                                        src={listing.sampleImages?.[0]}
                                        alt={listing.serviceTitle}
                                        title={listing.serviceTitle}
                                        category={listing.category}
                                    />

                                    {/* Category badge */}
                                    <div className="absolute left-3 top-3">
                                        <Badge variant="secondary" className="bg-black/60 backdrop-blur-md text-[10px] text-white border-white/10 uppercase tracking-wider">
                                            {listing.category?.replace(/_/g, " ") || "Packaging"}
                                        </Badge>
                                    </div>

                                    {/* Favorite / Save button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleToggleSave(listing.serviceId)
                                        }}
                                        className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white hover:scale-110 transition-all"
                                    >
                                        <Heart className={`size-4 ${isFavorited ? "fill-rose-500 text-rose-500" : ""}`} />
                                    </button>
                                </Link>

                                {/* Body Content */}
                                <div className="flex flex-1 flex-col p-4 sm:p-5 space-y-3">
                                    {/* Designer Avatar & Name */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <DesignerAvatar photoUrl={listing.profilePhotoUrl} name={listing.designerName} />
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-semibold text-foreground flex items-center gap-1">
                                                    {listing.designerName}
                                                    {listing.isVerified && (
                                                        <span className="size-3.5 inline-flex items-center justify-center rounded-full bg-blue-500 text-white text-[8px] font-bold">
                                                            ✓
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Rating */}
                                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-500 shrink-0">
                                            <Star className="size-3.5 fill-amber-500 text-amber-500" />
                                            <span>{listing.ratingAvg.toFixed(1)}</span>
                                            <span className="text-muted-foreground text-[10px]">({listing.ratingCount})</span>
                                        </div>
                                    </div>

                                    {/* Gig Title */}
                                    <Link href={gigUrl} className="block group-hover:text-blue-500 transition-colors">
                                        <h3 className="font-heading text-sm font-semibold leading-snug text-foreground line-clamp-2">
                                            {listing.serviceTitle}
                                        </h3>
                                    </Link>

                                    {/* Deliverables snippet */}
                                    {listing.deliverables && listing.deliverables.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {listing.deliverables.slice(0, 2).map((item, dIdx) => (
                                                <span
                                                    key={dIdx}
                                                    className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-secondary/40 px-2 py-0.5 text-[10px] text-foreground"
                                                >
                                                    <Check className="size-2.5 text-blue-500" />
                                                    {item}
                                                </span>
                                            ))}
                                            {listing.deliverables.length > 2 && (
                                                <span className="rounded-md border border-border/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                    +{listing.deliverables.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer Info */}
                                    <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                                            <span className="inline-flex items-center gap-1">
                                                <Clock3 className="size-3 text-blue-500" />
                                                {listing.turnaroundDays}d delivery
                                            </span>
                                            <span>·</span>
                                            <span>{listing.completedOrders} orders</span>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-[10px] text-muted-foreground block">Starting at</span>
                                            <span className="font-heading text-sm font-bold text-foreground">
                                                ₹{startingPrice}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quick action buttons */}
                                    <div className="pt-2 flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openContactDialog(listing)}
                                            className="flex-1 text-xs h-8 border-border/60 hover:bg-muted"
                                        >
                                            <Mail className="size-3 mr-1 text-blue-500" />
                                            Contact
                                        </Button>

                                        <Button
                                            asChild
                                            size="sm"
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                                        >
                                            <Link href={gigUrl}>
                                                <span>View Gig</span>
                                                <ArrowRight className="size-3 ml-1" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </article>
                        )
                    })}
                </div>
            ) : (
                /* Empty state */
                <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card p-10 text-center space-y-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                        <Search className="size-6" />
                    </div>
                    <h3 className="font-heading text-base font-semibold text-foreground">
                        {activeTab === "saved" ? "No saved design gigs yet" : "No matching design gigs found"}
                    </h3>
                    <p className="max-w-sm text-xs text-muted-foreground leading-relaxed">
                        {activeTab === "saved"
                            ? "Click the heart icon on any gig in the marketplace to bookmark it for later review."
                            : "Try adjusting your search terms, clearing category filters, or selecting a broader turnaround window."}
                    </p>
                    {activeTab !== "saved" && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSearch("")
                                setSelectedCategory("all")
                                setMaxDeliveryDays("all")
                                setMaxPrice("all")
                                setMinRating("all")
                                setSortBy("recommended")
                            }}
                            className="text-xs"
                        >
                            Reset all filters
                        </Button>
                    )}
                </div>
            )}

            {/* Contact Designer Dialog */}
            <Dialog open={!!contactListing} onOpenChange={(open) => !open && setContactListing(null)}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <Mail className="size-4 text-blue-500" />
                            <span>Inquiry to {contactListing?.designerName}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Send direct project specifications before ordering. No platform commission.
                        </DialogDescription>
                    </DialogHeader>

                    {contactListing && (
                        <div className="space-y-4 pt-2">
                            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs space-y-1">
                                <p className="font-semibold text-foreground">{contactListing.serviceTitle}</p>
                                <p className="text-muted-foreground text-[11px]">
                                    Starting at ₹{Number(contactListing.price).toLocaleString("en-IN")} · {contactListing.turnaroundDays}d turnaround
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Subject</label>
                                <Input
                                    value={inquirySubject}
                                    onChange={(e) => setInquirySubject(e.target.value)}
                                    className="text-xs h-8.5"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Project Specs & Message</label>
                                <Textarea
                                    rows={5}
                                    value={inquiryMessage}
                                    onChange={(e) => setInquiryMessage(e.target.value)}
                                    className="text-xs leading-relaxed"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setContactListing(null)}
                                    className="text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    asChild
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1"
                                >
                                    <a
                                        href={`mailto:${contactListing.email}?subject=${encodeURIComponent(inquirySubject)}&body=${encodeURIComponent(inquiryMessage)}`}
                                    >
                                        <Send className="size-3" />
                                        Send Email
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

function GigCardImage({
    src,
    alt,
    title,
    category,
}: {
    src?: string | null
    alt: string
    title: string
    category?: string | null
}) {
    const fallbackByCategory: Record<string, string> = {
        dieline_structural: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80",
        label_sticker: "https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=800&auto=format&fit=crop&q=80",
        logo_brand_identity: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80",
        "3d_mockup_render": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80",
        full_packaging_set: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
    }
    const defaultFallback = (category && fallbackByCategory[category]) || "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80"
    const initialSrc = !src || src.startsWith("/seed/") ? defaultFallback : src
    const [currentSrc, setCurrentSrc] = useState(initialSrc)
    const [hasError, setHasError] = useState(false)

    if (hasError) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-secondary/60 to-muted/80 p-4 text-center">
                <Package className="size-8 text-muted-foreground/50 mb-2 stroke-1" />
                <span className="line-clamp-2 text-xs font-medium text-muted-foreground">{title}</span>
            </div>
        )
    }

    return (
        <Image
            src={currentSrc}
            alt={alt}
            fill
            unoptimized
            onError={() => {
                if (currentSrc !== defaultFallback) {
                    setCurrentSrc(defaultFallback)
                } else {
                    setHasError(true)
                }
            }}
            className="object-cover transition-transform duration-300 group-hover:scale-102"
        />
    )
}

function DesignerAvatar({ photoUrl, name }: { photoUrl?: string | null; name: string }) {
    const [hasError, setHasError] = useState(false)
    const validUrl = photoUrl && !photoUrl.startsWith("/seed/") ? photoUrl : null

    if (!validUrl || hasError) {
        return <InitialsAvatar name={name} className="size-7 text-[10px]" />
    }

    return (
        <Image
            src={validUrl}
            alt={name}
            width={28}
            height={28}
            unoptimized
            onError={() => setHasError(true)}
            className="size-7 rounded-full object-cover border"
        />
    )
}

