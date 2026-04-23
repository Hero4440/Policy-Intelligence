# 11-03 Summary

- Added `get_policy_evidence` in [src/mcp/tools/get_policy_evidence.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/mcp/tools/get_policy_evidence.ts).
- The tool resolves a policy version from the storage layer and returns evidence snippets from diagnosis requirements, step therapy, and other requirements with document, page, and section metadata.
- Added `search_policy_rules` in [src/mcp/tools/search_policy_rules.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/mcp/tools/search_policy_rules.ts).
- The search tool reuses [src/server/evidence-search.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/server/evidence-search.ts) and exposes cross-policy evidence search to MCP callers with grounded result metadata.

**Verification**

- `npx tsc --noEmit` passes
- `grep -n "registerGetPolicyEvidence\|readPolicyVersion\|buildStandardResponse" src/mcp/tools/get_policy_evidence.ts` passes
- `grep -n "registerSearchPolicyRules\|searchPolicyEvidence\|buildStandardResponse" src/mcp/tools/search_policy_rules.ts` passes
