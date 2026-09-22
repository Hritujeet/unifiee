"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { PlusIcon, XIcon } from "lucide-react"

const business_types = [
    { label: "Café", value: "cafe" },
    { label: "Restaurant", value: "restaurant" },
    { label: "QSR (Quick Service Restaurant)", value: "qsr" },
    { label: "Cloud Kitchen", value: "cloud_kitchen" },
    { label: "Bakery", value: "bakery" },
]

const roles = [
    { label: "Owner", value: "owner" },
    { label: "Manager", value: "manager" },
    { label: "Procurement", value: "procurement" },
]

const social_platforms = [
    { label: "Instagram", value: "instagram" },
    { label: "Twitter / X", value: "twitter" },
    { label: "LinkedIn", value: "linkedin" },
    { label: "Facebook", value: "facebook" },
    { label: "YouTube", value: "youtube" },
    { label: "WhatsApp", value: "whatsapp" },
    { label: "Website", value: "website" },
    { label: "Other", value: "other" },
]

type Social = { id: number; platform: string; url: string }

export default function BusinessOnboardingForm() {
    const [socials, setSocials] = useState<Social[]>([{ id: Date.now(), platform: "", url: "" }])
    const [termsAccepted, setTermsAccepted] = useState(false)

    // --- Socials ---
    const addSocial = () =>
        setSocials((prev) => [...prev, { id: Date.now(), platform: "", url: "" }])
    const removeSocial = (id: number) =>
        setSocials((prev) => prev.filter((s) => s.id !== id))
    const updateSocial = (id: number, field: "platform" | "url", value: string) =>
        setSocials((prev) =>
            prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
        )

    return (
        <div className="w-full max-w-2xl mx-auto">
            <form>
                <FieldGroup>
                    <FieldSet>
                        <FieldLegend className="text-2xl font-bold">Register as a Business</FieldLegend>
                        <FieldDescription>
                            Fill in your business details to start sourcing packaging from verified vendors.
                        </FieldDescription>
                        <FieldGroup>

                            {/* ── Personal Details ── */}
                            <Field>
                                <FieldLabel htmlFor="fullname">Full Name</FieldLabel>
                                <Input
                                    id="fullname"
                                    placeholder="Your Full Name"
                                    required
                                />
                                <FieldDescription>
                                    Your name as it will appear on your profile and orders.
                                </FieldDescription>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="owner-name">Owner Name</FieldLabel>
                                <Input
                                    id="owner-name"
                                    placeholder="Business Owner's Full Name"
                                    required
                                />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="role">Your Role</FieldLabel>
                                <Select>
                                    <SelectTrigger id="role" className="w-full">
                                        <SelectValue placeholder="Select your role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {roles.map((item) => (
                                                <SelectItem key={item.value} value={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FieldDescription>
                                    Your designation within the business.
                                </FieldDescription>
                            </Field>

                            {/* ── Business Details ── */}
                            <Field>
                                <FieldLabel htmlFor="business-name">Business Name</FieldLabel>
                                <Input
                                    id="business-name"
                                    placeholder="e.g. Brewed Awakenings Café"
                                    required
                                />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="business-type">Business Type</FieldLabel>
                                <Select>
                                    <SelectTrigger id="business-type" className="w-full">
                                        <SelectValue placeholder="Select business type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {business_types.map((item) => (
                                                <SelectItem key={item.value} value={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FieldDescription>
                                    The category that best describes your food & beverage business.
                                </FieldDescription>
                            </Field>

                            {/* ── Contact ── */}
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="email@example.com"
                                    required
                                />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+91 1234567890"
                                    required
                                />
                            </Field>

                            {/* ── Optional Fields ── */}
                            <Field>
                                <FieldLabel htmlFor="gstin">
                                    GSTIN{" "}
                                    <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                                </FieldLabel>
                                <Input
                                    id="gstin"
                                    placeholder="22AAAAA0000A1Z5"
                                    maxLength={15}
                                />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="website">
                                    Website{" "}
                                    <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                                </FieldLabel>
                                <Input
                                    id="website"
                                    type="url"
                                    placeholder="https://yourbusiness.com"
                                />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="store-image">
                                    Store Image{" "}
                                    <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                                </FieldLabel>
                                <label
                                    htmlFor="store-image"
                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="size-7 mb-1 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        <span className="text-sm font-medium">Click to upload</span>
                                        <span className="text-xs">PNG, JPG, WEBP up to 5 MB</span>
                                    </div>
                                    <Input
                                        id="store-image"
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        className="hidden"
                                    />
                                </label>
                                <FieldDescription>
                                    A photo of your store or outlet for your profile.
                                </FieldDescription>
                            </Field>

                            {/* ── Socials ── */}
                            <Field>
                                <div className="flex items-center justify-between">
                                    <FieldLabel>
                                        Social Links{" "}
                                        <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                                    </FieldLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addSocial}
                                        className="h-7 gap-1 text-xs"
                                    >
                                        <PlusIcon className="size-3.5" />
                                        Add Social
                                    </Button>
                                </div>
                                <FieldDescription>
                                    Add your business social media profiles or website links.
                                </FieldDescription>
                                <div className="flex flex-col gap-2 mt-1">
                                    {socials.map((social) => (
                                        <div key={social.id} className="flex gap-2 items-center">
                                            <Select
                                                value={social.platform}
                                                onValueChange={(val) => updateSocial(social.id, "platform", val)}
                                            >
                                                <SelectTrigger className="w-37.5 shrink-0">
                                                    <SelectValue placeholder="Platform" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {social_platforms.map((p) => (
                                                            <SelectItem key={p.value} value={p.value}>
                                                                {p.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                placeholder="https://..."
                                                value={social.url}
                                                onChange={(e) => updateSocial(social.id, "url", e.target.value)}
                                                className="flex-1"
                                            />
                                            {socials.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeSocial(social.id)}
                                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                                    aria-label="Remove social"
                                                >
                                                    <XIcon className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Field>

                            {/* ── Address ── */}
                            <Field>
                                <FieldLabel htmlFor="business-address">Business Address</FieldLabel>
                                <FieldDescription>
                                    Enter your outlet or registered business address.
                                </FieldDescription>
                                <Textarea
                                    id="business-address"
                                    placeholder="12, MG Road, Bengaluru, Karnataka - 560001"
                                    required
                                />
                            </Field>

                        </FieldGroup>
                    </FieldSet>

                    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3.5">
                        <Checkbox
                            id="business-terms"
                            checked={termsAccepted}
                            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                            className="mt-0.5 shrink-0"
                        />
                        <label htmlFor="business-terms" className="text-sm text-muted-foreground leading-snug cursor-pointer select-none">
                            I have read and agree to the{" "}
                            <a href="/terms" className="underline underline-offset-4 text-foreground hover:text-primary transition-colors">Terms of Service</a>
                            {" and "}
                            <a href="/privacy" className="underline underline-offset-4 text-foreground hover:text-primary transition-colors">Privacy Policy</a>.
                            {" By registering, you confirm that all information provided is accurate."}
                        </label>
                    </div>

                    <Button type="submit" disabled={!termsAccepted} className="w-full">Register as Business</Button>
                </FieldGroup>
            </form>
        </div>
    )
}