---
phase: 04-deployment-integration
plan: 01
subsystem: deployment
tags: [mcp, smoke-test, ngrok, deployment]

requires:
  - phase: 03-hybrid-q-a-engine
    provides: seven registered MCP tools including ask_policy_question
provides:
  - remote smoke coverage for all 7 tools
  - automated ngrok deployment entrypoint
  - package script for one-command tunnel startup
affects: [phase-04-deployment-integration]

tech-stack:
  added: [@ngrok/ngrok]
  patterns:
    - JSON-RPC smoke validation through tools/list and tools/call
    - programmatic ngrok tunnel orchestration with PUBLIC_BASE_URL injection
    - local Ollama-backed deployment documentation for ask_policy_question

key-files:
  created:
    - scripts/deploy-ngrok.ts
  modified:
    - tests/mcp/smoke-remote-server.ts
    - package.json
    - package-lock.json
    - docs/prompt-opinion/deployment-runbook.md
    - docs/prompt-opinion/workspace-integration.md
    - .planning/STATE.md
    - .planning/phases/03-hybrid-q-a-engine/03-02-SUMMARY.md
    - .planning/phases/04-deployment-integration/04-02-PLAN.md
    - .planning/phases/04-deployment-integration/04-RESEARCH.md

key-decisions:
  - "Phase 4 deployment assumes the local Ollama-compatible LLM path, not Anthropic credentials."
  - "Remote smoke testing should prove tool execution, not just tool discovery, by calling list_policies."

patterns-established:
  - "deploy:ngrok injects PUBLIC_BASE_URL into the MCP server process after the tunnel is established."
  - "Smoke tests warn on /health tool-count drift without failing, but still fail on missing tool names or failed list_policies execution."

duration: 25 min
completed: 2026-04-18
---

# Phase 4 Plan 01: Smoke Test + ngrok Deployment Summary

**7-tool remote validation and one-command ngrok deployment, aligned to the local Ollama-backed Q&A path**

## Performance

- **Duration:** 25 min
- **Completed:** 2026-04-18
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Expanded the MCP smoke test to check all seven registered tools.
- Added a `tools/call` validation step for `list_policies` so remote verification confirms execution, not just discovery.
- Added `scripts/deploy-ngrok.ts` to create the ngrok tunnel, print the public endpoints, and launch the MCP server with `PUBLIC_BASE_URL`.
- Added `npm run deploy:ngrok` to make the demo deployment path a single command.
- Updated deployment-facing docs and planning artifacts to match the local Ollama-backed `ask_policy_question` implementation.

## Files Created/Modified

- `tests/mcp/smoke-remote-server.ts` - Validates `/health`, `tools/list`, and `tools/call` for `list_policies`.
- `scripts/deploy-ngrok.ts` - Starts the ngrok tunnel and spawns the MCP server with the public base URL.
- `package.json` - Adds the `deploy:ngrok` script and keeps the runtime dependency set aligned with the local-LLM path.
- `package-lock.json` - Locks the ngrok SDK dependency tree.
- `docs/prompt-opinion/deployment-runbook.md` - Documents the 7-tool smoke expectations, automated deployment path, and local model prerequisites.
- `docs/prompt-opinion/workspace-integration.md` - Updates the Prompt Opinion setup flow to all seven tools and the new demo scenarios.
- `.planning/STATE.md` - Replaces the stale Anthropic blocker with the local Ollama requirement.
- `.planning/phases/03-hybrid-q-a-engine/03-02-SUMMARY.md` - Corrects the Phase 3 summary to match the actual local LLM implementation.
- `.planning/phases/04-deployment-integration/04-02-PLAN.md` and `04-RESEARCH.md` - Align downstream deployment guidance with the local model runtime.

## Verification

- `npm install @ngrok/ngrok`
- `node --import tsx scripts/deploy-ngrok.ts`
  - Result: failed fast with ngrok auth error until `NGROK_AUTHTOKEN` is provided, which is the expected precondition behavior.
- Static review confirmed:
  - `tests/mcp/smoke-remote-server.ts` now expects all 7 tools and executes `list_policies`
  - `scripts/deploy-ngrok.ts` exists and is wired through `package.json`
  - deployment docs now reference the local Ollama-backed `ask_policy_question` path

## Issues Encountered

- Full local smoke verification against `localhost:3000` was blocked by the current sandbox/runtime behavior, which would not keep the MCP server reachable for the follow-on smoke command from inside the agent environment.
- Live tunnel verification still requires a valid `NGROK_AUTHTOKEN` and the human Prompt Opinion checkpoint in plan `04-02`.

## Next Phase Readiness

Plan `04-01` is complete. Plan `04-02` is ready for the documentation checkpoint and human verification pass once a live ngrok URL is available.
