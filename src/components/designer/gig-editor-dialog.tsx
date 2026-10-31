"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Boxes,
    Check,
    Clock3,
    FileText,
    HelpCircle,
    ImagePlus,
    Loader2,
    Plus,
    RotateCcw,
    Sparkles,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { saveDesignerGig, type GigFormValues } from "@/actions/designer-services"
import type { DesignerService, DesignerServicePackage, DesignerServiceExtra } from "@/lib/db/schema/designer-service"

export interface GigEditorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialGig?: DesignerService & {
        packages?: DesignerServicePackage[]
        extras?: DesignerServiceExtra[]
    }
    hasBio: boolean
    hasSpecialization: boolean
}

const CATEGORIES = [
    { value: "dieline_structural", label: "Dieline & Structural Packaging" },
    { value: "label_sticker", label: "Label & Bottle Sticker" },
    { value: "logo_brand_identity", label: "Logo & Brand Identity" },
    { value: "3d_mockup_render", label: "3D Mockup & Photorealistic Render" },
    { value: "full_packaging_set", label: "Full Packaging Suite" },
] as const

const COMMON_PACKAGING_TYPES = [
    "Folding Cartons", "Paper Cups", "Kraft Pouches", "Glass Bottles", "Tin Cans",
    "Corrugated Boxes", "Stickers & Labels", "Flexible Packaging", "Takeaway Bags"
]

const COMMON_SOFTWARE = [
    "Adobe Illustrator", "Adobe Photoshop", "Blender 3D", "Cinema 4D", "Esko ArtiosCAD", "InDesign"
]

export function GigEditorDialog({
    open,
    onOpenChange,
    initialGig,
    hasBio,
    hasSpecialization,
}: GigEditorProps) {
    const router = useRouter()
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)
    const [isPending, startTransition] = useTransition()

    // AI Assist state
    const [aiConcept, setAiConcept] = useState("")
    const [isGeneratingAi, setIsGeneratingAi] = useState(false)

    // Form state
    const [title, setTitle] = useState(initialGig?.title || "")
    const [category, setCategory] = useState<GigFormValues["category"]>(
        (initialGig?.category as any) || "dieline_structural"
    )
    const [description, setDescription] = useState(initialGig?.description || "")
    const [tags, setTags] = useState<string[]>(initialGig?.tags || ["packaging", "dieline", "cmyk"])
    const [tagInput, setTagInput] = useState("")
    const [packagingTypes, setPackagingTypes] = useState<string[]>(
        initialGig?.packagingTypes || ["Folding Cartons", "Kraft Pouches"]
    )
    const [softwareUsed, setSoftwareUsed] = useState<string[]>(
        initialGig?.softwareUsed || ["Adobe Illustrator", "Photoshop"]
    )

    // Packages state
    const defaultBasic = initialGig?.packages?.find((p) => p.tier === "basic")
    const defaultStandard = initialGig?.packages?.find((p) => p.tier === "standard")
    const defaultPremium = initialGig?.packages?.find((p) => p.tier === "premium")

    const [packageTierTab, setPackageTierTab] = useState<"basic" | "standard" | "premium">("basic")

    const [basicPkg, setBasicPkg] = useState({
        name: defaultBasic?.name || "Basic Dieline & Artwork",
        description: defaultBasic?.description || "Single package dieline with print-ready vector CMYK layout.",
        price: defaultBasic ? Number(defaultBasic.price) : 4500,
        deliveryDays: defaultBasic?.deliveryDays || 5,
        revisionsIncluded: defaultBasic?.revisionsIncluded ?? 2,
        deliverables: defaultBasic?.deliverables?.length ? defaultBasic.deliverables.join("\n") : "Print-Ready Vector PDF\nDie-Cut Lines\nCommercial Rights",
        sourceFilesIncluded: defaultBasic?.sourceFilesIncluded ?? false,
        commercialUseIncluded: defaultBasic?.commercialUseIncluded ?? true,
    })

    const [hasStandard, setHasStandard] = useState(Boolean(defaultStandard))
    const [standardPkg, setStandardPkg] = useState({
        name: defaultStandard?.name || "Standard Production Suite",
        description: defaultStandard?.description || "Front & back packaging dieline, 3D realistic mockup, plus source vector files.",
        price: defaultStandard ? Number(defaultStandard.price) : 8500,
        deliveryDays: defaultStandard?.deliveryDays || 7,
        revisionsIncluded: defaultStandard?.revisionsIncluded ?? 4,
        deliverables: defaultStandard?.deliverables?.length ? defaultStandard.deliverables.join("\n") : "Print-Ready Vector PDF\nLayered Source AI\n3D Render Mockup\nCommercial Rights",
        sourceFilesIncluded: defaultStandard?.sourceFilesIncluded ?? true,
        commercialUseIncluded: defaultStandard?.commercialUseIncluded ?? true,
    })

    const [hasPremium, setHasPremium] = useState(Boolean(defaultPremium))
    const [premiumPkg, setPremiumPkg] = useState({
        name: defaultPremium?.name || "Full Packaging & Brand Suite",
        description: defaultPremium?.description || "Complete multi-SKU packaging family, 3D high-res renders, foil/varnish finishing layers, unlimited revisions.",
        price: defaultPremium ? Number(defaultPremium.price) : 16000,
        deliveryDays: defaultPremium?.deliveryDays || 10,
        revisionsIncluded: defaultPremium?.revisionsIncluded ?? -1,
        deliverables: defaultPremium?.deliverables?.length ? defaultPremium.deliverables.join("\n") : "Complete Packaging Family\nSpot UV & Foil Callout Layers\nSource Vector AI/EPS\nPhotorealistic 3D Renders\nUnlimited Revisions",
        sourceFilesIncluded: defaultPremium?.sourceFilesIncluded ?? true,
        commercialUseIncluded: defaultPremium?.commercialUseIncluded ?? true,
    })

    // Extras
    const [extras, setExtras] = useState<{ name: string; price: number; extraDays: number }[]>(
        initialGig?.extras?.map((e) => ({
            name: e.name,
            price: Number(e.price),
            extraDays: e.extraDays || 0,
        })) || [
            { name: "3D Photorealistic Render", price: 2000, extraDays: 1 },
            { name: "Extra Revision Pass", price: 1000, extraDays: 1 },
        ]
    )

    // Gallery Sample Images
    const [sampleImages, setSampleImages] = useState<string[]>(
        initialGig?.sampleImages?.length ? initialGig.sampleImages : ["https://images.unsplash.com/photo-1544816155-12df9643f363"]
    )
    const [imageUrlInput, setImageUrlInput] = useState("")

    // FAQ
    const [faq, setFaq] = useState<{ question: string; answer: string }[]>(
        initialGig?.faq || [
            {
                question: "Do you supply print-ready files with bleed margins?",
                answer: "Yes, all final artwork files include standard 3mm bleed margins, cut & fold lines, and CMYK color profiles.",
            },
            {
                question: "Can I use the designs commercially?",
                answer: "Yes, full commercial rights are included with all completed orders.",
            },
        ]
    )
    const [newFaqQ, setNewFaqQ] = useState("")
    const [newFaqA, setNewFaqA] = useState("")

    // Tag and category toggle helpers
    const addTag = () => {
        if (!tagInput.trim() || tags.includes(tagInput.trim())) return
        setTags([...tags, tagInput.trim().toLowerCase()])
        setTagInput("")
    }
    const removeTag = (t: string) => setTags(tags.filter((x) => x !== t))

    const togglePackagingType = (t: string) => {
        setPackagingTypes((prev) =>
            prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
        )
    }

    const toggleSoftware = (s: string) => {
        setSoftwareUsed((prev) =>
            prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
        )
    }

    const addImage = () => {
        if (!imageUrlInput.trim() || !/^https:\/\//i.test(imageUrlInput.trim())) {
            toast.error("Please enter a valid HTTPS image URL.")
            return
        }
        if (sampleImages.length >= 6) {
            toast.error("Maximum 6 sample images.")
            return
        }
        setSampleImages([...sampleImages, imageUrlInput.trim()])
        setImageUrlInput("")
    }

    const removeImage = (index: number) => {
        setSampleImages(sampleImages.filter((_, idx) => idx !== index))
    }

    const addFaq = () => {
        if (!newFaqQ.trim() || !newFaqA.trim()) return
        setFaq([...faq, { question: newFaqQ.trim(), answer: newFaqA.trim() }])
        setNewFaqQ("")
        setNewFaqA("")
    }

    const removeFaq = (idx: number) => {
        setFaq(faq.filter((_, i) => i !== idx))
    }

    // AI Generation
    const handleGenerateWithAi = async () => {
        if (!aiConcept.trim()) {
            toast.error("Describe your packaging gig concept in 1 sentence.")
            return
        }

        setIsGeneratingAi(true)
        try {
            const res = await fetch("/api/ai/designer/assist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "gig_creator",
                    rawNotes: aiConcept,
                    category,
                }),
            })
            const data = await res.json().catch(() => ({}))
            const g = data?.gig

            if (g) {
                if (g.title) setTitle(g.title)
                if (g.description) setDescription(g.description)
                if (g.deliverables?.length) {
                    setBasicPkg((p) => ({ ...p, deliverables: g.deliverables.join("\n") }))
                }
                if (g.faq?.length) {
                    setFaq(g.faq)
                }
                toast.success("Draft generated")
            } else {
                toast.error("Couldn't generate draft")
            }
        } catch (err: any) {
            toast.error("Couldn't generate draft")
        } finally {
            setIsGeneratingAi(false)
        }
    }

    // Submission: draft or publish
    const handleSubmit = (finalStatus: "published" | "draft") => {
        if (finalStatus === "published") {
            if (!hasBio || !hasSpecialization) {
                toast.error("Profile incomplete", { description: "Add bio and specialization to publish." })
                return
            }
            if (!title.trim() || title.length < 5) {
                toast.error("Please enter a clear gig title.")
                setStep(1)
                return
            }
            if (!description.trim() || description.length < 20) {
                toast.error("Please provide a detailed gig description.")
                setStep(1)
                return
            }
            if (sampleImages.length === 0) {
                toast.error("Please add at least one work sample image.")
                setStep(3)
                return
            }
        }

        // Build packages array
        const packagesList: GigFormValues["packages"] = [
            {
                tier: "basic",
                name: basicPkg.name.trim(),
                description: basicPkg.description.trim(),
                price: Number(basicPkg.price),
                deliveryDays: Number(basicPkg.deliveryDays),
                revisionsIncluded: Number(basicPkg.revisionsIncluded),
                deliverables: basicPkg.deliverables.split("\n").map((s) => s.trim()).filter(Boolean),
                sourceFilesIncluded: basicPkg.sourceFilesIncluded,
                commercialUseIncluded: basicPkg.commercialUseIncluded,
            },
        ]

        if (hasStandard) {
            packagesList.push({
                tier: "standard",
                name: standardPkg.name.trim(),
                description: standardPkg.description.trim(),
                price: Number(standardPkg.price),
                deliveryDays: Number(standardPkg.deliveryDays),
                revisionsIncluded: Number(standardPkg.revisionsIncluded),
                deliverables: standardPkg.deliverables.split("\n").map((s) => s.trim()).filter(Boolean),
                sourceFilesIncluded: standardPkg.sourceFilesIncluded,
                commercialUseIncluded: standardPkg.commercialUseIncluded,
            })
        }

        if (hasPremium) {
            packagesList.push({
                tier: "premium",
                name: premiumPkg.name.trim(),
                description: premiumPkg.description.trim(),
                price: Number(premiumPkg.price),
                deliveryDays: Number(premiumPkg.deliveryDays),
                revisionsIncluded: Number(premiumPkg.revisionsIncluded),
                deliverables: premiumPkg.deliverables.split("\n").map((s) => s.trim()).filter(Boolean),
                sourceFilesIncluded: premiumPkg.sourceFilesIncluded,
                commercialUseIncluded: premiumPkg.commercialUseIncluded,
            })
        }

        startTransition(async () => {
            const res = await saveDesignerGig({
                id: initialGig?.id,
                title: title.trim() || "Untitled Packaging Gig",
                category,
                description: description.trim() || "Packaging design service.",
                tags,
                packagingTypes,
                softwareUsed,
                sampleImages,
                faq,
                packages: packagesList,
                extras,
                status: finalStatus,
            })

            if (res.success) {
                toast.success(finalStatus === "published" ? "Gig published" : "Draft saved")
                onOpenChange(false)
                router.refresh()
            } else {
                toast.error("Couldn't save gig")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !isPending && onOpenChange(o)}>
            <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-6">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="font-heading text-lg font-bold flex items-center gap-2">
                            <span>{initialGig ? "Edit Packaging Gig" : "Create a Packaging Gig"}</span>
                        </DialogTitle>
                        <Badge variant="outline" className="text-xs">
                            Step {step} of 5
                        </Badge>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Fiverr-style tiered packaging service with clear deliverables and commercial licensing.
                    </DialogDescription>
                </DialogHeader>

                {/* Stepper Progress bar */}
                <div className="grid grid-cols-5 gap-1.5 py-2">
                    {[
                        { num: 1, label: "Overview" },
                        { num: 2, label: "Packages" },
                        { num: 3, label: "Gallery" },
                        { num: 4, label: "FAQ" },
                        { num: 5, label: "Review" },
                    ].map((s) => (
                        <button
                            key={s.num}
                            type="button"
                            onClick={() => setStep(s.num as any)}
                            className={`h-1.5 rounded-full transition-colors ${
                                step >= s.num ? "bg-blue-600" : "bg-muted"
                            }`}
                        />
                    ))}
                </div>

                {/* STEP 1: Overview */}
                {step === 1 && (
                    <div className="space-y-4 pt-2">
                        {/* AI Gig Copywriting Mini Box */}
                        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <Sparkles className="size-3.5 text-blue-500" />
                                    <span>AI Gig Copywriter</span>
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    value={aiConcept}
                                    onChange={(e) => setAiConcept(e.target.value)}
                                    placeholder="e.g. Artisanal cold-pressed juice labels & bottle structural mockups"
                                    className="text-xs h-8.5 bg-background"
                                />
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={isGeneratingAi}
                                    onClick={handleGenerateWithAi}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs shrink-0 h-8.5 gap-1"
                                >
                                    {isGeneratingAi ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                                    <span>Draft with AI</span>
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Gig Title</label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. I will design custom folding carton dielines and photorealistic renders"
                                className="text-xs h-9"
                            />
                            <p className="text-[11px] text-muted-foreground">Keep it action-oriented and specific.</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Packaging Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as any)}
                                className="w-full h-9 rounded-lg border border-border/60 bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-blue-500"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Detailed Description</label>
                            <Textarea
                                rows={5}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Explain what makes your dielines print-ready, your process, and file deliverables..."
                                className="text-xs leading-relaxed"
                            />
                        </div>

                        {/* Supported Packaging Types */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground">Supported Packaging Types</label>
                            <div className="flex flex-wrap gap-1.5">
                                {COMMON_PACKAGING_TYPES.map((t) => {
                                    const active = packagingTypes.includes(t)
                                    return (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => togglePackagingType(t)}
                                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                                                active
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Software Tools */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-foreground">Software Used</label>
                            <div className="flex flex-wrap gap-1.5">
                                {COMMON_SOFTWARE.map((s) => {
                                    const active = softwareUsed.includes(s)
                                    return (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => toggleSoftware(s)}
                                            className={`rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                                                active
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-foreground">Search Tags</label>
                            <div className="flex gap-2">
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                    placeholder="Add keyword tag and press enter..."
                                    className="text-xs h-8.5"
                                />
                                <Button type="button" size="sm" variant="outline" onClick={addTag} className="text-xs h-8.5">
                                    Add
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                                {tags.map((t) => (
                                    <span key={t} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] text-foreground">
                                        #{t}
                                        <X className="size-3 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => removeTag(t)} />
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: Packages & Extras */}
                {step === 2 && (
                    <div className="space-y-5 pt-2">
                        {/* Tier Tabs */}
                        <div className="flex items-center justify-between border-b border-border/40 pb-2">
                            <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setPackageTierTab("basic")}
                                    className={`rounded-md px-3 py-1.5 transition-colors ${
                                        packageTierTab === "basic" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                                    }`}
                                >
                                    Basic (Mandatory)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPackageTierTab("standard")}
                                    className={`rounded-md px-3 py-1.5 transition-colors ${
                                        packageTierTab === "standard" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                                    }`}
                                >
                                    Standard {hasStandard ? "(Active)" : "(Optional)"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPackageTierTab("premium")}
                                    className={`rounded-md px-3 py-1.5 transition-colors ${
                                        packageTierTab === "premium" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                                    }`}
                                >
                                    Premium {hasPremium ? "(Active)" : "(Optional)"}
                                </button>
                            </div>

                            {packageTierTab === "standard" && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setHasStandard(!hasStandard)}
                                    className="text-xs h-7.5"
                                >
                                    {hasStandard ? "Remove Standard" : "Enable Standard"}
                                </Button>
                            )}

                            {packageTierTab === "premium" && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setHasPremium(!hasPremium)}
                                    className="text-xs h-7.5"
                                >
                                    {hasPremium ? "Remove Premium" : "Enable Premium"}
                                </Button>
                            )}
                        </div>

                        {/* Package Editor Body */}
                        {packageTierTab === "basic" && (
                            <div className="space-y-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">Package Name</label>
                                        <Input
                                            value={basicPkg.name}
                                            onChange={(e) => setBasicPkg({ ...basicPkg, name: e.target.value })}
                                            className="text-xs h-8.5"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">Price (₹)</label>
                                        <Input
                                            type="number"
                                            value={basicPkg.price}
                                            onChange={(e) => setBasicPkg({ ...basicPkg, price: Number(e.target.value) })}
                                            className="text-xs h-8.5"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-foreground">Short Description</label>
                                    <Input
                                        value={basicPkg.description}
                                        onChange={(e) => setBasicPkg({ ...basicPkg, description: e.target.value })}
                                        className="text-xs h-8.5"
                                    />
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">Delivery Turnaround (Days)</label>
                                        <Input
                                            type="number"
                                            value={basicPkg.deliveryDays}
                                            onChange={(e) => setBasicPkg({ ...basicPkg, deliveryDays: Number(e.target.value) })}
                                            className="text-xs h-8.5"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">Revisions Included (-1 for unlimited)</label>
                                        <Input
                                            type="number"
                                            value={basicPkg.revisionsIncluded}
                                            onChange={(e) => setBasicPkg({ ...basicPkg, revisionsIncluded: Number(e.target.value) })}
                                            className="text-xs h-8.5"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-foreground">Deliverables Checklist (one per line)</label>
                                    <Textarea
                                        rows={3}
                                        value={basicPkg.deliverables}
                                        onChange={(e) => setBasicPkg({ ...basicPkg, deliverables: e.target.value })}
                                        className="text-xs font-mono"
                                    />
                                </div>

                                <div className="flex gap-4 text-xs">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={basicPkg.sourceFilesIncluded}
                                            onChange={(e) => setBasicPkg({ ...basicPkg, sourceFilesIncluded: e.target.checked })}
                                            className="rounded border-border text-blue-600"
                                        />
                                        <span>Include Source Files (AI/EPS)</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={basicPkg.commercialUseIncluded}
                                            onChange={(e) => setBasicPkg({ ...basicPkg, commercialUseIncluded: e.target.checked })}
                                            className="rounded border-border text-blue-600"
                                        />
                                        <span>Commercial Use Rights</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {packageTierTab === "standard" && (
                            hasStandard ? (
                                <div className="space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-foreground">Package Name</label>
                                            <Input
                                                value={standardPkg.name}
                                                onChange={(e) => setStandardPkg({ ...standardPkg, name: e.target.value })}
                                                className="text-xs h-8.5"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-foreground">Price (₹)</label>
                                            <Input
                                                type="number"
                                                value={standardPkg.price}
                                                onChange={(e) => setStandardPkg({ ...standardPkg, price: Number(e.target.value) })}
                                                className="text-xs h-8.5"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">Short Description</label>
                                        <Input
                                            value={standardPkg.description}
                                            onChange={(e) => setStandardPkg({ ...standardPkg, description: e.target.value })}
                                            className="text-xs h-8.5"
                                        />
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-foreground">Delivery Turnaround (Days)</label>
                                            <Input
                                                type="number"
                                                value={standardPkg.deliveryDays}
                                                onChange={(e) => setStandardPkg({ ...standardPkg, deliveryDays: Number(e.target.value) })}
                                                className="text-xs h-8.5"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-foreground">Revisions Included (-1 for unlimited)</label>
                                            <Input
                                                type="number"
                                                value={standardPkg.revisionsIncluded}
                                                onChange={(e) => setStandardPkg({ ...standardPkg, revisionsIncluded: Number(e.target.value) })}
                                                className="text-xs h-8.5"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">Deliverables Checklist (one per line)</label>
                                        <Textarea
                                            rows={3}
                                            value={standardPkg.deliverables}
                                            onChange={(e) => setStandardPkg({ ...standardPkg, deliverables: e.target.value })}
                                            className="text-xs font-mono"
                                        />
                                    </div>

                                    <div className="flex gap-4 text-xs">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={standardPkg.sourceFilesIncluded}
                                                onChange={(e) => setStandardPkg({ ...standardPkg, sourceFilesIncluded: e.target.checked })}
                                                className="rounded border-border text-blue-600"
                                            />
                                            <span>Include Source Files</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={standardPkg.commercialUseIncluded}
                                                onChange={(e) => setStandardPkg({ ...standardPkg, commercialUseIncluded: e.target.checked })}
                                                className="rounded border-border text-blue-600"
                                            />
                                            <span>Commercial Use Rights</span>
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground space-y-2">
                                    <p>Standard tier is currently disabled.</p>
                                    <Button size="sm" variant="outline" onClick={() => setHasStandard(true)} className="text-xs">
                                        Enable Standard Package
                                    </Button>
                                </div>
                            )
                        )}

                        {packageTierTab === "premium" && (
                            hasPremium ? (
                                <div className="space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-foreground">Package Name</label>
                                            <Input
                                                value={premiumPkg.name}
                                                onChange={(e) => setPremiumPkg({ ...premiumPkg, name: e.target.value })}
                                                className="text-xs h-8.5"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-foreground">Price (₹)</label>
                                            <Input
                                                type="number"
                                                value={premiumPkg.price}
                                                onChange={(e) => setPremiumPkg({ ...premiumPkg, price: Number(e.target.value) })}
                                                className="text-xs h-8.5"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">Short Description</label>
                                        <Input
                                            value={premiumPkg.description}
                                            onChange={(e) => setPremiumPkg({ ...premiumPkg, description: e.target.value })}
                                            className="text-xs h-8.5"
                                        />
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-foreground">Delivery Turnaround (Days)</label>
                                            <Input
                                                type="number"
                                                value={premiumPkg.deliveryDays}
                                                onChange={(e) => setPremiumPkg({ ...premiumPkg, deliveryDays: Number(e.target.value) })}
                                                className="text-xs h-8.5"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-foreground">Revisions Included (-1 for unlimited)</label>
                                            <Input
                                                type="number"
                                                value={premiumPkg.revisionsIncluded}
                                                onChange={(e) => setPremiumPkg({ ...premiumPkg, revisionsIncluded: Number(e.target.value) })}
                                                className="text-xs h-8.5"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-foreground">Deliverables Checklist (one per line)</label>
                                        <Textarea
                                            rows={3}
                                            value={premiumPkg.deliverables}
                                            onChange={(e) => setPremiumPkg({ ...premiumPkg, deliverables: e.target.value })}
                                            className="text-xs font-mono"
                                        />
                                    </div>

                                    <div className="flex gap-4 text-xs">
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={premiumPkg.sourceFilesIncluded}
                                                onChange={(e) => setPremiumPkg({ ...premiumPkg, sourceFilesIncluded: e.target.checked })}
                                                className="rounded border-border text-blue-600"
                                            />
                                            <span>Include Source Files</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={premiumPkg.commercialUseIncluded}
                                                onChange={(e) => setPremiumPkg({ ...premiumPkg, commercialUseIncluded: e.target.checked })}
                                                className="rounded border-border text-blue-600"
                                            />
                                            <span>Commercial Use Rights</span>
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed p-8 text-center text-xs text-muted-foreground space-y-2">
                                    <p>Premium tier is currently disabled.</p>
                                    <Button size="sm" variant="outline" onClick={() => setHasPremium(true)} className="text-xs">
                                        Enable Premium Package
                                    </Button>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* STEP 3: Gallery */}
                {step === 3 && (
                    <div className="space-y-4 pt-2">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-foreground">
                                Add Sample Image URL (1 to 6 HTTPS URLs)
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    value={imageUrlInput}
                                    onChange={(e) => setImageUrlInput(e.target.value)}
                                    placeholder="https://images.unsplash.com/photo-..."
                                    className="text-xs h-8.5"
                                />
                                <Button type="button" size="sm" onClick={addImage} className="text-xs h-8.5 shrink-0">
                                    Add Image
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                            {sampleImages.map((src, idx) => (
                                <div key={idx} className="relative aspect-16/10 rounded-xl overflow-hidden border bg-muted group">
                                    <Image
                                        src={src}
                                        alt={`Sample ${idx + 1}`}
                                        fill
                                        unoptimized
                                        className="object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 4: FAQ */}
                {step === 4 && (
                    <div className="space-y-4 pt-2">
                        <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-2.5">
                            <span className="text-xs font-semibold text-foreground">Add FAQ</span>
                            <Input
                                value={newFaqQ}
                                onChange={(e) => setNewFaqQ(e.target.value)}
                                placeholder="Question (e.g. Can you supply dielines for flexible pouches?)"
                                className="text-xs h-8.5 bg-background"
                            />
                            <Textarea
                                rows={2}
                                value={newFaqA}
                                onChange={(e) => setNewFaqA(e.target.value)}
                                placeholder="Answer..."
                                className="text-xs bg-background"
                            />
                            <Button type="button" size="sm" onClick={addFaq} className="text-xs h-8">
                                Add Question
                            </Button>
                        </div>

                        <div className="space-y-2 pt-2">
                            {faq.map((item, idx) => (
                                <div key={idx} className="rounded-xl border p-3 text-xs space-y-1 relative group">
                                    <div className="flex items-center justify-between font-semibold text-foreground">
                                        <span>{item.question}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFaq(idx)}
                                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-muted-foreground">{item.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 5: Review & Publish */}
                {step === 5 && (
                    <div className="space-y-5 pt-2">
                        {/* Profile Completeness Alert */}
                        <div className={`rounded-xl border p-4 text-xs space-y-1.5 ${
                            hasBio && hasSpecialization
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                        }`}>
                            <div className="flex items-center gap-2 font-semibold">
                                {hasBio && hasSpecialization ? <Check className="size-4" /> : <AlertCircle className="size-4" />}
                                <span>Profile Readiness Check</span>
                            </div>
                            <p>
                                {hasBio && hasSpecialization
                                    ? "Your profile has an active bio and packaging specializations. Ready to publish!"
                                    : "You must complete your designer bio and at least one specialization in your Profile before publishing."}
                            </p>
                        </div>

                        {/* Summary Snapshot Card */}
                        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3 text-xs">
                            <div className="flex items-start justify-between">
                                <div>
                                    <Badge variant="secondary" className="capitalize text-[10px]">
                                        {category.replace(/_/g, " ")}
                                    </Badge>
                                    <h3 className="font-heading font-semibold text-sm text-foreground mt-1">{title || "Untitled"}</h3>
                                </div>
                                <span className="font-heading text-base font-bold text-blue-500">
                                    ₹{basicPkg.price.toLocaleString("en-IN")}
                                </span>
                            </div>
                            <p className="text-muted-foreground line-clamp-2">{description}</p>
                            <div className="flex items-center gap-4 text-muted-foreground text-[11px] pt-1 border-t border-border/40">
                                <span>{basicPkg.deliveryDays} Days Delivery</span>
                                <span>·</span>
                                <span>{basicPkg.revisionsIncluded === -1 ? "Unlimited" : `${basicPkg.revisionsIncluded} Revisions`}</span>
                                <span>·</span>
                                <span>{sampleImages.length} Gallery Images</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Controls */}
                <DialogFooter className="flex items-center justify-between border-t border-border/40 pt-4 mt-4">
                    <div>
                        {step > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setStep((s) => (s - 1) as any)}
                                className="text-xs gap-1"
                            >
                                <ArrowLeft className="size-3" />
                                Back
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleSubmit("draft")}
                            className="text-xs"
                        >
                            Save Draft
                        </Button>

                        {step < 5 ? (
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setStep((s) => (s + 1) as any)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1"
                            >
                                Next
                                <ArrowRight className="size-3" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                size="sm"
                                disabled={isPending || !hasBio || !hasSpecialization}
                                onClick={() => handleSubmit("published")}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 shadow-sm"
                            >
                                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                                <span>Publish Gig</span>
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

