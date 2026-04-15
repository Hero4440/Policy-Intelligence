---
phase: 02-core-mcp-tools
plan: 02
subsystem: mcp
tags: [mcp, policy-summary, payer-comparison, evidence]

requires:
  - phase: 02-core-mcp-tools
    provides: shared response and evidence helpers from 02-01
provides:
  - get_policy_summary MCP tool
  - compare_drug_across_payers MCP tool
  - MCP server registration for all six tools
affects: [phase-03-hybrid-qa-engine, phase-04-deployment-integration]

tech-stack:
  added: []
  patterns:
    - MCP tool-call responses using StandardToolResponse
    - Server-Sent Event parsing for Streamable HTTP verification
    - Side-by-side comparison fields with differs flags and evidence maps

key-files:
  created:
    - src/mcp/tools/get_policy_summary.ts
    - src/mcp/tools/compare_drug_across_payers.ts
  modified:
    - src/mcp/index.ts
    - src/mcp/policy_store/loader.ts

key-decisions:
  - "Single-payer comparisons still return available data with MEDIUM confidence and an explicit partial-data note."
  - "Bevacizumab comparison highlights the BCBS-NC preferred/non-preferred product split even when only one payer policy is loaded for that drug family."

patterns-established:
  - "Summary tools include inline evidence_ref values in structured_result and full citations in the top-level evidence array."
  - "Comparison tools include per-payer values, differs flags, per-payer evidence, key_differences, and key_takeaway."

duration: 8 min
completed: 2026-04-15
---

# Phase 2 Plan 02: Summary, Comparison, and Registration Summary

**Evidence-grounded policy summary and drug comparison tools registered in the MCP server**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-15T18:33:32Z
- **Completed:** 2026-04-15T18:41:13Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `get_policy_summary` with policy ID lookup and payer plus drug lookup.
- Added `compare_drug_across_payers` with side-by-side values, difference flags, evidence maps, key differences, and a plain-language takeaway.
- Registered `list_policies`, `get_policy_summary`, and `compare_drug_across_payers` in the MCP server.
- Updated `/health` to report six registered tools.
- Verified the new tools through the actual Streamable HTTP MCP endpoint.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement get_policy_summary and compare_drug_across_payers tools** - `3269015` (feat)
2. **Task 2: Register all Phase 2 tools in MCP server and update health endpoint** - `5202abb` (feat)

## Files Created/Modified

- `src/mcp/tools/get_policy_summary.ts` - Detailed single-policy summary with evidence and confidence.
- `src/mcp/tools/compare_drug_across_payers.ts` - Drug-family comparison with payer values, differences, evidence, and takeaway.
- `src/mcp/index.ts` - Registers the three new Phase 2 tools and reports `tools: 6`.
- `src/mcp/policy_store/loader.ts` - Fixes exact hyphenated payer lookup for BCBS-NC while preserving existing payer-prefix behavior.

## Decisions Made

- Single-payer comparisons return `confidence: "MEDIUM"` and include an explicit note that more policies are needed for full comparison.
- The comparison tool still surfaces an internally important preferred/non-preferred product split when only one payer is loaded for a drug family.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Exact hyphenated payer lookup failed for BCBS-NC**
- **Found during:** Task 1 (get_policy_summary lookup implementation)
- **Issue:** `findPolicy("BCBS-NC", "bevacizumab")` reduced the payer query to `bcbs`, which could not match loaded payer `BCBS-NC`.
- **Fix:** Updated `findPolicy()` to match exact payer names first while preserving existing prefix behavior for identifiers such as `uhc-commercial`.
- **Files modified:** `src/mcp/policy_store/loader.ts`
- **Verification:** Smoke test confirmed `findPolicy("BCBS-NC", "bevacizumab")` returns `bcbs-nc-bevacizumab-oncology`.
- **Committed in:** `3269015`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was required for the planned payer plus drug lookup path and does not change public tool contracts.

## Issues Encountered

- Streamable HTTP returns `tools/list` as `text/event-stream`; verification parsed the SSE `data:` payload rather than plain JSON.
- Local verification prints the MCP SDK warning about binding to `0.0.0.0` because the existing app intentionally uses that host for rotating ngrok support.

## User Setup Required

None - no external service configuration required.

## Verification

- `npx tsc --noEmit` passed.
- `/health` returned `tools: 6` and `policies: 7`.
- MCP `tools/list` returned all six expected tools.
- `get_policy_summary` for Cigna Rituxan returned the standard response shape and step therapy containing Truxima, Riabni, and Ruxience.
- `compare_drug_across_payers` for Avastin/Mvasi returned the standard response shape and BCBS-NC Mvasi/Zirabev preferred-product takeaway.
- `list_policies` filtered `payer: "bcbs"` and `drug_family: "Mvasi"` to one loaded policy.
- `list_policies` zero-result response included available payer and drug suggestions.
- Existing `get_drug_coverage` still returned `covered-with-pa` for UHC Humira.

## Next Phase Readiness

Phase 2 deterministic tools are complete and ready to support Phase 3 natural-language routing and evidence-grounded Q&A.

---
*Phase: 02-core-mcp-tools*
*Completed: 2026-04-15*
