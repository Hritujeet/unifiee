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

## Next Step
Stage 2: Targeted grep audits (auth, secrets, Zod, role validation, SQL/Drizzle queries, boundaries).
