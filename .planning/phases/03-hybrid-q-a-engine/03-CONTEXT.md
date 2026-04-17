# Phase 3: Hybrid Q&A Engine - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Natural language Q&A tool (`ask_policy_question`) that answers coverage questions using hybrid deterministic + LLM routing, with every factual claim validated against loaded policy evidence. Scope: single tool with routing, grounding, and evidence validation. Multi-turn conversation, question history, and new policy loading are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Query routing logic
- Try deterministic tools first, catch failure — attempt list/summary/compare with extracted entities; fall back to LLM on no match or empty result
- Explicit pass-throughs: known question patterns route directly to Phase 2 tools ("what policies are loaded" → list_policies, "summarize X" → get_policy_summary, "compare X across payers" → compare_drug_across_payers)
- LLM only runs if drug/policy entities are found in the question; otherwise return insufficient evidence immediately
- Response discloses which path handled the question (`route: "deterministic" | "llm"`) in structured_result

### LLM grounding rules
- Every factual claim needs evidence — transitional/framing sentences OK, but factual statements about criteria/drugs/payers must map to evidence snippets
- Evidence provided to LLM via retrieve-then-inject: pre-filter evidence by entities/keywords in question, pass snippets to LLM, instruct it to answer using ONLY those
- Ungrounded claims are stripped; remaining grounded answer is returned with a note that some content was filtered
- Cross-payer synthesis allowed — LLM can compare/contrast policies within its answer as long as each claim has evidence

### Insufficient evidence behavior
- Partial answer + gaps flagged: return any grounded portion with explicit gap callouts (e.g., "Cigna covers X but BCBS criteria unclear in loaded policies")
- Insufficient evidence triggered by EITHER: (a) entities not in loaded policies OR (b) zero grounded claims after validation
- Show loaded scope on insufficient evidence: "Loaded policies: BCBS NC (bevacizumab family), Cigna (rituximab family). Your question about X isn't covered"
- Off-topic questions (non-policy) get a distinct "out of scope" response, separate from insufficient evidence

### Response shape + confidence
- structured_result includes: detected entities (drug, payer), route taken (deterministic/llm), list of grounded claims with their evidence IDs
- Tiered confidence: HIGH = deterministic pass-through, MEDIUM = LLM fully grounded, LOW = LLM partial (some claims stripped)
- Extended evidence format: Phase 2's evidence array structure (snippet, source, location) plus a claim_id linking each evidence snippet to the specific sentence it grounds
- Explicit filtered note when grounding strips claims (e.g., `filtered_claims: 2` or "2 claims removed due to insufficient evidence")

### Claude's Discretion
- Entity extraction approach (regex, NLP, or LLM-based)
- LLM model selection and prompt engineering
- Evidence retrieval/ranking algorithm
- Exact claim-to-evidence matching strategy
- Error state handling and retry logic

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-hybrid-q-a-engine*
*Context gathered: 2026-04-17*
