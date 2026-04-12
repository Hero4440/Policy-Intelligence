# Phase 2: Core MCP Tools - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Build three deterministic MCP tools (list_policies, get_policy_summary, compare_drug_across_payers) that deliver policy intelligence with evidence grounding and structured responses. Tools consume the normalized policy data from Phase 1. Natural language Q&A is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Response Structure
- Human-readable answer verbosity: Claude's discretion per tool
- Structured result scope: Claude's discretion — full schema or query-relevant subset as appropriate
- Confidence levels: Evidence-based — HIGH when all fields have evidence, MEDIUM when some fields lack evidence snippets
- Error responses: Helpful suggestions — e.g., "Drug X not found. Did you mean: bevacizumab, rituximab?"

### Comparison Logic
- Format: Both views — show all fields for completeness, with differences highlighted
- Key differences: Prioritize coverage criteria (preferred/non-preferred splits, step therapy, prior auth) as the most important fields to highlight
- Partial data: Show available policy data + mark missing payer as "No policy loaded" with explanation
- Key takeaway: Always include a 1-2 sentence plain-language summary of the most important difference between payers

### Tool Input Design
- Drug name resolution: Accept any name (brand, generic, biosimilar) and resolve via the drug alias system from Phase 1
- Policy identification: Support both policy ID string (e.g., "bcbs-nc-bevacizumab-onc") AND payer + drug family as separate params
- list_policies filtering: Support optional payer and drug_family filter params
- Tool descriptions: Written for both audiences — primary description LLM-optimized, with developer notes in extended metadata

### Evidence Presentation
- Evidence structure: Both inline and separate — each field in structured_result includes its evidence reference, plus a dedicated evidence array for detailed access
- Source citations: Full citation — include policy title, effective date, and section/page where text appears
- Comparison evidence: Per-payer evidence for each compared field, so readers can verify both sides
- Missing evidence: Flag explicitly — mark field as "no evidence available" for transparency about data gaps

### Claude's Discretion
- Human-readable answer length per tool
- Structured result field selection (full vs subset)
- Exact response formatting and layout
- Loading/caching strategy for policy data

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

*Phase: 02-core-mcp-tools*
*Context gathered: 2026-04-12*
