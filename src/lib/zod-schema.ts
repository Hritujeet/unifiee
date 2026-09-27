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

export const vendorOnboardingSchema = z.object({
    fullname: z.string().min(2, "Name must be at least 2 characters long"),
    companyFirmName: z.string().min(2, "Company/Firm name must be at least 2 characters long"),
    gstin: z.string().length(15, "GSTIN must be exactly 15 characters"),
    email: z.string().email("Please provide a valid email address"),
    mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
    vendorType: z.enum(["manufacturer", "printer", "supplier", "distributor"] as const, {
        error: "Please select a vendor type",
    }),
    services: z.array(z.object({ value: z.string() })).optional(),
    socials: z.array(socialEntrySchema).optional(),
    address: z.string().min(10, "Please provide a complete address")
})

export const businessOnboardingSchema = z.object({
    fullname: z.string().min(2, "Name must be at least 2 characters long"),
    ownerName: z.string().min(2, "Owner name must be at least 2 characters long"),
    role: z.enum(["owner", "manager", "procurement"] as const, {
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
    storeImage: z.any().optional(),
    socials: z.array(socialEntrySchema).optional(),
    businessAddress: z.string().min(10, "Please provide a complete address")
})