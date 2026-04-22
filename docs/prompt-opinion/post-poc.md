Yes. Now that the **POC MCP is done**, the next phase is to turn it into a **full working product**: a portal + backend + MCP + Prompt Opinion-connected system.

Your scribble is actually a good product direction. We just need to organize it into a buildable plan.

# 1. Product vision

Build a **Medical Benefit Policy Intelligence Portal** that helps users:

1. manage payer medical drug policies
2. normalize policy rules into a universal schema
3. compare policy rules across payers
4. match patient documents against policy criteria
5. generate next steps for clinic staff, patients, and payer/insurance users
6. expose all important functionality through MCP + Prompt Opinion

This fits the Anton Rx challenge very directly. The problem statement says there is no centralized standardized source for medical benefit drug policies, and the goal is to ingest, parse, normalize, search, and compare policies across health plans. 

The Q&A also says the strongest MVP is **side-by-side comparison of coverage criteria for a single drug across payers**, while Q&A and change tracking are high-priority workflows. 

---

# 2. Who are we building for?

You listed:

```text
Patients
Insurance providers
Clinic staff / doctors
```

For the full product, keep all three, but prioritize them differently.

## Primary user: clinic staff / provider office

This is the best full-product user because they need to answer:

* Is the requested drug covered?
* Is prior authorization needed?
* What documents are missing?
* What should we submit next?
* Is there a preferred alternative?

## Secondary user: payer / insurance / formulary analyst

This user needs:

* upload/manage policies
* compare policies
* track changes
* audit evidence
* understand drug positioning

This matches Anton Rx’s primary user: market access analyst or formulary strategist who compares drug coverage across payers. 

## Tertiary user: patient

Patients should get a simpler view:

* “covered”
* “needs prior authorization”
* “not covered”
* “clinic needs these documents”
* “insurance prefers another drug”

Do not make patient view too technical.

---

# 3. Full system architecture

```text
+--------------------------------------------------------------------------------+
|                            Prompt Opinion Platform                             |
|        Agent calls MCP tools through Streamable HTTP / SHARP context            |
+-------------------------------------+------------------------------------------+
                                      |
                                      v
+--------------------------------------------------------------------------------+
|                              PolicyPilot MCP Server                             |
| list_policies | compare_policies | ask_policy_question | evaluate_patient_case  |
| generate_next_steps | show_evidence | diff_policy_versions                     |
+-------------------------------------+------------------------------------------+
                                      |
                                      v
+--------------------------------------------------------------------------------+
|                                  Backend API                                    |
| Policy ingestion | rule extraction | versioning | patient doc parsing           |
| evidence retrieval | coverage engine | next-step generator                     |
+-------------------+------------------------+----------------------+-------------+
                    |                        |                      |
                    v                        v                      v
          +----------------+       +-------------------+    +-------------------+
          | Postgres DB    |       | File Storage      |    | Vector/Search     |
          | normalized     |       | raw PDFs/docs     |    | evidence chunks   |
          | rules/version  |       | patient docs      |    | semantic search   |
          +----------------+       +-------------------+    +-------------------+
                                      |
                                      v
+--------------------------------------------------------------------------------+
|                               Web Portal / UI                                   |
| Dashboards | Policy Rules | Compare | Insights | Patients | Cases | Chat        |
+--------------------------------------------------------------------------------+
```

For deployment, keep the same approach as the POC:

* Frontend: **Next.js + Vercel**
* Backend/API: **FastAPI or Node**
* DB: **Supabase Postgres / Neon**
* Storage: **Supabase Storage / S3**
* MCP: **deployed public server**
* Prompt Opinion: connected MCP endpoint

Prompt Opinion requires your solution to function in its platform, and the challenge allows building an MCP server on your own infrastructure.  The quickstart also shows connecting a public `/mcp` endpoint through Streamable HTTP. 

---

# 4. Core product modules

## Module A: Policy Rules

This is the foundation.

### What it does

```text
Reads policy rules
Updates policy rules
Processes policies into structured details
Stores policy versions
Stores prior steps / fail-first criteria
Visualizes complex rules
Compares policies across payers
Shows exact evidence for every fact
```

### Key questions this module answers

```text
Can we create a universal schema like FHIR?
Can we create an MCP server for this?
How do we store changes of the same policy?
How do we store prior steps?
How do we visualize complex policy rules?
```

### Answer

Yes, create a **canonical policy schema**, but do not call it “FHIR for policies” directly.

FHIR is better for patient data. Your policy data needs its own schema.

Use:

```text
FHIR-like patient facts
        +
Canonical Policy Schema
        +
Coverage Decision Engine
```

Anton Rx specifically says key extracted fields include drug name, therapeutic class/category, preferred vs non-preferred status, indications, PA requirements, step therapy, site-of-care restrictions, dosing limits, and effective date. 

---

## Module B: Patient Documents

### What it does

```text
Stores patient docs
Reads patient docs
Extracts patient facts
Maps patient facts to policy criteria
```

Patient docs can include:

* clinical note
* diagnosis note
* prior treatment history
* lab results
* referral note
* medication order
* insurance info
* previous denial letter

Important: for hackathon/demo, use only **synthetic or de-identified data**.

---

## Module C: Patient Documents × Policy Rules

This is the “decision” layer.

### What it does

```text
Compares patient facts with policy rules
Determines coverage status
Shows missing evidence
Recommends next steps
Supports LLM chat
Visualizes drug/policy/patient pathway
```

Possible statuses:

```text
Covered
Covered but prior authorization required
Likely eligible but documentation missing
Not covered
Preferred alternative required first
Unclear / needs manual review
```

---


# 6. Storage and versioning plan

You need to store:

1. raw documents
2. parsed text
3. normalized policy rules
4. evidence snippets
5. versions
6. diffs between versions
7. patient documents
8. patient extracted facts
9. coverage evaluations

## Recommended database tables

### `documents`

Stores raw policy or patient files.

```text
id
document_type: policy | patient_document
file_name
file_url
checksum
uploaded_by
uploaded_at
source
```

### `policies`

One logical policy.

```text
id
payer_name
policy_title
policy_type
drug_family
current_version_id
created_at
updated_at
```

### `policy_versions`

Every upload/update creates a new version.

```text
id
policy_id
version_label
effective_date
reviewed_date
revised_date
source_document_id
raw_text_hash
structured_hash
status
created_at
```

### `policy_products`

```text
id
policy_version_id
drug_family
product_name
generic_name
therapeutic_class
tier: preferred | non_preferred | excluded | covered | not_covered
coverage_status
requires_pa
evidence_id
```

### `policy_rules`

```text
id
policy_version_id
rule_type: prior_auth | step_therapy | indication | dosing | site_of_care | restriction
drug_family
applies_to_products
normalized_logic_json
human_readable
ambiguous
ambiguity_note
evidence_id
```

### `policy_indications`

```text
id
policy_version_id
drug_family
indication_name
criteria_json
evidence_id
```

### `policy_evidence`

```text
id
policy_version_id
source_document_id
page
section_heading
snippet
field_path
created_at
```

### `policy_diffs`

```text
id
old_version_id
new_version_id
change_type: added | removed | modified | cosmetic
changed_field
old_value
new_value
severity: low | medium | high
evidence_id
created_at
```

### `patient_cases`

```text
id
synthetic_patient_name
payer_name
requested_drug
diagnosis
case_status
created_at
```

### `patient_documents`

```text
id
patient_case_id
file_name
file_url
document_type
uploaded_at
```

### `patient_facts`

```text
id
patient_case_id
fact_type
fact_value
source_document_id
evidence_snippet
confidence
```

### `coverage_evaluations`

```text
id
patient_case_id
policy_version_id
requested_drug
coverage_status
matched_requirements
missing_requirements
recommended_next_steps
evidence_ids
created_at
```

---

# 7. How to store policy changes

Every time a policy is uploaded:

```text
1. Store raw document
2. Extract text
3. Normalize policy into schema
4. Compute structured hash
5. If same policy already exists:
      create new policy_version
      compare old vs new structured rules
      create policy_diffs
6. Mark newest version as current
```

## Change types

```text
Cosmetic change
- formatting
- references
- wording with no rule impact

Material change
- new PA requirement
- new step therapy
- product moved preferred → non-preferred
- indication added/removed
- dosing limit changed
- site-of-care restriction added
```

This maps to Anton Rx’s stated need: distinguish meaningful clinical/coverage changes from minor edits. 

---

# 9. MCP server after full implementation

Keep your POC MCP, then expand it.

## Existing POC tools

```text
list_policies
get_policy_summary
compare_drug_across_payers
ask_policy_question
```

## Add full-product MCP tools

```text
upload_policy_document
parse_policy_document
list_policy_versions
diff_policy_versions
get_policy_evidence
search_policy_rules
extract_patient_facts
evaluate_patient_against_policy
generate_next_steps
get_case_summary
```

## Tool output shape

Every tool should return:

```json
{
  "human_readable": "...",
  "structured_result": {},
  "evidence": [],
  "confidence": "high|medium|low"
}
```

That matches your POC rules and keeps Prompt Opinion responses grounded.

The Prompt Opinion testing checklist already expects tools like `get_drug_coverage`, `get_prior_auth_criteria`, `check_patient_readiness`, `list_policies`, `get_policy_summary`, `compare_drug_across_payers`, and `ask_policy_question` to be callable from the agent. 

---

# 10. Portal pages

Now here is the actual full portal plan.

## Global navigation

```text
Dashboard
Policy Rules
Policy Compare
Policy Insights
Policy Changes
Patients
Patient Cases
Patient Documents
Coverage Evaluation
Evidence Explorer
Chat
MCP / Prompt Opinion
Settings
```

---

# 11. Page-by-page plan

## 11.1 Main Dashboard

Simple dashboard for every role.

```text
+--------------------------------------------------------------------------------+
| Dashboard                                                                       |
+--------------------------------------------------------------------------------+
| Role switch: [Clinic Staff] [Payer Analyst] [Patient View]                      |
+--------------------------------------------------------------------------------+
| KPI Cards                                                                       |
| Policies Loaded | Active Cases | PA Required | Missing Docs | Recent Changes    |
+--------------------------------------------------------------------------------+
| Recent Activity                                                                 |
| - Florida Blue bevacizumab policy parsed                                        |
| - BCBS NC version diff created                                                  |
| - Patient Case #103 needs prior therapy documentation                           |
+--------------------------------------------------------------------------------+
| Quick Actions                                                                   |
| [Upload Policy] [Upload Patient Doc] [Compare Policies] [Evaluate Case]         |
+--------------------------------------------------------------------------------+
```

### Role behavior

Clinic staff sees:

* patient cases
* missing docs
* next steps

Payer analyst sees:

* policy changes
* comparisons
* evidence confidence

Patient sees:

* simplified status
* what is needed next

---

## 11.2 Policy Rules Page

This is the policy management page.

```text
+--------------------------------------------------------------------------------+
| Policy Rules                                                                    |
+--------------------------------------------------------------------------------+
| [Upload Policy] [Parse] [Create Version] [Compare]                              |
+--------------------------------------------------------------------------------+
| Filters: Payer | Drug Family | Status | Effective Date                          |
+--------------------------------------------------------------------------------+
| Policy Table                                                                    |
| Payer       | Policy Title                   | Drug Family | Version | Status      |
| BCBS NC     | Preferred Injectable Oncology  | Bevacizumab | v2      | Parsed      |
| Cigna       | Rituximab IV Non-Oncology      | Rituximab   | v1      | Parsed      |
| FloridaBlue | Bevacizumab                    | Bevacizumab | v1      | Parsed      |
+--------------------------------------------------------------------------------+
```

### Functional requirements

* read policy rules
* update policy rules
* process policy into structured details
* view evidence
* view versions
* trigger re-parse

---

## 11.3 Policy Detail Page

```text
+--------------------------------------------------------------------------------+
| Policy Detail: Cigna Rituximab IV Non-Oncology                                  |
+--------------------------------------------------------------------------------+
| Summary: Effective 02/01/2026 | Payer: Cigna | Drug: Rituximab                 |
+--------------------------------------------------------------------------------+
| Tabs: Overview | Products | Indications | Criteria | Evidence | Versions        |
+--------------------------------------------------------------------------------+
| Overview                                                                       |
| - PA required: Yes                                                              |
| - Products: Rituxan, Riabni, Ruxience, Truxima                                  |
| - Indications: ANCA vasculitis, RA, SLE, etc.                                   |
| - Prescriber specialist requirement: Yes                                        |
+--------------------------------------------------------------------------------+
```

Cigna’s policy explicitly states prior authorization is required for rituximab IV products and includes documentation expectations and specialist-prescriber requirements. 

---

## 11.4 Structured Rules Editor

This is for insurance/provider/admin users.

```text
+--------------------------------------------------------------------------------+
| Structured Rules Editor                                                         |
+--------------------------------------------------------------------------------+
| Field                          | Value                         | Evidence        |
| Prior Authorization Required   | Yes                           | [View]          |
| Preferred Products             | Riabni, Ruxience, Truxima     | [View]          |
| Non-preferred Products         | Rituxan                       | [View]          |
| Step Therapy                   | Product-specific criteria     | [View]          |
| Prescriber Requirement         | Specialist required           | [View]          |
+--------------------------------------------------------------------------------+
| [Edit Field] [Mark Ambiguous] [Approve Rule] [Save Version]                     |
+--------------------------------------------------------------------------------+
```

### Key behavior

Every editable field has:

```text
value
evidence
ambiguity flag
last updated by
version history
```

---

## 11.5 Policy Compare Page

This is the most important business page.

```text
+--------------------------------------------------------------------------------+
| Compare Policies                                                                |
+--------------------------------------------------------------------------------+
| Drug Family: [Bevacizumab] Payers: [BCBS NC] [Florida Blue] [Priority Health]   |
+--------------------------------------------------------------------------------+
| Field                     | BCBS NC        | Florida Blue       | Priority Health |
| Preferred Products        | Mvasi/Zirabev  | Mvasi/Zirabev      | Mvasi/Zirabev   |
| Non-preferred Products    | Avastin etc.   | Avastin etc.       | Avastin NC use  |
| Prior Auth                | Conditional    | Yes                | PA for some     |
| Step Therapy              | Preferred use  | fail/intolerance   | covered alt     |
| Indications               | oncology list  | Table 1 criteria   | drug list based |
| Evidence                  | [Open]         | [Open]             | [Open]          |
+--------------------------------------------------------------------------------+
| Auto-generated Difference Highlights                                            |
| - Florida Blue has explicit fail/intolerance requirement.                       |
| - Priority Health marks some Avastin non-ophthalmic coverage as not covered.    |
+--------------------------------------------------------------------------------+
```

Priority Health’s medical drug list, for example, marks J9035 Avastin as “Not Covered” and lists Mvasi and Zirabev as covered alternatives for non-ophthalmic coverage. 

---

## 11.6 Policy Insights Page: Heat Map + Knowledge Graph

You already decided heat map and knowledge graph should be one page.

```text
+------------------------------------------------------------------------------------------------+
| Policy Insights                                                                                |
+------------------------------------------------------------------------------------------------+
| Filters: Drug Family | Payers | Rule Type | Version | Optional Patient Case                 |
+------------------------------------------------------------------------------------------------+
| HEAT MAP                                                                                       |
|                                                                                                |
|                         BCBS NC      Florida Blue     Priority Health       Cigna              |
| Preferred Status          Green          Green             Red              Yellow             |
| Prior Auth                Yellow         Red               Yellow           Red                |
| Step Therapy              Yellow         Red               Yellow           Yellow             |
| Site of Care              Unknown        Unknown           Yellow           Unknown            |
| Evidence Strength         Green          Green             Yellow           Green              |
+------------------------------------------------------------------------------------------------+
| KNOWLEDGE GRAPH                                      | EVIDENCE PANEL                         |
|                                                       |                                        |
| BCBS NC -> Policy -> Bevacizumab -> Mvasi preferred   | Selected: Florida Blue Step Therapy   |
| Florida Blue -> Bevacizumab -> requires trial of      | Evidence: direct quote + page         |
| Mvasi/Zirabev before Avastin                          |                                        |
| Priority Health -> Avastin -> Not Covered ->          | [Open Source] [Attach to Answer]      |
| Alternatives: Mvasi/Zirabev                           |                                        |
+------------------------------------------------------------------------------------------------+
```

### Purpose

```text
Heat map = find differences fast
Knowledge graph = explain relationships
Evidence panel = prove it
```

---

## 11.7 Policy Changes Page

```text
+--------------------------------------------------------------------------------+
| Policy Changes                                                                  |
+--------------------------------------------------------------------------------+
| Filters: Payer | Drug | Severity | Date Range                                   |
+--------------------------------------------------------------------------------+
| Timeline                                                                        |
| Jan 2026 - BCBS NC oncology program updated                                     |
| Feb 2026 - Cigna rituximab policy effective                                     |
| Apr 2026 - Priority Health medical drug list updated                            |
+--------------------------------------------------------------------------------+
| Change Table                                                                    |
| Policy      | Field Changed        | Old Value | New Value | Severity          |
| BCBS NC     | Preferred products   | old list  | new list  | High              |
| Cigna       | PA criteria          | old text  | new text  | High              |
+--------------------------------------------------------------------------------+
```

---

## 11.8 Version Diff Page

```text
+--------------------------------------------------------------------------------+
| Version Diff                                                                    |
+--------------------------------------------------------------------------------+
| Old Version: v1                       | New Version: v2                         |
+--------------------------------------------------------------------------------+
| Structured Changes                                                              |
| - Product moved preferred -> non-preferred                                      |
| - New prior auth documentation requirement                                      |
| - New indication added                                                          |
+--------------------------------------------------------------------------------+
| Raw Text Diff                                                                   |
| Removed text in left column | Added text in right column                        |
+--------------------------------------------------------------------------------+
| Materiality Classification                                                      |
| [Cosmetic] [Operational] [Clinical/Coverage Impact]                             |
+--------------------------------------------------------------------------------+
```

---

## 11.9 Patients Page

```text
+--------------------------------------------------------------------------------+
| Patients / Synthetic Cases                                                      |
+--------------------------------------------------------------------------------+
| [Create Case] [Upload Document]                                                 |
+--------------------------------------------------------------------------------+
| Case ID | Patient | Payer | Requested Drug | Status                             |
| 101     | Demo A  | Cigna | Rituximab      | Missing documentation              |
| 102     | Demo B  | BCBS  | Avastin        | Preferred alternative needed       |
+--------------------------------------------------------------------------------+
```

---

## 11.10 Patient Case Detail Page

```text
+--------------------------------------------------------------------------------+
| Patient Case #101                                                               |
| Payer: Cigna | Requested Drug: Rituximab | Diagnosis: SLE                     |
+--------------------------------------------------------------------------------+
| Tabs: Summary | Documents | Extracted Facts | Policy Match | Next Steps | Chat   |
+--------------------------------------------------------------------------------+
```

---

## 11.11 Patient Documents Page

```text
+--------------------------------------------------------------------------------+
| Patient Documents                                                               |
+--------------------------------------------------------------------------------+
| [Upload Clinical Note] [Upload Lab] [Upload Prior Therapy History]              |
+--------------------------------------------------------------------------------+
| Documents                                                                       |
| - rheumatology_note.pdf                                                         |
| - prior_medication_history.pdf                                                  |
| - labs.pdf                                                                      |
+--------------------------------------------------------------------------------+
| Extracted Facts                                                                 |
| Diagnosis: SLE                                                                  |
| Requested drug: Rituximab                                                       |
| Prior therapies: not found                                                      |
| Prescriber: rheumatologist                                                      |
+--------------------------------------------------------------------------------+
```

---

## 11.12 Patient × Policy Match Page

```text
+--------------------------------------------------------------------------------+
| Coverage Evaluation                                                             |
+--------------------------------------------------------------------------------+
| Matched Policy: Cigna Rituximab IV Non-Oncology                                 |
+--------------------------------------------------------------------------------+
| Status: PRIOR AUTHORIZATION REQUIRED                                            |
+--------------------------------------------------------------------------------+
| Requirement Checklist                                                           |
| Diagnosis documented                         PASS                               |
| Specialist note present                      PASS                               |
| Prior therapy history                        MISSING                            |
| Dosing within policy                         UNKNOWN                            |
| Product preference criteria                  NEEDS REVIEW                       |
+--------------------------------------------------------------------------------+
| Evidence                                                                       |
| [Cigna Policy, Page 6, Policy Statement]                                        |
+--------------------------------------------------------------------------------+
```

---

## 11.13 Next-Step Generator Page

This is one of your “wow” features.

```text
+--------------------------------------------------------------------------------+
| Next-Step Generator                                                             |
+--------------------------------------------------------------------------------+
| Case Result: Likely eligible for review, but PA packet is incomplete            |
+--------------------------------------------------------------------------------+
| Recommended Next Steps                                                          |
| 1. Confirm exact diagnosis and indication                                       |
| 2. Attach specialist note                                                       |
| 3. Add prior therapy history                                                    |
| 4. Confirm requested rituximab product                                          |
| 5. Submit prior authorization packet                                            |
+--------------------------------------------------------------------------------+
| Missing Documentation                                                           |
| [ ] Prior therapy history                                                       |
| [ ] Dosing support                                                              |
| [ ] Required lab evidence if applicable                                         |
+--------------------------------------------------------------------------------+
| Patient-Friendly Explanation                                                    |
| Your insurance may cover this medication, but your clinic needs to submit more  |
| information before the insurer can approve it.                                  |
+--------------------------------------------------------------------------------+
| Clinic Staff Explanation                                                        |
| The policy requires PA and condition-specific documentation.                    |
+--------------------------------------------------------------------------------+
```

---

## 11.14 Evidence Explorer

```text
+--------------------------------------------------------------------------------+
| Evidence Explorer                                                               |
+--------------------------------------------------------------------------------+
| Search: [prior authorization rituximab]                                         |
+--------------------------------------------------------------------------------+
| Result                                                                          |
| Source: Cigna Rituximab IV Policy                                               |
| Page: 6                                                                         |
| Section: Policy Statement                                                       |
| Snippet: "Prior Authorization is required..."                                   |
| Linked Fields: prior_authorization.required                                     |
+--------------------------------------------------------------------------------+
```

---

## 11.15 Chat Page

```text
+--------------------------------------------------------------------------------+
| Evidence-Backed Chat                                                            |
+--------------------------------------------------------------------------------+
| User: Does Cigna cover Rituxan for lupus?                                       |
| Assistant: Prior authorization is required. The case must satisfy the listed    |
| criteria and documentation requirements. [Evidence]                             |
+--------------------------------------------------------------------------------+
| Evidence Sidebar                                                                |
| - Cigna Rituximab IV Policy, Page 6                                             |
| - Relevant indication section                                                   |
+--------------------------------------------------------------------------------+
```

### Chat rule

The LLM should not invent answers.

Flow:

```text
user question
 -> deterministic policy lookup
 -> retrieve evidence
 -> optional LLM summarization
 -> answer with citations
```

---

## 11.16 MCP / Prompt Opinion Integration Page

```text
+--------------------------------------------------------------------------------+
| Prompt Opinion / MCP Integration                                                |
+--------------------------------------------------------------------------------+
| MCP Endpoint: https://your-domain.com/mcp                                       |
| Health Endpoint: https://your-domain.com/health                                 |
| Transport: Streamable HTTP                                                      |
| Status: Connected                                                               |
+--------------------------------------------------------------------------------+
| Tools                                                                           |
| list_policies                         Healthy                                  |
| compare_drug_across_payers             Healthy                                  |
| ask_policy_question                    Healthy                                  |
| evaluate_patient_against_policy        Healthy                                  |
| generate_next_steps                    Healthy                                  |
+--------------------------------------------------------------------------------+
| [Test Tool] [View Logs] [Copy Endpoint]                                         |
+--------------------------------------------------------------------------------+
```

---

# 12. Role-specific dashboards

## Patient dashboard

```text
Patient View
- My medication request
- Coverage status
- What insurance needs
- What my clinic is doing next
- Simple explanation
```

Avoid raw policy complexity here.

## Clinic staff dashboard

```text
Clinic Staff View
- Active PA cases
- Missing documents
- Recommended next steps
- Patient-policy match
- Submission checklist
```

This should be your strongest operational view.

## Insurance / payer / analyst dashboard

```text
Payer Analyst View
- Policy inventory
- Comparison matrix
- Version changes
- Rule evidence
- Drug positioning by category
```

This maps most closely to Anton Rx’s analyst workflow.

---

# 13. Build roadmap

## Milestone 1: POC hardening

You said POC is done, so harden it before building UI.

```text
[ ] MCP server stable
[ ] Prompt Opinion connection tested
[ ] Policy tools return consistent evidence
[ ] Bevacizumab comparison works
[ ] Rituximab Q&A works
[ ] Add logs for tool calls
[ ] Add error handling
```

---

## Milestone 2: Backend + database

```text
[ ] Create Postgres schema
[ ] Move normalized JSON into DB
[ ] Store raw documents
[ ] Store evidence objects
[ ] Store policy versions
[ ] Add API endpoints
```

Endpoints:

```text
GET /policies
POST /policies/upload
GET /policies/:id
GET /policies/:id/versions
GET /policies/:id/evidence
POST /policies/:id/parse
POST /policies/compare
POST /policies/diff
```

---

## Milestone 3: Policy Rules Portal

```text
[ ] Dashboard
[ ] Policies page
[ ] Upload policy page
[ ] Policy detail page
[ ] Structured rules editor
[ ] Evidence explorer
```

This gives you a real product surface.

---

## Milestone 4: Comparison + Insights

```text
[ ] Compare page
[ ] Difference highlights
[ ] Policy Insights page
[ ] Heat map
[ ] Knowledge graph
[ ] Evidence panel synced to selected heat-map cell / graph node
```

This is your visual “wow” layer.

---

## Milestone 5: Versioning + Changes

```text
[ ] Version table
[ ] Structured diff engine
[ ] Raw text diff
[ ] Material vs cosmetic classification
[ ] Changes page
```

---

## Milestone 6: Patient Documents

```text
[ ] Create synthetic patient cases
[ ] Upload patient documents
[ ] Extract patient facts
[ ] Store patient facts with evidence
[ ] Link patient facts to case
```

---

## Milestone 7: Patient × Policy Evaluation

```text
[ ] Match requested drug to policy
[ ] Match diagnosis to indication
[ ] Check PA requirement
[ ] Check step therapy / preferred product logic
[ ] Check missing docs
[ ] Return coverage status
```

Coverage statuses:

```text
covered
covered_with_pa
not_covered
preferred_alternative_required
missing_documentation
manual_review_needed
```

---

## Milestone 8: Next-Step Generator

```text
[ ] Generate clinic checklist
[ ] Generate patient-friendly explanation
[ ] Generate payer/analyst explanation
[ ] Attach source evidence
[ ] Export output
```

---

## Milestone 9: Full MCP expansion

Expose portal intelligence through MCP:

```text
[ ] evaluate_patient_against_policy
[ ] generate_next_steps
[ ] get_policy_evidence
[ ] diff_policy_versions
[ ] search_policy_rules
```

---

## Milestone 10: Demo polish

```text
[ ] Seed 4-5 policies
[ ] Seed 2 patient cases
[ ] Prepare 3 demo flows
[ ] Deploy frontend
[ ] Deploy backend
[ ] Deploy MCP
[ ] Connect Prompt Opinion
[ ] Record under-3-minute demo
```

The hackathon asks for a demo video under 3 minutes showing the project functioning within Prompt Opinion. 

---

# 14. Demo flow to aim for

## Demo 1: Policy comparison

```text
Open portal
Go to Compare
Select Bevacizumab
Compare BCBS NC, Florida Blue, Priority Health
Show preferred/non-preferred differences
Open evidence
```

## Demo 2: Policy insights

```text
Go to Policy Insights
Show heat map
Click restrictive cell
Graph highlights relationship
Evidence panel proves the difference
```

## Demo 3: Patient readiness

```text
Open Patient Case
Requested drug: Rituximab
Payer: Cigna
Run coverage evaluation
Show PA required + missing documentation
Generate next steps
```

## Demo 4: Prompt Opinion

```text
Open Prompt Opinion
Ask: Compare bevacizumab coverage across payers
Show MCP tool call
Show evidence-backed answer
Ask: Is this patient ready for rituximab PA?
Show patient-aware response
```

---

# 15. What to build first after POC

Do **not** start with all pages.

Start in this exact order:

```text
1. Backend DB migration from JSON to Postgres
2. Policy Rules page
3. Policy Detail + Evidence
4. Compare page
5. Patient Case page
6. Coverage Evaluation
7. Next-Step Generator
8. Policy Insights heat map + KG
9. Changes / version diff
10. Role-specific dashboards
```

Why this order?

Because the value chain is:

```text
policy data
 -> structured rules
 -> comparison
 -> patient match
 -> next steps
 -> visual insights
```

Do not build heat maps or knowledge graphs before the data model is stable.

---

# 16. Team task breakdown

## Person 1: Backend + database

```text
- DB schema
- API routes
- policy versioning
- evidence storage
- diff engine
```

## Person 2: Policy intelligence + MCP

```text
- schema normalization
- drug aliases
- rule matching
- coverage evaluation
- MCP tools
```

## Person 3: Frontend portal

```text
- dashboard
- policy pages
- compare page
- patient case pages
- next-step UI
```

## Person 4: Visualization + demo

```text
- heat map
- knowledge graph
- evidence panel
- demo script
- Prompt Opinion testing
```

If you have fewer people, merge Person 2 and Person 4.

---

# 17. Final target product

The final system should be:

```text
PolicyPilot / PolicyLens

A deployed medical benefit policy intelligence platform that:
- stores payer policy documents
- normalizes policy rules into a universal schema
- tracks policy versions and changes
- compares drug coverage across payers
- stores synthetic patient documents
- matches patient facts to policy rules
- generates next-step guidance
- visualizes payer differences through heat map + knowledge graph
- exposes everything through MCP and Prompt Opinion
```

This is the clearest path from your POC to a full implementation.

The core principle should stay the same:

```text
Every answer.
Every recommendation.
Every visual.
Must be backed by policy evidence.
```
