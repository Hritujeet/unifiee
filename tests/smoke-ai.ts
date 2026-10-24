import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testProviders() {
    let geminiOk = false;
    let mistralOk = false;

    console.log("Testing Google Generative AI (gemini-2.5-flash)...");
    try {
        const geminiRes = await generateText({
            model: google("gemini-2.5-flash"),
            prompt: "Say 'Hello World' in two words.",
            maxOutputTokens: 200,
        });
        console.log("Gemini answered:", geminiRes.text.trim());
        if (geminiRes.text.trim()) geminiOk = true;
    } catch (e: any) {
        console.error("Gemini call failed:", e?.message || e);
    }

    console.log("Waiting 3s to respect Mistral 1-req/sec rate limits...");
    await sleep(3000);

    console.log("Testing Mistral AI (mistral-small-latest)...");
    try {
        const mistralRes = await generateText({
            model: mistral("mistral-small-latest"),
            prompt: "Say 'Hello World' in two words.",
            maxOutputTokens: 50,
        });
        console.log("Mistral answered:", mistralRes.text.trim());
        if (mistralRes.text.trim()) mistralOk = true;
    } catch (e: any) {
        console.error("Mistral call failed:", e?.message || e);
    }

    if (geminiOk && mistralOk) {
        console.log("AI Smoke Check: ALL_PASSED");
        process.exit(0);
    } else {
        console.error(`AI Smoke Check Status: Gemini=${geminiOk}, Mistral=${mistralOk}`);
        process.exit(geminiOk || mistralOk ? 0 : 1);
    }
}

testProviders();
