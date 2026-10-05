import z from "zod";

export const loginFormSchema = z.object({
    email: z.string().email("Please provide a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long")
})

export const signupFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    email: z.string().email("Please provide a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long")
})

export const setPasswordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
})

const socialEntrySchema = z.object({
    platform: z.string(),
    url: z.string().optional().or(z.literal(''))
})

export const manufacturerPackagingCategoryValues = [
    "paper-cups",
    "food-boxes",
    "paper-bags",
    "corrugated-boxes",
    "stickers-labels",
    "cutlery",
    "others",
] as const

export const manufacturerPackagingCategories = [
    { label: "Paper Cups", value: "paper-cups" },
    { label: "Food Boxes", value: "food-boxes" },
    { label: "Paper Bags", value: "paper-bags" },
    { label: "Corrugated Boxes", value: "corrugated-boxes" },
    { label: "Stickers/Labels", value: "stickers-labels" },
    { label: "Cutlery", value: "cutlery" },
    { label: "Others", value: "others" },
] as const

export const manufacturerCapabilityValues = [
    "flexographic-printing",
    "offset-printing",
    "digital-printing",
    "corrugation",
    "die-cutting",
    "lamination",
    "custom-printing",
] as const

export const manufacturerCapabilities = [
    { label: "Flexographic Printing", value: "flexographic-printing" },
    { label: "Offset Printing", value: "offset-printing" },
    { label: "Digital Printing", value: "digital-printing" },
    { label: "Corrugation", value: "corrugation" },
    { label: "Die Cutting", value: "die-cutting" },
    { label: "Lamination", value: "lamination" },
    { label: "Custom Printing", value: "custom-printing" },
] as const

export const designerPackagingSpecializationValues = [
    "food-boxes",
    "paper-cups",
    "paper-bags",
    "labels-stickers",
    "corrugated-packaging",
    "takeaway-packaging",
    "flexible-packaging",
    "other",
] as const

export const designerPackagingSpecializations = [
    { label: "Food Boxes", value: "food-boxes" },
    { label: "Paper Cups", value: "paper-cups" },
    { label: "Paper Bags", value: "paper-bags" },
    { label: "Labels/Stickers", value: "labels-stickers" },
    { label: "Corrugated Packaging", value: "corrugated-packaging" },
    { label: "Takeaway Packaging", value: "takeaway-packaging" },
    { label: "Flexible Packaging", value: "flexible-packaging" },
    { label: "Other", value: "other" },
] as const

export const manufacturerOnboardingSchema = z.object({
    fullname: z.string().min(2, "Name must be at least 2 characters long"),
    companyFirmName: z.string().min(2, "Company/Firm name must be at least 2 characters long"),
    gstin: z.string().length(15, "GSTIN must be exactly 15 characters"),
    email: z.string().email("Please provide a valid email address"),
    mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
    packagingCategories: z.array(z.enum(manufacturerPackagingCategoryValues)).min(1, "Select at least one packaging category"),
    capabilities: z.array(z.enum(manufacturerCapabilityValues)).min(1, "Select at least one capability"),
    socials: z.array(socialEntrySchema).optional(),
    address: z.string().min(10, "Please provide a complete address")
})

export const designerOnboardingSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters long"),
    displayName: z.string().optional(),
    email: z.string().email("Please provide a valid email address"),
    phone: z.string().min(10, "Mobile number must be at least 10 digits"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    
    headline: z.string().min(5, "Headline must be at least 5 characters long"),
    bio: z.string().optional(),
    yearsOfExperience: z.coerce.number().min(0, "Years of experience must be 0 or more"),
    specializations: z.array(z.string()).min(1, "Select at least one specialization"),
    packagingDesignSpecializations: z.array(z.enum(designerPackagingSpecializationValues)).min(1, "Select at least one packaging design specialization"),
    softwareTools: z.array(z.string()).min(1, "Select at least one tool"),
    industriesServed: z.array(z.string()).optional(),

    portfolioUrl: z.string().url("Must be a valid URL"),
    behance: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    dribbble: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    instagram: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    linkedin: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    website: z.string().url("Must be a valid URL").optional().or(z.literal('')),

    pricingModel: z.enum(["per_project", "hourly", "per_design"]),
    startingPrice: z.coerce.number().min(0, "Starting price must be non-negative").optional(),
    turnaroundTime: z.string().optional(),
    revisionsIncluded: z.coerce.number().min(0, "Revisions must be non-negative").optional(),
    availabilityStatus: z.enum(["available", "limited", "unavailable"]),
})

export const businessOnboardingSchema = z.object({
    fullname: z.string().min(2, "Name must be at least 2 characters long"),
    ownerName: z.string().min(2, "Owner name must be at least 2 characters long"),
    role: z.enum(["owner", "manager"] as const, {
        error: "Please select your role",
    }),
    businessName: z.string().min(2, "Business name must be at least 2 characters long"),
    businessType: z.enum(["cafe", "restaurant", "qsr", "cloud_kitchen", "bakery"] as const, {
        error: "Please select a business type",
    }),
    email: z.string().email("Please provide a valid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    gstin: z.string().max(15, "GSTIN cannot exceed 15 characters").optional().or(z.literal('')),
    website: z.string().url("Please provide a valid URL").optional().or(z.literal('')),
    socials: z.array(socialEntrySchema).optional(),
    businessAddress: z.string().min(10, "Please provide a complete address")
})