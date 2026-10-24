import { config } from "dotenv";
config({ path: ".env.local" });

import { generateText } from "ai";
import { mistralProvider, googleProvider, MODEL_IDS } from "../src/lib/ai/models";

async function testProviders() {
    console.log("=== TESTING AI PROVIDERS ===");

    // 1. Test Mistral
    console.log(`\n[1/2] Testing Mistral (${MODEL_IDS.MISTRAL_CHAT})...`);
    try {
        const start = Date.now();
        const { text, usage } = await generateText({
            model: mistralProvider(MODEL_IDS.MISTRAL_CHAT),
            prompt: "Respond with exactly: 'Mistral connection verified.'",
        });
        console.log(`✓ Mistral response in ${Date.now() - start}ms: "${text.trim()}"`);
        console.log(`  Usage: ${usage.totalTokens} tokens`);
    } catch (error) {
        console.error("✗ Mistral failed:", error instanceof Error ? error.message : error);
    }

    // 2. Test Gemini Flash
    console.log(`\n[2/2] Testing Gemini Flash (${MODEL_IDS.GEMINI_FLASH})...`);
    try {
        const start = Date.now();
        const { text, usage } = await generateText({
            model: googleProvider(MODEL_IDS.GEMINI_FLASH),
            prompt: "Respond with exactly: 'Gemini connection verified.'",
        });
        console.log(`✓ Gemini response in ${Date.now() - start}ms: "${text.trim()}"`);
        console.log(`  Usage: ${usage.totalTokens} tokens`);
    } catch (error) {
        console.error("✗ Gemini failed:", error instanceof Error ? error.message : error);
    }

    console.log("\n============================");
}

testProviders();
