# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-11)

**Core value:** Every policy question answered must include source-backed evidence from loaded policy documents. No evidence, no answer.
**Current focus:** Phase 4 complete

## Current Position

Phase: 4 of 4 (Deployment + Integration)
Plan: 2 of 2
Status: Phase 4 complete; ngrok deployment and Prompt Opinion integration approved
Last activity: 2026-04-18 — Phase 4 plan 02 approved

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 6.88 minutes
- Total execution time: 0.92 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 01 | 2 | 7 min | 3.5 min |
| Phase 02 | 2 | 16 min | 8 min |
| Phase 03 | 2 | 17 min | 8.5 min |
| Phase 04 | 2 | 35 min | 17.5 min |

**Recent Plans:**

| Phase 01 P01 | 2 min | 2 tasks | 7 files |
| Phase 01 P02 | 5 | 3 tasks | 3 files |
| Phase 02 P01 | 8 min | 2 tasks | 4 files |
| Phase 02 P02 | 8 min | 2 tasks | 4 files |
| Phase 03 P01 | 10 min | 2 tasks | 3 files |
| Phase 03 P02 | 7 min | 2 tasks | 7 files |
| Phase 04 P01 | 25 min | 2 tasks | 9 files |
| Phase 04 P02 | 10 min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- MCP over A2A: Prompt Opinion MCP integration is the hackathon requirement; existing codebase already uses MCP
- Build on existing codebase: Significant MCP/policy infrastructure already built; faster than starting fresh
- Hybrid Q&A (deterministic + LLM): Pure deterministic misses complex questions; pure LLM risks hallucination; hybrid balances both
- Two documents only: BCBS NC + Cigna sufficient to prove cross-payer comparison; keep scope tight for hackathon
- [Phase 01]: Optional schema fields for backward compatibility with RA policies
- [Phase 01]: Added FDA biosimilar suffix variants to drug alias system
- [Phase 01-02]: BCBS NC requires FDA MedWatch form for non-preferred bevacizumab products
- [Phase 01-02]: Cigna requires trial of ALL three rituximab biosimilars before brand Rituxan
- [Phase 02-01]: Deterministic tools use a standard response envelope: answer, structured_result, evidence, confidence
- [Phase 02-02]: Single-payer comparison results are allowed, but are marked MEDIUM confidence with a partial-data note
- [Phase 03-01]: Deterministic summary routing requires both payer and drug entities; under-specified summary questions fall through to LLM or insufficient-evidence handling
- [Phase 03-02]: ask_policy_question returns structured route metadata and uses the local Ollama-compatible LLM path for non-deterministic questions

### Pending Todos

- None. All planned phases are complete.

### Blockers/Concerns

- Local Ollama access is still required in the deployment environment for live LLM-backed answers.

## Session Continuity

Last session: 2026-04-18 (execute-phase)
Stopped at: Phase 4 complete
Resume file: .planning/phases/04-deployment-integration/04-02-SUMMARY.md
