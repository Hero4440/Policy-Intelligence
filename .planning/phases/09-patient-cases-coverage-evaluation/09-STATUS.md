# Phase 9 Status

**Phase:** 09-patient-cases-coverage-evaluation  
**Updated:** 2026-04-22  
**Overall state:** Implementation complete through 09-04, awaiting manual browser UAT

## What Is Done

- Phase scope is defined in [09-CONTEXT.md](./09-CONTEXT.md)
- Execution plans are defined for:
  - [09-01-PLAN.md](./09-01-PLAN.md)
  - [09-02-PLAN.md](./09-02-PLAN.md)
  - [09-03-PLAN.md](./09-03-PLAN.md)
  - [09-04-PLAN.md](./09-04-PLAN.md)
  - [09-05-PLAN.md](./09-05-PLAN.md)
- Manual verification checklist is prepared in [09-UAT.md](./09-UAT.md)
- Implemented summaries are recorded in:
  - [09-01-SUMMARY.md](./09-01-SUMMARY.md)
  - [09-02-SUMMARY.md](./09-02-SUMMARY.md)
  - [09-03-SUMMARY.md](./09-03-SUMMARY.md)
  - [09-04-SUMMARY.md](./09-04-SUMMARY.md)

## What Is Done

- Patient case intake is file-backed and stable
- Uploaded patient documents generate structured extracted facts with source linkage
- Policy options for a selected case are ranked and returned through the API
- Deterministic patient-vs-policy evaluation is implemented and persisted
- The Patients page supports:
  - case creation
  - document upload
  - extracted-fact review
  - policy/version selection
  - evaluation trigger
  - saved evaluation rendering

## Verification Already Completed

- `npx tsc --noEmit` passes
- `npm run frontend:build` passes
- direct runtime smoke checks confirm:
  - matching policy options return for a compatible case
  - evaluation payloads build successfully
  - saved-checklist-ready results resolve deterministically

## Current Assumptions

- Existing patient case storage and patient routes from Phase 5 are the baseline, not the finished Phase 9 feature set
- Existing `Patients` UI is a scaffold that will be expanded rather than replaced outright
- Evaluation logic will reuse deterministic matching primitives where possible instead of introducing an LLM dependency

## What Is Still Required

Phase 9 is not complete until the browser checklist in [09-UAT.md](./09-UAT.md) passes.

Blocking end-state:

- clinic staff can create and inspect patient cases
- documents can be uploaded and facts extracted with source linkage
- a stored policy version can be selected for deterministic evaluation
- the result shows coverage status and a linked checklist
- saved evaluations survive refresh and are re-openable by case

## Completion Rule

Mark Phase 9 complete only after:

1. `09-01` through `09-05` are implemented
2. `09-UAT.md` is updated with pass/fail results
3. any blocking issues are fixed
4. `09-05-SUMMARY.md` is created
5. `.planning/STATE.md` advances to Phase 10
