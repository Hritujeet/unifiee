import { config } from "dotenv";
config({ path: ".env.local" });

import { generateText, Output } from "ai";
import { EVAL_CASES } from "../src/lib/ai/evals/cases";
import { googleProvider, MODEL_IDS } from "../src/lib/ai/models";
import {
    aiRequirementOutputSchema,
    buildRequirementBuilderSystemPrompt,
} from "../src/lib/ai/prompts/requirement-builder";
import {
    briefChecklistOutputSchema,
    buildBriefChecklistPrompt,
} from "../src/lib/ai/prompts/designer-assist";

async function runEvals() {
    console.log("==========================================");
    console.log("   UNIFIÉE AI EVALUATION SUITE            ");
    console.log("==========================================");

    const results: Array<{
        id: string;
        feature: string;
        provider: string;
        model: string;
        status: "PASS" | "FAIL" | "SKIPPED";
        latencyMs: number;
        notes?: string;
    }> = [];

    // Test 3 essential cases across Requirement Builder and Designer Assist
    for (const testCase of [EVAL_CASES[0], EVAL_CASES[1], EVAL_CASES[7]]) {
        console.log(`\nEvaluating: ${testCase.id} (${testCase.feature})...`);
        const start = Date.now();

        try {
            if (testCase.feature === "requirement_builder") {
                const res = await generateText({
                    model: googleProvider(MODEL_IDS.GEMINI_FLASH),
                    output: Output.object({ schema: aiRequirementOutputSchema }),
                    system: buildRequirementBuilderSystemPrompt(),
                    prompt: testCase.input,
                    abortSignal: AbortSignal.timeout(15000),
                });

                const object = res.output;
                const latency = Date.now() - start;
                console.log(`✓ Completed in ${latency}ms:`, {
                    title: object.title,
                    use: object.packagingUse,
                    type: object.packagingType,
                    quantity: object.quantity,
                    branding: object.brandingNeeded,
                });

                results.push({
                    id: testCase.id,
                    feature: testCase.feature,
                    provider: "google",
                    model: MODEL_IDS.GEMINI_FLASH,
                    status: "PASS",
                    latencyMs: latency,
                    notes: `Extracted title: "${object.title}" with confidence ${object.confidenceScore}`,
                });
            } else if (testCase.feature === "designer_assist") {
                const res = await generateText({
                    model: googleProvider(MODEL_IDS.GEMINI_FLASH),
                    output: Output.object({ schema: briefChecklistOutputSchema }),
                    system: buildBriefChecklistPrompt({ briefText: testCase.input }),
                    prompt: "Extract checklist from this brief.",
                    abortSignal: AbortSignal.timeout(15000),
                });

                const object = res.output;
                const latency = Date.now() - start;
                console.log(`✓ Completed in ${latency}ms: extracted ${object.deliverablesChecklist?.length} items`);

                results.push({
                    id: testCase.id,
                    feature: testCase.feature,
                    provider: "google",
                    model: MODEL_IDS.GEMINI_FLASH,
                    status: "PASS",
                    latencyMs: latency,
                    notes: `Extracted ${object.deliverablesChecklist?.length} checklist deliverables`,
                });
            }
        } catch (error) {
            console.error("✗ Failed:", error);
            results.push({
                id: testCase.id,
                feature: testCase.feature,
                provider: "google",
                model: MODEL_IDS.GEMINI_FLASH,
                status: "FAIL",
                latencyMs: Date.now() - start,
                notes: error instanceof Error ? error.message : String(error),
            });
        }
    }

    console.log("\n==========================================");
    console.log("            EVALUATION RESULTS            ");
    console.log("==========================================");
    console.table(results);
}

runEvals().catch(console.error);
