# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-04)

**Core value:** A prior auth specialist can ask a natural language question about a patient's drug coverage and get back a grounded answer citing real policy language — coverage status, required criteria, and what's missing — in seconds instead of hours of manual PDF review.

**Current focus:** Phase 5 - Deployment & Integration

## Current Position

Phase: 5 of 6 (Deployment & Integration)
Plan: 1 of 2
Status: In progress
Last activity: 2026-04-04 — Completed plan 05-01

Progress: [████████░░] 80%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 8.7 minutes
- Total execution time: 1.2 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-policy-data-foundation | 2 | 9.3 min | 4.6 min |
| 02-mcp-server-core | 2 | 6.5 min | 3.3 min |
| 03-patient-context-integration | 2 | 8.0 min | 4.0 min |
| 04-patient-data-setup | 1 | 46.0 min | 46.0 min |
| 05-deployment-integration | 1 | 0.0 min | 0.0 min |

**Recent Trend:**
- Last 5 plans: 03-01 (4.0 min), 03-02 (4.0 min), 04-01 (46.0 min), 05-01 (0.0 min active session)
- Trend: Phase 5 started with deployment hardening; main remaining work is Prompt Opinion UI integration and Marketplace publication

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- JSON over SQLite for policy store — Maximum build speed for 3-5 policies; schema maps to DB later
- Single therapeutic area — Depth over breadth; 3-5 policies done well beats 20 done poorly
- Product-future architecture — Clean boundaries now save rewrite later; minimal extra effort
- Schema structure (01-01) — Nested evidence text and source attribution at each requirement level enables precise policy traceability
- Drug aliasing (01-01) — Reverse lookup map for O(1) normalization performance
- Text cleaning (01-01) — Light-touch artifact removal preserving policy substance
- PDF availability (01-02) — Use real PDFs where available + standard patterns for unavailable documents with clear source attribution
- Demo scenario mapping (01-02) — Let complexity emerge naturally from real policy requirements rather than engineering scenarios
- Coverage status (01-02) — Heavily restricted JAK inhibitor serves as denial scenario; real biologics rarely excluded
- Stateless MCP transport (02-01) — Per-request server instances eliminate session management complexity; simpler concurrency model
- Structured JSON tool responses (02-01) — Nested evidence fields enable programmatic consumption while preserving policy traceability
- Error handling with discovery (02-01) — Return available payers/drugs in errors to reduce round trips
- [Phase 02]: Stub response pattern for patient readiness tool - criteria checklist with requires_patient_data status provides clear Phase 3 contract
- Lightweight custom FHIR types (03-01) — Use @types/fhir for basic types instead of full @solarahealth/fhir-r4 library; hackathon speed over comprehensive validation
- ICD-10 wildcard matching (03-01) — Support M05.* prefix patterns for diagnosis code families; policies specify ranges not exact codes
- Cautious clinical language (03-01) — Use 'appears_to_match' vs 'meets' to acknowledge automated analysis limitations; legally defensible outputs
- Multi-drug parsing for step therapy (03-01) — Parse 'methotrexate OR leflunomide OR sulfasalazine' as alternatives; check if ANY prior trial exists
- [Phase 03]: Three operational modes for check_patient_readiness - automated FHIR analysis, manual checklist, and graceful error fallback
- Hand-crafted FHIR bundles (04-01) — Only 3 patients needed, full control over scenarios critical for demo, faster than Synthea generation + editing
- FHIR Bundle collection type (04-01) — Local files not server submissions, collection type appropriate for static demo data
- Exact payer name matching (04-01) — FHIR extractor reads payor[0].display, must match policy store strings exactly for check_patient_readiness tool
- 2-month methotrexate gap for Patient 2 (04-01) — Creates obvious gap for demo (authoredOn 2026-02-01 to demo time 2026-04-04 = ~2 months, clearly short of 3-month requirement)
- Explicit public host allowlisting for MCP server (05-01) — MCP SDK localhost host validation rejects ngrok domains by default; PUBLIC_BASE_URL preserves local safety while enabling public verification
- SSE-aware MCP smoke checks (05-01) — tools/list response arrives as event-stream framing, so deployment verification must parse `data:` payloads rather than assume raw JSON

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 1 (Data Foundation):**
RESOLVED — Phase 1 complete. All concerns addressed:
- Policy data extraction quality: UHC PDF provides real policy language; other policies based on standard patterns
- Therapeutic area: RA biologics finalized and implemented
- Policy PDF availability: Handled via hybrid approach (real PDF + standard patterns)

**Phase 2 (MCP Server Core):**
RESOLVED — Phase 2 complete. All 3 core MCP tools implemented and tested.

**Phase 3 (Patient Context Integration):**
COMPLETED — Both plans complete. FHIR integration layer (03-01) and patient readiness tool integration (03-02) delivered.

**Phase 4 (Patient Data Setup):**
COMPLETED — Plan complete. Three demo patient FHIR bundles created with controlled scenarios (full match, partial match with gap, poor match). All bundles validated against extractors. Prompt Opinion loading steps documented for Phase 5.

**Phase 5 (Deployment & Integration):**
IN PROGRESS — Plan 05-01 complete. MCP server hardened for browser-based remote access with CORS, explicit public host allowlisting, and verified local + ngrok smoke tests. Remaining work is Prompt Opinion workspace connection, SHARP validation, agent configuration, and Marketplace publication.

## Session Continuity

Last session: 2026-04-04
Stopped at: Completed 05-01-PLAN.md (Deployment hardening, ngrok verification, runbook)
Resume file: .planning/phases/05-deployment-integration/05-01-SUMMARY.md
Next: Continue 05-02 - Prompt Opinion registration, SHARP payload validation, agent setup, and Marketplace publication
