"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createOfferingAction } from "@/actions/vendor-actions"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Package,
    IndianRupee,
    Loader2,
    Sparkles,
    Truck,
    Layers,
    ArrowLeft,
    Eye,
    MapPin,
    CheckCircle2,
    Clock,
} from "lucide-react"
import { AiButton } from "@/components/ai/ai-button"
import { AiBadge } from "@/components/ai/ai-badge"
import { AiSuggestionCard } from "@/components/ai/ai-suggestion-card"
import { AiErrorState } from "@/components/ai/ai-error-state"
import { toast } from "sonner"

interface AiSuggestionState {
    field: "title" | "description"
    original: string
    suggestedText: string
    rationale?: string
}

interface SpecsAuditState {
    isComplete: boolean
    presentDetails: string[]
    missingBuyerQuestions: string[]
    suggestedAdditions: string
}

export function PublishOfferingForm() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)

    // Form states
    const [category, setCategory] = useState("paper_cup")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [unitOfMeasure, setUnitOfMeasure] = useState<"piece" | "pack" | "carton" | "kg">("piece")
    const [unitPrice, setUnitPrice] = useState("4.50")
    const [minOrderQuantity, setMinOrderQuantity] = useState("1000")
    const [fulfilmentMode, setFulfilmentMode] = useState<"made_to_order" | "ready_stock">("made_to_order")
    const [leadTimeDaysMin, setLeadTimeDaysMin] = useState("5")
    const [leadTimeDaysMax, setLeadTimeDaysMax] = useState("10")
    const [material, setMaterial] = useState("")
    const [size, setSize] = useState("")
    const [city, setCity] = useState("Pune")
    const [state, setState] = useState("Maharashtra")
    const [pincode, setPincode] = useState("411001")
    const [shippingTerms, setShippingTerms] = useState<"buyer_pays" | "vendor_pays" | "included">("buyer_pays")

    // AI Assist states
    const [aiLoadingField, setAiLoadingField] = useState<"title" | "description" | "specs" | null>(null)
    const [activeSuggestion, setActiveSuggestion] = useState<AiSuggestionState | null>(null)
    const [specsAudit, setSpecsAudit] = useState<SpecsAuditState | null>(null)
    const [aiError, setAiError] = useState<string | null>(null)

    const parsedPrice = parseFloat(unitPrice) || 0
    const parsedMoq = parseInt(minOrderQuantity) || 0
    const calculatedBatchTotal = parsedPrice * parsedMoq

    const handleAiAssist = async (mode: "suggest_title" | "improve_description" | "check_specs") => {
        setAiError(null)
        const loadingKey =
            mode === "suggest_title"
                ? "title"
                : mode === "improve_description"
                ? "description"
                : mode === "check_specs"
                ? "specs"
                : "specs"

        setAiLoadingField(loadingKey)

        try {
            const res = await fetch("/api/ai/vendor/assist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode,
                    title,
                    description,
                    category,
                    material,
                    size,
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || "AI assist request failed.")
            }

            if (mode === "suggest_title") {
                setActiveSuggestion({
                    field: "title",
                    original: title,
                    suggestedText: data.suggestion.suggestedText,
                    rationale: data.suggestion.rationale,
                })
                toast.success("AI generated title suggestion!")
            } else if (mode === "improve_description") {
                setActiveSuggestion({
                    field: "description",
                    original: description,
                    suggestedText: data.suggestion.suggestedText,
                    rationale: data.suggestion.rationale,
                })
                toast.success("AI generated description polish!")
            } else if (mode === "check_specs") {
                setSpecsAudit(data.audit)
                toast.success("Packaging technical specifications audited!")
            }
        } catch (err: unknown) {
            console.error("Vendor AI assist error:", err)
            const msg = err instanceof Error ? err.message : "AI assist failed."
            setAiError(msg)
            toast.error(msg)
        } finally {
            setAiLoadingField(null)
        }
    }

    const handleSubmit = async (status: "active" | "draft") => {
        if (!title.trim()) {
            toast.error("Please enter a title for your offering")
            return
        }

        const price = parseFloat(unitPrice)
        if (isNaN(price) || price <= 0) {
            toast.error("Please enter a valid unit price")
            return
        }

        const moq = parseInt(minOrderQuantity)
        if (isNaN(moq) || moq <= 0) {
            toast.error("Please enter a valid minimum order quantity")
            return
        }

        setSubmitting(true)
        try {
            const res = await createOfferingAction({
                category,
                title: title.trim(),
                description:
                    description.trim() ||
                    `${title.trim()} - High quality food & beverage packaging.`,
                unitOfMeasure,
                unitPrice: price,
                minOrderQuantity: moq,
                fulfilmentMode,
                leadTimeDaysMin: parseInt(leadTimeDaysMin) || 5,
                leadTimeDaysMax: parseInt(leadTimeDaysMax) || 10,
                shippingTerms,
                city: city.trim() || "Mumbai",
                state: state.trim() || "Maharashtra",
                pincode: pincode.trim() || "400001",
                material: material.trim(),
                size: size.trim(),
                status,
            })

            if (!res.success) {
                toast.error(res.error || "Failed to publish offering")
                return
            }

            toast.success("Offering published and indexed in AI marketplace vector database!")
            router.push("/manufacturer/offerings")
            router.refresh()
        } catch (err: unknown) {
            console.error("Error creating offering:", err)
            toast.error("An unexpected error occurred.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="mx-auto max-w-6xl space-y-7 pb-16">
            {/* Top Navigation & Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                            Post Packaging Offering
                        </h1>
                        <AiBadge variant="ai-assisted" label="AI Assisted Studio" />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Define product specifications, minimum order quantity, and pricing for B2B buyers.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                        disabled={submitting}
                        className="text-xs h-8"
                    >
                        <ArrowLeft className="mr-1.5 size-3.5" />
                        Cancel
                    </Button>
                </div>
            </div>

            {aiError && (
                <AiErrorState
                    message={aiError}
                    onDismiss={() => setAiError(null)}
                />
            )}

            {/* Split Grid: Form Configuration (Left) & Live Buyer Preview (Right) */}
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-12">
                {/* Form Inputs (Left: 7 cols) */}
                <div className="space-y-6 lg:col-span-7">
                    {/* Section 1: Product Specifications */}
                    <Card className="shadow-xs border bg-card">
                        <CardHeader className="p-5 pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <Package className="size-4 text-primary" />
                                1. Packaging Category & Identity
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Choose the product classification and primary dimensions.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-5 pt-2 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-xs font-semibold">
                                    Packaging Category <span className="text-destructive">*</span>
                                </Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger id="category" className="h-9 text-xs bg-background">
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="paper_cup">Paper Cups & Tumblers</SelectItem>
                                        <SelectItem value="pizza_box">Pizza Boxes & Corrugated</SelectItem>
                                        <SelectItem value="corrugated_box">Shipping Cartons & Boxes</SelectItem>
                                        <SelectItem value="food_container">Food Containers & Meal Trays</SelectItem>
                                        <SelectItem value="pouch">Pouches & Bags</SelectItem>
                                        <SelectItem value="paper_bag">Paper Carry Bags</SelectItem>
                                        <SelectItem value="cutlery">Cutlery & Wooden Ware</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Offering Title + AI Polish Button */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="title" className="text-xs font-semibold">
                                        Offering Title <span className="text-destructive">*</span>
                                    </Label>
                                    <AiButton
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        loading={aiLoadingField === "title"}
                                        onClick={() => handleAiAssist("suggest_title")}
                                    >
                                        Polish Title
                                    </AiButton>
                                </div>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. 12oz Ripple Wall Kraft Coffee Cup"
                                    className="h-9 text-xs bg-background"
                                />

                                {/* Suggestion Card for Title */}
                                {activeSuggestion?.field === "title" && (
                                    <AiSuggestionCard
                                        title="AI Title Suggestion"
                                        fieldLabel="Offering Title"
                                        original={activeSuggestion.original}
                                        suggestion={activeSuggestion.suggestedText}
                                        rationale={activeSuggestion.rationale}
                                        onAccept={(acceptedText) => {
                                            setTitle(acceptedText)
                                            setActiveSuggestion(null)
                                            toast.success("Title updated!")
                                        }}
                                        onEdit={(newVal) => {
                                            setTitle(newVal)
                                            setActiveSuggestion(null)
                                        }}
                                        onDismiss={() => setActiveSuggestion(null)}
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="size" className="text-xs font-semibold">
                                        Dimensions / Volume Size
                                    </Label>
                                    <Input
                                        id="size"
                                        value={size}
                                        onChange={(e) => setSize(e.target.value)}
                                        placeholder="e.g. 12oz (350ml) or 9x9x2 in"
                                        className="h-9 text-xs bg-background"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="material" className="text-xs font-semibold">
                                        Material & GSM Spec
                                    </Label>
                                    <Input
                                        id="material"
                                        value={material}
                                        onChange={(e) => setMaterial(e.target.value)}
                                        placeholder="e.g. Poly-Coated Paperboard (300 GSM)"
                                        className="h-9 text-xs bg-background"
                                    />
                                </div>
                            </div>

                            {/* Detailed Description + AI Polish & Specs Audit */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="description" className="text-xs font-semibold">
                                        Detailed Description & Features
                                    </Label>
                                    <div className="flex items-center gap-1.5">
                                        <AiButton
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            loading={aiLoadingField === "specs"}
                                            onClick={() => handleAiAssist("check_specs")}
                                        >
                                            Audit Specs
                                        </AiButton>
                                        <AiButton
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            loading={aiLoadingField === "description"}
                                            onClick={() => handleAiAssist("improve_description")}
                                        >
                                            Polish Description
                                        </AiButton>
                                    </div>
                                </div>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Highlight lid compatibility, heat retention, eco certifications, custom printing options..."
                                    className="resize-none text-xs bg-background"
                                />

                                {/* Suggestion Card for Description */}
                                {activeSuggestion?.field === "description" && (
                                    <AiSuggestionCard
                                        title="AI Commercial Copy Polish"
                                        fieldLabel="Description"
                                        original={activeSuggestion.original}
                                        suggestion={activeSuggestion.suggestedText}
                                        rationale={activeSuggestion.rationale}
                                        onAccept={(acceptedText) => {
                                            setDescription(acceptedText)
                                            setActiveSuggestion(null)
                                            toast.success("Description updated!")
                                        }}
                                        onEdit={(newVal) => {
                                            setDescription(newVal)
                                            setActiveSuggestion(null)
                                        }}
                                        onDismiss={() => setActiveSuggestion(null)}
                                    />
                                )}

                                {/* Specs Audit Callout */}
                                {specsAudit && (
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2 text-xs">
                                        <div className="flex items-center justify-between font-semibold text-foreground">
                                            <span className="flex items-center gap-1.5 text-primary">
                                                <Sparkles className="size-3.5" />
                                                <span>Technical Specifications Audit</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setSpecsAudit(null)}
                                                className="text-muted-foreground hover:text-foreground text-[11px]"
                                            >
                                                Dismiss
                                            </button>
                                        </div>

                                        {specsAudit.missingBuyerQuestions.length > 0 && (
                                            <div className="space-y-1">
                                                <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                                                    Missing details buyers often ask:
                                                </div>
                                                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                                                    {specsAudit.missingBuyerQuestions.map((q, idx) => (
                                                        <li key={idx}>{q}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {specsAudit.suggestedAdditions && (
                                            <div className="pt-1.5">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setDescription(
                                                            (prev) => `${prev.trim()}\n\n${specsAudit.suggestedAdditions}`
                                                        )
                                                        setSpecsAudit(null)
                                                        toast.success("Technical specifications appended!")
                                                    }}
                                                    className="h-7 text-xs font-medium"
                                                >
                                                    Append Suggested Technical Specs
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 2: Pricing & Minimum Limits */}
                    <Card className="shadow-xs border bg-card">
                        <CardHeader className="p-5 pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <Layers className="size-4 text-primary" />
                                2. Commercial Economics & Minimum Order Qty
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Set your unit wholesale price and required production batch size.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-5 pt-2">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="uom" className="text-xs font-semibold">
                                        Unit of Measure
                                    </Label>
                                    <Select
                                        value={unitOfMeasure}
                                        onValueChange={(val) =>
                                            setUnitOfMeasure(val as "piece" | "pack" | "carton" | "kg")
                                        }
                                    >
                                        <SelectTrigger id="uom" className="h-9 text-xs bg-background">
                                            <SelectValue placeholder="Unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="piece">Piece (pc)</SelectItem>
                                            <SelectItem value="pack">Pack / Sleeve</SelectItem>
                                            <SelectItem value="carton">Master Carton</SelectItem>
                                            <SelectItem value="kg">Kilogram (kg)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-xs font-semibold">
                                        Base Unit Price (₹) <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                        <Input
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            value={unitPrice}
                                            onChange={(e) => setUnitPrice(e.target.value)}
                                            placeholder="4.50"
                                            className="h-9 pl-8 font-mono text-xs font-bold bg-background"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="moq" className="text-xs font-semibold">
                                        Min Order Qty (MOQ) <span className="text-destructive">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="moq"
                                            type="number"
                                            value={minOrderQuantity}
                                            onChange={(e) => setMinOrderQuantity(e.target.value)}
                                            placeholder="1000"
                                            className="h-9 pr-14 font-mono text-xs font-bold bg-background"
                                        />
                                        <span className="pointer-events-none absolute right-2.5 top-2.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                                            {unitOfMeasure}s
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 3: Fulfilment Logistics */}
                    <Card className="shadow-xs border bg-card">
                        <CardHeader className="p-5 pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <Truck className="size-4 text-primary" />
                                3. Turnaround, Logistics & Location
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Delivery lead times, freight terms, and dispatch warehouse origin.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-5 pt-2 space-y-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="mode" className="text-xs font-semibold">
                                        Production Mode
                                    </Label>
                                    <Select
                                        value={fulfilmentMode}
                                        onValueChange={(val) =>
                                            setFulfilmentMode(val as "made_to_order" | "ready_stock")
                                        }
                                    >
                                        <SelectTrigger id="mode" className="h-9 text-xs bg-background">
                                            <SelectValue placeholder="Mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="made_to_order">
                                                 Made to Order (Production Run)
                                            </SelectItem>
                                            <SelectItem value="ready_stock">
                                                Ready Stock in Warehouse
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="shipping" className="text-xs font-semibold">
                                        Shipping Terms
                                    </Label>
                                    <Select
                                        value={shippingTerms}
                                        onValueChange={(val) =>
                                            setShippingTerms(val as "buyer_pays" | "vendor_pays" | "included")
                                        }
                                    >
                                        <SelectTrigger id="shipping" className="h-9 text-xs bg-background">
                                            <SelectValue placeholder="Shipping Terms" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="buyer_pays">Buyer Pays Freight</SelectItem>
                                            <SelectItem value="vendor_pays">Vendor Pays (Free Shipping)</SelectItem>
                                            <SelectItem value="included">Freight Included in Price</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="leadMin" className="text-xs font-semibold">
                                        Min Lead Time (Days)
                                    </Label>
                                    <Input
                                        id="leadMin"
                                        type="number"
                                        value={leadTimeDaysMin}
                                        onChange={(e) => setLeadTimeDaysMin(e.target.value)}
                                        className="h-9 font-mono text-xs bg-background"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="leadMax" className="text-xs font-semibold">
                                        Max Lead Time (Days)
                                    </Label>
                                    <Input
                                        id="leadMax"
                                        type="number"
                                        value={leadTimeDaysMax}
                                        onChange={(e) => setLeadTimeDaysMax(e.target.value)}
                                        className="h-9 font-mono text-xs bg-background"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1">
                                <div className="space-y-2">
                                    <Label htmlFor="city" className="text-xs font-semibold">
                                        Dispatch City
                                    </Label>
                                    <Input
                                        id="city"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="h-9 text-xs bg-background"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state" className="text-xs font-semibold">
                                        State
                                    </Label>
                                    <Input
                                        id="state"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                        className="h-9 text-xs bg-background"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pincode" className="text-xs font-semibold">
                                        Pincode
                                    </Label>
                                    <Input
                                        id="pincode"
                                        value={pincode}
                                        onChange={(e) => setPincode(e.target.value)}
                                        className="h-9 font-mono text-xs bg-background"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Live Marketplace Preview Card & Matching Requirements (Right: 5 cols) */}
                <div className="space-y-5 lg:col-span-5">
                    <div className="sticky top-20 space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <Eye className="size-3.5 text-primary" />
                            Live Buyer Directory Preview
                        </div>

                        {/* Interactive Preview Card */}
                        <Card className="border-2 border-primary/30 shadow-md bg-card overflow-hidden">
                            <div className="bg-primary/5 px-4 py-2.5 border-b border-primary/20 flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    How Buyers See Your Offering
                                </span>
                                <Badge variant="outline" className="text-[9px] uppercase font-bold">
                                    {fulfilmentMode.replace("_", " ")}
                                </Badge>
                            </div>

                            <CardContent className="p-5 space-y-4">
                                <div className="space-y-1">
                                    <Badge variant="secondary" className="text-[10px] uppercase font-semibold capitalize">
                                        {category.replace("_", " ")}
                                    </Badge>
                                    <h3 className="font-heading text-base font-extrabold text-foreground leading-snug">
                                        {title.trim() || "12oz Ripple Wall Kraft Coffee Cup"}
                                    </h3>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {description.trim() || "Food-grade sustainable packaging with superior thermal retention."}
                                    </p>
                                </div>

                                {(material || size) && (
                                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                                        {size && <span className="rounded bg-muted px-2 py-0.5 font-medium">{size}</span>}
                                        {material && <span className="rounded bg-muted px-2 py-0.5 font-medium">{material}</span>}
                                    </div>
                                )}

                                {/* Economics Display */}
                                <div className="rounded-xl bg-muted/50 p-3.5 space-y-2 border">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-xs text-muted-foreground">Unit Wholesale Price</span>
                                        <span className="text-lg font-black text-foreground">
                                            ₹{parsedPrice > 0 ? parsedPrice.toFixed(2) : "0.00"}
                                            <span className="text-xs font-normal text-muted-foreground"> / {unitOfMeasure}</span>
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                                        <span>Min Order Batch</span>
                                        <span className="font-semibold text-foreground">
                                            {parsedMoq.toLocaleString()} {unitOfMeasure}s
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                                        <span className="font-medium text-foreground">Min Order Value</span>
                                        <span className="font-bold text-primary text-sm">
                                            ₹{calculatedBatchTotal.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1.5 text-[11px] text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="size-3 text-muted-foreground" />
                                        <span>Lead Time: <strong>{leadTimeDaysMin}-{leadTimeDaysMax} days</strong> turnaround</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="size-3 text-muted-foreground" />
                                        <span>Ships from <strong>{city}, {state}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle2 className="size-3 text-emerald-500" />
                                        <span>Escrow Protection: Payment released on buyer receipt</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 pt-2">
                            <Button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleSubmit("active")}
                                className="h-10 w-full gap-2 text-xs font-bold shadow-sm"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Publishing Offering...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="size-4" />
                                        Publish Offering (Live in Catalog)
                                    </>
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                disabled={submitting}
                                onClick={() => handleSubmit("draft")}
                                className="h-9 w-full text-xs font-medium"
                            >
                                Save as Draft
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}