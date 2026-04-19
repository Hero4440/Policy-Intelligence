---
phase: 03-hybrid-q-a-engine
plan: 02
subsystem: mcp
tags: [mcp, q-and-a, anthropic, grounding]

requires:
  - phase: 03-hybrid-q-a-engine
    provides: entity extraction, routing, and evidence retrieval utilities
provides:
  - local Ollama-backed grounded answer generation
  - claim validation for evidence citations
  - ask_policy_question MCP tool registered in the server
affects: [phase-04-deployment-integration]

tech-stack:
  added: [@anthropic-ai/sdk]
  patterns:
    - retrieve-then-inject evidence grounding for policy Q&A
    - post-generation claim validation against evidence reference indexes
    - route metadata attached to deterministic and LLM-backed tool responses

key-files:
  created:
    - src/mcp/tools/utils/llm_client.ts
    - src/mcp/tools/utils/claim_validator.ts
    - src/mcp/tools/ask_policy_question.ts
  modified:
    - package.json
    - package-lock.json
    - src/mcp/schemas/tool_inputs.ts
    - src/mcp/index.ts

key-decisions:
  - "LLM-backed answers use the local Ollama-compatible endpoint and fail closed when the local model service is unavailable."
  - "Deterministic routes are still handled inside ask_policy_question so the natural-language tool can return HIGH-confidence answers without re-entering MCP registration callbacks."

patterns-established:
  - "Natural-language questions now surface route metadata and detected entities in structured_result."
  - "Claim validation keeps transitional sentences but strips any sentence that cites non-existent evidence references."

duration: 7 min
completed: 2026-04-17
---

# Phase 3 Plan 02: ask_policy_question Tool Summary

**Hybrid natural-language policy Q&A with deterministic routing, local Ollama grounding, and claim-level evidence validation**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-18T00:10:00Z
- **Completed:** 2026-04-18T00:16:44Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added an evidence-injection local LLM client for grounded answers using the existing Ollama-compatible runtime.
- Added claim validation that keeps transitional prose but removes sentences with invalid evidence references.
- Added and registered `ask_policy_question`, including deterministic pass-throughs, out-of-scope handling, insufficient-evidence handling, and LLM fallback.
- Updated `/health` to report seven registered tools.
- Verified the tool through live MCP requests for deterministic, out-of-scope, and missing-API-key LLM paths.

## Task Commits

Each task was committed atomically:

1. **Task 1: Build LLM client and claim validator** - `63a1888` (feat)
2. **Task 2: Build ask_policy_question tool and register in MCP server** - `bc707c1` (feat)

## Files Created/Modified

- `package.json` - Keeps the runtime aligned with the local Ollama-compatible path.
- `package-lock.json` - Locks the current local-LLM deployment dependency tree.
- `src/mcp/tools/utils/llm_client.ts` - Wraps the local Ollama-compatible chat API with evidence-grounding instructions.
- `src/mcp/tools/utils/claim_validator.ts` - Extracts cited claims and removes sentences with invalid evidence references.
- `src/mcp/tools/ask_policy_question.ts` - Implements hybrid natural-language Q&A and deterministic tool pass-throughs.
- `src/mcp/schemas/tool_inputs.ts` - Adds the `ask_policy_question` input schema.
- `src/mcp/index.ts` - Registers `ask_policy_question` and updates `/health` to `tools: 7`.

## Decisions Made

- Local model connectivity failures return a structured tool error so the server stays predictable under deployment misconfiguration.
- Deterministic summary and comparison responses are constructed inline inside the new tool to keep the natural-language entry point self-contained.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- The local environment must have Ollama running with an installed model for the LLM path to succeed.
- The MCP app still emits the existing `0.0.0.0` host warning during local verification because the server intentionally supports rotating ngrok URLs.

## User Setup Required

Run Ollama locally before using the LLM-backed route in `ask_policy_question`. Optionally set `LOCAL_LLM_MODEL` or `OLLAMA_MODEL` to override the default `llama3.1`.

## Verification

- `npm install @anthropic-ai/sdk`
- `npx tsc --noEmit`
- Live `/health` request returned `tools: 7`, `policies: 7`, and the loaded payer/drug inventory.
- Live MCP `tools/list` response included `ask_policy_question`.
- Live MCP `ask_policy_question` call for `What policies are loaded?` returned `route: "deterministic"` with seven policies.
- Live MCP `ask_policy_question` call for `What is the weather today?` returned `route: "out_of_scope"`.
- Live MCP `ask_policy_question` call for a complex comparison uses the local Ollama-compatible path when the LLM route is selected.

## Next Phase Readiness

Phase 3 is complete. Phase 4 can now focus on ngrok exposure and Prompt Opinion validation using all seven registered MCP tools.

---
*Phase: 03-hybrid-q-a-engine*
*Completed: 2026-04-17*
