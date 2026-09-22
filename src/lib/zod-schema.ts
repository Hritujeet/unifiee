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

export const vendorOnboardingSchema = z.object({
    fullname: z.string().min(2, "Name must be at least 2 characters long"),
    companyFirmName: z.string().min(2, "Company/Firm name must be at least 2 characters long"),
    gstin: z.string().min(15, "GSTIN must be 15 characters long").max(15, "GSTIN must be 15 characters long"),
    email: z.string().email("Please provide a valid email address"),
    mobile: z.string().min(10, "Mobile number must be at least 10 characters long"),
    vendorType: z.enum(["manufacturer", "printer", "supplier", "distributor"]),
    services: z.array(z.string()).optional(),
    socials: z.array(z.object({
        platform: z.string(),
        url: z.string().url("Please provide a valid URL").optional().or(z.literal(''))
    })).optional(),
    address: z.string().min(10, "Please provide a complete address")
})

export const businessOnboardingSchema = z.object({
    fullname: z.string().min(2, "Name must be at least 2 characters long"),
    ownerName: z.string().min(2, "Owner name must be at least 2 characters long"),
    role: z.enum(["owner", "manager", "procurement"]),
    businessName: z.string().min(2, "Business name must be at least 2 characters long"),
    businessType: z.enum(["cafe", "restaurant", "qsr", "cloud_kitchen", "bakery"]),
    email: z.string().email("Please provide a valid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 characters long"),
    gstin: z.string().max(15, "GSTIN cannot exceed 15 characters").optional().or(z.literal('')),
    website: z.string().url("Please provide a valid URL").optional().or(z.literal('')),
    storeImage: z.any().optional(), // Using any for file upload for now
    socials: z.array(z.object({
        platform: z.string(),
        url: z.string().url("Please provide a valid URL").optional().or(z.literal(''))
    })).optional(),
    businessAddress: z.string().min(10, "Please provide a complete address")
})