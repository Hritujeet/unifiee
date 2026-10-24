import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { business } from "@/lib/db/schema/business";
import { eq } from "drizzle-orm";
import { generateText, Output } from "ai";
import { getModel, MODEL_IDS } from "@/lib/ai/models";
import { checkAiBudget } from "@/lib/ai/rate-limit";
import { stripPii } from "@/lib/ai/privacy";
import {
    aiRequirementOutputSchema,
    buildRequirementBuilderSystemPrompt,
} from "@/lib/ai/prompts/requirement-builder";
import { logAiUsage } from "@/lib/ai/logger";
import { z } from "zod";

const requirementExtractSchema = z.object({
    prompt: z
        .string()
        .trim()
        .min(5, "Please enter a descriptive packaging requirement (at least 5 characters).")
        .max(4000, "Requirement description exceeds maximum limit of 4,000 characters."),
});

export async function POST(req: Request) {
    const startTime = Date.now();
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Check user budget
        const budget = checkAiBudget(userId);
        if (!budget.allowed) {
            return NextResponse.json(
                { error: budget.reason || "Rate limit reached. Please wait a moment." },
                { status: 429 }
            );
        }

        // Check business authorization
        const businessRows = await db
            .select({ id: business.id })
            .from(business)
            .where(eq(business.userId, userId))
            .limit(1);

        if (businessRows.length === 0) {
            return NextResponse.json(
                { error: "Only business accounts can use the AI Requirement Builder." },
                { status: 403 }
            );
        }

        const body = await req.json().catch(() => ({}));
        const parseResult = requirementExtractSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.issues[0]?.message || "Invalid requirement prompt." },
                { status: 400 }
            );
        }

        const rawPrompt = parseResult.data.prompt;

        const cleanPrompt = stripPii(rawPrompt);
        const route = getModel("requirement_builder");

        // Structured Extraction via Gemini Flash
        const result = await generateText({
            model: route.model,
            system: buildRequirementBuilderSystemPrompt(),
            prompt: `Analyze the following business packaging requirement and extract the structured specification:\n\n"${cleanPrompt}"`,
            output: Output.object({ schema: aiRequirementOutputSchema }),
            temperature: route.temperature,
            maxOutputTokens: route.maxOutputTokens,
        });

        const structured = result.output;

        logAiUsage({
            task: "requirement_builder",
            provider: route.provider,
            modelId: route.modelId,
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
            structured,
            remainingDaily: budget.remainingDaily,
        });
    } catch (error: unknown) {
        console.error("[REQUIREMENT_EXTRACT_ERROR]", error);
        logAiUsage({
            task: "requirement_builder",
            provider: "google",
            modelId: MODEL_IDS.GEMINI_FLASH,
            latencyMs: Date.now() - startTime,
            status: "error",
            error: String(error),
        });

        return NextResponse.json(
            { error: "Failed to extract packaging requirement. Please try rephrasing your request." },
            { status: 500 }
        );
    }
}
