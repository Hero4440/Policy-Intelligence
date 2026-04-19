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
- `tools/list` shows `get_drug_coverage`, `get_prior_auth_criteria`, `check_patient_readiness`, `list_policies`, `get_policy_summary`, `compare_drug_across_payers`, and `ask_policy_question`
- `tools/call` for `list_policies` returns a standard response envelope with an `answer` field

Do not move to Prompt Opinion until local verification passes.

## 3. Start the HTTPS tunnel with ngrok

Use the automated path for demos unless you need to debug the tunnel manually:

```bash
# Automated (recommended):
NGROK_AUTHTOKEN=your_token LOCAL_LLM_MODEL=llama3.1 npm run deploy:ngrok

# Manual (if you prefer separate terminals):
ngrok http 3000
```

Capture the public HTTPS base URL from ngrok, for example:

```text
https://abc123.ngrok-free.app
```

The exact Prompt Opinion values to use are:
- MCP endpoint: `https://abc123.ngrok-free.app/mcp`
- Health check: `https://abc123.ngrok-free.app/health`

If you use the manual path, start the MCP server separately:

```bash
PUBLIC_BASE_URL=https://abc123.ngrok-free.app LOCAL_LLM_MODEL=llama3.1 npm start
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

## 6. Demo Validation

- Bevacizumab comparison:
  - Call `compare_drug_across_payers` with `{ "drug_family": "bevacizumab" }`
  - Expected: response highlights the BCBS NC preferred/non-preferred product split
- Rituximab Q&A:
  - Call `ask_policy_question` with `{ "question": "What prior authorization criteria does Cigna require for rituximab?" }`
  - Expected: grounded answer with evidence snippets from the Cigna policy
- Policy listing:
  - Call `list_policies` with `{}`
  - Expected: 4+ loaded policies with payer and drug metadata
- Remote smoke:
  - Run `BASE_URL=https://abc123.ngrok-free.app npm run smoke:mcp`
  - Expected: `/health`, `tools/list`, and `list_policies` tool execution all pass

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

### ask_policy_question fails because the local model is unavailable

Cause:
- Ollama is not running locally, or `LOCAL_LLM_MODEL` / `OLLAMA_MODEL` points to a model that is not installed

What to do:
- Start Ollama before launching the MCP server
- Verify model availability with `curl http://127.0.0.1:11434/api/tags`
- Set `LOCAL_LLM_MODEL` or `OLLAMA_MODEL` to an installed model if `llama3.1` is not present

### Prompt Opinion tool calls work, but patient readiness cannot access patient context

Cause:
- SHARP FHIR context was not enabled, or the workspace configuration does not match expected context propagation

What to do:
- Re-check the SHARP toggle in Prompt Opinion
- Continue with Phase `05-02` to capture the actual context payload shape and reconcile the tool input contract

## Demo-Day Checklist

- Local Ollama is running
- `npm start` or `npm run deploy:ngrok` is running successfully
- `npm run smoke:mcp` passes locally
- `ngrok http 3000` is running, or `npm run deploy:ngrok` printed the public URL
- `BASE_URL=https://... npm run smoke:mcp` passes against the tunnel
- Copied URLs are correct:
- `https://.../health`
- `https://.../mcp`
- Prompt Opinion connection uses Streamable HTTP
- All 7 tools are visible in Prompt Opinion
- Bevacizumab comparison returns the preferred/non-preferred split
- Rituximab Q&A returns an evidence-backed answer
- SHARP context reminder noted for the workspace setup step
