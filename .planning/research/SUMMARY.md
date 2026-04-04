# Research Summary: PolicyPilot

**Domain:** Prior Authorization Readiness Agent
**Researched:** 2026-04-04
**Overall confidence:** MEDIUM-HIGH

## Executive Summary

PolicyPilot sits at the intersection of healthcare prior authorization automation and AI-powered clinical decision support. The prior authorization space is massive — CoverMyMeds alone processed 43M+ PAs in Q1 2025 — but existing tools focus on submission workflow (forms, e-fax, status tracking) rather than pre-submission intelligence. PolicyPilot's patient-aware readiness analysis fills a genuine gap: most tools show criteria but don't analyze whether a specific patient meets them.

The technical stack is well-supported. The MCP Python SDK (mcp[cli]) provides decorator-based tool registration that maps directly to PolicyPilot's 3-tool architecture. FHIR patient data handling is mature via fhir.resources (Pydantic V2-powered), and Synthea provides realistic synthetic patient bundles. The primary technical risk is not the tools — it's the policy data extraction quality.

For a 2-day hackathon, the critical path is: policy data extraction (4-6 hrs) → JSON store + MCP server (3-5 hrs) → agent integration (2-3 hrs) → chat UI (2-3 hrs) → deployment (2-3 hrs). The data preparation phase is the bottleneck and should start immediately. A parallel track for FHIR patient data can run alongside.

The regulatory landscape is favorable: the CMS Interoperability and Prior Authorization Final Rule (effective January 1, 2026) mandates faster PA turnaround times, creating market pressure for tools that streamline the process. This gives PolicyPilot a compelling "why now" story for the demo.

## Key Findings

**Stack:** Python MCP server (mcp[cli]) + fhir.resources for FHIR parsing + Streamlit for rapid chat UI + Claude API for agent orchestration. Deploy via Railway/Streamlit Cloud.

**Table Stakes:** Drug coverage lookup, PA criteria display, drug search. PolicyPilot covers the first two via MCP tools. Form generation and status tracking are OUT OF SCOPE (pre-submission focus).

**Architecture:** Single-agent + 3 MCP tools + JSON policy store. Deterministic Python code handles all policy matching; Claude only presents results. Evidence-grounded responses with policy citations. FHIR patient context extracted to compact dict (not raw bundles).

**Critical pitfall:** Policy data extraction quality. Oversimplified extraction = wrong tool results = broken demo. Extract ONE policy end-to-end as template first. Include full conditional text, not paraphrases.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Data Foundation** — Extract policy data from PDFs into structured JSON, design schema, validate
   - Addresses: Policy rules store, data quality
   - Avoids: Pitfall #1 (extraction quality) by doing this first and thoroughly
   - Highest risk, start here

2. **MCP Server** — Build 3 MCP tools with proper schemas, test in isolation
   - Addresses: get_drug_coverage, get_prior_auth_criteria, check_patient_readiness
   - Avoids: Pitfall #3 (schema mismatch) via MCP Inspector testing

3. **Patient Context** — Set up Synthea + hand-crafted demo patients, build FHIR parser
   - Addresses: FHIR patient data, demo scenarios
   - Avoids: Pitfall #4 (bundle parsing fragility) via fhir.resources validation
   - Can partially parallel with Phase 2

4. **Agent Integration** — Connect Claude API with MCP tools, design system prompt, implement evidence-grounded responses
   - Addresses: Natural language interface, evidence citation, cautious clinical language
   - Avoids: Pitfall #2 (hallucinated coverage) via strict system prompt

5. **Chat UI & Deployment** — Build Streamlit chat interface, deploy to accessible URL
   - Addresses: User-facing interface, deployment requirement
   - Avoids: Pitfall #6 (deployment surprises) — deploy skeleton early

6. **Demo Polish** — Integration testing, demo script rehearsal, edge case handling
   - Addresses: Demo quality, error handling
   - Avoids: Pitfall #5 (scope creep) — only build what demo script needs

**Phase ordering rationale:**
- Data quality underpins everything — must be first
- MCP server depends on data schema
- Patient context is partially independent (parallel opportunity)
- Agent integration needs both MCP tools and patient context
- UI is thin layer on top of working agent
- Demo polish must have time reserved (don't skip this)

**Research flags for phases:**
- Phase 1: Likely needs deeper research on specific payer policy PDF structures
- Phase 2: Standard patterns from MCP docs, unlikely to need research
- Phase 4: May need research on Claude system prompt best practices for healthcare
- Phase 5: Standard deployment, unlikely to need research

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | MCP Python SDK well-documented, fhir.resources mature, Streamlit proven for rapid prototyping |
| Features | MEDIUM-HIGH | Competitive landscape well-understood; CoverMyMeds features verified via search |
| Architecture | HIGH | Single-agent + MCP tools is standard pattern; component boundaries are clear |
| Pitfalls | MEDIUM | Healthcare-specific pitfalls from domain knowledge + AMA/Stanford research; MCP-specific pitfalls less documented |

## Gaps to Address

- **Therapeutic area decision** — RA biologics recommended but not confirmed. Finalize before data extraction.
- **Deployment platform** — Railway vs Render vs Streamlit Cloud not benchmarked. Deploy skeleton early to validate.
- **Claude system prompt for healthcare** — Need to design and test the prompt that prevents hallucination while maintaining helpfulness. Research during Phase 4.
- **Policy PDF availability** — UHC, Aetna, Cigna policies confirmed as publicly available, but actual PDF download and extraction not tested.
