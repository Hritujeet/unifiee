import z from "zod";

/**
 * Validates URLs ensuring only safe http/https schemes are accepted.
 * Defends against XSS via javascript:, data:, or vbscript: URLs.
 */
export const safeUrlSchema = z
    .string()
    .trim()
    .max(2048, "URL cannot exceed 2048 characters")
    .refine(
        (val) => !val || /^https?:\/\//i.test(val),
        "URL must start with http:// or https://"
    )
    .refine(
        (val) => !val || !/^(javascript|data|vbscript):/i.test(val),
        "Invalid or unsafe URL scheme"
    );

export const loginFormSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Please provide a valid email address")
        .max(255, "Email address is too long"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(128, "Password cannot exceed 128 characters"),
});

export const signupFormSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name cannot exceed 100 characters"),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Please provide a valid email address")
        .max(255, "Email address is too long"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(128, "Password cannot exceed 128 characters"),
});

export const setPasswordSchema = z
    .object({
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .max(128, "Password cannot exceed 128 characters"),
        confirmPassword: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .max(128, "Password cannot exceed 128 characters"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

const socialEntrySchema = z.object({
    platform: z.string().trim().max(50, "Platform name is too long"),
    url: safeUrlSchema.optional().or(z.literal("")),
});

export const manufacturerPackagingCategoryValues = [
    "paper-cups",
    "food-boxes",
    "paper-bags",
    "corrugated-boxes",
    "stickers-labels",
    "cutlery",
    "others",
] as const;

export const manufacturerPackagingCategories = [
    { label: "Paper Cups", value: "paper-cups" },
    { label: "Food Boxes", value: "food-boxes" },
    { label: "Paper Bags", value: "paper-bags" },
    { label: "Corrugated Boxes", value: "corrugated-boxes" },
    { label: "Stickers/Labels", value: "stickers-labels" },
    { label: "Cutlery", value: "cutlery" },
    { label: "Others", value: "others" },
] as const;

export const manufacturerCapabilityValues = [
    "flexographic-printing",
    "offset-printing",
    "digital-printing",
    "corrugation",
    "die-cutting",
    "lamination",
    "custom-printing",
] as const;

export const manufacturerCapabilities = [
    { label: "Flexographic Printing", value: "flexographic-printing" },
    { label: "Offset Printing", value: "offset-printing" },
    { label: "Digital Printing", value: "digital-printing" },
    { label: "Corrugation", value: "corrugation" },
    { label: "Die Cutting", value: "die-cutting" },
    { label: "Lamination", value: "lamination" },
    { label: "Custom Printing", value: "custom-printing" },
] as const;

export const designerPackagingSpecializationValues = [
    "food-boxes",
    "paper-cups",
    "paper-bags",
    "labels-stickers",
    "corrugated-packaging",
    "takeaway-packaging",
    "flexible-packaging",
    "other",
] as const;

export const designerPackagingSpecializations = [
    { label: "Food Boxes", value: "food-boxes" },
    { label: "Paper Cups", value: "paper-cups" },
    { label: "Paper Bags", value: "paper-bags" },
    { label: "Labels/Stickers", value: "labels-stickers" },
    { label: "Corrugated Packaging", value: "corrugated-packaging" },
    { label: "Takeaway Packaging", value: "takeaway-packaging" },
    { label: "Flexible Packaging", value: "flexible-packaging" },
    { label: "Other", value: "other" },
] as const;

export const manufacturerOnboardingSchema = z.object({
    fullname: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name cannot exceed 100 characters"),
    companyFirmName: z
        .string()
        .trim()
        .min(2, "Company/Firm name must be at least 2 characters long")
        .max(200, "Company name cannot exceed 200 characters"),
    gstin: z
        .string()
        .trim()
        .toUpperCase()
        .length(15, "GSTIN must be exactly 15 characters")
        .regex(/^[0-9A-Z]{15}$/, "GSTIN must contain valid alphanumeric characters"),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Please provide a valid email address")
        .max(255, "Email address is too long"),
    mobile: z
        .string()
        .trim()
        .min(10, "Mobile number must be at least 10 digits")
        .max(20, "Mobile number is too long")
        .regex(/^\+?[\d\s().-]+$/, "Please provide a valid phone number"),
    packagingCategories: z
        .array(z.enum(manufacturerPackagingCategoryValues))
        .min(1, "Select at least one packaging category")
        .max(20),
    capabilities: z
        .array(z.enum(manufacturerCapabilityValues))
        .min(1, "Select at least one capability")
        .max(20)
        .refine(
            (capabilities) => capabilities.includes("custom-printing"),
            "Custom Printing is mandatory"
        ),
    socials: z.array(socialEntrySchema).max(10, "Maximum 10 social links allowed").optional(),
    address: z
        .string()
        .trim()
        .min(10, "Please provide a complete address")
        .max(1000, "Address cannot exceed 1000 characters"),
});

export const designerOnboardingSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name cannot exceed 100 characters"),
    displayName: z.string().trim().max(100, "Display name is too long").optional().or(z.literal("")),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Please provide a valid email address")
        .max(255, "Email address is too long"),
    phone: z
        .string()
        .trim()
        .min(10, "Mobile number must be at least 10 digits")
        .max(20, "Mobile number is too long")
        .regex(/^\+?[\d\s().-]+$/, "Please provide a valid phone number"),
    city: z.string().trim().min(2, "City is required").max(100, "City name is too long"),
    state: z.string().trim().min(2, "State is required").max(100, "State name is too long"),

    headline: z
        .string()
        .trim()
        .min(5, "Headline must be at least 5 characters long")
        .max(300, "Headline cannot exceed 300 characters"),
    bio: z.string().trim().max(5000, "Bio cannot exceed 5000 characters").optional().or(z.literal("")),
    yearsOfExperience: z
        .coerce
        .number()
        .int("Years of experience must be an integer")
        .min(0, "Years of experience must be 0 or more")
        .max(80, "Years of experience cannot exceed 80"),
    specializations: z
        .array(z.string().trim().min(1).max(100))
        .min(1, "Select at least one specialization")
        .max(30),
    packagingDesignSpecializations: z
        .array(z.enum(designerPackagingSpecializationValues))
        .min(1, "Select at least one packaging design specialization")
        .max(20),
    softwareTools: z
        .array(z.string().trim().min(1).max(100))
        .min(1, "Select at least one tool")
        .max(30),
    industriesServed: z.array(z.string().trim().min(1).max(100)).max(30).optional(),

    portfolioUrl: safeUrlSchema.refine((val) => !!val && val.length > 0, "Portfolio URL is required"),
    behance: safeUrlSchema.optional().or(z.literal("")),
    dribbble: safeUrlSchema.optional().or(z.literal("")),
    instagram: safeUrlSchema.optional().or(z.literal("")),
    linkedin: safeUrlSchema.optional().or(z.literal("")),
    website: safeUrlSchema.optional().or(z.literal("")),

    pricingModel: z.enum(["per_project", "hourly", "per_design"]),
    startingPrice: z
        .coerce
        .number()
        .min(0, "Starting price must be non-negative")
        .max(999999999, "Price is too high")
        .optional(),
    turnaroundTime: z.string().trim().max(100, "Turnaround time is too long").optional().or(z.literal("")),
    revisionsIncluded: z
        .coerce
        .number()
        .int("Revisions must be an integer")
        .min(0, "Revisions must be non-negative")
        .max(100, "Revisions cannot exceed 100")
        .optional(),
    availabilityStatus: z.enum(["available", "limited", "unavailable"]),
});

export const businessOnboardingSchema = z.object({
    fullname: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(100, "Name cannot exceed 100 characters"),
    ownerName: z
        .string()
        .trim()
        .min(2, "Owner name must be at least 2 characters long")
        .max(100, "Owner name cannot exceed 100 characters"),
    role: z.enum(["owner", "manager"] as const, {
        error: "Please select your role",
    }),
    businessName: z
        .string()
        .trim()
        .min(2, "Business name must be at least 2 characters long")
        .max(200, "Business name cannot exceed 200 characters"),
    businessType: z.enum(["cafe", "restaurant", "qsr", "cloud_kitchen", "bakery"] as const, {
        error: "Please select a business type",
    }),
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Please provide a valid email address")
        .max(255, "Email address is too long"),
    phone: z
        .string()
        .trim()
        .min(10, "Phone number must be at least 10 digits")
        .max(20, "Phone number is too long")
        .regex(/^\+?[\d\s().-]+$/, "Please provide a valid phone number"),
    gstin: z
        .string()
        .trim()
        .toUpperCase()
        .max(15, "GSTIN cannot exceed 15 characters")
        .regex(/^([0-9A-Z]{15})?$/, "GSTIN must be 15 alphanumeric characters")
        .optional()
        .or(z.literal("")),
    website: safeUrlSchema.optional().or(z.literal("")),
    socials: z.array(socialEntrySchema).max(10, "Maximum 10 social links allowed").optional(),
    businessAddress: z
        .string()
        .trim()
        .min(10, "Please provide a complete address")
        .max(1000, "Address cannot exceed 1000 characters"),
});