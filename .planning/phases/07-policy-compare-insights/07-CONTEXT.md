# Phase 7: Policy Compare + Insights - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the v2 comparison and insight surfaces on top of the versioned policy store from Phases 5-6. This phase covers: side-by-side policy comparison, deterministic difference highlights, evidence-backed comparison cells, a heat map view, and a simple relationship graph. It does not cover version diff timelines, patient-case evaluation, or next-step generation.

</domain>

<decisions>
## Implementation Decisions

### Source Of Truth
- Compare and insights must read from the v2 file-backed policy store (`src/storage/*`), not the older `antonrx` demo dataset
- Current policy version is the default comparison target; version filters are supported where the requirement explicitly asks for them
- Every displayed compare/insight value must carry source evidence metadata forward to the UI

### Comparison Data Shape
- Normalize policies into a fixed comparison schema with these rows: preferred products, non-preferred products, prior auth, step therapy, covered indications, key restrictions
- Each row returns both a display value and zero or more evidence references
- Difference highlights are generated deterministically from normalized row values, not free-form LLM output

### Evidence Interaction
- Compare cells and insight cells open a shared evidence panel rather than embedding long snippets inline
- Evidence payloads should include: snippet text, source filename, page number, section/field label, and policy/version identity
- If a field has no direct evidence snippet, show an explicit fallback label instead of pretending evidence exists

### Insights Page Scope
- Heat map and knowledge graph live on the same Policy Insights page and share the same filters
- Heat map is the primary insight artifact; knowledge graph is intentionally simple/static and should not introduce a graph library unless the implementation clearly needs one
- Color mapping should be semantic and stable: green = covered/favorable, yellow = conditional/restricted, red = not covered/restrictive, neutral = unknown or no signal

### Legacy Code Handling
- Existing `antonrx` compare/change views are useful UI references but are not the domain layer for v2
- Reuse presentational patterns where helpful, but do not couple new Phase 7 APIs to `antonrx` types

### Claude's Discretion
- Exact compare route names and response shapes
- Whether the heat map is rendered as CSS grid or table
- Whether the knowledge graph uses SVG or positioned HTML nodes
- How many difference highlights to surface by default before collapsing into “more differences”

</decisions>

<specifics>
## Specific Ideas

- Add a compare-focused server module that turns `PolicyRecord` + version metadata into normalized comparison rows
- Introduce a frontend evidence drawer/panel component shared by Compare and Insights pages
- Keep all highlight logic deterministic and explainable: “same”, “missing in payer X”, “stricter in payer Y”, “preferred split differs”
- Reuse the existing top-level page nav pattern by splitting Compare and Insights into separate top-level pages

</specifics>

<deferred>
## Deferred Ideas

- Historical compare across arbitrary version pairs belongs to Phase 8
- Interactive force-directed or draggable graph behavior is out of scope; a static relationship view is enough
- LLM-authored narrative summaries of payer differences are out of scope for this phase

</deferred>

---

*Phase: 07-policy-compare-insights*
*Context gathered: 2026-04-21*
