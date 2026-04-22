# Phase 8 Status

**Phase:** 08-policy-changes-versioning  
**Updated:** 2026-04-22  
**Overall state:** Planned, ready to implement

## What Is Done

- Phase 8 scope is defined in [08-CONTEXT.md](./08-CONTEXT.md)
- The execution sequence is defined across four plans:
  - [08-01-PLAN.md](./08-01-PLAN.md)
  - [08-02-PLAN.md](./08-02-PLAN.md)
  - [08-03-PLAN.md](./08-03-PLAN.md)
  - [08-04-PLAN.md](./08-04-PLAN.md)
- The roadmap now enumerates Phase 8 plans rather than leaving them as `TBD`
- Phase 8 decisions already captured:
  - build on the existing file-backed version store
  - classify diffs deterministically as `cosmetic`, `operational`, or `clinical`
  - add per-version text snapshots for the Version Diff page

## Planned Deliverables

- backend change-history engine with deterministic materiality classification
- Policy Changes timeline page with field-level change table
- Version Diff API with structured changes + side-by-side text snapshots
- Version Diff UI with browser-based verification

## Verification Planned

Browser verification for Phase 8 is tracked in [08-UAT.md](./08-UAT.md).

Blocking gate from [08-04-PLAN.md](./08-04-PLAN.md):

- Changes page timeline verified in browser
- change table verified with old/new/severity values
- materiality labels verified against real version differences
- Version Diff page verified with structured and text views on one screen
- top-level nav regression verified against Compare and Insights

## Completion Rule

Mark Phase 8 complete only after:

1. `08-01` through `08-04` are implemented
2. `08-UAT.md` is updated with pass/fail results
3. blocking issues, if any, are fixed
4. `08-04-SUMMARY.md` is created
5. `.planning/STATE.md` advances to Phase 9
