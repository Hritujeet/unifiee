import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { business } from "@/lib/db/schema/business";
import { manufacturerTable } from "@/lib/db/schema/manufacturer";
import { packagingDesignerTable } from "@/lib/db/schema/packaging-designer";
import { eq } from "drizzle-orm";
import { streamText } from "ai";
import { executeWithFallback } from "@/lib/ai/models";
import { checkAiBudget } from "@/lib/ai/rate-limit";
import { stripPii } from "@/lib/ai/privacy";
import { searchHybrid, type SessionContext } from "@/lib/ai/retrieval";
import { buildAssistantSystemPrompt } from "@/lib/ai/prompts/assistant";
import { logAiUsage } from "@/lib/ai/logger";
import { z } from "zod";

const assistantRequestSchema = z.object({
    messages: z
        .array(
            z.object({
                role: z.enum(["user", "assistant", "system"]),
                content: z.string().trim().min(1, "Message content cannot be empty").max(4000, "Message content exceeds 4,000 characters limit"),
            })
        )
        .min(1, "At least one message is required")
        .max(20, "Maximum of 20 messages in conversation history allowed"),
});

export async function POST(req: Request) {
    const startTime = Date.now();
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const body = await req.json().catch(() => ({}));
        const parseResult = assistantRequestSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.issues[0]?.message || "Invalid request payload." },
                { status: 400 }
            );
        }

        const incomingMessages = parseResult.data.messages;

        // Determine user role and ID
        const [biz, mfg, des] = await Promise.all([
            db.select({ id: business.id, companyName: business.businessName }).from(business).where(eq(business.userId, userId)).limit(1),
            db.select({ id: manufacturerTable.id, companyName: manufacturerTable.companyName }).from(manufacturerTable).where(eq(manufacturerTable.userId, userId)).limit(1),
            db.select({ id: packagingDesignerTable.id, displayName: packagingDesignerTable.displayName }).from(packagingDesignerTable).where(eq(packagingDesignerTable.userId, userId)).limit(1),
        ]);

        const role: "business" | "manufacturer" | "designer" | "none" =
            biz.length > 0 ? "business" : mfg.length > 0 ? "manufacturer" : des.length > 0 ? "designer" : "none";

        const orgName = biz[0]?.companyName || mfg[0]?.companyName || des[0]?.displayName || "Independent";

        // 1. Enforce free-tier budget limit gracefully
        const budget = checkAiBudget(userId);
        if (!budget.allowed) {
            const roleGreeting =
                role === "business"
                    ? "As a Business buyer, you can post packaging requirements, search verified suppliers, and hire packaging designers directly from your dashboard."
                    : role === "manufacturer"
                    ? "As a Packaging Manufacturer, you can view incoming buyer orders, post packaging offerings, and update order fulfillment stages directly from your workspace."
                    : role === "designer"
                    ? "As a Packaging Designer, you can create and publish design gigs, manage client revisions, and deliver print-ready packaging artwork."
                    : "UNIFIÉE connects food & beverage businesses with verified packaging manufacturers and designers.";

            const fallbackText = `The interactive assistant is currently experiencing peak demand. In the meantime, here is a quick guide:\n\n${roleGreeting}\n\n• For your orders and active jobs, navigate to your workspace orders.\n• For catalog listings and technical specifications, visit the offerings manager.\n\nPlease check back in a minute for full conversational AI support.`;

            return new Response(fallbackText, {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "x-remaining-daily": "0",
                },
            });
        }

        const sessionContext: SessionContext = {
            userId,
            role,
            businessId: biz[0]?.id,
            manufacturerId: mfg[0]?.id,
            designerId: des[0]?.id,
        };

        // Get the latest user message
        const lastUserMsg = [...incomingMessages].reverse().find((m) => m.role === "user");
        const queryText = lastUserMsg?.content || "";
        const cleanQuery = stripPii(queryText);

        // 2. Hybrid RAG retrieval for grounding
        let groundedSources: Array<{ id: string; title: string; content: string; url?: string; similarityScore?: number }> = [];

        if (cleanQuery.trim().length > 3) {
            try {
                const retrievedDocs = await searchHybrid({
                    query: cleanQuery,
                    session: sessionContext,
                    limit: 3,
                });

                groundedSources = retrievedDocs.map((doc) => ({
                    id: doc.id,
                    title: (doc.metadata?.title as string) || `${doc.entityType.toUpperCase()} reference`,
                    content: doc.content.slice(0, 450),
                    url: (doc.metadata?.url as string) || undefined,
                    similarityScore: doc.similarityScore,
                }));
            } catch (err) {
                console.warn("[ASSISTANT_RAG_ERROR]", err);
            }
        }

        // 3. Build Role-Aware System Prompt
        const systemPrompt = buildAssistantSystemPrompt({
            role,
            userName: session.user.name || "User",
            organizationName: orgName,
            groundedSources,
        });

        // Clean user messages and sanitize PII
        const sanitizedHistory = incomingMessages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.role === "user" ? stripPii(m.content) : m.content,
        }));

        // 4. Stream response using dual-provider fallback
        const result = await executeWithFallback("assistant_chat", async (route) => {
            return streamText({
                model: route.model,
                system: systemPrompt,
                messages: sanitizedHistory,
                temperature: route.temperature,
                maxOutputTokens: route.maxOutputTokens,
                onFinish: (ev) => {
                    logAiUsage({
                        task: "assistant_chat",
                        provider: route.provider,
                        modelId: route.modelId,
                        latencyMs: Date.now() - startTime,
                        tokens: {
                            prompt: ev.usage.inputTokens,
                            completion: ev.usage.outputTokens,
                            total: ev.usage.totalTokens,
                        },
                        status: "success",
                        userId,
                    });
                },
            });
        });

        // 5. Return stream with sources metadata header
        const responseHeaders = new Headers();
        responseHeaders.set("Content-Type", "text/plain; charset=utf-8");
        responseHeaders.set("x-remaining-daily", String(budget.remainingDaily));
        if (groundedSources.length > 0) {
            // Encode source summary into header for instant display in chat UI
            const sourcesSummary = groundedSources.map((s) => ({
                id: s.id,
                title: s.title,
                url: s.url,
                similarityScore: s.similarityScore,
                snippet: s.content.slice(0, 160),
            }));
            responseHeaders.set("x-grounded-sources", encodeURIComponent(JSON.stringify(sourcesSummary)));
        }

        return result.toTextStreamResponse({
            headers: responseHeaders,
        });
    } catch (error: unknown) {
        console.warn("[AI_ASSISTANT_GRACEFUL_FALLBACK]", error);
        logAiUsage({
            task: "assistant_chat",
            provider: "google",
            modelId: "unknown",
            latencyMs: Date.now() - startTime,
            status: "fallback",
            error: String(error),
        });

        const fallbackText = "Our AI assistant is temporarily resting due to high demand. Please try again in a few moments, or use the navigation sidebar to access your orders, catalog offerings, or designer marketplace directly.";
        return new Response(fallbackText, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "x-remaining-daily": "0",
            },
        });
    }
}
