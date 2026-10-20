import { create } from "zustand"
import { persist } from "zustand/middleware"

export type OfferingCategory =
    | "paper_cup"
    | "pizza_box"
    | "corrugated_box"
    | "food_container"
    | "pouch"
    | "paper_bag"
    | "cutlery"

export type OfferingUnit =
    | "piece"
    | "pack"
    | "carton"
    | "kg"
    | "litre"
    | "roll"
    | "set"

export type OfferingStatus = "active" | "draft" | "paused" | "archived"

export type FulfilmentMode = "made_to_order" | "ready_stock" | "service"

export type ShippingTerms = "vendor_pays" | "buyer_pays" | "included" | "pickup_only"

export type PaymentTerms =
    | "advance_100"
    | "advance_50"
    | "on_delivery"
    | "net_15"
    | "net_30"

export interface PriceTier {
    id: string
    minQuantity: number
    maxQuantity?: number
    unitPrice: number
}

export interface VendorOffering {
    id: string
    title: string
    sku: string
    category: OfferingCategory
    description: string
    unitOfMeasure: OfferingUnit
    unitPrice: number
    currency: string
    taxPercent: number
    priceIncludesTax: boolean
    minOrderQuantity: number
    maxOrderQuantity?: number
    quantityStep: number
    stockAvailable?: number
    fulfilmentMode: FulfilmentMode
    leadTimeDaysMin: number
    leadTimeDaysMax: number
    shippingTerms: ShippingTerms
    shippingCostNote?: string
    city: string
    state: string
    pincode: string
    sampleAvailable: boolean
    samplePrice?: number
    validFrom: string
    validUntil: string
    status: OfferingStatus
    images: string[]
    attributes: {
        material?: string
        gsm?: number
        size?: string
        wallType?: string
        fluteType?: string
        foodSafeCertified?: boolean
        certifications?: string[]
        customizationAvailable?: boolean
        printType?: string
        recyclable?: boolean
        compostable?: boolean
        packsPerCarton?: number
        packSize?: number
        [key: string]: unknown
    }
    priceTiers: PriceTier[]
    viewsCount: number
    ordersCount: number
    createdAt: string
    updatedAt: string
}

export type OrderStage =
    | "order_confirmed"
    | "artwork_approved"
    | "tooling_and_plates_ready"
    | "raw_material_sourced"
    | "in_production"
    | "quality_check_passed"
    | "packed"
    | "dispatched"
    | "delivered"
    | "cancelled"

export interface FulfillmentMilestone {
    id: string
    stage: OrderStage
    stageSequence: number
    title: string
    description: string
    isCompleted: boolean
    completedAt?: string
}

export interface ShipmentDetails {
    courierPartner: string
    trackingNumber: string
    trackingUrl?: string
    packageWeightKg?: number
    numberOfBoxes: number
    dispatchedAt: string
    estimatedDeliveryDate?: string
    status: "label_created" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered"
}

export interface VendorOrderItem {
    id: string
    offeringId?: string
    title: string
    category: OfferingCategory
    quantity: number
    unitOfMeasure: OfferingUnit
    unitPrice: number
    total: number
    specifications: Record<string, string>
    imageUrl?: string
}

export interface VendorOrder {
    id: string
    orderNumber: string
    businessId: string
    businessName: string
    contactEmail: string
    contactPhone: string
    shippingAddress: {
        line1: string
        line2?: string
        city: string
        state: string
        pincode: string
    }
    status: "submitted" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
    currency: string
    subtotal: number
    taxTotal: number
    shippingTotal: number
    total: number
    paymentTerms: PaymentTerms
    paymentStatus: "Escrow Secured" | "Settled" | "Partially Released" | "Pending"
    items: VendorOrderItem[]
    milestones: FulfillmentMilestone[]
    shipment?: ShipmentDetails
    submittedAt: string
    confirmedAt?: string
    deliveredAt?: string
    notes?: string
}

export interface VendorQuotation {
    id: string
    quoteNumber: string
    requirementId: string
    requirementTitle: string
    businessName: string
    packagingCategory: OfferingCategory
    quantityRequested: number
    baseUnitPrice: number
    taxPercent: number
    toolingOrDieCost: number
    plateCharge: number
    sampleAvailable: boolean
    samplePrice?: number
    sampleLeadTimeDays?: number
    productionLeadTimeDaysMin: number
    productionLeadTimeDaysMax: number
    estimatedDeliveryDays: number
    shippingTerms: ShippingTerms
    paymentTerms: PaymentTerms
    validUntil: string
    status: "draft" | "submitted" | "under_review" | "accepted" | "rejected"
    notes?: string
    createdAt: string
}

export interface PayoutTransaction {
    id: string
    referenceNumber: string
    orderNumber: string
    amount: number
    payoutMethod: "NEFT / RTGS" | "Instant IMPS" | "UPI Business"
    accountEnding: string
    date: string
    status: "settled" | "processing" | "scheduled"
}

export interface VendorFacilityProfile {
    facilityName: string
    factoryAreaSqFt: number
    dailyCapacityUnits: number
    monthlyCapacityUnits: number
    currentUtilizationPercent: number
    shiftCount: number
    operatingSinceYear: number
    gstin: string
    printingProcesses: string[]
    maxPrintColors: number
    certifications: Array<{
        name: string
        status: "verified" | "under_review" | "declared"
        docRef?: string
    }>
    machineryCapabilities: Array<{
        name: string
        quantity: number
        speedPerHour: string
    }>
    qualityTestingMethods: string[]
    address: string
    city: string
    state: string
    pincode: string
}

export const INITIAL_MILESTONES: Omit<FulfillmentMilestone, "id">[] = [
    {
        stage: "order_confirmed",
        stageSequence: 1,
        title: "Order Confirmed",
        description: "Commercials and specs accepted by manufacturer.",
        isCompleted: true,
        completedAt: "2026-10-14T09:30:00Z",
    },
    {
        stage: "artwork_approved",
        stageSequence: 2,
        title: "Artwork & Pre-Press Approved",
        description: "Vector proof validated against die-line template.",
        isCompleted: true,
        completedAt: "2026-10-15T14:20:00Z",
    },
    {
        stage: "tooling_and_plates_ready",
        stageSequence: 3,
        title: "Tooling & Flexo Plates Ready",
        description: "Photopolymer printing plates & cutting dies mounted.",
        isCompleted: true,
        completedAt: "2026-10-16T11:00:00Z",
    },
    {
        stage: "raw_material_sourced",
        stageSequence: 4,
        title: "Raw Material Sourced",
        description: "ITC Virgin Food-Grade Board allocated from inventory.",
        isCompleted: true,
        completedAt: "2026-10-17T16:45:00Z",
    },
    {
        stage: "in_production",
        stageSequence: 5,
        title: "In High-Speed Production",
        description: "Forming, ultrasonic side-sealing, and rim curling in run.",
        isCompleted: false,
    },
    {
        stage: "quality_check_passed",
        stageSequence: 6,
        title: "Quality Check & Leak Testing",
        description: "Drop test, Cobb test, and hot oil seepage test.",
        isCompleted: false,
    },
    {
        stage: "packed",
        stageSequence: 7,
        title: "Packed in Corrugated Master Cartons",
        description: "Moisture barrier shrink-wrapped packs of 50 units.",
        isCompleted: false,
    },
    {
        stage: "dispatched",
        stageSequence: 8,
        title: "Dispatched with Logistics Partner",
        description: "Docket generated, courier pickup completed.",
        isCompleted: false,
    },
    {
        stage: "delivered",
        stageSequence: 9,
        title: "Delivered & POD Verified",
        description: "Confirmed delivery at customer warehouse / outlet.",
        isCompleted: false,
    },
]

// ── Mock Initial Offerings ───────────────────────────────────────────────────
const INITIAL_OFFERINGS: VendorOffering[] = [
    {
        id: "OFR-2026-001",
        title: "Custom Printed Ripple Wall Paper Cups (12oz / 350ml)",
        sku: "CUP-RPL-12OZ-01",
        category: "paper_cup",
        description: "Heavy-duty triple layer ripple wall cup engineered for hot beverages. Zero heat transfer to hands without requiring secondary sleeves.",
        unitOfMeasure: "piece",
        unitPrice: 3.85,
        currency: "INR",
        taxPercent: 18,
        priceIncludesTax: false,
        minOrderQuantity: 5000,
        maxOrderQuantity: 200000,
        quantityStep: 500,
        stockAvailable: 25000,
        fulfilmentMode: "made_to_order",
        leadTimeDaysMin: 7,
        leadTimeDaysMax: 10,
        shippingTerms: "buyer_pays",
        shippingCostNote: "Standard freight charges calculated by weight at checkout.",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411013",
        sampleAvailable: true,
        samplePrice: 250,
        validFrom: "2026-09-01T00:00:00Z",
        validUntil: "2026-12-31T23:59:59Z",
        status: "active",
        images: ["/img/ripple-cup.jpg"],
        attributes: {
            material: "ITC Poly-Coated Virgin Board",
            gsm: 320,
            size: "12oz (350ml)",
            wallType: "Triple Ripple Wall",
            foodSafeCertified: true,
            certifications: ["FSSAI", "ISO 9001:2015", "BRCGS"],
            customizationAvailable: true,
            printType: "High Definition Flexo (Up to 6 Colors)",
            recyclable: true,
            compostable: false,
            packSize: 50,
            packsPerCarton: 20,
        },
        priceTiers: [
            { id: "tier-1", minQuantity: 5000, maxQuantity: 19999, unitPrice: 3.85 },
            { id: "tier-2", minQuantity: 20000, maxQuantity: 49999, unitPrice: 3.45 },
            { id: "tier-3", minQuantity: 50000, unitPrice: 3.10 },
        ],
        viewsCount: 1420,
        ordersCount: 38,
        createdAt: "2026-09-12T10:00:00Z",
        updatedAt: "2026-10-18T12:00:00Z",
    },
    {
        id: "OFR-2026-002",
        title: "Flute-E Kraft Pizza Box (9-inch Square) with Steam Vents",
        sku: "PZB-EFL-9IN-02",
        category: "pizza_box",
        description: "Rigid corrugated pizza box designed to maintain crust crispness. Engineered with precision corner locks and ventilation ports.",
        unitOfMeasure: "piece",
        unitPrice: 8.20,
        currency: "INR",
        taxPercent: 18,
        priceIncludesTax: false,
        minOrderQuantity: 2000,
        maxOrderQuantity: 50000,
        quantityStep: 100,
        stockAvailable: 15000,
        fulfilmentMode: "ready_stock",
        leadTimeDaysMin: 3,
        leadTimeDaysMax: 5,
        shippingTerms: "included",
        shippingCostNote: "Free dispatch for metro areas across western India.",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411013",
        sampleAvailable: true,
        samplePrice: 150,
        validFrom: "2026-08-15T00:00:00Z",
        validUntil: "2026-12-31T23:59:59Z",
        status: "active",
        images: ["/img/pizza-box.jpg"],
        attributes: {
            material: "Virgin Kraft Corrugated Board",
            gsm: 280,
            size: "9 x 9 x 1.75 inches",
            fluteType: "E-Flute",
            foodSafeCertified: true,
            certifications: ["FSSAI", "FSC Certified"],
            customizationAvailable: true,
            printType: "Flexographic (1-2 Spot colors)",
            recyclable: true,
            compostable: true,
            packSize: 50,
            packsPerCarton: 4,
        },
        priceTiers: [
            { id: "tier-1", minQuantity: 2000, maxQuantity: 9999, unitPrice: 8.20 },
            { id: "tier-2", minQuantity: 10000, unitPrice: 7.40 },
        ],
        viewsCount: 980,
        ordersCount: 24,
        createdAt: "2026-09-18T11:30:00Z",
        updatedAt: "2026-10-15T08:00:00Z",
    },
    {
        id: "OFR-2026-003",
        title: "3-Ply Corrugated Delivery Shipper Cartons (12x10x8 inch)",
        sku: "BOX-3PLY-STD-03",
        category: "corrugated_box",
        description: "Heavy-duty transit boxes with 18-20 BF burst factor. Ideal for bulk food delivery and cloud kitchen consolidation.",
        unitOfMeasure: "piece",
        unitPrice: 14.50,
        currency: "INR",
        taxPercent: 18,
        priceIncludesTax: false,
        minOrderQuantity: 1000,
        maxOrderQuantity: 25000,
        quantityStep: 50,
        stockAvailable: 8000,
        fulfilmentMode: "ready_stock",
        leadTimeDaysMin: 2,
        leadTimeDaysMax: 4,
        shippingTerms: "buyer_pays",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411013",
        sampleAvailable: false,
        validFrom: "2026-09-01T00:00:00Z",
        validUntil: "2026-12-31T23:59:59Z",
        status: "active",
        images: [],
        attributes: {
            material: "Semi-Kraft 3-Ply",
            gsm: 360,
            size: "12 x 10 x 8 inches",
            fluteType: "B-Flute",
            foodSafeCertified: false,
            recyclable: true,
            packSize: 25,
            packsPerCarton: 4,
        },
        priceTiers: [
            { id: "tier-1", minQuantity: 1000, unitPrice: 14.50 },
            { id: "tier-2", minQuantity: 5000, unitPrice: 12.80 },
        ],
        viewsCount: 650,
        ordersCount: 19,
        createdAt: "2026-09-22T09:15:00Z",
        updatedAt: "2026-10-10T14:00:00Z",
    },
    {
        id: "OFR-2026-004",
        title: "Biodegradable Bagasse 3-Compartment Meal Trays with Lids",
        sku: "TRY-BAG-3CPT-04",
        category: "food_container",
        description: "100% sugarcane pulp bagasse bento meal box with snap-on secure clear rPET lid. Microwave and freezer safe.",
        unitOfMeasure: "pack",
        unitPrice: 420.00,
        currency: "INR",
        taxPercent: 12,
        priceIncludesTax: false,
        minOrderQuantity: 50,
        maxOrderQuantity: 1000,
        quantityStep: 10,
        stockAvailable: 120,
        fulfilmentMode: "ready_stock",
        leadTimeDaysMin: 3,
        leadTimeDaysMax: 6,
        shippingTerms: "buyer_pays",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411013",
        sampleAvailable: true,
        samplePrice: 300,
        validFrom: "2026-10-01T00:00:00Z",
        validUntil: "2026-12-31T23:59:59Z",
        status: "paused",
        images: [],
        attributes: {
            material: "Sugarcane Bagasse Pulp",
            size: "1000ml (3-section)",
            foodSafeCertified: true,
            certifications: ["FSSAI", "EN13432 Compostable"],
            compostable: true,
            packSize: 50,
        },
        priceTiers: [
            { id: "tier-1", minQuantity: 50, unitPrice: 420.00 },
            { id: "tier-2", minQuantity: 200, unitPrice: 380.00 },
        ],
        viewsCount: 410,
        ordersCount: 7,
        createdAt: "2026-10-02T15:00:00Z",
        updatedAt: "2026-10-17T11:00:00Z",
    },
]

// ── Mock Initial Orders ──────────────────────────────────────────────────────
const INITIAL_ORDERS: VendorOrder[] = [
    {
        id: "ORD-9421",
        orderNumber: "UNF-ORD-9421",
        businessId: "biz-8801",
        businessName: "The Artisanal Roastery & Café",
        contactEmail: "procurement@artisanalroastery.com",
        contactPhone: "+91 98231 44520",
        shippingAddress: {
            line1: "Plot 42, Koregaon Park North Main Rd",
            line2: "Opposite Lane 6",
            city: "Pune",
            state: "Maharashtra",
            pincode: "411001",
        },
        status: "processing",
        currency: "INR",
        subtotal: 77000.00,
        taxTotal: 13860.00,
        shippingTotal: 2500.00,
        total: 93360.00,
        paymentTerms: "advance_50",
        paymentStatus: "Escrow Secured",
        items: [
            {
                id: "item-1",
                offeringId: "OFR-2026-001",
                title: "Custom Printed Ripple Wall Paper Cups (12oz / 350ml)",
                category: "paper_cup",
                quantity: 20000,
                unitOfMeasure: "piece",
                unitPrice: 3.85,
                total: 77000.00,
                specifications: {
                    Artwork: "Gold Foil Stamp + Espresso Dark Brown Matte",
                    "Wall Type": "Triple Ripple Wall",
                    GSM: "320 GSM Virgin Board",
                },
            },
        ],
        milestones: [
            {
                id: "m-1",
                stage: "order_confirmed",
                stageSequence: 1,
                title: "Order Confirmed",
                description: "Purchase order accepted & advance locked in escrow.",
                isCompleted: true,
                completedAt: "2026-10-14T09:30:00Z",
            },
            {
                id: "m-2",
                stage: "artwork_approved",
                stageSequence: 2,
                title: "Artwork & Pre-Press Approved",
                description: "Client signed off digital 3D proof & Pantone specs.",
                isCompleted: true,
                completedAt: "2026-10-15T14:20:00Z",
            },
            {
                id: "m-3",
                stage: "tooling_and_plates_ready",
                stageSequence: 3,
                title: "Tooling & Flexo Plates Ready",
                description: "Polymer laser cylinder plates engraved and mounted.",
                isCompleted: true,
                completedAt: "2026-10-16T11:00:00Z",
            },
            {
                id: "m-4",
                stage: "raw_material_sourced",
                stageSequence: 4,
                title: "Raw Material Sourced",
                description: "ITC 320 GSM board dispatched to print line.",
                isCompleted: true,
                completedAt: "2026-10-17T16:45:00Z",
            },
            {
                id: "m-5",
                stage: "in_production",
                stageSequence: 5,
                title: "In High-Speed Production",
                description: "Machine Line 2 running at 140 cups/minute.",
                isCompleted: true,
                completedAt: "2026-10-19T10:00:00Z",
            },
            {
                id: "m-6",
                stage: "quality_check_passed",
                stageSequence: 6,
                title: "Quality Check & Leak Testing",
                description: "Awaiting final batch QC audit & leak bath run.",
                isCompleted: false,
            },
            {
                id: "m-7",
                stage: "packed",
                stageSequence: 7,
                title: "Packed in Corrugated Master Cartons",
                description: "Shrink sleeves sealed in 20 carton units.",
                isCompleted: false,
            },
            {
                id: "m-8",
                stage: "dispatched",
                stageSequence: 8,
                title: "Dispatched with Logistics Partner",
                description: "Pickup scheduled with Delhivery Surface Express.",
                isCompleted: false,
            },
            {
                id: "m-9",
                stage: "delivered",
                stageSequence: 9,
                title: "Delivered & POD Verified",
                description: "Final drop-off confirmation.",
                isCompleted: false,
            },
        ],
        submittedAt: "2026-10-14T09:00:00Z",
        confirmedAt: "2026-10-14T09:30:00Z",
        notes: "Buyer requested urgent dispatch before Oct 24 for outlet anniversary.",
    },
    {
        id: "ORD-9380",
        orderNumber: "UNF-ORD-9380",
        businessId: "biz-8802",
        businessName: "Napoli Woodfire Pizzeria",
        contactEmail: "ops@napolipizza.in",
        contactPhone: "+91 97110 88290",
        shippingAddress: {
            line1: "Shop 12, High Street Galleria",
            line2: "Baner Link Road",
            city: "Pune",
            state: "Maharashtra",
            pincode: "411045",
        },
        status: "shipped",
        currency: "INR",
        subtotal: 37000.00,
        taxTotal: 6660.00,
        shippingTotal: 0.00,
        total: 43660.00,
        paymentTerms: "on_delivery",
        paymentStatus: "Escrow Secured",
        items: [
            {
                id: "item-2",
                offeringId: "OFR-2026-002",
                title: "Flute-E Kraft Pizza Box (9-inch Square) with Steam Vents",
                category: "pizza_box",
                quantity: 5000,
                unitOfMeasure: "piece",
                unitPrice: 7.40,
                total: 37000.00,
                specifications: {
                    Print: "Red & Olive Green 2-Color Stamp",
                    Flute: "E-Flute Kraft",
                },
            },
        ],
        milestones: INITIAL_MILESTONES.map((m, idx) => ({
            ...m,
            id: `m-9380-${idx}`,
            isCompleted: idx <= 7,
            completedAt: idx <= 7 ? "2026-10-18T15:30:00Z" : undefined,
        })),
        shipment: {
            courierPartner: "Blue Dart Express",
            trackingNumber: "BLD-778940219",
            trackingUrl: "https://www.bluedart.com/tracking?track=BLD-778940219",
            packageWeightKg: 145.0,
            numberOfBoxes: 25,
            dispatchedAt: "2026-10-18T16:00:00Z",
            estimatedDeliveryDate: "2026-10-21T18:00:00Z",
            status: "in_transit",
        },
        submittedAt: "2026-10-10T11:15:00Z",
        confirmedAt: "2026-10-10T12:00:00Z",
        notes: "Fragile packaging markings requested on cartons.",
    },
    {
        id: "ORD-9355",
        orderNumber: "UNF-ORD-9355",
        businessId: "biz-8803",
        businessName: "FreshBox Cloud Kitchens",
        contactEmail: "supply@freshbox.kitchen",
        contactPhone: "+91 99300 12845",
        shippingAddress: {
            line1: "Unit 4B, Food Technology Park",
            city: "Navi Mumbai",
            state: "Maharashtra",
            pincode: "400705",
        },
        status: "delivered",
        currency: "INR",
        subtotal: 125000.00,
        taxTotal: 22500.00,
        shippingTotal: 4800.00,
        total: 152300.00,
        paymentTerms: "net_15",
        paymentStatus: "Settled",
        items: [
            {
                id: "item-3",
                offeringId: "OFR-2026-003",
                title: "3-Ply Corrugated Delivery Shipper Cartons (12x10x8 inch)",
                category: "corrugated_box",
                quantity: 10000,
                unitOfMeasure: "piece",
                unitPrice: 12.50,
                total: 125000.00,
                specifications: {
                    Type: "Brown Semi-Kraft 18 BF",
                },
            },
        ],
        milestones: INITIAL_MILESTONES.map((m, idx) => ({
            ...m,
            id: `m-9355-${idx}`,
            isCompleted: true,
            completedAt: "2026-10-12T14:00:00Z",
        })),
        shipment: {
            courierPartner: "VRL Logistics Dedicated Truck",
            trackingNumber: "VRL-PN-NM-9021",
            packageWeightKg: 850.0,
            numberOfBoxes: 100,
            dispatchedAt: "2026-10-11T08:00:00Z",
            estimatedDeliveryDate: "2026-10-12T13:00:00Z",
            status: "delivered",
        },
        submittedAt: "2026-10-01T10:00:00Z",
        confirmedAt: "2026-10-01T10:30:00Z",
        deliveredAt: "2026-10-12T14:15:00Z",
    },
    {
        id: "ORD-9460",
        orderNumber: "UNF-ORD-9460",
        businessId: "biz-8804",
        businessName: "Chai Story Franchises",
        contactEmail: "procure@chaistory.in",
        contactPhone: "+91 98811 55670",
        shippingAddress: {
            line1: "Godown 3, APMC Yard",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560022",
        },
        status: "submitted",
        currency: "INR",
        subtotal: 54000.00,
        taxTotal: 9720.00,
        shippingTotal: 3200.00,
        total: 66920.00,
        paymentTerms: "advance_100",
        paymentStatus: "Pending",
        items: [
            {
                id: "item-4",
                offeringId: "OFR-2026-001",
                title: "Custom Printed Ripple Wall Paper Cups (8oz / 250ml)",
                category: "paper_cup",
                quantity: 15000,
                unitOfMeasure: "piece",
                unitPrice: 3.60,
                total: 54000.00,
                specifications: {
                    Customization: "Chai Story Mascot Print + Terracotta Color",
                },
            },
        ],
        milestones: INITIAL_MILESTONES.map((m, idx) => ({
            ...m,
            id: `m-9460-${idx}`,
            isCompleted: false,
        })),
        submittedAt: "2026-10-20T16:20:00Z",
        notes: "New order placed by buyer. Awaiting manufacturer acceptance.",
    },
]

// ── Mock Initial Quotations / RFQs ──────────────────────────────────────────
const INITIAL_QUOTATIONS: VendorQuotation[] = [
    {
        id: "RFQ-2026-101",
        quoteNumber: "QT-2026-042",
        requirementId: "REQ-9912",
        requirementTitle: "Custom Embossed Cup Sleeves & Double-Wall Cups (50,000 units)",
        businessName: "Third Wave Coffee Roasters",
        packagingCategory: "paper_cup",
        quantityRequested: 50000,
        baseUnitPrice: 3.15,
        taxPercent: 18,
        toolingOrDieCost: 4500,
        plateCharge: 3200,
        sampleAvailable: true,
        samplePrice: 500,
        sampleLeadTimeDays: 4,
        productionLeadTimeDaysMin: 8,
        productionLeadTimeDaysMax: 12,
        estimatedDeliveryDays: 3,
        shippingTerms: "vendor_pays",
        paymentTerms: "net_30",
        validUntil: "2026-11-15T23:59:59Z",
        status: "submitted",
        notes: "Includes high-speed flexo printing with FDA food-contact compliant organic inks.",
        createdAt: "2026-10-18T12:30:00Z",
    },
    {
        id: "RFQ-2026-102",
        quoteNumber: "QT-2026-043",
        requirementId: "REQ-9915",
        requirementTitle: "Custom Printed Burger Clamshell Boxes (25,000 units)",
        businessName: "Smash Burgers Mumbai",
        packagingCategory: "food_container",
        quantityRequested: 25000,
        baseUnitPrice: 6.40,
        taxPercent: 18,
        toolingOrDieCost: 6000,
        plateCharge: 2500,
        sampleAvailable: true,
        samplePrice: 350,
        sampleLeadTimeDays: 3,
        productionLeadTimeDaysMin: 7,
        productionLeadTimeDaysMax: 10,
        estimatedDeliveryDays: 2,
        shippingTerms: "buyer_pays",
        paymentTerms: "advance_50",
        validUntil: "2026-11-10T23:59:59Z",
        status: "under_review",
        notes: "Virgin board with grease-resistant bio-coating. Sample kit already dispatched.",
        createdAt: "2026-10-19T09:45:00Z",
    },
]

// ── Mock Initial Payout History ─────────────────────────────────────────────
const INITIAL_PAYOUTS: PayoutTransaction[] = [
    {
        id: "pay-101",
        referenceNumber: "UTR-HDFC-9820194821",
        orderNumber: "UNF-ORD-9355",
        amount: 152300.00,
        payoutMethod: "NEFT / RTGS",
        accountEnding: "4092 (HDFC Bank Ltd)",
        date: "2026-10-13T11:00:00Z",
        status: "settled",
    },
    {
        id: "pay-102",
        referenceNumber: "UTR-HDFC-9817723901",
        orderNumber: "UNF-ORD-9290",
        amount: 88400.00,
        payoutMethod: "NEFT / RTGS",
        accountEnding: "4092 (HDFC Bank Ltd)",
        date: "2026-10-06T15:20:00Z",
        status: "settled",
    },
    {
        id: "pay-103",
        referenceNumber: "ESC-PEND-49201",
        orderNumber: "UNF-ORD-9380",
        amount: 43660.00,
        payoutMethod: "Instant IMPS",
        accountEnding: "4092 (HDFC Bank Ltd)",
        date: "2026-10-22T00:00:00Z",
        status: "scheduled",
    },
]

// ── Mock Initial Facility Profile ───────────────────────────────────────────
const INITIAL_FACILITY: VendorFacilityProfile = {
    facilityName: "Unifiée Apex Packaging Plant #1",
    factoryAreaSqFt: 35000,
    dailyCapacityUnits: 150000,
    monthlyCapacityUnits: 4500000,
    currentUtilizationPercent: 78,
    shiftCount: 2,
    operatingSinceYear: 2018,
    gstin: "27AABCU9603R1ZM",
    printingProcesses: ["High-Definition Flexographic", "Offset Litho", "Rotogravure", "Screen Printing"],
    maxPrintColors: 6,
    certifications: [
        { name: "ISO 9001:2015 Quality Management", status: "verified" },
        { name: "FSSAI Food Safety Packaging Compliance", status: "verified" },
        { name: "BRCGS Packaging Materials Issue 6", status: "verified" },
        { name: "FSC CoC Chain of Custody (FSC-C144901)", status: "verified" },
    ],
    machineryCapabilities: [
        { name: "Heidelberg 6-Color Offset Printing Press", quantity: 2, speedPerHour: "12,000 sheets/hr" },
        { name: "High-Speed Ultrasonic Paper Cup Forming Lines", quantity: 6, speedPerHour: "140 cups/min" },
        { name: "Bobst Automatic Die-Cutting & Embossing Platen", quantity: 3, speedPerHour: "7,500 sheets/hr" },
        { name: "Folder Gluer with Plasma Pre-Treatment", quantity: 2, speedPerHour: "25,000 boxes/hr" },
    ],
    qualityTestingMethods: [
        "Cobb Moisture Absorption Test",
        "Edge Crush Test (ECT) & Bursting Strength",
        "Hot Beverage Seepage & Rim Leak Bath Test",
        "Spectrophotometer Ink Delta-E Color Calibration",
    ],
    address: "Plot B-14, Hadapsar Industrial Estate",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411013",
}

interface VendorStoreState {
    offerings: VendorOffering[]
    orders: VendorOrder[]
    quotations: VendorQuotation[]
    payouts: PayoutTransaction[]
    facility: VendorFacilityProfile

    // Offerings actions
    addOffering: (offering: Omit<VendorOffering, "id" | "viewsCount" | "ordersCount" | "createdAt" | "updatedAt">) => VendorOffering
    updateOffering: (id: string, updates: Partial<VendorOffering>) => void
    deleteOffering: (id: string) => void
    toggleOfferingStatus: (id: string, newStatus: OfferingStatus) => void

    // Orders actions
    acceptOrder: (orderId: string) => void
    advanceMilestone: (orderId: string, stage: OrderStage) => void
    updateOrderStatus: (orderId: string, status: VendorOrder["status"]) => void
    addShipment: (orderId: string, shipment: ShipmentDetails) => void
    markOrderDelivered: (orderId: string) => void
    cancelOrder: (orderId: string, reason?: string) => void

    // Quotation actions
    submitQuotation: (quote: Omit<VendorQuotation, "id" | "quoteNumber" | "createdAt" | "status">) => VendorQuotation
    updateQuotationStatus: (id: string, status: VendorQuotation["status"]) => void

    // Facility actions
    updateFacility: (updates: Partial<VendorFacilityProfile>) => void

    // Financial actions
    requestPayout: (amount: number) => void
}

export const useVendorStore = create<VendorStoreState>()(
    persist(
        (set, get) => ({
            offerings: INITIAL_OFFERINGS,
            orders: INITIAL_ORDERS,
            quotations: INITIAL_QUOTATIONS,
            payouts: INITIAL_PAYOUTS,
            facility: INITIAL_FACILITY,

            // Offering Mutators
            addOffering: (offeringData) => {
                const newId = `OFR-2026-${String(get().offerings.length + 1).padStart(3, "0")}`
                const now = new Date().toISOString()
                const newOffering: VendorOffering = {
                    ...offeringData,
                    id: newId,
                    viewsCount: 1,
                    ordersCount: 0,
                    createdAt: now,
                    updatedAt: now,
                }
                set((state) => ({
                    offerings: [newOffering, ...state.offerings],
                }))
                return newOffering
            },

            updateOffering: (id, updates) => {
                set((state) => ({
                    offerings: state.offerings.map((o) =>
                        o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
                    ),
                }))
            },

            deleteOffering: (id) => {
                set((state) => ({
                    offerings: state.offerings.filter((o) => o.id !== id),
                }))
            },

            toggleOfferingStatus: (id, newStatus) => {
                set((state) => ({
                    offerings: state.offerings.map((o) =>
                        o.id === id ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o
                    ),
                }))
            },

            // Order Mutators
            acceptOrder: (orderId) => {
                const now = new Date().toISOString()
                set((state) => ({
                    orders: state.orders.map((order) => {
                        if (order.id !== orderId) return order
                        const updatedMilestones = order.milestones.map((m) =>
                            m.stage === "order_confirmed"
                                ? { ...m, isCompleted: true, completedAt: now }
                                : m
                        )
                        return {
                            ...order,
                            status: "confirmed",
                            confirmedAt: now,
                            milestones: updatedMilestones,
                        }
                    }),
                }))
            },

            advanceMilestone: (orderId, targetStage) => {
                const now = new Date().toISOString()
                set((state) => ({
                    orders: state.orders.map((order) => {
                        if (order.id !== orderId) return order
                        let foundTarget = false
                        const updatedMilestones = order.milestones.map((m) => {
                            if (m.stage === targetStage) {
                                foundTarget = true
                                return { ...m, isCompleted: true, completedAt: m.completedAt || now }
                            }
                            return m
                        })

                        let newStatus = order.status
                        if (targetStage === "in_production") newStatus = "processing"
                        if (targetStage === "dispatched") newStatus = "shipped"
                        if (targetStage === "delivered") newStatus = "delivered"

                        return {
                            ...order,
                            status: newStatus,
                            milestones: updatedMilestones,
                        }
                    }),
                }))
            },

            updateOrderStatus: (orderId, newStatus) => {
                set((state) => ({
                    orders: state.orders.map((o) =>
                        o.id === orderId ? { ...o, status: newStatus } : o
                    ),
                }))
            },

            addShipment: (orderId, shipmentDetails) => {
                const now = new Date().toISOString()
                set((state) => ({
                    orders: state.orders.map((order) => {
                        if (order.id !== orderId) return order
                        const updatedMilestones = order.milestones.map((m) =>
                            m.stage === "dispatched" || m.stage === "packed" || m.stage === "quality_check_passed"
                                ? { ...m, isCompleted: true, completedAt: m.completedAt || now }
                                : m
                        )
                        return {
                            ...order,
                            status: "shipped",
                            shipment: shipmentDetails,
                            milestones: updatedMilestones,
                        }
                    }),
                }))
            },

            markOrderDelivered: (orderId) => {
                const now = new Date().toISOString()
                set((state) => ({
                    orders: state.orders.map((order) => {
                        if (order.id !== orderId) return order
                        const updatedMilestones = order.milestones.map((m) => ({
                            ...m,
                            isCompleted: true,
                            completedAt: m.completedAt || now,
                        }))
                        return {
                            ...order,
                            status: "delivered",
                            deliveredAt: now,
                            paymentStatus: "Settled",
                            milestones: updatedMilestones,
                            shipment: order.shipment
                                ? { ...order.shipment, status: "delivered" }
                                : undefined,
                        }
                    }),
                }))
            },

            cancelOrder: (orderId, reason) => {
                set((state) => ({
                    orders: state.orders.map((order) =>
                        order.id === orderId
                            ? {
                                  ...order,
                                  status: "cancelled",
                                  notes: reason ? `${order.notes || ""} [Cancelled: ${reason}]` : order.notes,
                              }
                            : order
                    ),
                }))
            },

            // Quotation Mutators
            submitQuotation: (quoteData) => {
                const newId = `RFQ-2026-${String(get().quotations.length + 101)}`
                const quoteNum = `QT-2026-${String(get().quotations.length + 45)}`
                const newQuote: VendorQuotation = {
                    ...quoteData,
                    id: newId,
                    quoteNumber: quoteNum,
                    status: "submitted",
                    createdAt: new Date().toISOString(),
                }
                set((state) => ({
                    quotations: [newQuote, ...state.quotations],
                }))
                return newQuote
            },

            updateQuotationStatus: (id, status) => {
                set((state) => ({
                    quotations: state.quotations.map((q) =>
                        q.id === id ? { ...q, status } : q
                    ),
                }))
            },

            // Facility Mutators
            updateFacility: (updates) => {
                set((state) => ({
                    facility: { ...state.facility, ...updates },
                }))
            },

            requestPayout: (amount) => {
                const newPayout: PayoutTransaction = {
                    id: `pay-${Date.now()}`,
                    referenceNumber: `REQ-IMPS-${Math.floor(100000 + Math.random() * 900000)}`,
                    orderNumber: "Consolidated Balance Payout",
                    amount,
                    payoutMethod: "Instant IMPS",
                    accountEnding: "4092 (HDFC Bank Ltd)",
                    date: new Date().toISOString(),
                    status: "processing",
                }
                set((state) => ({
                    payouts: [newPayout, ...state.payouts],
                }))
            },
        }),
        {
            name: "unifiee-vendor-storage-v1",
        }
    )
)
