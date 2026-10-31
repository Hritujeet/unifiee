"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateDesignerProfile } from "@/actions/designer-profile"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { designerPackagingSpecializations } from "@/lib/zod-schema"
import { LoaderCircle, PencilLine, Sparkles } from "lucide-react"
import { AiButton } from "@/components/ai/ai-button"
import { AiBadge } from "@/components/ai/ai-badge"
import { AiSuggestionCard } from "@/components/ai/ai-suggestion-card"
import { AiErrorState } from "@/components/ai/ai-error-state"

type DesignerProfile = {
    fullName: string
    displayName: string | null
    phone: string
    profilePhotoUrl: string | null
    city: string | null
    state: string | null
    country: string | null
    headline: string | null
    bio: string | null
    yearsOfExperience: number | null
    specializations: string[] | null
    packagingDesignSpecializations: string[] | null
    softwareTools: string[] | null
    languages: string[] | null
    industriesServed: string[] | null
    portfolioUrl: string
    additionalLinks: {
        behance?: string
        dribbble?: string
        instagram?: string
        linkedin?: string
        website?: string
    } | null
    pricingModel: string | null
    startingPrice: string | null
    hourlyRate: string | null
    chargesNotes: string | null
    turnaroundTime: string | null
    revisionsIncluded: number | null
    availabilityStatus: string | null
}

function Field({
    label,
    name,
    value,
    onChange,
    defaultValue,
    placeholder,
    type = "text",
    required = false,
    min,
    max,
}: {
    label: string
    name: string
    value?: string | number
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    defaultValue?: string | number | null
    placeholder?: string
    type?: string
    required?: boolean
    min?: number
    max?: number
}) {
    return (
        <label className="block space-y-2 text-sm font-medium">
            {label}
            <Input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                defaultValue={value === undefined ? defaultValue ?? "" : undefined}
                placeholder={placeholder}
                required={required}
                min={min}
                max={max}
            />
        </label>
    )
}

function ListField({
    label,
    name,
    values,
    placeholder,
    required = false,
}: {
    label: string
    name: string
    values: string[] | null
    placeholder: string
    required?: boolean
}) {
    return (
        <label className="block space-y-2 text-sm font-medium">
            {label}
            <Textarea
                name={name}
                defaultValue={values?.join("\n") ?? ""}
                placeholder={placeholder}
                className="min-h-20"
                required={required}
            />
            <span className="block text-xs font-normal text-muted-foreground">Enter one item per line.</span>
        </label>
    )
}

export function DesignerProfileEditor({ designer }: { designer: DesignerProfile }) {
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [availabilityStatus, setAvailabilityStatus] = useState(designer.availabilityStatus ?? "available")
    const [pricingModel, setPricingModel] = useState(designer.pricingModel ?? "per_project")
    const router = useRouter()

    // Controlled headline & bio for AI updates
    const [headline, setHeadline] = useState(designer.headline ?? "")
    const [bio, setBio] = useState(designer.bio ?? "")

    // AI Bio state
    const [isGeneratingBio, setIsGeneratingBio] = useState(false)
    const [bioSuggestion, setBioSuggestion] = useState<{ headline: string; bio: string } | null>(null)
    const [aiError, setAiError] = useState<string | null>(null)

    const handleGenerateBio = async () => {
        setIsGeneratingBio(true)
        setAiError(null)

        try {
            const res = await fetch("/api/ai/designer/assist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode: "bio_writer",
                    specialties: designer.specializations || designer.packagingDesignSpecializations || [],
                    tools: designer.softwareTools || [],
                    experienceYears: designer.yearsOfExperience || 3,
                    roughNotes: bio,
                }),
            })

            const data = await res.json().catch(() => ({}))
            if (data?.bio) {
                setBioSuggestion({
                    headline: data.bio.headline,
                    bio: data.bio.bio,
                })
                toast.success("Suggestions generated")
                setAiError(null)
            } else {
                setAiError(data?.error || "AI service is currently busy. Please try again.")
                toast.error("Couldn't generate suggestions")
            }
        } catch (err: unknown) {
            console.error("AI bio writer error:", err)
            const msg = err instanceof Error ? err.message : "Bio generation failed."
            setAiError(msg)
            toast.error("Couldn't generate suggestions")
        } finally {
            setIsGeneratingBio(false)
        }
    }

    async function handleSubmit(formData: FormData) {
        setSaving(true)
        try {
            const result = await updateDesignerProfile(formData)
            if (!result.success) {
                toast.error("Couldn't save profile")
                return
            }

            toast.success("Profile saved")
            setOpen(false)
            router.refresh()
        } catch {
            toast.error("Couldn't save profile")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => !saving && setOpen(nextOpen)}>
            <DialogTrigger asChild>
                <Button variant="outline"><PencilLine className="size-4 mr-1.5" /> Edit profile</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span>Edit your designer profile</span>
                        <AiBadge variant="ai-assisted" label="AI Bio Writer Ready" />
                    </DialogTitle>
                    <DialogDescription>
                        Update how brands see your studio, your availability, and how you price and deliver work.
                    </DialogDescription>
                </DialogHeader>

                {aiError && (
                    <AiErrorState message={aiError} onDismiss={() => setAiError(null)} />
                )}

                <form action={handleSubmit} className="space-y-7">
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-heading font-semibold text-foreground">Profile and availability</h3>
                            <AiButton
                                type="button"
                                size="sm"
                                variant="outline"
                                loading={isGeneratingBio}
                                onClick={handleGenerateBio}
                            >
                                AI Bio Writer
                            </AiButton>
                        </div>

                        {bioSuggestion && (
                            <AiSuggestionCard
                                title="AI Generated Portfolio Bio & Headline"
                                original={bio || undefined}
                                suggestion={`${bioSuggestion.headline}\n\n${bioSuggestion.bio}`}
                                rationale="Highlights packaging expertise, 3D mockups, and client collaboration."
                                onAccept={(acceptedText) => {
                                    setHeadline(bioSuggestion.headline)
                                    setBio(bioSuggestion.bio)
                                    setBioSuggestion(null)
                                    toast.success("Changes applied")
                                }}
                                onEdit={(edited) => {
                                    setBio(edited)
                                    setBioSuggestion(null)
                                }}
                                onDismiss={() => setBioSuggestion(null)}
                            />
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Full name" name="fullName" defaultValue={designer.fullName} required />
                            <Field label="Display name or studio" name="displayName" defaultValue={designer.displayName} />
                            <Field label="Phone" name="phone" defaultValue={designer.phone} required />
                            <Field label="Profile photo URL" name="profilePhotoUrl" defaultValue={designer.profilePhotoUrl} type="url" placeholder="https://…" />
                            <Field label="City" name="city" defaultValue={designer.city} />
                            <Field label="State" name="state" defaultValue={designer.state} />
                            <Field label="Country" name="country" defaultValue={designer.country} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="availability-status">Availability</Label>
                            <Select value={availabilityStatus} onValueChange={(value) => value && setAvailabilityStatus(value)}>
                                <SelectTrigger id="availability-status" className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="available">Available for work</SelectItem>
                                    <SelectItem value="limited">Limited availability</SelectItem>
                                    <SelectItem value="unavailable">Not taking projects</SelectItem>
                                </SelectContent>
                            </Select>
                            <input type="hidden" name="availabilityStatus" value={availabilityStatus} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="headline">Professional headline</Label>
                            <Input
                                id="headline"
                                name="headline"
                                value={headline}
                                onChange={(e) => setHeadline(e.target.value)}
                                placeholder="Packaging designer for growing food & beverage brands"
                            />
                        </div>

                        <label className="block space-y-2 text-sm font-medium">
                            About you (Bio)
                            <Textarea
                                name="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="min-h-24 text-xs leading-relaxed"
                                placeholder="Share your design background, packaging tools, and approach to client work."
                            />
                        </label>
                    </section>

                    <section className="space-y-4">
                        <h3 className="border-b pb-2 font-heading font-semibold">Expertise</h3>
                        <label className="block space-y-2 text-sm font-medium">
                            Packaging specialties
                            <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
                                {designerPackagingSpecializations.map((specialization) => (
                                    <label key={specialization.value} className="flex items-center gap-2 text-sm font-normal">
                                        <input
                                            type="checkbox"
                                            name="packagingDesignSpecializations"
                                            value={specialization.value}
                                            defaultChecked={designer.packagingDesignSpecializations?.includes(specialization.value)}
                                            className="size-4 accent-primary"
                                        />
                                        {specialization.label}
                                    </label>
                                ))}
                            </div>
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <ListField label="General specializations" name="specializations" values={designer.specializations} placeholder={"Brand identity\nPrint design"} />
                            <ListField label="Software tools" name="softwareTools" values={designer.softwareTools} placeholder={"Adobe Illustrator\nFigma"} />
                            <ListField label="Languages" name="languages" values={designer.languages} placeholder={"English\nHindi"} />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="border-b pb-2">
                            <h3 className="font-heading font-semibold">Industry experience</h3>
                            <p className="mt-1 text-xs text-muted-foreground">These details appear on your public profile.</p>
                        </div>
                        <Field
                            label="Years of professional experience"
                            name="yearsOfExperience"
                            defaultValue={designer.yearsOfExperience ?? 0}
                            type="number"
                            min={0}
                            max={80}
                            required
                        />
                        <ListField
                            label="Industries you have worked with"
                            name="industriesServed"
                            values={designer.industriesServed}
                            placeholder={"Food & beverage\nBeauty\nWellness"}
                        />
                    </section>

                    <section className="space-y-4">
                        <h3 className="border-b pb-2 font-heading font-semibold">Pricing and delivery</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="pricing-model">Pricing model</Label>
                                <Select value={pricingModel} onValueChange={(value) => value && setPricingModel(value)}>
                                    <SelectTrigger id="pricing-model" className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="per_project">Per project</SelectItem>
                                        <SelectItem value="per_design">Per design</SelectItem>
                                        <SelectItem value="hourly">Hourly</SelectItem>
                                    </SelectContent>
                                </Select>
                                <input type="hidden" name="pricingModel" value={pricingModel} />
                            </div>
                            <Field label="Starting price (INR)" name="startingPrice" defaultValue={designer.startingPrice} type="number" min={0} />
                            <Field label="Hourly rate (INR)" name="hourlyRate" defaultValue={designer.hourlyRate} type="number" min={0} />
                            <Field label="Typical turnaround" name="turnaroundTime" defaultValue={designer.turnaroundTime} placeholder="5–7 business days" />
                            <Field label="Revisions included" name="revisionsIncluded" defaultValue={designer.revisionsIncluded ?? 0} type="number" min={0} max={100} required />
                        </div>
                        <label className="block space-y-2 text-sm font-medium">
                            Pricing notes
                            <Textarea name="chargesNotes" defaultValue={designer.chargesNotes ?? ""} placeholder="Share any details about how you price your work." />
                        </label>
                    </section>

                    <section className="space-y-4">
                        <h3 className="border-b pb-2 font-heading font-semibold">Portfolio and links</h3>
                        <Field label="Portfolio URL" name="portfolioUrl" defaultValue={designer.portfolioUrl} type="url" required />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Behance" name="behance" defaultValue={designer.additionalLinks?.behance} type="url" />
                            <Field label="Dribbble" name="dribbble" defaultValue={designer.additionalLinks?.dribbble} type="url" />
                            <Field label="Instagram" name="instagram" defaultValue={designer.additionalLinks?.instagram} type="url" />
                            <Field label="LinkedIn" name="linkedin" defaultValue={designer.additionalLinks?.linkedin} type="url" />
                            <Field label="Website" name="website" defaultValue={designer.additionalLinks?.website} type="url" />
                        </div>
                    </section>

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                        <Button type="submit" disabled={saving}>
                            {saving && <LoaderCircle className="animate-spin mr-1.5" />}
                            Save profile
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
