# Requirements Isolation & Semantic Search Rule Log

## Product Rule
> A business requirement is SAVED and used ONLY for semantic search by the business that owns it. It is never broadcast, pushed, shown, emailed, notified, listed or exposed to any other user or system. That is its only purpose.

---

## Audit Findings & Violations

| ID | Severity | File:Line | Finding Description | Status |
|---|---|---|---|---|
| **RULE-01** | **S1** | `src/app/api/ai/vendor/assist/route.ts:79-112` | `mode === "match_requirements"` allows vendors to execute hybrid RAG search against `entityType: "requirement"` and view snippets/titles of buyer requirements. | Pending Phase 1 |
| **RULE-02** | **S1** | `src/components/manufacturer/publish-offering-form.tsx:771-815` | Vendor offering creation UI renders "Matching Buyer Requirements (Hybrid RAG)" panel and triggers `match_requirements` to display buyer specs to suppliers. | Pending Phase 1 |
| **RULE-03** | **S1** | `src/actions/business-requirements.ts:144` | New requirements are embedded with `visibilityScope: "public"` instead of `"private"` with `ownerId` scoping. | Pending Phase 1 |
| **RULE-04** | **S1** | `scripts/backfill-embeddings.ts:64` | Backfill script embeds requirements with `visibilityScope: "public"` stating "Public so vendors can search and quote". | Pending Phase 1 |
| **RULE-05** | **S1** | `src/lib/ai/prompts/assistant.ts:20` | Vendor assistant persona prompt instructs the AI that its role is to "view matching packaging requirements". | Pending Phase 1 |
| **RULE-06** | **S1** | `src/components/ai/assistant-panel.tsx:78` | Vendor quick-starter suggestion prompt says: "Show matching packaging requirements for kraft pouches". | Pending Phase 1 |
| **RULE-07** | **S2** | `src/lib/business-workflow-store.ts:258-280` | `addRequirement` initiates a 1.5s `setTimeout` simulating an incoming vendor broadcast quote and changing status to "Quoted". | Pending Phase 1 |
| **RULE-08** | **S2** | `src/components/business/requirements-view.tsx:413-415` | Requirement card displays a pulsing radio indicator with copy: "Broadcast live • Awaiting vendor offers". | Pending Phase 1 |
| **RULE-09** | **S2** | `src/app/business/requirements/new/page.tsx:167,185` | Requirement submission handler is named `handleBroadcast` and triggers toast "Requirement published to supplier network!". | Pending Phase 1 |
| **RULE-10** | **S2** | `src/actions/business-requirements.ts:217-227` | `deleteRequirementAction` deletes the database row but fails to delete the corresponding embedding chunk in `ai_documents`. | Pending Phase 1 |
| **RULE-11** | **S2** | `src/lib/ai/retrieval.ts:40-61` | `buildAuthWhereClause` has no server-side assertion preventing non-business roles from retrieving `requirement` vectors. | Pending Phase 1 |
| **RULE-12** | **S3** | `src/lib/db/schema/vendor-quotation.ts:35-37` | `vendor_quotations` table references `businessRequirementsTable.id` (`requirement_id`). If vendors never see requirements, quotations are only created via owner-initiated inquiries or direct bids. | Audited |
