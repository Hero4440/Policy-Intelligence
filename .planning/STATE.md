# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-22)

**Core value:** Every policy question answered must include source-backed evidence from loaded policy documents — and every coverage evaluation must show exactly which criteria are met, missing, or ambiguous.

**Current focus:** v2.0 Full Product — Phase 11 MCP tool expansion is complete; Phase 12 is next

## Current Position

Phase: 11 — Expanded MCP Tools
Plan: 11-05
Status: Complete
Last activity: 2026-04-22 — Phase 11 completed; all 10 new MCP tools implemented and registered

```text
v2.0 Progress: [          ] 0/7 phases
Phase 6:  [x] Policy Management + Ingestion
Phase 7:  [~] Policy Compare + Insights
Phase 8:  [~] Policy Changes + Versioning
Phase 9:  [x] Patient Cases + Coverage Evaluation
Phase 10: [x] Next Steps + Evidence Explorer + Chat
Phase 11: [x] Expanded MCP Tools
Phase 12: [ ] Portal UI + Dashboard + Deployment
```

## Performance Metrics

**v1.0 POC Velocity:**
- Total plans completed: 12
- Timeline: 18 days (2026-04-03 → 2026-04-22)
- Codebase: 7,611 lines TypeScript

**v2.0 Velocity:**
- Total plans completed: 10
- Average duration: —
- Total execution time: —

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

### Deferred Follow-Up

- Add per-source ingestion metadata files under `data/ingestion/sources/{source_id}.json`, with `db.json` retained as the aggregate index or migrated deliberately. Current Phase 11.01 uses `data/ingestion/db.json` as the source-of-truth lookup because that is the storage model implemented today.

## Session Continuity

Last session: 2026-04-22 (Phase 11 completion)
Stopped at: Phase 11 implementation is complete
Resume file: .planning/phases/11-expanded-mcp-tools
Next action: begin Phase 12 dashboard, role-switcher, navigation, and deployment work
