# Phase 1: Policy Data Foundation - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract and structure real payer policy data from public PDFs into queryable JSON. Covers 3 payers (UHC, Aetna, Cigna) and top RA biologics. Downstream MCP tools, patient integration, and deployment are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Policy & drug selection
- Target top 3-4 RA biologics: Humira (adalimumab), Enbrel (etanercept), Remicade (infliximab), and potentially one JAK inhibitor like Rinvoq
- Three payers: UHC, Aetna, Cigna — all have public medical policy documents
- Use whatever the actual policies say — don't engineer variation between payers for demo purposes; let real differences emerge
- Support both brand and generic name lookups (e.g., "Humira" and "adalimumab" both return results)

### Extraction granularity
- Full detail on step therapy: capture each required prior therapy, duration, and failure criteria (e.g., "Must fail methotrexate 15mg+ for 3 months")
- Hybrid approach for complex conditional logic: structure main criteria (diagnosis codes, step therapy requirements, lab requirements) as discrete fields, keep nuanced conditional language as evidence text for LLM interpretation
- Flag ambiguous policy language with an ambiguity marker — downstream tools can surface this to users rather than guessing
- Quantity limits and dosing restrictions: capture in evidence text only, not as structured fields — LLM interprets at query time

### Demo scenario coverage
- The key demo moment is gap identification — a patient who's ALMOST ready but missing one thing (e.g., "You need a documented methotrexate failure")
- Include at least one denial scenario (drug/payer combo where coverage is excluded) alongside covered-with-requirements scenarios
- Target 3 distinct scenarios: one clear approval path, one with gaps (the wow moment), one denial
- Let scenario mapping emerge from real policy data rather than pre-planning which drug+payer maps to which scenario

### Evidence text handling
- Lightly edited policy quotes: clean up PDF formatting artifacts but preserve substance and traceability
- Full source attribution: document name, page number, and section header for every evidence quote
- Key sentences only (1-2 most relevant sentences per criterion), not full paragraphs
- Evidence always shown inline with determinations — every coverage result includes supporting policy quote

### Claude's Discretion
- JSON schema design and field naming
- PDF extraction technique and tooling
- File organization within the policy store
- Handling of policies that don't cleanly fit the schema

</decisions>

<specifics>
## Specific Ideas

- Gap identification is the signature demo moment — data should support a scenario where a patient is close but missing one specific criterion
- Brand/generic aliasing is important because clinicians and specialists use both interchangeably
- Evidence text should build trust immediately — always inline, never hidden behind a click

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-policy-data-foundation*
*Context gathered: 2026-04-04*
