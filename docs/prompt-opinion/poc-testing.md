# PolicyPilot POC Testing Checklist (Prompt Opinion)

This guide is the practical step-by-step flow to validate that the PolicyPilot MCP server is connected correctly and works end-to-end in Prompt Opinion.

## Pre-flight (before Prompt Opinion)

1. Install dependencies (first time only):
   - `npm install`
2. Start MCP server:
   - `npm start`
3. In a separate terminal, expose port 3000 with ngrok:
   - `ngrok http 3000`
4. Copy the public ngrok base URL (example: `https://abc123.ngrok-free.app`).
5. Validate endpoints from terminal:
   - `curl https://<ngrok-base>/health`
   - `curl -X POST https://<ngrok-base>/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`
6. Optional smoke test through tunnel:
   - `BASE_URL=https://<ngrok-base> npm run smoke:mcp`

## Prompt Opinion connection setup

1. Sign in to Prompt Opinion.
2. Go to `Workspace Hub` and add an MCP connection.
3. Set fields:
   - Friendly Name: `PolicyPilot MCP Server`
   - Endpoint: `https://<ngrok-base>/mcp`
   - Transport Type: `Streamable HTTP`
   - Authentication: `None` (hackathon/demo path)
   - Health URL (if shown): `https://<ngrok-base>/health`
4. Enable SHARP/FHIR context passthrough checkbox (required for patient-aware readiness).
5. Run `Test Connection` and Save.

## Agent wiring

1. Open `Agents`.
2. Edit or create `Policy Intelligence Coverage Agent`.
3. Attach MCP server/tools.
4. Ensure these tools are available:
   - `get_drug_coverage`
   - `get_prior_auth_criteria`
   - `check_patient_readiness`
   - `list_policies`
   - `get_policy_summary`
   - `compare_drug_across_payers`
   - `ask_policy_question`
5. Save agent.

## Chat validation flow (your core sequence, extended)

1. Go to Launchpad.
2. Select `Patient A` (or any demo patient).
3. Select `General Chat Agent`.
4. Use `Consult with another agent` and choose `Policy Intelligence Coverage Agent`.
5. Ask these prompts in order:
   - `What policies are loaded?`
   - `Compare bevacizumab coverage across payers.`
   - `What prior authorization criteria does Cigna require for rituximab?`
   - `Is bevacizumab covered under BCBS NC?`
   - `Is this patient ready for bevacizumab prior authorization submission?`

## What success looks like

1. Responses are policy-specific (not generic).
2. Tool trace/debug pane shows MCP tool calls for each question.
3. Readiness response uses patient context (not only generic checklist language).
4. No endpoint/connectivity failures (`404`, `Cannot POST /`, timeout).

## Common failure signals and fixes

1. Error: `Cannot POST /`
   - Fix: endpoint must end with `/mcp`.
2. Health check fails
   - Fix: health URL must end with `/health`.
3. Tools not visible
   - Fix: re-run connection test and confirm server is running on ngrok target port.
4. Readiness not patient-aware
   - Fix: enable SHARP/FHIR context toggle in connection/agent config.
5. Random failures after restart
   - Fix: ngrok URL changed; update both `/mcp` and `/health` URLs in Prompt Opinion.

## Suggested additional test prompts

1. `Summarize the BCBS NC bevacizumab policy.`
2. `List prior authorization requirements for Humira.`
3. `Which payer has stricter bevacizumab controls and why?`
4. `What evidence supports this recommendation?`

## Run log template

- Date:
- ngrok base URL:
- Connection test: Pass/Fail
- Tools discovered count:
- Patient used:
- Prompt results:
  - policies loaded: Pass/Fail
  - cross-payer compare: Pass/Fail
  - rituximab criteria: Pass/Fail
  - BCBS NC coverage: Pass/Fail
  - patient readiness: Pass/Fail
- Notes:
