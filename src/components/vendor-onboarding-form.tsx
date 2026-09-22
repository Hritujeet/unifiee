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
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { PlusIcon, XIcon } from "lucide-react"

const vendor_type = [
    { label: "Manufacturer", value: "manufacturer" },
    { label: "Printer", value: "printer" },
    { label: "Supplier", value: "supplier" },
    { label: "Distributor", value: "distributor" },
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

export default function VendorOnboardingForm() {
    const [services, setServices] = useState<string[]>([""])
    const [socials, setSocials] = useState<Social[]>([{ id: Date.now(), platform: "", url: "" }])
    const [termsAccepted, setTermsAccepted] = useState(false)

    // --- Services ---
    const addService = () => setServices((prev) => [...prev, ""])
    const removeService = (index: number) =>
        setServices((prev) => prev.filter((_, i) => i !== index))
    const updateService = (index: number, value: string) =>
        setServices((prev) => prev.map((s, i) => (i === index ? value : s)))

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
                        <FieldLegend className="text-2xl font-bold">Register as a Vendor</FieldLegend>
                        <FieldDescription>
                            Fill the given information to register yourself as a vendor and start providing your services.
                        </FieldDescription>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="fullname">Full Name</FieldLabel>
                                <Input
                                    id="fullname"
                                    placeholder="Your Full Name"
                                    required
                                />
                                <FieldDescription>
                                    Your full name will be displayed on your profile and the quotations you publish.
                                </FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="company-firm-name">Company / Firm Name</FieldLabel>
                                <Input
                                    id="company-firm-name"
                                    placeholder="Your Company / Firm Name"
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="gstin">GSTIN</FieldLabel>
                                <Input
                                    id="gstin"
                                    placeholder="22AAAAA0000A1Z5"
                                    required
                                />
                            </Field>
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
                                <FieldLabel htmlFor="mobile">Mobile</FieldLabel>
                                <Input
                                    id="mobile"
                                    placeholder="+91 1234567890"
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="vendor-type">Vendor Type</FieldLabel>
                                <Select>
                                    <SelectTrigger id="vendor-type" className="w-full">
                                        <SelectValue placeholder="Select Vendor Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {vendor_type.map((item) => (
                                                <SelectItem key={item.value} value={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </Field>

                            {/* ── Services ── */}
                            <Field>
                                <div className="flex items-center justify-between">
                                    <FieldLabel>Services Offered</FieldLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addService}
                                        className="h-7 gap-1 text-xs"
                                    >
                                        <PlusIcon className="size-3.5" />
                                        Add Service
                                    </Button>
                                </div>
                                <FieldDescription>
                                    List the services your business provides (e.g. Flexo Printing, Corrugation).
                                </FieldDescription>
                                <div className="flex flex-col gap-2 mt-1">
                                    {services.map((service, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                id={`service-${index}`}
                                                placeholder={`Service ${index + 1}`}
                                                value={service}
                                                onChange={(e) => updateService(index, e.target.value)}
                                            />
                                            {services.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeService(index)}
                                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                                    aria-label="Remove service"
                                                >
                                                    <XIcon className="size-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Field>

                            {/* ── Socials ── */}
                            <Field>
                                <div className="flex items-center justify-between">
                                    <FieldLabel>Social Links</FieldLabel>
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

                            <Field>
                                <FieldLabel htmlFor="address">Address</FieldLabel>
                                <FieldDescription>
                                    Enter your Firm/Company Address. If N/A, enter your City and State (e.g. Kota, Rajasthan).
                                </FieldDescription>
                                <Textarea id="address" placeholder="12, Talwandi, Kota, Rajasthan - 324005" />
                            </Field>

                        </FieldGroup>
                    </FieldSet>

                    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3.5">
                        <Checkbox
                            id="vendor-terms"
                            checked={termsAccepted}
                            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                            className="mt-0.5 shrink-0"
                        />
                        <label htmlFor="vendor-terms" className="text-sm text-muted-foreground leading-snug cursor-pointer select-none">
                            I have read and agree to the{" "}
                            <a href="/terms" className="underline underline-offset-4 text-foreground hover:text-primary transition-colors">Terms of Service</a>
                            {" and "}
                            <a href="/privacy" className="underline underline-offset-4 text-foreground hover:text-primary transition-colors">Privacy Policy</a>.
                            {" By registering, you confirm that all information provided is accurate."}
                        </label>
                    </div>

                    <Button type="submit" disabled={!termsAccepted} className="w-full">Register as Vendor</Button>
                </FieldGroup>
            </form>
        </div>
    )
}
