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

export const manufacturerOnboardingSchema = z.object({
    fullname: z.string().min(2, "Name must be at least 2 characters long"),
    companyFirmName: z.string().min(2, "Company/Firm name must be at least 2 characters long"),
    gstin: z.string().length(15, "GSTIN must be exactly 15 characters"),
    email: z.string().email("Please provide a valid email address"),
    mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
    services: z.array(z.object({ value: z.string() })).optional(),
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