# Feature Landscape

**Domain:** Prior Authorization Readiness Tools
**Researched:** 2026-04-04

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Drug coverage lookup | First question any PA specialist asks. Without this, tool has no foundation. | Medium | Must support brand + generic names (Humira/adalimumab) |
| PA criteria display | Users need to know what documentation is required. This is the "job to be done." | Medium | Show diagnosis codes, lab values, failed therapy requirements, step therapy |
| Drug search/identification | Users may not know exact drug names. Must handle how they actually work. | Low | Autocomplete, brand/generic matching, synonym handling |
| Payer/plan selection | Coverage is plan-specific. Wrong plan = wrong answer. | Low | Simplified for MVP: payer specified in query or patient context |
| Form generation/pre-population | Industry standard since ~2015. Manual form filling seen as antiquated. | High | **OUT OF SCOPE for MVP** — no submission workflow |
| Status tracking | Users need to know where requests stand. Expected in any workflow tool. | Medium | **OUT OF SCOPE for MVP** — pre-submission focus only |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Patient readiness gap analysis | Most tools show criteria but don't analyze patient fit. Proactively prevents denials. PolicyPilot's CORE differentiator. | High | check_patient_readiness tool. Few competitors do this well. |
| Evidence citation & policy grounding | Transparent, auditable answers vs black-box AI. Builds trust in clinical context. | Medium | Tool responses include evidence_text with quoted policy language |
| Natural language query interface | Dramatically faster workflow. Users think in questions, not database queries. | High | "Prompt Opinion" chat UI. Most PA tools are form-based. |
| Multi-payer comparison | Useful for diverse patient populations. Side-by-side PA requirements. | Medium | OUT OF SCOPE for MVP. Easy to add post-hackathon. |
| Predictive approval likelihood | Estimate probability of PA approval. Actionable insight for prioritization. | Very High | OUT OF SCOPE — no training data for hackathon |
| Automated evidence gathering | Pull supporting docs from EHR, attach to PA. Saves 30-60 min per request. | Very High | OUT OF SCOPE — read-only FHIR context |
| Denial prediction & pre-emptive strengthening | Identify likely denial reasons, suggest strengthening actions before submission. | High | PARTIAL — readiness tool identifies gaps |
| Step therapy navigator | Guide users through required step therapy sequences with visual flowchart. | Medium | PARTIAL — criteria display includes step therapy |
| Real-time policy updates | Alert when payer policies change. Prevents stale data denials. | High | OUT OF SCOPE — static dataset |
| Therapeutic alternatives suggestion | If PA too complex, suggest alternative covered drugs for same indication. | High | OUT OF SCOPE — single drug query focus |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Live PDF upload & parsing | Very high complexity, 1-2 days just for parser, parsing errors in live demo catastrophic | Preload 3-5 curated policies as JSON |
| Admin dashboard | No value for demo, 4-8 hours for basic CRUD, judges won't see it | Edit JSON files directly |
| Multi-agent orchestration | Single agent + 3 tools sufficient, 6-12 hours debugging agent handoffs | Single agent with multiple MCP tools |
| Vector database | Overkill for 3-5 policies, structured lookup is faster and more reliable | JSON file lookup with exact key matching |
| Policy change tracking | Static dataset for hackathon, no time dimension in demo | Single snapshot of policies (Jan 2026) |
| Full payer comparison engine | Dilutes focus, judges prefer depth over breadth | Single-payer queries |
| Production security stack | Synthetic data only, 1-2 days minimum, judges won't security-test | Minimal or no auth for hackathon |
| Multiple therapeutic areas | 2-3 hours per additional area, depth wins hackathons | RA biologics only |
| Real patient data | Weeks of legal/IT security, compliance risk | Synthea + hand-crafted demo patients |

## Feature Dependencies

```
Policy Data Quality → Coverage Lookup → Criteria Display → Readiness Analysis
                                                              ↑
FHIR Patient Context ─────────────────────────────────────────┘

MCP Server Stability → Chat Interface → Full Demo Flow

Drug Reference Data → Drug Search → Coverage Lookup accuracy
```

## MVP Recommendation

**Must Build (Core Demo Flow):**
1. Drug coverage lookup via MCP tool — P0
2. PA criteria display via MCP tool — P0
3. Patient readiness gap analysis via MCP tool — P0 (core differentiator)
4. Evidence-grounded responses with policy citations — P0
5. Natural language chat interface — P0

**Build if Time Permits:**
6. Drug search autocomplete (1-2 hrs, high ROI)
7. Visual evidence citations in UI (2 hrs, medium ROI)

**Defer Everything Else.**

**PolicyPilot's competitive angle:**
- "Prior Auth Copilot that tells you what's missing BEFORE you submit"
- "Grounded AI with citations — no hallucinations, just policy facts"
- "From hours of PDF reading to seconds of conversation"

## Competitive Landscape

| Competitor | Table Stakes | Differentiators | Weakness vs PolicyPilot |
|------------|-------------|-----------------|------------------------|
| CoverMyMeds | All | E-submission, 3000+ forms, payer integrations | Not patient-aware; no readiness analysis |
| Surescripts | All | Network effects (90% of prescribers), real-time eligibility | Workflow-focused, not intelligence-focused |
| Change Healthcare | All | Revenue cycle integration, predictive analytics | Enterprise-only; complex implementation |
| Waystar / Rhyme.ai | Partial | AI-driven form filling, approval prediction | Black-box AI; no evidence transparency |

## Sources

- [CoverMyMeds Features](https://www.covermymeds.health/articles/healthcare-technology/latent-health-intelligent-automation-fhir)
- [Top ePA Platforms 2026](https://intuitionlabs.ai/articles/electronic-prior-authorization-platforms)
- [Best PA Software 2026](https://softwarefinder.com/resources/top-ai-vendors-for-prior-authorization-in-healthcare)
- [AI Boosts PA Determinations](https://www.covermymeds.health/who-we-serve/provider/health-systems/ai-boosts-prior-authorization-determinations-at-scale)
- [CMS PA Final Rule 2026](https://www.cms.gov/newsroom/fact-sheets/cms-interoperability-and-prior-authorization-final-rule-cms-0057-f)
