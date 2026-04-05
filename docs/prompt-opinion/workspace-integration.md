# Prompt Opinion Workspace Integration

This document captures the exact Phase `05-02` workspace setup path for PolicyPilot. It combines the confirmed deployment outputs from `05-01` with the remaining UI steps that must be performed inside Prompt Opinion.

## Verified connection values

- Connection name: `PolicyPilot MCP Server`
- Transport: `Streamable HTTP`
- MCP endpoint URL: `https://2836-2600-381-fee8-5d88-9169-9d8d-886b-6761.ngrok-free.app/mcp`
- Health check URL: `https://2836-2600-381-fee8-5d88-9169-9d8d-886b-6761.ngrok-free.app/health`
- Authentication: `None` for the hackathon path

## Status

- Deployment verified locally: yes
- Deployment verified through ngrok: yes
- Prompt Opinion MCP connection created: pending user workspace step
- SHARP FHIR context enabled: pending user workspace step
- PolicyPilot agent created: pending user workspace step
- End-to-end in-platform validation: pending user workspace step

## Workspace path

Based on the hackathon walkthrough, the expected UI flow is:

1. Open Prompt Opinion workspace
2. Go to `Workspace Hub`
3. Choose `Add MCP Server` or `Add Connection`
4. Paste the MCP endpoint URL ending in `/mcp`
5. Use `Streamable HTTP`
6. Leave authentication empty for this demo path
7. Enable the SHARP/FHIR context checkbox
8. Run the built-in connection test
9. Save the MCP connection

## SHARP requirement

The SHARP/FHIR context toggle is required for `check_patient_readiness` to receive patient-linked FHIR credentials and patient identity. If the box is not enabled:

- `get_drug_coverage` should still work
- `get_prior_auth_criteria` should still work
- `check_patient_readiness` will fall back to checklist mode instead of automated analysis

## Agent configuration path

Once the MCP connection is saved:

1. Go to `Agents`
2. Create or edit the PolicyPilot agent
3. Attach the `PolicyPilot MCP Server` connection
4. Add all three tools:
   - `get_drug_coverage`
   - `get_prior_auth_criteria`
   - `check_patient_readiness`
5. Save the agent

Recommended agent framing:

```text
You are PolicyPilot, a prior authorization readiness assistant. Use the attached MCP tools to answer coverage, prior authorization criteria, and patient readiness questions. Always ground responses in policy evidence. When discussing patient readiness, use cautious clinical language such as "appears to match", "may be missing", and "documentation may be needed".
```

## In-platform validation flow

Use one of the demo patients from Phase 4 and test the following sequence:

1. Coverage check
   - Ask: `Is Humira covered for this patient’s plan?`
   - Expected: response uses `get_drug_coverage` and cites policy evidence

2. Criteria check
   - Ask: `What are the prior authorization requirements for Humira?`
   - Expected: response uses `get_prior_auth_criteria` and returns structured requirements with evidence

3. Readiness check
   - Ask: `Is this patient ready for Humira prior authorization submission?`
   - Expected: response uses `check_patient_readiness`
   - If SHARP context is working, the tool should attempt FHIR retrieval and return automated readiness analysis
   - If SHARP context is not working, the tool will return checklist mode and that should be treated as a configuration failure for Phase `05-02`

## Supported SHARP payload shapes in code

The server currently accepts these patient-context patterns:

### Flat shape

```json
{
  "patient_context": {
    "fhir_token": "token",
    "patient_id": "123",
    "fhir_server_url": "https://fhir.promptopinion.ai"
  }
}
```

### Alias-based flat shape

```json
{
  "patient_context": {
    "access_token": "token",
    "patientId": "123",
    "server_url": "https://fhir.promptopinion.ai"
  }
}
```

### Nested SHARP shape

```json
{
  "patient_context": {
    "sharp_context": {
      "access_token": "token",
      "patient_id": "123",
      "fhir_server_url": "https://fhir.promptopinion.ai"
    }
  }
}
```

### Nested patient object shape

```json
{
  "patient_context": {
    "sharp_context": {
      "access_token": "token",
      "patient": {
        "id": "123"
      }
    }
  }
}
```

If Prompt Opinion sends a different shape, record it here and update `src/mcp/fhir/client.ts`, `src/mcp/schemas/tool_inputs.ts`, and `src/mcp/tools/check_patient_readiness.ts` accordingly.

## Observed Prompt Opinion details

Fill this section during the live workspace step.

- Exact connection menu label: pending
- Exact SHARP checkbox label: pending
- Exact tool attachment flow: pending
- Exact Marketplace Studio publish path: pending
- Actual patient-context payload shape observed in logs/tool args: pending

## Demo patients to use

- Sarah Anderson: full-match scenario
- Michael Chen: partial-match scenario with methotrexate gap
- Linda Washington: poor-match scenario with major gaps

## Completion checklist

- [ ] MCP connection saved successfully
- [ ] Connection test passes
- [ ] SHARP FHIR context enabled
- [ ] PolicyPilot agent shows all three tools
- [ ] Coverage question works
- [ ] Criteria question works
- [ ] Readiness question performs automated analysis instead of checklist fallback
- [ ] Observed Prompt Opinion wording recorded above
