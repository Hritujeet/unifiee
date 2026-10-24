# Requirements Isolation & Semantic Search Rule Log

## Product Rule
> A business requirement is SAVED and used ONLY for semantic search by the business that owns it. It is never broadcast, pushed, shown, emailed, notified, listed or exposed to any other user or system. That is its only purpose.

---

## Audit Findings & Violations

| ID | Severity | File:Line | Finding Description | Status |
|---|---|---|---|---|
| **RULE-01** | **S1** | `src/app/api/ai/vendor/assist/route.ts` | Vendor `match_requirements` mode removed; vendor AI now has no requirement retrieval path. | Resolved Phase 1 |
| **RULE-02** | **S1** | `src/components/manufacturer/publish-offering-form.tsx` | Vendor “Matching Buyer Requirements” panel removed. | Resolved Phase 1 |
| **RULE-03** | **S1** | `src/actions/business-requirements.ts:144` | New requirement embeddings are private and owner-scoped. | Resolved Phase 1 |
| **RULE-04** | **S1** | `scripts/backfill-embeddings.ts:64` | Requirement backfill now writes private embeddings. Existing rows require the proposed migration. | Resolved in code; migration pending approval |
| **RULE-05** | **S1** | `src/lib/ai/prompts/assistant.ts:20` | Vendor assistant no longer claims access to matching requirements. | Resolved Phase 1 |
| **RULE-06** | **S1** | `src/components/ai/assistant-panel.tsx:78` | Vendor requirement quick prompt removed. | Resolved Phase 1 |
| **RULE-07** | **S2** | `src/lib/business-workflow-store.ts:258-280` | Simulated vendor broadcast quote removed. | Resolved Phase 1 |
| **RULE-08** | **S2** | `src/components/business/requirements-view.tsx:413-415` | Broadcast status copy replaced with private-save/search copy. | Resolved Phase 1 |
| **RULE-09** | **S2** | `src/app/business/requirements/new/page.tsx` | Save flow no longer describes or triggers broadcasting; automatic pre-save matching removed. | Resolved Phase 1 |
| **RULE-10** | **S2** | `src/actions/business-requirements.ts:217-227` | Requirement deletion now removes owner-scoped embedding documents. | Resolved Phase 1 |
| **RULE-11** | **S2** | `src/lib/ai/retrieval.ts:40-61` | Retrieval SQL and server assertion exclude requirement vectors from non-business sessions and restrict business access to the owner. | Resolved Phase 1 |
| **RULE-12** | **S3** | `src/lib/db/schema/vendor-quotation.ts:35-37` | `vendor_quotations` table references `businessRequirementsTable.id` (`requirement_id`). It remains for owner-side offer/order history; no vendor requirement read path was found. | Audited |

## Phase 1/2 implementation

- Added owner-only `POST /api/ai/requirements/search-vendors`, which uses the saved private requirement embedding as the vector query and saved requirement text for hybrid RRF keyword retrieval over `offer` documents.
- Added active-offer filtering and an owner-only business UI action in `requirement-vendor-search.tsx`.
- Removed designer requirement matching, vendor requirement matching, and automatic pre-save offer matching.
- Proposed migration (not applied): `drizzle/20261024212000_private_requirement_embeddings/migration.sql`.
