---
phase: 02-core-mcp-tools
plan: 01
subsystem: mcp
tags: [mcp, zod, evidence, policy-tools]

requires:
  - phase: 01-policy-data-foundation
    provides: normalized policy records with evidence mappings and drug aliases
provides:
  - Standard MCP response helper with answer, structured_result, evidence, and confidence
  - Evidence extraction and confidence helpers for PolicyRecord data
  - Phase 2 tool input schemas
  - list_policies MCP tool
affects: [phase-02-core-mcp-tools, phase-03-hybrid-qa-engine]

tech-stack:
  added: []
  patterns:
    - StandardToolResponse JSON text content wrapper
    - EvidenceItem source citation shape
    - Zod schema descriptions for MCP tool inputs

key-files:
  created:
    - src/mcp/utils/response_builder.ts
    - src/mcp/utils/evidence_formatter.ts
    - src/mcp/tools/list_policies.ts
  modified:
    - src/mcp/schemas/tool_inputs.ts

key-decisions:
  - "List operations return HIGH confidence with an empty evidence array because they report deterministic metadata, not policy criteria."
  - "Drug filtering normalizes brand, generic, and biosimilar names through the Phase 1 alias system before matching policy generic names."

patterns-established:
  - "Phase 2 tools return MCP text content containing JSON with answer, structured_result, evidence, and confidence."
  - "Error responses include suggestions with available payer and drug values."

duration: 8 min
completed: 2026-04-15
---

# Phase 2 Plan 01: Shared Response Infrastructure and list_policies Summary

**Standard MCP response/evidence helpers plus list_policies discovery with payer and drug-family filtering**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-15T18:25:00Z
- **Completed:** 2026-04-15T18:33:32Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `buildStandardResponse()` and `buildErrorResponse()` so Phase 2 tools can return the required response envelope.
- Added evidence extraction and confidence calculation helpers for diagnosis, step therapy, and other policy requirements.
- Added Phase 2 Zod input schemas for `list_policies`, `get_policy_summary`, and `compare_drug_across_payers`.
- Added `list_policies` with optional payer and drug-family filters, including alias resolution for brands and biosimilars.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create response builder utility and evidence formatter** - `a7a0274` (feat)
2. **Task 2: Add Phase 2 input schemas and implement list_policies tool** - `5453496` (feat)

## Files Created/Modified

- `src/mcp/utils/response_builder.ts` - Standard response and error response builders with shared response types.
- `src/mcp/utils/evidence_formatter.ts` - Evidence array extraction and evidence-based confidence calculation.
- `src/mcp/schemas/tool_inputs.ts` - Additive Zod schemas for all three Phase 2 tools.
- `src/mcp/tools/list_policies.ts` - MCP registration and handler for policy discovery.

## Decisions Made

- List responses use `confidence: "HIGH"` with no field-level evidence because the tool returns loaded metadata rather than criteria assertions.
- Zero-result list filters use the standard error response shape and include available payers/drugs for correction.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npx tsx -e` was blocked by sandbox IPC restrictions; reran the verification command outside the sandbox.
- The original smoke-test import form hit a `tsx -e` CommonJS resolution quirk with `.js` specifiers; reran with dynamic TypeScript imports for verification only. Project source remained ESM-compatible and `npx tsc --noEmit` passed.

## User Setup Required

None - no external service configuration required.

## Verification

- `npx tsc --noEmit` passed.
- Smoke test confirmed 7 policies load.
- Smoke test confirmed `Avastin` and `Mvasi` normalize to `bevacizumab`.
- Smoke test confirmed `listPoliciesInput.shape` exposes `payer` and `drug_family`.

## Next Phase Readiness

Ready for `02-02`: summary and comparison tools can now import the response builder, evidence formatter, and predeclared input schemas.

---
*Phase: 02-core-mcp-tools*
*Completed: 2026-04-15*
