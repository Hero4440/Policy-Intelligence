# 11-05 Summary

- Added `generate_next_steps` in [src/mcp/tools/generate_next_steps.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/mcp/tools/generate_next_steps.ts).
- The tool wraps the existing next-steps engine and returns clinic actions, missing documentation items, patient explanation text, and payer-analyst breakdown data.
- Added `get_case_summary` in [src/mcp/tools/get_case_summary.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/mcp/tools/get_case_summary.ts).
- The case summary tool combines patient case data, saved evaluations, the latest evaluation, and optional next-step generation in one MCP response.
- Updated [src/mcp/index.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/mcp/index.ts) to register all 17 MCP tools and report `tools: 17` on `/health`.

**Verification**

- `npx tsc --noEmit` passes
- `grep -n "registerGenerateNextSteps\|generateNextSteps\|buildStandardResponse" src/mcp/tools/generate_next_steps.ts` passes
- `grep -n "registerGetCaseSummary\|listEvaluations\|generateNextSteps\|buildStandardResponse" src/mcp/tools/get_case_summary.ts` passes
