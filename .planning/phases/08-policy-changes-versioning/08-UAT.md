---
status: ready
phase: 08-policy-changes-versioning
source: 08-01-PLAN.md, 08-02-PLAN.md, 08-03-PLAN.md, 08-04-PLAN.md
started: 2026-04-22T00:00:00Z
updated: 2026-04-22T00:00:00Z
---

## Purpose

Manual browser UAT checklist for Phase 8. This validates the Policy Changes timeline, deterministic severity labels, and Version Diff workflow in the browser against the file-backed policy version store.

## Preconditions

1. Start the backend in one terminal:
   `npm run server:dev`
2. Start the frontend in another terminal:
   `npm run frontend:dev`
3. Open the app in your browser:
   `http://localhost:4173`
4. Confirm the top nav includes:
   `Workspace`, `Compare`, `Insights`, `Changes`, `Data`, `Patients`
5. Confirm at least one policy has two or more saved versions so a version diff can be opened

## Current Test
<!-- OVERWRITE each run -->

[not started]

## Tests

### 1. App Boot + Changes Nav Smoke
expected: App loads without a blank screen. The `Changes` page is reachable from the top nav. No immediate error banner appears on first load.
result: pending
notes:

### 2. Changes Page Loads Timeline Data
expected: Opening `Changes` loads a valid timeline view without crashing. If version events exist, they are shown newest-first. If no version events exist yet, the page shows a clear empty state rather than a broken table.
result: pending
notes:

### 3. Timeline Cards Show Policy Identity + Version Pair
expected: Each timeline event shows enough metadata to identify the change: policy title, payer, drug family, timestamp, and version pair such as `v1 -> v2`.
result: pending
notes:

### 4. Change Table Shows Required Columns
expected: For an event with detected changes, the change table shows field, old value, new value, severity, and rationale. Important clinical fields should not appear only as opaque object dumps when they can be flattened meaningfully.
result: pending
notes:

### 5. Severity Labels Are Visually Distinct
expected: `cosmetic`, `operational`, and `clinical` are visually distinguishable. Clinical changes should read as the most prominent/high-risk label, and cosmetic changes should read as the least severe.
result: pending
notes:

### 6. Filters Narrow Timeline Correctly
expected: Timeline filters for payer, drug family, and severity narrow the visible event list correctly. Clearing filters returns the full result set.
result: pending
notes:

### 7. Clinical Classification Looks Correct
expected: At least one PA / step therapy / product tier / coverage posture / restriction change is labeled `clinical`. The label should match the actual changed field and not appear on trivial formatting edits.
result: pending
notes:

### 8. Non-Clinical Classification Looks Correct
expected: At least one metadata or wording-oriented change is labeled `cosmetic` or `operational`, not `clinical`. The rationale should explain why it is non-clinical.
result: pending
notes:

### 9. Version Diff Action Opens Selected Pair
expected: Using the diff action from a timeline event opens the Version Diff screen for that exact policy and version pair. The page should not silently open the wrong pair.
result: pending
notes:

### 10. Version Diff Shows Structured Changes
expected: The Version Diff screen shows structured field-level changes with severity labels and values matching the selected version pair.
result: pending
notes:

### 11. Version Diff Shows Side-by-Side Text Snapshots
expected: The same Version Diff screen shows readable left/right text panes for the two selected versions. Text is scrollable if long, but the layout remains usable on a normal laptop viewport.
result: pending
notes:

### 12. Version Labels Match Selected Pair
expected: The Version Diff screen labels the left and right panes with the correct version numbers so the user can tell which version is older and which is newer.
result: pending
notes:

### 13. Back Navigation Returns To Changes Timeline
expected: Leaving the Version Diff screen returns the user to the Changes workflow cleanly without forcing a full app reset or losing the current page.
result: pending
notes:

### 14. Empty / Missing Diff State Fails Clearly
expected: If a selected version pair has missing data or no diffable content, the UI shows a clear empty/error state rather than a silent blank area or runtime crash.
result: pending
notes:

### 15. Regression Check: Compare Still Loads
expected: Returning to `Compare` still shows the Phase 7 compare flow. Phase 8 nav or state wiring must not break compare.
result: pending
notes:

### 16. Regression Check: Insights Still Loads
expected: Returning to `Insights` still shows the Phase 7 insights flow. Phase 8 must not break heat map or graph loading.
result: pending
notes:

### 17. Regression Check: Data Page Still Loads
expected: Opening `Data` still shows ingestion sources and summary cards. Phase 8 top-level navigation changes must not break the ingestion view.
result: pending
notes:

### 18. Regression Check: Patients Page Still Loads
expected: Opening `Patients` still shows the patient case list and detail workflow shell. Phase 8 must not break patient navigation.
result: pending
notes:

### 19. Browser Console + Visual Sanity
expected: During the full UAT pass, there are no obvious React crashes, infinite spinners, or badly broken layout sections on a standard laptop viewport. Minor warnings can be noted, but blocking console/runtime errors should be treated as failures.
result: pending
notes:

## Summary

total: 19
passed: 0
issues: 0
pending: 19
skipped: 0

## Blocking Failures

[none logged yet]

## Non-Blocking Notes

[none logged yet]

## Sign-Off

phase_8_changes_timeline: pending
phase_8_materiality: pending
phase_8_version_diff: pending
phase_8_regression: pending
overall: pending
