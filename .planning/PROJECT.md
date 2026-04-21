# PolicyPilot — Medical Benefit Policy Intelligence Portal

## What This Is

PolicyPilot is a Medical Benefit Policy Intelligence Portal that ingests, normalizes, and compares payer drug policies, matches patient documents against coverage criteria, generates evidence-backed next steps for clinic staff, and exposes all functionality through an MCP server connected to Prompt Opinion. It serves three user types: clinic staff (primary), payer/formulary analysts (secondary), and patients (tertiary).

## Core Value

Every policy question answered must include source-backed evidence from loaded policy documents — and every coverage evaluation must show exactly which criteria are met, missing, or ambiguous.

## Current Milestone: v2.0 Full Product

**Goal:** Build the complete portal — persistent database, real policy management, patient case workflow, coverage evaluation engine, versioning/diffs, insights heat map, and expanded MCP tools — deployed on Vercel + Supabase.

**Target features:**
- Persistent Postgres database (Supabase) replacing in-memory policy store
- Multi-format policy ingestion pipeline writing to DB with versioning
- Policy Rules page: upload, parse, view, edit, version policies
- Policy Compare page: side-by-side drug coverage across payers
- Policy Insights page: heat map + knowledge graph
- Policy Changes page: version diffs with materiality classification
- Patient Cases: create cases, upload documents, extract facts
- Coverage Evaluation: patient × policy matching with checklist + evidence
- Next-Step Generator: role-specific guidance (clinic staff, patient, analyst)
- Evidence Explorer: search across all policy evidence snippets
- Expanded MCP tools: 10 tools covering all portal capabilities
- Deployed on Vercel (frontend) + Supabase (DB/storage) + Railway (backend API)

## Requirements

### Validated

<!-- Shipped in v1.0 POC -->

- ✓ MCP server with StreamableHTTP transport — Phase 1-4
- ✓ Stateless per-request MCP server pattern — Phase 1
- ✓ Prompt Opinion `ai.promptopinion/fhir-context` extension — Phase 1
- ✓ Policy data layer with Zod-validated PolicyRecord schema — Phase 1
- ✓ Drug normalization via alias lookup — Phase 1
- ✓ FHIR client with bearer token auth — Phase 1
- ✓ PDF text extraction pipeline — Phase 1
- ✓ Express API server with MCP mounted as middleware — Phase 1
- ✓ `list_policies` MCP tool — Phase 2
- ✓ `get_policy_summary` MCP tool — Phase 2
- ✓ `compare_drug_across_payers` MCP tool — Phase 2
- ✓ `ask_policy_question` MCP tool — Phase 3
- ✓ `get_drug_coverage` MCP tool — Phase 1
- ✓ `get_prior_auth_criteria` MCP tool — Phase 1
- ✓ `check_patient_readiness` MCP tool — Phase 1
- ✓ Health endpoint with policy/payer/drug counts — Phase 4
- ✓ CORS enabled for cross-origin MCP requests — Phase 1
- ✓ React frontend with drug search, plan comparison, detail views — Phase 1
- ✓ ngrok public deployment + Prompt Opinion integration — Phase 4

### Active

<!-- v2.0 scope -->

- [ ] Supabase Postgres schema: documents, policies, policy_versions, policy_products, policy_rules, policy_indications, policy_evidence, policy_diffs, patient_cases, patient_documents, patient_facts, coverage_evaluations
- [ ] Policy ingestion pipeline writes to DB with versioning and structured hash diffing
- [ ] Policy Rules page: upload, parse, view, edit structured rules with evidence
- [ ] Policy Detail page with tabs: Overview, Products, Indications, Criteria, Evidence, Versions
- [ ] Structured Rules Editor: per-field edit, ambiguity flag, evidence link, version history
- [ ] Policy Compare page: select drug + payers, side-by-side table with auto-generated diff highlights
- [ ] Policy Insights page: heat map (payer × rule type × coverage status) + knowledge graph + evidence panel
- [ ] Policy Changes page: timeline + change table + materiality classification (cosmetic / operational / clinical)
- [ ] Version Diff page: structured changes + raw text diff + materiality tags
- [ ] Patient Cases page: create/list cases with payer, drug, diagnosis, status
- [ ] Patient Case Detail page: tabs for Summary, Documents, Extracted Facts, Policy Match, Next Steps, Chat
- [ ] Patient Documents upload and extracted facts display
- [ ] Coverage Evaluation: patient × policy matching, requirement checklist, coverage status, evidence
- [ ] Next-Step Generator: role-specific guidance (clinic staff, payer analyst, patient-friendly)
- [ ] Evidence Explorer: full-text search across all policy evidence snippets
- [ ] Expanded MCP tools: upload_policy_document, parse_policy_document, list_policy_versions, diff_policy_versions, get_policy_evidence, search_policy_rules, extract_patient_facts, evaluate_patient_against_policy, generate_next_steps, get_case_summary
- [ ] Role switcher: Clinic Staff / Payer Analyst / Patient view modes
- [ ] Dashboard: KPI cards, recent activity, quick actions per role
- [ ] Deploy frontend to Vercel, backend to Railway, DB/storage to Supabase
- [ ] Supabase Storage for raw PDFs and patient documents
- [ ] Chat page: evidence-backed Q&A with sidebar evidence panel

### Out of Scope

- Real patient data — synthetic/de-identified only (compliance)
- OAuth / SSO — not needed for demo/hackathon scope
- Mobile app — web-first
- A2A protocol / Google ADK — MCP-based only
- Real-time notifications — future feature
- Multi-tenant org management — future feature
- Knowledge graph as interactive D3 visualization — phase 2+ if time allows; static representation acceptable for v2.0
- Python/FastAPI rewrite — staying on TypeScript/Node stack

## Context

**POC foundation:** v1.0 delivered a working MCP server (7 tools), 2 normalized policies (BCBS NC bevacizumab + Cigna rituximab), React frontend, ngrok deployment, and full Prompt Opinion integration. The data layer uses in-memory JSON files — v2.0 migrates this to persistent Supabase Postgres.

**Anton Rx challenge alignment:** The problem statement calls for a centralized source for medical benefit drug policies with ingestion, parsing, normalization, search, and comparison. The strongest MVP is side-by-side comparison with Q&A and change tracking as high-priority workflows.

**Deployment target:** Frontend → Vercel, Backend API → Railway (or Render), DB + Storage → Supabase. MCP server exposed as a public `/mcp` endpoint via Streamable HTTP.

**Users:**
- **Clinic staff (primary):** Is drug covered? PA needed? What documents are missing? What to submit next?
- **Payer analyst (secondary):** Upload/compare policies, track changes, audit evidence, understand drug positioning
- **Patient (tertiary):** Simplified status — covered / PA required / not covered / clinic needs these docs

**Existing codebase carries forward:**
- MCP server patterns (`src/mcp/`) — extend with new tools, keep transport
- Policy schema (Zod) — extend to full DB-backed schema
- Drug alias normalization — keep, extend
- PDF extraction pipeline — keep, wire to DB
- React frontend (`src/frontend/`) — extend with new pages
- Express server — keep, add DB-backed routes

## Constraints

- **Stack:** TypeScript/Node.js + React — build on existing codebase, no framework switch
- **Database:** Supabase Postgres + Supabase Storage — replaces in-memory store
- **Deployment:** Vercel (frontend) + Railway (backend) + Supabase (DB/storage)
- **Data:** Synthetic/de-identified patient data only
- **MCP transport:** StreamableHTTP — Prompt Opinion requirement
- **Response format:** Every MCP tool returns: human_readable, structured_result, evidence[], confidence
- **Evidence grounding:** Every answer and evaluation cites source policy text — no hallucination
- **LLM:** Hybrid deterministic + LLM (Ollama-compatible or Claude API) for Q&A and fact extraction

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MCP over A2A | Prompt Opinion MCP integration requirement; existing codebase | ✓ Good |
| Build on existing codebase | MCP/policy infrastructure already built; faster than starting fresh | ✓ Good |
| StreamableHTTP transport | Prompt Opinion expects this; existing codebase implements it | ✓ Good |
| Hybrid Q&A (deterministic + LLM) | Pure deterministic misses complex questions; pure LLM risks hallucination | ✓ Good |
| Two documents only for POC | BCBS NC + Cigna sufficient to prove cross-payer comparison | ✓ Good |
| ngrok for POC deployment | Fastest path to public URL for hackathon | ✓ Good |
| Supabase Postgres for v2.0 | Persistent storage, file storage, row-level security, hosted — replaces in-memory store | — Pending |
| Vercel + Railway for v2.0 deploy | Frontend on Vercel (Next.js/React), backend on Railway — serverless + always-on API | — Pending |
| Keep TypeScript/Node stack | Avoid migration overhead; existing patterns are solid | — Pending |
| Canonical policy schema (not FHIR) | FHIR is for patient data; policies need their own schema with rules, evidence, versioning | — Pending |

---
*Last updated: 2026-04-21 after v2.0 milestone start*
