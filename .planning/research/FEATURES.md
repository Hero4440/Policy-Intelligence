# Feature Research

**Domain:** Medical-benefit drug policy intelligence MCP server (hackathon POC)
**Researched:** 2026-04-11
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Judges/Users Expect These)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| List available policies | Users need to know what data is loaded before querying | LOW | Return payer, title, drug families, effective date |
| Structured policy summary | Users expect to see normalized fields for any loaded policy | MEDIUM | Must extract: preferred/non-preferred products, PA requirements, step therapy, indications |
| Cross-payer drug comparison | Core value prop — side-by-side coverage differences | MEDIUM | Input drug family → return structured comparison across all loaded payers |
| Evidence-grounded Q&A | Every answer must cite source text from policy documents | HIGH | Hybrid: deterministic first, LLM for complex. Never answer without evidence |
| Source attribution | Users need to verify answers against original documents | LOW | Evidence snippets mapped to extracted fields |
| Confidence scoring | Users need to know how reliable each answer is | LOW | HIGH/MEDIUM/LOW based on whether answer is from structured data or LLM |
| Structured response format | MCP consumers expect parseable JSON, not just text | LOW | human_readable + structured_result + evidence[] + confidence |
| Graceful "I don't know" | Medical domain requires honesty about gaps | LOW | If data is unclear or missing, say so explicitly |

### Differentiators (Hackathon Competitive Advantage)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Preferred vs non-preferred product identification | Directly answers "which biosimilar does this plan prefer?" | MEDIUM | BCBS NC explicitly lists preferred/non-preferred for bevacizumab |
| Step therapy / fail-first logic extraction | Surfaces complex coverage rules that analysts spend hours reading | MEDIUM | Cigna requires specific step sequences for rituximab |
| Prior auth criteria detail | Goes beyond "PA required: yes" to extract specific criteria | MEDIUM | Diagnosis requirements, documentation needed, clinical criteria |
| Cross-payer criteria differences | Highlights where plans disagree on coverage rules | MEDIUM | Depends on compare tool + normalization quality |
| Natural language question handling | Users can ask in plain English, not structured queries | HIGH | LLM fallback for questions that don't match deterministic patterns |

### Anti-Features (Do NOT Build for POC)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Universal PDF parser | "Parse any payer document" | Every payer formats differently; universal parsing is a multi-month effort | Hand-normalize 2 specific documents |
| Real-time policy updates | "Keep data current" | Requires crawler infrastructure, change detection, versioning | Static loaded data, refresh manually |
| Patient-policy matching workflow | "Which plan covers my patient?" | Requires patient data, diagnosis matching, complex eligibility logic | Existing check_patient_readiness tool covers basics |
| Full analytics dashboard | "Visualize coverage landscape" | Frontend work distracts from MCP tool quality | Prompt Opinion IS the UI |
| Multi-indication coverage | "Cover all indications for a drug" | Exponential complexity with each indication added | Focus on primary indications in 2 docs |
| Appeal/exception guidance | "What to do if denied" | Complex legal/regulatory domain beyond policy parsing | Out of scope for POC |
| Formulary tier integration | "Include pharmacy benefit data" | Medical benefit ≠ pharmacy benefit; different data structures | Medical benefit only |

## Feature Dependencies

```
Normalized Policy Data (extraction + schema)
    ├──requires──> list_policies (needs metadata from normalized data)
    ├──requires──> get_policy_summary (needs all normalized fields)
    ├──requires──> compare_drug_across_payers (needs normalized data from multiple policies)
    └──requires──> ask_policy_question (needs structured data for deterministic lookup)

Drug Alias Normalization
    └──requires──> compare_drug_across_payers (must match "bevacizumab" across policies)

Evidence Grounding Engine
    ├──requires──> get_policy_summary (evidence snippets per field)
    ├──requires──> compare_drug_across_payers (evidence for each payer's position)
    └──requires──> ask_policy_question (evidence for every answer)

LLM Fallback (Ollama)
    └──requires──> ask_policy_question (for questions that don't match deterministic patterns)
```

### Dependency Notes

- **All tools require normalized policy data:** This is the foundation. Must be built first.
- **Evidence grounding is cross-cutting:** Every tool needs it, so the evidence extraction pattern must be established early.
- **LLM fallback only needed for ask_policy_question:** Other tools are fully deterministic.

## MVP Definition

### Launch With (POC v1)

- [x] Normalized policy data for BCBS NC + Cigna (foundation)
- [ ] `list_policies` — show what's loaded
- [ ] `get_policy_summary` — structured summary with evidence
- [ ] `compare_drug_across_payers` — side-by-side for bevacizumab/rituximab
- [ ] `ask_policy_question` — hybrid Q&A with evidence grounding

### Defer

- Patient readiness integration with new tools (already exists as separate tool)
- Additional policy documents beyond BCBS NC + Cigna
- Change tracking / policy versioning
- Advanced analytics or visualizations

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Normalized policy data | HIGH | MEDIUM | P0 (foundation) |
| list_policies | MEDIUM | LOW | P1 |
| get_policy_summary | HIGH | MEDIUM | P1 |
| compare_drug_across_payers | HIGH | MEDIUM | P1 |
| ask_policy_question | HIGH | HIGH | P1 |
| Evidence grounding | HIGH | MEDIUM | P0 (cross-cutting) |
| Confidence scoring | MEDIUM | LOW | P1 |

## Sources

- Existing codebase analysis (`.planning/codebase/ARCHITECTURE.md`)
- Prompt Opinion MCP reference (`po-community-mcp`)
- Domain expertise: medical-benefit drug policy management workflows

---
*Feature research for: medical-benefit drug policy intelligence*
*Researched: 2026-04-11*
