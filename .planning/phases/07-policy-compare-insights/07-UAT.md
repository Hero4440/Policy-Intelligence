---
status: ready
phase: 07-policy-compare-insights
source: 07-01-PLAN.md, 07-02-PLAN.md, 07-03-PLAN.md, 07-04-PLAN.md, 07-05-PLAN.md
started: 2026-04-22T00:00:00Z
updated: 2026-04-22T00:00:00Z
---

## Purpose

Manual browser UAT checklist for Phase 7. This validates the new v2 Policy Compare and Policy Insights flows in the browser against the current file-backed policy store.

## Preconditions

1. Start the backend in one terminal:
   `npm run server:dev`
2. Start the frontend in another terminal:
   `npm run frontend:dev`
3. Open the app in your browser:
   `http://localhost:4173`
4. Confirm the top nav includes:
   `Workspace`, `Compare`, `Insights`, `Data`, `Patients`

## Current Test
<!-- OVERWRITE each run -->

[not started]

## Tests

### 1. App Boot + Nav Smoke
expected: App loads without a blank screen. The new `Compare` and `Insights` pages are reachable from the top nav. No immediate error banner appears on first load.
result: pending
notes:

### 2. Compare Page Loads Default Compare-Ready Data
expected: Opening `Compare` loads a valid default drug family and at least two payers without requiring manual repair. The left pane shows a drug family selector, payer checklist, and version selector. The detail pane does not show a hard failure state on first open.
result: pending
notes:

### 3. Compare Table Shows Required Rows
expected: With a valid drug family and at least two selected payers, the compare table renders these rows:
- Preferred Products
- Non-Preferred Products
- Prior Auth
- Step Therapy
- Covered Indications
- Key Restrictions
One payer column appears per selected payer.
result: pending
notes:

### 4. Compare Requires At Least Two Payers
expected: Deselecting payers down to fewer than two should not silently produce misleading results. The UI should either show a clear empty state or a clear error telling the user that at least two payers are required.
result: pending
notes:

### 5. Compare Highlights Are Meaningful
expected: Highlight cards appear above the compare table when payers differ. At least one highlight should reflect a real policy difference visible in the table, such as prior auth mismatch, step therapy mismatch, or preferred/non-preferred product differences.
result: pending
notes:

### 6. Compare Cell Opens Evidence Panel
expected: Clicking a compare cell opens the evidence panel below the table. The panel shows at least one source item with snippet text, source document, and page number or an explicit normalized fallback reference.
result: pending
notes:

### 7. Compare Evidence Clear Action Works
expected: Clicking `Clear` in the evidence panel closes or resets the current evidence view without breaking the compare table state.
result: pending
notes:

### 8. Compare Version Filter Works
expected: If multiple versions exist for the selected drug family, switching the version selector updates the compare payload. If no alternate version is meaningful for the selected family, the UI remains stable and does not break.
result: pending
notes:

### 9. Compare Drug Family Switch Rebinds Payers Correctly
expected: Switching the drug family updates the available payer checklist to only payers valid for that family. The page should not keep impossible payer selections that force an immediate error state.
result: pending
notes:

### 10. Insights Page Loads Default Data
expected: Opening `Insights` loads a valid default drug family and renders both the heat map and the knowledge graph area. The filter pane shows drug family, rule type, version, and payer controls.
result: pending
notes:

### 11. Insights Heat Map Renders Filtered Grid
expected: The heat map shows payer columns and rule-type rows. Cells use semantic status styling and contain readable values/status text rather than empty placeholders for valid rows.
result: pending
notes:

### 12. Insights Rule Type Filter Works
expected: Selecting a specific rule type narrows the heat map to that rule type only. Clearing the rule type filter returns the full set of Phase 7 rule rows.
result: pending
notes:

### 13. Insights Payer Filter Works
expected: Toggling payers in the Insights filter updates the heat map and graph to reflect only the selected payers. At least one payer must remain visible; if none remain, the UI should fail clearly rather than rendering corrupted state.
result: pending
notes:

### 14. Heat Map Cell Opens Evidence
expected: Clicking a heat map cell opens the shared evidence panel. Evidence should match the selected payer and rule type and show snippet + page reference or an explicit normalized fallback reference.
result: pending
notes:

### 15. Knowledge Graph Renders Relationship Nodes
expected: The graph area shows nodes representing at least these concepts:
- drug
- payer
- policy
- rule
The layout can be simple/static, but it must be readable and not overlap into unusable clutter at normal desktop width.
result: pending
notes:

### 16. Knowledge Graph Node Click Shows Context
expected: Clicking a graph node opens evidence or graph-context details in the shared evidence panel. For nodes without direct evidence, the panel should explain what the node represents instead of failing silently.
result: pending
notes:

### 17. Regression Check: Workspace Still Loads
expected: Returning to `Workspace` still shows the prior Anton Rx workspace flow. Existing tabs and detail panes still render; Phase 7 must not break the old workspace page.
result: pending
notes:

### 18. Regression Check: Data Page Still Loads
expected: Opening `Data` still shows ingestion sources and summary cards. No new top-level navigation changes should break the ingestion view.
result: pending
notes:

### 19. Regression Check: Patients Page Still Loads
expected: Opening `Patients` still shows the patient case list and patient case detail area. No Phase 7 navigation work should break the patient workflow shell.
result: pending
notes:

### 20. Browser Console + Visual Sanity
expected: During the full UAT pass, there are no obvious React crashes, infinite spinners, or broken layout sections on a standard laptop viewport. Minor warnings can be noted, but blocking console/runtime errors should be treated as failures.
result: pending
notes:

## Summary

total: 20
passed: 0
issues: 0
pending: 20
skipped: 0

## Blocking Failures

[none logged yet]

## Non-Blocking Notes

[none logged yet]

## Sign-Off

phase_7_compare: pending
phase_7_insights: pending
phase_7_regression: pending
overall: pending
