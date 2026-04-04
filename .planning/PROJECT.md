# PolicyPilot

## What This Is

PolicyPilot is an MCP server that integrates into the Prompt Opinion healthcare agent platform to provide prior authorization readiness capabilities. It exposes 3 tools — drug coverage lookup, PA criteria inspection, and patient readiness gap analysis — backed by a curated store of real payer policy data. Prompt Opinion provides the chat UI, agent orchestration, and FHIR patient context via SHARP extension specs. The MCP server is the hackathon deliverable; Prompt Opinion is the runtime platform.

## Core Value

A prior auth specialist can ask a natural language question about a patient's drug coverage and get back a grounded answer citing real policy language — coverage status, required criteria, and what's missing — in seconds instead of hours of manual PDF review.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] MCP server exposes 3 tools: get_drug_coverage, get_prior_auth_criteria, check_patient_readiness
- [ ] Policy rules store contains real extracted data from 3-5 public payer PDFs for one therapeutic area
- [ ] MCP server accepts FHIR context via SHARP token from Prompt Opinion
- [ ] MCP server registered and functional within Prompt Opinion workspace
- [ ] Synthetic patient data available via Synthea + hand-crafted demo patients
- [ ] Readiness logic identifies matched vs missing requirements with cautious clinical wording
- [ ] System is deployed and accessible via URL for demo/judging
- [ ] Demo flow covers: coverage check → criteria inspection → patient readiness gap analysis

### Out of Scope

- Live user PDF upload — preloaded corpus only for MVP
- Admin dashboard — team loads data directly
- Multi-agent system — single agent orchestration
- Vector database — structured JSON lookups sufficient
- Policy change tracking — static dataset for now
- Full payer comparison engine — one query at a time
- Production security stack — demo-grade auth acceptable
- Multiple therapeutic areas — one domain only
- Real patient data — synthetic only
- Custom chat UI — Prompt Opinion provides the UI
- Own LLM integration — Prompt Opinion handles agent orchestration

## Context

**Platform:** Prompt Opinion (app.promptopinion.ai) — external healthcare agent platform providing chat UI, agent orchestration, FHIR patient context (SHARP specs), MCP integration surface, and marketplace publishing. We build an MCP server that plugs into it.

**Hackathon:** "Agents Assemble" — build MCP servers or A2A agents that integrate with Prompt Opinion. Option 1 (our path): Build an MCP server with healthcare tools. Must demo within Prompt Opinion platform. Submit 3-minute video.

**Origin:** Combines two prior hackathon concepts — (1) Prompt Opinion + MCP + FHIR context and (2) medical benefit drug policy parsing/lookup (Anton RX track).

**Payer data sources (public):**
- UnitedHealthcare: medical benefit drug policies including Rituximab policy (Jan 2026), Medical Benefit Drug Clinical Program Drug List
- Aetna: Medical Clinical Policy Bulletins, RA-related drug criteria (etanercept, adalimumab), RA specialty management pages
- Cigna: inflammatory-conditions specialty management, prior-authorization policy PDFs (Simponi Aria, Orencia)

**Patient data:** Synthea-generated FHIR bundles filtered for relevant conditions + 2-3 hand-crafted demo patients with specific coverage scenarios (full match, partial match, missing requirements).

**Therapeutic area:** To be finalized — candidates are rheumatoid arthritis biologics, migraine biologics, multiple sclerosis drugs, or infusion specialty drugs. RA biologics recommended due to available public policy documents.

**Team:** Solo developer + Claude. 2-day hackathon timeline.

**Product vision:** Hackathon MVP but architected for product future — clean component boundaries, extensible schema, modular tools so components can be swapped post-hackathon without rewriting.

## Constraints

- **Timeline**: 2-day hackathon — ruthless prioritization required
- **Team**: Solo developer — no parallel human workstreams
- **Tech stack**: Python MCP server (mcp[cli]), no custom frontend (Prompt Opinion is the UI)
- **Data store**: JSON files for MVP (schema designed for future DB migration)
- **Deployment**: Must be accessible via URL for judges
- **Data quality**: Policy data must reflect real policy language and structure — not fabricated
- **Clinical language**: All patient-facing outputs use cautious wording ("may be missing", "appears to match", "likely")

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| JSON over SQLite for policy store | Maximum build speed for 3-5 policies; schema maps to DB later | — Pending |
| Python for MCP server | Team preference; good ecosystem for healthcare/FHIR libraries | — Pending |
| Integrate with Prompt Opinion platform | Required by hackathon; provides UI, agent, FHIR context for free | — Pending |
| Synthea + hand-crafted patients | Synthea for realism, hand-crafted for guaranteed demo scenarios | — Pending |
| Single therapeutic area | Depth over breadth; 3-5 policies done well beats 20 done poorly | — Pending |
| Cautious clinical wording | Healthcare context demands hedged language; reduces liability risk | — Pending |
| Product-future architecture | Clean boundaries now save rewrite later; minimal extra effort | — Pending |

---
*Last updated: 2026-04-04 after Prompt Opinion platform clarification*
