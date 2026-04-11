# Codebase Concerns

**Analysis Date:** 2026-04-11

## Tech Debt

**In-Memory Session & Catalog Storage:**
- Issue: Sessions and cached Anton Rx catalog live in process memory with no persistence mechanism or cleanup
- Files: `src/server/session-store.ts` (Map<string, SessionState>), `src/server/antonrx-data.ts` (cache variable at line 166)
- Impact: Memory leaks accumulate over time; restarting server loses all active sessions and chat history. In production with multiple instances, state is not shared. Session data can grow unbounded if many concurrent users chat
- Fix approach: Implement Redis or persistent store for sessions. Add session TTL and garbage collection. For Anton Rx catalog, add explicit cache invalidation timing and size bounds

**Hardcoded CORS with origin: true:**
- Issue: `src/server/index.ts` line 20-23 enables CORS to all origins without restriction
- Files: `src/server/index.ts` (cors configuration)
- Impact: API is vulnerable to cross-origin attacks and CSRF. Any website can make requests on behalf of users. In production, this should restrict to specific deployment domain
- Fix approach: Replace `origin: true` with explicit whitelist of allowed origins, configurable via environment variable

**Manual CSV Parsing Implementation:**
- Issue: Custom CSV parser implementation in `src/server/ingestion/index.ts` lines 98-152 lacks comprehensive edge case handling
- Files: `src/server/ingestion/index.ts` (parseCsv function)
- Impact: Quoted fields with embedded commas/newlines may be incorrectly split. Malformed CSVs could silently produce incorrect rows. No validation that output rows match header count
- Fix approach: Migrate to a tested CSV parsing library (e.g., csv-parse, papaparse) or add comprehensive unit tests with edge cases

**Inconsistent Error Handling in Ingestion:**
- Issue: File ingestion has mixed error handling - some paths swallow errors silently (e.g., DOCX text extraction at line 718), others propagate them
- Files: `src/server/ingestion/index.ts` (normalizePdfUpload line 718-720, normalizeDocxUpload line 768-780)
- Impact: Silent failures mean files are stored as "rejected" or "partial" with minimal feedback. Users don't know if extraction truly failed or if the source genuinely lacks data
- Fix approach: Standardize error logging and user feedback. Add explicit error tracking to ingestion records

**Ambiguous Clinical Matching Logic:**
- Issue: `src/mcp/matching/criteria_matcher.ts` treats many requirements as "unable_to_verify" or "documentation_may_be_needed" without clear criteria for what constitutes a match
- Files: `src/mcp/matching/criteria_matcher.ts` (matchOtherRequirements function lines 189-211)
- Impact: Readiness checks return many inconclusive results, reducing confidence in output. Users must always consult original policies to verify
- Fix approach: Document matching confidence levels and caveats explicitly. Add thresholds for what constitutes actionable "appears_to_match" versus "needs_documentation"

## Known Bugs

**Session Message Persistence Issue:**
- Symptoms: Appended chat messages are added to in-memory session but never persisted. If node server restarts mid-conversation, entire chat history is lost
- Files: `src/server/session-store.ts` (appendSessionMessage function), `src/server/chat.ts` (sseWrite at line 595-598)
- Trigger: Start chat session → send messages → server restart → chat history gone, session still exists but empty
- Workaround: Export/download chat history before restarting server (not implemented in UI)

**FHIR Patient Bundle Extraction Silently Returns Empty Data:**
- Symptoms: If a FHIR bundle is missing expected resources (Condition, MedicationRequest, Coverage), functions return empty arrays/null silently. User has no feedback that data is missing
- Files: `src/mcp/fhir/extractors.ts` (extractDiagnoses line 42-44, extractMedications line 83-85, extractCoverage line 139-140)
- Trigger: Upload FHIR bundle with incomplete data → readiness check shows no criteria met → user assumes patient doesn't qualify, unaware that data wasn't extracted
- Workaround: Manually inspect raw FHIR bundle JSON to verify resource types present

**Chat Tool Execution Continues on Partial Failures:**
- Symptoms: If one tool fails in `src/server/chat.ts` (executeToolCall), the chat continues with remaining tools. Users may not notice an expected tool didn't execute
- Files: `src/server/chat.ts` (lines 767-780 - no per-tool error handling in loop)
- Trigger: Ollama returns error for get_plan_drug_details → error is caught by outer try/catch → tool result is logged as error event but chat still streams answer based on successful tools only
- Workaround: User must watch SSE stream events carefully to notice tool failures

## Security Considerations

**Unvalidated File Upload Size:**
- Risk: POST `/api/ingestion/upload` and `/api/upload` accept base64-encoded files with no size limits. Large PDF/DOCX files could cause out-of-memory or disk exhaustion
- Files: `src/server/ingestion/index.ts` (ingestFiles function line 966-976), `src/server/uploads.ts` (registerUploadRoutes line 34)
- Current mitigation: Express has default 25MB JSON body limit (`express.json({ limit: '25mb' })` at line 25 in index.ts), but this is applied to entire request
- Recommendations: Enforce per-file size limits (e.g., max 10MB per file). Validate MIME types on server. Add virus scanning for uploaded files. Monitor disk usage in ingestion store

**Inadequate Input Validation on Drug/Plan Names:**
- Risk: User-supplied drug and plan names are passed directly to LLM prompts in `src/server/chat.ts` (planToolUse function) without sanitization
- Files: `src/server/chat.ts` (line 297-301 formatContext and line 280-301 plannerPrompt)
- Current mitigation: None - prompt injection is possible if user enters specially crafted drug names
- Recommendations: Add input validation to reject or escape special characters. Use parameterized prompts if LLM API supports it

**Policy JSON Upload Trusts All Valid Schema:**
- Risk: Any user can upload a PolicyRecordSchema-compliant JSON as a policy, which is then used for readiness checking and decision-making
- Files: `src/server/uploads.ts` (line 68-80), `src/server/ingestion/index.ts` (normalizePolicyJson line 277-344)
- Current mitigation: Schema validation only - no source verification or trust levels
- Recommendations: Add policy provenance tracking. Differentiate between official vs. user-uploaded policies in UI. Require admin approval before policies are used for clinical matching

**FHIR Bearer Token Exposure in Context:**
- Risk: FHIR tokens are passed in patient context objects and stored in session (via `src/mcp/fhir/client.ts` extractFhirToken function)
- Files: `src/mcp/fhir/client.ts` (extractFhirToken lines 62-104), `src/server/session-store.ts` (UploadedPatient type stores raw bundle with potential embedded tokens)
- Current mitigation: None - tokens are in-memory only, but bundle is persisted
- Recommendations: Strip FHIR tokens from bundles before storing. Use separate secure token store with encryption

## Performance Bottlenecks

**Sequential File Processing in Ingestion:**
- Problem: `src/server/ingestion/index.ts` (ingestFiles function line 966-976) processes uploaded files sequentially with await, not in parallel
- Files: `src/server/ingestion/index.ts` (ingestFiles)
- Cause: For loop with `await ingestOneFile(file)` blocks on each file. If user uploads 10 files, each PDF extraction waits for the previous one to complete
- Improvement path: Implement batching with Promise.all() for I/O operations. Cap concurrent operations at 3-5 to prevent resource exhaustion. For CPU-heavy operations (PDF parsing), use worker threads

**Full File System Scan for Ingestion Summary:**
- Problem: `getIngestionSummary()` in `src/server/ingestion/store.ts` reads entire db.json file and filters it in memory every time it's called
- Files: `src/server/ingestion/store.ts` (listIngestedSources line 139-141, getIngestionSummary line 147-155)
- Cause: No indexing or caching of summary counts. Frontend calls this on every page load
- Improvement path: Cache summary counts and invalidate on upload. Maintain running count in separate metadata file

**Duplicate Ingestion Disk Reads:**
- Problem: Anton Rx catalog loading reads raw CSV formulary file on every request to /api/antonrx/compare
- Files: `src/server/antonrx-data.ts` (loadCatalog function around line 300-410)
- Cause: Only caches in memory - if process restarts, full load is repeated. CSV file contains 500+ drug-plan combinations
- Improvement path: Keep memory cache but add disk cache invalidation. Add metrics for cache hit rate

**Frontend Query Lists Not Paginated:**
- Problem: `src/frontend/data/antonrx.ts` returns full plan/drug/issuer lists. If there are 500+ plans, all are sent to client
- Files: `src/frontend/data/antonrx.ts` (searchPlans, searchDrugs, searchIssuers likely return full lists)
- Cause: No server-side filtering or pagination
- Improvement path: Implement server-side search with limits. Add autocomplete endpoint that only returns top 20 matches

## Fragile Areas

**PDF Text Extraction Heuristics:**
- Files: `src/server/ingestion/pdf-policy-parser.ts` (detectDrugs function lines 181-216, detectRequirementSignals lines 224-240)
- Why fragile: Detection uses regex patterns and keyword lists. Drug names detected via scoring heuristic with hardcoded thresholds (line 210: `minimumScore = highestScore >= 5 ? 5 : Math.max(2, highestScore)`). If a PDF has unusual formatting or terminology, detection will fail silently. "Prior Auth" might be written as "prior authorization" or abbreviated differently
- Safe modification: Add extensive test suite with real policy PDFs. Log detection scoring for debugging. Allow manual drug/requirement override in UI. Add confidence metric returned with detections
- Test coverage: No visible test files for PDF parsing logic

**ICD-10 Wildcard Matching:**
- Files: `src/mcp/matching/criteria_matcher.ts` (icd10CodesMatch function lines 217-226)
- Why fragile: Wildcard matching (e.g., "M05.*") only supports trailing wildcards. If policy specifies "M*.79" or other patterns, matching breaks. No validation that patient codes are valid ICD-10 format
- Safe modification: Add comprehensive ICD-10 validation. Support full regex patterns. Test against comprehensive ICD-10 code samples
- Test coverage: No unit tests for matcher functions visible

**Drug Name Normalization:**
- Files: `src/data/lookup/drug-aliases.ts` (imported and used throughout). Definition not visible - assumed to be external data file
- Why fragile: Normalization relies on static alias mapping. Brand names evolving or new drugs added won't be normalized. Plurals and abbreviations may not match
- Safe modification: Expand alias mapping. Add phonetic/fuzzy matching as fallback. Add new drug registration flow
- Test coverage: No test file visible for normalization

**CORS Origin Validation:**
- Files: `src/server/index.ts` (cors configuration line 20-23)
- Why fragile: Single `origin: true` setting allows all origins. If ever updated incorrectly (e.g., to allow a test origin), it could be accidentally pushed to production
- Safe modification: Create environment-based configuration. Add pre-deployment checks. Implement origin validation middleware
- Test coverage: No visible CORS tests

## Scaling Limits

**In-Memory Session Accumulation:**
- Current capacity: Unbounded - depends on available RAM
- Limit: With typical session size ~5KB and 1GB heap available, roughly 200,000 sessions before memory pressure
- Scaling path: Implement persistent session store (Redis/PostgreSQL). Add session TTL expiration. Compress inactive sessions. Monitor heap usage with alerts

**Ingestion Storage Directory:**
- Current capacity: File system dependent (assume 100GB available)
- Limit: Storing raw uploads + extracted text + db.json. With PDFs averaging 2MB, roughly 50,000 documents before storage exhaustion
- Scaling path: Archive old ingestion records to cold storage. Implement S3 integration. Add configurable retention policy. Add cleanup job to remove old raw files

**Anton Rx Catalog Load Time:**
- Current capacity: In-memory cache loads ~500 plans instantly on first request
- Limit: As ingested sources grow to 1000+ snapshots, initial load time and memory footprint increase linearly
- Scaling path: Partition catalog by issuer. Lazy-load plans only when user searches. Add indexes for drug-plan lookups

**Chat Message History:**
- Current capacity: Stores last 8 messages in memory per session (line 78 in chat.ts)
- Limit: No actual limit enforced - sessions can grow unbounded with repeated messages
- Scaling path: Enforce maximum message count per session with circular buffer. Implement conversation archival. Add message pruning for long-running sessions

## Dependencies at Risk

**Ollama LLM Service Dependency:**
- Risk: All chat completions depend on external Ollama service (hardcoded at `http://127.0.0.1:11434`). No fallback if service is unavailable
- Impact: Chat endpoint returns 500 error if Ollama is down, blocking all AI-powered tool routing and response generation. No graceful degradation
- Migration plan: Implement circuit breaker pattern. Add fallback to rule-based tool selection (already has `heuristicFallback` function at line 210 in chat.ts). Support multiple LLM backend configurations. Add health check monitoring

**pdf-parse Library:**
- Risk: PDF parsing library may not handle all PDF variants. Corruption or unusual encoding could crash extraction
- Impact: Ingestion endpoint returns 500 error and malformed error message. No recovery
- Migration plan: Add PDF validation before parsing. Wrap parser in timeout. Consider alternative PDF library (pdfjs-dist). Add PDF repair tools for corrupted files

**fhir-kit-client Library:**
- Risk: FHIR client library may not handle all server response variants or network issues gracefully
- Impact: Patient bundle fetch failures are not well-documented. May throw unfamiliar errors
- Migration plan: Wrap client calls with comprehensive error handling. Implement retry logic with exponential backoff. Add detailed error logging

**Node.js Built-in zlib for DOCX Extraction:**
- Risk: Custom DOCX extraction (lines 690-759 in ingestion/index.ts) uses undocumented ZIP format heuristics
- Impact: DOCX parsing may fail silently on certain files, especially from newer Office versions
- Migration plan: Migrate to jszip or unzipper library. Add comprehensive DOCX format validation. Test against Office 2019+ formats

## Missing Critical Features

**Chat Session Persistence & Export:**
- Problem: Users cannot save or export chat conversations. All session history is lost on server restart
- Blocks: Long-running research sessions. Audit trail requirements. Session sharing between team members
- Workaround: Copy-paste from UI (tedious and error-prone)

**Readiness Check Confidence Scoring:**
- Problem: Readiness results don't include confidence levels or uncertainty quantification. All results appear equally reliable
- Blocks: Risk-based decision making. Integration with clinical workflows
- Workaround: Manually review each matched criterion

**Policy Conflict/Contradiction Detection:**
- Problem: If multiple sources provide conflicting information about same drug/plan, no mechanism detects or alerts to conflicts
- Blocks: Data quality assurance. Identifying stale policies
- Workaround: Manual spot-checking of policies

**Audit Logging:**
- Problem: No audit trail of what users queried, what readiness checks were performed, or what policies were used for decisions
- Blocks: Compliance requirements. Tracing incorrect outputs back to source
- Workaround: Server logs contain raw requests but no structured audit records

**Bulk Patient Processing:**
- Problem: Readiness check only works for single patient per query. No batch processing capability
- Blocks: Population health analysis
- Workaround: Users must make individual API calls

## Test Coverage Gaps

**FHIR Extraction Logic:**
- What's not tested: extractPatientData, extractDiagnoses, extractMedications, extractCoverage with various bundle formats. Edge cases: missing resources, malformed codings, multiple coding systems
- Files: `src/mcp/fhir/extractors.ts`
- Risk: Silent failures when FHIR bundles have unexpected structure. Incorrect diagnosis/medication extraction could lead to wrong readiness assessment
- Priority: High - clinical decision support depends on accurate FHIR parsing

**Criteria Matching Logic:**
- What's not tested: matchPatientAgainstPolicy, icd10CodesMatch, parseDrugList with various policy/patient combinations. Edge cases: wildcard codes, multi-drug requirements, ambiguous requirements
- Files: `src/mcp/matching/criteria_matcher.ts`
- Risk: Matching bugs go undetected. False positives/negatives in readiness checking
- Priority: High - directly impacts clinical decisions

**PDF Policy Parsing:**
- What's not tested: parsePdfPolicyText, detectDrugs, detectRequirementSignals with real policy PDFs. Edge cases: OCR'd text with typos, unusual formatting, multiple drugs per page
- Files: `src/server/ingestion/pdf-policy-parser.ts`
- Risk: Extraction heuristics fail on unseen PDF formats. Users upload policies but drugs/requirements aren't detected
- Priority: High - critical for ingestion pipeline

**CSV Parsing Edge Cases:**
- What's not tested: parseCsv with quoted fields, embedded newlines, unusual delimiters, malformed headers. Different CSV dialects
- Files: `src/server/ingestion/index.ts` (parseCsv)
- Risk: Data corruption during CSV import. Incorrect plan/drug data entered into catalog
- Priority: Medium - affects data quality but less critical than clinical logic

**Chat Tool Execution & Error Handling:**
- What's not tested: executeToolCall error scenarios, tool fallback logic, streaming response formatting, SSE event ordering
- Files: `src/server/chat.ts` (executeToolCall, streamFinalAnswer)
- Risk: Partial tool failures silently drop results. SSE stream gets corrupted. Chat responses are malformed
- Priority: Medium - affects usability but not data integrity

**Ollama Fallback Logic:**
- What's not tested: heuristicFallback function with various user queries and context configurations. Fallback activation when LLM is unavailable
- Files: `src/server/chat.ts` (heuristicFallback, planToolUse try/catch)
- Risk: Heuristic tool selection may not align with user intent. LLM unavailability causes complete service failure
- Priority: Medium - affects availability

---

*Concerns audit: 2026-04-11*
