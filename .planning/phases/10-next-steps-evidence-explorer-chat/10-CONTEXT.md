# Phase 10: Next Steps + Evidence Explorer + Chat - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the final clinic-workflow features that sit on top of Phase 9's coverage evaluation engine: next-step generation, patient-friendly explanations, payer-analyst narratives, a keyword Evidence Explorer, and an evidence-backed Chat page.

This phase does NOT cover MCP tool expansion (Phase 11) or portal dashboard/deployment (Phase 12).

</domain>

<decisions>
## Implementation Decisions

### Source Of Truth
- All data reads from the file-backed stores established in Phases 5-9: policy store (`src/storage/*`), evaluation store (`data/evaluations/`), patient case store (`data/patients/`)
- No new storage layer is introduced; Phase 10 layers server-side logic on top of what already exists
- The coverage evaluation record from Phase 9 is the authoritative input for next-step generation — no re-evaluation in Phase 10

### Architecture Patterns (from prior phases)
- Keep TypeScript/Node stack — same as existing backend
- File-based JSON storage in `data/` — no DB, no Supabase
- Evidence payloads must include: snippet text, source filename, page number, section/field label, policy/version identity (same pattern as Phase 7)
- Every LLM call should use the local Ollama-compatible Llama path — configured via environment variables
- Deterministic logic preferred first; LLM used only where natural-language generation is explicitly required (next steps, explanations, chat)

### Next Steps Module (NEXT-01 through NEXT-04)
- Next steps and explanations are generated on-demand from the stored evaluation record + the stored policy version
- Three distinct output views from the same evaluation:
  1. **Clinic staff**: ordered next-step list + missing documentation checklist
  2. **Patient-friendly**: plain-language explanation of coverage status and what clinic needs to do
  3. **Payer analyst**: which criteria apply, what evidence satisfies each, what is missing
- LLM generation is acceptable for prose narratives; structured checklists (missing docs) should be derived deterministically from the evaluation checklist items with status `MISSING`
- Explanation views should be integrated into the existing Patient Case Detail page from Phase 9 (tabs or collapsible sections), not separate routes

### Evidence Explorer (EVID-01 through EVID-03)
- Keyword search across all stored policy evidence snippets
- Search is keyword/substring match first — no vector/semantic search for this phase
- Results must show: source policy name, page number, section heading, snippet text, linked policy field
- Clicking a result navigates to the Policy Detail page (Phase 6) scrolled to that evidence item
- Evidence Explorer is a top-level page in the portal nav (same nav pattern as Compare, Insights, Changes)

### Chat Page (CHAT-01 through CHAT-03)
- Natural-language Q&A backed by the existing hybrid Q&A engine from Phase 3 (`src/mcp/qa/`)
- Chat responses include inline evidence citations: policy name, page, section
- Sidebar shows evidence snippets cited in the current response (reuse evidence panel pattern from Phase 7)
- Chat is a top-level page in the portal nav
- Conversation history is session-only (no persistence required for this phase)

### UI Integration
- Reuse existing portal shell and top-nav in `src/frontend/App.tsx`
- New top-level routes: Evidence Explorer, Chat
- Next-step/explanation views extend the Phase 9 Patient Case Detail page
- Reuse the shared evidence panel component from Phase 7 for both Evidence Explorer and Chat sidebar

### Claude's Discretion
- Exact API endpoint names for next-step generation and explanation views
- Whether next-step views are rendered as tabs, accordion, or separate sections within the case detail
- Whether Evidence Explorer uses a debounced input or explicit search button
- Chat message layout (bubbles vs rows)

</decisions>

<specifics>
## Specific Ideas

- Add a `src/server/next-steps.ts` domain module that consumes a stored evaluation record and generates:
  - ordered clinic next-steps list
  - missing-docs checklist (deterministic from MISSING items)
  - patient-friendly plain-language prose (LLM)
  - payer analyst breakdown (LLM with deterministic structure)
- Add a `src/server/evidence-search.ts` module that does keyword search over all policy evidence files
- Extend the Phase 9 case detail view with a "Next Steps" tab showing all three views
- Add a `/api/evidence/search?q=` endpoint for the Evidence Explorer page
- Add a `/api/chat` endpoint that wraps the existing Phase 3 hybrid Q&A engine with evidence citations
- Reuse `src/mcp/qa/` modules — the chat endpoint is essentially the same as `ask_policy_question` MCP tool but with session context

</specifics>

<deferred>
## Deferred Ideas

- Vector/semantic evidence search (keyword search is sufficient for this phase)
- Chat history persistence across sessions
- Multi-turn context tracking beyond the current message
- Next-step generation integrated with MCP tools (that belongs to Phase 11)
- Patient-facing portal role switcher (Phase 12)

</deferred>

---

*Phase: 10-next-steps-evidence-explorer-chat*
*Context gathered: 2026-04-22*
*Sources: Phase 7/8/9 CONTEXT.md files, docs/prompt-opinion/post-poc.md*
