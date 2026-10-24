import { config } from "dotenv";
config({ path: ".env.local" });

async function checkMistralRaw() {
    const key = process.env.MISTRAL_API_KEY;
    console.log("Mistral key prefix:", key ? key.slice(0, 10) + "..." : "NONE");

    try {
        const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`,
            },
            body: JSON.stringify({
                model: "mistral-small-latest",
                messages: [{ role: "user", content: "Hi" }],
                max_tokens: 10,
            }),
        });

        console.log("Status:", res.status, res.statusText);
        console.log("Headers:");
        for (const [k, v] of res.headers.entries()) {
            if (k.includes("ratelimit") || k.includes("retry")) {
                console.log(`  ${k}: ${v}`);
            }
        }
        const body = await res.text();
        console.log("Body:", body);
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

checkMistralRaw();
