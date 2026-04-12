# Roadmap: PolicyLens MCP

## Overview

PolicyLens MCP transforms medical-benefit drug policy PDFs into an intelligent MCP server that answers coverage questions with source-backed evidence. The journey starts with normalizing two policy documents (BCBS NC and Cigna) into structured data with evidence mappings, then builds four MCP tools on that foundation (list, summarize, compare, Q&A), and deploys via ngrok for Prompt Opinion integration. Each phase delivers a complete, verifiable capability that builds toward the core value: every policy question answered includes evidence from loaded policy documents.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Policy Data Foundation** - Normalize BCBS NC and Cigna policies with evidence mappings and drug aliases
- [ ] **Phase 2: Core MCP Tools** - Build deterministic tools (list, summary, compare) with evidence grounding
- [ ] **Phase 3: Hybrid Q&A Engine** - Build natural language Q&A tool with LLM fallback and validation
- [ ] **Phase 4: Deployment + Integration** - Deploy via ngrok and validate Prompt Opinion integration

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
**Plans**: TBD

Plans:
- [ ] TBD

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
**Plans**: TBD

Plans:
- [ ] TBD

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
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 4: Deployment + Integration
**Goal**: MCP server publicly accessible via ngrok and fully integrated with Prompt Opinion
**Depends on**: Phase 3
**Requirements**: DEPL-01, DEPL-02, DEPL-03, DEPL-04, DEPL-05, DEMO-01, DEMO-02, DEMO-03
**Success Criteria** (what must be TRUE):
  1. MCP server running with ngrok tunnel providing public HTTPS URL
  2. Prompt Opinion connects to server and discovers all 4 tools (list_policies, get_policy_summary, compare_drug_across_payers, ask_policy_question)
  3. All 4 tools callable from Prompt Opinion with correct StreamableHTTP transport and CORS headers
  4. Health endpoint accessible and returns accurate policy/payer/drug counts
  5. Demo scenario works: bevacizumab cross-payer comparison shows BCBS NC preferred/non-preferred distinction
  6. Demo scenario works: rituximab Q&A from Prompt Opinion returns evidence-backed answer about Cigna prior auth criteria
**Plans**: TBD

Plans:
- [ ] TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Policy Data Foundation | 0/TBD | Not started | - |
| 2. Core MCP Tools | 0/TBD | Not started | - |
| 3. Hybrid Q&A Engine | 0/TBD | Not started | - |
| 4. Deployment + Integration | 0/TBD | Not started | - |
