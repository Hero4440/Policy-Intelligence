# Phase 8: Policy Changes + Versioning - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the v2 policy-change workflow on top of the file-backed version store from Phases 5-6. This phase covers: a change-event timeline, field-level change classification, a Policy Changes page, and a Version Diff page showing structured changes and side-by-side text snapshots for two versions of the same policy.

This phase does not cover watched-policy alerts, patient impact projections, or LLM-written summaries of change significance.

</domain>

<decisions>
## Implementation Decisions

### Source Of Truth
- Phase 8 must build on the existing version files and diff records in `src/storage/policy-store.ts`
- The current diff artifacts are useful but too shallow on their own; Phase 8 should add a deterministic classification layer instead of replacing the storage model
- Change history should be assembled from stored version metadata plus diff records, not from frontend-only state

### Materiality Classification
- Diff severity must be deterministic and explainable, not LLM-generated
- Use exactly three labels: `cosmetic`, `operational`, `clinical`
- `clinical` is reserved for coverage-impacting changes such as prior auth posture, step therapy, covered indications, restrictions, preferred/non-preferred product positioning, or coverage status
- `operational` is for wording/metadata changes that alter interpretation or workflow but are not direct coverage posture changes
- `cosmetic` is for formatting-only or representation-only changes

### Timeline Scope
- The Policy Changes page is the high-level audit surface for all policy uploads and saved edits
- Timeline events should group changes at the version-transition level: one event per `policyId` + `fromVersion` + `toVersion`
- Each event should expose a flattened table of field changes so analysts can scan policy, field, old value, new value, and severity without opening the full diff page

### Version Diff Scope
- The Version Diff page must show both:
  - structured field-level changes with severity/rationale
  - side-by-side text snapshots for the two selected versions
- The current store does not persist per-version text snapshots, so Phase 8 must add a text-snapshot strategy
- For historical versions that do not have extracted source text, a deterministic normalized text snapshot derived from the saved `PolicyRecord` is acceptable as the fallback so older versions remain diffable

### UI Integration
- Reuse the existing portal shell and top-nav pattern in `src/frontend/App.tsx`
- The Policy Changes page should be a top-level workflow similar to Compare and Insights
- The Version Diff page should be reachable from both the Changes timeline and the policy detail/version history flow where practical

### Claude's Discretion
- Exact endpoint names and payload shapes for change history and version diff APIs
- Whether timeline events are rendered as cards, rows, or grouped sections
- Whether the side-by-side text diff uses changed-line highlighting, inline badges, or both

</decisions>

<specifics>
## Specific Ideas

- Add a `src/server/policy-changes.ts` domain module that turns stored diff records into classified change events
- Extend `DiffField` handling so nested clinical fields are surfaced as meaningful field paths instead of a single opaque object blob
- Add per-version text snapshots under the policy storage layer so the Version Diff page is not forced to diff raw PDFs in the browser
- Keep the change table evidence-first where possible by linking changed fields back to policy evidence or source sections already stored on the record

</specifics>

<deferred>
## Deferred Ideas

- Email/slack/watchlist notifications when a policy changes
- Cross-policy trend analytics derived from repeated version changes
- AI-written “what changed and why it matters” narratives
- Diffing arbitrary payer policies against each other on the Changes page

</deferred>

---

*Phase: 08-policy-changes-versioning*
*Context gathered: 2026-04-22*
