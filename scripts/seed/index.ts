import { config } from "dotenv"
config({ path: ".env.local" })

import { db } from "../../src/lib/db"
import { account, user } from "../../src/lib/db/schema/auth-schema"
import { business } from "../../src/lib/db/schema/business"
import { businessHiredServiceTable } from "../../src/lib/db/schema/business-hired-service"
import { businessOrderItemsTable, businessOrdersTable } from "../../src/lib/db/schema/business-order"
import { businessRequirementsTable } from "../../src/lib/db/schema/business-requirement"
import { designerServiceTable } from "../../src/lib/db/schema/designer-service"
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
            portfolioImages: [`/seed/designers/${item.key}-portfolio.svg`],
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
}

async function seedDesignerServices() {
    for (const item of seedDesigners.filter((designer) => !designer.empty)) {
        const designerId = profileIds.get(`designer:${item.key}`)!.designerId!
        const services = [
            ["Dieline & Structural Packaging", "dieline", "per_project", 14500],
            ["Label Artwork System", "label_art", "per_design", 6500],
            ["3D Packaging Mockup", "3d_mockup", "per_project", 9000],
        ] as const
        for (const [slug, type, pricingModel, price] of services) {
            const id = seedUuid(`service:${item.key}:${type}`)
            serviceIds.push(id)
            await db.insert(designerServiceTable).values({
                id, designerId, title: `${slug} - ${item.name.split(" ")[0]}`,
                description: `Production-ready ${type.replace("_", " ")} for food and beverage brands, including print-ready source files.`,
                serviceType: type, pricingModel, price: money(price), turnaroundDays: type === "label_art" ? 4 : 7,
                revisionsIncluded: 3, deliverables: ["Print-ready PDF", "Editable source file", "Mockup preview"],
                sampleImages: [`/seed/designers/${item.key}-${type}.svg`], status: "active",
            }).onConflictDoNothing()
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
    const designer = profileIds.get("designer:meera")!.designerId!
    const statuses = ["active", "in_review", "completed"] as const
    for (let index = 0; index < statuses.length; index++) {
        const serviceId = serviceIds[index]!
        await db.insert(businessHiredServiceTable).values({
            id: seedUuid(`hired:${index}`), businessId, serviceId, designerId: designer,
            serviceTitle: ["Dieline & Structural Packaging", "Label Artwork System", "3D Packaging Mockup"][index]!,
            designerName: "Meera Iyer", designerEmail: seedKey("designer", "meera"), price: money(6500 + index * 4000),
            pricingModel: index === 1 ? "per_design" : "per_project", turnaroundDays: 7, sampleImage: `/seed/designers/meera-service-${index}.svg`,
            notes: "Seed hired service", status: statuses[index]!, hiredAt: seedDate(-20),
            completedAt: statuses[index] === "completed" ? seedDate(-5) : null,
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
        db.select().from(designerServiceTable).where(eq(designerServiceTable.status, "active")),
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
