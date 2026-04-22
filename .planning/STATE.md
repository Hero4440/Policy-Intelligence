# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-22)

**Core value:** Every policy question answered must include source-backed evidence from loaded policy documents — and every coverage evaluation must show exactly which criteria are met, missing, or ambiguous.

**Current focus:** v2.0 Full Product — Phase 8 planning is complete; implementation should start at 08-01

## Current Position

Phase: 8 — Policy Changes + Versioning
Plan: 08-01
Status: Ready to implement
Last activity: 2026-04-22 — Phase 8 planning, status, and UAT docs prepared

```text
v2.0 Progress: [          ] 0/7 phases
Phase 6:  [x] Policy Management + Ingestion
Phase 7:  [~] Policy Compare + Insights
Phase 8:  [~] Policy Changes + Versioning
Phase 9:  [ ] Patient Cases + Coverage Evaluation
Phase 10: [ ] Next Steps + Evidence Explorer + Chat
Phase 11: [ ] Expanded MCP Tools
Phase 12: [ ] Portal UI + Dashboard + Deployment
```

## Performance Metrics

**v1.0 POC Velocity:**
- Total plans completed: 12
- Timeline: 18 days (2026-04-03 → 2026-04-22)
- Codebase: 7,611 lines TypeScript

**v2.0 Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

## Accumulated Context

### Key Decisions (carried from v1.0)

- MCP over A2A: Prompt Opinion requirement; existing codebase — confirmed correct
- StreamableHTTP transport: Prompt Opinion expects this — confirmed correct
- Hybrid Q&A (deterministic + LLM): balances speed and hallucination risk — confirmed correct
- File-based JSON storage in `data/` — replaces in-memory store, avoids DB complexity; no Supabase
- Keep TypeScript/Node stack — avoid migration overhead, existing patterns solid
- Vercel (frontend) + Railway (backend) for v2.0 deployment
- Canonical policy schema (not FHIR) — policies need own schema with rules, evidence, versioning

### Blockers/Concerns

- Local Ollama was used for v1.0 LLM answers — v2.0 should use Claude API or configurable LLM backend

## Session Continuity

Last session: 2026-04-22 (Phase 8 planning)
Stopped at: Phase 8 planning is complete and implementation is queued
Resume file: .planning/phases/08-policy-changes-versioning/08-01-PLAN.md
Next action: Execute `08-01-PLAN.md`, then continue through `08-04` and verify against `08-UAT.md`
