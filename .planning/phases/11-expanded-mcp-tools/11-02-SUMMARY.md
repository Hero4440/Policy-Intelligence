# 11-02 Summary

- Added `list_policy_versions` in [src/mcp/tools/list_policy_versions.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/mcp/tools/list_policy_versions.ts).
- The tool reads the structured policy index from the storage layer and returns version metadata, current-version flags, saved timestamps, file names, coverage status, and PA status per version.
- Added `diff_policy_versions` in [src/mcp/tools/diff_policy_versions.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/mcp/tools/diff_policy_versions.ts).
- The diff tool reuses the existing policy change-classification engine from [src/server/policy-changes.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/server/policy-changes.ts) and returns structured changes with severity labels plus text snapshots.

**Verification**

- `npx tsc --noEmit` passes
- `grep -n "registerListPolicyVersions\|listPolicyIndex\|readPolicyVersion" src/mcp/tools/list_policy_versions.ts` passes
- `grep -n "registerDiffPolicyVersions\|buildPolicyVersionDiff\|buildStandardResponse" src/mcp/tools/diff_policy_versions.ts` passes
