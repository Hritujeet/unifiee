# Feature Acceptance Test Report

| id | role | feature | steps | expected | result | severity | notes |
|---|---|---|---|---|---|---|---|
| STG0-01 | system | build | Run `npm run build` | Next.js build succeeds with 0 errors | PASS | - | Turbopack compilation & static generation successful (41/41 pages) |
| STG0-02 | system | typecheck | Run `npx tsc --noEmit` | Clean typecheck with 0 errors | PASS | - | Exited 0 |
| STG0-03 | system | lint | Run `npm run lint` | ESLint completes with 0 errors | PASS | - | 0 errors, 90 warnings |
| STG0-04 | system | env_keys | Verify API keys and DB URL present | GOOGLE_GENERATIVE_AI_API_KEY, MISTRAL_API_KEY, DATABASE_URL present | PASS | - | Keys verified in .env.local |
| STG0-05 | system | ai_smoke | Test 1 minimal call to Gemini and Mistral | Providers return response | PASS (Gemini) / WARN (Mistral 429 quota) | S3 | Gemini 2.5 Flash responded 'Hello World.'; Mistral returned 429 Rate limit exceeded. Test suite will mock Mistral calls per token discipline. |
| STG0-06 | system | db_safety | Verify Neon target branch before write | User confirms target database branch | AWAITING_CONFIRMATION | - | Current host: ep-weathered-bonus-b3wg1j34-pooler.c-4.ap-southeast-1.aws.neon.tech / DB: neondb |
