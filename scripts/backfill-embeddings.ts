import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../src/lib/db";
import { businessRequirementsTable } from "../src/lib/db/schema/business-requirement";
import { offeringsTable } from "../src/lib/db/schema/offering";
import { designerServiceTable } from "../src/lib/db/schema/designer-service";
import { packagingDesignerTable } from "../src/lib/db/schema/packaging-designer";
import { IN_APP_HELP_DOCS } from "../src/lib/ai/help-knowledge";
import {
    syncEntityEmbeddings,
    buildRequirementTemplate,
    buildOfferingTemplate,
    buildGigTemplate,
    buildHelpDocTemplate,
} from "../src/lib/ai/embeddings";

async function backfill() {
    console.log("=== UNIFIÉE EMBEDDING BACKFILL PIPELINE ===");
    console.log("Target Model: mistral-embed (1024 dimensions)");
    console.log("------------------------------------------");

    let totalSynced = 0;
    let totalErrors = 0;

    // 1. Backfill In-App Help Docs
    console.log("\n[1/5] Backfilling In-App Help Documentation...");
    for (const doc of IN_APP_HELP_DOCS) {
        const fullText = buildHelpDocTemplate(doc);
        try {
            const ok = await syncEntityEmbeddings({
                entityType: "help_doc",
                entityId: doc.id,
                title: doc.title,
                fullText,
                visibilityScope: "public",
                metadata: {
                    category: doc.category,
                    route: doc.route,
                    allowedRole: doc.targetRole,
                },
            });
            if (ok) totalSynced++;
        } catch (err) {
            console.error(`Failed help doc ${doc.id}:`, err);
            totalErrors++;
        }
    }
    console.log(`✓ Help documentation backfilled (${IN_APP_HELP_DOCS.length} docs).`);

    // 2. Backfill Business Requirements
    console.log("\n[2/5] Backfilling Business Requirements...");
    try {
        const requirements = await db.select().from(businessRequirementsTable);
        console.log(`Found ${requirements.length} requirements.`);
        for (const req of requirements) {
            const fullText = buildRequirementTemplate(req);
            const ok = await syncEntityEmbeddings({
                entityType: "requirement",
                entityId: req.id,
                ownerId: req.businessId,
                title: req.title,
                fullText,
                visibilityScope: "private",
                metadata: {
                    status: req.status,
                    packagingUse: req.packagingUse,
                    packagingType: req.packagingType,
                    businessId: req.businessId,
                },
            });
            if (ok) totalSynced++;
        }
    } catch (err) {
        console.error("Error backfilling requirements:", err);
        totalErrors++;
    }

    // 3. Backfill Vendor Offerings
    console.log("\n[3/5] Backfilling Vendor Catalog Offerings...");
    try {
        const offerings = await db.select().from(offeringsTable);
        console.log(`Found ${offerings.length} offerings.`);
        for (const off of offerings) {
            const fullText = buildOfferingTemplate(off);
            const ok = await syncEntityEmbeddings({
                entityType: "offer",
                entityId: off.id,
                ownerId: off.vendorId,
                title: off.title,
                fullText,
                visibilityScope: "public",
                metadata: {
                    offeringType: off.offeringType,
                    vendorId: off.vendorId,
                    status: off.status,
                    price: off.unitPrice,
                },
            });
            if (ok) totalSynced++;
        }
    } catch (err) {
        console.error("Error backfilling offerings:", err);
        totalErrors++;
    }

    // 4. Backfill Designer Services (Gigs)
    console.log("\n[4/5] Backfilling Designer Gigs...");
    try {
        const gigs = await db.select().from(designerServiceTable);
        console.log(`Found ${gigs.length} gigs.`);
        for (const gig of gigs) {
            const fullText = buildGigTemplate(gig);
            const ok = await syncEntityEmbeddings({
                entityType: "gig",
                entityId: gig.id,
                ownerId: gig.designerId,
                title: gig.title,
                fullText,
                visibilityScope: "public",
                metadata: {
                    serviceType: gig.serviceType,
                    designerId: gig.designerId,
                    pricingModel: gig.pricingModel,
                    price: gig.price,
                    status: gig.status,
                },
            });
            if (ok) totalSynced++;
        }
    } catch (err) {
        console.error("Error backfilling designer gigs:", err);
        totalErrors++;
    }

    // 5. Backfill Designer Profiles
    console.log("\n[5/5] Backfilling Designer Profiles...");
    try {
        const designers = await db.select().from(packagingDesignerTable);
        console.log(`Found ${designers.length} designers.`);
        for (const des of designers) {
            const fullText = [
                `Packaging Designer: ${des.displayName || des.fullName}`,
                des.headline ? `Headline: ${des.headline}` : "",
                des.bio ? `Bio: ${des.bio}` : "",
                des.yearsOfExperience ? `Experience: ${des.yearsOfExperience} years` : "",
                des.packagingDesignSpecializations?.length
                    ? `Specialties: ${des.packagingDesignSpecializations.join(", ")}`
                    : "",
                des.softwareTools?.length ? `Tools: ${des.softwareTools.join(", ")}` : "",
                des.city || des.state ? `Location: ${[des.city, des.state].filter(Boolean).join(", ")}` : "",
            ]
                .filter(Boolean)
                .join("; ");

            const ok = await syncEntityEmbeddings({
                entityType: "designer_profile",
                entityId: des.id,
                ownerId: des.userId,
                title: des.displayName || des.fullName,
                fullText,
                visibilityScope: "public",
                metadata: {
                    designerId: des.id,
                    isVerified: des.isVerified,
                    availability: des.availabilityStatus,
                },
            });
            if (ok) totalSynced++;
        }
    } catch (err) {
        console.error("Error backfilling designer profiles:", err);
        totalErrors++;
    }

    console.log("\n==========================================");
    console.log(`BACKFILL COMPLETE: ${totalSynced} items processed, ${totalErrors} errors.`);
    console.log("==========================================");
    process.exit(0);
}

backfill().catch((err) => {
    console.error("Fatal backfill error:", err);
    process.exit(1);
});
