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

## Function 1: Policy Ingestion And Normalization

### 1. Data / Ingestion View Loads
expected: Opening the ingestion/data workflow loads source summary data without a blank screen or immediate API failure.
result: pending
notes:

### 2. Upload Policy Through Backend Or MCP
expected: A policy document can be ingested either through the backend ingestion route or through MCP `upload_policy_document` using a local file path or URL.
result: pending
notes:

### 3. Ingested Source Persists
expected: After upload, the source appears in persisted ingestion storage and still exists after a server restart.
result: pending
notes:

### 4. Parsed Policy Metadata Looks Reasonable
expected: The parsed output shows issuer, effective date, detected drugs, and ingestion status with no obviously malformed values for a valid sample file.
result: pending
notes:

### 5. Parse-Only MCP Flow Works
expected: `parse_policy_document` can re-parse an uploaded source and returns structured fields such as title, issuer, drug labels, prior auth, step therapy, and evidence summary.
result: pending
notes:

### 6. Versioned Policy Files Exist
expected: Structured policy versions exist in `data/policies/structured/` and the policy index tracks current version metadata correctly.
result: pending
notes:

## Function 2: Policy Search, Comparison, And Evidence Retrieval

### 7. Workspace Policy Query Loads
expected: The main workspace/policy query experience loads without crashing and can show policy-level structured output for an existing policy.
result: pending
notes:

### 8. Compare Workflow Works
expected: The compare workflow returns side-by-side payer results for a drug family without a top-level error.
result: pending
notes:

### 9. Insights Workflow Works
expected: The insights page renders the heat map and related drill-in views without a blank screen.
result: pending
notes:

### 10. Changes Workflow Works
expected: The changes timeline and version diff workflow load and can show structured change output for a versioned policy.
result: pending
notes:

### 11. Evidence Explorer Search Works
expected: Searching a keyword in Evidence Explorer returns grounded snippets with policy, page, section, and field context.
result: pending
notes:

### 12. MCP Evidence Retrieval Works
expected: `get_policy_evidence` returns evidence for a selected policy/version and `search_policy_rules` returns cross-policy grounded results.
result: pending
notes:

### 13. MCP Version Tools Work
expected: `list_policy_versions` returns available versions and `diff_policy_versions` returns structured field-level changes for a valid version pair.
result: pending
notes:

## Function 3: Patient-Case Evaluation Against Policy

### 14. Patients Page Loads
expected: The Patients view loads the case list and case detail workflow shell without a crash.
result: pending
notes:

### 15. Patient Case Creation Works
expected: A new synthetic patient case can be created with payer, diagnosis, requested drug, and patient name.
result: pending
notes:

### 16. Patient Document Upload Works
expected: A text or JSON/FHIR-like patient document can be attached to a case and appears in the case record.
result: pending
notes:

### 17. Fact Extraction Works
expected: The system extracts structured facts such as diagnosis, requested drug, prior therapies, payer/insurance, or prescriber from the uploaded case documents.
result: pending
notes:

### 18. Coverage Evaluation Works
expected: Running a patient-policy evaluation produces a saved result with a valid coverage status and a checklist using only PASS / MISSING / UNKNOWN / NEEDS REVIEW.
result: pending
notes:

### 19. Patient-Policy MCP Tools Work
expected: `extract_patient_facts` and `evaluate_patient_against_policy` return the same core information available in the case workflow.
result: pending
notes:

### 20. Saved Evaluation Persists
expected: The evaluation remains available after refresh and can be retrieved again by case or evaluation id.
result: pending
notes:

## Function 4: Guidance Delivery Through Portal And MCP

### 21. Next Steps Tab Or Workflow Loads
expected: The next-steps workflow for an evaluated case loads without crashing and shows clinic actions, missing documents, patient explanation, and analyst-oriented reasoning.
result: pending
notes:

### 22. Chat Works With Evidence
expected: Chat returns an answer for a policy question and shows evidence-backed citations or evidence-sidecar context.
result: pending
notes:

### 23. MCP Guidance Tools Work
expected: `generate_next_steps` returns actionable next steps for a saved evaluation and `get_case_summary` returns a holistic case summary.
result: pending
notes:

### 24. MCP Health Reports Full Toolset
expected: `/health` reports `tools: 17`, reflecting the original 7 tools plus the 10 Phase 11 tools.
result: pending
notes:

### 25. End-To-End Story Holds Together
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
