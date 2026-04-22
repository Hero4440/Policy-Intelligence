# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-22)

**Core value:** Every policy question answered must include source-backed evidence from loaded policy documents — and every coverage evaluation must show exactly which criteria are met, missing, or ambiguous.

**Current focus:** v2.0 Full Product — Phase 7 implementation is done; manual browser UAT is next

## Current Position

Phase: 7 — Policy Compare + Insights
Plan: 07-05
Status: Awaiting human verification
Last activity: 2026-04-22 — Phase 7 implementation completed; browser UAT checklist prepared

```text
v2.0 Progress: [          ] 0/7 phases
Phase 6:  [x] Policy Management + Ingestion
Phase 7:  [~] Policy Compare + Insights
Phase 8:  [ ] Policy Changes + Versioning
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

Last session: 2026-04-22 (Phase 7 implementation)
Stopped at: Compare and Insights are implemented; blocking manual browser UAT remains before sign-off
Resume file: .planning/phases/07-policy-compare-insights/07-UAT.md
Next action: Run the browser checklist in `07-UAT.md`, then create `07-05-SUMMARY.md` and advance to Phase 8
