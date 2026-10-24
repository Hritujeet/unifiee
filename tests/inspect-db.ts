import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { user } from "@/lib/db/schema/auth-schema";
import { business } from "@/lib/db/schema/business";
import { manufacturerTable } from "@/lib/db/schema/manufacturer";
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer";
import { offeringsTable, offeringTypesTable } from "@/lib/db/schema/offering";
import { designerServiceTable } from "@/lib/db/schema/designer-service";
import { businessRequirementsTable } from "@/lib/db/schema/business-requirement";
import { businessOrdersTable } from "@/lib/db/schema/business-order";
import { businessHiredServiceTable } from "@/lib/db/schema/business-hired-service";
import { vendorFacilitiesTable } from "@/lib/db/schema/vendor-facility";
import { vendorQuotationsTable } from "@/lib/db/schema/vendor-quotation";
import { vendorInquiriesTable } from "@/lib/db/schema/vendor-inquiry";
import { vendorReviewsTable } from "@/lib/db/schema/vendor-review";
import { aiDocumentsTable } from "@/lib/db/schema/ai-document";

function maskEmail(email: string) {
    const parts = email.split("@");
    if (parts.length !== 2) return "***";
    const name = parts[0];
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    return `${maskedName}@${parts[1]}`;
}

async function inspectDb() {
    console.log("=== UNIFIÉE READ-ONLY DATABASE AUDIT ===");

    const tables = [
        { name: "user", table: "user" },
        { name: "account", table: "account" },
        { name: "session", table: "session" },
        { name: "business", table: "business" },
        { name: "manufacturer", table: "manufacturer" },
        { name: "packaging_designers", table: "packaging_designers" },
        { name: "offering_types", table: "offering_types" },
        { name: "offerings", table: "offerings" },
        { name: "offering_price_tiers", table: "offering_price_tiers" },
        { name: "offering_images", table: "offering_images" },
        { name: "designer_services", table: "designer_services" },
        { name: "business_requirements", table: "business_requirements" },
        { name: "business_orders", table: "business_orders" },
        { name: "business_order_items", table: "business_order_items" },
        { name: "business_hired_services", table: "business_hired_services" },
        { name: "vendor_facilities", table: "vendor_facilities" },
        { name: "order_fulfillment_milestones", table: "order_fulfillment_milestones" },
        { name: "order_shipments", table: "order_shipments" },
        { name: "vendor_inquiries", table: "vendor_inquiries" },
        { name: "vendor_quotations", table: "vendor_quotations" },
        { name: "vendor_reviews", table: "vendor_reviews" },
        { name: "vendor_invoices", table: "vendor_invoices" },
        { name: "vendor_payout_accounts", table: "vendor_payout_accounts" },
        { name: "ai_documents", table: "ai_documents" },
    ];

    console.log("\n--- TABLE ROW COUNTS ---");
    for (const t of tables) {
        try {
            const res = await db.execute(sql.raw(`SELECT count(*)::int as cnt FROM "${t.table}"`));
            const count = (res.rows[0] as any)?.cnt ?? 0;
            console.log(`${t.name.padEnd(30)}: ${count}`);
        } catch (e: any) {
            console.log(`${t.name.padEnd(30)}: [TABLE NOT CREATED OR ERROR: ${e?.message}]`);
        }
    }

    console.log("\n--- EXISTING USERS & ROLES (MASKED) ---");
    const users = await db.select().from(user);
    for (const u of users) {
        const bus = await db.select().from(business).where(sql`user_id = ${u.id}`);
        const mfg = await db.select().from(manufacturerTable).where(sql`user_id = ${u.id}`);
        const des = await db.select().from(packagingDesignerTable).where(sql`user_id = ${u.id}`);
        const roles = [
            bus.length ? `business (${bus[0].businessName})` : null,
            mfg.length ? `manufacturer (${mfg[0].companyName})` : null,
            des.length ? `designer (${des[0].fullName})` : null,
        ].filter(Boolean);

        console.log(`User ID: ${u.id.slice(0, 8)}... | Email: ${maskEmail(u.email)} | Name: ${u.name} | Roles: ${roles.join(", ") || "No role (unregistered/onboarding)"}`);
    }

    console.log("\n--- SEED_TAG CHECK (EXISTING '[SEED]' OCCURRENCES) ---");
    const seedTag = "[SEED]";
    let seedCount = 0;
    try {
        const uSeed = await db.execute(sql`SELECT count(*)::int as c FROM "user" WHERE name LIKE '%[SEED]%' OR email LIKE '%[SEED]%'`);
        console.log(`Users with [SEED]: ${(uSeed.rows[0] as any)?.c}`);
        seedCount += Number((uSeed.rows[0] as any)?.c || 0);

        const bSeed = await db.execute(sql`SELECT count(*)::int as c FROM "business" WHERE businessname LIKE '%[SEED]%'`);
        console.log(`Businesses with [SEED]: ${(bSeed.rows[0] as any)?.c}`);
        seedCount += Number((bSeed.rows[0] as any)?.c || 0);

        const mSeed = await db.execute(sql`SELECT count(*)::int as c FROM "manufacturer" WHERE companyname LIKE '%[SEED]%'`);
        console.log(`Manufacturers with [SEED]: ${(mSeed.rows[0] as any)?.c}`);
        seedCount += Number((mSeed.rows[0] as any)?.c || 0);

        const dSeed = await db.execute(sql`SELECT count(*)::int as c FROM "packaging_designers" WHERE full_name LIKE '%[SEED]%'`);
        console.log(`Designers with [SEED]: ${(dSeed.rows[0] as any)?.c}`);
        seedCount += Number((dSeed.rows[0] as any)?.c || 0);
    } catch (e: any) {
        console.log("Error checking seed tag:", e.message);
    }

    console.log(`\nTotal existing seed rows found: ${seedCount}`);
    process.exit(0);
}

inspectDb().catch((e) => {
    console.error("Audit error:", e);
    process.exit(1);
});
