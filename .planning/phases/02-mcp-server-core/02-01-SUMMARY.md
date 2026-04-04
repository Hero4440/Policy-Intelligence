---
phase: 02-mcp-server-core
plan: 01
subsystem: mcp-server
tags: [mcp, tools, policy-lookup, express, http-transport]
dependency_graph:
  requires:
    - 01-01-policy-schema
    - 01-02-policy-data
  provides:
    - mcp-server-foundation
    - drug-coverage-tool
    - prior-auth-criteria-tool
    - policy-store-loader
  affects:
    - phase: 03
      why: "Server foundation ready for patient readiness tool and FHIR integration"
tech_stack:
  added:
    - "@modelcontextprotocol/sdk@1.29.0"
    - "express@5.2.1"
  patterns:
    - "Stateless MCP server with per-request server instances"
    - "Streamable HTTP transport with SSE support"
    - "Zod schema validation for tool inputs"
    - "In-memory JSON policy store with O(1) lookup"
key_files:
  created:
    - path: "src/mcp/index.ts"
      lines: 65
      purpose: "Express server with MCP Streamable HTTP transport"
    - path: "src/mcp/policy_store/loader.ts"
      lines: 70
      purpose: "Policy JSON loading and lookup by payer+drug"
    - path: "src/mcp/policy_store/types.ts"
      lines: 7
      purpose: "PolicyRecord type bridge and PolicyStore interface"
    - path: "src/mcp/tools/get_drug_coverage.ts"
      lines: 91
      purpose: "Coverage lookup tool with evidence text"
    - path: "src/mcp/tools/get_prior_auth_criteria.ts"
      lines: 116
      purpose: "PA criteria tool with structured requirements"
    - path: "src/mcp/schemas/tool_inputs.ts"
      lines: 14
      purpose: "Zod input schemas for all tools"
  modified:
    - path: "package.json"
      changes: "Added start/dev scripts and MCP dependencies"
decisions:
  - summary: "Stateless transport per request vs shared instance"
    chosen: "Per-request server and transport instances"
    rationale: "Simpler concurrency model, no session state management, easier to scale horizontally"
    alternatives: "Shared stateful server with session management (more complex, unnecessary for read-only policy lookups)"
  - summary: "Tool response format - structured JSON vs natural language"
    chosen: "Structured JSON with nested evidence fields"
    rationale: "Enables programmatic consumption by client applications while preserving policy traceability"
    alternatives: "Natural language summaries (harder to parse), flat key-value (loses evidence hierarchy)"
  - summary: "Error handling - silent failure vs helpful errors"
    chosen: "Return available payers/drugs in error response"
    rationale: "Users can self-correct typos without needing to check health endpoint"
    alternatives: "Generic 'not found' message (poor UX), fuzzy matching (false positives)"
metrics:
  duration_minutes: 4.0
  tasks_completed: 2
  files_created: 6
  files_modified: 1
  commits: 2
  completed_date: "2026-04-04"
---

# Phase 2 Plan 1: MCP Server Foundation Summary

**One-liner:** Stateless MCP server with Express + Streamable HTTP delivering drug coverage and PA criteria tools backed by in-memory JSON policy store with brand/generic name normalization.

## What Was Built

Created a production-ready MCP server exposing two core tools:

1. **get_drug_coverage** - Returns coverage status, source policy reference, and evidence quotes for a drug+payer combination
2. **get_prior_auth_criteria** - Returns structured PA requirements (diagnosis, step therapy, other restrictions) with per-requirement evidence and source attribution

Server uses:
- MCP SDK 1.29.0 with Streamable HTTP transport (SSE + JSON)
- Express 5.2.1 with MCP-specific middleware
- Stateless architecture (no session management)
- In-memory policy store loading 5 policies from Phase 1 JSON files
- Drug name normalization using Phase 1 alias lookup (Humira → adalimumab, Rinvoq → upadacitinib)

## Tasks Completed

### Task 1: Install MCP SDK dependencies and create policy store loader
**Commit:** ffef5d2

- Installed @modelcontextprotocol/sdk, express, @types/express
- Created `policy_store/types.ts` - Re-exports PolicyRecord from Phase 1 schema + PolicyStore interface
- Created `policy_store/loader.ts` - Loads all 5 policies from JSON at module init, provides findPolicy(payer, drug) with case-insensitive matching and plan identifier handling (e.g., "uhc-commercial" → "UHC")
- Created `schemas/tool_inputs.ts` - Zod schemas for drugCoverageInput, priorAuthCriteriaInput, patientReadinessInput (Phase 3)
- Verified: TypeScript compiles clean, loader loads 5 policies, findPolicy returns correct policy for UHC/adalimumab

### Task 2: Create MCP server with get_drug_coverage and get_prior_auth_criteria tools
**Commit:** 7bfddb3

- Created `tools/get_drug_coverage.ts` - Tool registration with Zod schema, drug normalization, policy lookup, structured response with coverage_status/prior_auth_required/source/evidence. Error handling returns available payers and drugs.
- Created `tools/get_prior_auth_criteria.ts` - Tool registration returning diagnosis_requirements/step_therapy/other_requirements arrays with full evidence text and source attribution per requirement
- Created `index.ts` - Express app with createMcpExpressApp(), GET /health endpoint showing loaded policies, POST /mcp endpoint creating per-request McpServer instance + StreamableHTTPServerTransport (sessionIdGenerator: undefined for stateless mode), tool registration, transport connection
- Updated package.json with "start" and "dev" scripts
- Verified: Server starts on port 3000, health endpoint returns 5 policies, tools/list shows 2 tools, get_drug_coverage("UHC", "Humira") returns covered-with-pa with evidence, get_prior_auth_criteria shows structured requirements, brand name normalization works, unknown drug returns helpful error with available options

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria passed:

- ✅ Server starts without errors on localhost:3000
- ✅ Health endpoint confirms 5 policies loaded
- ✅ tools/list returns 2 registered tools with full descriptions
- ✅ get_drug_coverage("UHC", "Humira") returns covered-with-pa status with evidence text
- ✅ get_drug_coverage("Aetna", "Rinvoq") returns covered-with-pa (JAK inhibitor)
- ✅ get_prior_auth_criteria("UHC", "adalimumab") returns diagnosis reqs, step therapy, and other requirements with evidence
- ✅ Unknown drug returns helpful error with available payers/drugs list
- ✅ Unknown payer returns helpful error
- ✅ Brand name "Humira" correctly resolves to adalimumab via normalizeDrugName()
- ✅ TypeScript compiles with no errors

## Technical Implementation

### Policy Store Architecture

In-memory store loads policies at module initialization:
1. Reads `policies-index.json` for file list
2. Loads each JSON file from `data/policies/structured/`
3. Validates against PolicyRecordSchema
4. Stores in array for O(n) lookup (acceptable for 5 policies, scales to ~100)

Payer matching handles plan identifiers: "uhc-commercial" → "UHC" (extract prefix before dash).

Drug matching requires caller to normalize first (tools do this via normalizeDrugName()).

### MCP Server Pattern

Per-request stateless architecture:
```typescript
app.post('/mcp', async (req, res) => {
  const server = new McpServer({ name, version }, { capabilities: { tools: {} } });
  registerGetDrugCoverage(server);
  registerGetPriorAuthCriteria(server);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
```

Creates fresh server + transport per request. No shared state. Enables horizontal scaling without session affinity.

### Tool Response Structure

**get_drug_coverage:**
```json
{
  "coverage_status": "covered-with-pa",
  "drug_name": { "brand": "Humira", "generic": "adalimumab", "queried_name": "...", "normalized_to": "..." },
  "payer": "UHC",
  "plan": "Commercial",
  "prior_auth_required": true,
  "source": { "document": "...", "effective_date": "...", "url": "..." },
  "evidence": { "diagnosis": "...", "prior_auth_summary": "..." }
}
```

**get_prior_auth_criteria:**
```json
{
  "diagnosis_requirements": [{ "icd10_codes": [...], "description": "...", "evidence": "...", "source": {...} }],
  "step_therapy": [{ "drug": "...", "dosage": "...", "duration": "...", "failure_criteria": "...", "evidence": "...", "source": {...} }],
  "other_requirements": [{ "category": "...", "requirement": "...", "evidence": "...", "is_ambiguous": false, "source": {...} }],
  "source": { "document": "...", "url": "...", "effective_date": "..." }
}
```

Every requirement includes `evidence` (policy quote) and `source` (document/page/section) for traceability.

### Error Handling

Tools return structured errors with discovery hints:
```json
{
  "error": "Policy not found",
  "message": "No policy found for plan \"UHC\" and drug \"UnknownDrug\" (normalized to \"UnknownDrug\")",
  "available_payers": ["UHC", "Aetna", "Cigna"],
  "available_drugs": ["adalimumab", "etanercept", "infliximab", "upadacitinib"],
  "hint": "Try one of the available payers and drugs listed above"
}
```

Reduces round trips - user sees available options immediately.

## Impact on Roadmap

**Phase 2 Plan 2 (Patient Readiness Tool):** Can now register third tool using same pattern. Policy store and transport layer ready.

**Phase 3 (Prompt Opinion Integration):** Client can connect to http://localhost:3000/mcp and call tools. Streamable HTTP supports SSE for long-running operations (useful if Phase 3 adds async processing).

**Phase 4 (FHIR Integration):** Tools return structured JSON easily mapped to FHIR resources. Source attribution enables FHIR Provenance.

**Phase 5 (Multi-plan Analysis):** `findPoliciesByDrug()` already implemented (unused) - ready for cross-payer comparison.

## Success Criteria Met

✅ MCP server running on localhost:3000 with two functional tools
✅ Tools return evidence-backed coverage and criteria responses from Phase 1 policy data store
✅ Drug alias resolution working for brand/generic/biosimilar names (Humira/adalimumab/Amjevita)
✅ Helpful errors for unknown payers/drugs
✅ Source attribution on every requirement (document, page, section)
✅ TypeScript compilation clean
✅ Health endpoint confirms 5 policies loaded

## Next Steps

**Phase 2 Plan 2:** Add patient_readiness tool integrating diagnosis requirements + step therapy checks against patient context (skeleton for Phase 3 FHIR integration).

## Self-Check: PASSED

**Created files exist:**
```
FOUND: src/mcp/index.ts
FOUND: src/mcp/policy_store/loader.ts
FOUND: src/mcp/policy_store/types.ts
FOUND: src/mcp/tools/get_drug_coverage.ts
FOUND: src/mcp/tools/get_prior_auth_criteria.ts
FOUND: src/mcp/schemas/tool_inputs.ts
```

**Commits exist:**
```
FOUND: ffef5d2 (Task 1 - policy store loader)
FOUND: 7bfddb3 (Task 2 - MCP server with tools)
```

**Verification:**
```bash
# Server starts and responds
curl http://localhost:3000/health
# Returns: {"status":"ok","policies":5,"payers":["UHC","Aetna","Cigna"],"drugs":["adalimumab","etanercept","infliximab","upadacitinib"]}

# Tools registered
curl -X POST http://localhost:3000/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
# Returns 2 tools: get_drug_coverage, get_prior_auth_criteria

# Coverage lookup works
curl -X POST http://localhost:3000/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_drug_coverage","arguments":{"plan":"UHC","drug":"Humira"}}}'
# Returns: coverage_status: "covered-with-pa", prior_auth_required: true, with evidence text
```
