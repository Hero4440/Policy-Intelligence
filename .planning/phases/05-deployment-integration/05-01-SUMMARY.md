---
phase: 05-deployment-integration
plan: 01
subsystem: infra
tags: [mcp, express, cors, ngrok, deployment, smoke-test]

dependency_graph:
  requires:
    - 02-01 (stateless Streamable HTTP MCP server)
    - 03-02 (FHIR-aware readiness tool available through MCP)
    - 04-01 (demo patients available for later Prompt Opinion validation)
  provides:
    - remote_client_safe_mcp_server
    - public_https_tunnel_validation
    - repeatable_deployment_runbook
    - smoke_test_for_health_and_tools
  affects:
    - 05-02 (Prompt Opinion workspace integration)
    - 06-demo-preparation

tech_stack:
  added:
    - cors middleware
    - ngrok HTTPS tunnel workflow
    - standalone smoke test for MCP health and tools/list
  patterns:
    - explicit allowed host configuration for public tunnel domains
    - local-and-public smoke verification before platform registration

key_files:
  created:
    - tests/mcp/smoke-remote-server.ts
    - docs/prompt-opinion/deployment-runbook.md
    - src/types/cors.d.ts
  modified:
    - src/mcp/index.ts
    - package.json

decisions:
  - decision: Keep the existing Express/MCP server and harden it rather than introducing a new deployment wrapper
    rationale: "Fastest path to Prompt Opinion integration with minimal moving parts"
    alternatives: ["Cloudflare Workers rewrite", "Separate reverse proxy layer"]
  - decision: Use PUBLIC_BASE_URL-driven host allowlisting for public tunnels
    rationale: "The MCP SDK's default localhost host validation rejects ngrok hostnames; explicit allowlisting preserves local protection while enabling remote verification"
    alternatives: ["Disable host validation entirely", "Patch SDK internals"]
  - decision: Parse SSE-framed tools/list responses in the smoke test
    rationale: "The MCP endpoint returns event-stream framing, so raw JSON parsing was incorrect for real verification"
    alternatives: ["Assume JSON-only responses", "Use a heavier MCP client harness"]

metrics:
  duration_minutes: 0
  tasks_completed: 3
  files_created: 3
  files_modified: 2
  commits: 0
  completed_date: 2026-04-04
---

# Phase 5 Plan 1: Deployment Hardening Summary

**Remote-safe Express MCP server with CORS, explicit ngrok host allowlisting, and smoke-tested public `/health` and `/mcp` endpoints**

## What Was Built

Completed the deployment-readiness slice needed before Prompt Opinion registration:

1. **Remote access hardening in `src/mcp/index.ts`**
   - Added `cors` middleware for browser-based clients
   - Preserved stateless Streamable HTTP transport
   - Added `timestamp` to `/health`
   - Switched `createMcpExpressApp()` to explicit `allowedHosts` configuration so localhost remains valid while a configured public ngrok hostname is also accepted

2. **Repeatable smoke verification**
   - Added `tests/mcp/smoke-remote-server.ts`
   - Verifies `/health`
   - Verifies `tools/list`
   - Handles the actual SSE-framed JSON-RPC response returned by `/mcp`

3. **Operator runbook**
   - Added `docs/prompt-opinion/deployment-runbook.md`
   - Documents local startup, smoke verification, ngrok exposure, `PUBLIC_BASE_URL` usage, and the exact URLs to place in Prompt Opinion

## Key Issue Found and Fixed

The first public ngrok verification failed with:

```text
Invalid Host: <ngrok-hostname>
```

This came from the MCP SDK's host-header validation inside `createMcpExpressApp()`. By default it only accepts localhost-style hosts. That meant:

- Local verification passed
- Public ngrok verification failed with HTTP `403`

Fix:
- Added `PUBLIC_BASE_URL` parsing in `src/mcp/index.ts`
- Passed `allowedHosts` into `createMcpExpressApp()`
- Restarted the server with `PUBLIC_BASE_URL=<ngrok-url>`

After that fix, both local and public smoke tests passed.

## Verification Performed

**Type-check**

```bash
npx tsc --noEmit
```

Passed.

**Local health**

```bash
curl http://localhost:3000/health
```

Returned:

```json
{"status":"ok","tools":3,"policies":5,"payers":["UHC","Aetna","Cigna"],"drugs":["adalimumab","etanercept","infliximab","upadacitinib"],"timestamp":"2026-04-04T23:29:48.950Z"}
```

**Local smoke test**

```bash
node --import tsx tests/mcp/smoke-remote-server.ts
```

Passed.

**Public ngrok smoke test**

```bash
BASE_URL=https://2836-2600-381-fee8-5d88-9169-9d8d-886b-6761.ngrok-free.app node --import tsx tests/mcp/smoke-remote-server.ts
```

Passed.

**Human checkpoint**
- User confirmed `/health` returned the expected JSON
- User confirmed GET `/mcp` returned `Cannot GET /mcp`, which is expected because the endpoint is POST-only

## Files Created and Modified

- `src/mcp/index.ts` - Added CORS and public hostname allowlisting via `PUBLIC_BASE_URL`
- `package.json` - Added `smoke:mcp` script and explicit `cors` dependency entry
- `tests/mcp/smoke-remote-server.ts` - Health/tools smoke test with SSE-aware parsing
- `docs/prompt-opinion/deployment-runbook.md` - Local + ngrok deployment instructions
- `src/types/cors.d.ts` - Local type declaration to satisfy TypeScript without network install

## Deviations from Plan

One execution-time deviation was required:

- The plan assumed ngrok verification would work once the server was publicly exposed.
- In practice, MCP SDK host validation blocked the public hostname.
- This was fixed inside the plan scope because public verification is a core requirement of `05-01`, not extra scope.

## Issues Encountered

- `tsx` startup under the sandbox failed due to an IPC pipe permission error in `/var/...`. Verification was completed outside the sandbox with approval.
- The smoke test initially failed because `/mcp` returned SSE-framed output instead of raw JSON. The test was updated to parse the `data:` payload correctly.

## User Setup Required

Manual UI setup is still required in Prompt Opinion during `05-02`. This plan only prepares and verifies the publicly reachable MCP service.

## Next Phase Readiness

`05-02` can now use the verified public MCP endpoint:

- Health URL: `https://2836-2600-381-fee8-5d88-9169-9d8d-886b-6761.ngrok-free.app/health`
- MCP URL: `https://2836-2600-381-fee8-5d88-9169-9d8d-886b-6761.ngrok-free.app/mcp`

The remaining blocker is platform access: Prompt Opinion connection setup, SHARP validation, agent creation, and Marketplace publication all require user-visible UI steps.

## Self-Check: PASSED

- Required files exist
- `npx tsc --noEmit` passed
- Local smoke test passed
- Public ngrok smoke test passed
- Human checkpoint passed

---
*Phase: 05-deployment-integration*
*Completed: 2026-04-04*
