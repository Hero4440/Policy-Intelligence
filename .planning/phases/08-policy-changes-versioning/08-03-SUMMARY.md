# 08-03 Summary

- Added per-version text snapshot support in [src/storage/policy-store.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/storage/policy-store.ts):
  - `readPolicyTextSnapshot(policyId, version)`
  - `ensurePolicyTextSnapshot(policyId, version)`
  - `listPolicyVersionPairs(policyId)`
- Chosen snapshot strategy:
  1. use an existing saved text snapshot if present
  2. otherwise generate a deterministic normalized text projection from the stored `PolicyRecord`
- The normalized fallback projection preserves the major sections needed for side-by-side diff viewing:
  - title / payer / plan / effective date
  - coverage status
  - preferred and non-preferred products
  - prior auth
  - indications
  - diagnosis requirements
  - step therapy
  - other requirements
- Added startup backfill in [src/storage/startup.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/storage/startup.ts) so existing saved versions automatically receive snapshots when missing.
- Implemented `buildPolicyVersionDiff(policyId, fromVersion, toVersion)` in [src/server/policy-changes.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/server/policy-changes.ts).
- Added Version Diff route in [src/server/policy-routes.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/server/policy-routes.ts):
  - `GET /api/policies/:policyId/diff?fromVersion=N&toVersion=M`
- Added typed frontend client support in [src/frontend/data/policies.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/frontend/data/policies.ts):
  - `PolicyVersionDiffPayload`
  - `fetchPolicyVersionDiff(policyId, fromVersion, toVersion)`

**Fallback behavior for legacy versions**

- Older saved versions that lack extracted source text remain diffable through normalized `PolicyRecord` projections
- Missing stored diff files are recomputed safely from the saved structured versions rather than crashing the change workflow

**Verification**

- `npx tsc --noEmit` passes
- `npm run frontend:build` passes
- runtime smoke check confirms:
  - change events build from stored data
  - Version Diff payloads return structured changes plus left/right text labels and content
