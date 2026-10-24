/**
 * Prompt Templates: Vendor Offering Assistance (Inline Field-Level Assist)
 * Version: 1.0.0
 */

import { z } from "zod";

export const VENDOR_ASSIST_VERSION = "1.0.0";

export const vendorSuggestionSchema = z.object({
    suggestedText: z.string().describe("The improved, polished copy to replace or fill the field."),
    rationale: z.string().describe("Brief 1-sentence explanation of why this suggestion improves buyer clarity or conversion."),
    highlightedChanges: z.array(z.string()).describe("List of key technical or commercial improvements made (e.g. 'Added food-grade GSM spec', 'Clarified lead time')."),
});

export type VendorSuggestion = z.infer<typeof vendorSuggestionSchema>;

export const vendorDetailsCheckSchema = z.object({
    isComplete: z.boolean().describe("True if all critical buyer specifications are covered."),
    presentDetails: z.array(z.string()).describe("List of essential specs found in the text."),
    missingBuyerQuestions: z.array(z.string()).describe("Specific questions packaging buyers typically ask that are missing (e.g. 'Is it microwave-safe?', 'What is the board GSM?')."),
    suggestedAdditions: z.string().describe("A suggested paragraph incorporating the missing details to add to the description."),
});

export type VendorDetailsCheck = z.infer<typeof vendorDetailsCheckSchema>;

export function buildVendorAssistPrompt(mode: "improve_description" | "suggest_title" | "simplify_wording", context: { title?: string; description?: string; category?: string }): string {
    return `<role>
You are an expert B2B packaging copywriter assisting an Indian packaging manufacturer/supplier.
Your task is to refine product listing copy so F&B brands understand technical specifications quickly.
</role>

<context>
Assist Mode: ${mode}
Category: ${context.category || "General Packaging"}
Current Title: ${context.title || "Untitled"}
Current Description: ${context.description || "None provided"}
Version: ${VENDOR_ASSIST_VERSION}
</context>

<rules>
1. NEVER DECIDE PRICING: Do not modify or guess prices or commercial payment terms. Focus purely on technical clarity, substrate quality, and durability.
2. B2B TONE: Factual, professional, concise. Avoid generic fluff like "the best quality ever". Use industry-standard terms (GSM, corrugated fluting, PLA lining, food-grade virgin kraft).
3. EXPLICIT CONSENT: The output is an optional suggestion that the vendor will review in a before/after view.
4. RETURN FORMAT: Return strictly JSON matching the schema.
</rules>

<examples>
<example>
Input Title: "Burger boxes"
Input Description: "brown boxes for takeaway burgers good quality"
Output:
{
  "suggestedText": "Heavy-duty 320 GSM virgin kraft burger clamshell boxes designed for hot, greasy takeaway. Features built-in ventilation tabs to prevent sogginess and oil-resistant food-safe lining. 100% biodegradable and compostable.",
  "rationale": "Added specific board weight (320 GSM), oil-resistance, and ventilation specs that food brands require.",
  "highlightedChanges": ["Specified 320 GSM board", "Added grease-resistant coating detail", "Clarified ventilation tabs"]
}
</example>
</examples>`;
}

export function buildVendorDetailsCheckPrompt(context: { title?: string; description: string; category?: string }): string {
    return `<role>
You are an F&B packaging procurement auditor.
Analyze the vendor's catalog listing description to check if it answers all common questions food brands ask before ordering.
</role>

<context>
Category: ${context.category || "General Packaging"}
Title: ${context.title || ""}
Description: ${context.description}
</context>

<rules>
Check for:
1. Substrate / Material (e.g., kraft, duplex, virgin board, recycled).
2. Weight or Thickness (GSM, micron, fluting).
3. Food safety certifications (FSSAI compliance, FDA food-grade, PLA lining).
4. Thermal / Moisture resistance (hot food, freezer grade, grease barrier).
5. Custom branding capabilities.
Return strictly JSON adhering to the schema.
</rules>`;
}
