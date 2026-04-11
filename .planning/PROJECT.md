# PolicyLens MCP — Hackathon POC

## What This Is

An AI-powered MCP server that ingests, normalizes, and compares medical-benefit drug policies from different health plans, then answers evidence-backed questions about coverage rules. Deployed via ngrok and connected to Prompt Opinion as a "superpower" for policy analysts. Built for a hackathon — fast, pragmatic, working.

## Core Value

Every policy question answered must include source-backed evidence from loaded policy documents. No evidence, no answer.

## Requirements

### Validated

<!-- Inferred from existing codebase — already built and working. -->

- ✓ MCP server with StreamableHTTP transport — existing (`src/mcp/index.ts`)
- ✓ Stateless per-request MCP server pattern — existing
- ✓ Prompt Opinion `ai.promptopinion/fhir-context` extension — existing
- ✓ Policy data layer with Zod-validated PolicyRecord schema — existing (`src/mcp/policy_store/`)
- ✓ Drug normalization via alias lookup — existing (`data/lookup/drug-aliases.ts`)
- ✓ FHIR client with bearer token auth — existing (`src/mcp/fhir/`)
- ✓ PDF text extraction pipeline — existing (`src/server/ingestion/`)
- ✓ Express API server with MCP mounted as middleware — existing (`src/server/index.ts`)
- ✓ `get_drug_coverage` MCP tool — existing
- ✓ `get_prior_auth_criteria` MCP tool — existing
- ✓ `check_patient_readiness` MCP tool — existing
- ✓ Health endpoint with policy/payer/drug counts — existing
- ✓ CORS enabled for cross-origin MCP requests — existing
- ✓ React frontend with drug search, plan comparison, detail views — existing

### Active

<!-- POC scope — what we're building now. -->

- [ ] `list_policies` tool — returns loaded policies with basic metadata (payer, title, effective date, drug family)
- [ ] `get_policy_summary` tool — returns structured normalized summary for one policy with all extracted fields
- [ ] `compare_drug_across_payers` tool — input drug_family, returns side-by-side comparison across loaded payers
- [ ] `ask_policy_question` tool — natural-language question, returns grounded answer with evidence (hybrid: deterministic first, LLM fallback)
- [ ] Normalized policy extraction for each document: payer, policy title, effective date, drug family, preferred products, non-preferred products, prior auth required, step/fail-first logic, covered indications, notable restrictions, evidence snippets mapped to each field
- [ ] Structured response format for all tools: human-readable answer + structured_result + evidence list + confidence
- [ ] Evidence grounding — every answer includes source-backed evidence from policy docs; if unclear, say so
- [ ] BCBS NC Preferred Injectable Oncology Program policy loaded and normalized
- [ ] Cigna Rituximab IV Non-Oncology policy loaded and normalized
- [ ] Bevacizumab cross-payer comparison working
- [ ] Rituximab Q&A working
- [ ] Public deployment via ngrok
- [ ] Prompt Opinion can connect and discover all tools

### Out of Scope

<!-- Explicitly excluded for this POC. -->

- Full web portal — POC uses Prompt Opinion as the product surface
- User authentication — MCP is stateless, no session auth needed
- Patient dashboard — future product feature
- Heat map / visual analytics — future product feature
- Knowledge graph — future product feature
- Change-tracking UI — future product feature
- Full patient-policy matching workflow — existing `check_patient_readiness` covers basics
- Universal parser for every payer format — only BCBS NC and Cigna for POC
- Production-grade enterprise architecture — hackathon-friendly pragmatism
- A2A protocol / Google ADK — we're MCP-based, not A2A

## Context

**Hackathon:** Solution must function within Prompt Opinion, which supports MCP-based "superpowers." Our own portal comes later.

**Real-world problem:** Analysts manually read payer PDFs to compare medical-benefit drug coverage, prior authorization criteria, preferred vs non-preferred products, and policy changes. This is slow, error-prone, and doesn't scale.

**Domain:** Medical benefit drug policies (NOT standard pharmacy formulary lookup). Covers injectable oncology drugs, biosimilars, prior authorization criteria, step therapy, and fail-first logic.

**Drug families in scope:** Bevacizumab, Rituximab.

**Policy documents in scope:**
1. BCBS NC — Preferred Injectable Oncology Program
2. Cigna — Rituximab Intravenous Products for Non-Oncology Indications

**Existing codebase:** Significant infrastructure already built — MCP server, policy store, drug normalization, FHIR integration, ingestion pipeline, React frontend. POC builds on this foundation.

**Reference projects:**
- `po-community-mcp` — Official Prompt Opinion MCP reference (TypeScript). Direct pattern for StreamableHTTP transport, tool registration, FHIR context headers.
- `po-adk-python` — Official Prompt Opinion ADK reference (Python/A2A). Shows FHIR integration patterns but uses different protocol.

**Expected factual behavior:**
- BCBS NC clearly separates preferred and non-preferred bevacizumab and rituximab products
- Cigna rituximab IV policy clearly requires prior authorization
- Cross-payer comparison should surface these differences in structured format

## Constraints

- **Platform:** Must deploy as MCP server connectable from Prompt Opinion via StreamableHTTP transport
- **Deployment:** Public URL via ngrok (localhost tunneled)
- **Data:** Only synthetic or de-identified data if patient-like data introduced
- **Documents:** Only BCBS NC and Cigna policies for this POC
- **Drug families:** Only Bevacizumab and Rituximab
- **Stack:** TypeScript/Node.js with Express — build on existing codebase
- **LLM for Q&A:** Hybrid approach — deterministic lookup first, LLM fallback for complex questions (Ollama local or configurable)
- **Response format:** Every tool must return: human-readable answer, structured_result object, evidence list, confidence level
- **Honesty:** Never hallucinate missing facts. If unclear, say it is unclear.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MCP over A2A | Prompt Opinion MCP integration is the hackathon requirement; existing codebase already uses MCP | — Pending |
| Build on existing codebase | Significant MCP/policy infrastructure already built; faster than starting fresh | — Pending |
| StreamableHTTP transport | Prompt Opinion expects this; existing codebase already implements it | — Pending |
| Hybrid Q&A (deterministic + LLM) | Pure deterministic misses complex questions; pure LLM risks hallucination; hybrid balances both | — Pending |
| Two documents only | BCBS NC + Cigna sufficient to prove cross-payer comparison; keep scope tight for hackathon | — Pending |
| ngrok for public deployment | Fastest path to public URL for hackathon demo; no cloud infra needed | — Pending |

---
*Last updated: 2026-04-11 after initialization*
