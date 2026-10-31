import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { manufacturerTable } from "@/lib/db/schema/manufacturer";
import { eq } from "drizzle-orm";
import { generateText, Output } from "ai";
import { executeWithFallback, MODEL_IDS } from "@/lib/ai/models";
import { checkAiBudget } from "@/lib/ai/rate-limit";
import { stripPii } from "@/lib/ai/privacy";
import { isRateLimitOrQuotaError } from "@/lib/ai/errors";
import {
    getFallbackVendorSuggestion,
    getFallbackSpecsAudit,
} from "@/lib/ai/fallbacks";
import {
    buildVendorAssistPrompt,
    buildVendorDetailsCheckPrompt,
    vendorSuggestionSchema,
    vendorDetailsCheckSchema,
} from "@/lib/ai/prompts/vendor-assist";
import { logAiUsage } from "@/lib/ai/logger";
import { z } from "zod";

const vendorAssistSchema = z.object({
    mode: z.enum(["improve_description", "suggest_title", "check_specs"]),
    title: z.string().max(300).optional().default(""),
    description: z.string().max(4000).optional().default(""),
    category: z.string().max(200).optional().default(""),
    material: z.string().max(200).optional().default(""),
    size: z.string().max(200).optional().default(""),
});

export async function POST(req: Request) {
    const startTime = Date.now();
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const vendorRows = await db
            .select({ id: manufacturerTable.id })
            .from(manufacturerTable)
            .where(eq(manufacturerTable.userId, userId))
            .limit(1);

        if (vendorRows.length === 0) {
            return NextResponse.json(
                { error: "Only packaging manufacturers can use Vendor AI Assist." },
                { status: 403 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const parseResult = vendorAssistSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.issues[0]?.message || "Invalid request parameters." },
                { status: 400 }
            );
        }

        const { mode } = parseResult.data;
        const title = stripPii(parseResult.data.title);
        const description = stripPii(parseResult.data.description);
        const category = stripPii(parseResult.data.category);
        const material = stripPii(parseResult.data.material);
        const size = stripPii(parseResult.data.size);

        const budget = checkAiBudget(userId);
        if (!budget.allowed) {
            // Free-tier limit reached: gracefully serve standard production fallback instead of throwing error
            if (mode === "check_specs") {
                return NextResponse.json({
                    audit: getFallbackSpecsAudit({ title, category, description, material }),
                    fallback: true,
                    isQuota: true,
                });
            }

            return NextResponse.json({
                suggestion: getFallbackVendorSuggestion(mode, { title, description, category, material, size }),
                fallback: true,
                isQuota: true,
                remainingDaily: 0,
            });
        }

        // Check missing technical specifications
        if (mode === "check_specs") {
            const systemPrompt = buildVendorDetailsCheckPrompt({
                title,
                description: description || `${title} in ${category}`,
                category,
            });

            const result = await executeWithFallback("field_suggestions", async (route) => {
                return generateText({
                    model: route.model,
                    system: systemPrompt,
                    prompt: `Audit this offering: Title: "${title}", Category: "${category}", Description: "${description}", Material: "${material}"`,
                    output: Output.object({ schema: vendorDetailsCheckSchema }),
                    temperature: route.temperature,
                    maxOutputTokens: route.maxOutputTokens,
                });
            });

            logAiUsage({
                task: "field_suggestions",
                provider: "google",
                modelId: MODEL_IDS.GEMINI_FLASH,
                latencyMs: Date.now() - startTime,
                status: "success",
                userId,
            });

            return NextResponse.json({
                audit: result.output,
            });
        }

        // 3. Improve Title or Description
        const systemPrompt = buildVendorAssistPrompt(mode, {
            title,
            description,
            category,
        });

        const promptText =
            mode === "suggest_title"
                ? `Suggest a high-converting, search-optimized B2B catalog title for a ${category} offering. Current title: "${title}". Description: "${description}". Material: "${material}". Size: "${size}".`
                : `Polish and elevate this B2B packaging description for commercial buyers. Current title: "${title}". Current description: "${description}". Material: "${material}". Size: "${size}".`;

        const result = await executeWithFallback("field_suggestions", async (route) => {
            return generateText({
                model: route.model,
                system: systemPrompt,
                prompt: promptText,
                output: Output.object({ schema: vendorSuggestionSchema }),
                temperature: route.temperature,
                maxOutputTokens: route.maxOutputTokens,
            });
        });

        logAiUsage({
            task: "field_suggestions",
            provider: "google",
            modelId: MODEL_IDS.GEMINI_FLASH,
            latencyMs: Date.now() - startTime,
            tokens: {
                prompt: result.usage?.inputTokens,
                completion: result.usage?.outputTokens,
                total: result.usage?.totalTokens,
            },
            status: "success",
            userId,
        });

        return NextResponse.json({
            suggestion: result.output,
            remainingDaily: budget.remainingDaily,
        });
    } catch (error: unknown) {
        console.warn("[VENDOR_ASSIST_GRACEFUL_FALLBACK]", error);
        logAiUsage({
            task: "field_suggestions",
            provider: "google",
            modelId: MODEL_IDS.GEMINI_FLASH,
            latencyMs: Date.now() - startTime,
            status: "fallback",
            error: String(error),
        });

        const isQuota = isRateLimitOrQuotaError(error);

        try {
            const body = await req.clone().json().catch(() => ({}));
            const mode = body.mode || "suggest_title";
            if (mode === "check_specs") {
                return NextResponse.json({
                    audit: getFallbackSpecsAudit(body),
                    fallback: true,
                    isQuota,
                });
            }
            return NextResponse.json({
                suggestion: getFallbackVendorSuggestion(mode, body),
                fallback: true,
                isQuota,
                remainingDaily: 0,
            });
        } catch {
            return NextResponse.json({
                suggestion: getFallbackVendorSuggestion("suggest_title", {}),
                fallback: true,
                isQuota,
                remainingDaily: 0,
            });
        }
    }
}
