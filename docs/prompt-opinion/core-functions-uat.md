---
status: ready
scope: core-functions
source: .planning/PROJECT.md, .planning/ROADMAP.md, .planning/REQUIREMENTS.md
started: 2026-04-22T00:00:00Z
updated: 2026-04-22T00:00:00Z
---

## Purpose

Manual UAT checklist for the 4 core product functions of PolicyPilot:

1. policy ingestion and normalization
2. policy search, comparison, and evidence retrieval
3. patient-case evaluation against policy
4. guidance delivery through portal and MCP

This document is intended to test the product as a user workflow rather than as isolated phase artifacts.

## Preconditions

1. Start the backend in one terminal:
   `npm run server:dev`
2. Start the frontend in another terminal:
   `npm run frontend:dev`
3. Open the app in your browser:
   `http://localhost:4173`
4. Confirm the backend health endpoint responds:
   `http://localhost:3000/health`
5. Confirm MCP is mounted:
   `http://localhost:3000/mcp`
6. Confirm at least one structured policy exists in `data/policies/structured/`
7. Confirm at least one patient case exists in `data/patients/` or create one during the run

## Current Test
<!-- OVERWRITE each run -->

[not started]

## Execution Log

Use this table during a live run. Fill in one row per test as you execute it.

| Test | Status | Notes |
| ---- | ------ | ----- |
| 1 | pending | |
| 2 | pending | |
| 3 | pending | |
| 4 | pending | |
| 5 | pending | |
| 6 | pending | |
| 7 | pending | |
| 8 | pending | |
| 9 | pending | |
| 10 | pending | |
| 11 | pending | |
| 12 | pending | |
| 13 | pending | |
| 14 | pending | |
| 15 | pending | |
| 16 | pending | |
| 17 | pending | |
| 18 | pending | |
| 19 | pending | |
| 20 | pending | |
| 21 | pending | |
| 22 | pending | |
| 23 | pending | |
| 24 | pending | |
| 25 | pending | |

## Suggested Test Data

Use these sample values during the run unless you already know a better valid dataset in your local store.

- UI drug query: `adalimumab`
- UI evidence query: `step therapy`
- UI chat query: `What prior authorization requirements apply for adalimumab?`
- Synthetic patient name: `Test Patient`
- Synthetic payer: `UHC`
- Synthetic requested drug: `adalimumab`
- Synthetic diagnosis: `Rheumatoid arthritis`
- Clinical note sample:
```text
Patient: Test Patient
Diagnosis: Rheumatoid arthritis
Requested drug: adalimumab
Payer: UHC
Prescriber: Rheumatologist
Prior therapies: methotrexate, etanercept
Medications: adalimumab
```

## MCP Invocation Notes

If you are testing MCP manually, use your normal Prompt Opinion connector flow or an MCP client. If you need quick local request examples, use the tool inputs below as the request body payload values.

## Function 1: Policy Ingestion And Normalization

### 1. Data / Ingestion View Loads
steps:
1. Open `http://localhost:4173`.
2. Click `Data` in the top navigation.
3. Wait for the page to finish initial loading.
4. Check whether summary cards, ingestion metadata, or a source list render.
expected: Opening the ingestion/data workflow loads source summary data without a blank screen or immediate API failure.
result: pending
notes:

### 2. Upload Policy Through Backend Or MCP
steps:
1. Choose a sample policy file already available in the repo or on disk.
2. If testing backend upload, use the Data/Ingestion workflow or the backend upload route.
3. If testing MCP upload, call `upload_policy_document` with either `file_path` or `url`.
4. Record whether the response includes source metadata, status, and snapshot count.
sample_mcp_payload:
```json
{
  "file_path": "/absolute/path/to/sample-policy.pdf"
}
```
expected: A policy document can be ingested either through the backend ingestion route or through MCP `upload_policy_document` using a local file path or URL.
result: pending
notes:

### 3. Ingested Source Persists
steps:
1. Complete one successful policy upload.
2. Confirm the source appears in the Data/Ingestion view or persisted ingestion storage.
3. Restart the backend server.
4. Re-open the Data/Ingestion view or inspect persisted data again.
5. Confirm the uploaded source is still present.
expected: After upload, the source appears in persisted ingestion storage and still exists after a server restart.
result: pending
notes:

### 4. Parsed Policy Metadata Looks Reasonable
steps:
1. Inspect the result of a newly uploaded policy source.
2. Verify issuer name is populated or sensibly inferred.
3. Verify effective date is present or clearly marked unknown.
4. Verify detected drugs are plausible for the uploaded document.
5. Verify ingestion status is not malformed.
expected: The parsed output shows issuer, effective date, detected drugs, and ingestion status with no obviously malformed values for a valid sample file.
result: pending
notes:

### 5. Parse-Only MCP Flow Works
steps:
1. Use a source previously created by `upload_policy_document`.
2. Call `parse_policy_document` with `source_id`.
3. Review the returned structured fields.
4. Confirm title, issuer, drug labels, prior auth, step therapy, and evidence summary are present.
sample_mcp_payload:
```json
{
  "source_id": "replace-with-uploaded-source-id"
}
```
expected: `parse_policy_document` can re-parse an uploaded source and returns structured fields such as title, issuer, drug labels, prior auth, step therapy, and evidence summary.
result: pending
notes:

### 6. Versioned Policy Files Exist
steps:
1. Inspect `data/policies/structured/`.
2. Confirm at least one policy version file exists.
3. Inspect `data/policies/index.json` or the equivalent policy index output.
4. Confirm the policy index points to a current version and tracks versions for that policy.
expected: Structured policy versions exist in `data/policies/structured/` and the policy index tracks current version metadata correctly.
result: pending
notes:

## Function 2: Policy Search, Comparison, And Evidence Retrieval

### 7. Workspace Policy Query Loads
steps:
1. Click `Workspace` in the top navigation.
2. Enter a known drug family already represented in the dataset.
3. Recommended query: `adalimumab`.
3. Submit the query or wait for auto-load.
4. Confirm the page renders structured results or a clean empty state, not a crash.
expected: The main workspace/policy query experience loads without crashing and can show policy-level structured output for an existing policy.
result: pending
notes:

### 8. Compare Workflow Works
steps:
1. Click `Compare`.
2. Select a drug family with known policy coverage data.
3. Recommended drug family: `adalimumab`.
3. Select two or more payers if the UI requires payer selection.
4. Confirm the side-by-side comparison view renders.
expected: The compare workflow returns side-by-side payer results for a drug family without a top-level error.
result: pending
notes:

### 9. Insights Workflow Works
steps:
1. Click `Insights`.
2. Wait for the heat map or insights layout to load.
3. Try at least one filter or drill-in interaction if available.
4. Confirm the page remains stable and renders meaningful data or a clean empty state.
expected: The insights page renders the heat map and related drill-in views without a blank screen.
result: pending
notes:

### 10. Changes Workflow Works
steps:
1. Click `Changes`.
2. Confirm the change timeline renders.
3. Open a version diff if one is available.
4. Confirm structured changes and version context are shown.
expected: The changes timeline and version diff workflow load and can show structured change output for a versioned policy.
result: pending
notes:

### 11. Evidence Explorer Search Works
steps:
1. Click `Evidence Explorer`.
2. Search for a keyword such as a drug name, `step therapy`, or `prior authorization`.
3. Recommended query: `step therapy`.
3. Wait for results to load.
4. Confirm results include policy, page, section, and snippet metadata.
expected: Searching a keyword in Evidence Explorer returns grounded snippets with policy, page, section, and field context.
result: pending
notes:

### 12. MCP Evidence Retrieval Works
steps:
1. Choose a valid `policy_id`.
2. Call `get_policy_evidence` for the current version.
3. Review the returned evidence entries.
4. Then call `search_policy_rules` with a policy-related keyword.
5. Confirm both tools return grounded evidence metadata.
sample_mcp_payloads:
```json
{
  "policy_id": "replace-with-valid-policy-id"
}
```
```json
{
  "query": "step therapy"
}
```
expected: `get_policy_evidence` returns evidence for a selected policy/version and `search_policy_rules` returns cross-policy grounded results.
result: pending
notes:

### 13. MCP Version Tools Work
steps:
1. Choose a policy with at least one saved version, preferably two or more.
2. Call `list_policy_versions`.
3. If two versions exist, call `diff_policy_versions` with a valid version pair.
4. Confirm version metadata and structured changes are returned.
sample_mcp_payloads:
```json
{
  "policy_id": "replace-with-valid-policy-id"
}
```
```json
{
  "policy_id": "replace-with-valid-policy-id",
  "from_version": 1,
  "to_version": 2
}
```
expected: `list_policy_versions` returns available versions and `diff_policy_versions` returns structured field-level changes for a valid version pair.
result: pending
notes:

## Function 3: Patient-Case Evaluation Against Policy

### 14. Patients Page Loads
steps:
1. Click `Patients`.
2. Wait for the case list and detail panel to load.
3. Confirm the page is usable without a blank screen or blocking error.
expected: The Patients view loads the case list and case detail workflow shell without a crash.
result: pending
notes:

### 15. Patient Case Creation Works
steps:
1. In the Patients workflow, create a new synthetic patient case.
2. Enter patient name, payer, requested drug, and diagnosis.
3. Recommended values: `Test Patient`, `UHC`, `adalimumab`, `Rheumatoid arthritis`.
3. Save the case.
4. Confirm it appears in the case list.
expected: A new synthetic patient case can be created with payer, diagnosis, requested drug, and patient name.
result: pending
notes:

### 16. Patient Document Upload Works
steps:
1. Select a patient case.
2. Upload or paste a text document or JSON/FHIR-like patient document.
3. Recommended content: use the `Clinical note sample` block from `Suggested Test Data`.
3. Save the document.
4. Confirm it appears in the case’s document list.
expected: A text or JSON/FHIR-like patient document can be attached to a case and appears in the case record.
result: pending
notes:

### 17. Fact Extraction Works
steps:
1. After document upload, inspect the extracted facts section.
2. Confirm at least some facts are extracted from the document.
3. Check whether diagnosis, requested drug, prior therapies, payer/insurance, or prescriber fields are populated where applicable.
expected: The system extracts structured facts such as diagnosis, requested drug, prior therapies, payer/insurance, or prescriber from the uploaded case documents.
result: pending
notes:

### 18. Coverage Evaluation Works
steps:
1. In the selected patient case, choose a policy and version.
2. Trigger the evaluation action.
3. Wait for the result to render.
4. Confirm a valid coverage status is shown.
5. Confirm checklist items use only the allowed status labels.
expected: Running a patient-policy evaluation produces a saved result with a valid coverage status and a checklist using only PASS / MISSING / UNKNOWN / NEEDS REVIEW.
result: pending
notes:

### 19. Patient-Policy MCP Tools Work
steps:
1. Use the same patient case ID from the UI.
2. Call `extract_patient_facts` with that `case_id`.
3. Review the returned fact summary.
4. Call `evaluate_patient_against_policy` with the same `case_id` and a valid policy.
5. Confirm the MCP responses align with what the UI shows.
sample_mcp_payloads:
```json
{
  "case_id": "replace-with-valid-case-id"
}
```
```json
{
  "case_id": "replace-with-valid-case-id",
  "policy_id": "replace-with-valid-policy-id"
}
```
expected: `extract_patient_facts` and `evaluate_patient_against_policy` return the same core information available in the case workflow.
result: pending
notes:

### 20. Saved Evaluation Persists
steps:
1. Complete a successful evaluation.
2. Refresh the browser.
3. Re-open the same patient case.
4. Confirm the saved evaluation is still available.
expected: The evaluation remains available after refresh and can be retrieved again by case or evaluation id.
result: pending
notes:

## Function 4: Guidance Delivery Through Portal And MCP

### 21. Next Steps Tab Or Workflow Loads
steps:
1. Open a patient case with a saved evaluation.
2. Navigate to the next-steps view or related workflow.
3. Confirm clinic actions, missing docs, patient explanation, and analyst-oriented reasoning are visible.
expected: The next-steps workflow for an evaluated case loads without crashing and shows clinic actions, missing documents, patient explanation, and analyst-oriented reasoning.
result: pending
notes:

### 22. Chat Works With Evidence
steps:
1. Click `Chat`.
2. Ask a natural-language question about a loaded policy or drug.
3. Recommended question: `What prior authorization requirements apply for adalimumab?`
3. Wait for the response.
4. Confirm the answer appears.
5. Confirm evidence or citation context is shown with the answer.
expected: Chat returns an answer for a policy question and shows evidence-backed citations or evidence-sidecar context.
result: pending
notes:

### 23. MCP Guidance Tools Work
steps:
1. Take a valid `eval_id` from a saved evaluation.
2. Call `generate_next_steps`.
3. Review clinic steps, missing docs, patient explanation, and analyst breakdown.
4. Call `get_case_summary` with the related `case_id`.
5. Confirm the case summary includes evaluation context and optional next-step data where requested.
sample_mcp_payloads:
```json
{
  "eval_id": "replace-with-valid-eval-id"
}
```
```json
{
  "case_id": "replace-with-valid-case-id",
  "include_next_steps": true
}
```
expected: `generate_next_steps` returns actionable next steps for a saved evaluation and `get_case_summary` returns a holistic case summary.
result: pending
notes:

### 24. MCP Health Reports Full Toolset
steps:
1. Open `http://localhost:3000/health` in a browser or call it with `curl`.
2. Inspect the JSON response.
3. Confirm the `tools` field equals `17`.
expected: `/health` reports `tools: 17`, reflecting the original 7 tools plus the 10 Phase 11 tools.
result: pending
notes:

### 25. End-To-End Story Holds Together
steps:
1. Start with a policy source and confirm it is available in the system.
2. Create or select a patient case.
3. Upload patient documentation.
4. Confirm facts extract successfully.
5. Run a policy evaluation.
6. Open next steps.
7. Optionally confirm the same case/evaluation through MCP tools.
expected: Starting from a policy source and patient case, the product can reach a coverage evaluation plus next-step output without a blocking runtime error in the portal or MCP layer.
result: pending
notes:

## Completion Checklist By Core Function

### Function 1: Policy Ingestion And Normalization

- [x] Backend ingestion pipeline exists for PDF/CSV/JSON/DOCX-style inputs
- [x] Ingestion data is persisted under `data/ingestion/`
- [x] MCP upload and parse tools exist
- [x] Structured policy version store exists under `data/policies/structured/`
- [x] Policy index/versioning foundation exists
- [ ] Portal-first policy upload workflow is fully implemented and human-verified
- [ ] Policy Rules page and structured rules editor are fully implemented and signed off

### Function 2: Policy Search, Comparison, And Evidence Retrieval

- [x] Core MCP policy query tools exist
- [x] Compare workflow is implemented
- [x] Insights workflow is implemented
- [x] Changes timeline and version diff engine are implemented
- [x] Evidence Explorer is implemented
- [x] MCP evidence/version tools are implemented
- [ ] Policy Rules list/detail browsing experience is fully implemented and signed off
- [ ] Cross-linking from search/evidence results into a full Policy Detail workflow is fully complete

### Function 3: Patient-Case Evaluation Against Policy

- [x] Patient case storage layer exists
- [x] Patient document upload flow exists
- [x] Deterministic fact extraction exists
- [x] Coverage evaluation engine exists
- [x] Evaluation persistence exists
- [x] MCP patient-fact and evaluation tools exist
- [ ] Formal UAT sign-off is still needed

### Function 4: Guidance Delivery Through Portal And MCP

- [x] Next-step generation exists
- [x] Evidence-backed chat exists
- [x] Expanded MCP toolset exists and is registered
- [x] Case-summary MCP flow exists
- [ ] Dashboard is not yet implemented
- [ ] Role switcher is not yet implemented
- [ ] Global navigation for the final 8-section product shell is not yet complete
- [ ] Production deployment to Vercel + Railway is not yet complete
- [ ] Formal end-to-end UAT sign-off is still needed

## Remaining Implementation Checklist

### Highest-Impact Remaining Product Work

- [ ] Phase 12 dashboard with KPI cards and quick actions
- [ ] Phase 12 role switcher for Clinic Staff / Payer Analyst / Patient
- [ ] Final global navigation across all intended sections
- [ ] Vercel frontend deployment
- [ ] Railway backend deployment
- [ ] Public deployed smoke/UAT pass on the production-like environment

### Remaining Gaps Inside The 4 Core Functions

- [ ] Browser-first policy management flow needs final completion/sign-off
- [ ] Policy Rules page and policy detail/editor experience need final completion/sign-off
- [ ] Formal UAT sign-off still needs to be recorded for the integrated product
- [ ] Optional storage refactor for per-source ingestion metadata files remains deferred

## Summary

total: 25
passed: 0
issues: 0
pending: 25
skipped: 0

## Blocking Failures

[none logged yet]

## Non-Blocking Notes

[none logged yet]

## Sign-Off

function_1_ingestion_and_normalization: pending
function_2_search_compare_and_evidence: pending
function_3_patient_case_evaluation: pending
function_4_guidance_delivery: pending
overall: pending
