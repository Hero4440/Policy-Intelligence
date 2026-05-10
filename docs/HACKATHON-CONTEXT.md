# PolicyPilot Hackathon Context Document

**Last Updated:** 2026-05-09  
**Milestone:** v2.0 Full Product (In Progress)  
**Current Phase:** 11 (MCP Tools - Complete), moving to Phase 12 (Portal UI + Dashboard + Deployment)

---

## Executive Summary

**PolicyPilot** is a comprehensive Medical Benefit Policy Intelligence Portal for healthcare organizations. It ingests, normalizes, and compares payer drug policies, matches patient documents against coverage criteria, and generates evidence-backed next steps for clinic staff.

**Core Value:** Every policy question answered must include source-backed evidence from loaded policy documents — and every coverage evaluation must show exactly which criteria are met, missing, or ambiguous.

**Users:** Clinic staff (primary), payer/formulary analysts (secondary), patients (tertiary)

---

## What Is PolicyPilot?

### Primary Features

1. **Drug Coverage Search** — Search and compare drug coverage across multiple payers
2. **Cross-Payer Comparison** — Side-by-side policy comparison with visual indicators
3. **Policy Insights** — Analyze policy trends and coverage patterns via heat map and knowledge graph
4. **Change Tracking** — Monitor policy changes and updates over time
5. **Data Management** — Upload and manage policy documents and formularies
6. **Evidence Explorer** — Search policy documents by keywords
7. **AI-Powered Chat** — Ask natural language questions about policies with evidence citations
8. **Patient Readiness Checking** — Check if patients meet prior authorization criteria
9. **Coverage Evaluation** — Match patient facts against policy requirements with evidence-backed checklist
10. **Next-Step Generator** — Generate role-specific guidance (clinic staff, patient, analyst)

### Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Storage:** File-based JSON in `data/` (no database)
- **MCP Server:** StreamableHTTP transport for Prompt Opinion integration
- **Deployment Target:** Vercel (frontend) + Railway (backend)
- **Design System:** Cream theme with CSS custom properties

---

## Project Status

### v1.0 POC (SHIPPED 2026-04-22)

✅ **Phases 1-5 Complete** — All core infrastructure built:
- MCP server with 7 tools (list, summarize, compare, Q&A, coverage, PA criteria, patient readiness)
- Policy data foundation with Zod-validated schema
- Drug normalization (bevacizumab + rituximab families with biosimilar resolution)
- FHIR client integration
- PDF extraction pipeline
- 2 normalized sample policies (BCBS NC bevacizumab + Cigna rituximab)
- File-based storage with versioning
- React frontend with search, comparison, detail views
- ngrok deployment + Prompt Opinion integration
- **Total:** 7,611 lines TypeScript, 12 completed plans

### v2.0 Full Product (IN PROGRESS)

**Current State:**
- ✅ **Phase 10:** Next Steps + Evidence Explorer + Chat (Complete)
- ✅ **Phase 11:** Expanded MCP Tools (Complete) — All 10 new MCP tools implemented
- 🚧 **Phase 12:** Portal UI + Dashboard + Deployment (Not started)

**Remaining Work:**
- [ ] Dashboard page with KPI cards (policies loaded, active cases, PA required, missing docs, recent changes)
- [ ] Role switcher (Clinic Staff / Payer Analyst / Patient view modes)
- [ ] Global navigation linking all 8 sections
- [ ] Deploy frontend to Vercel, backend to Railway
- [ ] End-to-end verification

---

## Roadmap: Phases 6-12

### Phase 6: Policy Management + Ingestion ✅
**Status:** Complete

Users can upload, parse, view, and edit policies through the portal.

**Success Criteria:**
- ✅ Users upload PDF → parsed structured record appears in Policy Rules list
- ✅ Policy Rules page shows all policies with filters (payer, drug family, status)
- ✅ Policy Detail page with 6 tabs (Overview, Products, Indications, Criteria, Evidence, Versions)
- ✅ Structured Rules Editor with edit, ambiguity flag, version history
- ✅ Version history shows all saved versions with dates

### Phase 7: Policy Compare + Insights ✅
**Status:** Complete

Users compare coverage across payers and spot patterns via heat map and knowledge graph.

**Success Criteria:**
- ✅ Select drug + payers → side-by-side comparison table (preferred products, PA, step therapy, covered indications, restrictions)
- ✅ Auto-generated difference highlights above table
- ✅ Click cell → view source evidence snippet with page number
- ✅ Policy Insights heat map (payer × rule type × coverage status) with filters
- ✅ Click heat map cell → evidence panel
- ✅ Knowledge graph shows drug → payer → policy → rule relationships

### Phase 8: Policy Changes + Versioning ✅
**Status:** Complete

Track exactly how policies changed over time and understand clinical/operational impact.

**Success Criteria:**
- ✅ Policy Changes page shows timeline of all uploads/updates sorted by date
- ✅ Change table shows policy, field changed, old value, new value, severity (cosmetic/operational/clinical)
- ✅ Version Diff page shows structured field changes + raw text diff side-by-side
- ✅ System classifies diffs: formatting=cosmetic, wording=operational, PA/step therapy/tier=clinical

### Phase 9: Patient Cases + Coverage Evaluation ✅
**Status:** Complete

Clinic staff create cases, upload documents, extract facts, and run coverage evaluation.

**Success Criteria:**
- ✅ Create patient case with payer, drug, diagnosis, synthetic name → appears in list with status
- ✅ Upload documents → system extracts structured facts (diagnosis, drug, prior therapies, prescriber, insurance)
- ✅ Extracted facts displayed on Case Detail alongside source document text
- ✅ Trigger coverage evaluation → status (Covered / PA Required / Likely Eligible but Docs Missing / Not Covered / Preferred Alternative / Unclear)
- ✅ Requirement checklist with PASS/MISSING/UNKNOWN/NEEDS REVIEW linked to facts + evidence
- ✅ Evaluation saved and viewable after refresh

### Phase 10: Next Steps + Evidence Explorer + Chat ✅
**Status:** Complete

Clinic workflow complete — staff get actionable guidance, evidence is searchable, natural language Q&A works.

**Success Criteria:**
- ✅ After evaluation, staff see ordered next steps + checklist of missing docs
- ✅ Patient-friendly plain-language explanation of coverage status
- ✅ Payer analyst explanation of policy criteria and evidence needed
- ✅ Evidence Explorer accepts keyword search → returns snippets (source policy, page, section, fields)
- ✅ Click result → Policy Detail scrolled to evidence item
- ✅ Chat accepts natural-language question → answer with inline citations (policy, page, section) + sidebar evidence snippets

### Phase 11: Expanded MCP Tools ✅
**Status:** Complete

All 10 new MCP tools operational and expose portal capabilities to Prompt Opinion.

**MCP Tools:**
1. ✅ `upload_policy_document` — Accept file path/URL, trigger parse + store
2. ✅ `parse_policy_document` — Parse uploaded document into structured JSON
3. ✅ `list_policy_versions` — Return all versions with metadata
4. ✅ `diff_policy_versions` — Structured diff between two versions
5. ✅ `get_policy_evidence` — Evidence snippets for given policy field
6. ✅ `search_policy_rules` — Keyword search across rules + evidence
7. ✅ `extract_patient_facts` — Extract structured facts from patient document
8. ✅ `evaluate_patient_against_policy` — Coverage evaluation + checklist + status
9. ✅ `generate_next_steps` — Role-specific next steps for evaluation
10. ✅ `get_case_summary` — Full case summary with evaluation result

### Phase 12: Portal UI + Dashboard + Deployment 🚧
**Status:** In Progress — NOT STARTED

Portal looks and feels like a coherent product with dashboard, role switcher, and global nav deployed on Vercel + Railway.

**Success Criteria:**
- [ ] Dashboard loads with KPI cards (policies, active cases, PA required, missing docs, recent changes) + quick actions
- [ ] Role switcher (Clinic Staff / Payer Analyst / Patient) changes dashboard/case detail per role
- [ ] Global navigation: Dashboard, Policy Rules, Policy Compare, Policy Insights, Policy Changes, Patients, Evidence Explorer, Chat
- [ ] Frontend on Vercel URL, backend on Railway URL, all smoke tests pass

**Plans:** TBD

---

## Design System

### Cream Theme

- **Base Background:** `#FAF9F6` — Warm cream for main background
- **Card Backgrounds:** `#FFFFFF` — Pure white for elevated surfaces
- **Accent Color:** `#0A7EA4` — Teal/cyan for interactive elements

### Typography

- **Font Family:** Inter (UI), IBM Plex Mono (code)
- **Scale:** 7 sizes from 12px to 32px
- **Weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing

- **8px-based scale:** 4px to 48px
- **Card Padding:** 16px to 24px
- **Section Gaps:** 16px to 48px

### Borders & Shadows

- **Border Radius:** 4-8px (small), 16-24px (cards), 9999px (pills)
- **Card Shadow:** `0 4px 6px rgba(0, 0, 0, 0.1)`
- **Modal Shadow:** `0 10px 15px rgba(0, 0, 0, 0.1)`
- **Hover:** Increased shadow for feedback

### Transitions

- **Fast:** 150ms (buttons)
- **Base:** 200ms (cards)
- **Slow:** 300ms (layout)

### Accessibility

- ✅ WCAG AA compliant (4.5:1 contrast minimum)
- ✅ Keyboard navigation, focus indicators, semantic HTML
- ✅ ARIA labels, screen reader support
- ✅ Respects `prefers-reduced-motion`

---

## Component Library

### Cards
- **Policy Card** — Policy info in search results
- **Detail Card** — Detailed info sections
- **Compare Highlight Card** — Comparison highlights
- **Ingestion Source Card** — Source info

### Buttons
- **Primary Button** — Main CTAs
- **Page Navigation Button** — Major section tabs
- **Tab Button** — Sub-navigation

### Forms
- **Text Input** — Single-line text
- **Select Dropdown** — Selections
- **Textarea** — Multi-line text
- **Search Input** — Search with icon

### Status Badges
- **Coverage Status:** Covered, PA Required, Not Covered, Listed
- **Generic Status:** Success, Warning, Error, Neutral, Info
- **Ingestion Status:** Normalized, Partial, Stored, Rejected

### Navigation
- **Page Navigation** — 7-tab main nav
- **Tab Bar** — Sub-navigation

### Layout
- **Workspace Grid** — 3 or 4-column responsive
- **Sidebar** — Filters and search
- **Workspace Column** — Content columns
- **Panel Header** — Section headers

---

## Data Models

### Policy Record (Zod Schema)

```typescript
{
  id: string;                          // Unique ID
  payer: string;                       // Payer name (UHC, Aetna, etc.)
  title: string;                       // Policy title
  drugFamily: string;                  // Normalized drug family
  products: Array<{                    // Covered products
    name: string;
    tier: 'preferred' | 'non-preferred';
    biosimilars?: string[];
  }>;
  priorAuthRequired?: boolean;         // PA needed?
  priorAuthCriteria?: string[];        // PA requirements
  stepTherapy?: boolean;               // Step therapy?
  stepTherapyRules?: string[];         // Step therapy rules
  indications?: string[];              // Covered diagnoses
  restrictions?: string[];             // Coverage restrictions
  failureOrIntolerance?: boolean;      // Need fail/intolerance evidence?
  evidence: Array<{                    // Source snippets
    text: string;
    page: number;
    section: string;
  }>;
  versions: Array<{                    // Version history
    id: string;
    createdAt: string;
    changes: string[];
  }>;
  ambiguouFields?: string[];           // Fields marked ambiguous
  normalizedAt: string;                // Parse timestamp
}
```

### Patient Case

```typescript
{
  id: string;                          // Unique case ID
  patientName: string;                 // Synthetic name
  payer: string;                       // Insurance payer
  requestedDrug: string;               // Normalized drug name
  diagnosis: string;                   // ICD code / description
  documents: Array<{                   // Uploaded documents
    id: string;
    type: 'clinical-note' | 'prior-tx' | 'labs' | 'referral' | 'order' | 'denial';
    uploadedAt: string;
    extractedFacts?: {
      diagnosis?: string;
      requestedDrug?: string;
      priorTherapies?: string[];
      prescriberType?: string;
      insuranceInfo?: string;
    };
  }>;
  status: 'missing-docs' | 'ready-for-eval' | 'complete';
  evaluation?: {
    id: string;
    policyVersion: string;
    status: 'covered' | 'pa-required' | 'likely-eligible' | 'not-covered' | 'preferred-alt' | 'unclear';
    checklist: Array<{
      criterion: string;
      status: 'pass' | 'missing' | 'unknown' | 'needs-review';
      patientFact?: string;
      policyEvidence?: string;
    }>;
    nextSteps?: {
      clinic: string[];
      patient: string[];
      analyst: string[];
    };
    evaluatedAt: string;
  };
  createdAt: string;
}
```

### Coverage Evaluation Result

```typescript
{
  id: string;                          // Eval ID
  caseId: string;                      // Link to patient case
  policyId: string;                    // Link to policy
  status: 'covered' | 'pa-required' | 'likely-eligible' | 'not-covered' | 'preferred-alt' | 'unclear';
  checklist: Array<{
    criterion: string;                 // Policy requirement
    status: 'pass' | 'missing' | 'unknown' | 'needs-review';
    matchedFact?: string;              // Patient fact that satisfies
    policyEvidence: string;            // Source policy snippet
    confidence: number;                // 0-1 confidence score
  }>;
  evaluatedAt: string;
}
```

---

## File Structure

```
src/
├── frontend/
│   ├── App.tsx                        # Main app component
│   ├── styles.css                     # Design system CSS
│   └── components/
│       ├── PolicyCard.tsx
│       ├── CompareTable.tsx
│       ├── HeatMap.tsx
│       ├── KnowledgeGraph.tsx
│       ├── ChatInterface.tsx
│       ├── PatientCase.tsx
│       ├── CoverageEvaluation.tsx
│       ├── EvidenceExplorer.tsx
│       └── ... (40+ components)
├── backend/
│   ├── server.ts                      # Express server + MCP mount
│   ├── mcp/
│   │   ├── tools/
│   │   │   ├── list-policies.ts       # List all policies
│   │   │   ├── get-policy-summary.ts
│   │   │   ├── compare-drug.ts
│   │   │   ├── ask-policy-question.ts
│   │   │   ├── get-drug-coverage.ts
│   │   │   ├── get-prior-auth.ts
│   │   │   ├── check-patient-readiness.ts
│   │   │   ├── upload-policy.ts
│   │   │   ├── parse-policy.ts
│   │   │   ├── diff-policies.ts
│   │   │   ├── get-policy-evidence.ts
│   │   │   ├── search-policy-rules.ts
│   │   │   ├── extract-patient-facts.ts
│   │   │   ├── evaluate-patient.ts
│   │   │   ├── generate-next-steps.ts
│   │   │   └── get-case-summary.ts
│   │   └── index.ts                   # MCP server setup
│   ├── storage/
│   │   ├── policy-store.ts            # Policy CRUD + versioning
│   │   ├── patient-store.ts           # Patient case storage
│   │   ├── evaluation-store.ts        # Evaluation results
│   │   └── index.ts                   # Storage API
│   ├── domain/
│   │   ├── policy-normalization.ts    # Drug alias lookup
│   │   ├── pdf-extraction.ts          # PDF → text
│   │   ├── qa-engine.ts               # Hybrid Q&A (deterministic + LLM)
│   │   ├── fact-extraction.ts         # Patient fact extraction
│   │   ├── coverage-evaluation.ts     # Match patient → policy
│   │   ├── next-steps.ts              # Role-specific guidance
│   │   └── change-classification.ts   # Cosmetic/operational/clinical diffs
│   └── routes/
│       ├── policies.ts                # /api/policies
│       ├── patients.ts                # /api/patients
│       ├── evaluations.ts             # /api/evaluations
│       ├── chat.ts                    # /api/chat
│       ├── evidence.ts                # /api/evidence
│       └── health.ts                  # /api/health
├── shared/
│   ├── types.ts                       # TypeScript interfaces
│   ├── schemas.ts                     # Zod schemas
│   └── constants.ts                   # Constants (payer list, etc.)
├── storage/
│   ├── data/
│   │   ├── policies/
│   │   │   ├── structured/            # Normalized policy JSON
│   │   │   ├── raw/                   # Original PDFs
│   │   │   └── index.json             # Policy registry
│   │   ├── patients/                  # Patient case folders
│   │   ├── evaluations/               # Evaluation results
│   │   └── ingestion/
│   │       └── db.json                # Ingestion metadata
│   └── data.json                      # (Legacy from v1.0)
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
docs/
├── design-system.md                   # CSS properties, colors, typography
├── component-guide.md                 # Component usage + examples
├── knowledge-graph.md                 # Knowledge graph implementation
└── ...
.planning/
├── PROJECT.md                         # Project overview
├── REQUIREMENTS.md                    # v2.0 requirements with traceability
├── ROADMAP.md                         # Phase breakdown + progress
├── STATE.md                           # Current position + blockers
└── phases/
    ├── 06-policy-management.md
    ├── 07-policy-compare.md
    ├── 08-policy-changes.md
    ├── 09-patient-cases.md
    ├── 10-evidence-chat.md
    ├── 11-mcp-tools.md
    └── 12-portal-ui/
```

---

## Key Decisions & Rationale

| Decision | Rationale | Status |
|----------|-----------|--------|
| MCP over A2A | Prompt Opinion requirement; existing codebase | ✓ Validated |
| StreamableHTTP transport | Prompt Opinion expects this | ✓ Validated |
| Hybrid Q&A (deterministic + LLM) | Balances speed and hallucination risk | ✓ Validated |
| File-based JSON (not Supabase) | Demo scale doesn't need DB; faster prototyping | ✓ Validated |
| Keep TypeScript/Node stack | Avoid migration overhead; solid patterns | ✓ Validated |
| Vercel + Railway deployment | Serverless frontend + always-on backend | — Pending |
| Canonical policy schema (not FHIR) | Policies need own schema with rules + evidence | ✓ Validated |
| ngrok for POC, Railway for v2.0 | Speed to public URL for hackathon; then proper deployment | ✓ Validated |

---

## Deployment

### Development

```bash
# Install dependencies
npm install

# Start backend (port 3000)
npm run dev:server

# Start frontend (port 4173)
npm run dev

# Both servers running: frontend at http://localhost:4173, backend at http://localhost:3000
```

### Production (Vercel + Railway)

- **Frontend:** Deployed to Vercel (automatic on main branch)
- **Backend:** Deployed to Railway (Docker container)
- **MCP Server:** Exposed as `/mcp` endpoint via StreamableHTTP
- **Storage:** File-based JSON persisted in Railway persistent volume
- **Public URL:** Both Vercel and Railway provide public URLs for integration

---

## Next Steps for Hackathon

### Phase 12 Work (Portal UI + Dashboard + Deployment)

1. **Dashboard Page**
   - KPI cards: policies loaded count, active cases, PA required count, missing docs, recent changes
   - Quick-action buttons per role (clinic staff, analyst, patient)
   - Recent activity feed

2. **Role Switcher**
   - Clinic Staff view (default)
   - Payer Analyst view (more detail on policy internals)
   - Patient view (simplified, plain language)
   - Switcher in top navigation or settings

3. **Global Navigation**
   - 8 main sections: Dashboard, Policy Rules, Policy Compare, Policy Insights, Policy Changes, Patients, Evidence Explorer, Chat
   - Persistent left sidebar or top nav tabs
   - Active section indicator

4. **Deployment**
   - Push frontend to Vercel (via GitHub Actions or manual)
   - Push backend to Railway (Docker build, environment variables)
   - Verify all MCP tools work via public URLs
   - Run smoke tests against production deployment

### Testing Checklist

- [ ] Dashboard loads and displays correct KPI values
- [ ] Role switcher changes UI per role
- [ ] Global nav links work and active state is correct
- [ ] All pages load from production URLs
- [ ] MCP tools accessible via public endpoint
- [ ] File storage persists across backend restarts
- [ ] Frontend + backend communication works in production

---

## Important Context

### Blockers/Concerns

- **LLM Backend:** v1.0 used local Ollama — v2.0 should use Claude API or configurable backend. Need to decide on LLM provider and API keys for production.

### Deferred Follow-Up

- Add per-source ingestion metadata files under `data/ingestion/sources/{source_id}.json` with `db.json` as aggregate index. Currently using `db.json` as source-of-truth because that's what Phase 11 implemented.

### Sample Data

- **Policies:** BCBS NC (bevacizumab) + Cigna (rituximab) — synthetic/de-identified
- **Patients:** Synthetic demo patients with fake names and IDs
- **All data:** Demo scale only, not real patient data (compliance requirement)

---

## Contacts & Resources

- **Repository:** Local at `/Users/tanmaybhuskute/Documents/Policy-Intelligence`
- **Design System Docs:** `docs/design-system.md`
- **Component Guide:** `docs/component-guide.md`
- **Knowledge Graph:** `docs/knowledge-graph.md`
- **Backend API Health:** `GET /api/health` (lists policy, payer, drug, case, evaluation counts)
- **MCP Endpoint:** `/mcp` (StreamableHTTP transport)

---

## Success Definition for Hackathon

✅ **Phase 12 Complete:**
1. Dashboard page with KPI cards and quick actions
2. Role switcher functional (clinic staff / analyst / patient)
3. Global navigation with 8 sections all working
4. Frontend deployed to Vercel
5. Backend deployed to Railway
6. All public URLs working + MCP tools accessible
7. End-to-end smoke tests passing

This results in a **production-grade policy intelligence portal** ready for clinic staff, payer analysts, and patients to use.

---

*Built with ❤️ for better healthcare policy intelligence*
