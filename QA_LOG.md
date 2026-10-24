# QA Log

| ID | Severity | File:Line | Description | Status |
|---|---|---|---|---|
| BUG-01 | S2 | src/hooks/use-mobile.ts:14 | Synchronous setState in useEffect caused cascading renders | fixed |
| BUG-02 | S2 | src/components/ai/ai-suggestion-card.tsx:33 | setState in useEffect when prop changes caused cascading renders | fixed |
| BUG-03 | S2 | src/components/ai/assistant-panel.tsx:99 | Impure Date.now() IDs and mutated accumulator in stream reader | fixed |
| BUG-04 | S3 | src/app/manufacturer/layout.tsx:61 | Raw `<a>` tag used for internal route instead of `<Link>` | fixed |
| BUG-05 | S3 | src/components/business/orders-view.tsx:70 | Impure Date.now() in component render phase | fixed |
| BUG-06 | S3 | src/components/manufacturer/publish-offering-form.tsx:796 | Unescaped JSX quote entities | fixed |
| BUG-07 | S3 | src/app/(landing)/privacy/page.tsx:52 | Unescaped apostrophes in text content | fixed |
| BUG-08 | S3 | src/app/(landing)/terms/page.tsx:100 | Unescaped apostrophes in text content | fixed |
| BUG-09 | S3 | src/components/site/landing/cta-dot-field.tsx:28 | `color` never reassigned; flagged by prefer-const | fixed |
| BUG-10 | S3 | src/actions/*-registration.ts | Unhandled `any` in database catch blocks breaking ESLint | fixed |
| BUG-11 | S2 | src/components/ai/assistant-panel.tsx:59 | Missing AbortController cleanup on unmount caused potential hanging streams | fixed |
| BUG-12 | S2 | src/app/api/ai/*/route.ts | Missing Zod validation and unbounded payload/string lengths allowed DoS/token exhaustion | fixed |
| BUG-13 | S3 | src/lib/ai/embeddings.ts:82 | Hardcoded model ID string instead of MODEL_IDS.MISTRAL_EMBED constant | fixed |

## Next Step
Stage 3: Database and RAG (Drizzle schema vs migrations dry run, vector dimensions, pgvector extension, backfill verification).

