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
import { PlusIcon, XIcon, Loader2 } from "lucide-react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { businessOnboardingSchema } from "@/lib/zod-schema"
import { z } from "zod"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"
import { registerBusinessAction } from "@/actions/business-registration"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { authClient } from "@/lib/auth-client"

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

export default function BusinessOnboardingForm() {
    const router = useRouter()
    const [termsAccepted, setTermsAccepted] = useState(false)
    const { data: session } = authClient.useSession()

    const { register, control, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<z.infer<typeof businessOnboardingSchema>>({
        resolver: zodResolver(businessOnboardingSchema),
        defaultValues: {
            fullname: "",
            ownerName: "",
            role: undefined,
            businessName: "",
            businessType: undefined,
            email: "",
            phone: "",
            gstin: "",
            website: "",
            socials: [{ platform: "", url: "" }],
            businessAddress: ""
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
        mutationFn: async (data: z.infer<typeof businessOnboardingSchema>) => {
            const result = await registerBusinessAction(data);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: () => {
            toast.success("Registered as business successfully! Redirecting to your dashboard...");
            // hard navigate so the server layout re-runs and sees the new business row
            window.location.href = "/business";
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to register business");
        }
    });

    const submitHandler = (data: z.infer<typeof businessOnboardingSchema>) => {
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
                                    {...register("fullname")}
                                />
                                {errors.fullname && <p className="text-xs text-destructive">{errors.fullname.message}</p>}
                                <FieldDescription>
                                    Your name as it will appear on your profile and orders.
                                </FieldDescription>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="ownerName">Owner Name</FieldLabel>
                                <Input
                                    id="ownerName"
                                    placeholder="Business Owner's Full Name"
                                    {...register("ownerName")}
                                />
                                {errors.ownerName && <p className="text-xs text-destructive">{errors.ownerName.message}</p>}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="role">Your Role</FieldLabel>
                                <Controller
                                    name="role"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
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
                                    )}
                                />
                                {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
                                <FieldDescription>
                                    Your designation within the business.
                                </FieldDescription>
                            </Field>

                            {/* ── Business Details ── */}
                            <Field>
                                <FieldLabel htmlFor="businessName">Business Name</FieldLabel>
                                <Input
                                    id="businessName"
                                    placeholder="e.g. Brewed Awakenings Café"
                                    {...register("businessName")}
                                />
                                {errors.businessName && <p className="text-xs text-destructive">{errors.businessName.message}</p>}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="businessType">Business Type</FieldLabel>
                                <Controller
                                    name="businessType"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger id="businessType" className="w-full">
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
                                    )}
                                />
                                {errors.businessType && <p className="text-xs text-destructive">{errors.businessType.message}</p>}
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
                                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                                <Input
                                    id="phone"
                                    type="tel"
                                    placeholder="+91 1234567890"
                                    {...register("phone")}
                                />
                                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
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
                                    {...register("gstin")}
                                />
                                {errors.gstin && <p className="text-xs text-destructive">{errors.gstin.message}</p>}
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
                                    {...register("website")}
                                />
                                {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
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
                                                            value={selectField.value}
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
                                                    className="flex-1"
                                                    {...register(`socials.${index}.url`)}
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
                                            {errors.socials?.[index]?.platform && <p className="text-xs text-destructive">{errors.socials[index]?.platform?.message}</p>}
                                            {errors.socials?.[index]?.url && <p className="text-xs text-destructive">{errors.socials[index]?.url?.message}</p>}
                                        </div>
                                    ))}
                                </div>
                            </Field>

                            {/* ── Address ── */}
                            <Field>
                                <FieldLabel htmlFor="businessAddress">Business Address</FieldLabel>
                                <FieldDescription>
                                    Enter your outlet or registered business address.
                                </FieldDescription>
                                <Textarea
                                    id="businessAddress"
                                    placeholder="12, MG Road, Bengaluru, Karnataka - 560001"
                                    {...register("businessAddress")}
                                />
                                {errors.businessAddress && <p className="text-xs text-destructive">{errors.businessAddress.message}</p>}
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

                    <Button type="submit" disabled={!termsAccepted || mutation.isPending} className="w-full">
                        {mutation.isPending ? <Loader2 className="animate-spin" /> : "Register as Business"}
                    </Button>
                </FieldGroup>
            </form>
        </div>
    )
}