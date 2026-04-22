# Roadmap: PolicyLens MCP

## Overview

PolicyLens MCP transforms medical-benefit drug policy PDFs into an intelligent MCP server that answers coverage questions with source-backed evidence. The journey starts with normalizing two policy documents (BCBS NC and Cigna) into structured data with evidence mappings, then builds four MCP tools on that foundation (list, summarize, compare, Q&A), and deploys via ngrok for Prompt Opinion integration. Each phase delivers a complete, verifiable capability that builds toward the core value: every policy question answered includes evidence from loaded policy documents.

v2.0 builds on the POC foundation (phases 1-4) to deliver a full portal: persistent file-based storage, real policy management, patient case workflows, coverage evaluation, insights, versioning, and expanded MCP tools — all deployed on Vercel + Railway.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

### v1.0 POC (Completed)

- [ ] **Phase 1: Policy Data Foundation** - Normalize BCBS NC and Cigna policies with evidence mappings and drug aliases
- [x] **Phase 2: Core MCP Tools** - Build deterministic tools (list, summary, compare) with evidence grounding (completed 2026-04-15)
- [x] **Phase 3: Hybrid Q&A Engine** - Build natural language Q&A tool with LLM fallback and validation (completed 2026-04-17)
- [x] **Phase 4: Deployment + Integration** - Deploy via ngrok and validate Prompt Opinion integration (completed 2026-04-18)

### v2.0 Full Product

- [ ] **Phase 5: File-Based Storage Foundation** - Establish the persistent file storage schema, index registry, and diff/versioning engine that all v2.0 features depend on
- [ ] **Phase 6: Policy Management + Ingestion** - Build the policy upload pipeline, structured rules editor, and Policy Rules / Detail pages
- [ ] **Phase 7: Policy Compare + Insights** - Deliver side-by-side comparison table with auto-diff highlights and the heat map / knowledge graph Insights page
- [ ] **Phase 8: Policy Changes + Versioning** - Ship the Changes timeline, Version Diff page, and materiality classification engine
- [ ] **Phase 9: Patient Cases + Coverage Evaluation** - Enable case creation, document upload, fact extraction, and coverage evaluation with evidence-backed checklist
- [ ] **Phase 10: Next Steps + Evidence Explorer + Chat** - Complete the clinic workflow with next-step guidance, evidence search, and evidence-backed chat
- [ ] **Phase 11: Expanded MCP Tools** - Implement 10 new MCP tools backed by the data layer and engines built in phases 5-10
- [ ] **Phase 12: Portal UI + Dashboard + Deployment** - Ship the dashboard, role switcher, global nav, and deploy to Vercel + Railway

## Phase Details

### Phase 1: Policy Data Foundation

**Goal**: BCBS NC and Cigna policies normalized into structured, evidence-backed data that enables all downstream tools

**Depends on**: Nothing (first phase)

**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06

**Success Criteria** (what must be TRUE):

1. BCBS NC Preferred Injectable Oncology Program loaded with normalized fields (payer, title, date, drug family, preferred/non-preferred products, prior auth, step therapy, indications, restrictions)
2. Cigna Rituximab IV Non-Oncology policy loaded with same normalized schema
3. Every extracted field has mapped evidence snippets (1-3 sentences) from source policy text
4. Drug alias lookup resolves bevacizumab family (Avastin, bevacizumab-awwb/Mvasi, bevacizumab-bvzr/Zirabev) and rituximab family (Rituxan, rituximab-abbs/Truxima, rituximab-pvvr/Ruxience) to canonical names
5. Normalized data validates against Zod schema without errors

**Plans:** 2 plans

Plans:

- [ ] 01-01-PLAN.md — Extend schema with oncology fields + add drug alias families + migrate RA policies
- [ ] 01-02-PLAN.md — Extract BCBS NC + Cigna policies into structured JSON with evidence + update index

### Phase 2: Core MCP Tools

**Goal**: Deterministic MCP tools deliver policy intelligence with evidence grounding and structured responses

**Depends on**: Phase 1

**Requirements**: TOOL-01, TOOL-02, TOOL-03, RESP-01, RESP-02, RESP-03, RESP-04, RESP-05, DIFF-01, DIFF-02, DIFF-03

**Success Criteria** (what must be TRUE):

1. list_policies tool returns all loaded policies with metadata (payer, title, effective date, drug families)
2. get_policy_summary tool returns structured summary for one policy with all normalized fields plus evidence
3. compare_drug_across_payers tool accepts drug_family input and returns side-by-side comparison showing preferred/non-preferred splits and criteria differences
4. All three tools return responses with: human-readable answer + structured_result object + evidence array + confidence level (HIGH for deterministic lookups)
5. Bevacizumab comparison identifies BCBS NC preferred vs non-preferred product split
6. Rituximab summary extracts Cigna step therapy and prior auth requirements

**Plans**: 2 plans

Plans:

- [x] 02-01-PLAN.md — Shared response/evidence infrastructure + list_policies tool
- [x] 02-02-PLAN.md — get_policy_summary + compare_drug_across_payers tools + MCP registration

### Phase 3: Hybrid Q&A Engine

**Goal**: Natural language policy questions answered with evidence grounding via hybrid deterministic + LLM routing

**Depends on**: Phase 2

**Requirements**: TOOL-04, RESP-06

**Success Criteria** (what must be TRUE):

1. ask_policy_question tool accepts natural language questions about loaded policies
2. Query router tries deterministic lookup first (from Phase 2 patterns), falls back to LLM only for complex questions
3. LLM responses validated against evidence index (every claim must map to policy text)
4. Tool returns "insufficient evidence" for questions that can't be grounded in loaded policy data
5. Question "What prior authorization criteria does Cigna require for rituximab?" returns grounded answer with evidence snippets

**Plans**: 2 plans

Plans:

- [x] 03-01-PLAN.md — Entity extraction, query routing, and evidence retrieval utilities
- [x] 03-02-PLAN.md — LLM client, claim validator, ask_policy_question tool, and MCP registration

### Phase 4: Deployment + Integration

**Goal**: MCP server publicly accessible via ngrok and fully integrated with Prompt Opinion

**Depends on**: Phase 3

**Requirements**: DEPL-01, DEPL-02, DEPL-03, DEPL-04, DEPL-05, DEMO-01, DEMO-02, DEMO-03

**Success Criteria** (what must be TRUE):

1. MCP server running with ngrok tunnel providing public HTTPS URL
2. Prompt Opinion connects to server and discovers all 7 tools
3. All 7 tools callable from Prompt Opinion with correct StreamableHTTP transport and CORS headers
4. Health endpoint accessible and returns accurate policy/payer/drug counts
5. Demo scenario works: bevacizumab cross-payer comparison shows BCBS NC preferred/non-preferred distinction
6. Demo scenario works: rituximab Q&A from Prompt Opinion returns evidence-backed answer about Cigna prior auth criteria

**Plans**: 2 plans

Plans:

- [x] 04-01-PLAN.md — Update smoke test for all 7 tools + create ngrok deployment script
- [x] 04-02-PLAN.md — Update deployment/integration docs + verify end-to-end Prompt Opinion integration

---

### Phase 5: File-Based Storage Foundation

**Goal**: All v2.0 features have a reliable, versioned file storage layer — policies, patients, and evaluations persist across server restarts with diff tracking

**Depends on**: Phase 4

**Requirements**: STOR-01, STOR-02, STOR-03, STOR-04, STOR-05, STOR-06

**Success Criteria** (what must be TRUE):

1. A normalized policy JSON file saved to `data/policies/structured/` survives a server restart and is reloaded on startup
2. `data/policies/index.json` lists every loaded policy with payer, title, drug family, version list, and current version pointer — and updates automatically when a policy is added or changed
3. Uploading a modified version of an existing policy creates a new versioned JSON file and a diff record capturing what fields changed
4. A patient case folder exists at `data/patients/{case-id}/` with its documents and extracted facts readable as JSON
5. A saved coverage evaluation is retrievable by ID from `data/evaluations/{eval-id}.json`

**Plans**: 4 plans

Plans:

- [ ] 05-01-PLAN.md — Storage types + directory scaffold (src/storage/types.ts, paths.ts, .gitignore)
- [ ] 05-02-PLAN.md — Policy file store + diff engine (src/storage/policy-store.ts)
- [ ] 05-03-PLAN.md — Patient case + evaluation stores (src/storage/patient-store.ts, evaluation-store.ts)
- [ ] 05-04-PLAN.md — Startup disk scan + index rebuild wired into server

---

### Phase 6: Policy Management + Ingestion

**Goal**: Users can upload, parse, view, and edit policies through the portal — the full policy lifecycle from PDF to structured rules is operational

**Depends on**: Phase 5

**Requirements**: PLCY-01, PLCY-02, PLCY-03, PLCY-04, PLCY-05, PLCY-06, PLCY-07

**Success Criteria** (what must be TRUE):

1. User uploads a PDF policy file and within seconds sees a parsed structured record appear in the Policy Rules page list
2. Policy Rules page shows all loaded policies with filters for payer, drug family, and status — selecting a filter narrows the list
3. Clicking a policy opens its Detail page with tabs for Overview, Products, Indications, Criteria, Evidence, and Versions — each tab shows relevant content
4. Structured Rules Editor displays each policy field with its extracted value, the evidence snippet it came from, and an ambiguity flag — user can edit a field, mark it ambiguous, and save a new version
5. Version history tab shows every saved version with date and who changed it — user can select any past version to view its content

**Plans**: TBD

---

### Phase 7: Policy Compare + Insights

**Goal**: Users can compare coverage across payers and spot patterns through a heat map and knowledge graph — every data point traces back to source evidence

**Depends on**: Phase 6

**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04, INSG-01, INSG-02, INSG-03, INSG-04

**Success Criteria** (what must be TRUE):

1. User selects a drug family and two or more payers and sees a side-by-side comparison table with preferred products, non-preferred products, prior auth, step therapy, covered indications, and key restrictions in one column per payer
2. Auto-generated difference highlights appear above the table calling out meaningful differences (e.g., "Cigna requires fail/intolerance; BCBS NC does not")
3. Clicking any comparison cell opens the source evidence snippet with page number
4. Policy Insights page shows a heat map grid of payer × rule type × coverage status — green/yellow/red cells are filterable by drug family, payer, rule type, and version
5. Clicking a heat map cell opens an evidence panel showing the source snippet and page reference
6. A knowledge graph shows drug → payer → policy → rule relationships as a static/simple visual

**Plans**: TBD

---

### Phase 8: Policy Changes + Versioning

**Goal**: Users can track exactly how policies have changed over time and understand which changes have clinical or operational impact

**Depends on**: Phase 6

**Requirements**: CHNG-01, CHNG-02, CHNG-03, CHNG-04

**Success Criteria** (what must be TRUE):

1. Policy Changes page shows a timeline of all policy uploads and updates sorted by date
2. Change table shows policy name, field changed, old value, new value, and severity label (cosmetic / operational / clinical) for each detected change
3. User opens the Version Diff page for two versions of a policy and sees structured field-level changes alongside a raw text diff — both views on the same screen
4. System has classified each diff: formatting changes are labeled cosmetic, wording changes are labeled operational, and changes to PA criteria, step therapy, or product tier are labeled clinical

**Plans**: TBD

---

### Phase 9: Patient Cases + Coverage Evaluation

**Goal**: Clinic staff can create a patient case, upload documents, extract facts, and run a coverage evaluation that shows exactly which criteria are met, missing, or ambiguous

**Depends on**: Phase 5, Phase 6

**Requirements**: PATC-01, PATC-02, PATC-03, PATC-04, PATC-05, EVAL-01, EVAL-02, EVAL-03, EVAL-04, EVAL-05

**Success Criteria** (what must be TRUE):

1. User creates a new patient case with payer, requested drug, diagnosis, and synthetic patient name — case appears in the Patient Cases list with status "missing docs"
2. User uploads a clinical note or prior treatment history file to a case and the system extracts structured facts: diagnosis, requested drug, prior therapies, prescriber type, insurance info
3. Extracted facts are displayed on the Case Detail page alongside the source document text that each fact came from
4. User triggers a coverage evaluation — result shows one of: Covered / PA Required / Likely Eligible but Docs Missing / Not Covered / Preferred Alternative Required / Unclear
5. Evaluation displays a requirement checklist with each policy criterion labeled PASS / MISSING / UNKNOWN / NEEDS REVIEW — each item links to the matched patient fact and the source policy evidence snippet
6. Completed evaluation is saved and still viewable by case ID after a page refresh

**Plans**: TBD

---

### Phase 10: Next Steps + Evidence Explorer + Chat

**Goal**: The clinic workflow is complete — staff get actionable guidance after evaluation, evidence is searchable across all policies, and natural language questions return evidence-backed answers

**Depends on**: Phase 9

**Requirements**: NEXT-01, NEXT-02, NEXT-03, NEXT-04, EVID-01, EVID-02, EVID-03, CHAT-01, CHAT-02, CHAT-03

**Success Criteria** (what must be TRUE):

1. After a coverage evaluation, clinic staff see an ordered list of recommended next steps and a checkbox list of missing documentation items
2. The same evaluation page offers a patient-friendly plain-language explanation of coverage status and what the clinic needs to do
3. A payer analyst explanation view shows which policy criteria apply and what evidence is needed to satisfy them
4. Evidence Explorer page accepts a keyword search and returns matching snippets showing source policy, page number, section heading, snippet text, and linked policy fields
5. Clicking an Evidence Explorer result opens the full Policy Detail page scrolled to that evidence item
6. Chat page accepts a natural-language question and returns an answer with inline citations (policy name, page, section) — the sidebar shows the evidence snippets cited

**Plans**: TBD

---

### Phase 11: Expanded MCP Tools

**Goal**: All 10 new MCP tools are operational and expose every portal capability — upload, parse, version, diff, evidence search, fact extraction, evaluation, next steps, and case summary — to Prompt Opinion

**Depends on**: Phase 10

**Requirements**: MCP-01, MCP-02, MCP-03, MCP-04, MCP-05, MCP-06, MCP-07, MCP-08, MCP-09, MCP-10

**Success Criteria** (what must be TRUE):

1. `upload_policy_document` and `parse_policy_document` tools accept a file path or URL and the parsed structured record appears in the data store
2. `list_policy_versions` and `diff_policy_versions` tools return version metadata and structured field-level diffs for any policy
3. `get_policy_evidence` and `search_policy_rules` tools return grounded evidence snippets — every result includes policy name, page, and section
4. `extract_patient_facts` tool processes a patient document and returns structured facts (diagnosis, drug, prior therapies, prescriber, insurance)
5. `evaluate_patient_against_policy` tool returns coverage status and a full requirement checklist with PASS/MISSING/UNKNOWN labels and evidence links
6. `generate_next_steps` and `get_case_summary` tools return role-specific guidance and full case summary callable from Prompt Opinion

**Plans**: TBD

---

### Phase 12: Portal UI + Dashboard + Deployment

**Goal**: The portal looks and feels like a coherent product — dashboard, role switcher, and global nav are in place — and the full stack is deployed on Vercel + Railway

**Depends on**: Phase 11

**Requirements**: UI-01, UI-02, UI-03

**Success Criteria** (what must be TRUE):

1. Dashboard page loads with KPI cards showing live counts: policies loaded, active cases, PA required, missing docs, recent changes — and quick-action buttons per role
2. Role switcher (Clinic Staff / Payer Analyst / Patient) changes the dashboard layout and case detail content to match the selected role
3. Global navigation links to all eight sections: Dashboard, Policy Rules, Policy Compare, Policy Insights, Policy Changes, Patients, Evidence Explorer, Chat
4. Frontend is served from a Vercel URL and backend API is reachable from a Railway URL — all existing ngrok smoke tests pass against the new deployment

**Plans**: TBD

## Progress

**Execution Order:**
v1.0: Phases 1 → 2 → 3 → 4
v2.0: Phases 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Policy Data Foundation | 0/2 | Planned | - |
| 2. Core MCP Tools | 2/2 | Complete | 2026-04-15 |
| 3. Hybrid Q&A Engine | 2/2 | Complete | 2026-04-17 |
| 4. Deployment + Integration | 2/2 | Complete | 2026-04-18 |
| 5. File-Based Storage Foundation | 0/4 | Not started | - |
| 6. Policy Management + Ingestion | 0/TBD | Not started | - |
| 7. Policy Compare + Insights | 0/TBD | Not started | - |
| 8. Policy Changes + Versioning | 0/TBD | Not started | - |
| 9. Patient Cases + Coverage Evaluation | 0/TBD | Not started | - |
| 10. Next Steps + Evidence Explorer + Chat | 0/TBD | Not started | - |
| 11. Expanded MCP Tools | 0/TBD | Not started | - |
| 12. Portal UI + Dashboard + Deployment | 0/TBD | Not started | - |
