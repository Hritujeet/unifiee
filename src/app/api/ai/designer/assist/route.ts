import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer";
import { eq } from "drizzle-orm";
import { generateText, Output } from "ai";
import { executeWithFallback, MODEL_IDS } from "@/lib/ai/models";
import { checkAiBudget } from "@/lib/ai/rate-limit";
import { stripPii } from "@/lib/ai/privacy";
import { isRateLimitOrQuotaError } from "@/lib/ai/errors";
import {
    getFallbackGigCreation,
    getFallbackDesignerBio,
    getFallbackDeliveryHelper,
} from "@/lib/ai/fallbacks";
import {
    buildGigCreationPrompt,
    buildDesignerBioPrompt,
    buildSmartReplyPrompt,
    buildBriefChecklistPrompt,
    buildDeliveryMessagePrompt,
    gigCreationOutputSchema,
    designerBioOutputSchema,
    smartReplyOutputSchema,
    briefChecklistOutputSchema,
    deliveryHelperOutputSchema,
} from "@/lib/ai/prompts/designer-assist";
import { logAiUsage } from "@/lib/ai/logger";
import { z } from "zod";

const designerAssistSchema = z.object({
    mode: z.enum([
        "gig_creator",
        "bio_writer",
        "smart_reply",
        "brief_checklist",
        "delivery_helper",
    ]),
    rawNotes: z.string().max(2000).optional(),
    category: z.string().max(200).optional(),
    specialization: z.string().max(200).optional(),
    specialties: z.array(z.string().max(100)).max(20).optional(),
    tools: z.array(z.string().max(100)).max(20).optional(),
    roughNotes: z.string().max(2000).optional(),
    experienceYears: z.union([z.number(), z.string()]).optional(),
    clientMessage: z.string().max(4000).optional(),
    projectContext: z.string().max(4000).optional(),
    briefText: z.string().max(4000).optional(),
    serviceTitle: z.string().max(300).optional(),
    clientName: z.string().max(200).optional(),
    orderNumber: z.string().max(100).optional(),
    deliveryNotes: z.string().max(4000).optional(),
    isRevision: z.boolean().optional(),
});

export async function POST(req: Request) {
    const startTime = Date.now();
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const designerRows = await db
            .select({ id: packagingDesignerTable.id, displayName: packagingDesignerTable.displayName })
            .from(packagingDesignerTable)
            .where(eq(packagingDesignerTable.userId, userId))
            .limit(1);

        if (designerRows.length === 0) {
            return NextResponse.json(
                { error: "Only packaging designers can use Designer Studio AI." },
                { status: 403 }
            );
        }

        const designer = designerRows[0];
        const body = await req.json().catch(() => ({}));
        const parseResult = designerAssistSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.issues[0]?.message || "Invalid request parameters." },
                { status: 400 }
            );
        }

        const { mode } = parseResult.data;

        const budget = checkAiBudget(userId);
        if (!budget.allowed) {
            // Free-tier AI budget reached: gracefully serve standard production fallback
            if (mode === "gig_creator") {
                return NextResponse.json({
                    gig: getFallbackGigCreation({
                        rawNotes: body.rawNotes,
                        category: body.category,
                        specialization: body.specialization,
                    }),
                    fallback: true,
                    isQuota: true,
                    remainingDaily: 0,
                });
            }
            if (mode === "bio_writer") {
                return NextResponse.json({
                    bio: getFallbackDesignerBio({
                        specialties: body.specialties,
                        tools: body.tools,
                        experienceYears: body.experienceYears,
                        roughNotes: body.roughNotes,
                    }),
                    fallback: true,
                    isQuota: true,
                    remainingDaily: 0,
                });
            }
            if (mode === "delivery_helper") {
                return NextResponse.json({
                    deliveryNote: getFallbackDeliveryHelper({
                        orderNumber: body.orderNumber,
                        serviceTitle: body.serviceTitle,
                        clientName: body.clientName,
                        deliveryNotes: body.deliveryNotes,
                        isRevision: body.isRevision,
                    }),
                    fallback: true,
                    isQuota: true,
                    remainingDaily: 0,
                });
            }
        }

        // 1. Gig Creation Assistant
        if (mode === "gig_creator") {
            const rawNotes = stripPii(body.rawNotes || "");
            const category = stripPii(body.category || "packaging_design");
            const specialization = stripPii(body.specialization || "");

            const systemPrompt = buildGigCreationPrompt({
                category,
                rawNotes: rawNotes || "Premium packaging design service",
                specialization,
            });

            const result = await executeWithFallback("gig_creation_assist", async (route) => {
                return generateText({
                    model: route.model,
                    system: systemPrompt,
                    prompt: `Create a Fiverr-style packaging gig listing. Designer Concept Notes: "${rawNotes}"`,
                    output: Output.object({ schema: gigCreationOutputSchema }),
                    temperature: route.temperature,
                    maxOutputTokens: route.maxOutputTokens,
                });
            });

            logAiUsage({
                task: "gig_creation_assist",
                provider: "google",
                modelId: MODEL_IDS.GEMINI_FLASH,
                latencyMs: Date.now() - startTime,
                status: "success",
                userId,
            });

            return NextResponse.json({ gig: result.output, remainingDaily: budget.remainingDaily });
        }

        // 2. Profile Bio Writer
        if (mode === "bio_writer") {
            const specialties = parseResult.data.specialties || ["Food Packaging", "Label Design"];
            const tools = parseResult.data.tools || ["Adobe Illustrator", "Photoshop"];
            const roughNotes = stripPii(parseResult.data.roughNotes || "");
            const experienceYears = parseResult.data.experienceYears ? Number(parseResult.data.experienceYears) : undefined;

            const systemPrompt = buildDesignerBioPrompt({
                name: designer.displayName || session.user.name || "Designer",
                experienceYears,
                specialties,
                tools,
                roughNotes,
            });

            const result = await executeWithFallback("profile_bio_writer", async (route) => {
                return generateText({
                    model: route.model,
                    system: systemPrompt,
                    prompt: `Write a compelling portfolio bio for my designer profile. Notes: "${roughNotes}"`,
                    output: Output.object({ schema: designerBioOutputSchema }),
                    temperature: route.temperature,
                    maxOutputTokens: route.maxOutputTokens,
                });
            });

            logAiUsage({
                task: "profile_bio_writer",
                provider: "google",
                modelId: MODEL_IDS.GEMINI_FLASH,
                latencyMs: Date.now() - startTime,
                status: "success",
                userId,
            });

            return NextResponse.json({ bio: result.output, remainingDaily: budget.remainingDaily });
        }

        // 3. Smart Reply Suggestions
        if (mode === "smart_reply") {
            const clientMessage = stripPii(body.clientMessage || "");
            const projectContext = stripPii(body.projectContext || "");

            if (!clientMessage.trim()) {
                return NextResponse.json({ error: "clientMessage is required." }, { status: 400 });
            }

            const systemPrompt = buildSmartReplyPrompt({
                clientMessage,
                projectContext,
                designerName: designer.displayName || "Designer",
            });

            const result = await executeWithFallback("suggested_replies", async (route) => {
                return generateText({
                    model: route.model,
                    system: systemPrompt,
                    prompt: `Generate 3 smart reply suggestions for this client message:\n"${clientMessage}"`,
                    output: Output.object({ schema: smartReplyOutputSchema }),
                    temperature: route.temperature,
                    maxOutputTokens: route.maxOutputTokens,
                });
            });

            logAiUsage({
                task: "suggested_replies",
                provider: "google",
                modelId: MODEL_IDS.GEMINI_FLASH,
                latencyMs: Date.now() - startTime,
                status: "success",
                userId,
            });

            return NextResponse.json({ replies: result.output.replies, remainingDaily: budget.remainingDaily });
        }

        // 4. Brief-to-Checklist Extractor
        if (mode === "brief_checklist") {
            const briefText = stripPii(body.briefText || "");
            const serviceTitle = stripPii(body.serviceTitle || "");

            if (!briefText.trim()) {
                return NextResponse.json({ error: "briefText is required." }, { status: 400 });
            }

            const systemPrompt = buildBriefChecklistPrompt({
                briefText,
                serviceTitle,
            });

            const result = await executeWithFallback("brief_summarization", async (route) => {
                return generateText({
                    model: route.model,
                    system: systemPrompt,
                    prompt: `Extract the full deliverables checklist from this project brief:\n"${briefText}"`,
                    output: Output.object({ schema: briefChecklistOutputSchema }),
                    temperature: route.temperature,
                    maxOutputTokens: route.maxOutputTokens,
                });
            });

            logAiUsage({
                task: "brief_summarization",
                provider: "google",
                modelId: MODEL_IDS.GEMINI_FLASH,
                latencyMs: Date.now() - startTime,
                status: "success",
                userId,
            });

            return NextResponse.json({ checklist: result.output, remainingDaily: budget.remainingDaily });
        }

        // 5. Delivery & Revision Response Helper
        if (mode === "delivery_helper") {
            const serviceTitle = stripPii(body.serviceTitle || "Custom Packaging Artwork");
            const clientName = stripPii(body.clientName || "Client");
            const orderNumber = stripPii(body.orderNumber || "");
            const deliveryNotes = stripPii(body.deliveryNotes || "");
            const isRevision = Boolean(body.isRevision);

            const systemPrompt = buildDeliveryMessagePrompt({
                orderNumber,
                serviceTitle,
                clientName,
                deliveryNotes,
                isRevision,
            });

            const result = await executeWithFallback("delivery_message_helper", async (route) => {
                return generateText({
                    model: route.model,
                    system: systemPrompt,
                    prompt: `Draft a delivery note for this packaging order. Notes: "${deliveryNotes}"`,
                    output: Output.object({ schema: deliveryHelperOutputSchema }),
                    temperature: route.temperature,
                    maxOutputTokens: route.maxOutputTokens,
                });
            });

            logAiUsage({
                task: "delivery_message_helper",
                provider: "google",
                modelId: MODEL_IDS.GEMINI_FLASH,
                latencyMs: Date.now() - startTime,
                status: "success",
                userId,
            });

            return NextResponse.json({ deliveryNote: result.output, remainingDaily: budget.remainingDaily });
        }

        return NextResponse.json({ error: `Unsupported mode: ${mode}` }, { status: 400 });
    } catch (error: unknown) {
        console.warn("[DESIGNER_ASSIST_GRACEFUL_FALLBACK]", error);
        logAiUsage({
            task: "designer_assist",
            provider: "google",
            modelId: MODEL_IDS.GEMINI_FLASH,
            latencyMs: Date.now() - startTime,
            status: "fallback",
            error: String(error),
        });

        const isQuota = isRateLimitOrQuotaError(error);

        try {
            const body = await req.clone().json().catch(() => ({}));
            const mode = body.mode || "gig_creator";

            if (mode === "gig_creator") {
                return NextResponse.json({
                    gig: getFallbackGigCreation(body),
                    fallback: true,
                    isQuota,
                    remainingDaily: 0,
                });
            }
            if (mode === "bio_writer") {
                return NextResponse.json({
                    bio: getFallbackDesignerBio(body),
                    fallback: true,
                    isQuota,
                    remainingDaily: 0,
                });
            }
            if (mode === "delivery_helper") {
                return NextResponse.json({
                    deliveryNote: getFallbackDeliveryHelper(body),
                    fallback: true,
                    isQuota,
                    remainingDaily: 0,
                });
            }
            return NextResponse.json({
                gig: getFallbackGigCreation(body),
                fallback: true,
                isQuota,
                remainingDaily: 0,
            });
        } catch {
            return NextResponse.json({
                gig: getFallbackGigCreation({}),
                fallback: true,
                isQuota,
                remainingDaily: 0,
            });
        }
    }
}
