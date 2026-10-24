/**
 * Prompt Templates: Graphic Designer Fiverr-Style AI Assistants
 * Version: 1.0.0
 */

import { z } from "zod";

export const DESIGNER_ASSIST_VERSION = "1.0.0";

// 1. Gig Creation Assistant Schema
export const gigCreationOutputSchema = z.object({
    title: z.string().describe("SEO-optimized, catchy gig title (e.g. 'Custom Artisanal Coffee Bag & Pouch Packaging Design')."),
    description: z.string().describe("Structured gig description featuring an engaging hook, what is included, my design workflow, and why choose me."),
    suggestedTags: z.array(z.string()).describe("5-7 high-converting marketplace search tags."),
    deliverables: z.array(z.string()).describe("List of concrete deliverables (e.g. '3D Realistic Mockup', 'Vector Dieline (AI/EPS)', 'Print-ready CMYK PDF')."),
    suggestedFaqs: z.array(
        z.object({
            question: z.string().describe("Common buyer question."),
            answer: z.string().describe("Polite, reassuring answer."),
        })
    ).describe("3-4 helpful FAQ items addressing revisions, dielines, and source files."),
});
export type GigCreationOutput = z.infer<typeof gigCreationOutputSchema>;

// 2. Profile Bio Writer Schema
export const designerBioOutputSchema = z.object({
    headline: z.string().describe("A compelling 1-line professional studio headline."),
    bio: z.string().describe("A 2-3 paragraph professional bio emphasizing packaging expertise, brand storytelling, and client satisfaction."),
    keyHighlights: z.array(z.string()).describe("3-4 bullet point strengths (e.g. '100% Print-ready Dieline Guarantee', 'Specialized in F&B Food Packaging')."),
});
export type DesignerBioOutput = z.infer<typeof designerBioOutputSchema>;

// 3. Smart Reply Suggestions Schema
export const smartReplyOutputSchema = z.object({
    replies: z.array(
        z.object({
            label: z.string().describe("Short label (e.g. 'Acknowledge & Ask Details', 'Accept Scope', 'Polite Scope Clarification')."),
            text: z.string().describe("Full contextual reply message ready to review, edit, or send."),
            tone: z.enum(["professional", "friendly", "clarifying"]).describe("The communicative tone of this reply."),
        })
    ).describe("2-3 smart contextual reply options."),
});
export type SmartReplyOutput = z.infer<typeof smartReplyOutputSchema>;

// 4. Order Brief Summarizer into Deliverables Checklist Schema
export const briefChecklistOutputSchema = z.object({
    projectSummary: z.string().describe("2-3 sentence overview of the design project."),
    targetAudience: z.string().nullable().describe("Target market or consumer persona if identified."),
    deliverablesChecklist: z.array(
        z.object({
            item: z.string().describe("Specific asset or file to produce (e.g. 'Front & Back Label Artwork')."),
            specifications: z.string().describe("Format, color profile, or dimensions (e.g. 'CMYK, 300 DPI, Vector PDF with 3mm bleed')."),
            status: z.enum(["pending", "in_progress", "ready"]).default("pending"),
        })
    ).describe("Exhaustive list of every required deliverable extracted from the brief to prevent scope creep."),
    potentialMissingAssets: z.array(z.string()).describe("Assets the client still needs to provide (e.g. 'Vector Logo SVG', 'Nutrition Facts table', 'Barcode number')."),
    timelineRecommendation: z.string().describe("Recommended production timeframe."),
});
export type BriefChecklistOutput = z.infer<typeof briefChecklistOutputSchema>;

// 5. Delivery & Revision Response Helper Schema
export const deliveryHelperOutputSchema = z.object({
    subject: z.string().describe("Clear, polite subject line."),
    message: z.string().describe("Professional, appreciative delivery or revision response note."),
    deliverablesSummary: z.array(z.string()).describe("Bullet points of what has been attached or updated."),
    nextStepsNotice: z.string().describe("Clear instructions on how the client can review, request minor tweaks, or approve the order."),
});
export type DeliveryHelperOutput = z.infer<typeof deliveryHelperOutputSchema>;

/**
 * Prompt Builders
 */
export function buildGigCreationPrompt(input: {
    category: string;
    rawNotes: string;
    specialization?: string;
}): string {
    return `<role>
You are a top-rated Fiverr packaging design copywriter.
Turn the designer's rough service concept into a high-converting, professional packaging design gig listing.
</role>

<context>
Category: ${input.category}
Specialization: ${input.specialization || "Packaging Design"}
Designer Input: "${input.rawNotes}"
Version: ${DESIGNER_ASSIST_VERSION}
</context>

<rules>
1. STRUCTURE: Include a strong opening hook, a clear breakdown of deliverables, technical guarantees (dielines, CMYK, bleeds), and FAQs.
2. NO PRICING DETERMINATION: Suggest deliverables and scope, but do not dictate pricing.
3. OUTPUT: Strictly return JSON matching the schema.
</rules>`;
}

export function buildDesignerBioPrompt(input: {
    name: string;
    experienceYears?: number;
    specialties: string[];
    tools: string[];
    roughNotes?: string;
}): string {
    return `<role>
You are a personal branding strategist for creative professionals.
Write an authentic, highly credible portfolio bio for an independent packaging designer.
</role>

<context>
Name: ${input.name}
Experience: ${input.experienceYears ? `${input.experienceYears} years` : "Experienced"}
Packaging Specialties: ${input.specialties.join(", ") || "Food & Beverage Packaging"}
Software Tools: ${input.tools.join(", ") || "Illustrator, Photoshop"}
Designer Notes: "${input.roughNotes || ""}"
</context>

<rules>
1. TONE: Warm, competent, client-centric, inspiring confidence in brand owners.
2. OUTPUT: Return strictly JSON adhering to the schema.
</rules>`;
}

export function buildSmartReplyPrompt(input: {
    clientMessage: string;
    projectContext?: string;
    designerName?: string;
}): string {
    return `<role>
You are an executive assistant for a packaging designer.
Draft 3 context-aware, professional reply options to a client inquiry or revision feedback.
</role>

<context>
Client's Message: "${input.clientMessage}"
Project Scope: ${input.projectContext || "Packaging Design Order"}
Designer Name: ${input.designerName || "Designer"}
</context>

<rules>
Provide 3 options:
1. Quick polite acknowledgment + agreement.
2. Detailed response asking for necessary brand assets or specs.
3. Polite scope clarification/boundary setting if client is asking for out-of-scope work.
Return strictly JSON adhering to schema.
</rules>`;
}

export function buildBriefChecklistPrompt(input: {
    briefText: string;
    serviceTitle?: string;
}): string {
    return `<role>
You are a senior creative director specializing in packaging production.
Analyze the buyer's project brief or chat instructions, identify all explicit and implicit requirements, and generate a strict deliverables checklist to prevent scope creep.
</role>

<context>
Service: ${input.serviceTitle || "Custom Packaging Design"}
Buyer Brief:
"""
${input.briefText}
"""
</context>

<rules>
1. EXTRACT ALL ASSETS: Include labels, box dielines, 3D renders, barcode placements, and file formats (PDF, AI, PNG).
2. FLAG MISSING ASSETS: List any assets the buyer forgot to provide (e.g., logo vector, nutrition panel, dimensions).
3. RETURN FORMAT: Return strictly JSON adhering to the schema.
</rules>`;
}

export function buildDeliveryMessagePrompt(input: {
    orderNumber?: string;
    serviceTitle: string;
    clientName?: string;
    deliveryNotes?: string;
    isRevision?: boolean;
}): string {
    return `<role>
You are a professional design studio client-relations specialist.
Draft a gracious, clear delivery handover message for completed packaging artwork.
</role>

<context>
Action: ${input.isRevision ? "Revision Handover" : "Final Project Delivery"}
Order: ${input.orderNumber || ""}
Service: ${input.serviceTitle}
Client Name: ${input.clientName || "Valued Client"}
Designer Handover Notes: "${input.deliveryNotes || ""}"
</context>

<rules>
1. Express gratitude and congratulate them on their new packaging design.
2. Outline what is included in this delivery (dielines, print-ready files, mockups).
3. Explain how to test print or request a final touchup.
4. Return strictly JSON adhering to the schema.
</rules>`;
}
