"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    ArrowRight,
    Loader2,
    Radio,
    Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    PackagingType,
    PackagingUse,
} from "@/lib/business-workflow-store"
import { createRequirementAction } from "@/actions/business-requirements"
import { toast } from "sonner"

interface ParsedRequirementForm {
    title: string
    packagingUse: PackagingUse
    packagingType: PackagingType
    quantity: string
    size: string
    material: string
    brandingNeeded: boolean
    deliveryLocation: string
    requiredByDate: string
}

const PRESET_PROMPTS = [
    {
        label: "Pizza Boxes",
        prompt: "Need 2,500 matte black 12x12x2 inch corrugated pizza boxes with 2-color brand logo for artisanal takeaway delivery in Bandra West, Mumbai. Needed in 14 days.",
    },
    {
        label: "Coffee Cups",
        prompt: "5,000 double-wall paper coffee cups 8 oz with custom brand wrap for specialty cafe espresso bar in Indiranagar, Bengaluru. Needed by next month.",
    },
    {
        label: "Dessert Pastry Boxes",
        prompt: "1,200 food-grade kraft window pastry boxes 6x6x3 inch for bakery counter takeaway in Connaught Place, New Delhi. Unbranded is fine, needed in 10 days.",
    },
    {
        label: "Kraft Delivery Bags",
        prompt: "3,000 heavy-duty brown kraft paper delivery bags with twisted handles 10x14x5 inch with 1-color logo for cloud kitchen delivery in Hyderabad. Needed in 2 weeks.",
    },
]

export default function NewRequirementPage() {
    const router = useRouter()

    const [rawPrompt, setRawPrompt] = useState("")
    const [isParsing, setIsParsing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [structuredSpec, setStructuredSpec] = useState<ParsedRequirementForm | null>(null)

    // AI Parser - extracts Section 5 structured fields from plain language
    const handleParseWithAi = () => {
        if (!rawPrompt.trim()) {
            toast.error("Please enter a description of your packaging needs.")
            return
        }

        setIsParsing(true)
        setTimeout(() => {
            const text = rawPrompt.toLowerCase()

            // 1. Packaging Use
            let use: PackagingUse = "other"
            if (text.includes("coffee") || text.includes("tea") || text.includes("beverage")) use = "coffee"
            else if (text.includes("dessert") || text.includes("pastry") || text.includes("cake") || text.includes("bakery")) use = "dessert"
            else if (text.includes("takeaway")) use = "takeaway"
            else if (text.includes("delivery") || text.includes("kitchen")) use = "delivery"
            else if (text.includes("food") || text.includes("pizza") || text.includes("burger")) use = "food"

            // 2. Packaging Type
            let type: PackagingType = "custom"
            if (text.includes("cup")) type = "cups"
            else if (text.includes("box") || text.includes("carton")) type = "boxes"
            else if (text.includes("bag")) type = "bags"
            else if (text.includes("cutlery") || text.includes("spoon") || text.includes("fork")) type = "cutlery"
            else if (text.includes("container") || text.includes("bowl") || text.includes("tray")) type = "containers"

            // 3. Quantity
            const qtyMatch = rawPrompt.match(/\b\d{1,3}(,\d{3})*(\s*(units|pcs|pieces|nos))?\b/i)
            const quantity = qtyMatch ? `${qtyMatch[0]} units`.replace(/units units/i, "units") : "1,000 units"

            // 4. Size
            let size = "Custom specifications"
            const sizeMatch = rawPrompt.match(/\b\d+(\.\d+)?\s*(x|\*)\s*\d+(\.\d+)?(\s*(x|\*)\s*\d+(\.\d+)?)?\s*(inch|in|cm|mm|oz|ml)?\b/i)
            if (sizeMatch) {
                size = sizeMatch[0]
            } else if (text.includes("8 oz") || text.includes("8oz")) size = "8 oz (80mm rim)"
            else if (text.includes("12 oz") || text.includes("12oz")) size = "12 oz (90mm rim)"
            else if (text.includes("12 in") || text.includes("12 inch")) size = "12 x 12 x 2 inches"
            else if (text.includes("10 in") || text.includes("10 inch")) size = "10 x 10 x 2 inches"

            // 5. Material
            let material = "Standard commercial grade board"
            if (text.includes("corrugated") || text.includes("e-flute") || text.includes("kraft")) {
                material = "3-ply Recycled Kraft Board (E-Flute)"
            } else if (text.includes("double-wall") || text.includes("double wall")) {
                material = "Food-grade Double Wall Board (280 GSM)"
            } else if (text.includes("kraft paper") || text.includes("brown kraft")) {
                material = "Virgin Kraft Paper (120 GSM)"
            } else if (text.includes("food-grade") || text.includes("food grade")) {
                material = "Food-Grade Bleached Sulphate Board"
            }

            // 6. Branding Needed (yes/no)
            const brandingNeeded = !text.includes("unbranded") && !text.includes("no logo") && (text.includes("logo") || text.includes("print") || text.includes("brand") || text.includes("custom"))

            // 7. Delivery Location
            let deliveryLocation = "Bandra West, Mumbai, MH"
            if (text.includes("mumbai") || text.includes("bandra") || text.includes("andheri")) deliveryLocation = "Bandra West, Mumbai, MH"
            else if (text.includes("bengaluru") || text.includes("bangalore") || text.includes("indiranagar")) deliveryLocation = "Indiranagar, Bengaluru, KA"
            else if (text.includes("delhi") || text.includes("connaught")) deliveryLocation = "Connaught Place, New Delhi, DL"
            else if (text.includes("hyderabad")) deliveryLocation = "Jubilee Hills, Hyderabad, TS"
            else if (text.includes("pune")) deliveryLocation = "Koregaon Park, Pune, MH"

            // 8. Required-by date
            let requiredByDate = "In 14 days"
            if (text.includes("10 days")) requiredByDate = "In 10 days"
            else if (text.includes("2 weeks") || text.includes("two weeks")) requiredByDate = "In 14 days"
            else if (text.includes("next month")) requiredByDate = "In 30 days"
            else if (text.includes("urgent") || text.includes("1 week") || text.includes("one week")) requiredByDate = "In 7 days"

            // Title
            const title = `${type.charAt(0).toUpperCase() + type.slice(1)} (${size})`

            setStructuredSpec({
                title,
                packagingUse: use,
                packagingType: type,
                quantity,
                size,
                material,
                brandingNeeded,
                deliveryLocation,
                requiredByDate,
            })

            setIsParsing(false)
            toast.success("AI parsed requirements into Section 5 structured fields!")
        }, 700)
    }

    const handleBroadcast = async () => {
        if (!structuredSpec || isSaving) return

        setIsSaving(true)
        try {
            const result = await createRequirementAction({
                title: structuredSpec.title,
                packagingUse: structuredSpec.packagingUse,
                packagingType: structuredSpec.packagingType,
                quantity: structuredSpec.quantity,
                size: structuredSpec.size,
                material: structuredSpec.material,
                brandingNeeded: structuredSpec.brandingNeeded,
                deliveryLocation: structuredSpec.deliveryLocation,
                requiredByDate: structuredSpec.requiredByDate,
                rawDescription: rawPrompt,
            })

            if (!result.success) {
                toast.error(result.error || "Failed to save requirement.")
                setIsSaving(false)
                return
            }

            toast.success("Requirement broadcast and saved to database!")
            router.push("/business/requirements")
            router.refresh()
        } catch {
            toast.error("An unexpected error occurred while saving your requirement.")
            setIsSaving(false)
        }
    }

    return (
        <div className="mx-auto w-full max-w-4xl space-y-8 text-foreground">
            {/* Header with back navigation & breadcrumb */}
            <div className="flex items-center gap-3.5 border-b border-border/40 pb-5">
                <Button asChild variant="outline" size="icon" className="size-9 rounded-xl border-border/50 hover:bg-muted/50">
                    <Link href="/business/requirements" aria-label="Back to Requirements">
                        <ArrowLeft className="size-4" />
                    </Link>
                </Button>
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Link href="/business/requirements" className="hover:text-foreground transition-colors">
                            Requirements
                        </Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">New AI Intake</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
                        Submit Packaging Requirement
                    </h1>
                </div>
            </div>

            {/* MVP Brief Section 5 Info Callout */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs text-muted-foreground flex items-start gap-3">
                <Sparkles className="size-4 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <span className="font-semibold text-foreground">AI-Assisted Requirement Capture (Eureka MVP Section 5)</span>
                    <p className="leading-relaxed">
                        Describe what you need in plain words. UNIFIÉE parses it into the 8 canonical structured fields (use, type, quantity, size, material, branding, location, date) and broadcasts to all packaging vendors.
                    </p>
                </div>
            </div>

            {/* Step 1: Plain Language Intake */}
            <Card>
                <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 text-xs font-bold">1</span>
                        <span>Describe your packaging in plain language</span>
                    </CardTitle>
                    <CardDescription>
                        Mention dimensions, material, quantity, whether you need custom printing, and your delivery city.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        rows={4}
                        placeholder="e.g. Need 2,500 matte black 12x12x2 inch corrugated pizza boxes with 2-color brand logo for takeaway pizza in Bandra, Mumbai. Needed in 14 days."
                        value={rawPrompt}
                        onChange={(e) => setRawPrompt(e.target.value)}
                        className="text-sm bg-muted/20 resize-none p-3.5 leading-relaxed"
                    />

                    <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground block">
                            Or test with one-click sample scenarios:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {PRESET_PROMPTS.map((p, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setRawPrompt(p.prompt)}
                                    className="text-left text-xs p-3 rounded-lg border border-border/50 bg-card hover:border-blue-500/40 hover:bg-blue-500/5 transition-all cursor-pointer space-y-1"
                                >
                                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                                        <Sparkles className="size-3 text-blue-500" />
                                        <span>{p.label}</span>
                                    </div>
                                    <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                                        {p.prompt}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleParseWithAi}
                            disabled={isParsing || !rawPrompt.trim()}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm h-10 px-5 gap-2"
                        >
                            {isParsing ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    <span>Parsing structured fields...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="size-4" />
                                    <span>Parse with AI</span>
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Step 2: The 8 Canonical Structured Fields (Section 5) */}
            {structuredSpec && (
                <Card className="border-blue-500/30 bg-card shadow-sm animate-in fade-in-50 duration-200">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600 text-xs font-bold">2</span>
                                <span>Structured Specification Fields (Review & Edit)</span>
                            </CardTitle>
                            <CardDescription>
                                Verified fields generated from your description. Edit any field before broadcasting.
                            </CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-xs font-semibold px-3 py-1 uppercase tracking-wider self-start sm:self-center">
                            {structuredSpec.packagingType} • {structuredSpec.packagingUse}
                        </Badge>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* 1. Packaging Title */}
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className="text-xs font-medium text-muted-foreground">Requirement Title</Label>
                                <Input
                                    value={structuredSpec.title}
                                    onChange={(e) => setStructuredSpec({ ...structuredSpec, title: e.target.value })}
                                    className="h-9 text-sm"
                                />
                            </div>

                            {/* 2. Packaging Use */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Packaging Use (Section 5.1)
                                </Label>
                                <select
                                    value={structuredSpec.packagingUse}
                                    onChange={(e) => setStructuredSpec({ ...structuredSpec, packagingUse: e.target.value as PackagingUse })}
                                    className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    <option value="coffee">Coffee / Beverages</option>
                                    <option value="food">Food / Mains</option>
                                    <option value="dessert">Dessert / Bakery</option>
                                    <option value="delivery">Delivery</option>
                                    <option value="takeaway">Takeaway Counter</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* 3. Packaging Type */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Packaging Type (Section 5.2)
                                </Label>
                                <select
                                    value={structuredSpec.packagingType}
                                    onChange={(e) => setStructuredSpec({ ...structuredSpec, packagingType: e.target.value as PackagingType })}
                                    className="h-9 w-full rounded-md border border-input bg-card px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    <option value="cups">Cups</option>
                                    <option value="boxes">Boxes</option>
                                    <option value="bags">Bags</option>
                                    <option value="cutlery">Cutlery</option>
                                    <option value="containers">Containers</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>

                            {/* 4. Quantity */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Target Quantity (Section 5.3)
                                </Label>
                                <Input
                                    value={structuredSpec.quantity}
                                    onChange={(e) => setStructuredSpec({ ...structuredSpec, quantity: e.target.value })}
                                    className="h-9 text-xs"
                                />
                            </div>

                            {/* 5. Size */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Size / Dimensions (Section 5.4)
                                </Label>
                                <Input
                                    value={structuredSpec.size}
                                    onChange={(e) => setStructuredSpec({ ...structuredSpec, size: e.target.value })}
                                    className="h-9 text-xs"
                                />
                            </div>

                            {/* 6. Material */}
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Material Specification (Section 5.5)
                                </Label>
                                <Input
                                    value={structuredSpec.material}
                                    onChange={(e) => setStructuredSpec({ ...structuredSpec, material: e.target.value })}
                                    className="h-9 text-xs"
                                />
                            </div>

                            {/* 7. Branding Needed (yes/no) */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Branding Needed (Section 5.6)
                                </Label>
                                <div className="flex items-center gap-3 pt-1">
                                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input
                                            type="radio"
                                            name="branding"
                                            checked={structuredSpec.brandingNeeded === true}
                                            onChange={() => setStructuredSpec({ ...structuredSpec, brandingNeeded: true })}
                                            className="accent-blue-600"
                                        />
                                        <span>Yes (Custom print & logo)</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input
                                            type="radio"
                                            name="branding"
                                            checked={structuredSpec.brandingNeeded === false}
                                            onChange={() => setStructuredSpec({ ...structuredSpec, brandingNeeded: false })}
                                            className="accent-blue-600"
                                        />
                                        <span>No (Plain / Generic)</span>
                                    </label>
                                </div>
                            </div>

                            {/* 8. Required-by date */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Required-By Date (Section 5.8)
                                </Label>
                                <Input
                                    value={structuredSpec.requiredByDate}
                                    onChange={(e) => setStructuredSpec({ ...structuredSpec, requiredByDate: e.target.value })}
                                    className="h-9 text-xs"
                                />
                            </div>

                            {/* 9. Delivery Location */}
                            <div className="space-y-1.5 sm:col-span-2">
                                <Label className="text-xs font-medium text-muted-foreground">
                                    Delivery Location (Section 5.7)
                                </Label>
                                <Input
                                    value={structuredSpec.deliveryLocation}
                                    onChange={(e) => setStructuredSpec({ ...structuredSpec, deliveryLocation: e.target.value })}
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        {/* Broadcast Callout */}
                        <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-xs text-muted-foreground flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5">
                                <Radio className="size-4 text-blue-500 animate-pulse shrink-0" />
                                <span>
                                    <strong>Broadcast Model (Section 6)</strong>: Upon submission, all active packaging suppliers on UNIFIÉE will receive this specification simultaneously.
                                </span>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 pt-4 border-t border-border/40">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setStructuredSpec(null)}
                                className="h-10 px-4 text-xs"
                            >
                                Re-enter description
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleBroadcast}
                                disabled={isSaving}
                                className="h-10 px-5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Saving & Broadcasting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Broadcast to Suppliers</span>
                                        <ArrowRight className="size-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
