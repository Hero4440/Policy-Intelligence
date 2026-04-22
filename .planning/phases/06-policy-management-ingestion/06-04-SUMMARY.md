# 06-04 Summary

- This plan defines the Structured Rules Editor for Phase 6: field-by-field policy editing with evidence display, ambiguity flags, and save-as-new-version behavior.
- Planned artifacts are `src/frontend/pages/PolicyEditorPage.tsx`, an added `POST /api/policies/:policyId/versions` backend write route, and an added `savePolicyVersion()` client helper in `src/frontend/data/policies.ts`.
- The intended editor behavior is:
- show editable values for core policy fields such as payer, plan, policy title, indication, coverage status, PA required, and nested drug fields
- show the matching evidence snippet per field when available
- allow per-field ambiguity toggles
- save the full updated `PolicyRecord` as a new version through the storage layer
- Current repo status: this plan is not implemented. There is no `PolicyEditorPage.tsx`, no policy version-save API route, and no ambiguity-flag persistence for policy fields.
- Scope boundary: this plan is strictly policy editing and versioning. It is separate from patient-document upload, patient-fact extraction, or case tracking.
