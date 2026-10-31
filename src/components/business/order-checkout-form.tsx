"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    Check,
    Clock3,
    FileText,
    Info,
    Loader2,
    Lock,
    Package,
    RotateCcw,
    ShieldCheck,
    Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { placeDesignOrderAction } from "@/actions/hired-service-orders"
import type { getDetailedGigBySlug } from "@/lib/business/marketplace"

type GigDetailData = NonNullable<Awaited<ReturnType<typeof getDetailedGigBySlug>>>

export function OrderCheckoutForm({
    gig,
    tier,
    extrasIds,
    initialIdempotencyKey,
}: {
    gig: GigDetailData
    tier: "basic" | "standard" | "premium"
    extrasIds: string[]
    initialIdempotencyKey: string
}) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const selectedPkg = gig.packages.find((p) => p.tier === tier) || gig.packages[0]
    const selectedExtras = gig.extras.filter((e) => extrasIds.includes(e.id))

    const basePrice = selectedPkg ? Number(selectedPkg.price) : 5000
    const extrasPrice = selectedExtras.reduce((sum, e) => sum + Number(e.price), 0)
    const totalPrice = basePrice + extrasPrice

    const baseDays = selectedPkg ? selectedPkg.deliveryDays : 7
    const extrasDays = selectedExtras.reduce((sum, e) => sum + (e.extraDays || 0), 0)
    const totalDays = baseDays + extrasDays

    // Brief Form State
    const [packagingType, setPackagingType] = useState("")
    const [dimensions, setDimensions] = useState("")
    const [material, setMaterial] = useState("")
    const [brandName, setBrandName] = useState("")
    const [tagline, setTagline] = useState("")
    const [colours, setColours] = useState("")
    const [fonts, setFonts] = useState("")
    const [targetAudience, setTargetAudience] = useState("")
    const [referenceLinks, setReferenceLinks] = useState("")
    const [dieline, setDieline] = useState<"provided" | "needed" | "custom">("needed")
    const [formats, setFormats] = useState("Print-ready PDF & Vector AI")
    const [deadline, setDeadline] = useState("")
    const [notes, setNotes] = useState("")

    const handleSubmitOrder = (e: React.FormEvent) => {
        e.preventDefault()

        if (!packagingType.trim()) {
            toast.error("Please enter the packaging type (e.g. Folding carton, pouch, can).")
            return
        }
        if (!dimensions.trim()) {
            toast.error("Please specify package dimensions.")
            return
        }
        if (!material.trim()) {
            toast.error("Please specify packaging material specs.")
            return
        }
        if (!brandName.trim()) {
            toast.error("Please enter your brand name.")
            return
        }
        if (!targetAudience.trim()) {
            toast.error("Please tell the designer about your target audience.")
            return
        }

        startTransition(async () => {
            const res = await placeDesignOrderAction({
                serviceId: gig.id,
                packageTier: tier,
                selectedExtras: selectedExtras.map((e) => ({
                    name: e.name,
                    price: Number(e.price),
                    extraDays: e.extraDays || 0,
                })),
                brief: {
                    packagingType: packagingType.trim(),
                    dimensions: dimensions.trim(),
                    material: material.trim(),
                    brandName: brandName.trim(),
                    tagline: tagline.trim() || undefined,
                    colours: colours.trim() || undefined,
                    fonts: fonts.trim() || undefined,
                    targetAudience: targetAudience.trim(),
                    referenceLinks: referenceLinks.trim() || undefined,
                    dieline,
                    formats: formats.trim(),
                    deadline: deadline.trim() || undefined,
                    notes: notes.trim() || undefined,
                },
                idempotencyKey: initialIdempotencyKey,
            })

            if (res.success && res.data?.orderId) {
                toast.success("Order placed")
                router.push(`/business/hired-services/${res.data.orderId}`)
            } else {
                toast.error("Couldn't place order")
            }
        })
    }

    return (
        <form onSubmit={handleSubmitOrder} className="space-y-8">
            {/* Top Return Nav */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <Link
                    href={`/business/designers/${gig.slug || gig.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="size-3.5" />
                    <span>Back to Gig Details</span>
                </Link>
                <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                    <ShieldCheck className="size-4" />
                    <span>Zero Platform Commission</span>
                </div>
            </div>

            {/* Offline Payment Notice */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-3">
                <Info className="size-4 shrink-0 mt-0.5 text-amber-500" />
                <div className="space-y-1">
                    <p className="font-semibold text-foreground">Direct Offline Payment Terms</p>
                    <p className="leading-relaxed">
                        Payment is arranged directly between you and the designer. Online payments are not connected yet. Once you submit this brief, the designer will review and accept within 48 hours.
                    </p>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
                {/* Left: Detailed Brief Form */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs space-y-6">
                        <div className="border-b border-border/40 pb-4">
                            <h1 className="font-heading text-xl font-bold text-foreground">
                                Complete Packaging Design Brief
                            </h1>
                            <p className="text-xs text-muted-foreground mt-1">
                                Give {gig.designerDisplayName} accurate specs to craft production-ready dielines and artwork.
                            </p>
                        </div>

                        {/* Section 1: Packaging Specs */}
                        <div className="space-y-4">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Package className="size-3.5 text-blue-500" />
                                <span>1. Packaging Structure & Material</span>
                            </h2>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        Packaging Format / Type <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        required
                                        value={packagingType}
                                        onChange={(e) => setPackagingType(e.target.value)}
                                        placeholder="e.g. Rigid Box, Stand-up Pouch, Tin Can, Label"
                                        className="text-xs h-9"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        Dimensions (L x W x H) <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        required
                                        value={dimensions}
                                        onChange={(e) => setDimensions(e.target.value)}
                                        placeholder="e.g. 150mm x 80mm x 220mm"
                                        className="text-xs h-9"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        Material Specification <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        required
                                        value={material}
                                        onChange={(e) => setMaterial(e.target.value)}
                                        placeholder="e.g. 350 GSM Kraft Paper, Matt BOPP, Glass"
                                        className="text-xs h-9"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        Dieline Requirement
                                    </label>
                                    <select
                                        value={dieline}
                                        onChange={(e) => setDieline(e.target.value as any)}
                                        className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="needed">Designer creates structural dieline</option>
                                        <option value="provided">We will provide template dieline file</option>
                                        <option value="custom">Custom dieline consultation needed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Brand Identity */}
                        <div className="space-y-4 pt-4 border-t border-border/40">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Sparkles className="size-3.5 text-blue-500" />
                                <span>2. Brand & Visual Guidelines</span>
                            </h2>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">
                                        Brand Name <span className="text-rose-500">*</span>
                                    </label>
                                    <Input
                                        required
                                        value={brandName}
                                        onChange={(e) => setBrandName(e.target.value)}
                                        placeholder="e.g. Roasted Bean Co."
                                        className="text-xs h-9"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">Tagline / Slogan</label>
                                    <Input
                                        value={tagline}
                                        onChange={(e) => setTagline(e.target.value)}
                                        placeholder="e.g. Single Origin Artisanal Coffee"
                                        className="text-xs h-9"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">Brand Colours / Palette</label>
                                    <Input
                                        value={colours}
                                        onChange={(e) => setColours(e.target.value)}
                                        placeholder="e.g. Earthy browns, warm amber, matte black (#2B1B17)"
                                        className="text-xs h-9"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">Font Preferences</label>
                                    <Input
                                        value={fonts}
                                        onChange={(e) => setFonts(e.target.value)}
                                        placeholder="e.g. Modern sans-serif, vintage serif, handwritten"
                                        className="text-xs h-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">
                                    Target Audience & Market Positioning <span className="text-rose-500">*</span>
                                </label>
                                <Textarea
                                    required
                                    rows={3}
                                    value={targetAudience}
                                    onChange={(e) => setTargetAudience(e.target.value)}
                                    placeholder="Who is buying this? (e.g. Gen-Z coffee enthusiasts in urban metro areas, premium tier gifting...)"
                                    className="text-xs"
                                />
                            </div>
                        </div>

                        {/* Section 3: References & Delivery Details */}
                        <div className="space-y-4 pt-4 border-t border-border/40">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <FileText className="size-3.5 text-blue-500" />
                                <span>3. References & Deliverables</span>
                            </h2>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">
                                    Reference Links or Inspiration Moodboards
                                </label>
                                <Input
                                    value={referenceLinks}
                                    onChange={(e) => setReferenceLinks(e.target.value)}
                                    placeholder="Pinterest, Behance, Google Drive, or competitor image URLs"
                                    className="text-xs h-9"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">Required File Formats</label>
                                    <Input
                                        value={formats}
                                        onChange={(e) => setFormats(e.target.value)}
                                        placeholder="e.g. Print-ready PDF, Vector AI, 3D Render"
                                        className="text-xs h-9"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-foreground">Target Completion Date</label>
                                    <Input
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="text-xs h-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-foreground">Additional Notes for Designer</label>
                                <Textarea
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any legal warnings, nutrition table needs, barcodes, or spot UV callouts..."
                                    className="text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Order Summary Sidebar */}
                <div className="space-y-6">
                    <div className="sticky top-6 rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-md space-y-5">
                        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                            <div className="relative size-14 rounded-xl overflow-hidden border bg-muted shrink-0">
                                <Image
                                    src={gig.sampleImages?.[0] || "https://images.unsplash.com/photo-1544816155-12df9643f363"}
                                    alt={gig.title}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-heading font-semibold text-xs text-foreground line-clamp-1">{gig.title}</h3>
                                <p className="text-[11px] text-muted-foreground">{gig.designerDisplayName}</p>
                                <Badge variant="secondary" className="capitalize text-[10px] mt-1">
                                    {tier} Package
                                </Badge>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between text-muted-foreground">
                                <span>{selectedPkg?.name || "Package"}</span>
                                <span className="font-medium text-foreground">₹{basePrice.toLocaleString("en-IN")}</span>
                            </div>

                            {selectedExtras.map((extra) => (
                                <div key={extra.id} className="flex justify-between text-muted-foreground text-[11px]">
                                    <span>Extra: {extra.name}</span>
                                    <span>₹{Number(extra.price).toLocaleString("en-IN")}</span>
                                </div>
                            ))}

                            <div className="pt-2 border-t border-border/40 flex justify-between font-semibold text-base">
                                <span className="text-foreground">Total Agreed Value</span>
                                <span className="text-blue-500">₹{totalPrice.toLocaleString("en-IN")}</span>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Clock3 className="size-3.5 text-blue-500 shrink-0" />
                                <span>{totalDays} Days Turnaround</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <RotateCcw className="size-3.5 text-blue-500 shrink-0" />
                                <span>{selectedPkg?.revisionsIncluded === -1 ? "Unlimited" : `${selectedPkg?.revisionsIncluded} Revisions Included`}</span>
                            </div>
                        </div>

                        {/* Place Order Button */}
                        <Button
                            type="submit"
                            size="lg"
                            disabled={isPending}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs gap-2 h-10 shadow-sm"
                        >
                            {isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Check className="size-4" />
                            )}
                            <span>Submit Order Brief</span>
                        </Button>

                        <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
                            By placing this order, you confirm project specs. Payment is settled offline directly with the designer.
                        </p>
                    </div>
                </div>
            </div>
        </form>
    )
}

