import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { business } from "@/lib/db/schema/business";
import { businessRequirementsTable } from "@/lib/db/schema/business-requirement";
import { designerServiceTable } from "@/lib/db/schema/designer-service";
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer";
import { and, eq, inArray } from "drizzle-orm";
import { buildRequirementTemplate } from "@/lib/ai/embeddings";
import { searchHybrid } from "@/lib/ai/retrieval";
import type { SessionContext } from "@/lib/ai/retrieval";
import { z } from "zod";

const bodySchema = z.object({
    requirementId: z.string().uuid(),
    limit: z.number().int().min(1).max(20).optional().default(10),
});

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const parsed = bodySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
        }
        const { requirementId, limit } = parsed.data;

        // Verify the requirement belongs to this user business
        const [businessProfile] = await db
            .select({ id: business.id })
            .from(business)
            .where(eq(business.userId, session.user.id))
            .limit(1);

        if (!businessProfile) {
            return NextResponse.json({ error: "No business profile found." }, { status: 403 });
        }

        const [requirement] = await db
            .select()
            .from(businessRequirementsTable)
            .where(
                and(
                    eq(businessRequirementsTable.id, requirementId),
                    eq(businessRequirementsTable.businessId, businessProfile.id)
                )
            )
            .limit(1);

        if (!requirement) {
            return NextResponse.json({ error: "Requirement not found or access denied." }, { status: 404 });
        }

        // Build semantic query text from requirement fields
        const queryText = buildRequirementTemplate({
            title: requirement.title,
            packagingUse: requirement.packagingUse,
            packagingType: requirement.packagingType,
            quantity: requirement.quantity,
            size: requirement.size,
            material: requirement.material,
            brandingNeeded: requirement.brandingNeeded,
            deliveryLocation: requirement.deliveryLocation,
            requiredByDate: requirement.requiredByDate,
            rawDescription: requirement.rawDescription,
        });

        const sessionContext: SessionContext = {
            userId: session.user.id,
            role: "business",
            businessId: businessProfile.id,
        };

        // Hybrid retrieval: vector cosine + GIN full-text, fused via RRF
        const matches = await searchHybrid({
            query: queryText,
            session: sessionContext,
            filters: {
                entityType: "gig",
                minSimilarity: 0.30,
            },
            limit,
        });

        if (matches.length === 0) {
            return NextResponse.json({ requirementTitle: requirement.title, listings: [] });
        }

        const matchedServiceIds = [...new Set(matches.map((m) => m.entityId))];

        const services = await db
            .select({
                serviceId: designerServiceTable.id,
                serviceTitle: designerServiceTable.title,
                description: designerServiceTable.description,
                serviceType: designerServiceTable.serviceType,
                pricingModel: designerServiceTable.pricingModel,
                price: designerServiceTable.price,
                turnaroundDays: designerServiceTable.turnaroundDays,
                revisionsIncluded: designerServiceTable.revisionsIncluded,
                deliverables: designerServiceTable.deliverables,
                sampleImages: designerServiceTable.sampleImages,
                designerId: packagingDesignerTable.id,
                designerName: packagingDesignerTable.displayName,
                fullName: packagingDesignerTable.fullName,
                email: packagingDesignerTable.email,
                headline: packagingDesignerTable.headline,
                city: packagingDesignerTable.city,
                state: packagingDesignerTable.state,
                profilePhotoUrl: packagingDesignerTable.profilePhotoUrl,
                availabilityStatus: packagingDesignerTable.availabilityStatus,
                isVerified: packagingDesignerTable.isVerified,
                specializations: packagingDesignerTable.packagingDesignSpecializations,
            })
            .from(designerServiceTable)
            .innerJoin(packagingDesignerTable, eq(designerServiceTable.designerId, packagingDesignerTable.id))
            .where(
                and(
                    inArray(designerServiceTable.id, matchedServiceIds),
                    eq(designerServiceTable.status, "active"),
                    eq(packagingDesignerTable.isActive, true)
                )
            );

        const scoreByServiceId = new Map(
            matches.map((m) => [m.entityId, m.combinedRankScore ?? m.similarityScore])
        );

        const ranked = services
            .map((s) => ({
                ...s,
                designerName: s.designerName || s.fullName,
                specializations:
                    s.specializations && s.specializations.length > 0
                        ? s.specializations
                        : [s.serviceType],
                deliverables: s.deliverables ?? [],
                sampleImages: s.sampleImages ?? [],
                matchScore: scoreByServiceId.get(s.serviceId) ?? 0,
            }))
            .sort((a, b) => b.matchScore - a.matchScore);

        return NextResponse.json({
            requirementTitle: requirement.title,
            listings: ranked,
        });
    } catch (error: unknown) {
        console.error("[REQUIREMENT_SEARCH_DESIGNERS]", error);
        return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
    }
}
