---
phase: 03-hybrid-q-a-engine
plan: 01
subsystem: mcp
tags: [mcp, entities, routing, evidence]

requires:
  - phase: 02-core-mcp-tools
    provides: deterministic policy tools and evidence response primitives
provides:
  - entity extraction for payer and drug mentions
  - deterministic-first query routing
  - evidence retrieval filtered by entities and question keywords
affects: [phase-03-02, phase-04-deployment-integration]

tech-stack:
  added: []
  patterns:
    - regex-first entity extraction backed by canonical drug alias normalization
    - deterministic route classification before LLM fallback
    - evidence filtering by entity scope plus non-entity keywords

key-files:
  created:
    - src/mcp/tools/utils/entity_extractor.ts
    - src/mcp/tools/utils/query_router.ts
    - src/mcp/tools/utils/evidence_retriever.ts
  modified: []

key-decisions:
  - "Entity extraction stays regex-based because the drug and payer surface area is small and already normalized through the existing alias map."
  - "Route classification only promotes summary queries to deterministic handling when both payer and drug are present, avoiding under-specified summary calls."

patterns-established:
  - "Hybrid Q&A utilities pass normalized entities forward rather than raw mention text."
  - "Evidence retrieval returns both filtered snippets and the policy IDs searched so later layers can explain scope decisions."

duration: 10 min
completed: 2026-04-17
---

# Phase 3 Plan 01: Hybrid Q&A Utility Layer Summary

**Natural-language entity extraction, deterministic route selection, and scoped evidence retrieval for hybrid policy Q&A**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-17T23:59:00Z
- **Completed:** 2026-04-18T00:09:33Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added payer and drug entity extraction that normalizes brand, biosimilar, and FDA suffix mentions to canonical drug families.
- Added deterministic routing for policy listing, single-policy summaries, and cross-payer comparisons, with explicit out-of-scope and insufficient-evidence branches.
- Added evidence retrieval scoped by detected entities plus residual question keywords for later LLM grounding.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build entity extractor and query router** - `f8af3f8` (feat)
2. **Task 2: Build evidence retriever** - `9629406` (feat)

## Files Created/Modified

- `src/mcp/tools/utils/entity_extractor.ts` - Detects and normalizes drug and payer entities from natural-language questions.
- `src/mcp/tools/utils/query_router.ts` - Chooses deterministic, LLM, out-of-scope, or insufficient-evidence handling based on patterns and loaded policy scope.
- `src/mcp/tools/utils/evidence_retriever.ts` - Filters loaded evidence by normalized entities and non-entity keywords.

## Decisions Made

- Kept entity extraction regex-based to stay deterministic and transparent with the current two-payer, multi-drug scope.
- Limited deterministic summary routing to questions that include both payer and drug so incomplete entity matches do not produce misleading single-policy summaries.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `getAllPolicies()` logs the policy count on module load during ad-hoc verification, which is expected with the current loader design.

## User Setup Required

None - no external service configuration required.

## Verification

- `npx tsc --noEmit` passed.
- `extractEntities("What does Cigna require for rituximab?")` returned `drug: "rituximab"` and `payer: "Cigna"`.
- `routeQuery("What does Cigna require for rituximab?", ...)` returned deterministic `get_policy_summary`.
- `routeQuery("What is the weather?", ...)` returned `out_of_scope`.
- `retrieveEvidence({ drug: "rituximab", payer: "Cigna" }, ...)` returned 15 evidence snippets from the matching loaded policy.

## Next Phase Readiness

Phase 3 Plan 02 can now compose the utility modules into `ask_policy_question` and layer in the LLM client plus claim validation.

---
*Phase: 03-hybrid-q-a-engine*
*Completed: 2026-04-17*
