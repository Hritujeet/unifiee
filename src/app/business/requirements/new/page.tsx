"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    ArrowRight,
    Loader2,
    Sparkles,
    Info,
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
import { AiBadge } from "@/components/ai/ai-badge"
import { AiButton } from "@/components/ai/ai-button"
import { AiErrorState } from "@/components/ai/ai-error-state"
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

interface MissingField {
    field: string
    question: string
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
    const saveInFlightRef = useRef(false)

    const [rawPrompt, setRawPrompt] = useState("")
    const [isParsing, setIsParsing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [parseError, setParseError] = useState<string | null>(null)
    const [structuredSpec, setStructuredSpec] = useState<ParsedRequirementForm | null>(null)
    const [confidenceScore, setConfidenceScore] = useState<number | null>(null)
    const [missingFields, setMissingFields] = useState<MissingField[]>([])

    // AI Parser: Real LLM structured extraction (Gemini Flash).
    const handleParseWithAi = async () => {
        if (!rawPrompt.trim() || rawPrompt.trim().length < 5) {
            toast.error("Please enter a description of your packaging needs (at least 5 characters).")
            return
        }

        setIsParsing(true)
        setParseError(null)

        try {
            const res = await fetch("/api/ai/requirements/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: rawPrompt }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to parse requirements.")
            }

            const parsed = data.structured
            const validUse: PackagingUse = [
                "coffee",
                "food",
                "dessert",
                "delivery",
                "takeaway",
                "other",
            ].includes(parsed.packagingUse)
                ? (parsed.packagingUse as PackagingUse)
                : "other"

            const validType: PackagingType = [
                "cups",
                "boxes",
                "bags",
                "cutlery",
                "containers",
                "custom",
            ].includes(parsed.packagingType)
                ? (parsed.packagingType as PackagingType)
                : "custom"

            setStructuredSpec({
                title: parsed.title || `${validType.toUpperCase()} - Custom Packaging`,
                packagingUse: validUse,
                packagingType: validType,
                quantity: parsed.quantity || "",
                size: parsed.size || "",
                material: parsed.material || "",
                brandingNeeded: parsed.brandingNeeded ?? true,
                deliveryLocation: parsed.deliveryLocation || "",
                requiredByDate: parsed.requiredByDate || "",
            })

            setConfidenceScore(parsed.confidenceScore ?? 0.9)
            setMissingFields(parsed.missingFields || [])
            toast.success("AI parsed your specification. Review it before saving.")
        } catch (err: unknown) {
            console.error("AI parse error:", err)
            const msg = err instanceof Error ? err.message : "Failed to extract specification."
            setParseError(msg)
            toast.error(msg)
        } finally {
            setIsParsing(false)
        }
    }

    const isFieldMissing = (fieldName: string) => {
        return missingFields.find((m) => m.field.toLowerCase() === fieldName.toLowerCase())
    }

    const handleSave = async () => {
        if (!structuredSpec || isSaving || saveInFlightRef.current) return

        saveInFlightRef.current = true
        setIsSaving(true)
        try {
            const result = await createRequirementAction({
                title: structuredSpec.title,
                packagingUse: structuredSpec.packagingUse,
                packagingType: structuredSpec.packagingType,
                quantity: structuredSpec.quantity || "1,000 units",
                size: structuredSpec.size || "Custom size",
                material: structuredSpec.material || "Standard commercial board",
                brandingNeeded: structuredSpec.brandingNeeded,
                deliveryLocation: structuredSpec.deliveryLocation || "Delivery address",
                requiredByDate: structuredSpec.requiredByDate || "Flexible timeframe",
                rawDescription: rawPrompt,
                idempotencyKey: crypto.randomUUID(),
            })

            if (!result.success) {
                toast.error(result.error || "Failed to save requirement.")
                setIsSaving(false)
                return
            }

            toast.success("Requirement saved privately.")
            router.push("/business/requirements")
            router.refresh()
        } catch {
            toast.error("An unexpected error occurred while saving your requirement.")
            setIsSaving(false)
        } finally {
            saveInFlightRef.current = false
        }
    }

    return (
        <div className="mx-auto w-full max-w-4xl space-y-8 text-foreground pb-12">
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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2.5">
                        <span>Submit Packaging Requirement</span>
                        <AiBadge variant="ai-assisted" label="AI Builder" />
                    </h1>
                </div>
            </div>

            {/* MVP Brief Section 5 Info Callout */}
            <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="space-y-1">
                    <span className="font-semibold text-foreground">AI-Powered Specification Intake (Eureka MVP Section 5)</span>
                    <p className="leading-relaxed">
                        Describe what you need in plain words. UNIFIÉE parses it into canonical structured fields for your private vendor search.
                    </p>
                </div>
            </div>

            {/* Step 1: Plain Language Intake */}
            <Card className="border-border/60 shadow-xs">
                <CardHeader className="space-y-1 pb-4">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                        <span>Describe your packaging in plain language</span>
                    </CardTitle>
                    <CardDescription>
                        Mention dimensions, material, quantity, custom printing needs, and your delivery city.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        rows={4}
                        placeholder="e.g. Need 2,500 matte black 12x12x2 inch corrugated pizza boxes with 2-color brand logo for takeaway pizza in Bandra, Mumbai. Needed in 14 days."
                        value={rawPrompt}
                        onChange={(e) => setRawPrompt(e.target.value)}
                        className="text-sm bg-muted/20 resize-none p-3.5 leading-relaxed focus-visible:ring-purple-500"
                    />

                    {parseError && (
                        <AiErrorState
                            message={parseError}
                            onRetry={handleParseWithAi}
                            onDismiss={() => setParseError(null)}
                        />
                    )}

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
                                    className="text-left text-xs p-3 rounded-lg border border-border/50 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer space-y-1"
                                >
                                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                                        <Sparkles className="size-3 text-primary" />
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
                        <AiButton
                            onClick={handleParseWithAi}
                            loading={isParsing}
                            disabled={isParsing || !rawPrompt.trim()}
                            size="md"
                        >
                            <span>{isParsing ? "Extracting Specifications..." : "Parse with AI"}</span>
                        </AiButton>
                    </div>
                </CardContent>
            </Card>

            {/* Step 2: The Canonical Structured Fields */}
            {structuredSpec && (
                <div className="space-y-6 animate-in fade-in-50 duration-300">
                    <Card className="border-primary/20 bg-card shadow-sm">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600 text-xs font-bold">2</span>
                                    <span>Structured Specification Fields (Review & Edit)</span>
                                </CardTitle>
                                <CardDescription>
                                    Review AI-filled fields below. Fields with warning badges need your input.
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {confidenceScore !== null && (
                                    <Badge variant="outline" className="border-primary/30 text-primary text-xs font-medium">
                                        {Math.round(confidenceScore * 100)}% Confidence
                                    </Badge>
                                )}
                                <Badge variant="secondary" className="text-xs font-semibold px-3 py-1 uppercase tracking-wider">
                                    {structuredSpec.packagingType} • {structuredSpec.packagingUse}
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* 1. Packaging Title */}
                                <div className="space-y-1.5 sm:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-muted-foreground">Requirement Title</Label>
                                        <AiBadge variant="ai-filled" label="Generated Title" />
                                    </div>
                                    <Input
                                        value={structuredSpec.title}
                                        onChange={(e) => setStructuredSpec({ ...structuredSpec, title: e.target.value })}
                                        className="h-9 text-sm"
                                    />
                                </div>

                                {/* 2. Packaging Use */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Packaging Use (Section 5.1)
                                        </Label>
                                        <AiBadge variant="ai-filled" />
                                    </div>
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
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Packaging Type (Section 5.2)
                                        </Label>
                                        <AiBadge variant="ai-filled" />
                                    </div>
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
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Target Quantity (Section 5.3)
                                        </Label>
                                        {isFieldMissing("quantity") || !structuredSpec.quantity ? (
                                            <AiBadge variant="needs-input" />
                                        ) : (
                                            <AiBadge variant="ai-filled" />
                                        )}
                                    </div>
                                    <Input
                                        value={structuredSpec.quantity}
                                        placeholder="e.g. 5,000 units"
                                        onChange={(e) => setStructuredSpec({ ...structuredSpec, quantity: e.target.value })}
                                        className="h-9 text-xs"
                                    />
                                    {isFieldMissing("quantity") && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                            {isFieldMissing("quantity")?.question}
                                        </p>
                                    )}
                                </div>

                                {/* 5. Size */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Size / Dimensions (Section 5.4)
                                        </Label>
                                        {isFieldMissing("size") || !structuredSpec.size ? (
                                            <AiBadge variant="needs-input" />
                                        ) : (
                                            <AiBadge variant="ai-filled" />
                                        )}
                                    </div>
                                    <Input
                                        value={structuredSpec.size}
                                        placeholder="e.g. 12x12x2 inch, 8 oz"
                                        onChange={(e) => setStructuredSpec({ ...structuredSpec, size: e.target.value })}
                                        className="h-9 text-xs"
                                    />
                                    {isFieldMissing("size") && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                            {isFieldMissing("size")?.question}
                                        </p>
                                    )}
                                </div>

                                {/* 6. Material */}
                                <div className="space-y-1.5 sm:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Material Specification (Section 5.5)
                                        </Label>
                                        {isFieldMissing("material") || !structuredSpec.material ? (
                                            <AiBadge variant="needs-input" />
                                        ) : (
                                            <AiBadge variant="ai-filled" />
                                        )}
                                    </div>
                                    <Input
                                        value={structuredSpec.material}
                                        placeholder="e.g. 3-ply corrugated kraft board, 280 GSM food-grade cupstock"
                                        onChange={(e) => setStructuredSpec({ ...structuredSpec, material: e.target.value })}
                                        className="h-9 text-xs"
                                    />
                                    {isFieldMissing("material") && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                            {isFieldMissing("material")?.question}
                                        </p>
                                    )}
                                </div>

                                {/* 7. Branding Needed (yes/no) */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Branding Needed (Section 5.6)
                                        </Label>
                                        <AiBadge variant="ai-filled" />
                                    </div>
                                    <div className="flex items-center gap-3 pt-1">
                                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                                            <input
                                                type="radio"
                                                name="branding"
                                                checked={structuredSpec.brandingNeeded === true}
                                                onChange={() => setStructuredSpec({ ...structuredSpec, brandingNeeded: true })}
                                                className="accent-purple-600"
                                            />
                                            <span>Yes (Custom print & logo)</span>
                                        </label>
                                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                                            <input
                                                type="radio"
                                                name="branding"
                                                checked={structuredSpec.brandingNeeded === false}
                                                onChange={() => setStructuredSpec({ ...structuredSpec, brandingNeeded: false })}
                                                className="accent-purple-600"
                                            />
                                            <span>No (Plain / Generic)</span>
                                        </label>
                                    </div>
                                </div>

                                {/* 8. Required-by date */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Required-By Date (Section 5.8)
                                        </Label>
                                        {isFieldMissing("requiredByDate") || !structuredSpec.requiredByDate ? (
                                            <AiBadge variant="needs-input" />
                                        ) : (
                                            <AiBadge variant="ai-filled" />
                                        )}
                                    </div>
                                    <Input
                                        value={structuredSpec.requiredByDate}
                                        placeholder="e.g. Within 14 days, Next month"
                                        onChange={(e) => setStructuredSpec({ ...structuredSpec, requiredByDate: e.target.value })}
                                        className="h-9 text-xs"
                                    />
                                    {isFieldMissing("requiredByDate") && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                            {isFieldMissing("requiredByDate")?.question}
                                        </p>
                                    )}
                                </div>

                                {/* 9. Delivery Location */}
                                <div className="space-y-1.5 sm:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium text-muted-foreground">
                                            Delivery Location (Section 5.7)
                                        </Label>
                                        {isFieldMissing("deliveryLocation") || !structuredSpec.deliveryLocation ? (
                                            <AiBadge variant="needs-input" />
                                        ) : (
                                            <AiBadge variant="ai-filled" />
                                        )}
                                    </div>
                                    <Input
                                        value={structuredSpec.deliveryLocation}
                                        placeholder="e.g. Bandra West, Mumbai, MH"
                                        onChange={(e) => setStructuredSpec({ ...structuredSpec, deliveryLocation: e.target.value })}
                                        className="h-9 text-xs"
                                    />
                                    {isFieldMissing("deliveryLocation") && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                            {isFieldMissing("deliveryLocation")?.question}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Private storage callout */}
                            <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-xs text-muted-foreground flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2.5">
                                    <Info className="size-4 text-primary shrink-0" />
                                    <span>
                                        Your requirement is saved privately. Run a vendor search after saving when you are ready.
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
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs sm:text-sm gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Save Requirement</span>
                                            <ArrowRight className="size-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            )}
        </div>
    )
}
