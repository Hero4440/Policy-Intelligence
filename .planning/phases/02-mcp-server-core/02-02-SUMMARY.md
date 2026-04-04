---
phase: 02-mcp-server-core
plan: 02
subsystem: mcp-server
tags: [mcp, patient-readiness, policy-criteria, stub-implementation]
dependency_graph:
  requires:
    - 02-01-mcp-server-foundation
    - 01-02-policy-data
  provides:
    - patient-readiness-tool
    - complete-3-tool-mcp-server
  affects:
    - phase: 03
      why: "Readiness tool stub ready for FHIR patient context integration"
    - phase: 05
      why: "Complete tool surface area ready for Prompt Opinion integration"
tech_stack:
  added: []
  patterns:
    - "Policy criteria extraction into structured checklist"
    - "Stub response pattern for future FHIR integration"
    - "Unified error handling across all 3 tools"
key_files:
  created:
    - path: "src/mcp/tools/check_patient_readiness.ts"
      lines: 145
      purpose: "Patient readiness tool returning PA criteria checklist stub"
  modified:
    - path: "src/mcp/index.ts"
      changes: "Added check_patient_readiness registration and tool count to health endpoint"
decisions:
  - summary: "Stub response vs partial FHIR integration"
    chosen: "Return criteria checklist with requires_patient_data status"
    rationale: "Clear contract for Phase 3 FHIR integration; useful standalone checklist for manual assessment"
    alternatives: "Partial matching logic (premature), empty stub (less useful)"
  - summary: "Criteria extraction structure"
    chosen: "Flatten all requirements into single checklist array"
    rationale: "Simpler for UI consumption; easier to iterate and match against patient data in Phase 3"
    alternatives: "Preserve nested structure (harder to iterate), separate arrays per category (more complex)"
metrics:
  duration_minutes: 2.5
  tasks_completed: 1
  files_created: 1
  files_modified: 1
  commits: 1
  completed_date: "2026-04-04"
---

# Phase 2 Plan 2: Patient Readiness Tool Summary

**One-liner:** Complete 3-tool MCP server with check_patient_readiness returning structured policy criteria checklists ready for Phase 3 FHIR patient context matching.

## What Was Built

Added the third core MCP tool completing Phase 2's tool surface area:

**check_patient_readiness** - Analyzes policy criteria against patient context, returning a structured checklist of all PA requirements with status "requires_patient_data" (stub for Phase 3 FHIR integration). Tool extracts:
- Diagnosis requirements (ICD-10 codes, descriptions, evidence)
- Step therapy requirements (drug, dosage, duration, failure criteria, evidence)
- Other requirements (prescriber, labs, dosing, combinations, safety screening)

Each criterion includes:
- Category (diagnosis, step_therapy, prescriber qualification, etc.)
- Status: "requires_patient_data" (consistent stub for all criteria)
- Evidence text (policy quote)
- Source attribution (document, page, section)
- Ambiguous flag (for unclear policy language)

Response includes readiness_status "pending_patient_context" and helpful note explaining FHIR integration is coming in Phase 3.

## Tasks Completed

### Task 1: Implement check_patient_readiness stub and register all 3 tools
**Commit:** 9d3648b

**Created check_patient_readiness.ts:**
- Tool registration with detailed description for LLM agent selection
- Input schema: plan, drug, patient_context (passthrough object)
- Drug name normalization using Phase 1 alias lookup
- Policy lookup via policy_store/loader
- Criteria extraction logic:
  - Loop through diagnosisRequirements → add to checklist with category "diagnosis"
  - Loop through stepTherapy → format as "drug (dosage) for duration - criteria" with category "step_therapy"
  - Loop through otherRequirements → add with original category (prescriber qualification, lab monitoring, etc.)
- All criteria get status: "requires_patient_data"
- Return structured response with total_criteria count and note about Phase 3 FHIR
- Error handling returns available payers/drugs (consistent with other tools)

**Updated src/mcp/index.ts:**
- Imported registerCheckPatientReadiness
- Registered third tool in MCP endpoint
- Updated health endpoint to show tools: 3

**Verified:**
- TypeScript compiles clean (npx tsc --noEmit)
- Server starts and loads 5 policies
- Health endpoint returns {"status":"ok","tools":3,"policies":5,...}
- tools/list returns exactly 3 tools with semantic descriptions
- check_patient_readiness("Aetna", "Rinvoq", {}) returns 11 criteria (JAK inhibitor heavy requirements)
- check_patient_readiness("UHC", "Enbrel", {}) returns 4 criteria (TNF inhibitor standard requirements)
- Brand name resolution: "Rinvoq" → upadacitinib, "Enbrel" → etanercept
- Biosimilar resolution: "Amjevita" → adalimumab
- Unknown drug returns helpful error with available payers/drugs
- All 3 tools work with brand/generic/biosimilar names
- Server handles sequential requests without crashing

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria passed:

✅ tools/list returns exactly 3 tools with semantic descriptions
✅ get_drug_coverage works for all 5 policies (tested UHC adalimumab, Aetna adalimumab)
✅ get_prior_auth_criteria returns structured criteria (tested Cigna infliximab)
✅ check_patient_readiness returns criteria checklist with "requires_patient_data" status
✅ Brand names resolve correctly: Humira, Enbrel, Remicade, Rinvoq
✅ Biosimilar names resolve correctly: Amjevita → adalimumab
✅ Unknown drug returns error with list of supported drugs
✅ Server handles multiple sequential requests without crashing

## Technical Implementation

### Criteria Extraction Logic

The tool transforms nested policy structure into a flat checklist suitable for UI rendering and future FHIR matching:

```typescript
// Diagnosis requirements
for (const diagReq of policy.diagnosisRequirements) {
  criteriaChecklist.push({
    criterion: diagReq.description,
    category: 'diagnosis',
    status: 'requires_patient_data',
    evidence: diagReq.evidenceText,
    source: { document, page, section }
  });
}

// Step therapy requirements
for (const stepReq of policy.stepTherapy) {
  const criterion = `${stepReq.drugName}${stepReq.dosage ? ' (' + stepReq.dosage + ')' : ''} for ${stepReq.duration} - ${stepReq.failureCriteria}`;
  criteriaChecklist.push({
    criterion: criterion,
    category: 'step_therapy',
    status: 'requires_patient_data',
    evidence: stepReq.evidenceText,
    source: { document, page, section }
  });
}

// Other requirements (prescriber, labs, dosing, safety)
for (const otherReq of policy.otherRequirements) {
  criteriaChecklist.push({
    criterion: otherReq.requirement,
    category: otherReq.category, // preserves original category
    status: 'requires_patient_data',
    evidence: otherReq.evidenceText,
    is_ambiguous: otherReq.ambiguous,
    source: { document, page, section }
  });
}
```

Result: Single array with 4-11 criteria depending on policy (Aetna JAK inhibitor = 11, UHC TNF = 4).

### Response Structure

```json
{
  "drug": { "brand": "Rinvoq", "generic": "upadacitinib", "queried_name": "Rinvoq", "normalized_to": "upadacitinib" },
  "payer": "Aetna",
  "plan": "Commercial",
  "indication": "Rheumatoid Arthritis",
  "readiness_status": "pending_patient_context",
  "message": "Patient context integration pending. Below are the prior authorization criteria...",
  "criteria_checklist": [
    {
      "criterion": "Moderately to severely active rheumatoid arthritis...",
      "category": "diagnosis",
      "status": "requires_patient_data",
      "evidence": "Member has moderately to severely active rheumatoid arthritis...",
      "source": { "document": "...", "page": 7, "section": "..." }
    },
    ...
  ],
  "total_criteria": 11,
  "note": "Full FHIR patient context matching will be available in a future update.",
  "source": { "document": "...", "url": "...", "effective_date": "2026-01-01" }
}
```

### MCP Server State

After Phase 2 completion, MCP server exposes:

1. **get_drug_coverage** - Coverage status + PA requirement + evidence
2. **get_prior_auth_criteria** - Structured diagnosis/step therapy/other requirements
3. **check_patient_readiness** - Criteria checklist for patient matching

All tools:
- Handle brand/generic/biosimilar drug names via Phase 1 alias normalization
- Return structured JSON with nested evidence fields
- Include source attribution (document, page, section)
- Return helpful errors with discovery hints (available payers/drugs)
- Work via Streamable HTTP transport (SSE + JSON)

Server architecture:
- Stateless per-request server instances
- In-memory policy store (5 policies loaded at startup)
- Express 5.2.1 + MCP SDK 1.29.0
- Health endpoint shows: status, tools, policies, payers, drugs

## Impact on Roadmap

**Phase 2 Complete:** All 3 core tools implemented. MCP server foundation solid.

**Phase 3 (FHIR Integration):**
- check_patient_readiness stub defines clear contract for matching logic
- Criteria checklist structure maps naturally to FHIR Condition/MedicationStatement resources
- Status field ready to change from "requires_patient_data" to "met"/"not_met"/"unverifiable"
- Evidence field provides policy quote for explanations

**Phase 5 (Prompt Opinion):**
- Complete tool surface area ready for integration
- LLM can discover and call all 3 tools based on semantic descriptions
- Structured JSON responses support programmatic consumption
- Tool workflow: get_drug_coverage → get_prior_auth_criteria → check_patient_readiness

**Phase 6 (Multi-plan Analysis):**
- check_patient_readiness can be extended to compare patient readiness across multiple payers
- Criteria checklist structure supports side-by-side comparison

## Success Criteria Met

✅ Complete MCP server with 3 tools accessible via Streamable HTTP transport on localhost:3000
✅ All tools return evidence-backed responses from Phase 1 policy data
✅ Tool descriptions enable correct LLM tool selection
✅ Drug alias resolution works across brand/generic/biosimilar names
✅ check_patient_readiness returns structured criteria checklist
✅ Server ready for Prompt Opinion integration in Phase 5

## Next Steps

**Phase 3:** FHIR patient context integration to populate patient_context parameter and return met/not_met/unverifiable status per criterion.

**Phase 5:** Prompt Opinion integration to expose MCP tools to UI and enable natural language prior auth queries.

## Self-Check: PASSED

**Created files exist:**
```
FOUND: src/mcp/tools/check_patient_readiness.ts
```

**Modified files exist:**
```
FOUND: src/mcp/index.ts (import added, tool registered, health endpoint updated)
```

**Commits exist:**
```
FOUND: 9d3648b (Task 1 - check_patient_readiness tool and complete 3-tool server)
```

**Verification:**
```bash
# Server starts and exposes 3 tools
npm start
# Logs: "PolicyPilot MCP server listening on port 3000", "Loaded 5 policies"

# Health endpoint
curl http://localhost:3000/health
# Returns: {"status":"ok","tools":3,"policies":5,"payers":["UHC","Aetna","Cigna"],"drugs":["adalimumab","etanercept","infliximab","upadacitinib"]}

# Tools list
curl -X POST http://localhost:3000/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
# Returns 3 tools: get_drug_coverage, get_prior_auth_criteria, check_patient_readiness

# Test readiness tool
curl -X POST http://localhost:3000/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"check_patient_readiness","arguments":{"plan":"Aetna","drug":"Rinvoq","patient_context":{}}}}'
# Returns: readiness_status "pending_patient_context", 11 criteria with status "requires_patient_data"
```
