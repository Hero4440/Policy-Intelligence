# PolicyPilot

## What This Is

PolicyPilot is a patient-aware Prior Authorization Readiness Agent that helps prior auth specialists determine drug coverage, inspect payer criteria, and identify what's missing before submission. It combines a chat-based UI ("Prompt Opinion"), an MCP policy server backed by curated real payer policy data, and synthetic FHIR patient context to deliver grounded, evidence-cited answers.

## Core Value

A prior auth specialist can ask a natural language question about a patient's drug coverage and get back a grounded answer citing real policy language — coverage status, required criteria, and what's missing — in seconds instead of hours of manual PDF review.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] MCP server exposes 3 tools: get_drug_coverage, get_prior_auth_criteria, check_patient_readiness
- [ ] Policy rules store contains real extracted data from 3-5 public payer PDFs for one therapeutic area
- [ ] Agent combines FHIR patient context with policy lookup to produce grounded answers
- [ ] Chat UI accepts natural language questions and displays evidence-cited responses
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
- Video/media in chat — text responses only

## Context

**Origin:** Innovation hackathon combining two prior hackathon concepts — (1) Prompt Opinion + MCP + FHIR context and (2) medical benefit drug policy parsing/lookup.

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
- **Tech stack**: Python backend (MCP server), flexible frontend
- **Data store**: JSON files for MVP (schema designed for future DB migration)
- **Deployment**: Must be accessible via URL for judges
- **Data quality**: Policy data must reflect real policy language and structure — not fabricated
- **Clinical language**: All patient-facing outputs use cautious wording ("may be missing", "appears to match", "likely")

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| JSON over SQLite for policy store | Maximum build speed for 3-5 policies; schema maps to DB later | — Pending |
| Python for MCP server | Team preference; good ecosystem for healthcare/FHIR libraries | — Pending |
| Own UI rather than existing platform | Full control over demo experience; "Prompt Opinion" is our interface | — Pending |
| Synthea + hand-crafted patients | Synthea for realism, hand-crafted for guaranteed demo scenarios | — Pending |
| Single therapeutic area | Depth over breadth; 3-5 policies done well beats 20 done poorly | — Pending |
| Cautious clinical wording | Healthcare context demands hedged language; reduces liability risk | — Pending |
| Product-future architecture | Clean boundaries now save rewrite later; minimal extra effort | — Pending |

---
*Last updated: 2026-04-03 after initialization*
