# Domain Pitfalls

**Domain:** Prior Authorization Readiness Agent
**Researched:** 2026-04-04

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Policy Data Extraction Quality
**What goes wrong:** Extracted policy fields are incomplete, mismatched, or miss conditional logic (e.g., "Drug X requires prior therapy failure of TWO conventional DMARDs" gets stored as just "prior therapy required").
**Why it happens:** Payer PDFs use dense, legalistic language with nested conditions, exceptions, and cross-references. Semi-manual extraction under time pressure leads to oversimplification.
**Consequences:** MCP tools return incorrect criteria. Demo shows wrong requirements. Judges with healthcare background will notice immediately.
**Prevention:**
- Extract ONE policy end-to-end first as a template before doing the rest
- Include the full conditional text in `evidence_text` field — don't paraphrase
- Store exact quotes from policy documents, not summaries
- Have extraction output reviewed against source PDF before demo
**Detection:** Tool returns that don't match what you see in the PDF. Readiness check that misses a known requirement.
**Phase:** Phase 1 (Data Preparation) — this is the foundation. Bad data = bad everything.

### Pitfall 2: LLM Hallucinating Coverage Decisions
**What goes wrong:** Claude makes up coverage rules that aren't in your policy data, or states things definitively that should be hedged.
**Why it happens:** Claude has training data about drug policies and may "fill in" gaps with plausible-sounding but fabricated policy details. Tool results get mixed with hallucinated context.
**Consequences:** Agent states incorrect coverage information. In a healthcare context, this is a serious credibility issue. AMA has flagged that AI-driven PA decisions already produce 16x higher denial rates when poorly implemented.
**Prevention:**
- System prompt must explicitly say: "Only use information returned by tools. Never state coverage information from your own knowledge."
- Tool responses include `evidence_text` — instruct Claude to quote it
- Add "Source: [policy document name]" to every coverage statement
- Use cautious language templates: "Based on the policy on file...", "The available policy data indicates..."
**Detection:** Response mentions drugs, plans, or criteria not in your JSON store. Response lacks evidence citations.
**Phase:** Phase 4 (Agent Integration) — must be addressed in system prompt design.

### Pitfall 3: MCP Tool Schema Mismatch
**What goes wrong:** Tool input/output schemas don't match what Claude expects. Claude sends wrong parameter types, or tool responses are formatted in ways Claude can't parse well.
**Why it happens:** MCP tool definitions need precise type annotations and clear descriptions. Vague tool descriptions lead Claude to misuse tools or hallucinate parameters.
**Consequences:** Tool calls fail silently. Agent gives generic responses instead of grounded answers. Demo breaks mid-flow.
**Prevention:**
- Use Pydantic models for tool inputs and outputs
- Write detailed tool docstrings — Claude reads these to decide how to use tools
- Test each tool in MCP Inspector before connecting to agent
- Include example values in parameter descriptions
**Detection:** Claude calls tools with wrong parameters. Tool returns error responses. Agent falls back to generic answers.
**Phase:** Phase 2 (MCP Server) — test tools in isolation before integration.

## Moderate Pitfalls

### Pitfall 4: FHIR Bundle Parsing Fragility
**What goes wrong:** Code assumes specific FHIR resource structure that varies between Synthea-generated and hand-crafted patients. Missing fields cause crashes.
**Why it happens:** Synthea bundles have consistent structure, but hand-crafted ones may differ. FHIR is flexible — same data can be represented differently.
**Prevention:**
- Use fhir.resources for validation (Pydantic catches missing fields)
- Always use `.get()` or optional fields when extracting patient data
- Create a `parse_patient_context()` function that handles both Synthea and hand-crafted formats
- Test with both data sources early
**Phase:** Phase 3 (Patient Context) — test with multiple patient formats.

### Pitfall 5: Scope Creep Under Time Pressure
**What goes wrong:** Adding features during demo prep. "What if we also show..." turns into 4 hours of unplanned work.
**Why it happens:** Solo developer + hackathon adrenaline. Each feature seems small but compounds.
**Prevention:**
- Lock the 3-tool scope: coverage, criteria, readiness. Nothing else.
- If a cool idea comes up, write it in a "v2 ideas" file and move on
- Demo script written BEFORE building. Only build what the script needs.
- Set a hard cutoff: stop coding 4 hours before demo to test and polish
**Phase:** All phases — discipline required throughout.

### Pitfall 6: Deployment Surprises
**What goes wrong:** App works locally, fails when deployed. Environment variables missing, ports wrong, dependencies not installed.
**Why it happens:** Deployment is the last step, done under time pressure with no buffer.
**Prevention:**
- Deploy a "hello world" version at the START (Day 1 morning)
- Use Railway/Render/Streamlit Cloud with git-push deployment
- Test deployment after each major component, not just at the end
- Keep a `.env.example` file from the start
**Detection:** App crashes on deployment platform. Logs show import errors or missing env vars.
**Phase:** Phase 1 (setup) — deploy skeleton immediately. Phase 6 (final) — final deployment.

### Pitfall 7: Patient Readiness Logic Over-Engineering
**What goes wrong:** Trying to build a sophisticated matching engine that handles every edge case in policy requirements.
**Why it happens:** Healthcare requirements are genuinely complex. Easy to get pulled into handling conditional logic, partial matches, etc.
**Prevention:**
- Simple field-by-field comparison: requirement exists → check patient data → matched/missing
- Use cautious wording for everything: "appears to match", "may be missing", "documentation may be needed"
- Don't try to handle: date ranges, dosage matching, lab value thresholds beyond basic comparison
- 3 output categories only: matched, missing, documentation_needed
**Phase:** Phase 4 (Readiness Logic) — keep it simple.

## Minor Pitfalls

### Pitfall 8: Demo Patient Doesn't Tell a Story
**What goes wrong:** Synthetic patient data is generic. Demo shows "everything matches" or "nothing matches" — no interesting narrative.
**Prevention:**
- Hand-craft 3 demo patients: (1) fully qualified — all criteria met, (2) partially qualified — 1-2 missing requirements, (3) wrong diagnosis — coverage doesn't apply
- Patient #2 is the hero of the demo — shows the system's real value

### Pitfall 9: Inconsistent Drug/Plan Naming
**What goes wrong:** Policy data uses "adalimumab" but user asks about "Humira". Tool can't match.
**Prevention:**
- Include both brand and generic names in policy data
- Add a drug_aliases field to policy records
- System prompt tells Claude to normalize drug names before tool calls

### Pitfall 10: No Error Handling in Demo Flow
**What goes wrong:** Unexpected input during live demo causes unhandled error, breaking the flow.
**Prevention:**
- Add try/except around all tool handlers
- Return graceful "I couldn't find policy data for that combination" messages
- Practice the exact demo flow 3+ times before presenting

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Data preparation | Oversimplified extraction | Extract one policy completely first as template |
| MCP server | Tool schema issues | Test with MCP Inspector before integration |
| Patient context | Bundle parsing failures | Use fhir.resources validation, test both formats |
| Agent integration | Hallucinated coverage info | Strict system prompt, evidence-only responses |
| Readiness logic | Over-engineering matching | Simple field comparison + cautious wording |
| Deployment | Last-minute failures | Deploy skeleton on Day 1 morning |
| Demo | Boring patient scenarios | Hand-craft 3 patients with different stories |

## Sources

- [AMA: How AI is Leading to More PA Denials](https://www.ama-assn.org/practice-management/prior-authorization/how-ai-leading-more-prior-authorization-denials)
- [Stanford: AI-Driven Insurance Decisions Raise Concerns](https://news.stanford.edu/stories/2026/01/ai-algorithms-health-insurance-care-risks-research)
- [Health Affairs: AI in Utilization Review](https://www.healthaffairs.org/doi/10.1377/hlthaff.2025.00897)
- [AKASA: 7 Prior Authorization Challenges](https://akasa.com/blog/prior-authorization-mistakes/)
