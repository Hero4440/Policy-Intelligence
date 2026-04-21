# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-21)

**Core value:** Every policy question answered must include source-backed evidence from loaded policy documents — and every coverage evaluation must show exactly which criteria are met, missing, or ambiguous.
**Current focus:** Milestone v2.0 — defining requirements and roadmap

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Milestone v2.0 started — requirements and roadmap being defined
Last activity: 2026-04-21 — Milestone v2.0 started

## Performance Metrics

**v1.0 POC Velocity:**
- Total plans completed: 8
- Average duration: 6.88 minutes
- Total execution time: 0.92 hours

## Accumulated Context

### Decisions (carried from v1.0)

- MCP over A2A: Prompt Opinion MCP integration requirement; existing codebase — confirmed correct
- StreamableHTTP transport: Prompt Opinion expects this; existing codebase implements it — confirmed correct
- Hybrid Q&A (deterministic + LLM): balances speed and hallucination risk — confirmed correct
- In-memory store was sufficient for POC but must be replaced with Supabase Postgres for v2.0
- Keep TypeScript/Node stack — avoid migration overhead, existing patterns solid
- Supabase Postgres + Storage for v2.0 persistence layer
- Vercel + Railway for v2.0 deployment

### Pending Todos

- None. Requirements and roadmap being defined now.

### Blockers/Concerns

- Local Ollama access was required for v1.0 LLM answers — v2.0 should support Claude API or configurable LLM backend
- Phase 1 data foundation (schema extension, BCBS NC + Cigna normalization) was completed but is partial — v2.0 must fully migrate to DB-backed schema

## Session Continuity

Last session: 2026-04-21 (new-milestone)
Stopped at: Requirements + roadmap definition in progress
Resume file: .planning/ROADMAP.md (once created)
