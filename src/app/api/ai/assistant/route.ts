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

export async function POST(req: Request) {
    const startTime = Date.now();
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Enforce free-tier budget limit
        const budget = checkAiBudget(userId);
        if (!budget.allowed) {
            return NextResponse.json(
                { error: budget.reason || "AI rate limit reached. Please wait." },
                { status: 429 }
            );
        }

        const body = await req.json();
        const incomingMessages: Array<{ role: "user" | "assistant" | "system"; content: string }> =
            body.messages || [];

        if (incomingMessages.length === 0) {
            return NextResponse.json({ error: "No messages provided." }, { status: 400 });
        }

        // Determine user role and ID
        const [biz, mfg, des] = await Promise.all([
            db.select({ id: business.id, companyName: business.businessName }).from(business).where(eq(business.userId, userId)).limit(1),
            db.select({ id: manufacturerTable.id, companyName: manufacturerTable.companyName }).from(manufacturerTable).where(eq(manufacturerTable.userId, userId)).limit(1),
            db.select({ id: packagingDesignerTable.id, displayName: packagingDesignerTable.displayName }).from(packagingDesignerTable).where(eq(packagingDesignerTable.userId, userId)).limit(1),
        ]);

        const role: "business" | "manufacturer" | "designer" | "none" =
            biz.length > 0 ? "business" : mfg.length > 0 ? "manufacturer" : des.length > 0 ? "designer" : "none";

        const orgName = biz[0]?.companyName || mfg[0]?.companyName || des[0]?.displayName || "Independent";

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
        console.error("[AI_ASSISTANT_ROUTE_ERROR]", error);
        logAiUsage({
            task: "assistant_chat",
            provider: "google",
            modelId: "unknown",
            latencyMs: Date.now() - startTime,
            status: "error",
            error: String(error),
        });

        return NextResponse.json(
            { error: "An unexpected error occurred while processing your request. Please try again." },
            { status: 500 }
        );
    }
}
