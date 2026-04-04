# Roadmap: PolicyPilot

## Overview

PolicyPilot delivers prior authorization readiness intelligence through a 6-phase build: extract real payer policy data into structured JSON, implement 3 MCP tools (drug coverage, PA criteria, patient readiness), integrate FHIR patient context via SHARP specs, set up demo patients in Prompt Opinion, deploy the MCP server and register it in Prompt Opinion, and create a polished demo video showing the complete workflow. Each phase delivers a verifiable capability, building from data foundation through integration to demo-ready state. The critical path starts with policy data extraction — data quality underpins everything downstream.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Policy Data Foundation** - Extract and structure real payer policy data from public PDFs
- [ ] **Phase 2: MCP Server Core** - Implement 3 MCP tools with coverage and criteria lookup
- [ ] **Phase 3: Patient Context Integration** - Add FHIR context handling and readiness analysis
- [ ] **Phase 4: Patient Data Setup** - Create synthetic demo patients in Prompt Opinion
- [ ] **Phase 5: Deployment & Integration** - Deploy MCP server and integrate with Prompt Opinion platform
- [ ] **Phase 6: Demo Preparation** - Create demo video and validate complete workflow

## Phase Details

### Phase 1: Policy Data Foundation
**Goal**: Real payer policy data extracted and available for tool queries
**Depends on**: Nothing (first phase)
**Requirements**: POL-01, POL-02, POL-03, POL-04
**Success Criteria** (what must be TRUE):
  1. Policy JSON store contains extracted data from 3-5 public payer PDFs (UHC, Aetna, Cigna)
  2. Policy records include all required fields: payer, plan, drug, indication, coverage status, PA requirements, diagnosis criteria, prior therapy requirements, evidence text, source document
  3. Policy data uses real policy language from actual payer documents (not fabricated text)
  4. Policy data covers one therapeutic area (rheumatoid arthritis biologics) with sufficient depth for demo scenarios
  5. Policy JSON schema is well-defined and supports drug name aliasing (brand/generic)
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 2: MCP Server Core
**Goal**: MCP server exposes functional coverage and criteria lookup tools
**Depends on**: Phase 1
**Requirements**: MCP-01, MCP-02, MCP-03, MCP-04, MCP-06, COV-01, COV-02, COV-03, COV-04
**Success Criteria** (what must be TRUE):
  1. MCP server exposes `get_drug_coverage` tool that returns coverage status, source policy, and evidence text
  2. MCP server exposes `get_prior_auth_criteria` tool that returns structured criteria (diagnosis, step therapy, quantity limits, restrictions) with evidence
  3. MCP server exposes `check_patient_readiness` tool stub (accepts parameters but patient context integration comes in Phase 3)
  4. MCP server uses Streamable HTTP transport compatible with Prompt Opinion
  5. All tool descriptions are clear and detailed enough for Prompt Opinion's agent to decide when and how to call them
  6. Both coverage and criteria tools handle brand/generic drug name aliases correctly
  7. Tools return evidence text (quoted policy language) supporting determinations
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 3: Patient Context Integration
**Goal**: MCP server can accept FHIR patient context and perform readiness analysis
**Depends on**: Phase 2
**Requirements**: MCP-05, RDY-01, RDY-02, RDY-03, RDY-04
**Success Criteria** (what must be TRUE):
  1. MCP server accepts FHIR context token via SHARP extension specs from Prompt Opinion
  2. `check_patient_readiness` tool can retrieve patient FHIR data using SHARP token from Prompt Opinion's FHIR server
  3. Tool compares patient clinical context against policy criteria and returns structured results: matched requirements, missing requirements, documentation needed
  4. All readiness outputs use cautious clinical language ("may be missing", "appears to match", "documentation may be needed")
  5. FHIR parser extracts relevant patient data (diagnoses, medications, labs, payer info) from FHIR bundles correctly
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 4: Patient Data Setup
**Goal**: Demo patients loaded in Prompt Opinion with controlled coverage scenarios
**Depends on**: Phase 3
**Requirements**: PAT-01, PAT-02, PAT-03
**Success Criteria** (what must be TRUE):
  1. At least 3 synthetic demo patients loaded into Prompt Opinion workspace
  2. Demo patients represent controlled scenarios: full criteria match, partial match with gaps, poor match with major gaps
  3. Each demo patient has relevant FHIR data: RA diagnosis codes, medication history, lab results, payer information
  4. Patients are accessible via Prompt Opinion's patient selector in the chat interface
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 5: Deployment & Integration
**Goal**: MCP server deployed and functional within Prompt Opinion workspace
**Depends on**: Phase 4
**Requirements**: DEP-01, DEP-02, DEP-03, DEP-04, DEP-05
**Success Criteria** (what must be TRUE):
  1. MCP server deployed and accessible via public URL (ngrok or cloud hosting)
  2. MCP server registered in Prompt Opinion workspace hub as MCP connection
  3. SHARP FHIR context enabled on the MCP connection in Prompt Opinion
  4. PolicyPilot agent configured in Prompt Opinion with all 3 MCP tools attached
  5. Solution published to Prompt Opinion Marketplace for judge discovery
  6. End-to-end test: user can select patient, ask coverage question, and receive grounded answer with policy citations
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 6: Demo Preparation
**Goal**: Polished demo video showing complete PolicyPilot workflow
**Depends on**: Phase 5
**Requirements**: DEM-01, DEM-02, DEM-03
**Success Criteria** (what must be TRUE):
  1. Demo video recorded (under 3 minutes) showing PolicyPilot functioning within Prompt Opinion
  2. Demo covers complete workflow: open patient, ask coverage question, ask criteria question, ask readiness question
  3. Demo shows MCP tool calls visible in Prompt Opinion's tool trace view
  4. Demo script validated with all 3 demo patients to ensure smooth execution
  5. Edge cases handled gracefully (unknown drug, missing patient data, ambiguous queries)
**Plans**: TBD

Plans:
- [ ] TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Policy Data Foundation | 0/TBD | Not started | - |
| 2. MCP Server Core | 0/TBD | Not started | - |
| 3. Patient Context Integration | 0/TBD | Not started | - |
| 4. Patient Data Setup | 0/TBD | Not started | - |
| 5. Deployment & Integration | 0/TBD | Not started | - |
| 6. Demo Preparation | 0/TBD | Not started | - |
