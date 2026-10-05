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
import { PlusIcon, XIcon, Loader2 } from "lucide-react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    manufacturerCapabilities,
    manufacturerOnboardingSchema,
    manufacturerPackagingCategories,
} from "@/lib/zod-schema"
import { z } from "zod"
import { toast } from "sonner"
import Link from "next/link"
import { useMutation } from "@tanstack/react-query"
import { registerManufacturerAction } from "@/actions/manufacturer-registration"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { authClient } from "@/lib/auth-client"



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

type FormValues = z.infer<typeof manufacturerOnboardingSchema>

export default function ManufacturerOnboardingForm() {
    const router = useRouter()
    const [termsAccepted, setTermsAccepted] = useState(false)
    const { data: session } = authClient.useSession()

    const { register, control, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormValues>({
        resolver: zodResolver(manufacturerOnboardingSchema),
        defaultValues: {
            fullname: "",
            companyFirmName: "",
            gstin: "",
            email: "",
            mobile: "",
            packagingCategories: [],
            capabilities: [],
            socials: [{ platform: "", url: "" }],
            address: ""
        }
    })

    // Auto-fill email from signed-in account
    useEffect(() => {
        if (session?.user?.email) {
            setValue("email", session.user.email, { shouldValidate: false })
        }
    }, [session, setValue])

    const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
        control,
        name: "socials"
    })

    const mutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const result = await registerManufacturerAction(data);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: () => {
            toast.success("Registered as manufacturer successfully! Redirecting to your dashboard...");
            // hard navigate so the server layout re-runs and sees the new manufacturer row
            window.location.href = "/manufacturer";
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to register manufacturer");
        }
    });

    const submitHandler = (data: FormValues) => {
        mutation.mutate(data)
    }

    const errorHandler = () => {
        toast.error("Please fill in all required fields correctly")
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit(submitHandler, errorHandler)}>
                <FieldGroup>
                    <FieldSet>
                        <FieldLegend className="text-2xl font-bold">Register as a Manufacturer</FieldLegend>
                        <FieldDescription>
                            Fill in the information below to register as a manufacturer and set up your profile.
                        </FieldDescription>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="fullname">Full Name</FieldLabel>
                                <Input
                                    id="fullname"
                                    placeholder="Your Full Name"
                                    {...register("fullname")}
                                />
                                {errors.fullname && <p className="text-xs text-destructive">{errors.fullname.message}</p>}
                                <FieldDescription>
                                    Your full name will be displayed on your profile and the offerings you publish.
                                </FieldDescription>
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="companyFirmName">Company / Firm Name</FieldLabel>
                                <Input
                                    id="companyFirmName"
                                    placeholder="Your Company / Firm Name"
                                    {...register("companyFirmName")}
                                />
                                {errors.companyFirmName && <p className="text-xs text-destructive">{errors.companyFirmName.message}</p>}
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="gstin">GSTIN</FieldLabel>
                                <Input
                                    id="gstin"
                                    placeholder="22AAAAA0000A1Z5"
                                    maxLength={15}
                                    {...register("gstin")}
                                />
                                {errors.gstin && <p className="text-xs text-destructive">{errors.gstin.message}</p>}
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    readOnly
                                    className="bg-muted/50 cursor-not-allowed"
                                    {...register("email")}
                                />
                                <FieldDescription className="text-xs text-muted-foreground">
                                    Pre-filled from your signed-in account.
                                </FieldDescription>
                                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="mobile">Mobile</FieldLabel>
                                <Input
                                    id="mobile"
                                    placeholder="+91 1234567890"
                                    {...register("mobile")}
                                />
                                {errors.mobile && <p className="text-xs text-destructive">{errors.mobile.message}</p>}
                            </Field>

                            <Field>
                                <FieldLabel>Packaging Categories</FieldLabel>
                                <FieldDescription>Select all packaging categories your business manufactures.</FieldDescription>
                                <Controller
                                    name="packagingCategories"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {manufacturerPackagingCategories.map((category) => (
                                                <label key={category.value} className="flex items-center gap-2 text-sm">
                                                    <Checkbox
                                                        checked={field.value.includes(category.value)}
                                                        onCheckedChange={(checked) => field.onChange(
                                                            checked
                                                                ? [...field.value, category.value]
                                                                : field.value.filter((value) => value !== category.value)
                                                        )}
                                                    />
                                                    {category.label}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                />
                                {errors.packagingCategories && <p className="text-xs text-destructive">{errors.packagingCategories.message}</p>}
                            </Field>

                            <Field>
                                <FieldLabel>Capabilities</FieldLabel>
                                <FieldDescription>Select the manufacturing and printing capabilities your business provides.</FieldDescription>
                                <Controller
                                    name="capabilities"
                                    control={control}
                                    render={({ field }) => (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {manufacturerCapabilities.map((capability) => (
                                                <label key={capability.value} className="flex items-center gap-2 text-sm">
                                                    <Checkbox
                                                        checked={field.value.includes(capability.value)}
                                                        onCheckedChange={(checked) => field.onChange(
                                                            checked
                                                                ? [...field.value, capability.value]
                                                                : field.value.filter((value) => value !== capability.value)
                                                        )}
                                                    />
                                                    {capability.label}
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                />
                                {errors.capabilities && <p className="text-xs text-destructive">{errors.capabilities.message}</p>}
                            </Field>

                            {/* ── Socials ── */}
                            <Field>
                                <div className="flex items-center justify-between">
                                    <FieldLabel>Social Links</FieldLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => appendSocial({ platform: "", url: "" })}
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
                                    {socialFields.map((field, index) => (
                                        <div key={field.id} className="flex flex-col gap-1 w-full">
                                            <div className="flex gap-2 items-center">
                                                <Controller
                                                    name={`socials.${index}.platform`}
                                                    control={control}
                                                    render={({ field: selectField }) => (
                                                        <Select
                                                            value={selectField.value ?? ""}
                                                            onValueChange={selectField.onChange}
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
                                                    )}
                                                />
                                                <Input
                                                    placeholder="https://..."
                                                    {...register(`socials.${index}.url`)}
                                                    className="flex-1"
                                                />
                                                {socialFields.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeSocial(index)}
                                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                                        aria-label="Remove social"
                                                    >
                                                        <XIcon className="size-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="address">Address</FieldLabel>
                                <FieldDescription>
                                    Enter your Firm/Company Address. If N/A, enter your City and State (e.g. Kota, Rajasthan).
                                </FieldDescription>
                                <Textarea id="address" placeholder="12, Talwandi, Kota, Rajasthan - 324005" {...register("address")} />
                                {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                            </Field>

                        </FieldGroup>
                    </FieldSet>

                    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3.5">
                        <Checkbox
                            id="manufacturer-terms"
                            checked={termsAccepted}
                            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                            className="mt-0.5 shrink-0"
                        />
                        <label htmlFor="manufacturer-terms" className="text-sm text-muted-foreground leading-snug cursor-pointer select-none">
                            I have read and agree to the{" "}
                            <Link href="/terms" className="underline underline-offset-4 text-foreground hover:text-primary transition-colors">Terms of Service</Link>
                            {" and "}
                            <Link href="/privacy" className="underline underline-offset-4 text-foreground hover:text-primary transition-colors">Privacy Policy</Link>.
                            {" By registering, you confirm that all information provided is accurate."}
                        </label>
                    </div>

                    <Button type="submit" disabled={!termsAccepted || mutation.isPending} className="w-full">
                        {mutation.isPending ? <Loader2 className="animate-spin" /> : "Register as Manufacturer"}
                    </Button>
                </FieldGroup>
            </form>
        </div>
    )
}
