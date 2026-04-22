# Phase 9: Patient Cases + Coverage Evaluation - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the clinic-facing patient case workflow on top of the file-backed patient and evaluation stores from Phase 5 and the policy/version infrastructure from Phases 6-8. This phase covers: case creation, patient-document upload, structured fact extraction, a case detail experience that shows facts with source evidence, and deterministic coverage evaluation with a saved checklist.

This phase does not cover next-step generation, patient-friendly explanations, payer-analyst narratives, keyword evidence search, or chat. Those belong to Phase 10.

</domain>

<decisions>
## Implementation Decisions

### Source Of Truth
- Patient cases remain file-backed under `data/patients/{case-id}/`
- Evaluations remain file-backed under `data/evaluations/{eval-id}.json`
- Coverage evaluation must run against stored policy versions from the Phase 5-8 storage layer, not the legacy Anton Rx demo data
- The evaluation result shown in the UI must be the persisted evaluation record, not a frontend-only derived object

### Intake Scope
- Case creation requires exactly the four roadmap fields: payer, requested drug, diagnosis, synthetic patient name
- The case list must show a meaningful workflow status: `missing-docs`, `ready-for-eval`, or `complete`
- Document upload can remain limited to text-like files and JSON/FHIR bundles for this milestone; PDF/OCR patient extraction is out of scope

### Fact Extraction
- Reuse the existing FHIR extractors in `src/mcp/fhir/*` where possible instead of rebuilding extraction logic
- For non-FHIR text, extraction should stay deterministic and heuristic-driven: diagnosis, requested drug, prior therapies, prescriber type, insurance/payer
- Every extracted fact must carry source-document linkage and a readable evidence snippet
- Sparse or partial extraction is acceptable as long as ambiguity is explicit instead of silently fabricating precision

### Evaluation Strategy
- Coverage evaluation must be deterministic and explainable, not LLM-authored
- Reuse the existing matcher patterns in `src/mcp/matching/criteria_matcher.ts` where helpful, but adapt the output to the Phase 9 requirement language:
  - `PASS`
  - `MISSING`
  - `UNKNOWN`
  - `NEEDS REVIEW`
- Evaluation status must collapse the checklist into exactly one of:
  - `Covered`
  - `PA Required`
  - `Likely Eligible but Docs Missing`
  - `Not Covered`
  - `Preferred Alternative Required`
  - `Unclear`

### UI Integration
- Keep Patients as a top-level page in the existing app shell
- Patient case detail should combine intake, extracted facts, and evaluation results in one workflow rather than splitting into multiple routes
- Checklist items must link both sides of the evidence chain:
  - matched patient fact/document evidence
  - source policy evidence snippet

### Claude's Discretion
- Exact API route names for evaluation read/write flows
- Whether evaluation configuration lives on the case record or is passed as a separate request payload
- Whether the checklist is rendered as cards, rows, or grouped sections

</decisions>

<specifics>
## Specific Ideas

- Add a server-side patient evaluation domain module that converts a stored case plus a stored policy version into a persisted checklist
- Extend patient document records to preserve richer metadata needed by the Phase 9 detail screen
- Add frontend data helpers for:
  - creating cases
  - uploading documents
  - fetching one case
  - triggering evaluation
  - fetching prior evaluations for the case
- Reuse the existing patients page skeleton in `src/frontend/components/patient-cases-view.tsx` and `patient-case-detail-view.tsx` instead of introducing a new route tree

</specifics>

<deferred>
## Deferred Ideas

- OCR, scanned-PDF parsing, or image-based patient document extraction
- LLM-driven narrative summaries of why a case passed or failed
- Multi-policy batch evaluation for one patient case
- Prior-auth packet generation or appeal-letter drafting

</deferred>

---

*Phase: 09-patient-cases-coverage-evaluation*
*Context gathered: 2026-04-22*
