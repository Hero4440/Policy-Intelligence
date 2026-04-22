# PolicyPilot — Medical Benefit Policy Intelligence Portal

## What This Is

PolicyPilot is a Medical Benefit Policy Intelligence Portal that ingests, normalizes, and compares payer drug policies, matches patient documents against coverage criteria, generates evidence-backed next steps for clinic staff, and exposes all functionality through an MCP server connected to Prompt Opinion. It serves three user types: clinic staff (primary), payer/formulary analysts (secondary), and patients (tertiary).

## Core Value

Every policy question answered must include source-backed evidence from loaded policy documents — and every coverage evaluation must show exactly which criteria are met, missing, or ambiguous.

## Current Milestone: v2.0 Full Product

**Goal:** Build the complete portal — persistent file-based storage, real policy management, patient case workflow, coverage evaluation engine, versioning/diffs, insights heat map, expanded MCP tools — deployed on Vercel + Railway.

**Target features:**
- Policy Management + Ingestion: upload PDFs, parse to structured rules, view/edit/version
- Policy Compare page: side-by-side drug coverage across payers with auto-diff highlights
- Policy Insights page: heat map (payer × rule type × coverage) + knowledge graph
- Policy Changes page: timeline, version diffs, materiality classification (cosmetic/operational/clinical)
- Patient Cases: create cases, upload documents, extract structured facts
- Coverage Evaluation: patient × policy matching with evidence-backed requirement checklist
- Next-Step Generator: role-specific guidance (clinic staff, patient, analyst)
- Evidence Explorer: keyword search across all policy evidence snippets
- Expanded MCP tools: 10 tools covering all portal capabilities
- Deployed on Vercel (frontend) + Railway (backend API)

## Requirements

### Validated

<!-- Shipped in v1.0 POC -->

- ✓ MCP server with StreamableHTTP transport — v1.0
- ✓ Stateless per-request MCP server pattern — v1.0
- ✓ Prompt Opinion `ai.promptopinion/fhir-context` extension — v1.0
- ✓ Policy data layer with Zod-validated PolicyRecord schema — v1.0
- ✓ Drug normalization via alias lookup (bevacizumab + rituximab families with biosimilar resolution) — v1.0
- ✓ FHIR client with bearer token auth — v1.0
- ✓ PDF text extraction pipeline — v1.0
- ✓ Express API server with MCP mounted as middleware — v1.0
- ✓ `list_policies` MCP tool — v1.0
- ✓ `get_policy_summary` MCP tool — v1.0
- ✓ `compare_drug_across_payers` MCP tool — v1.0
- ✓ `ask_policy_question` MCP tool with hybrid deterministic + LLM routing — v1.0
- ✓ `get_drug_coverage` MCP tool — v1.0
- ✓ `get_prior_auth_criteria` MCP tool — v1.0
- ✓ `check_patient_readiness` MCP tool — v1.0
- ✓ Health endpoint with policy/payer/drug/case/evaluation counts — v1.0
- ✓ CORS enabled for cross-origin MCP requests — v1.0
- ✓ React frontend with drug search, plan comparison, detail views — v1.0
- ✓ ngrok public deployment + Prompt Opinion integration — v1.0
- ✓ File-based storage layer: versioned policy files, diff engine, patient case folders, evaluation records — v1.0
- ✓ Startup disk reload: policy index rebuilt from disk on server start — v1.0

### Active

<!-- v2.0 scope -->

- [ ] Policy ingestion pipeline: PDF upload → parse → structured PolicyRecord → write to file store with versioning
- [ ] Policy Rules page: list all policies with payer/drug/status filters
- [ ] Policy Detail page with tabs: Overview, Products, Indications, Criteria, Evidence, Versions
- [ ] Structured Rules Editor: per-field edit, ambiguity flag, evidence link, version history
- [ ] Policy Compare page: select drug + payers, side-by-side table with auto-generated diff highlights
- [ ] Policy Insights page: heat map (payer × rule type × coverage status) + knowledge graph + evidence panel
- [ ] Policy Changes page: timeline + change table + materiality classification (cosmetic / operational / clinical)
- [ ] Version Diff page: structured changes + raw text diff + materiality tags
- [ ] Patient Cases page: create/list cases with payer, drug, diagnosis, status
- [ ] Patient Case Detail: documents, extracted facts, policy match, next steps
- [ ] Coverage Evaluation: patient × policy matching, requirement checklist, coverage status, evidence
- [ ] Next-Step Generator: role-specific guidance (clinic staff, payer analyst, patient-friendly)
- [ ] Evidence Explorer: full-text search across all policy evidence snippets
- [ ] Expanded MCP tools: upload_policy_document, parse_policy_document, list_policy_versions, diff_policy_versions, get_policy_evidence, search_policy_rules, extract_patient_facts, evaluate_patient_against_policy, generate_next_steps, get_case_summary
- [ ] Role switcher: Clinic Staff / Payer Analyst / Patient view modes
- [ ] Dashboard: KPI cards, recent activity, quick actions per role
- [ ] Deploy frontend to Vercel, backend to Railway
- [ ] Chat page: evidence-backed Q&A with sidebar evidence panel

### Out of Scope

- Real patient data — synthetic/de-identified only (compliance)
- OAuth / SSO — not needed for demo/hackathon scope
- Mobile app — web-first
- A2A protocol / Google ADK — MCP-based only
- Real-time notifications — future feature
- Multi-tenant org management — future feature
- Interactive D3 knowledge graph — static representation acceptable for v2.0
- Python/FastAPI rewrite — staying on TypeScript/Node stack
- Supabase / PostgreSQL — file-based JSON sufficient for demo scale

## Context

**v1.0 POC delivered:** Working MCP server (7 tools), 2 normalized policies (BCBS NC bevacizumab + Cigna rituximab), React frontend, ngrok deployment, full Prompt Opinion integration, and file-based storage layer (versioned policies, patient cases, evaluations, startup reload). 7,611 lines TypeScript.

**Storage decision:** v2.0 uses file-based JSON in `data/` — not Supabase. Demo scale doesn't need a DB. Supabase is out of scope.

**Anton Rx challenge alignment:** Centralized source for medical benefit drug policies with ingestion, parsing, normalization, search, and comparison. Side-by-side comparison with Q&A and change tracking are highest-priority workflows.

**Deployment target:** Frontend → Vercel, Backend API → Railway. MCP server exposed as public `/mcp` endpoint via StreamableHTTP.

**Users:**
- **Clinic staff (primary):** Is drug covered? PA needed? What documents are missing? What to submit next?
- **Payer analyst (secondary):** Upload/compare policies, track changes, audit evidence, understand drug positioning
- **Patient (tertiary):** Simplified status — covered / PA required / not covered / clinic needs these docs

**Existing codebase carries forward:**
- MCP server patterns (`src/mcp/`) — extend with new tools, keep transport
- Policy schema (Zod) — extend as needed
- Drug alias normalization — keep, extend
- PDF extraction pipeline — keep, wire to file store
- React frontend (`src/frontend/`) — extend with new pages
- Express server — keep, add file-store-backed routes
- Storage layer (`src/storage/`) — built in v1.0, all v2.0 features build on this

## Constraints

- **Stack:** TypeScript/Node.js + React — build on existing codebase, no framework switch
- **Storage:** File-based JSON in `data/` — no database
- **Deployment:** Vercel (frontend) + Railway (backend)
- **Data:** Synthetic/de-identified patient data only
- **MCP transport:** StreamableHTTP — Prompt Opinion requirement
- **Response format:** Every MCP tool returns: human_readable, structured_result, evidence[], confidence
- **Evidence grounding:** Every answer and evaluation cites source policy text — no hallucination
- **LLM:** Hybrid deterministic + LLM (Claude API) for Q&A and fact extraction

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MCP over A2A | Prompt Opinion MCP integration requirement; existing codebase | ✓ Good |
| Build on existing codebase | MCP/policy infrastructure already built; faster than starting fresh | ✓ Good |
| StreamableHTTP transport | Prompt Opinion expects this; existing codebase implements it | ✓ Good |
| Hybrid Q&A (deterministic + LLM) | Pure deterministic misses complex questions; pure LLM risks hallucination | ✓ Good |
| Two documents only for POC | BCBS NC + Cigna sufficient to prove cross-payer comparison | ✓ Good |
| ngrok for POC deployment | Fastest path to public URL for hackathon | ✓ Good |
| File-based JSON storage (not Supabase) | Demo scale doesn't need a DB; avoids complexity; decided during v2.0 planning | ✓ Good |
| Vercel + Railway for v2.0 deploy | Frontend on Vercel, backend on Railway — serverless + always-on API | — Pending |
| Keep TypeScript/Node stack | Avoid migration overhead; existing patterns are solid | ✓ Good |
| Canonical policy schema (not FHIR) | FHIR is for patient data; policies need own schema with rules, evidence, versioning | ✓ Good |

---
*Last updated: 2026-04-22 after v1.0 POC milestone completion*
