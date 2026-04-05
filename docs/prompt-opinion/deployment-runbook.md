# PolicyPilot Deployment Runbook

This runbook is the fast path for getting the local PolicyPilot MCP server reachable from Prompt Opinion during development or demo sessions.

## 1. Start the local MCP server

From the repo root:

```bash
npm start
```

Expected startup output on stderr:
- `PolicyPilot MCP server listening on port 3000`
- `Health check: http://localhost:3000/health`
- `MCP endpoint: http://localhost:3000/mcp`

## 2. Verify the local server before tunneling

Run the smoke test:

```bash
npm run smoke:mcp
```

Manual spot checks:

```bash
curl http://localhost:3000/health
curl -X POST http://localhost:3000/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Expected outcome:
- `/health` returns `status: "ok"` plus tool and policy counts
- `tools/list` shows `get_drug_coverage`, `get_prior_auth_criteria`, and `check_patient_readiness`

Do not move to Prompt Opinion until local verification passes.

## 3. Start the HTTPS tunnel with ngrok

Install and authenticate ngrok first if needed, then open the tunnel:

```bash
ngrok http 3000
```

Capture the public HTTPS base URL from ngrok, for example:

```text
https://abc123.ngrok-free.app
```

The exact Prompt Opinion values to use are:
- MCP endpoint: `https://abc123.ngrok-free.app/mcp`
- Health check: `https://abc123.ngrok-free.app/health`

Before restarting the server for tunneled access, allow the public hostname through the MCP SDK host validation layer:

```bash
PUBLIC_BASE_URL=https://abc123.ngrok-free.app npm start
```

If you already started the server without `PUBLIC_BASE_URL`, stop it and restart with the ngrok base URL set. The server keeps localhost access and additionally allows the configured public hostname.

## 4. Verify the tunneled deployment

Re-run the smoke test against the ngrok base URL:

```bash
BASE_URL=https://abc123.ngrok-free.app npm run smoke:mcp
```

Do not register the connection in Prompt Opinion until the tunneled smoke test passes.

## 5. Prompt Opinion registration inputs

When creating the MCP connection in Prompt Opinion, copy:
- Connection name: `PolicyPilot MCP Server`
- MCP endpoint URL: your public `https://.../mcp`
- Health check URL: your public `https://.../health`
- Transport: Streamable HTTP

During workspace setup, make sure SHARP FHIR context is enabled. That configuration is handled in the next plan, but forgetting it here will block patient-aware readiness checks later.

## Troubleshooting

### Browser or platform shows CORS errors

Cause:
- Missing or incomplete CORS headers on the MCP server

What to check:
- Server is running the updated `src/mcp/index.ts`
- `origin`, `credentials`, `GET/POST/OPTIONS`, and `Mcp-Session-Id` exposure are present

### Health checks are failing

Cause:
- Prompt Opinion or another client is pointed at `/mcp` for a GET probe instead of `/health`

What to check:
- Health check URL ends with `/health`
- MCP endpoint URL ends with `/mcp`

### ngrok URL changed unexpectedly

Cause:
- Free ngrok URLs rotate when the tunnel restarts

What to do:
- Update the Prompt Opinion connection with the new HTTPS base URL
- Re-run `BASE_URL=https://... npm run smoke:mcp`
- Prefer authenticated ngrok usage for more stable demo sessions

### Prompt Opinion tool calls work, but patient readiness cannot access patient context

Cause:
- SHARP FHIR context was not enabled, or the workspace configuration does not match expected context propagation

What to do:
- Re-check the SHARP toggle in Prompt Opinion
- Continue with Phase `05-02` to capture the actual context payload shape and reconcile the tool input contract

## Demo-Day Checklist

- `npm start` is running successfully
- `npm run smoke:mcp` passes locally
- `ngrok http 3000` is running
- `BASE_URL=https://... npm run smoke:mcp` passes against the tunnel
- Copied URLs are correct:
- `https://.../health`
- `https://.../mcp`
- Prompt Opinion connection uses Streamable HTTP
- SHARP context reminder noted for the workspace setup step
