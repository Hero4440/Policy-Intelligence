# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-21)

**Core value:** Every policy question answered must include source-backed evidence from loaded policy documents — and every coverage evaluation must show exactly which criteria are met, missing, or ambiguous.

**Current focus:** Milestone v2.0 — roadmap defined, ready to begin Phase 5

## Current Position

Phase: 5 — File-Based Storage Foundation
Plan: —
Status: Not started
Last activity: 2026-04-21 — v2.0 roadmap created (phases 5-12)

```text
v2.0 Progress: [          ] 0/8 phases
Phase 5: [ ] File-Based Storage Foundation
Phase 6: [ ] Policy Management + Ingestion
Phase 7: [ ] Policy Compare + Insights
Phase 8: [ ] Policy Changes + Versioning
Phase 9: [ ] Patient Cases + Coverage Evaluation
Phase 10: [ ] Next Steps + Evidence Explorer + Chat
Phase 11: [ ] Expanded MCP Tools
Phase 12: [ ] Portal UI + Dashboard + Deployment
```

## Performance Metrics

**v1.0 POC Velocity:**
- Total plans completed: 8
- Average duration: 6.88 minutes
- Total execution time: 0.92 hours

**v2.0 Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

## Accumulated Context

### Decisions (carried from v1.0)

- MCP over A2A: Prompt Opinion MCP integration requirement; existing codebase — confirmed correct
- StreamableHTTP transport: Prompt Opinion expects this; existing codebase implements it — confirmed correct
- Hybrid Q&A (deterministic + LLM): balances speed and hallucination risk — confirmed correct
- In-memory store was sufficient for POC but replaced with file-based JSON for v2.0 (no Supabase — file storage sufficient for demo scale)
- Keep TypeScript/Node stack — avoid migration overhead, existing patterns solid
- File-based JSON storage in `data/` directory — replaces in-memory store, avoids DB complexity
- Vercel (frontend) + Railway (backend) for v2.0 deployment — same ngrok approach stays for local dev

### v2.0 Key Decisions

- Storage: File-based JSON (`data/` directory) — not Supabase. Demo scale does not need a DB. Supabase listed as out-of-scope in REQUIREMENTS.md.
- PDF storage: `data/policies/raw/` — no Supabase Storage needed
- Patient data: `data/patients/{case-id}/` — synthetic/de-identified only
- Evaluations: `data/evaluations/{eval-id}.json` — persisted as flat JSON files
- Deployment: Vercel + Railway — ngrok stays for local dev and Prompt Opinion testing
- MCP tools: 10 new tools (Phase 11) backed by engines built in phases 5-10
- Knowledge graph: static/simple representation — no interactive D3 (out of scope per PROJECT.md)

### Pending Todos

- Run `/gsd:plan-phase 5` to generate plans for Phase 5 (File-Based Storage Foundation)

### Blockers/Concerns

- Local Ollama access was required for v1.0 LLM answers — v2.0 should support Claude API or configurable LLM backend (carry forward)
- Phase 1 data foundation (schema extension, BCBS NC + Cigna normalization) was completed but is partial — v2.0 must fully migrate to file-backed schema in Phase 5

## Session Continuity

Last session: 2026-04-21 (roadmap creation)
Stopped at: v2.0 roadmap written — phases 5-12 defined, 58 requirements mapped
Resume file: .planning/ROADMAP.md
Next action: `/gsd:plan-phase 5`
