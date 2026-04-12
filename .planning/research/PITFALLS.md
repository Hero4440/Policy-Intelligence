# Pitfalls Research

**Domain:** Medical-benefit drug policy intelligence MCP server (hackathon POC)
**Researched:** 2026-04-11
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Hallucinating Policy Facts

**What goes wrong:**
LLM generates plausible-sounding but incorrect coverage rules. "Cigna requires step therapy for bevacizumab" when it actually doesn't.

**Why it happens:**
LLMs interpolate from training data about insurance policies in general, not from the specific loaded documents.

**How to avoid:**
- Deterministic lookup first — never invoke LLM for questions answerable from structured data
- When using LLM fallback, inject only the relevant normalized policy data as context
- Validate every LLM claim against the evidence index before returning
- If LLM answer can't be grounded in evidence, return "insufficient evidence" instead

**Warning signs:**
- LLM responses that sound confident but don't include specific policy text citations
- Answers about policies/drugs not in the loaded dataset
- Coverage rules that contradict the normalized structured data

**Phase to address:** Evidence grounding (must be built into every tool from day one)

---

### Pitfall 2: Inconsistent Drug Name Matching

**What goes wrong:**
"Bevacizumab" in BCBS NC policy doesn't match "bevacizumab-awwb" (Mvasi) or "Avastin" in comparison queries. Cross-payer comparison returns incomplete results.

**Why it happens:**
Drug families have brand names, generic names, biosimilar suffixes, and multiple aliases. Each payer uses different naming conventions.

**How to avoid:**
- Extend existing drug alias system (`data/lookup/drug-aliases.ts`) to cover all names in the 2 policies
- Normalize at query time AND at data loading time
- Test with exact queries from the hackathon demo: "bevacizumab", "Avastin", "rituximab", "Rituxan"

**Warning signs:**
- compare_drug_across_payers returns fewer policies than expected
- get_policy_summary works for one naming convention but not another
- "No data found" for drugs that are clearly in the loaded policies

**Phase to address:** Policy data normalization (before any tools are built)

---

### Pitfall 3: Evidence Snippets That Don't Ground the Answer

**What goes wrong:**
Evidence field contains text that technically comes from the policy but doesn't actually support the specific claim being made. "Meets evidence requirement" technically but not meaningfully.

**Why it happens:**
Lazy evidence extraction — grabbing a paragraph that mentions the drug rather than the specific sentence about the coverage rule.

**How to avoid:**
- Map evidence snippets to specific extracted fields, not to the document as a whole
- Each evidence snippet should directly support the claim it's attached to
- Keep snippets focused: 1-3 sentences, not full paragraphs
- During normalization, link each field to the exact source text

**Warning signs:**
- Evidence text is long and generic (full sections, not specific sentences)
- Evidence text mentions the drug but not the specific coverage rule being reported
- Same evidence snippet used for multiple different claims

**Phase to address:** Policy data normalization + evidence extraction

---

### Pitfall 4: MCP Tool Discovery Fails in Prompt Opinion

**What goes wrong:**
ngrok tunnel is up, server responds to /health, but Prompt Opinion can't discover tools or tools return errors.

**Why it happens:**
- MCP transport mismatch (SSE vs StreamableHTTP)
- Missing CORS headers for Prompt Opinion's domain
- Tool schemas don't match what Prompt Opinion expects
- Missing `ai.promptopinion/fhir-context` capability extension

**How to avoid:**
- Follow po-community-mcp reference exactly for transport setup
- Test with Prompt Opinion EARLY — don't wait until all tools are built
- Verify: CORS allows Prompt Opinion origin, /mcp endpoint accepts POST, tool schemas are valid Zod → JSON Schema
- Keep the existing `ai.promptopinion/fhir-context` extension capability

**Warning signs:**
- /health works but /mcp returns 404 or CORS error
- Tools appear but calling them returns transport errors
- Tool inputs don't match schema (Zod validation failures)

**Phase to address:** Deployment + integration testing (should be validated early, not last)

---

### Pitfall 5: Over-Engineering for 2 Documents

**What goes wrong:**
Building a sophisticated parsing pipeline, search engine, or abstraction layer for 2 policy documents when simple in-memory data structures suffice.

**Why it happens:**
Engineering instinct to "do it right" instead of "do it fast." Training data includes enterprise-scale solutions.

**How to avoid:**
- Hard-code document count awareness: 2 policies, 2 drug families
- No database, no vector store, no search index
- In-memory normalized JSON objects loaded at startup
- Direct array filtering, not query engines

**Warning signs:**
- Spending time on "scalable" infrastructure instead of tool quality
- Adding dependencies for problems that don't exist at this scale
- Config files for things that could be constants

**Phase to address:** All phases — maintain hackathon pragmatism throughout

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hard-coded policy data | Fast, reliable, no parsing errors | Must re-normalize for each new document | POC with 2 documents — always acceptable |
| In-memory only | No DB setup, instant queries | Can't persist state across restarts | POC demo — always acceptable |
| Ollama-only LLM | No API keys, local, free | Slower than cloud APIs, model quality varies | Hackathon where external dependencies are risky |
| Single-file normalized JSONs | Easy to inspect and debug | Won't scale to 100+ policies | POC — always acceptable |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| ngrok tunnel | Tunnel URL changes on restart; forgetting to update Prompt Opinion config | Use `ngrok http 3000` with stable subdomain if available; test connection before demo |
| Prompt Opinion MCP | Testing tools locally but not via Prompt Opinion's MCP client | Test via Prompt Opinion early — their MCP client may parse responses differently |
| Ollama | Assuming Ollama is running and model is loaded | Check Ollama health (`/api/tags`) before LLM fallback; graceful degradation if Ollama is down |
| StreamableHTTP | Creating persistent sessions when Prompt Opinion expects stateless | Use stateless transport (sessionIdGenerator: undefined) per po-community-mcp reference |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Including real patient PHI in demo data | HIPAA violation even in hackathon context | Use only de-identified or synthetic data; verify no PHI in policy documents |
| Logging full policy text to console | Potential IP exposure of payer policies | Log metadata only, not full policy content |
| ngrok tunnel without auth | Anyone with URL can query policy data | Acceptable for hackathon demo; add basic auth for any post-hackathon deployment |

## "Looks Done But Isn't" Checklist

- [ ] **list_policies:** Returns metadata but forgot to include drug_family list per policy
- [ ] **get_policy_summary:** Returns fields but evidence snippets are empty or generic
- [ ] **compare_drug_across_payers:** Works for bevacizumab but fails for rituximab (or vice versa)
- [ ] **ask_policy_question:** Returns LLM answer but without evidence (hallucination risk)
- [ ] **Evidence grounding:** Evidence exists but doesn't actually support the specific claim
- [ ] **Prompt Opinion connection:** Tools discoverable but responses don't render properly in PO UI
- [ ] **Drug normalization:** Works for exact names but not for brand/biosimilar aliases

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Hallucinating policy facts | Evidence grounding (built into all tools) | Every response has non-empty evidence array |
| Drug name mismatch | Policy normalization | Test all drug name variants return results |
| Weak evidence snippets | Policy normalization + evidence extraction | Each evidence snippet directly supports its claim |
| MCP discovery failure | Deployment + integration testing | Prompt Opinion discovers and calls all 4 tools |
| Over-engineering | All phases | No new dependencies added; in-memory data only |

## Sources

- Existing codebase patterns (`src/mcp/tools/`, `src/mcp/policy_store/`)
- po-community-mcp reference project patterns
- Medical policy domain expertise
- Hackathon POC anti-pattern experience

---
*Pitfalls research for: medical-benefit drug policy intelligence*
*Researched: 2026-04-11*
