import { config } from "dotenv"
config({ path: ".env.local" })

import { db } from "../../src/lib/db"
import { account, user } from "../../src/lib/db/schema/auth-schema"
import { business } from "../../src/lib/db/schema/business"
import {
    businessHiredServiceTable,
    hiredServiceEventsTable,
    hiredServiceMessagesTable,
    hiredServiceDeliveriesTable,
    designerReviewsTable,
    businessSavedServicesTable,
} from "../../src/lib/db/schema/business-hired-service"
import { businessOrderItemsTable, businessOrdersTable } from "../../src/lib/db/schema/business-order"
import { businessRequirementsTable } from "../../src/lib/db/schema/business-requirement"
import {
    designerServiceTable,
    designerServicePackagesTable,
    designerServiceExtrasTable,
} from "../../src/lib/db/schema/designer-service"
import { aiDocumentsTable } from "../../src/lib/db/schema/ai-document"
import { idempotencyRecordsTable } from "../../src/lib/db/schema/idempotency"
import { manufacturerTable } from "../../src/lib/db/schema/manufacturer"
import { offeringsTable, offeringImagesTable, offeringPriceTiersTable, offeringTypesTable } from "../../src/lib/db/schema/offering"
import { packagingDesignerTable } from "../../src/lib/db/schema/packaging-designer"
import { vendorFacilitiesTable } from "../../src/lib/db/schema/vendor-facility"
import { orderFulfillmentMilestonesTable, orderShipmentsTable } from "../../src/lib/db/schema/vendor-fulfillment"
import { vendorInquiriesTable } from "../../src/lib/db/schema/vendor-inquiry"
import { vendorQuotationsTable } from "../../src/lib/db/schema/vendor-quotation"
import { vendorReviewsTable } from "../../src/lib/db/schema/vendor-review"
import { vendorInvoicesTable } from "../../src/lib/db/schema/deferred/vendor-invoice"
import { vendorPayoutAccountsTable } from "../../src/lib/db/schema/deferred/vendor-payout"
import { and, eq, inArray, sql } from "drizzle-orm"
import { syncEntityEmbeddings, buildGigTemplate, buildOfferingTemplate, buildRequirementTemplate } from "../../src/lib/ai/embeddings"
import { seedBusinesses } from "./data/businesses"
import { seedDesigners } from "./data/designers"
import { seedManufacturers } from "./data/manufacturers"
import { ensureSeedAccount } from "./accounts"
import { hostFromDatabaseUrl, money, seedDate, seedKey, seedPhone, seedUuid } from "./factories"

const password = process.env.SEED_PASSWORD || "Unifiee@123"
const args = new Set(process.argv.slice(2))
const reset = args.has("--reset")
const force = args.has("--force")
const skipEmbeddings = args.has("--skip-embeddings")
const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL

if (!databaseUrl) throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is required")
const databaseHost = hostFromDatabaseUrl(databaseUrl)
const allowedHosts = (process.env.SEED_ALLOWED_HOSTS || "localhost,127.0.0.1,neon.tech,neon.tech").split(",").map((host) => host.trim()).filter(Boolean)

function assertSafeEnvironment() {
    console.log(`Database host: ${databaseHost}`)
    if (process.env.NODE_ENV === "production" && !force) throw new Error("Refusing to seed NODE_ENV=production without --force")
    if (!force && !allowedHosts.some((allowed) => databaseHost === allowed || databaseHost.endsWith(`.${allowed}`))) {
        throw new Error(`Database host ${databaseHost} is not in SEED_ALLOWED_HOSTS; use --force to override`)
    }
}

const profileIds = new Map<string, { businessId?: string; designerId?: string; manufacturerId?: string }>()
const offeringIds: string[] = []
const serviceIds: string[] = []
const serviceMap = new Map<string, { id: string; designerId: string; slug: string; title: string; price: string }>()
const requirementIds: string[] = []
const quotationIds: string[] = []
const orderIds: string[] = []

async function createAccounts() {
    for (const item of seedBusinesses) {
        const userId = await ensureSeedAccount({ key: item.key, name: item.name, role: "business" }, password)
        profileIds.set(`business:${item.key}`, { businessId: seedUuid(`business:${item.key}`) })
        await db.insert(business).values({
            id: seedUuid(`business:${item.key}`),
            userId,
            name: item.name.split(" ")[0]!,
            fullName: item.name,
            ownerName: item.name,
            businessName: item.businessName,
            email: seedKey("business", item.key),
            phone: seedPhone(100 + seedBusinesses.indexOf(item)),
            businessType: item.businessType,
            businessAddress: `${item.businessName}, ${item.city}, ${item.state}, India`,
            role: item.role,
            gstin: item.gstin,
            website: `https://${item.key}.example.test`,
            socials: [`instagram:https://instagram.com/${item.key}`],
        }).onConflictDoNothing()
    }

    for (const item of seedDesigners) {
        const userId = await ensureSeedAccount({ key: item.key, name: item.name, role: "designer" }, password)
        const designerId = seedUuid(`designer:${item.key}`)
        profileIds.set(`designer:${item.key}`, { designerId })
        if (item.empty) continue
        await db.insert(packagingDesignerTable).values({
            id: designerId,
            userId,
            fullName: item.name,
            displayName: item.name.split(" ")[0]!,
            email: seedKey("designer", item.key),
            phone: seedPhone(200 + seedDesigners.indexOf(item)),
            city: item.city,
            state: item.state,
            country: "India",
            headline: "Packaging designer for ambitious food brands",
            bio: `I help Indian F&B brands create practical ${item.specialization} systems that look beautiful on shelf and in delivery.`,
            yearsOfExperience: 6 + seedDesigners.indexOf(item),
            specializations: [item.specialization, "takeaway-packaging"],
            packagingDesignSpecializations: [item.specialization, "takeaway-packaging"],
            softwareTools: ["Adobe Illustrator", "Figma", "Blender"],
            languages: ["English", "Hindi"],
            industriesServed: ["F&B", "D2C food", "Hospitality"],
            portfolioUrl: `https://portfolio.example.test/${item.key}`,
            additionalLinks: { behance: `https://behance.net/${item.key}` },
            portfolioImages: ["https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80"],
            pricingModel: "per_project",
            startingPrice: "8500.00",
            turnaroundTime: "5-7 working days",
            revisionsIncluded: 3,
            availabilityStatus: item.empty ? "limited" : "available",
            isVerified: true,
            isActive: true,
        }).onConflictDoNothing()
    }

    for (const item of seedManufacturers) {
        const userId = await ensureSeedAccount({ key: item.key, name: item.contact, role: "manufacturer" }, password)
        const manufacturerId = seedUuid(`manufacturer:${item.key}`)
        profileIds.set(`manufacturer:${item.key}`, { manufacturerId })
        await db.insert(manufacturerTable).values({
            id: manufacturerId,
            userId,
            name: item.contact.split(" ")[0]!,
            fullName: item.contact,
            companyName: item.name,
            email: seedKey("manufacturer", item.key),
            phone: seedPhone(300 + seedManufacturers.indexOf(item)),
            packagingCategories: ["food-boxes", "paper-cups", "paper-bags", "corrugated-boxes", "stickers-labels"],
            capabilities: ["offset-printing", "corrugation", "die-cutting", "custom-printing"],
            manufacturerAddress: `${item.name}, ${item.city}, ${item.state}, India`,
            gstin: item.gstin,
            socials: [`linkedin:https://linkedin.com/company/${item.key}`],
        }).onConflictDoNothing()
        if (item.empty) continue
        await db.insert(vendorFacilitiesTable).values({
            id: seedUuid(`facility:${item.key}`),
            vendorId: manufacturerId,
            facilityName: `${item.name} Production Unit`,
            factoryAreaSqFt: 18000 + seedManufacturers.indexOf(item) * 2500,
            dailyCapacityUnits: "25,000 units",
            operatingSinceYear: 2012 + seedManufacturers.indexOf(item),
            shiftCount: 2,
            machinery: [{ name: "Rotary die cutter", quantity: 2, speedPerHour: "4,000 sheets" }, { name: "Flexographic printer", quantity: 1 }],
            certifications: [{ name: "FSSAI packaging compliance", status: "active" }, { name: "ISO 9001", status: "active" }],
            qualityTestingMethods: ["Bursting strength", "GSM measurement", "Ink rub test"],
            minOrderValue: "25000.00",
            defaultLeadTimeDays: 12,
            acceptsCustomOrders: true,
            factoryAudited: true,
        }).onConflictDoNothing()
    }

    const onboardingUser = await ensureSeedAccount({ key: "onboarding", name: "Onboarding Pending", role: "none" }, password)
    const googleUser = await ensureSeedAccount({ key: "google", name: "Google Account Demo", role: "none", provider: "google" }, password)
    console.log(`Accounts ready: ${profileIds.size} profiles, onboarding=${onboardingUser}, google=${googleUser}`)
}

async function seedCatalog() {
    const types = [
        ["corrugated-boxes", "Corrugated Boxes"], ["paper-cups", "Paper Cups"], ["paper-bags", "Paper Bags"],
        ["stickers-labels", "Stickers & Labels"], ["food-boxes", "Food Boxes"], ["bowls", "Paper Bowls"],
    ]
    for (const [key, displayName] of types) {
        await db.insert(offeringTypesTable).values({
            key: `seed-${key}`,
            displayName,
            vendorType: "manufacturer",
            fieldDefinitions: [{ name: "gsm", label: "GSM", type: "number", required: true }],
        }).onConflictDoNothing()
    }

    const standardTypes = [
        ["paper_cup", "Paper Cups & Tumblers"],
        ["pizza_box", "Pizza Boxes & Corrugated"],
        ["corrugated_box", "Shipping Cartons & Boxes"],
        ["food_container", "Food Containers & Meal Trays"],
        ["pouch", "Pouches & Bags"],
        ["paper_bag", "Paper Carry Bags"],
        ["cutlery", "Cutlery & Wooden Ware"],
        ["stickers_labels", "Stickers & Labels"],
        ["bowls", "Paper Bowls"],
        ["others", "Other Packaging"],
        ["paper-cups", "Paper Cups & Tumblers"],
        ["food-boxes", "Food Containers & Meal Trays"],
        ["paper-bags", "Paper Carry Bags"],
        ["corrugated-boxes", "Shipping Cartons & Boxes"],
        ["stickers-labels", "Stickers & Labels"],
    ]
    for (const [key, displayName] of standardTypes) {
        await db.insert(offeringTypesTable).values({
            key,
            displayName,
            vendorType: "manufacturer",
            fieldDefinitions: [],
        }).onConflictDoNothing()
    }
}

async function seedDesignerServices() {
    type GigSeedData = {
        key: string
        title: string
        slug: string
        category: "dieline_structural" | "label_sticker" | "logo_brand_identity" | "3d_mockup_render" | "full_packaging_set"
        description: string
        tags: string[]
        packagingTypes: string[]
        softwareUsed: string[]
        sampleImages: string[]
        faq: Array<{ question: string; answer: string }>
        status: "published" | "draft" | "paused"
        ratingAvg: string
        ratingCount: number
        packages: Array<{
            tier: "basic" | "standard" | "premium"
            name: string
            description: string
            price: number
            deliveryDays: number
            revisionsIncluded: number
            deliverables: string[]
            sourceFilesIncluded: boolean
            commercialUseIncluded: boolean
        }>
        extras?: Array<{ name: string; price: number; extraDays: number }>
    }

    const gigs: GigSeedData[] = [
        // 1. Meera Iyer (Mumbai) - 4 gigs (3 published, 1 paused)
        {
            key: "meera",
            title: "Eco-Friendly Corrugated Burger & Meal Box Dieline Design",
            slug: "eco-friendly-corrugated-burger-meal-box-design",
            category: "dieline_structural",
            description: "Production-ready structural dielines for food boxes, grease-resistant meal containers, and lock-corner takeaway clamshells. Engineered to minimize paper waste and ensure easy pop-up assembly for busy kitchens.",
            tags: ["burger box", "kraft box", "takeaway packaging", "dieline", "eco packaging"],
            packagingTypes: ["boxes", "takeaway", "corrugated-boxes"],
            softwareUsed: ["Adobe Illustrator", "ArtiosCAD", "Photoshop"],
            sampleImages: ["https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1000&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1000&auto=format&fit=crop&q=80"],
            faq: [
                { question: "What file formats will I receive?", answer: "You will receive print-ready 300 DPI PDF files with distinct cut and crease layers, along with native Adobe Illustrator (.AI) vector files." },
                { question: "Can you design for custom food-tray dimensions?", answer: "Yes! Simply provide the internal dimensions or sample food container size during brief submission." },
                { question: "Do you coordinate with the print manufacturer?", answer: "Yes, on Standard and Premium packages I provide technical print sign-off notes for your converter." },
            ],
            status: "published",
            ratingAvg: "4.90",
            ratingCount: 14,
            packages: [
                {
                    tier: "basic",
                    name: "Essential Single SKU Box",
                    description: "1 Custom dieline template with cut/crease lines, fold guide, and vector PDF.",
                    price: 4500,
                    deliveryDays: 3,
                    revisionsIncluded: 2,
                    deliverables: ["Print-Ready PDF", "Vector Dieline (.AI)", "Assembly Guide"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
                {
                    tier: "standard",
                    name: "Complete Meal Box & Liner Set",
                    description: "Structural dieline plus full outer branding graphics and greaseproof paper liner artwork.",
                    price: 8500,
                    deliveryDays: 5,
                    revisionsIncluded: 4,
                    deliverables: ["Print-Ready PDF", "Vector Dieline (.AI)", "Liner Artwork", "3D Folded Preview"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
                {
                    tier: "premium",
                    name: "Full QSR Takeaway Range (3 Sizes)",
                    description: "Comprehensive 3-size box family (Small, Medium, Large) with complete branding and factory specs.",
                    price: 15500,
                    deliveryDays: 8,
                    revisionsIncluded: -1,
                    deliverables: ["3x Complete Dieline Sets", "Full Color Graphics", "3D Renders", "Factory Print Notes"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
            ],
            extras: [
                { name: "Rush 24h Delivery", price: 2000, extraDays: 0 },
                { name: "3D Photorealistic Render", price: 3500, extraDays: 2 },
            ],
        },
        {
            key: "meera",
            title: "Custom Foldable Pizza & Calzone Box Structural Design",
            slug: "custom-foldable-pizza-calzone-box-design",
            category: "dieline_structural",
            description: "High-ventilation pizza and calzone boxes designed in B-flute and E-flute corrugated board. Optimized venting holes keep crusts crisp during delivery.",
            tags: ["pizza box", "e-flute", "corrugated", "greaseproof", "steam vents"],
            packagingTypes: ["boxes", "corrugated-boxes"],
            softwareUsed: ["Adobe Illustrator", "ArtiosCAD"],
            sampleImages: ["https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1000&auto=format&fit=crop&q=80"],
            faq: [
                { question: "Are steam vents included in the dieline?", answer: "Yes, strategically positioned rear vents prevent condensation build-up." },
            ],
            status: "published",
            ratingAvg: "4.80",
            ratingCount: 8,
            packages: [
                {
                    tier: "basic",
                    name: "Standard Pizza Box Dieline + Print Art",
                    description: "Complete lid and side wall dieline with 2-color flexographic print layout.",
                    price: 6000,
                    deliveryDays: 4,
                    revisionsIncluded: 3,
                    deliverables: ["Print-Ready PDF", "AI Vector", "Dimension Spec Sheet"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
            ],
            extras: [{ name: "Additional Flute Size Dieline", price: 2000, extraDays: 1 }],
        },
        {
            key: "meera",
            title: "Artisanal Dessert & Mithai Rigid Gift Box System",
            slug: "artisanal-dessert-mithai-rigid-gift-box-system",
            category: "full_packaging_set",
            description: "Luxury book-style and shoulder-neck rigid boxes for artisanal sweets, chocolates, and festive gift hampers. Features spot UV, gold foil stamping dielines, and custom partition trays.",
            tags: ["luxury packaging", "mithai box", "rigid box", "foil stamping", "embossing"],
            packagingTypes: ["boxes", "food-boxes"],
            softwareUsed: ["Adobe Illustrator", "Photoshop", "Blender"],
            sampleImages: ["https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=1000&auto=format&fit=crop&q=80"],
            faq: [
                { question: "Do you provide foil stamping layers?", answer: "Yes, metallic foil and UV spot masks are saved on separate spot-color layers." },
            ],
            status: "published",
            ratingAvg: "5.00",
            ratingCount: 5,
            packages: [
                {
                    tier: "basic",
                    name: "Single Sweet Box",
                    description: "Base & lid rigid box artwork with foil stamping vector layer.",
                    price: 7500,
                    deliveryDays: 4,
                    revisionsIncluded: 2,
                    deliverables: ["Base & Lid Dielines", "Foil Mask Layer", "Print PDF"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
                {
                    tier: "standard",
                    name: "Two-Tier Gift Box with Sleeve",
                    description: "Outer rigid slide sleeve, inner double-tier structure with 12-cavity divider tray.",
                    price: 14000,
                    deliveryDays: 7,
                    revisionsIncluded: 4,
                    deliverables: ["Slide Sleeve Art", "Divider Tray Dieline", "3D Photorealistic Render"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
                {
                    tier: "premium",
                    name: "Festive Collection (3 Rigid Boxes + Carry Bag)",
                    description: "Complete seasonal gifting suite with 3 box formats and matching woven-handle carry bag.",
                    price: 26000,
                    deliveryDays: 12,
                    revisionsIncluded: -1,
                    deliverables: ["3x Rigid Box Suites", "Matching Carry Bag Dieline", "Master AI + PDF", "Converter Spec PDF"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
            ],
        },
        {
            key: "meera",
            title: "Minimalist Grab-and-Go Salad & Poke Bowl Packaging",
            slug: "grab-and-go-salad-poke-bowl-packaging",
            category: "label_sticker",
            description: "Custom belly-band sleeves and tamper-evident seal stickers for transparent biodegradable salad bowls and cold poke bowls.",
            tags: ["salad bowl", "sleeve", "tamper evident", "biodegradable"],
            packagingTypes: ["bowls", "cups", "takeaway"],
            softwareUsed: ["Adobe Illustrator"],
            sampleImages: ["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1000&auto=format&fit=crop&q=80"],
            faq: [{ question: "Can the sleeve adjust to different bowl sizes?", answer: "Yes, we can provide interlocking notches for variable circumference." }],
            status: "paused",
            ratingAvg: "4.70",
            ratingCount: 3,
            packages: [
                {
                    tier: "basic",
                    name: "Sleeve & Safety Seal",
                    description: "Interlocking card sleeve artwork plus matching round tamper-evident sticker.",
                    price: 5000,
                    deliveryDays: 3,
                    revisionsIncluded: 2,
                    deliverables: ["Print PDF", "Vector AI", "Cut Contour SVG"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
            ],
        },

        // 2. Kabir Sethi (Delhi) - 3 gigs (all published)
        {
            key: "kabir",
            title: "Specialty Cafe Hot & Cold Paper Cup Branding Set",
            slug: "specialty-cafe-hot-cold-paper-cup-branding-set",
            category: "label_sticker",
            description: "High-impact 360-degree curved cup artwork for specialty coffee bars, matcha cafes, and boba teashops. Mathematically mapped curved templates ensure zero logo distortion on tapered paper cups.",
            tags: ["coffee cups", "ripple cup", "cold brew", "cup sleeve", "cafe branding"],
            packagingTypes: ["cups", "takeaway"],
            softwareUsed: ["Adobe Illustrator", "Photoshop", "Blender"],
            sampleImages: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1000&auto=format&fit=crop&q=80"],
            faq: [
                { question: "How do you handle curved cup distortion?", answer: "I calculate precise conic projections based on your cup rim diameter, bottom diameter, and slant height." },
            ],
            status: "published",
            ratingAvg: "4.90",
            ratingCount: 11,
            packages: [
                {
                    tier: "basic",
                    name: "Single Size Cup Artwork (8oz or 12oz)",
                    description: "Curved cup artwork layout for 1 size with seamless pattern wrap.",
                    price: 4000,
                    deliveryDays: 3,
                    revisionsIncluded: 2,
                    deliverables: ["Conic Print PDF", "Source AI", "3D Cup Preview"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
                {
                    tier: "standard",
                    name: "Standard Cafe Duo (8oz Hot + 16oz Cold)",
                    description: "Hot cup paperboard layout plus clear PET iced cup wrap with matching color scheme.",
                    price: 7500,
                    deliveryDays: 5,
                    revisionsIncluded: 4,
                    deliverables: ["2x Curved Cup Files", "PET Clear Print Proof", "Pantone Breakdown"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
                {
                    tier: "premium",
                    name: "Full Cafe Beverage Suite (3 Cups + Sleeve + Coaster)",
                    description: "8oz, 12oz, 16oz cups, corrugated thermal cup sleeve, and biodegradable coasters.",
                    price: 13000,
                    deliveryDays: 7,
                    revisionsIncluded: -1,
                    deliverables: ["3x Cup Sizes", "Sleeve Dieline", "Coaster Layout", "3D Cafe Scene"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
            ],
            extras: [{ name: "3D Motion Cup Turnaround", price: 3000, extraDays: 2 }],
        },
        {
            key: "kabir",
            title: "Thermal Cup Sleeves & Biodegradable Drink Coasters",
            slug: "thermal-cup-sleeves-biodegradable-drink-coasters",
            category: "label_sticker",
            description: "Custom embossed corrugated sleeves for hot tea & coffee. High-grip micro-flute dielines with single or dual-color flexo prints.",
            tags: ["cup sleeves", "coasters", "hot coffee", "takeaway"],
            packagingTypes: ["cups", "labels-stickers"],
            softwareUsed: ["Adobe Illustrator"],
            sampleImages: ["https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=1000&auto=format&fit=crop&q=80"],
            faq: [{ question: "Do these fit universal 80mm and 90mm lids?", answer: "Yes, universal taper fits 8oz, 12oz, and 16oz cups." }],
            status: "published",
            ratingAvg: "4.75",
            ratingCount: 6,
            packages: [
                {
                    tier: "basic",
                    name: "Universal Sleeve Dieline & Print Art",
                    description: "Sleeve cut template and front/back emblem artwork.",
                    price: 3500,
                    deliveryDays: 3,
                    revisionsIncluded: 2,
                    deliverables: ["Print PDF", "Vector AI", "Spec Sheet"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
            ],
        },
        {
            key: "kabir",
            title: "Complete Beverage Bar Identity & Packaging Suite",
            slug: "complete-beverage-bar-identity-packaging-suite",
            category: "full_packaging_set",
            description: "From logo badge to cups, bottled cold brews, glass syrup labels, and takeaway bags. Complete cohesive identity designed for modern beverage chains.",
            tags: ["beverage branding", "bottles", "coffee bags", "complete brand suite"],
            packagingTypes: ["cups", "bags", "bottles", "labels-stickers"],
            softwareUsed: ["Adobe Illustrator", "Photoshop", "Figma"],
            sampleImages: ["https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000&auto=format&fit=crop&q=80"],
            faq: [{ question: "Can you provide brand guidelines?", answer: "Yes, Standard and Premium include a typography and color usage manual." }],
            status: "published",
            ratingAvg: "5.00",
            ratingCount: 9,
            packages: [
                {
                    tier: "basic",
                    name: "Core Brand Starter",
                    description: "Primary logo adaptation, 2 cup sizes, and carry bag stamp.",
                    price: 8000,
                    deliveryDays: 5,
                    revisionsIncluded: 3,
                    deliverables: ["Logo Pack", "2 Cup Sizes", "Carry Bag Art"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
                {
                    tier: "standard",
                    name: "Retail Bottled & Cafe Suite",
                    description: "3 Cup sizes, cold brew glass bottle label, paper bag, and brand color guide.",
                    price: 16000,
                    deliveryDays: 8,
                    revisionsIncluded: 5,
                    deliverables: ["3 Cup Formats", "Bottle Label Suite", "Paper Bag Dieline", "Mini Brand Guide"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
                {
                    tier: "premium",
                    name: "Enterprise Multi-Outlet Packaging Ecosystem",
                    description: "Full spectrum packaging architecture with all print proofs, dielines, and brand asset portal.",
                    price: 28000,
                    deliveryDays: 14,
                    revisionsIncluded: -1,
                    deliverables: ["Complete 8-Asset Packaging Suite", "Comprehensive Brand Guidelines PDF", "3D Renders", "Factory Print Support"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
            ],
        },

        // 3. Riya Bose (Kolkata) - 3 gigs (all published)
        {
            key: "riya",
            title: "Artisanal Gourmet Sauce, Pickle & Jam Jar Label Suite",
            slug: "artisanal-gourmet-sauce-pickle-jam-jar-label-suite",
            category: "label_sticker",
            description: "Intricately detailed botanical and modern typographic labels for condiment jars, hot sauces, and premium preserves. Optimized for moisture-resistant vinyl and metallic BOPP finishes.",
            tags: ["jar label", "waterproof label", "sauce bottle", "nutrition table", "fssai compliant"],
            packagingTypes: ["labels-stickers", "bottles", "pouches"],
            softwareUsed: ["Adobe Illustrator", "Photoshop"],
            sampleImages: ["https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?w=1000&auto=format&fit=crop&q=80"],
            faq: [
                { question: "Are your labels FSSAI compliant?", answer: "Yes, all labels feature accurate font sizes, veg/non-veg logos, allergen callouts, and barcode quiet zones compliant with Indian food safety standards." },
            ],
            status: "published",
            ratingAvg: "4.95",
            ratingCount: 19,
            packages: [
                {
                    tier: "basic",
                    name: "Single Jar Front & Back Label",
                    description: "Complete front brand label + rear legal/nutrition panel for 1 container.",
                    price: 5000,
                    deliveryDays: 3,
                    revisionsIncluded: 2,
                    deliverables: ["Print PDF (CMYK)", "Source AI", "FSSAI Compliance Layout"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
                {
                    tier: "standard",
                    name: "Flavor Trio Label Collection (3 SKUs)",
                    description: "Harmonious 3-flavor series with custom ingredient illustration accents.",
                    price: 9500,
                    deliveryDays: 6,
                    revisionsIncluded: 4,
                    deliverables: ["3x Complete Label Sets", "Illustrative Assets", "3D Jar Renders"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
                {
                    tier: "premium",
                    name: "Complete Condiment Range (Up to 6 SKUs) + Carton",
                    description: "Up to 6 flavor SKUs plus matching gift outer carton packaging.",
                    price: 18000,
                    deliveryDays: 10,
                    revisionsIncluded: -1,
                    deliverables: ["6x Label Sets", "Outer Carton Dieline", "Master Source Files", "Print Bleed Guides"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
            ],
            extras: [{ name: "Gold Foil & Spot UV Separation Layer", price: 2500, extraDays: 1 }],
        },
        {
            key: "riya",
            title: "FSSAI-Compliant Back-of-Pack Nutrition & Ingredients Table",
            slug: "fssai-compliant-nutrition-ingredients-label",
            category: "label_sticker",
            description: "Regulatory back-of-pack layout service. Ensures correct RDA values, font sizing rules (minimum 1.5mm), allergen declarations, customer care details, and barcode generation.",
            tags: ["fssai", "nutrition panel", "regulatory label", "barcode", "compliance"],
            packagingTypes: ["labels-stickers", "boxes", "pouches"],
            softwareUsed: ["Adobe Illustrator", "InDesign"],
            sampleImages: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1000&auto=format&fit=crop&q=80"],
            faq: [{ question: "Do you calculate RDA percentages?", answer: "Yes, send your raw lab test or per 100g values and I will calculate the recommended daily allowance percentages." }],
            status: "published",
            ratingAvg: "4.85",
            ratingCount: 12,
            packages: [
                {
                    tier: "basic",
                    name: "Standard FSSAI Nutrition Grid",
                    description: "Ready-to-place vector nutrition table, ingredients list, and regulatory iconography.",
                    price: 3000,
                    deliveryDays: 2,
                    revisionsIncluded: 2,
                    deliverables: ["Vector AI Panel", "High-Res PDF", "Vector Barcode (.EPS)"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
            ],
        },
        {
            key: "riya",
            title: "Stand-Up Barrier Pouch Artwork for Organic Spices & Teas",
            slug: "stand-up-barrier-pouch-artwork-spices-tea",
            category: "full_packaging_set",
            description: "Eye-catching artwork for resealable stand-up pouches (Doypack) with clear windows, tear notches, and matte/gloss foil contrasting elements.",
            tags: ["stand-up pouch", "doypack", "organic tea", "spices packaging", "barrier pouch"],
            packagingTypes: ["pouches", "bags"],
            softwareUsed: ["Adobe Illustrator", "Photoshop", "Blender"],
            sampleImages: ["https://images.unsplash.com/photo-1544816155-12df9643f363?w=1000&auto=format&fit=crop&q=80"],
            faq: [{ question: "Can we include a transparent product window?", answer: "Yes, dielines are marked with clear unprinted film knockout areas." }],
            status: "published",
            ratingAvg: "5.00",
            ratingCount: 7,
            packages: [
                {
                    tier: "basic",
                    name: "Single Pouch Artwork (Front & Back)",
                    description: "Standard 250g or 500g pouch layout with transparent window placement.",
                    price: 6500,
                    deliveryDays: 4,
                    revisionsIncluded: 2,
                    deliverables: ["Print-Ready PDF", "AI Vector", "3D Pouch Mockup"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
                {
                    tier: "standard",
                    name: "Pouch Line (3 SKUs) + Matte/Gloss Masks",
                    description: "3 variant designs with spot UV or matte varnish separation channels.",
                    price: 12000,
                    deliveryDays: 7,
                    revisionsIncluded: 4,
                    deliverables: ["3x Pouch Artworks", "Varnish Channels", "3D Realistic Render"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
                {
                    tier: "premium",
                    name: "Full Pouch Range (5 SKUs) + Shipping Master Carton",
                    description: "5 variant pouches plus matching corrugated master shipper box dieline.",
                    price: 21000,
                    deliveryDays: 11,
                    revisionsIncluded: -1,
                    deliverables: ["5x Pouch Artworks", "Master Carton Dieline", "Complete Source Assets"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
            ],
        },

        // 4. Dev Malhotra (Jaipur) - 3 gigs (2 published, 1 draft)
        {
            key: "dev",
            title: "Heavy-Duty E-Commerce Corrugated Shipping Mailer Boxes",
            slug: "heavy-duty-ecommerce-corrugated-mailer-boxes",
            category: "dieline_structural",
            description: "Roll-end tuck front (RETF) and auto-lock bottom mailer boxes engineered for safe D2C shipping. Minimizes tape usage and provides an unforgettable unboxing experience.",
            tags: ["mailer box", "corrugated", "subscription box", "shipping box", "bursting strength"],
            packagingTypes: ["boxes", "corrugated-boxes"],
            softwareUsed: ["Adobe Illustrator", "ArtiosCAD", "AutoCAD"],
            sampleImages: ["https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=1000&auto=format&fit=crop&q=80"],
            faq: [
                { question: "What flute grade do you recommend for food shipping?", answer: "For D2C fragile jars, 3-ply E-flute or B-flute with internal partition cushioning is optimal." },
            ],
            status: "published",
            ratingAvg: "4.75",
            ratingCount: 4,
            packages: [
                {
                    tier: "basic",
                    name: "Single Mailer Box Dieline",
                    description: "RETF self-locking mailer box template with precise fold tolerances.",
                    price: 5500,
                    deliveryDays: 4,
                    revisionsIncluded: 2,
                    deliverables: ["ArtiosCAD DXF", "Print-Ready PDF", "Tolerances Sheet"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
                {
                    tier: "standard",
                    name: "Mailer Box + Outer & Inner Print Graphics",
                    description: "External shipping graphics plus surprise inner-lid branding and pattern.",
                    price: 10000,
                    deliveryDays: 6,
                    revisionsIncluded: 4,
                    deliverables: ["Exterior & Interior Artwork", "Vector Dieline", "3D Unboxing Render"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
                {
                    tier: "premium",
                    name: "Mailer Box Family + Custom Protective Pulp Insert",
                    description: "2 Mailer box sizes with custom die-cut cardboard or pulp protective insert grid.",
                    price: 18000,
                    deliveryDays: 10,
                    revisionsIncluded: -1,
                    deliverables: ["2x Mailer Dielines", "Insert Cushioning Template", "Complete Print Assets"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
            ],
            extras: [{ name: "Drop Test Structural Optimization Guide", price: 3000, extraDays: 2 }],
        },
        {
            key: "dev",
            title: "Sustainable Molded Pulp Tray & Divider Insert Engineering",
            slug: "sustainable-molded-pulp-tray-divider-insert-engineering",
            category: "dieline_structural",
            description: "100% biodegradable molded paper pulp and folded corrugated insert engineering. Eliminates plastic bubble wrap while keeping glass jars and bottles completely secure.",
            tags: ["pulp tray", "cushioning", "plastic free", "bottle dividers"],
            packagingTypes: ["boxes", "corrugated-boxes"],
            softwareUsed: ["SolidWorks", "ArtiosCAD"],
            sampleImages: ["https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop&q=80"],
            faq: [{ question: "Can molded pulp be manufactured locally in India?", answer: "Yes, multiple tier-1 vendors in Gujarat and Maharashtra have compatible tooling." }],
            status: "published",
            ratingAvg: "4.90",
            ratingCount: 3,
            packages: [
                {
                    tier: "basic",
                    name: "Single SKU Bottle / Jar Divider Grid",
                    description: "Interlocking corrugated divider lattice dieline for safe transport.",
                    price: 7000,
                    deliveryDays: 5,
                    revisionsIncluded: 2,
                    deliverables: ["Lattice Dieline (.DXF & .PDF)", "Material Weight Calculation", "Assembly Diagram"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
            ],
        },
        {
            key: "dev",
            title: "Bulk B2B Master Carton & Pallet Stacking Pattern Design",
            slug: "bulk-b2b-master-carton-pallet-stacking-pattern-design",
            category: "dieline_structural",
            description: "Heavy 5-ply and 7-ply corrugated shipping master cartons designed for export and long-haul logistics. Optimized for standard Indian and Euro pallet footprints.",
            tags: ["master carton", "export shipping", "palletization", "logistics"],
            packagingTypes: ["corrugated-boxes", "boxes"],
            softwareUsed: ["ArtiosCAD", "Adobe Illustrator"],
            sampleImages: ["https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1000&auto=format&fit=crop&q=80"],
            faq: [{ question: "Do you calculate ECT (Edge Crush Test) values?", answer: "Yes, board GSM and flute recommendations are calculated from stack weight." }],
            status: "draft",
            ratingAvg: "0.00",
            ratingCount: 0,
            packages: [
                {
                    tier: "basic",
                    name: "Master Shipper Dieline",
                    description: "RSC (Regular Slotted Carton) dieline with export compliance markings.",
                    price: 4500,
                    deliveryDays: 3,
                    revisionsIncluded: 2,
                    deliverables: ["Print PDF", "CAD Dieline", "Pallet Pattern Guide"],
                    sourceFilesIncluded: true,
                    commercialUseIncluded: true,
                },
            ],
        },
    ]

    for (const gig of gigs) {
        const designerProfile = profileIds.get(`designer:${gig.key}`)
        if (!designerProfile?.designerId) continue
        const designerId = designerProfile.designerId
        const id = seedUuid(`service:${gig.key}:${gig.slug}`)
        serviceIds.push(id)
        serviceMap.set(gig.slug, {
            id,
            designerId,
            slug: gig.slug,
            title: gig.title,
            price: money(gig.packages[0]?.price || 5000),
        })

        const startingPrice = money(gig.packages[0]?.price || 5000)
        const primaryPackage = gig.packages[0]

        await db.insert(designerServiceTable).values({
            id,
            designerId,
            title: gig.title,
            slug: gig.slug,
            category: gig.category,
            description: gig.description,
            tags: gig.tags,
            packagingTypes: gig.packagingTypes,
            softwareUsed: gig.softwareUsed,
            sampleImages: gig.sampleImages,
            faq: gig.faq,
            status: gig.status,
            serviceType: gig.category,
            pricingModel: "per_project",
            price: startingPrice,
            turnaroundDays: primaryPackage?.deliveryDays || 7,
            revisionsIncluded: primaryPackage?.revisionsIncluded || 3,
            deliverables: primaryPackage?.deliverables || ["Print-ready PDF", "Editable source file"],
            ratingAvg: gig.ratingAvg,
            ratingCount: gig.ratingCount,
        }).onConflictDoNothing()

        for (const pkg of gig.packages) {
            await db.insert(designerServicePackagesTable).values({
                id: seedUuid(`package:${id}:${pkg.tier}`),
                serviceId: id,
                tier: pkg.tier,
                name: pkg.name,
                description: pkg.description,
                price: money(pkg.price),
                deliveryDays: pkg.deliveryDays,
                revisionsIncluded: pkg.revisionsIncluded,
                deliverables: pkg.deliverables,
                sourceFilesIncluded: pkg.sourceFilesIncluded,
                commercialUseIncluded: pkg.commercialUseIncluded,
            }).onConflictDoNothing()
        }

        if (gig.extras) {
            for (const extra of gig.extras) {
                await db.insert(designerServiceExtrasTable).values({
                    id: seedUuid(`extra:${id}:${extra.name}`),
                    serviceId: id,
                    name: extra.name,
                    price: money(extra.price),
                    extraDays: extra.extraDays,
                }).onConflictDoNothing()
            }
        }
    }
}

async function seedOfferings() {
    const categories = ["seed-corrugated-boxes", "seed-paper-cups", "seed-paper-bags", "seed-stickers-labels"]
    for (const item of seedManufacturers.filter((manufacturer) => !manufacturer.empty)) {
        const vendorId = profileIds.get(`manufacturer:${item.key}`)!.manufacturerId!
        for (let index = 0; index < 4; index++) {
            const id = seedUuid(`offering:${item.key}:${index}`)
            offeringIds.push(id)
            const status = index === 0 ? "active" : index === 1 ? "paused" : index === 2 ? "draft" : "archived"
            const validUntil = index === 3 ? seedDate(-2) : seedDate(180)
            await db.insert(offeringsTable).values({
                id, vendorId, vendorType: "manufacturer", offeringType: categories[index],
                title: `${item.name} ${["Kraft Meal Box", "Ripple Paper Cup", "Recycled Carry Bag", "Premium Label Roll"][index]}`,
                description: "Food-safe, custom-printed packaging with consistent colour reproduction and reliable delivery across India.",
                unitOfMeasure: index === 1 ? "piece" : "piece", unitPrice: money(4.5 + index * 2.25),
                currency: "INR", minOrderQuantity: 500 + index * 500, maxOrderQuantity: 100000,
                quantityStep: 500, stockAvailable: 25000, fulfilmentMode: "made_to_order",
                leadTimeDaysMin: 7 + index, leadTimeDaysMax: 14 + index, taxPercent: "18.00",
                hsnSacCode: "48191010", priceIncludesTax: false, shippingTerms: index % 2 ? "buyer_pays" : "vendor_pays",
                addressLine1: `${item.name} Manufacturing Facility`, city: item.city, state: item.state, pincode: "400001",
                country: "India", paymentTerms: "advance_50", sampleAvailable: true, samplePrice: "250.00",
                validFrom: seedDate(-30), validUntil, status, attributes: { gsm: 350 + index * 25, material: "Recycled kraft board", size: "12 x 8 x 4 inch" },
                createdBy: (await db.select({ id: user.id }).from(user).where(eq(user.email, seedKey("manufacturer", item.key))).limit(1))[0]?.id,
                deletedAt: index === 3 ? seedDate(-1) : null,
            }).onConflictDoNothing()
            for (let tier = 0; tier < 3; tier++) {
                await db.insert(offeringPriceTiersTable).values({
                    id: seedUuid(`tier:${item.key}:${index}:${tier}`), offeringId: id,
                    minQuantity: 500 + tier * 2500, maxQuantity: tier === 2 ? null : 2500 + tier * 2500,
                    unitPrice: money(4.5 + index * 2.25 - tier * 0.35),
                }).onConflictDoNothing()
            }
            await db.insert(offeringImagesTable).values({
                id: seedUuid(`image:${item.key}:${index}`), offeringId: id,
                url: `/seed/offerings/${item.key}-${index}.svg`, displayOrder: 0, isPrimary: true,
            }).onConflictDoNothing()
        }
    }
}

async function seedRequirementsAndQuotes() {
    const statuses = ["requirement_received", "quoted", "order_confirmed", "in_production", "shipped", "delivered", "cancelled"] as const
    const businesses = seedBusinesses.filter((businessItem) => !businessItem.empty)
    const manufacturers = seedManufacturers.filter((manufacturer) => !manufacturer.empty)
    for (let index = 0; index < businesses.length; index++) {
        const businessId = profileIds.get(`business:${businesses[index]!.key}`)!.businessId!
        for (let requirementIndex = 0; requirementIndex < 2; requirementIndex++) {
            const id = seedUuid(`requirement:${index}:${requirementIndex}`)
            requirementIds.push(id)
            await db.insert(businessRequirementsTable).values({
                id, businessId, title: requirementIndex === 0 ? "Branded takeaway meal boxes" : "Compostable coffee cups",
                packagingUse: requirementIndex === 0 ? "takeaway" : "coffee",
                packagingType: requirementIndex === 0 ? "boxes" : "cups",
                quantity: requirementIndex === 0 ? "10,000 units" : "25,000 units",
                size: requirementIndex === 0 ? "180 x 120 x 55 mm" : "12 oz, 90 mm rim",
                material: requirementIndex === 0 ? "350 GSM kraft board, E-flute, aqueous coating" : "320 GSM PE-coated paperboard, food-safe barrier",
                brandingNeeded: true, deliveryLocation: `${businesses[index]!.city}, ${businesses[index]!.state}`,
                requiredByDate: "Within 30 days", rawDescription: "Please share print proof, MOQ, lead time and delivered INR pricing.",
                status: statuses[index === 0 ? requirementIndex : (index * 2 + requirementIndex) % statuses.length]!,
            }).onConflictDoNothing()
            for (let quoteIndex = 0; quoteIndex < 2; quoteIndex++) {
                const vendor = manufacturers[(index + quoteIndex) % manufacturers.length]!
                const quoteId = seedUuid(`quote:${index}:${requirementIndex}:${quoteIndex}`)
                quotationIds.push(quoteId)
                const quoteStatus = (quoteIndex === 0
                    ? ["accepted", "accepted", "rejected", "expired", "withdrawn", "accepted", "accepted", "accepted", "accepted", "accepted"][index * 2 + requirementIndex]
                    : "pending") as "pending" | "accepted" | "rejected" | "expired" | "withdrawn"
                await db.insert(vendorQuotationsTable).values({
                    id: quoteId, quoteNumber: `SEED-Q-${index}${requirementIndex}${quoteIndex}`, requirementId: id,
                    vendorId: profileIds.get(`manufacturer:${vendor.key}`)!.manufacturerId!, status: quoteStatus,
                    unitPrice: money(4.5 + quoteIndex), totalPrice: money((10000 + requirementIndex * 15000) * (4.5 + quoteIndex)),
                    currency: "INR", quantity: 10000 + requirementIndex * 15000, productionLeadTimeDays: 10,
                    estimatedDeliveryDays: 14, sampleAvailable: true, samplePrice: "250.00", shippingTerms: "vendor_pays",
                    paymentTerms: "advance_50", validUntil: seedDate(quoteStatus === "expired" ? -3 : 20),
                    notes: "Seed quotation with kraft board and food-safe inks.", specs: { gsm: 350, flute: "E", coating: "aqueous" },
                    acceptedAt: quoteStatus === "accepted" ? seedDate(-5) : null,
                }).onConflictDoNothing()
            }
        }
    }
}

async function seedOrdersAndActivity() {
    const acceptedQuotes = await db.select().from(vendorQuotationsTable).where(eq(vendorQuotationsTable.status, "accepted"))
    const statuses = ["placed", "confirmed", "proof_pending", "proof_approved", "in_production", "quality_check", "dispatched", "delivered", "completed", "cancelled"] as const
    for (let index = 0; index < acceptedQuotes.length && index < statuses.length; index++) {
        const quote = acceptedQuotes[index]!
        const requirement = (await db.select().from(businessRequirementsTable).where(eq(businessRequirementsTable.id, quote.requirementId)).limit(1))[0]!
        const businessId = requirement.businessId
        const orderId = seedUuid(`order:${quote.id}`)
        orderIds.push(orderId)
        const status = statuses[index]!
        const total = Number(quote.totalPrice)
        await db.insert(businessOrdersTable).values({
            id: orderId, orderNumber: `SEED-ORD-${String(index + 1).padStart(4, "0")}`, quoteId: quote.id,
            businessId, vendorId: quote.vendorId, status, placedBy: null, currency: "INR", subtotal: money(total),
            taxTotal: "0.00", shippingTotal: "0.00", total: money(total), paymentTerms: quote.paymentTerms,
            shippingAddressLine1: "Seed delivery address", shippingCity: "Mumbai", shippingState: "Maharashtra",
            shippingPincode: "400001", shippingCountry: "India", submittedAt: seedDate(-20),
            deliveredAt: status === "delivered" ? seedDate(-2) : null,
            cancelledAt: status === "cancelled" ? seedDate(-3) : null,
            cancellationRole: status === "cancelled" ? "business" : null,
            cancellationReason: status === "cancelled" ? "Seed cancellation scenario" : null,
        }).onConflictDoNothing()
        await db.insert(businessOrderItemsTable).values({
            id: seedUuid(`order-item:${quote.id}`), orderId, offeringId: offeringIds[index % offeringIds.length]!,
            status: status === "cancelled" ? "cancelled" : status,
            titleSnapshot: "Branded takeaway meal boxes", quantity: quote.quantity, unitOfMeasureSnapshot: "piece",
            unitPriceSnapshot: quote.unitPrice, taxPercentSnapshot: "0", priceIncludesTaxSnapshot: false,
            fulfilmentModeSnapshot: "made_to_order", leadTimeDaysMinSnapshot: 10, leadTimeDaysMaxSnapshot: 14,
            shippingTermsSnapshot: quote.shippingTerms, hsnSacCodeSnapshot: "48191010",
        }).onConflictDoNothing()
        const stages = ["placed", "confirmed", "proof_pending", "proof_approved", "in_production", "quality_check", "dispatched", "delivered", "completed"].slice(0, ["placed", "confirmed", "proof_pending", "proof_approved", "in_production", "quality_check", "dispatched", "delivered", "completed"].indexOf(status) + 1)
            .map((value) => value === "placed" ? "order_confirmed" : value === "proof_pending" || value === "proof_approved" ? "artwork_approved" : value === "quality_check" ? "quality_check_passed" : value === "in_production" ? "in_production" : value === "dispatched" ? "dispatched" : value === "delivered" || value === "completed" ? "delivered" : "order_confirmed") as ("order_confirmed" | "artwork_approved" | "in_production" | "quality_check_passed" | "dispatched" | "delivered")[]
        for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
            await db.insert(orderFulfillmentMilestonesTable).values({
                id: seedUuid(`milestone:${quote.id}:${stageIndex}`), orderId, vendorId: quote.vendorId, status: status,
                stage: stages[stageIndex]!,
                title: stages[stageIndex]!.replace(/_/g, " "), description: "Seed fulfillment milestone",
                completedAt: seedDate(-18 + stageIndex), createdAt: seedDate(-19 + stageIndex),
            }).onConflictDoNothing()
        }
        if (status === "dispatched" || status === "delivered" || status === "completed") {
            await db.insert(orderShipmentsTable).values({
                id: seedUuid(`shipment:${quote.id}`), orderId, vendorId: quote.vendorId, courierPartner: "Delhivery",
                trackingNumber: `SEEDTRK${index + 1000}`, trackingUrl: "https://tracking.example.test/seed",
                packageWeightKg: "18.50", numberOfBoxes: 24, status: status === "delivered" || status === "completed" ? "delivered" : "in_transit",
                dispatchedAt: seedDate(-8), estimatedDeliveryDate: seedDate(status === "delivered" || status === "completed" ? -2 : 4),
                deliveredAt: status === "delivered" || status === "completed" ? seedDate(-2) : null,
            }).onConflictDoNothing()
        }
    }
}

async function seedOtherTables() {
    const businessId = profileIds.get("business:anjali")!.businessId!
    const manufacturerId = profileIds.get("manufacturer:packcraft")!.manufacturerId!
    await db.insert(vendorInquiriesTable).values({
        id: seedUuid("inquiry:one"), vendorId: manufacturerId, businessId, offeringId: offeringIds[0]!,
        subject: "Need food-safe kraft boxes", message: "Please share a sample and delivered price for Pune.",
        quantityRequested: 10000, targetUnitPrice: "5.00", specifications: { gsm: 350, flute: "E" }, status: "in_discussion",
    }).onConflictDoNothing()
    if (orderIds[4]) {
        await db.insert(vendorReviewsTable).values({
            id: seedUuid("review:one"), vendorId: manufacturerId, orderId: orderIds[4]!, businessId,
            overallRating: 5, qualityRating: 5, deliveryRating: 4, communicationRating: 5,
            title: "Consistent print quality", review: "Boxes arrived on time and matched the proof.",
        }).onConflictDoNothing()
        await db.insert(vendorInvoicesTable).values({
            id: seedUuid("invoice:one"), invoiceNumber: "SEED-INV-0001", orderId: orderIds[4]!, vendorId: manufacturerId, businessId,
            subtotal: "45000.00", taxTotal: "8100.00", shippingTotal: "0.00", grandTotal: "53100.00", currency: "INR",
            hsnSacBreakdown: [{ hsnCode: "48191010", taxableAmount: 45000, ratePercent: 18 }], status: "paid",
            dueDate: seedDate(-5), paidAt: seedDate(-2),
        }).onConflictDoNothing()
    }
    await db.insert(vendorPayoutAccountsTable).values({
        id: seedUuid("payout:packcraft"), vendorId: manufacturerId, accountHolderName: "PackCraft Industries",
        accountNumber: "000012345678", ifscCode: "HDFC0001234", bankName: "HDFC Bank", branch: "Noida Sector 18",
        accountType: "current", upiId: "packcraft@hdfcbank", isPrimary: true, isVerified: true,
    }).onConflictDoNothing()
    await db.insert(idempotencyRecordsTable).values({
        id: seedUuid("idempotency:one"), scope: "seed-demo", key: "seed-order-one",
        userId: seedKey("business", "anjali"), requestHash: "seed-request-hash", status: "completed",
        response: { success: true, data: { seeded: true } }, expiresAt: seedDate(30),
    }).onConflictDoNothing()
}

async function seedHiredServices() {
    const businessId = profileIds.get("business:anjali")!.businessId!
    const designerMeera = profileIds.get("designer:meera")!.designerId!
    const designerKabir = profileIds.get("designer:kabir")!.designerId!
    const designerRiya = profileIds.get("designer:riya")!.designerId!
    const designerDev = profileIds.get("designer:dev")!.designerId!

    const anjaliUser = (await db.select({ id: user.id }).from(user).where(eq(user.email, seedKey("business", "anjali"))).limit(1))[0]?.id || seedUuid("business:anjali")
    const meeraUser = (await db.select({ id: user.id }).from(user).where(eq(user.email, seedKey("designer", "meera"))).limit(1))[0]?.id || seedUuid("designer:meera")
    const kabirUser = (await db.select({ id: user.id }).from(user).where(eq(user.email, seedKey("designer", "kabir"))).limit(1))[0]?.id || seedUuid("designer:kabir")
    const riyaUser = (await db.select({ id: user.id }).from(user).where(eq(user.email, seedKey("designer", "riya"))).limit(1))[0]?.id || seedUuid("designer:riya")
    const devUser = (await db.select({ id: user.id }).from(user).where(eq(user.email, seedKey("designer", "dev"))).limit(1))[0]?.id || seedUuid("designer:dev")

    const pizzaGig = serviceMap.get("custom-foldable-pizza-calzone-box-design")
    const cupGig = serviceMap.get("specialty-cafe-hot-cold-paper-cup-branding-set")
    const sauceGig = serviceMap.get("artisanal-gourmet-sauce-pickle-jam-jar-label-suite")
    const burgerGig = serviceMap.get("eco-friendly-corrugated-burger-meal-box-design")
    const bevgGig = serviceMap.get("complete-beverage-bar-identity-packaging-suite")
    const fssaiGig = serviceMap.get("fssai-compliant-nutrition-ingredients-label")
    const mailerGig = serviceMap.get("heavy-duty-ecommerce-corrugated-mailer-boxes")
    const mithaiGig = serviceMap.get("artisanal-dessert-mithai-rigid-gift-box-system")

    const sampleBrief = {
        packagingType: "boxes",
        dimensions: "12 x 12 x 2 inches",
        material: "350 GSM Kraft Board, E-flute",
        dielineStatus: "need_designer",
        brandName: "Crust & Craft Artisanal Pizza",
        tagline: "Slow-fermented sourdough pizza from Mumbai",
        brandColors: "Terracotta Red (#C84B31), Cream (#F8F1F1), Dark Charcoal (#2D4263)",
        brandFonts: "Playfair Display for headings, Inter for body copy",
        targetAudience: "Urban food lovers and gourmet takeaway diners aged 22-45",
        referenceLinks: "https://example.test/inspiration-board",
        requiredFormats: "Vector AI, 300 DPI CMYK PDF with distinct cut/crease layers",
        deadline: "Need by end of next week for inaugural packaging run",
        notes: "Please include side ventilation slots to keep the crust crispy during delivery.",
    }

    // 1. REQUESTED ORDER (New order awaiting designer acceptance)
    if (pizzaGig) {
        const orderId = seedUuid("hired:requested")
        await db.insert(businessHiredServiceTable).values({
            id: orderId,
            businessId,
            serviceId: pizzaGig.id,
            designerId: designerMeera,
            serviceTitle: pizzaGig.title,
            designerName: "Meera Iyer",
            designerEmail: seedKey("designer", "meera"),
            price: money(6000),
            pricingModel: "per_project",
            turnaroundDays: 4,
            status: "requested",
            packageName: "Standard Pizza Box Dieline + Print Art",
            packageTier: "basic",
            deliveryDays: 4,
            revisionsIncluded: 3,
            revisionsUsed: 0,
            extras: [],
            brief: sampleBrief,
            dueAt: null,
            hiredAt: seedDate(-1),
        }).onConflictDoNothing()

        await db.insert(hiredServiceEventsTable).values({
            id: seedUuid("event:req:1"),
            orderId,
            actorRole: "business",
            actorUserId: anjaliUser,
            status: "requested",
            note: "Design brief submitted and order placed",
            createdAt: seedDate(-1),
        }).onConflictDoNothing()

        await db.insert(hiredServiceMessagesTable).values({
            id: seedUuid("msg:req:1"),
            orderId,
            senderId: anjaliUser,
            body: "Hi Meera! We are thrilled to kick off this project. Please review our pizza box brief and let us know if you need any additional sample dimensions.",
            attachments: [],
            createdAt: seedDate(-1),
        }).onConflictDoNothing()
    }

    // 2. ACTIVE ORDER (Designer accepted, work in progress)
    if (cupGig) {
        const orderId = seedUuid("hired:active")
        await db.insert(businessHiredServiceTable).values({
            id: orderId,
            businessId,
            serviceId: cupGig.id,
            designerId: designerKabir,
            serviceTitle: cupGig.title,
            designerName: "Kabir Sethi",
            designerEmail: seedKey("designer", "kabir"),
            price: money(7500),
            pricingModel: "per_project",
            turnaroundDays: 5,
            status: "active",
            packageName: "Standard Cafe Duo (8oz Hot + 16oz Cold)",
            packageTier: "standard",
            deliveryDays: 5,
            revisionsIncluded: 4,
            revisionsUsed: 0,
            extras: [],
            brief: {
                ...sampleBrief,
                packagingType: "cups",
                brandName: "Bean & Leaf Coffee Roasters",
                tagline: "Single origin specialty coffee",
            },
            dueAt: seedDate(4),
            hiredAt: seedDate(-3),
        }).onConflictDoNothing()

        await db.insert(hiredServiceEventsTable).values([
            {
                id: seedUuid("event:act:1"),
                orderId,
                actorRole: "business",
                actorUserId: anjaliUser,
                status: "requested",
                note: "Order placed by business",
                createdAt: seedDate(-3),
            },
            {
                id: seedUuid("event:act:2"),
                orderId,
                actorRole: "designer",
                actorUserId: kabirUser,
                status: "active",
                note: "Designer accepted project request. Delivery countdown started.",
                createdAt: seedDate(-2),
            },
        ]).onConflictDoNothing()

        await db.insert(hiredServiceMessagesTable).values([
            {
                id: seedUuid("msg:act:1"),
                orderId,
                senderId: kabirUser,
                body: "Order confirmed! I have begun calculating the conic curves for your 8oz and 16oz cups so the logo remains undistorted.",
                attachments: [],
                createdAt: seedDate(-2),
            },
            {
                id: seedUuid("msg:act:2"),
                orderId,
                senderId: anjaliUser,
                body: "Awesome, excited to see the curvature proofs!",
                attachments: [],
                createdAt: seedDate(-1),
            },
        ]).onConflictDoNothing()
    }

    // 3. DELIVERED ORDER (Designer submitted delivery, awaiting client review)
    if (sauceGig) {
        const orderId = seedUuid("hired:delivered")
        await db.insert(businessHiredServiceTable).values({
            id: orderId,
            businessId,
            serviceId: sauceGig.id,
            designerId: designerRiya,
            serviceTitle: sauceGig.title,
            designerName: "Riya Bose",
            designerEmail: seedKey("designer", "riya"),
            price: money(9500),
            pricingModel: "per_project",
            turnaroundDays: 6,
            status: "delivered",
            packageName: "Flavor Trio Label Collection (3 SKUs)",
            packageTier: "standard",
            deliveryDays: 6,
            revisionsIncluded: 4,
            revisionsUsed: 0,
            extras: [],
            brief: {
                ...sampleBrief,
                packagingType: "labels-stickers",
                brandName: "Himalayan Harvest Pantry",
                tagline: "Stone-ground hot sauces & pickles",
            },
            dueAt: seedDate(2),
            hiredAt: seedDate(-5),
        }).onConflictDoNothing()

        await db.insert(hiredServiceDeliveriesTable).values({
            id: seedUuid("delivery:sauce:v1"),
            orderId,
            versionNumber: 1,
            designerNote: "Hi Anjali! I have prepared the labels for Garlic Chilli, Smoked Tomato, and Mountain Mustard. Color profiles are CMYK with 3mm bleed and distinct FSSAI compliant nutrition panels.",
            files: [
                "https://example.test/files/sauce-trio-proof.pdf",
                "https://example.test/files/sauce-trio-source.ai",
                "https://example.test/files/label-specs.pdf",
            ],
            previewUrl: "https://example.test/files/sauce-trio-proof.pdf",
            createdAt: seedDate(-1),
        }).onConflictDoNothing()

        await db.insert(hiredServiceEventsTable).values({
            id: seedUuid("event:del:1"),
            orderId,
            actorRole: "designer",
            actorUserId: riyaUser,
            status: "delivered",
            note: "Version 1 delivered for client review",
            createdAt: seedDate(-1),
        }).onConflictDoNothing()

        await db.insert(hiredServiceMessagesTable).values({
            id: seedUuid("msg:del:1"),
            orderId,
            senderId: riyaUser,
            body: "Delivery is submitted! Please check the Deliveries tab to review the proofs and let me know if you would like any color tweaks.",
            attachments: [],
            createdAt: seedDate(-1),
        }).onConflictDoNothing()
    }

    // 4. REVISION REQUESTED ORDER (Client requested adjustments, revision counter > 0)
    if (burgerGig) {
        const orderId = seedUuid("hired:revision")
        await db.insert(businessHiredServiceTable).values({
            id: orderId,
            businessId,
            serviceId: burgerGig.id,
            designerId: designerMeera,
            serviceTitle: burgerGig.title,
            designerName: "Meera Iyer",
            designerEmail: seedKey("designer", "meera"),
            price: money(8500),
            pricingModel: "per_project",
            turnaroundDays: 5,
            status: "revision_requested",
            packageName: "Complete Meal Box & Liner Set",
            packageTier: "standard",
            deliveryDays: 5,
            revisionsIncluded: 4,
            revisionsUsed: 1, // Counter > 0
            extras: [],
            brief: {
                ...sampleBrief,
                brandName: "Urban Bun Artisanal Burgers",
            },
            dueAt: seedDate(1),
            hiredAt: seedDate(-6),
        }).onConflictDoNothing()

        await db.insert(hiredServiceDeliveriesTable).values({
            id: seedUuid("delivery:burger:v1"),
            orderId,
            versionNumber: 1,
            designerNote: "Initial die-cut vector dieline and top-lid branding artwork.",
            files: ["https://example.test/files/urban-bun-v1.pdf"],
            previewUrl: "https://example.test/files/urban-bun-v1.pdf",
            createdAt: seedDate(-3),
        }).onConflictDoNothing()

        await db.insert(hiredServiceEventsTable).values([
            {
                id: seedUuid("event:rev:1"),
                orderId,
                actorRole: "designer",
                actorUserId: meeraUser,
                status: "delivered",
                note: "Version 1 delivered",
                createdAt: seedDate(-3),
            },
            {
                id: seedUuid("event:rev:2"),
                orderId,
                actorRole: "business",
                actorUserId: anjaliUser,
                status: "revision_requested",
                note: "Business requested revisions: Increase logo scale by 15% and switch top lid color to deep forest green.",
                createdAt: seedDate(-1),
            },
        ]).onConflictDoNothing()

        await db.insert(hiredServiceMessagesTable).values([
            {
                id: seedUuid("msg:rev:1"),
                orderId,
                senderId: anjaliUser,
                body: "Hi Meera, the box structure is fantastic! Could we please increase the logo by 15% and test a deep forest green for the lid?",
                attachments: [],
                createdAt: seedDate(-1),
            },
            {
                id: seedUuid("msg:rev:2"),
                orderId,
                senderId: meeraUser,
                body: "Absolutely Anjali! Forest green will look gorgeous on unbleached kraft. I will have V2 ready by tomorrow.",
                attachments: [],
                createdAt: seedDate(0, 9),
            },
        ]).onConflictDoNothing()
    }

    // 5. COMPLETED ORDER 1 (With review & designer reply)
    if (bevgGig) {
        const orderId = seedUuid("hired:completed1")
        await db.insert(businessHiredServiceTable).values({
            id: orderId,
            businessId,
            serviceId: bevgGig.id,
            designerId: designerKabir,
            serviceTitle: bevgGig.title,
            designerName: "Kabir Sethi",
            designerEmail: seedKey("designer", "kabir"),
            price: money(16000),
            pricingModel: "per_project",
            turnaroundDays: 8,
            status: "completed",
            packageName: "Retail Bottled & Cafe Suite",
            packageTier: "standard",
            deliveryDays: 8,
            revisionsIncluded: 5,
            revisionsUsed: 1,
            extras: [],
            brief: {
                ...sampleBrief,
                brandName: "Bean & Leaf Signature Blends",
            },
            dueAt: seedDate(-3),
            hiredAt: seedDate(-15),
            completedAt: seedDate(-4),
        }).onConflictDoNothing()

        await db.insert(hiredServiceDeliveriesTable).values([
            {
                id: seedUuid("delivery:bevg:v1"),
                orderId,
                versionNumber: 1,
                designerNote: "Initial concept exploration.",
                files: ["https://example.test/files/bevg-v1.pdf"],
                previewUrl: "https://example.test/files/bevg-v1.pdf",
                createdAt: seedDate(-9),
            },
            {
                id: seedUuid("delivery:bevg:v2"),
                orderId,
                versionNumber: 2,
                designerNote: "Final approved vector package containing 3 cup sizes, cold brew glass bottle wrap, and kraft carry bag dieline.",
                files: [
                    "https://example.test/files/bean-and-leaf-final.zip",
                    "https://example.test/files/print-specs.pdf",
                ],
                previewUrl: "https://example.test/files/print-specs.pdf",
                createdAt: seedDate(-5),
            },
        ]).onConflictDoNothing()

        await db.insert(hiredServiceEventsTable).values({
            id: seedUuid("event:comp1:1"),
            orderId,
            actorRole: "business",
            actorUserId: anjaliUser,
            status: "completed",
            note: "Delivery accepted and order marked completed by business",
            createdAt: seedDate(-4),
        }).onConflictDoNothing()

        // 5-star Review with designer reply
        await db.insert(designerReviewsTable).values({
            id: seedUuid("review:bevg:1"),
            orderId,
            serviceId: bevgGig.id,
            designerId: designerKabir,
            businessId,
            rating: 5,
            qualityRating: 5,
            communicationRating: 5,
            asDescribedRating: 5,
            text: "Kabir exceeded all our expectations! The curved cup geometries printed with zero distortion and our glass bottle sleeves look straight out of an international design catalog.",
            designerReply: "Thank you Anjali! It was an absolute delight bringing Bean & Leaf to life. Best wishes for the cafe launch!",
            designerRepliedAt: seedDate(-3),
            createdAt: seedDate(-4),
        }).onConflictDoNothing()
    }

    // 6. COMPLETED ORDER 2 (Second completed order with review)
    if (fssaiGig) {
        const orderId = seedUuid("hired:completed2")
        await db.insert(businessHiredServiceTable).values({
            id: orderId,
            businessId,
            serviceId: fssaiGig.id,
            designerId: designerRiya,
            serviceTitle: fssaiGig.title,
            designerName: "Riya Bose",
            designerEmail: seedKey("designer", "riya"),
            price: money(3000),
            pricingModel: "per_project",
            turnaroundDays: 2,
            status: "completed",
            packageName: "Standard FSSAI Nutrition Grid",
            packageTier: "basic",
            deliveryDays: 2,
            revisionsIncluded: 2,
            revisionsUsed: 0,
            extras: [],
            brief: {
                ...sampleBrief,
                brandName: "Pantry Fresh Organic Spices",
            },
            dueAt: seedDate(-10),
            hiredAt: seedDate(-14),
            completedAt: seedDate(-11),
        }).onConflictDoNothing()

        await db.insert(hiredServiceDeliveriesTable).values({
            id: seedUuid("delivery:fssai:v1"),
            orderId,
            versionNumber: 1,
            designerNote: "Verified RDA calculations, quiet zones, and barcode rendering.",
            files: [
                "https://example.test/files/fssai-master.pdf",
                "https://example.test/files/fssai-source.ai",
            ],
            previewUrl: "https://example.test/files/fssai-master.pdf",
            createdAt: seedDate(-12),
        }).onConflictDoNothing()

        // 5-star review
        await db.insert(designerReviewsTable).values({
            id: seedUuid("review:fssai:1"),
            orderId,
            serviceId: fssaiGig.id,
            designerId: designerRiya,
            businessId,
            rating: 5,
            qualityRating: 5,
            communicationRating: 5,
            asDescribedRating: 5,
            text: "Lightning-fast delivery and thoroughly accurate regulatory details. The print facility approved the artwork on the first inspection.",
            designerReply: "Wonderful to hear! Always happy to help with food regulatory packaging.",
            designerRepliedAt: seedDate(-9),
            createdAt: seedDate(-10),
        }).onConflictDoNothing()
    }

    // 7. LATE ORDER (Active with due_at in the past)
    if (mailerGig) {
        const orderId = seedUuid("hired:late")
        await db.insert(businessHiredServiceTable).values({
            id: orderId,
            businessId,
            serviceId: mailerGig.id,
            designerId: designerDev,
            serviceTitle: mailerGig.title,
            designerName: "Dev Malhotra",
            designerEmail: seedKey("designer", "dev"),
            price: money(10000),
            pricingModel: "per_project",
            turnaroundDays: 6,
            status: "active",
            packageName: "Mailer Box + Outer & Inner Print Graphics",
            packageTier: "standard",
            deliveryDays: 6,
            revisionsIncluded: 4,
            revisionsUsed: 0,
            extras: [],
            brief: {
                ...sampleBrief,
                packagingType: "corrugated-boxes",
                brandName: "Heritage Gourmet Hampers",
            },
            dueAt: seedDate(-2), // 2 days in the past -> LATE!
            hiredAt: seedDate(-9),
        }).onConflictDoNothing()

        await db.insert(hiredServiceEventsTable).values({
            id: seedUuid("event:late:1"),
            orderId,
            actorRole: "designer",
            actorUserId: devUser,
            status: "active",
            note: "Designer accepted project request",
            createdAt: seedDate(-8),
        }).onConflictDoNothing()

        await db.insert(hiredServiceMessagesTable).values([
            {
                id: seedUuid("msg:late:1"),
                orderId,
                senderId: anjaliUser,
                body: "Hi Dev, checking in on the inner print artwork. How is the dieline coming along?",
                attachments: [],
                createdAt: seedDate(-2),
            },
            {
                id: seedUuid("msg:late:2"),
                orderId,
                senderId: devUser,
                body: "Apologies for the slight delay Anjali! I had to re-run the corrugated fold tolerance tests for B-flute. Finishing up the vector files now and will upload tonight.",
                attachments: [],
                createdAt: seedDate(-1),
            },
        ]).onConflictDoNothing()
    }

    // 8. DECLINED ORDER (Designer declined with reason)
    if (mithaiGig) {
        const orderId = seedUuid("hired:declined")
        await db.insert(businessHiredServiceTable).values({
            id: orderId,
            businessId,
            serviceId: mithaiGig.id,
            designerId: designerMeera,
            serviceTitle: mithaiGig.title,
            designerName: "Meera Iyer",
            designerEmail: seedKey("designer", "meera"),
            price: money(14000),
            pricingModel: "per_project",
            turnaroundDays: 7,
            status: "declined",
            packageName: "Two-Tier Gift Box with Sleeve",
            packageTier: "standard",
            deliveryDays: 7,
            revisionsIncluded: 4,
            revisionsUsed: 0,
            extras: [],
            brief: {
                ...sampleBrief,
                brandName: "Royal Jaipur Confectionery",
            },
            cancelReason: "Currently at peak capacity for custom rigid boxes this month. Please reach out again in two weeks!",
            dueAt: null,
            hiredAt: seedDate(-4),
        }).onConflictDoNothing()

        await db.insert(hiredServiceEventsTable).values({
            id: seedUuid("event:dec:1"),
            orderId,
            actorRole: "designer",
            actorUserId: meeraUser,
            status: "declined",
            note: "Order declined by designer: Currently at peak capacity for custom rigid boxes this month.",
            createdAt: seedDate(-3),
        }).onConflictDoNothing()
    }

    // 9. SEED SAVED GIGS (for business Anjali)
    if (burgerGig) {
        await db.insert(businessSavedServicesTable).values({
            id: seedUuid("saved:burger"),
            businessId,
            serviceId: burgerGig.id,
            createdAt: seedDate(-5),
        }).onConflictDoNothing()
    }
    if (sauceGig) {
        await db.insert(businessSavedServicesTable).values({
            id: seedUuid("saved:sauce"),
            businessId,
            serviceId: sauceGig.id,
            createdAt: seedDate(-4),
        }).onConflictDoNothing()
    }
}

async function seedEmbeddings() {
    if (skipEmbeddings) return
    if (!process.env.MISTRAL_API_KEY) {
        console.log("Skipping embeddings: MISTRAL_API_KEY is not configured.")
        return
    }
    const [requirements, offerings, services] = await Promise.all([
        db.select().from(businessRequirementsTable),
        db.select().from(offeringsTable).where(and(eq(offeringsTable.status, "active"), sql`${offeringsTable.validUntil} > now()`, sql`${offeringsTable.deletedAt} IS NULL`)),
        db.select().from(designerServiceTable).where(eq(designerServiceTable.status, "published")),
    ])
    for (const item of requirements) await syncEntityEmbeddings({ entityType: "requirement", entityId: item.id, ownerId: item.businessId, title: item.title, fullText: buildRequirementTemplate(item), visibilityScope: "private", metadata: { status: item.status } })
    for (const item of offerings) await syncEntityEmbeddings({ entityType: "offer", entityId: item.id, ownerId: item.vendorId, title: item.title, fullText: buildOfferingTemplate(item), visibilityScope: "public", metadata: { status: item.status } })
    for (const item of services) await syncEntityEmbeddings({ entityType: "gig", entityId: item.id, ownerId: item.designerId, title: item.title, fullText: buildGigTemplate(item), visibilityScope: "public", metadata: { status: item.status } })
}

async function resetSeedData() {
    const seedUsers = await db.select({ id: user.id }).from(user).where(sql`${user.email} LIKE '%@seed.unifiee.test'`)
    const userIds = seedUsers.map((row) => row.id)
    if (!userIds.length) return
    const businesses = await db.select({ id: business.id }).from(business).where(inArray(business.userId, userIds))
    const manufacturers = await db.select({ id: manufacturerTable.id }).from(manufacturerTable).where(inArray(manufacturerTable.userId, userIds))
    const designers = await db.select({ id: packagingDesignerTable.id }).from(packagingDesignerTable).where(inArray(packagingDesignerTable.userId, userIds))
    const businessIds = businesses.map((row) => row.id)
    const manufacturerIds = manufacturers.map((row) => row.id)
    const designerIds = designers.map((row) => row.id)

    await db.delete(aiDocumentsTable).where(sql`${aiDocumentsTable.ownerId} IN (SELECT id::text FROM business WHERE user_id = ANY(${userIds})) OR ${aiDocumentsTable.ownerId} IN (SELECT id::text FROM manufacturer WHERE user_id = ANY(${userIds})) OR ${aiDocumentsTable.ownerId} = ANY(${userIds})`)
    if (businessIds.length) await db.delete(businessSavedServicesTable).where(inArray(businessSavedServicesTable.businessId, businessIds))
    if (designerIds.length) await db.delete(designerReviewsTable).where(inArray(designerReviewsTable.designerId, designerIds))
    if (businessIds.length) await db.delete(designerReviewsTable).where(inArray(designerReviewsTable.businessId, businessIds))
    if (businessIds.length) await db.delete(vendorReviewsTable).where(inArray(vendorReviewsTable.businessId, businessIds))
    if (manufacturerIds.length) await db.delete(vendorPayoutAccountsTable).where(inArray(vendorPayoutAccountsTable.vendorId, manufacturerIds))
    if (businessIds.length) await db.delete(vendorInvoicesTable).where(inArray(vendorInvoicesTable.businessId, businessIds))
    if (businessIds.length) await db.delete(vendorInquiriesTable).where(inArray(vendorInquiriesTable.businessId, businessIds))
    if (manufacturerIds.length) await db.delete(vendorInquiriesTable).where(inArray(vendorInquiriesTable.vendorId, manufacturerIds))
    if (businessIds.length) await db.delete(businessHiredServiceTable).where(inArray(businessHiredServiceTable.businessId, businessIds))
    if (designerIds.length) await db.delete(businessHiredServiceTable).where(inArray(businessHiredServiceTable.designerId, designerIds))
    if (businessIds.length) await db.delete(businessRequirementsTable).where(inArray(businessRequirementsTable.businessId, businessIds))
    if (manufacturerIds.length) {
        await db.delete(offeringsTable).where(inArray(offeringsTable.vendorId, manufacturerIds))
        await db.delete(vendorQuotationsTable).where(inArray(vendorQuotationsTable.vendorId, manufacturerIds))
        await db.delete(vendorFacilitiesTable).where(inArray(vendorFacilitiesTable.vendorId, manufacturerIds))
        await db.delete(orderFulfillmentMilestonesTable).where(inArray(orderFulfillmentMilestonesTable.vendorId, manufacturerIds))
        await db.delete(orderShipmentsTable).where(inArray(orderShipmentsTable.vendorId, manufacturerIds))
        await db.delete(vendorReviewsTable).where(inArray(vendorReviewsTable.vendorId, manufacturerIds))
    }
    if (businessIds.length) await db.delete(businessOrdersTable).where(inArray(businessOrdersTable.businessId, businessIds))
    if (designerIds.length) await db.delete(designerServiceTable).where(inArray(designerServiceTable.designerId, designerIds))
    if (manufacturerIds.length) await db.delete(manufacturerTable).where(inArray(manufacturerTable.id, manufacturerIds))
    if (designerIds.length) await db.delete(packagingDesignerTable).where(inArray(packagingDesignerTable.id, designerIds))
    if (businessIds.length) await db.delete(business).where(inArray(business.id, businessIds))
    await db.delete(idempotencyRecordsTable).where(inArray(idempotencyRecordsTable.userId, userIds))
    await db.delete(account).where(inArray(account.userId, userIds))
    await db.delete(user).where(inArray(user.id, userIds))
}

async function main() {
    assertSafeEnvironment()
    if (reset) {
        await resetSeedData()
        console.log("Seed data reset complete.")
        return
    }
    await seedCatalog()
    await createAccounts()
    await seedDesignerServices()
    await seedOfferings()
    await seedRequirementsAndQuotes()
    await seedOrdersAndActivity()
    await seedHiredServices()
    await seedOtherTables()
    await seedEmbeddings()
    console.log("Seed complete. Run `npm run db:verify` to validate counts and relationships.")
}

main()
    .catch((error) => {
        console.error("Seed failed:", error)
        process.exitCode = 1
    })
    .finally(async () => {
        await db.$client.end()
    })
