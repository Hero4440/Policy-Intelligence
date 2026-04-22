# 06-05 Summary

- This plan closes the Phase 6 policy-management loop: upload policy PDF, view it in Policy Rules, inspect it in Policy Detail, edit it in Structured Rules Editor, and verify version history end to end.
- Planned artifacts are `src/frontend/pages/PolicyUploadPanel.tsx` plus final `src/frontend/App.tsx` navigation wiring for these page states: `workspace`, `compare`, `data`, `policy-rules`, `policy-detail`, `policy-editor`, and `policy-upload`.
- The intended upload flow is:
- user selects a PDF in `PolicyUploadPanel`
- frontend calls `uploadPolicyPdf()`
- backend parses and saves the policy
- app navigates to Policy Rules
- user opens detail, edits fields, saves a new version, and re-checks history
- Parsing quality expectation in the plan is heuristic: top-level metadata, PA signal, step-therapy signal, indications, and evidence snippets are expected to be extractable; detailed criteria may remain sparse depending on PDF structure.
- Current repo status: this end-to-end Phase 6 policy lifecycle is not present. The repo has no `PolicyUploadPanel.tsx`, no policy page-state navigation, and no human-verified UAT for the policy-management flow.
- Scope boundary: this summary documents the intended policy lifecycle for Phase 6 only. It does not include patient-case pages that were built on a different track.
