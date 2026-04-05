# Requirements: PolicyPilot

**Defined:** 2026-04-04
**Core Value:** A prior auth specialist can ask a natural language question about a patient's drug coverage and get a grounded, evidence-cited answer in seconds — powered by an MCP server integrated into the Prompt Opinion platform.

## Platform Context

PolicyPilot is an **MCP server** that integrates into the **Prompt Opinion** healthcare agent platform. Prompt Opinion provides:
- Chat UI / workspace / launchpad (we do NOT build a UI)
- Agent orchestration (LLM decides when to call our MCP tools)
- FHIR patient context via SHARP extension specs (passed to our tools)
- Patient data management (synthetic patients loaded in platform)
- Marketplace publishing and discovery

**We build:** MCP server + policy data store + demo patient setup in Prompt Opinion.

**Inserted hackathon track exception:** For the Anton Rx track, we also build a browser-based demo frontend that presents the normalized policy data in a Prompt Opinion-inspired workspace shell. This frontend is a track-specific demo surface, not a replacement for the Prompt Opinion integration path.

## v1 Requirements

Requirements for hackathon release. Each maps to roadmap phases.

### MCP Server

- [ ] **MCP-01**: MCP server exposes `get_drug_coverage(plan, drug)` tool returning coverage status, source policy, and evidence text
- [ ] **MCP-02**: MCP server exposes `get_prior_auth_criteria(plan, drug)` tool returning diagnosis requirement, prior therapy requirement, other restrictions, and evidence snippet
- [ ] **MCP-03**: MCP server exposes `check_patient_readiness(plan, drug, patient_context)` tool returning matched requirements, missing requirements, and likely missing documentation
- [ ] **MCP-04**: MCP server uses Streamable HTTP transport (compatible with Prompt Opinion)
- [ ] **MCP-05**: MCP server accepts FHIR context token via SHARP extension specs to retrieve patient data from Prompt Opinion's FHIR server
- [ ] **MCP-06**: Tool descriptions are clear and detailed so Prompt Opinion's agent can correctly decide when and how to call each tool

### Coverage & Lookup

- [ ] **COV-01**: `get_drug_coverage` returns coverage status (covered, not covered, covered with PA) with source policy reference
- [ ] **COV-02**: `get_prior_auth_criteria` returns structured criteria: diagnosis requirements, step therapy requirements, quantity limits, and other restrictions
- [ ] **COV-03**: Both tools return evidence text — quoted policy language supporting the determination
- [ ] **COV-04**: Tools handle both brand and generic drug names (Humira = adalimumab) via alias matching

### Patient Readiness

- [ ] **RDY-01**: `check_patient_readiness` accepts patient clinical context (from FHIR via Prompt Opinion) and compares against policy criteria
- [ ] **RDY-02**: Tool returns structured result: matched requirements, missing requirements, documentation needed
- [ ] **RDY-03**: All readiness outputs use cautious clinical language ("may be missing", "appears to match", "documentation may be needed")
- [ ] **RDY-04**: Tool can retrieve patient FHIR data using the SHARP token passed by Prompt Opinion

### Policy Data

- [ ] **POL-01**: Policy rules store contains real extracted data from 3-5 public payer PDFs (UHC, Aetna, Cigna)
- [ ] **POL-02**: Policy data covers one therapeutic area (rheumatoid arthritis biologics)
- [ ] **POL-03**: Policy records include: payer, plan, drug, indication, coverage status, PA required, diagnosis requirement, prior therapy requirement, other requirements, evidence text, source document
- [ ] **POL-04**: Policy data uses real policy language extracted from actual payer documents (not fabricated)

### Patient Data (in Prompt Opinion)

- [ ] **PAT-01**: Synthetic patients loaded into Prompt Opinion workspace (via import or manual creation)
- [ ] **PAT-02**: At least 3 demo patients with controlled scenarios: full criteria match, partial match (gaps), poor match (major gaps)
- [ ] **PAT-03**: Demo patients have relevant FHIR data: RA diagnosis codes, medication history, lab results, payer info

### Deployment & Integration

- [ ] **DEP-01**: MCP server deployed and accessible via public URL (ngrok for dev, cloud hosting for demo)
- [ ] **DEP-02**: MCP server registered in Prompt Opinion workspace hub as MCP connection
- [ ] **DEP-03**: SHARP FHIR context enabled on the MCP connection in Prompt Opinion
- [ ] **DEP-04**: PolicyPilot agent configured in Prompt Opinion with MCP tools attached
- [ ] **DEP-05**: Solution published to Prompt Opinion Marketplace for judge discovery

### Demo

- [ ] **DEM-01**: Demo video (under 3 minutes) showing PolicyPilot functioning within Prompt Opinion
- [ ] **DEM-02**: Demo covers: open patient → ask coverage question → ask criteria question → ask readiness question
- [ ] **DEM-03**: Demo shows MCP tool calls visible in Prompt Opinion's tool trace view

### Anton Rx Demo Frontend

- [ ] **UI-01**: A local browser frontend presents searchable medical-benefit drug policy coverage using the normalized policy dataset
- [ ] **UI-02**: Users can answer "Which plans cover Drug X?" through filters or search results
- [ ] **UI-03**: Users can answer "What prior auth criteria does Plan Y require for Drug Z?" in a structured detail view with source evidence
- [ ] **UI-04**: Users can compare at least two payer policies side-by-side for a selected drug
- [ ] **UI-05**: The frontend includes an honest policy-change view or clearly labeled placeholder that supports the Anton Rx quarterly-change narrative

## v2 Requirements

Deferred to post-hackathon.

### Submission Workflow

- **SUB-01**: Generate pre-populated PA request forms from readiness analysis
- **SUB-02**: Electronic PA submission via payer APIs

### Intelligence Layer

- **INT-01**: Predict PA approval likelihood
- **INT-02**: Suggest therapeutic alternatives
- **INT-03**: Auto-gather supporting EHR documents

### Scale

- **SCL-01**: Multiple therapeutic areas
- **SCL-02**: Multi-payer comparison
- **SCL-03**: Real-time policy updates

### A2A Agent

- **A2A-01**: Expose PolicyPilot as A2A agent (not just MCP tools)
- **A2A-02**: Enable agent-to-agent collaboration with other Prompt Opinion agents

## Out of Scope

| Feature | Reason |
|---------|--------|
| Custom chat UI (Streamlit/React) | Prompt Opinion provides the UI; building our own duplicates effort except for the Anton Rx track-specific demo frontend |
| Live user PDF upload | Curated dataset; parsing errors catastrophic in demo |
| Admin dashboard | Team edits JSON directly; no demo value |
| Multi-agent system | Single MCP server with 3 tools sufficient |
| Vector database | 3-5 policies, structured JSON lookup sufficient |
| Policy change tracking | Static dataset for hackathon |
| Full payer comparison | Depth over breadth |
| Production security | Demo-grade; Prompt Opinion handles auth |
| Multiple therapeutic areas | One domain done well |
| Real patient data | Synthetic only; compliance |
| Own LLM integration | Prompt Opinion handles agent/LLM orchestration |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| POL-01 | Phase 1 | Pending |
| POL-02 | Phase 1 | Pending |
| POL-03 | Phase 1 | Pending |
| POL-04 | Phase 1 | Pending |
| MCP-01 | Phase 2 | Pending |
| MCP-02 | Phase 2 | Pending |
| MCP-03 | Phase 2 | Pending |
| MCP-04 | Phase 2 | Pending |
| MCP-06 | Phase 2 | Pending |
| COV-01 | Phase 2 | Pending |
| COV-02 | Phase 2 | Pending |
| COV-03 | Phase 2 | Pending |
| COV-04 | Phase 2 | Pending |
| MCP-05 | Phase 3 | Pending |
| RDY-01 | Phase 3 | Pending |
| RDY-02 | Phase 3 | Pending |
| RDY-03 | Phase 3 | Pending |
| RDY-04 | Phase 3 | Pending |
| PAT-01 | Phase 4 | Pending |
| PAT-02 | Phase 4 | Pending |
| PAT-03 | Phase 4 | Pending |
| DEP-01 | Phase 5 | Pending |
| DEP-02 | Phase 5 | Pending |
| DEP-03 | Phase 5 | Pending |
| DEP-04 | Phase 5 | Pending |
| DEP-05 | Phase 5 | Pending |
| UI-01 | Phase 5.1 | Pending |
| UI-02 | Phase 5.1 | Pending |
| UI-03 | Phase 5.1 | Pending |
| UI-04 | Phase 5.1 | Pending |
| UI-05 | Phase 5.1 | Pending |
| DEM-01 | Phase 6 | Pending |
| DEM-02 | Phase 6 | Pending |
| DEM-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-04 — Traceability updated after roadmap creation*
