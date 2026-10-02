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
import { Loader2 } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { designerOnboardingSchema } from "@/lib/zod-schema"
import { z } from "zod"
import { toast } from "sonner"
import Link from "next/link"
import { useMutation } from "@tanstack/react-query"
import { registerDesignerAction } from "@/actions/designer-registration"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { MultiSelect } from "@/components/ui/multi-select" // assuming this exists or I'll use standard select/input for MVP

const pricingModels = [
    { label: "Per Project", value: "per_project" },
    { label: "Hourly", value: "hourly" },
    { label: "Per Design", value: "per_design" }
]

const availabilityStatuses = [
    { label: "Available", value: "available" },
    { label: "Limited", value: "limited" },
    { label: "Unavailable", value: "unavailable" }
]

const specOptions = [
    { label: "Label Design", value: "label_design" },
    { label: "Box Packaging", value: "box_packaging" },
    { label: "3D Rendering", value: "3d_rendering" },
    { label: "Brand Identity", value: "brand_identity" }
]

const toolOptions = [
    { label: "Adobe Illustrator", value: "illustrator" },
    { label: "Adobe Photoshop", value: "photoshop" },
    { label: "Figma", value: "figma" },
    { label: "Blender", value: "blender" }
]

type FormValues = z.infer<typeof designerOnboardingSchema>

export default function DesignerOnboardingForm() {
    const router = useRouter()
    const [termsAccepted, setTermsAccepted] = useState(false)
    const { data: session } = authClient.useSession()

    const { register, control, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>({
        resolver: zodResolver(designerOnboardingSchema),
        defaultValues: {
            fullName: "",
            displayName: "",
            email: "",
            phone: "",
            city: "",
            state: "",
            headline: "",
            bio: "",
            yearsOfExperience: 0,
            specializations: [],
            softwareTools: [],
            portfolioUrl: "",
            pricingModel: "per_project",
            availabilityStatus: "available",
        }
    })

    useEffect(() => {
        if (session?.user?.email) {
            setValue("email", session.user.email, { shouldValidate: false })
        }
    }, [session, setValue])

    const mutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const result = await registerDesignerAction(data);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result;
        },
        onSuccess: () => {
            toast.success("Registered as designer successfully! Redirecting to dashboard...");
            window.location.href = "/designer";
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to register designer");
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
                        <FieldLegend className="text-2xl font-bold">Register as a Packaging Designer</FieldLegend>
                        <FieldDescription>
                            Showcase your design skills and connect with F&B brands.
                        </FieldDescription>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="fullName">Full Name</FieldLabel>
                                <Input id="fullName" placeholder="Your Full Name" {...register("fullName")} />
                                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="displayName">Display Name (Optional)</FieldLabel>
                                <Input id="displayName" placeholder="Studio Name or Moniker" {...register("displayName")} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input id="email" type="email" readOnly className="bg-muted/50 cursor-not-allowed" {...register("email")} />
                                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="phone">Mobile</FieldLabel>
                                <Input id="phone" placeholder="+91 1234567890" {...register("phone")} />
                                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                            </Field>
                            <div className="flex gap-4">
                                <Field className="flex-1">
                                    <FieldLabel htmlFor="city">City</FieldLabel>
                                    <Input id="city" placeholder="Mumbai" {...register("city")} />
                                    {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                                </Field>
                                <Field className="flex-1">
                                    <FieldLabel htmlFor="state">State</FieldLabel>
                                    <Input id="state" placeholder="Maharashtra" {...register("state")} />
                                    {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
                                </Field>
                            </div>

                            <Field>
                                <FieldLabel htmlFor="headline">Headline</FieldLabel>
                                <FieldDescription>A short punchy title (e.g. "Premium F&B Packaging Expert")</FieldDescription>
                                <Input id="headline" placeholder="Headline" {...register("headline")} />
                                {errors.headline && <p className="text-xs text-destructive">{errors.headline.message}</p>}
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="bio">Bio (Optional)</FieldLabel>
                                <Textarea id="bio" placeholder="Tell us about your background..." {...register("bio")} />
                            </Field>
                            
                            <Field>
                                <FieldLabel htmlFor="yearsOfExperience">Years of Experience</FieldLabel>
                                <Input id="yearsOfExperience" type="number" min="0" {...register("yearsOfExperience")} />
                                {errors.yearsOfExperience && <p className="text-xs text-destructive">{errors.yearsOfExperience.message}</p>}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="portfolioUrl">Portfolio URL</FieldLabel>
                                <Input id="portfolioUrl" placeholder="https://behance.net/yourprofile" {...register("portfolioUrl")} />
                                {errors.portfolioUrl && <p className="text-xs text-destructive">{errors.portfolioUrl.message}</p>}
                            </Field>

                            {/* Assuming for now we just use a CSV input for specializations and tools if multi-select is complex to integrate without checking UI components, but wait, I can just use a text input for simplicity or native select */}
                            <Field>
                                <FieldLabel>Specializations (comma separated for now)</FieldLabel>
                                <Input 
                                    placeholder="Label Design, Box Packaging..."
                                    onChange={(e) => setValue("specializations", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} 
                                />
                                {errors.specializations && <p className="text-xs text-destructive">{errors.specializations.message}</p>}
                            </Field>

                            <Field>
                                <FieldLabel>Software Tools (comma separated for now)</FieldLabel>
                                <Input 
                                    placeholder="Illustrator, Photoshop, Figma..."
                                    onChange={(e) => setValue("softwareTools", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} 
                                />
                                {errors.softwareTools && <p className="text-xs text-destructive">{errors.softwareTools.message}</p>}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="pricingModel">Pricing Model</FieldLabel>
                                <Controller
                                    name="pricingModel"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Pricing Model" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {pricingModels.map((item) => (
                                                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="startingPrice">Starting Price (Optional)</FieldLabel>
                                <Input id="startingPrice" type="number" min="0" {...register("startingPrice")} />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="availabilityStatus">Availability</FieldLabel>
                                <Controller
                                    name="availabilityStatus"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Availability" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availabilityStatuses.map((item) => (
                                                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </Field>
                        </FieldGroup>
                    </FieldSet>

                    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3.5">
                        <Checkbox
                            id="designer-terms"
                            checked={termsAccepted}
                            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                            className="mt-0.5 shrink-0"
                        />
                        <label htmlFor="designer-terms" className="text-sm text-muted-foreground leading-snug cursor-pointer select-none">
                            I agree to the Terms of Service and Privacy Policy.
                        </label>
                    </div>

                    <Button type="submit" disabled={!termsAccepted || mutation.isPending} className="w-full">
                        {mutation.isPending ? <Loader2 className="animate-spin" /> : "Register as Designer"}
                    </Button>
                </FieldGroup>
            </form>
        </div>
    )
}
