# Requirements: PolicyPilot v2.0

**Defined:** 2026-04-21
**Core Value:** Every policy question answered must include source-backed evidence — and every coverage evaluation must show exactly which criteria are met, missing, or ambiguous.

## v2.0 Requirements

Requirements for the full product milestone. Each maps to a roadmap phase.

### Storage & Data Layer

- [ ] **STOR-01**: System stores normalized policy JSON files in `data/policies/structured/` with one file per policy version
- [ ] **STOR-02**: System maintains `data/policies/index.json` registry tracking all policies with metadata (payer, title, drug family, versions, current version pointer)
- [ ] **STOR-03**: System stores raw uploaded PDFs in `data/policies/raw/`
- [ ] **STOR-04**: System stores patient case folders in `data/patients/{case-id}/` with documents and extracted facts as JSON
- [ ] **STOR-05**: System stores coverage evaluation results as `data/evaluations/{eval-id}.json`
- [ ] **STOR-06**: System computes structured hash on normalized policy JSON and creates a diff record when a policy is re-uploaded with changes

### Policy Management

- [ ] **PLCY-01**: User can upload a PDF policy document via the portal and trigger parsing
- [ ] **PLCY-02**: System extracts text from PDF and normalizes it into a structured PolicyRecord JSON (payer, title, drug family, products, prior auth, step therapy, indications, restrictions, evidence snippets)
- [ ] **PLCY-03**: User can view the Policy Rules page listing all loaded policies with filters by payer, drug family, and status
- [ ] **PLCY-04**: User can view a Policy Detail page with tabs: Overview, Products, Indications, Criteria, Evidence, Versions
- [ ] **PLCY-05**: User can view a Structured Rules Editor showing each policy field with its value, evidence snippet, and ambiguity flag
- [ ] **PLCY-06**: User can edit a structured rule field, flag it as ambiguous, and save a new version
- [ ] **PLCY-07**: User can view the version history of a policy and select any version to inspect

### Policy Compare

- [ ] **COMP-01**: User can select a drug family and one or more payers to generate a side-by-side comparison table
- [ ] **COMP-02**: Comparison table shows preferred products, non-preferred products, prior auth required, step therapy, covered indications, key restrictions — one column per payer
- [ ] **COMP-03**: System auto-generates difference highlights (e.g. "Florida Blue has explicit fail/intolerance requirement")
- [ ] **COMP-04**: Each comparison cell links to the source evidence snippet

### Policy Insights

- [ ] **INSG-01**: User can view a heat map grid of payer × rule type × coverage status (green/yellow/red) on the Policy Insights page
- [ ] **INSG-02**: User can filter the heat map by drug family, payer, rule type, and version
- [ ] **INSG-03**: User can view a knowledge graph showing drug → payer → policy → rule relationships
- [ ] **INSG-04**: Clicking a heat map cell or graph node opens an evidence panel with the source snippet and page reference

### Policy Changes

- [ ] **CHNG-01**: User can view the Policy Changes page showing a timeline of policy uploads/updates sorted by date
- [ ] **CHNG-02**: Change table shows policy, field changed, old value, new value, and severity (cosmetic / operational / clinical)
- [ ] **CHNG-03**: User can view the Version Diff page for any two versions: structured field changes + raw text diff side-by-side
- [ ] **CHNG-04**: System classifies each diff as cosmetic (formatting), operational (minor wording), or clinical/coverage impact (PA, step therapy, product tier changes)

### Patient Cases

- [ ] **PATC-01**: User can create a new patient case with payer, requested drug, diagnosis, and synthetic patient name
- [ ] **PATC-02**: User can view the Patient Cases page listing all cases with status (missing docs / ready for eval / complete)
- [ ] **PATC-03**: User can upload patient documents to a case (clinical note, prior treatment history, lab results, referral, medication order, denial letter)
- [ ] **PATC-04**: System extracts structured facts from uploaded documents: diagnosis, requested drug, prior therapies, prescriber type, insurance info
- [ ] **PATC-05**: User can view extracted facts alongside source document evidence on the Patient Case Detail page

### Coverage Evaluation

- [ ] **EVAL-01**: User can trigger a coverage evaluation for a patient case against a selected policy version
- [ ] **EVAL-02**: Evaluation produces a coverage status: Covered / PA Required / Likely Eligible but Docs Missing / Not Covered / Preferred Alternative Required / Unclear
- [ ] **EVAL-03**: Evaluation shows a requirement checklist with each policy criterion marked PASS / MISSING / UNKNOWN / NEEDS REVIEW
- [ ] **EVAL-04**: Each checklist item links to the matched patient fact and the source policy evidence
- [ ] **EVAL-05**: Evaluation result is saved to `data/evaluations/` and viewable later

### Next-Step Generator

- [ ] **NEXT-01**: After coverage evaluation, system generates an ordered list of recommended next steps for the clinic staff user
- [ ] **NEXT-02**: System generates a list of missing documentation items with checkboxes
- [ ] **NEXT-03**: System generates a patient-friendly plain-language explanation of coverage status and what the clinic needs to do
- [ ] **NEXT-04**: System generates a payer analyst explanation of which policy criteria apply and what evidence is needed

### Evidence Explorer

- [ ] **EVID-01**: User can search all loaded policy evidence snippets by keyword on the Evidence Explorer page
- [ ] **EVID-02**: Search results show source policy, page number, section heading, snippet text, and linked policy fields
- [ ] **EVID-03**: User can click a result to open the full policy detail at that evidence item

### Chat

- [ ] **CHAT-01**: User can ask natural-language questions about loaded policies on the Chat page
- [ ] **CHAT-02**: Chat responses include inline evidence citations (policy name, page, section)
- [ ] **CHAT-03**: Chat sidebar shows the evidence snippets cited in the current response

### Expanded MCP Tools

- [ ] **MCP-01**: `upload_policy_document` tool accepts file path or URL, triggers parse + store pipeline
- [ ] **MCP-02**: `parse_policy_document` tool parses an already-uploaded document into structured JSON
- [ ] **MCP-03**: `list_policy_versions` tool returns all versions for a given policy with metadata
- [ ] **MCP-04**: `diff_policy_versions` tool returns structured diff between two policy versions
- [ ] **MCP-05**: `get_policy_evidence` tool returns evidence snippets for a given policy field
- [ ] **MCP-06**: `search_policy_rules` tool keyword-searches across all policy rules and evidence
- [ ] **MCP-07**: `extract_patient_facts` tool extracts structured facts from a patient document
- [ ] **MCP-08**: `evaluate_patient_against_policy` tool runs coverage evaluation and returns checklist + status
- [ ] **MCP-09**: `generate_next_steps` tool returns role-specific next steps for a coverage evaluation
- [ ] **MCP-10**: `get_case_summary` tool returns full summary of a patient case with evaluation result

### Portal UI

- [ ] **UI-01**: Dashboard page with KPI cards (policies loaded, active cases, PA required, missing docs, recent changes) and quick actions
- [ ] **UI-02**: Role switcher: Clinic Staff / Payer Analyst / Patient view modes adjusting dashboard and case detail content
- [ ] **UI-03**: Global navigation: Dashboard, Policy Rules, Policy Compare, Policy Insights, Policy Changes, Patients, Evidence Explorer, Chat

## Future Requirements

### Authentication

- **AUTH-01**: User can sign in with email and password
- **AUTH-02**: Session persists across browser refresh
- **AUTH-03**: Role-based access (clinic staff vs payer analyst vs patient)

### Multi-Tenant

- **TENT-01**: Organization-level policy isolation
- **TENT-02**: Admin can manage org users and permissions

### Notifications

- **NOTF-01**: User receives alert when a watched policy is updated
- **NOTF-02**: User receives alert when a case evaluation changes status

## Out of Scope

| Feature | Reason |
|---------|--------|
| Supabase / PostgreSQL | File-based JSON sufficient for demo scale; DB adds complexity without value |
| Real patient data | Compliance — synthetic/de-identified only |
| OAuth / SSO | Not needed for demo/hackathon scope |
| Mobile app | Web-first |
| A2A protocol | MCP-based only per Prompt Opinion requirement |
| Python/FastAPI rewrite | Stay on TypeScript/Node, avoid migration cost |
| Real-time notifications | Future feature |
| Interactive D3 knowledge graph | Static/simple graph acceptable for v2.0 |
| Multi-tenant org management | Future feature |

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STOR-01 | TBD | Pending |
| STOR-02 | TBD | Pending |
| STOR-03 | TBD | Pending |
| STOR-04 | TBD | Pending |
| STOR-05 | TBD | Pending |
| STOR-06 | TBD | Pending |
| PLCY-01 | TBD | Pending |
| PLCY-02 | TBD | Pending |
| PLCY-03 | TBD | Pending |
| PLCY-04 | TBD | Pending |
| PLCY-05 | TBD | Pending |
| PLCY-06 | TBD | Pending |
| PLCY-07 | TBD | Pending |
| COMP-01 | TBD | Pending |
| COMP-02 | TBD | Pending |
| COMP-03 | TBD | Pending |
| COMP-04 | TBD | Pending |
| INSG-01 | TBD | Pending |
| INSG-02 | TBD | Pending |
| INSG-03 | TBD | Pending |
| INSG-04 | TBD | Pending |
| CHNG-01 | TBD | Pending |
| CHNG-02 | TBD | Pending |
| CHNG-03 | TBD | Pending |
| CHNG-04 | TBD | Pending |
| PATC-01 | TBD | Pending |
| PATC-02 | TBD | Pending |
| PATC-03 | TBD | Pending |
| PATC-04 | TBD | Pending |
| PATC-05 | TBD | Pending |
| EVAL-01 | TBD | Pending |
| EVAL-02 | TBD | Pending |
| EVAL-03 | TBD | Pending |
| EVAL-04 | TBD | Pending |
| EVAL-05 | TBD | Pending |
| NEXT-01 | TBD | Pending |
| NEXT-02 | TBD | Pending |
| NEXT-03 | TBD | Pending |
| NEXT-04 | TBD | Pending |
| EVID-01 | TBD | Pending |
| EVID-02 | TBD | Pending |
| EVID-03 | TBD | Pending |
| CHAT-01 | TBD | Pending |
| CHAT-02 | TBD | Pending |
| CHAT-03 | TBD | Pending |
| MCP-01 | TBD | Pending |
| MCP-02 | TBD | Pending |
| MCP-03 | TBD | Pending |
| MCP-04 | TBD | Pending |
| MCP-05 | TBD | Pending |
| MCP-06 | TBD | Pending |
| MCP-07 | TBD | Pending |
| MCP-08 | TBD | Pending |
| MCP-09 | TBD | Pending |
| MCP-10 | TBD | Pending |
| UI-01 | TBD | Pending |
| UI-02 | TBD | Pending |
| UI-03 | TBD | Pending |

**Coverage:**
- v2.0 requirements: 55 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 55 ⚠️

---
*Requirements defined: 2026-04-21*
*Last updated: 2026-04-21 after v2.0 milestone start*
