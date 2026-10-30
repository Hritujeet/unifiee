"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
    ArrowRight,
    Award,
    Boxes,
    Check,
    ChevronDown,
    Clock3,
    FileCheck2,
    Heart,
    HelpCircle,
    Info,
    Mail,
    MapPin,
    Package,
    Palette,
    RotateCcw,
    Send,
    ShieldCheck,
    Sparkles,
    Star,
    Tag,
    Wrench,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toggleSaveGigAction } from "@/actions/hired-service-orders"
import type { getDetailedGigBySlug } from "@/lib/business/marketplace"

type GigDetailData = NonNullable<Awaited<ReturnType<typeof getDetailedGigBySlug>>>

export function GigDetailView({
    gig,
    isSavedInitially = false,
}: {
    gig: GigDetailData
    isSavedInitially?: boolean
}) {
    const router = useRouter()
    const [selectedImage, setSelectedImage] = useState(0)
    const [activeTier, setActiveTier] = useState<"basic" | "standard" | "premium">("basic")
    const [selectedExtras, setSelectedExtras] = useState<string[]>([])
    const [isSaved, setIsSaved] = useState(isSavedInitially)

    // Contact modal
    const [contactOpen, setContactOpen] = useState(false)
    const [inquirySubject, setInquirySubject] = useState(`Project Inquiry: ${gig.title}`)
    const [inquiryBody, setInquiryBody] = useState(
        `Hi ${gig.designerDisplayName},\n\nI am interested in your "${gig.title}" design service on UNIFIÉE. We are preparing packaging for our products and would love to check your availability and confirm deliverables.\n\nLooking forward to working together!`
    )

    const validSampleImages = gig.sampleImages?.filter((img) => img && !img.startsWith("/seed/")) || []
    const images = validSampleImages.length ? validSampleImages : ["https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&auto=format&fit=crop&q=80"]

    // Find current package
    const currentPkg = gig.packages.find((p) => p.tier === activeTier) || gig.packages[0]

    // Selected extras details
    const chosenExtras = gig.extras.filter((e) => selectedExtras.includes(e.id))
    const extrasPrice = chosenExtras.reduce((sum, e) => sum + Number(e.price), 0)
    const extrasDays = chosenExtras.reduce((sum, e) => sum + (e.extraDays || 0), 0)

    const basePrice = currentPkg ? Number(currentPkg.price) : 5000
    const totalPrice = basePrice + extrasPrice
    const totalDays = (currentPkg ? currentPkg.deliveryDays : 7) + extrasDays

    const toggleExtra = (id: string) => {
        setSelectedExtras((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )
    }

    const handleToggleSave = async () => {
        const next = !isSaved
        setIsSaved(next)
        const res = await toggleSaveGigAction(gig.id)
        if (res.success) {
            toast.success(res.data?.saved ? "Gig saved to favorites!" : "Removed from favorites")
        } else {
            setIsSaved(!next)
            toast.error(res.error || "Could not save gig.")
        }
    }

    const handleContinueToCheckout = () => {
        const params = new URLSearchParams()
        params.set("tier", activeTier)
        if (selectedExtras.length > 0) {
            params.set("extras", selectedExtras.join(","))
        }
        router.push(`/business/designers/${gig.slug || gig.id}/checkout?${params.toString()}`)
    }

    return (
        <div className="space-y-8">
            {/* Top Bar / Breadcrumb */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 pb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link href="/business/designers" className="hover:text-foreground transition-colors">
                        Designers Marketplace
                    </Link>
                    <span>/</span>
                    <span className="capitalize text-foreground font-medium">
                        {gig.category?.replace(/_/g, " ") || "Packaging Design"}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleSave}
                        className={`text-xs gap-1.5 h-8.5 ${isSaved ? "text-rose-500 border-rose-500/30 bg-rose-500/5" : ""}`}
                    >
                        <Heart className={`size-3.5 ${isSaved ? "fill-rose-500" : ""}`} />
                        <span>{isSaved ? "Saved" : "Save"}</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setContactOpen(true)}
                        className="text-xs gap-1.5 h-8.5"
                    >
                        <Mail className="size-3.5 text-blue-500" />
                        <span>Contact Designer</span>
                    </Button>
                </div>
            </div>

            {/* Offline Payment Banner */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 sm:p-4 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <ShieldCheck className="size-4 text-blue-500 shrink-0" />
                    <span>
                        <strong>Transparent Pricing & Direct Terms:</strong> Payment is arranged directly between you and the designer. Online payments are not connected yet.
                    </span>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
                {/* Left Column: Media, Description, Packages Table, FAQ, Reviews */}
                <div className="space-y-8 min-w-0">
                    {/* Header */}
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="capitalize text-xs">
                                {gig.category?.replace(/_/g, " ") || "Packaging Design"}
                            </Badge>
                            <span className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                                <Star className="size-3.5 fill-amber-500 text-amber-500" />
                                <span>{Number(gig.ratingAvg).toFixed(1)}</span>
                                <span className="text-muted-foreground font-normal">({gig.ratingCount} reviews)</span>
                            </span>
                            <span className="text-muted-foreground text-xs">·</span>
                            <span className="text-xs text-muted-foreground">{gig.completedOrders} completed orders</span>
                        </div>

                        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
                            {gig.title}
                        </h1>

                        {/* Designer brief strip */}
                        <div className="flex items-center gap-3 pt-1">
                            {gig.profilePhotoUrl && !gig.profilePhotoUrl.startsWith("/seed/") ? (
                                <Image
                                    src={gig.profilePhotoUrl}
                                    alt={gig.designerDisplayName}
                                    width={40}
                                    height={40}
                                    unoptimized
                                    className="size-10 rounded-full object-cover border"
                                />
                            ) : (
                                <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 font-bold text-xs">
                                    {gig.designerDisplayName.slice(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-xs text-foreground">{gig.designerDisplayName}</span>
                                    {gig.isVerified && (
                                        <span className="rounded-full bg-blue-500 text-white text-[9px] px-1 font-bold">✓</span>
                                    )}
                                </div>
                                <p className="text-[11px] text-muted-foreground">{gig.headline || "Packaging Designer"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Image Gallery (16:10 Aspect Ratio) */}
                    <div className="space-y-3">
                        <div className="relative aspect-16/10 w-full overflow-hidden rounded-2xl border border-border/60 bg-muted">
                            <Image
                                src={images[selectedImage] || images[0]}
                                alt={`${gig.title} artwork`}
                                fill
                                unoptimized
                                priority
                                className="object-cover transition-all duration-300"
                            />
                        </div>

                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSelectedImage(idx)}
                                        className={`relative aspect-16/10 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                                            selectedImage === idx
                                                ? "border-blue-500 ring-2 ring-blue-500/20"
                                                : "border-border/60 opacity-70 hover:opacity-100"
                                        }`}
                                    >
                                        <Image
                                            src={img}
                                            alt={`Thumbnail ${idx + 1}`}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* About This Gig Description */}
                    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-4">
                        <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                            <FileCheck2 className="size-4 text-blue-500" />
                            <span>About this Design Gig</span>
                        </h2>

                        <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                            {gig.description}
                        </div>

                        {/* Supported Packaging Types */}
                        {gig.packagingTypes && gig.packagingTypes.length > 0 && (
                            <div className="space-y-2 pt-3 border-t border-border/40">
                                <span className="text-xs font-semibold text-foreground">Packaging Types Covered</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {gig.packagingTypes.map((type, idx) => (
                                        <span
                                            key={idx}
                                            className="rounded-md border border-border/50 bg-secondary/40 px-2.5 py-1 text-[11px] font-medium text-foreground"
                                        >
                                            {type}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Software Tools */}
                        {gig.softwareUsed && gig.softwareUsed.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-border/40">
                                <span className="text-xs font-semibold text-foreground">Software & Dieline Formats</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {gig.softwareUsed.map((tool, idx) => (
                                        <span
                                            key={idx}
                                            className="rounded-md border border-border/50 bg-secondary/40 px-2.5 py-1 text-[11px] font-medium text-foreground"
                                        >
                                            {tool}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Package Comparison Table */}
                    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-5">
                        <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                            <Boxes className="size-4 text-blue-500" />
                            <span>Compare Package Tiers</span>
                        </h2>

                        <div className="grid gap-4 md:grid-cols-3">
                            {(["basic", "standard", "premium"] as const).map((tierKey) => {
                                const pkg = gig.packages.find((p) => p.tier === tierKey)
                                const isSelected = activeTier === tierKey

                                if (!pkg) {
                                    return (
                                        <div
                                            key={tierKey}
                                            className="rounded-xl border border-dashed border-border/50 p-4 text-center text-xs text-muted-foreground flex flex-col items-center justify-center min-h-[220px]"
                                        >
                                            <span className="capitalize font-semibold text-foreground/50">{tierKey}</span>
                                            <span className="mt-1">Not offered for this gig</span>
                                        </div>
                                    )
                                }

                                return (
                                    <div
                                        key={tierKey}
                                        onClick={() => setActiveTier(tierKey)}
                                        className={`cursor-pointer rounded-xl border p-4 space-y-3 transition-all ${
                                            isSelected
                                                ? "border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20 shadow-xs"
                                                : "border-border/60 bg-background/50 hover:bg-muted/40"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <Badge variant={isSelected ? "default" : "outline"} className="capitalize text-xs">
                                                {tierKey}
                                            </Badge>
                                            <span className="font-heading text-base font-bold text-foreground">
                                                ₹{Number(pkg.price).toLocaleString("en-IN")}
                                            </span>
                                        </div>

                                        <h3 className="font-semibold text-xs text-foreground line-clamp-1">{pkg.name}</h3>
                                        <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                                            {pkg.description}
                                        </p>

                                        <div className="pt-2 border-t border-border/40 space-y-1.5 text-[11px] text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Clock3 className="size-3 text-blue-500 shrink-0" />
                                                <span>{pkg.deliveryDays} Days Delivery</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <RotateCcw className="size-3 text-blue-500 shrink-0" />
                                                <span>{pkg.revisionsIncluded === -1 ? "Unlimited" : `${pkg.revisionsIncluded} Revisions`}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Check className="size-3 text-emerald-500 shrink-0" />
                                                <span>{pkg.commercialUseIncluded ? "Commercial Use" : "Personal Only"}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Check className={`size-3 ${pkg.sourceFilesIncluded ? "text-emerald-500" : "text-muted-foreground/40"} shrink-0`} />
                                                <span>{pkg.sourceFilesIncluded ? "Source Files (AI/EPS)" : "Print PDF Only"}</span>
                                            </div>
                                        </div>

                                        {/* Deliverables snippet */}
                                        {pkg.deliverables && pkg.deliverables.length > 0 && (
                                            <div className="pt-2 border-t border-border/40 space-y-1">
                                                {pkg.deliverables.slice(0, 3).map((d, dIdx) => (
                                                    <div key={dIdx} className="flex items-center gap-1 text-[10px] text-foreground">
                                                        <Check className="size-2.5 text-blue-500 shrink-0" />
                                                        <span className="truncate">{d}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* FAQ Accordion */}
                    {gig.faq && gig.faq.length > 0 && (
                        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-4">
                            <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                                <HelpCircle className="size-4 text-blue-500" />
                                <span>Frequently Asked Questions</span>
                            </h2>

                            <div className="space-y-3">
                                {gig.faq.map((item, idx) => (
                                    <details
                                        key={idx}
                                        className="group rounded-xl border border-border/50 bg-background/50 p-3.5 text-xs transition-colors open:bg-muted/30"
                                    >
                                        <summary className="font-semibold text-foreground cursor-pointer flex items-center justify-between list-none">
                                            <span>{item.question}</span>
                                            <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
                                        </summary>
                                        <p className="mt-2 text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
                                            {item.answer}
                                        </p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reviews List */}
                    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
                            <div>
                                <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                                    <Star className="size-4 text-amber-500 fill-amber-500" />
                                    <span>Client Reviews ({gig.reviews.length})</span>
                                </h2>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Verified ratings from brand owners who ordered and completed projects
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xl font-bold font-heading text-foreground">
                                <span>{Number(gig.ratingAvg).toFixed(1)}</span>
                                <span className="text-amber-500 text-sm">★</span>
                            </div>
                        </div>

                        {gig.reviews.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-4 text-center">
                                No reviews yet. Be the first brand to order and review this designer!
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {gig.reviews.map((rev) => (
                                    <div key={rev.id} className="space-y-2 border-b border-border/40 pb-4 last:border-b-0">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 rounded-full bg-blue-500/10 text-blue-500 font-bold flex items-center justify-center text-[10px]">
                                                    {rev.businessName?.slice(0, 1) || "B"}
                                                </div>
                                                <span className="font-semibold text-foreground">{rev.businessName}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-amber-500">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <Star
                                                        key={s}
                                                        className={`size-3 ${s <= rev.rating ? "fill-amber-500" : "text-muted-foreground/30"}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {rev.text && (
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                &ldquo;{rev.text}&rdquo;
                                            </p>
                                        )}

                                        {rev.designerReply && (
                                            <div className="ml-4 rounded-lg bg-muted/40 p-2.5 text-[11px] space-y-0.5">
                                                <span className="font-semibold text-foreground">Designer response:</span>
                                                <p className="text-muted-foreground">{rev.designerReply}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Sticky Purchase Panel (Desktop) */}
                <aside className="space-y-6">
                    <div className="sticky top-6 rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-md space-y-5">
                        {/* Package Selection Tabs */}
                        <div className="flex rounded-xl bg-muted p-1 text-xs font-semibold">
                            {(["basic", "standard", "premium"] as const).map((tier) => {
                                const exists = gig.packages.some((p) => p.tier === tier)
                                return (
                                    <button
                                        key={tier}
                                        type="button"
                                        disabled={!exists}
                                        onClick={() => setActiveTier(tier)}
                                        className={`flex-1 rounded-lg py-1.5 capitalize transition-all ${
                                            activeTier === tier
                                                ? "bg-card text-foreground shadow-xs"
                                                : exists
                                                ? "text-muted-foreground hover:text-foreground"
                                                : "text-muted-foreground/40 cursor-not-allowed"
                                        }`}
                                    >
                                        {tier}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Package Price & Turnaround */}
                        <div className="space-y-1">
                            <div className="flex items-baseline justify-between">
                                <span className="font-heading text-2xl font-bold text-foreground">
                                    ₹{totalPrice.toLocaleString("en-IN")}
                                </span>
                                <span className="text-xs text-muted-foreground">Order Value</span>
                            </div>
                            <p className="text-xs font-medium text-foreground">{currentPkg?.name || "Design Package"}</p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">{currentPkg?.description}</p>
                        </div>

                        {/* Deliverables Checklist */}
                        <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
                            <div className="flex items-center justify-between text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Clock3 className="size-3.5 text-blue-500" /> {totalDays} Days Delivery
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <RotateCcw className="size-3.5 text-blue-500" />
                                    {currentPkg?.revisionsIncluded === -1 ? "Unlimited" : `${currentPkg?.revisionsIncluded} Revisions`}
                                </span>
                            </div>

                            {currentPkg?.deliverables && (
                                <div className="space-y-1.5 pt-1">
                                    {currentPkg.deliverables.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-1.5 text-[11px] text-foreground">
                                            <Check className="size-3 text-emerald-500 mt-0.5 shrink-0" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Optional Extras */}
                        {gig.extras.length > 0 && (
                            <div className="space-y-2.5 pt-3 border-t border-border/40">
                                <span className="text-xs font-semibold text-foreground">Upgrade with Gig Extras</span>
                                <div className="space-y-2">
                                    {gig.extras.map((extra) => {
                                        const checked = selectedExtras.includes(extra.id)
                                        return (
                                            <label
                                                key={extra.id}
                                                className={`flex items-center justify-between rounded-xl border p-2.5 text-xs cursor-pointer transition-colors ${
                                                    checked
                                                        ? "border-blue-500 bg-blue-500/5 text-foreground"
                                                        : "border-border/50 hover:bg-muted/40 text-muted-foreground"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleExtra(extra.id)}
                                                        className="size-3.5 rounded border-border text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <div className="space-y-0.5">
                                                        <span className="font-medium text-foreground">{extra.name}</span>
                                                        {extra.extraDays > 0 && (
                                                            <span className="block text-[10px] text-muted-foreground">
                                                                +{extra.extraDays} delivery day
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="font-semibold text-foreground">
                                                    +₹{Number(extra.price).toLocaleString("en-IN")}
                                                </span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Checkout CTA Button */}
                        <Button
                            type="button"
                            size="lg"
                            onClick={handleContinueToCheckout}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-2 h-10 shadow-sm"
                        >
                            <span>Continue (₹{totalPrice.toLocaleString("en-IN")})</span>
                            <ArrowRight className="size-3.5" />
                        </Button>

                        <p className="text-[11px] text-center text-muted-foreground">
                            You won&apos;t be charged online yet. Direct collaboration terms apply.
                        </p>
                    </div>

                    {/* Designer Bio Card */}
                    <div className="rounded-2xl border border-border/60 bg-card p-5 text-xs space-y-4 shadow-xs">
                        <div className="flex items-center gap-3">
                            {gig.profilePhotoUrl && !gig.profilePhotoUrl.startsWith("/seed/") ? (
                                <Image
                                    src={gig.profilePhotoUrl}
                                    alt={gig.designerDisplayName}
                                    width={44}
                                    height={44}
                                    unoptimized
                                    className="size-11 rounded-full object-cover border"
                                />
                            ) : (
                                <div className="flex size-11 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 font-bold text-sm">
                                    {gig.designerDisplayName.slice(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">{gig.designerDisplayName}</h3>
                                <p className="text-[11px] text-muted-foreground">{gig.headline}</p>
                            </div>
                        </div>

                        {gig.bio && (
                            <p className="text-muted-foreground leading-relaxed line-clamp-4">
                                {gig.bio}
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[11px]">
                            <div>
                                <span className="text-muted-foreground">From</span>
                                <p className="font-medium text-foreground">{[gig.city, gig.state].filter(Boolean).join(", ") || "India"}</p>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Experience</span>
                                <p className="font-medium text-foreground">{gig.yearsOfExperience ? `${gig.yearsOfExperience} Years` : "Professional"}</p>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="w-full text-xs"
                        >
                            <Link href={`/designers/${gig.designerId}`}>
                                View Full Portfolio <ArrowRight className="size-3 ml-1" />
                            </Link>
                        </Button>
                    </div>
                </aside>
            </div>

            {/* Mobile Bottom Sticky Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 p-3 backdrop-blur-md lg:hidden">
                <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
                    <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                            {activeTier} Package
                        </span>
                        <span className="font-heading text-lg font-bold text-foreground">
                            ₹{totalPrice.toLocaleString("en-IN")}
                        </span>
                    </div>

                    <Button
                        size="sm"
                        onClick={handleContinueToCheckout}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 px-4"
                    >
                        <span>Continue</span>
                        <ArrowRight className="size-3" />
                    </Button>
                </div>
            </div>

            {/* Contact Designer Modal */}
            <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold flex items-center gap-2">
                            <Mail className="size-4 text-blue-500" />
                            <span>Message {gig.designerDisplayName}</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            Inquire about packaging dieline customization, turnaround rush, or specific print specifications.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 pt-2">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">Subject</label>
                            <Input
                                value={inquirySubject}
                                onChange={(e) => setInquirySubject(e.target.value)}
                                className="text-xs h-8.5"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">Message</label>
                            <Textarea
                                rows={5}
                                value={inquiryBody}
                                onChange={(e) => setInquiryBody(e.target.value)}
                                className="text-xs leading-relaxed"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button variant="outline" size="sm" onClick={() => setContactOpen(false)} className="text-xs">
                            Cancel
                        </Button>
                        <Button
                            asChild
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1"
                        >
                            <a
                                href={`mailto:${gig.email}?subject=${encodeURIComponent(inquirySubject)}&body=${encodeURIComponent(inquiryBody)}`}
                            >
                                <Send className="size-3" />
                                Open Mail Client
                            </a>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

