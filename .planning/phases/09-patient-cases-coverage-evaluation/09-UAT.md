---
status: ready
phase: 09-patient-cases-coverage-evaluation
source: 09-01-PLAN.md, 09-02-PLAN.md, 09-03-PLAN.md, 09-04-PLAN.md, 09-05-PLAN.md
started: 2026-04-22T00:00:00Z
updated: 2026-04-22T00:00:00Z
---

## Purpose

Manual browser UAT checklist for Phase 9. This validates the patient case intake and coverage-evaluation workflow against the current file-backed policy, patient, and evaluation stores.

## Preconditions

1. Start the backend in one terminal:
   `npm run server:dev`
2. Start the frontend in another terminal:
   `npm run frontend:dev`
3. Open the app in your browser:
   `http://localhost:4173`
4. Confirm the top nav includes:
   `Workspace`, `Compare`, `Insights`, `Changes`, `Data`, `Patients`

## Current Test
<!-- OVERWRITE each run -->

[not started]

## Tests

### 1. Patients Page Loads
expected: Opening `Patients` shows the case list and the case detail area without a blank screen or immediate error state.
result: pending
notes:

### 2. Create New Patient Case
expected: Creating a case with synthetic patient name, payer, requested drug, and diagnosis adds the case to the list with status `missing-docs`.
result: pending
notes:

### 3. New Case Persists Across Refresh
expected: Refreshing the browser keeps the newly created case in the list and still selectable by case id.
result: pending
notes:

### 4. Upload Clinical Note
expected: Uploading or saving a text clinical note attaches a new document to the selected case and updates the case detail view without a crash.
result: pending
notes:

### 5. Upload Structured/FHIR Document
expected: Uploading a supported JSON/FHIR-style document succeeds and appears as a separate document record with a document type and summary.
result: pending
notes:

### 6. Extracted Facts Render
expected: After document upload, the case detail view shows extracted facts for any fields present in the source document, including at least some of: diagnosis, requested drug, prior therapies, prescriber, payer/insurance.
result: pending
notes:

### 7. Facts Show Source Context
expected: Each extracted fact shows a readable evidence snippet or explicit source reference tied to the originating uploaded document.
result: pending
notes:

### 8. Case Status Advances To Ready For Eval
expected: Once the case has uploaded documents and extracted facts, the case status advances from `missing-docs` to `ready-for-eval`.
result: pending
notes:

### 9. Policy And Version Selection Are Available
expected: The case detail evaluation section allows selecting a policy and version relevant to the current case or fails clearly if no policy data exists.
result: pending
notes:

### 10. Trigger Coverage Evaluation
expected: Running an evaluation produces a saved result for the selected case and selected policy version without breaking the page.
result: pending
notes:

### 11. Coverage Status Is One Of The Allowed Phase 9 Labels
expected: The result status is exactly one of:
- Covered
- PA Required
- Likely Eligible but Docs Missing
- Not Covered
- Preferred Alternative Required
- Unclear
result: pending
notes:

### 12. Checklist Uses Required Item Labels
expected: The evaluation checklist renders item-level statuses using only:
- PASS
- MISSING
- UNKNOWN
- NEEDS REVIEW
result: pending
notes:

### 13. Checklist Links Patient Facts And Policy Evidence
expected: At least one checklist item visibly references both the matched patient fact/document context and the source policy evidence snippet or page reference.
result: pending
notes:

### 14. Saved Evaluation Reloads After Refresh
expected: Refreshing the page keeps the latest evaluation visible or re-openable for the selected case. The case status should now be `complete`.
result: pending
notes:

### 15. Switching Cases Is Stable
expected: Selecting a different case and then returning to the evaluated case does not corrupt the document, fact, or evaluation state.
result: pending
notes:

### 16. Regression Check: Compare Still Loads
expected: Returning to `Compare` still loads the Phase 7 compare workflow without a top-level crash.
result: pending
notes:

### 17. Regression Check: Insights Still Loads
expected: Returning to `Insights` still loads the heat map and graph workflow without a top-level crash.
result: pending
notes:

### 18. Regression Check: Changes Still Loads
expected: Returning to `Changes` still loads the Phase 8 timeline and version diff entry workflow without a top-level crash.
result: pending
notes:

### 19. Regression Check: Data Still Loads
expected: Returning to `Data` still shows ingestion sources and summary cards.
result: pending
notes:

### 20. Browser Console + Visual Sanity
expected: During the full UAT pass, there are no React crashes, infinite spinners, or obviously broken layouts on a standard laptop viewport. Minor warnings can be noted, but blocking runtime errors are failures.
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

phase_9_cases: pending
phase_9_extraction: pending
phase_9_evaluation: pending
phase_9_regression: pending
overall: pending
