# Requirements: PolicyLens MCP

**Defined:** 2026-04-11
**Core Value:** Every policy question answered must include source-backed evidence from loaded policy documents.

## v1 Requirements

Requirements for hackathon POC. Each maps to roadmap phases.

### Policy Data

- [ ] **DATA-01**: System loads and validates BCBS NC Preferred Injectable Oncology Program policy into normalized schema
- [ ] **DATA-02**: System loads and validates Cigna Rituximab IV Non-Oncology policy into normalized schema
- [ ] **DATA-03**: Each normalized policy includes: payer, policy title, effective date, drug family, preferred products, non-preferred products, prior auth required, step/fail-first logic, covered indications, notable restrictions
- [ ] **DATA-04**: Each extracted field has mapped evidence snippets from the source policy text
- [ ] **DATA-05**: Drug alias normalization resolves bevacizumab family names (Avastin, bevacizumab-awwb/Mvasi, bevacizumab-bvzr/Zirabev, etc.)
- [ ] **DATA-06**: Drug alias normalization resolves rituximab family names (Rituxan, rituximab-abbs/Truxima, rituximab-pvvr/Ruxience, etc.)

### MCP Tools

- [ ] **TOOL-01**: `list_policies` tool returns all loaded policies with metadata (payer, title, effective date, drug families covered)
- [ ] **TOOL-02**: `get_policy_summary` tool returns structured normalized summary for one policy including all DATA-03 fields with evidence
- [ ] **TOOL-03**: `compare_drug_across_payers` tool accepts drug_family input and returns side-by-side comparison across loaded payers
- [ ] **TOOL-04**: `ask_policy_question` tool accepts natural-language question and returns evidence-grounded answer using hybrid approach (deterministic first, LLM fallback)

### Response Quality

- [ ] **RESP-01**: Every tool response includes human-readable answer text
- [ ] **RESP-02**: Every tool response includes structured_result object with typed fields
- [ ] **RESP-03**: Every tool response includes evidence array with source text snippets
- [ ] **RESP-04**: Every tool response includes confidence level (HIGH/MEDIUM/LOW)
- [ ] **RESP-05**: System never answers without evidence — if information is unclear or missing, explicitly says so
- [ ] **RESP-06**: System does not hallucinate missing facts — deterministic lookup preferred over LLM generation

### Differentiators

- [ ] **DIFF-01**: Comparison tool identifies preferred vs non-preferred biosimilar products per payer (e.g., BCBS NC bevacizumab preferred/non-preferred split)
- [ ] **DIFF-02**: Summary and comparison tools extract step therapy / fail-first logic (e.g., Cigna rituximab step requirements)
- [ ] **DIFF-03**: Comparison tool highlights specific criteria differences between payers for the same drug family

### Deployment

- [ ] **DEPL-01**: MCP server deployable via ngrok as public URL
- [ ] **DEPL-02**: Prompt Opinion can connect to the MCP server and discover all registered tools
- [ ] **DEPL-03**: StreamableHTTP transport configured with stateless per-request server instances
- [ ] **DEPL-04**: CORS configured to allow Prompt Opinion cross-origin requests
- [ ] **DEPL-05**: Health endpoint returns server status with loaded policy/payer/drug counts

### Demo Scenarios

- [ ] **DEMO-01**: Bevacizumab cross-payer comparison works and shows BCBS NC preferred/non-preferred split
- [ ] **DEMO-02**: Rituximab Q&A works — "What prior authorization criteria does Cigna require for rituximab?" returns grounded answer
- [ ] **DEMO-03**: All 4 tools discoverable and callable from Prompt Opinion

## v2 Requirements

Deferred to post-hackathon.

### Additional Policies

- **DATA-V2-01**: Florida Blue bevacizumab policy loaded and normalized
- **DATA-V2-02**: Priority Health covered-alternative logic for Avastin
- **DATA-V2-03**: Support for 10+ policy documents

### Advanced Features

- **FEAT-V2-01**: Change tracking between policy versions
- **FEAT-V2-02**: Full patient-policy matching workflow with FHIR data
- **FEAT-V2-03**: Visual analytics / heat map of coverage across payers
- **FEAT-V2-04**: Knowledge graph of drug-payer-indication relationships

### Infrastructure

- **INFRA-V2-01**: Cloud deployment (beyond ngrok)
- **INFRA-V2-02**: User authentication
- **INFRA-V2-03**: Full web portal UI

## Out of Scope

| Feature | Reason |
|---------|--------|
| Universal PDF parser | Every payer formats differently; multi-month R&D effort beyond POC |
| Pharmacy benefit / formulary lookup | POC is medical benefit only — different data structures |
| Real-time policy update ingestion | Requires crawler infrastructure; static data sufficient for POC |
| ePA submission workflow | Complex regulatory domain beyond policy intelligence |
| Multi-indication coverage analysis | Exponential complexity; focus on primary indications in 2 docs |
| Appeal/exception guidance | Legal/regulatory domain beyond policy parsing |
| Full web portal | Prompt Opinion IS the product surface for this POC |
| Mobile app | Web-first, Prompt Opinion integration only |
| Production enterprise architecture | Hackathon pragmatism — in-memory, file-based, minimal infrastructure |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| DATA-05 | Phase 1 | Pending |
| DATA-06 | Phase 1 | Pending |
| TOOL-01 | Phase 2 | Pending |
| TOOL-02 | Phase 2 | Pending |
| TOOL-03 | Phase 2 | Pending |
| TOOL-04 | Phase 3 | Pending |
| RESP-01 | Phase 2 | Pending |
| RESP-02 | Phase 2 | Pending |
| RESP-03 | Phase 2 | Pending |
| RESP-04 | Phase 2 | Pending |
| RESP-05 | Phase 2 | Pending |
| RESP-06 | Phase 3 | Pending |
| DIFF-01 | Phase 2 | Pending |
| DIFF-02 | Phase 2 | Pending |
| DIFF-03 | Phase 2 | Pending |
| DEPL-01 | Phase 4 | Pending |
| DEPL-02 | Phase 4 | Pending |
| DEPL-03 | Phase 4 | Pending |
| DEPL-04 | Phase 4 | Pending |
| DEPL-05 | Phase 4 | Pending |
| DEMO-01 | Phase 4 | Pending |
| DEMO-02 | Phase 4 | Pending |
| DEMO-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-11*
*Last updated: 2026-04-11 after initial definition*
