/**
 * AI Fallback Generators
 * Provides deterministic, high-quality domain fallbacks when AI providers
 * exceed rate limits, exhaust free-tier quotas, or run out of credits.
 * This guarantees zero user disruption and prevents runtime errors.
 */

import { formatCategoryDisplayName } from "@/lib/constants/categories";

export interface VendorFallbackInput {
    title?: string;
    description?: string;
    category?: string;
    material?: string;
    size?: string;
}

export function getFallbackVendorSuggestion(
    mode: "suggest_title" | "improve_description",
    input: VendorFallbackInput
): { suggestedText: string; rationale: string } {
    const categoryName = formatCategoryDisplayName(input.category || "packaging");
    const material = input.material?.trim();
    const size = input.size?.trim();
    const existingTitle = input.title?.trim();

    if (mode === "suggest_title") {
        const parts: string[] = [];
        if (size) parts.push(size);
        if (material) parts.push(material);
        parts.push(categoryName);
        parts.push("Commercial Food Grade");

        const suggestedTitle = parts.join(" - ");

        return {
            suggestedText: suggestedTitle,
            rationale: "Optimized for commercial B2B procurement with category, material, and food-grade compliance keywords.",
        };
    }

    // improve_description
    const descParts: string[] = [];
    const titleRef = existingTitle || `${size ? `${size} ` : ""}${categoryName}`;

    descParts.push(
        `Commercial-grade ${titleRef} manufactured specifically for high-volume foodservice, retail, and commercial delivery.`
    );

    if (material) {
        descParts.push(
            `Constructed from high-tensile ${material} providing superior structural rigidity, leak prevention, and thermal insulation.`
        );
    } else {
        descParts.push(
            "Constructed from certified food-grade packaging substrate ensuring moisture resistance, stackability, and product integrity."
        );
    }

    descParts.push(
        "Fully customizable with CMYK/Pantone high-precision flexographic or offset branding. Certified food-safe, odorless, and engineered to meet national quality compliance standards for commercial establishments."
    );

    return {
        suggestedText: descParts.join(" "),
        rationale: "Structured commercial catalog description highlighting food-grade safety, barrier strength, and volume supply capabilities.",
    };
}

export function getFallbackSpecsAudit(input: VendorFallbackInput): {
    missingAttributes: string[];
    suggestedAdditions: string;
    completenessScore: number;
    recommendation: string;
} {
    const category = (input.category || "").toLowerCase();
    const missing: string[] = [];
    const suggestions: string[] = [];

    if (category.includes("cup")) {
        missing.push("Board Caliper (GSM)", "PE / PLA Barrier Lining", "Lid Compatibility & Rim Diameter");
        suggestions.push("• Paper Caliper: 280 GSM + 18 GSM PE moisture barrier");
        suggestions.push("• Rim Diameter: 90mm standard, compatible with snap-on sip lids");
        suggestions.push("• Temperature Range: -10°C to 95°C (hot & cold suitable)");
    } else if (category.includes("box") || category.includes("pizza") || category.includes("corrugated")) {
        missing.push("Flute Profile (E/B/F Flute)", "Bursting Strength (BF)", "Inner vs Outer Dimensions");
        suggestions.push("• Board Construction: 3-Ply E-Flute corrugated board (120-140 GSM)");
        suggestions.push("• Bursting Strength: 12-14 BF with oil-resistant internal food-grade coating");
        suggestions.push("• Venting: Dual precision steam release vents on rear corners");
    } else if (category.includes("pouch") || category.includes("bag")) {
        missing.push("Micron Thickness", "Seal Type (Zip / Heat)", "Gusset Depth");
        suggestions.push("• Thickness: 100-120 Micron multi-layer barrier film");
        suggestions.push("• Seal: Airtight reclosable zipper with tear notch");
        suggestions.push("• Oxygen & Moisture Barrier: High-barrier metallized/EVOH layer");
    } else {
        missing.push("Substrate GSM / Caliper", "Food Safety Certification", "Master Carton Packaging");
        suggestions.push("• Substrate: Heavy-duty food-grade virgin board (280-320 GSM)");
        suggestions.push("• Safety: FDA / FSSAI compliant, 100% non-toxic & odorless");
        suggestions.push("• Packaging: 50 pcs/sleeve, 1,000 pcs/master export carton");
    }

    return {
        missingAttributes: missing,
        suggestedAdditions: suggestions.join("\n"),
        completenessScore: 75,
        recommendation: "Adding precise board weight (GSM) and barrier lining specifications will accelerate buyer quotation decisions.",
    };
}

export interface DesignerGigFallbackInput {
    rawNotes?: string;
    category?: string;
    specialization?: string;
}

export function getFallbackGigCreation(input: DesignerGigFallbackInput) {
    const cat = input.category || "Packaging Design";
    const cleanCat = cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return {
        title: `Custom ${cleanCat} & Production Dieline Design`,
        description: `Professional, production-grade ${cleanCat} service tailored for food brands, FMCG products, and commercial manufacturers. I deliver accurate vector dielines, print-ready CMYK files with proper bleeds and cut marks, and realistic 3D mockups ready for packaging suppliers.`,
        deliverables: [
            "Production-ready Vector Dielines (AI, EPS)",
            "Print-Ready CMYK PDF (300 DPI, Bleed & Trim)",
            "Photorealistic 3D Mockup Renders (PNG, JPG)",
            "Finishing & Spot UV / Foil Guide Sheet",
        ],
        faq: [
            {
                question: "What information do you need to get started?",
                answer: "Please provide your brand logo (vector preferred), package dimensions (length x width x height), and any mandatory regulatory or barcode text.",
            },
            {
                question: "Can my packaging vendor print directly from these files?",
                answer: "Yes, all files are prepared to industry flexo and offset commercial printing tolerances with dielines on a dedicated non-printing layer.",
            },
            {
                question: "Do you include 3D renders for marketing?",
                answer: "Yes, high-resolution 3D renders showing front, angle, and perspective views are included with all completed orders.",
            },
        ],
    };
}

export interface DesignerBioFallbackInput {
    specialties?: string[];
    tools?: string[];
    experienceYears?: number | string;
    roughNotes?: string;
}

export function getFallbackDesignerBio(input: DesignerBioFallbackInput) {
    const years = input.experienceYears || 4;
    const specialtiesList =
        input.specialties && input.specialties.length > 0
            ? input.specialties.join(", ")
            : "food & beverage packaging, folding cartons, and commercial dielines";
    const toolsList =
        input.tools && input.tools.length > 0
            ? input.tools.join(", ")
            : "Adobe Illustrator, Photoshop, and 3D Packaging CAD";

    return {
        headline: "Packaging Structural & Visual Identity Designer",
        bio: `Packaging designer with over ${years} years of dedicated experience crafting high-impact retail packaging and production-ready dielines. Specializing in ${specialtiesList}. Skilled in ${toolsList}, with deep expertise in flexographic, offset, and digital print constraints. Committed to clean typography, shelf visibility, and zero-error manufacturer handoffs.`,
    };
}

export interface DeliveryHelperFallbackInput {
    orderNumber?: string;
    serviceTitle?: string;
    clientName?: string;
    deliveryNotes?: string;
    isRevision?: boolean;
}

export function getFallbackDeliveryHelper(input: DeliveryHelperFallbackInput) {
    const clientGreeting = input.clientName ? `Hi ${input.clientName},` : "Hello,";
    const orderRef = input.orderNumber ? ` for order #${input.orderNumber}` : "";
    const serviceRef = input.serviceTitle ? ` (${input.serviceTitle})` : "";

    return {
        deliveryNote: `${clientGreeting}\n\nI am pleased to deliver the completed packaging artwork${orderRef}${serviceRef}. All vector dielines, CMYK print-ready files (300 DPI with bleeds), and realistic 3D product renders are included in the downloadable bundle.\n\nPlease inspect the package proofs and let me know if you need any adjustments or manufacturer print coordination. Thank you for your partnership!`,
    };
}

export interface RequirementExtractFallback {
    title: string;
    packagingUse: "coffee" | "food" | "dessert" | "delivery" | "takeaway" | "other";
    packagingType: "cups" | "boxes" | "bags" | "cutlery" | "containers" | "custom";
    quantity: string;
    size: string;
    material: string;
    brandingNeeded: boolean;
    deliveryLocation: string;
    requiredByDate: string;
    confidenceScore: number;
    missingFields: Array<{ field: string; suggestion: string }>;
}

export function getFallbackRequirementExtract(prompt: string): RequirementExtractFallback {
    const text = prompt.toLowerCase();

    // Packaging Use detection
    let packagingUse: RequirementExtractFallback["packagingUse"] = "other";
    if (text.includes("coffee") || text.includes("tea") || text.includes("beverage")) packagingUse = "coffee";
    else if (text.includes("pizza") || text.includes("burger") || text.includes("food") || text.includes("meal")) packagingUse = "food";
    else if (text.includes("cake") || text.includes("dessert") || text.includes("pastry") || text.includes("bakery")) packagingUse = "dessert";
    else if (text.includes("delivery") || text.includes("courier") || text.includes("shipping")) packagingUse = "delivery";
    else if (text.includes("takeaway") || text.includes("takeout") || text.includes("to-go")) packagingUse = "takeaway";

    // Packaging Type detection
    let packagingType: RequirementExtractFallback["packagingType"] = "custom";
    if (text.includes("cup") || text.includes("tumbler") || text.includes("glass")) packagingType = "cups";
    else if (text.includes("box") || text.includes("carton") || text.includes("tray")) packagingType = "boxes";
    else if (text.includes("bag") || text.includes("pouch") || text.includes("sack")) packagingType = "bags";
    else if (text.includes("spoon") || text.includes("fork") || text.includes("knife") || text.includes("cutlery")) packagingType = "cutlery";
    else if (text.includes("container") || text.includes("tub") || text.includes("jar") || text.includes("bowl")) packagingType = "containers";

    // Quantity extraction (e.g. 5000, 10,000, 50k, 2500 pcs)
    const qtyMatch = prompt.match(/(\d[\d,\.]*)\s*(k|pcs|pieces|units|boxes|cartons|cups)?\b/i);
    let quantity = "5,000 pcs";
    if (qtyMatch) {
        const rawNum = qtyMatch[1].replace(/,/g, "");
        if (qtyMatch[2]?.toLowerCase() === "k") {
            quantity = `${(parseFloat(rawNum) * 1000).toLocaleString()} pcs`;
        } else {
            const parsed = parseInt(rawNum, 10);
            if (!isNaN(parsed) && parsed > 0) {
                quantity = `${parsed.toLocaleString()} pcs`;
            }
        }
    }

    // Size extraction (e.g. 12oz, 8x8, 500ml, 10 inch, 10x10x4)
    const sizeMatch = prompt.match(/\b(\d+(\.\d+)?\s*(oz|ml|ltr|litre|inch|cm|mm|gm|kg)|(\d+\s*x\s*\d+(\s*x\s*\d+)?(\s*(cm|mm|inch))?))\b/i);
    const size = sizeMatch ? sizeMatch[0] : "Standard commercial size";

    // Material detection
    let material = "Food-grade packaging board";
    if (text.includes("kraft")) material = "Virgin Kraft Paperboard (Food Grade)";
    else if (text.includes("corrugated")) material = "3-Ply Corrugated E-Flute";
    else if (text.includes("biodegradable") || text.includes("compostable")) material = "100% Biodegradable Bagasse / Cornstarch";
    else if (text.includes("pet") || text.includes("plastic")) material = "Recyclable Food-Grade PET";
    else if (text.includes("aluminum") || text.includes("foil")) material = "Foil-Lined Barrier Packaging";

    // Branding needed
    const brandingNeeded = !text.includes("unbranded") && !text.includes("plain");

    // Location extraction (common major cities or patterns)
    const cities = ["Mumbai", "Delhi", "Bengaluru", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur"];
    const foundCity = cities.find((c) => text.includes(c.toLowerCase()));
    const deliveryLocation = foundCity || "Commercial Delivery (Pan India)";

    // Required by date
    let requiredByDate = "Within 15 business days";
    if (text.includes("urgent") || text.includes("asap") || text.includes("immediately")) requiredByDate = "Immediate (7-10 days)";
    else if (text.includes("month")) requiredByDate = "Within 30 days";

    const titleType = packagingType.charAt(0).toUpperCase() + packagingType.slice(1);
    const title = `${size !== "Standard commercial size" ? `${size} ` : ""}${titleType} for ${packagingUse.charAt(0).toUpperCase() + packagingUse.slice(1)}`;

    return {
        title,
        packagingUse,
        packagingType,
        quantity,
        size,
        material,
        brandingNeeded,
        deliveryLocation,
        requiredByDate,
        confidenceScore: 0.85,
        missingFields: [],
    };
}
