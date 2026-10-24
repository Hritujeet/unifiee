import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { business } from "@/lib/db/schema/business";
import { businessRequirementsTable } from "@/lib/db/schema/business-requirement";
import { aiDocumentsTable } from "@/lib/db/schema/ai-document";
import { offeringsTable } from "@/lib/db/schema/offering";
import { reciprocalRankFusion, searchFullText, searchVector, type SessionContext } from "@/lib/ai/retrieval";

const bodySchema = z.object({
    requirementId: z.string().uuid(),
    limit: z.number().int().min(1).max(20).default(10),
});

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) return NextResponse.json({ error: "Invalid request body." }, { status: 400 });

        const [owner] = await db
            .select({ id: business.id })
            .from(business)
            .where(eq(business.userId, session.user.id))
            .limit(1);
        if (!owner) return NextResponse.json({ error: "Requirement not found." }, { status: 404 });

        const [requirement] = await db
            .select({ id: businessRequirementsTable.id, title: businessRequirementsTable.title })
            .from(businessRequirementsTable)
            .where(and(
                eq(businessRequirementsTable.id, parsed.data.requirementId),
                eq(businessRequirementsTable.businessId, owner.id),
            ))
            .limit(1);
        if (!requirement) return NextResponse.json({ error: "Requirement not found." }, { status: 404 });

        const [queryDocument] = await db
            .select({ content: aiDocumentsTable.content, embedding: aiDocumentsTable.embedding })
            .from(aiDocumentsTable)
            .where(and(
                eq(aiDocumentsTable.entityType, "requirement"),
                eq(aiDocumentsTable.entityId, requirement.id),
                eq(aiDocumentsTable.ownerId, owner.id),
                eq(aiDocumentsTable.visibilityScope, "private"),
            ))
            .limit(1);

        if (!queryDocument?.embedding) {
            return NextResponse.json({
                requirementTitle: requirement.title,
                listings: [],
                state: "not_ready",
            });
        }

        const sessionContext: SessionContext = {
            userId: session.user.id,
            role: "business",
            businessId: owner.id,
        };
        const searchLimit = parsed.data.limit * 2;
        const [vectorResults, textResults] = await Promise.all([
            searchVector({
                queryVector: queryDocument.embedding,
                session: sessionContext,
                filters: { entityType: "offer", minSimilarity: 0.35 },
                limit: searchLimit,
            }),
            searchFullText({
                query: queryDocument.content,
                session: sessionContext,
                filters: { entityType: "offer" },
                limit: searchLimit,
            }),
        ]);
        const matches = reciprocalRankFusion(vectorResults, textResults, parsed.data.limit * 2);
        const offeringIds = [...new Set(matches.map((match) => match.entityId))];
        if (!offeringIds.length) {
            return NextResponse.json({ requirementTitle: requirement.title, listings: [], state: "empty" });
        }

        const activeOffers = await db
            .select({
                id: offeringsTable.id,
                title: offeringsTable.title,
                description: offeringsTable.description,
                offeringType: offeringsTable.offeringType,
                minOrderQuantity: offeringsTable.minOrderQuantity,
                city: offeringsTable.city,
                state: offeringsTable.state,
                leadTimeDaysMin: offeringsTable.leadTimeDaysMin,
                leadTimeDaysMax: offeringsTable.leadTimeDaysMax,
            })
            .from(offeringsTable)
            .where(and(
                inArray(offeringsTable.id, offeringIds),
                eq(offeringsTable.status, "active"),
            ));
        const scoreById = new Map(matches.map((match) => [
            match.entityId,
            match.combinedRankScore ?? match.similarityScore,
        ]));

        return NextResponse.json({
            requirementTitle: requirement.title,
            state: "results",
            listings: activeOffers
                .map((offer) => ({
                    ...offer,
                    matchScore: scoreById.get(offer.id) ?? 0,
                    whyMatched: "Matches your packaging type, material, or production requirements.",
                }))
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, parsed.data.limit),
        });
    } catch (error) {
        console.error("[REQUIREMENT_SEARCH_VENDORS]", error);
        return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
    }
}
