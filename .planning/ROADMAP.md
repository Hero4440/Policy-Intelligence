# Roadmap: PolicyPilot

## Milestones

- ✅ **v1.0 POC** — Phases 1-5 (shipped 2026-04-22)
- 🚧 **v2.0 Full Product** — Phases 6-12 (in progress)

## Phases

<details>
<summary>✅ v1.0 POC (Phases 1-5) — SHIPPED 2026-04-22</summary>

- [x] Phase 1: Policy Data Foundation (2/2 plans) — completed 2026-04-12
- [x] Phase 2: Core MCP Tools (2/2 plans) — completed 2026-04-15
- [x] Phase 3: Hybrid Q&A Engine (2/2 plans) — completed 2026-04-17
- [x] Phase 4: Deployment + Integration (2/2 plans) — completed 2026-04-18
- [x] Phase 5: File-Based Storage Foundation (4/4 plans) — completed 2026-04-22

See: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v2.0 Full Product (Phases 6-12)

- [ ] **Phase 6: Policy Management + Ingestion** — Build the policy upload pipeline, structured rules editor, and Policy Rules / Detail pages
- [ ] **Phase 7: Policy Compare + Insights** — Deliver side-by-side comparison table with auto-diff highlights and the heat map / knowledge graph Insights page
- [ ] **Phase 8: Policy Changes + Versioning** — Ship the Changes timeline, Version Diff page, and materiality classification engine
- [ ] **Phase 9: Patient Cases + Coverage Evaluation** — Enable case creation, document upload, fact extraction, and coverage evaluation with evidence-backed checklist
- [ ] **Phase 10: Next Steps + Evidence Explorer + Chat** — Complete the clinic workflow with next-step guidance, evidence search, and evidence-backed chat
- [ ] **Phase 11: Expanded MCP Tools** — Implement 10 new MCP tools backed by the data layer and engines built in phases 6-10
- [ ] **Phase 12: Portal UI + Dashboard + Deployment** — Ship the dashboard, role switcher, global nav, and deploy to Vercel + Railway

## Phase Details

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

**Plans:** 5 plans

Plans:
- [ ] 06-01-PLAN.md — PDF ingestion API: parsePdfToPolicy + POST /api/policies/upload + GET /api/policies
- [ ] 06-02-PLAN.md — Policy Rules page with payer/drug family filters + policies API client
- [ ] 06-03-PLAN.md — Policy Detail page with 6 tabs (Overview, Products, Indications, Criteria, Evidence, Versions)
- [ ] 06-04-PLAN.md — Structured Rules Editor UI + POST /api/policies/:id/versions endpoint
- [ ] 06-05-PLAN.md — PDF upload UI panel + App.tsx nav wiring + end-to-end human verification

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

**Plans:** 5 plans

Plans:
- [ ] 07-01-PLAN.md — v2 compare domain + compare API endpoints + frontend data client
- [ ] 07-02-PLAN.md — Policy Compare page UI + shared evidence panel + App nav wiring
- [ ] 07-03-PLAN.md — Deterministic difference highlights above the compare table
- [ ] 07-04-PLAN.md — Policy Insights API + filterable heat map + evidence panel drill-in
- [ ] 07-05-PLAN.md — Knowledge graph + end-to-end human verification

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

**Plans**: 4 plans

Plans:
- [ ] 08-01-PLAN.md — Classified change-history engine + timeline/change API routes
- [ ] 08-02-PLAN.md — Policy Changes page UI + nav wiring + change table filters
- [ ] 08-03-PLAN.md — Version Diff backend + per-version text snapshots + diff API route
- [ ] 08-04-PLAN.md — Version Diff page UI + end-to-end human verification

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

**Plans**: 5 plans

Plans:
- [ ] 09-01-PLAN.md — Patient case intake backend + patient/document route hardening
- [ ] 09-02-PLAN.md — Deterministic fact extraction + evidence-backed case detail payloads
- [ ] 09-03-PLAN.md — Coverage evaluation engine + saved evaluation API routes
- [ ] 09-04-PLAN.md — Patients page UI for intake, extracted facts, policy selection, and evaluation results
- [ ] 09-05-PLAN.md — End-to-end human verification

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

**Plans:** 5 plans

Plans:
- [ ] 10-01-PLAN.md — Next-steps domain module + GET /api/patients/evaluations/:evalId/next-steps route
- [ ] 10-02-PLAN.md — Next Steps tab in patient case detail view (clinic, patient, analyst sub-sections)
- [ ] 10-03-PLAN.md — Evidence search domain module + GET /api/evidence/search route
- [ ] 10-04-PLAN.md — Evidence Explorer page UI + fetchEvidenceSearch client + App.tsx nav wiring
- [ ] 10-05-PLAN.md — Chat API (POST /api/chat/policy-qa) + Chat page UI + evidence sidebar + App.tsx nav wiring

---

### Phase 11: Expanded MCP Tools

**Goal**: All 10 new MCP tools are operational and expose every portal capability to Prompt Opinion

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

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Policy Data Foundation | v1.0 | 2/2 | Complete | 2026-04-12 |
| 2. Core MCP Tools | v1.0 | 2/2 | Complete | 2026-04-15 |
| 3. Hybrid Q&A Engine | v1.0 | 2/2 | Complete | 2026-04-17 |
| 4. Deployment + Integration | v1.0 | 2/2 | Complete | 2026-04-18 |
| 5. File-Based Storage Foundation | v1.0 | 4/4 | Complete | 2026-04-22 |
| 6. Policy Management + Ingestion | v2.0 | 0/5 | Planned | - |
| 7. Policy Compare + Insights | v2.0 | 0/5 | Not started | - |
| 8. Policy Changes + Versioning | v2.0 | 0/4 | Not started | - |
| 9. Patient Cases + Coverage Evaluation | v2.0 | 0/5 | Not started | - |
| 10. Next Steps + Evidence Explorer + Chat | v2.0 | 0/5 | Planned | - |
| 11. Expanded MCP Tools | v2.0 | 0/TBD | Not started | - |
| 12. Portal UI + Dashboard + Deployment | v2.0 | 0/TBD | Not started | - |
