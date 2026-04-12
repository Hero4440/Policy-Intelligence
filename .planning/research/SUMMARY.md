# Project Research Summary

**Project:** Medical-benefit drug policy intelligence MCP server
**Domain:** Healthcare policy analysis + Model Context Protocol
**Researched:** 2026-04-11
**Confidence:** HIGH

## Executive Summary

This is a hackathon POC that exposes medical-benefit drug policy intelligence through Model Context Protocol (MCP) tools to Prompt Opinion. Experts build this type of system with a "deterministic-first, LLM-fallback" hybrid architecture: structured policy data enables fast, reliable lookups for common queries, with LLM handling edge cases. The key value proposition is evidence-grounded answers with source attribution, allowing users to verify every coverage rule against original policy documents.

The recommended approach is pragmatic minimalism. The existing stack (TypeScript + Express + MCP SDK + Zod + Ollama) is sufficient for the 2-document POC. No vector databases, no LangChain, no additional dependencies. Focus effort on high-quality policy data normalization with evidence mapping, build 4 thin MCP tools on top, and test integration with Prompt Opinion early. The normalized policy data is the foundation—everything else is just interface.

The critical risk is hallucination. LLMs will confidently generate plausible but incorrect coverage rules if not constrained. Mitigation: (1) deterministic lookup first for all structured queries, (2) LLM only for complex natural language questions, (3) validate every LLM response against evidence index, (4) return "insufficient evidence" rather than guessing. Additional risks include drug name mismatch across payers (solved with alias normalization) and MCP integration failures (solved with early Prompt Opinion testing).

## Key Findings

### Recommended Stack

The existing stack requires no additions. TypeScript + Express provide the runtime. @modelcontextprotocol/sdk handles StreamableHTTP transport. Zod validates schemas. pdf-parse extracts text. Ollama provides LLM fallback. This is sufficient for a 2-document, 2-drug-family POC.

**Core technologies:**
- **TypeScript 6.0.2**: Type-safe policy data structures and tool handlers
- **@modelcontextprotocol/sdk 1.29.0**: MCP server with StreamableHTTP for Prompt Opinion integration
- **Zod 4.3.6**: Schema validation for tool inputs and normalized policy records
- **Ollama (local)**: LLM fallback for complex questions, already integrated at src/server/chat.ts
- **Express 5.2.1**: HTTP server with MCP middleware

**What NOT to use:**
- LangChain (massive dependency, no value for 2 documents)
- Vector databases (structured lookup is faster and more reliable than semantic search at this scale)
- Embedding libraries (no semantic search needed)
- OpenAI API (contradicts local-first approach)

The stack pattern is deterministic-first with LLM fallback: parse query → identify drug/payer/intent → lookup in normalized PolicyRecord store → if no match, context + query to Ollama → validate response has evidence → return structured_result + evidence[] + confidence.

### Expected Features

Users expect evidence-grounded policy intelligence with source attribution. Every answer must cite specific policy text. The MCP tools must return structured JSON that Prompt Opinion can parse reliably.

**Must have (table stakes):**
- **list_policies** — users need to see what data is loaded
- **get_policy_summary** — structured policy fields with evidence snippets
- **compare_drug_across_payers** — side-by-side coverage comparison (core value prop)
- **ask_policy_question** — natural language Q&A with evidence grounding
- **Evidence attribution** — every claim mapped to source text
- **Confidence scoring** — HIGH/MEDIUM/LOW based on deterministic vs LLM source
- **Graceful "I don't know"** — medical domain requires honesty about gaps

**Should have (competitive differentiators):**
- **Preferred vs non-preferred product identification** — answers "which biosimilar does this plan prefer?"
- **Step therapy extraction** — surfaces fail-first sequences buried in policy text
- **Prior auth criteria detail** — beyond "PA required: yes" to specific clinical criteria
- **Cross-payer criteria differences** — highlights where plans disagree

**Defer (v2+):**
- Universal PDF parser for any payer format (multi-month effort; hand-normalize 2 docs for POC)
- Real-time policy updates (requires crawler infrastructure)
- Patient-policy matching workflow (complex eligibility logic beyond POC scope)
- Analytics dashboard (frontend distracts from tool quality)
- Multi-indication coverage (exponential complexity)

Feature dependencies: All tools require normalized policy data as foundation. Evidence grounding is cross-cutting (needed by every tool). LLM fallback only needed for ask_policy_question.

### Architecture Approach

The system follows a layered architecture with thin tool handlers, a query router for hybrid lookup, and an in-memory normalized policy store. MCP tools validate input with Zod and delegate to business logic. The query router tries deterministic lookup first (fast, reliable, HIGH confidence), falling back to Ollama only for complex questions (slower, MEDIUM confidence). Evidence grounding is built into every response at construction time, not bolted on afterward.

**Major components:**
1. **MCP Server Layer** — registers 4 new tools (list_policies, get_policy_summary, compare_drug_across_payers, ask_policy_question) alongside existing patient readiness tools
2. **Query Router** — routes questions to deterministic lookup or LLM fallback based on intent parsing; validates LLM responses against evidence index
3. **Normalized Policy Store** — in-memory JSON objects loaded at startup; schema: payer, drug_family, preferred_products[], non_preferred_products[], prior_auth_required, step_therapy[], covered_indications[], evidence{} per field
4. **Drug Alias Lookup** — normalizes bevacizumab/Avastin/bevacizumab-awwb and rituximab/Rituxan/rituximab-arrx to canonical names for cross-payer matching
5. **Evidence Index** — maps each extracted field to source text snippets (1-3 sentences); attached to every response for verification

**Key patterns:**
- **Thin tool handlers** — validate input, call business logic, format response (keeps tools testable)
- **Evidence-first response construction** — collect evidence snippets first, build answer around them (guarantees grounding)
- **Hybrid query routing** — deterministic first, LLM only when structured lookup fails (faster + more reliable)
- **Normalized policy schema** — common structure regardless of source format; normalize once, query many times

Build order: (1) normalized policy schema + data, (2) evidence index alongside normalization, (3) list_policies + get_policy_summary to validate normalization, (4) compare_drug_across_payers, (5) ask_policy_question with query router, (6) integration testing with Prompt Opinion via ngrok.

### Critical Pitfalls

1. **Hallucinating policy facts** — LLM generates plausible but incorrect coverage rules. Prevention: deterministic lookup first, LLM only for complex questions, validate every LLM claim against evidence index, return "insufficient evidence" if answer can't be grounded. Address in: evidence grounding (built into all tools from day one).

2. **Inconsistent drug name matching** — "bevacizumab" doesn't match "Avastin" or "bevacizumab-awwb" in queries, causing incomplete cross-payer comparison. Prevention: extend drug alias system to cover all naming variants in 2 policies, normalize at query time AND data loading time, test with "bevacizumab", "Avastin", "rituximab", "Rituxan". Address in: policy data normalization (before any tools are built).

3. **Evidence snippets that don't ground the answer** — evidence exists but doesn't actually support the specific claim. Prevention: map evidence to specific extracted fields (not document-level), keep snippets focused (1-3 sentences), each snippet should directly support its claim. Address in: policy normalization + evidence extraction.

4. **MCP tool discovery fails in Prompt Opinion** — ngrok tunnel is up but Prompt Opinion can't discover tools or tools return errors. Prevention: follow po-community-mcp reference exactly, test with Prompt Opinion EARLY, verify CORS headers and /mcp endpoint, keep ai.promptopinion/fhir-context capability. Address in: deployment + integration testing (validate early, not last).

5. **Over-engineering for 2 documents** — building sophisticated parsing pipelines or search engines when in-memory data structures suffice. Prevention: hard-code awareness of 2 policies, no database/vector store, direct array filtering. Address in: all phases (maintain hackathon pragmatism throughout).

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Policy Data Foundation
**Rationale:** Everything depends on normalized policy data with evidence mappings. This is the foundation that enables all tools. Must come first to validate the data schema works before building tool interfaces.

**Delivers:**
- Normalized policy schema (TypeScript interfaces + Zod validators)
- BCBS NC + Cigna policies normalized to common schema
- Evidence index mapping each field to source text snippets
- Drug alias lookup extended for bevacizumab/rituximab variants

**Addresses:**
- Foundation for all 4 MCP tools (from FEATURES.md)
- Prevents "inconsistent drug name matching" pitfall
- Prevents "weak evidence snippets" pitfall

**Avoids:** Building tools before data is ready (would require rework)

### Phase 2: Core MCP Tools
**Rationale:** Build the 3 deterministic tools first (list_policies, get_policy_summary, compare_drug_across_payers) before the complex hybrid ask_policy_question tool. This validates that normalization works, establishes evidence grounding patterns, and delivers core value prop without LLM complexity.

**Delivers:**
- list_policies tool (metadata view)
- get_policy_summary tool (structured summary with evidence)
- compare_drug_across_payers tool (cross-payer comparison)
- Shared response type (structured_result + evidence[] + confidence)

**Uses:** Normalized policy store, evidence index, drug alias lookup (all from Phase 1)

**Implements:** MCP tool handlers (thin validation + formatting), evidence-first response construction

**Addresses:**
- Table stakes features (from FEATURES.md)
- Core differentiator: cross-payer comparison
- Evidence grounding pattern established

**Avoids:** LLM complexity until deterministic patterns proven

### Phase 3: Hybrid Q&A Engine
**Rationale:** The most complex tool. Requires query intent parsing, deterministic vs LLM routing, Ollama integration, and LLM response validation. Built last because it depends on patterns established in Phase 2.

**Delivers:**
- ask_policy_question tool (natural language Q&A)
- Query router (deterministic first, LLM fallback)
- Ollama client adapter (from existing src/server/chat.ts)
- LLM response validator (grounds answers in evidence index)

**Uses:** All Phase 1 infrastructure + Phase 2 evidence grounding patterns

**Implements:** Hybrid query routing pattern (from ARCHITECTURE.md)

**Addresses:**
- Natural language question handling (differentiator from FEATURES.md)
- LLM fallback for complex questions

**Avoids:** Hallucinating policy facts (validation against evidence index)

### Phase 4: Deployment + Integration
**Rationale:** Integration testing can't wait until the end. This phase validates MCP transport, Prompt Opinion discovery, and end-to-end tool execution before demo day. Early testing catches transport/CORS issues that are painful to debug under time pressure.

**Delivers:**
- ngrok tunnel configuration
- Prompt Opinion connection tested
- All 4 tools discoverable and callable from Prompt Opinion
- Demo script with test queries

**Uses:** All tools from Phases 2-3

**Addresses:**
- MCP tool discovery pitfall (test early)
- CORS and transport configuration
- Demo readiness

**Avoids:** Last-minute integration surprises

### Phase Ordering Rationale

- **Phase 1 first:** Data foundation blocks all tool development. Must normalize policies and establish evidence patterns before building tools.
- **Phase 2 before Phase 3:** Deterministic tools are simpler and establish evidence grounding patterns that Phase 3 needs. Delivers core value prop without LLM complexity.
- **Phase 3 depends on Phase 2:** Query router needs deterministic lookup patterns to know when to fall back to LLM. LLM validator needs evidence grounding patterns from Phase 2.
- **Phase 4 early, not last:** Integration testing with Prompt Opinion should happen as soon as Phase 2 tools are built, not after everything is complete. Catches transport issues early.

This ordering follows architectural dependencies (data → deterministic tools → hybrid tools), avoids pitfalls (evidence grounding established before LLM introduced), and mirrors the feature prioritization matrix (foundation → table stakes → differentiators → integration).

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Policy normalization patterns for BCBS NC + Cigna documents (specific to these 2 PDFs; will need document inspection to design schema)
- **Phase 3:** Ollama prompt engineering for evidence-grounded Q&A (needs experimentation to find prompt that prevents hallucination)

Phases with standard patterns (skip research-phase):
- **Phase 2:** MCP tool registration is well-documented in po-community-mcp reference
- **Phase 4:** ngrok + Prompt Opinion integration follows existing patterns in codebase

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing codebase analysis confirms all needed libraries present; no new dependencies required |
| Features | HIGH | Feature landscape clear from domain expertise + existing tool patterns; table stakes vs differentiators well-defined |
| Architecture | HIGH | Hybrid architecture (deterministic + LLM) is established pattern; MCP integration follows po-community-mcp reference |
| Pitfalls | HIGH | Pitfalls derived from domain expertise (medical policy) + MCP integration experience + hackathon POC constraints |

**Overall confidence:** HIGH

All research findings are grounded in existing codebase analysis (`.planning/codebase/STACK.md`, `ARCHITECTURE.md`), MCP SDK documentation, and domain expertise in medical policy management workflows. The project is a hackathon POC with clear scope constraints (2 documents, 2 drug families), which reduces uncertainty.

### Gaps to Address

- **Specific policy extraction rules:** BCBS NC and Cigna format their policies differently. Phase 1 planning will need to inspect both PDFs to design the exact normalization schema. Research identified the pattern (normalize to common schema), but field-level mapping requires document analysis.

- **Ollama prompt engineering:** Research recommends LLM fallback for complex questions, but the specific prompt structure to prevent hallucination needs experimentation during Phase 3. Start with "answer based only on provided policy context; cite specific text; say 'insufficient evidence' if uncertain" and iterate.

- **Evidence snippet granularity:** Research recommends 1-3 sentences per evidence snippet, but the exact extraction logic depends on policy document structure. Phase 1 will need to establish the pattern (extract surrounding sentences? paragraph boundaries? section headers?).

- **Drug alias completeness:** Research identified the need for alias normalization, but the complete list of aliases depends on what's actually in the 2 policy documents. Phase 1 should extract all drug name variants found in BCBS NC + Cigna and map them.

## Sources

### Primary (HIGH confidence)
- **Existing codebase** (`.planning/codebase/STACK.md`, `ARCHITECTURE.md`, `ROADMAP.md`) — current implementation patterns, MCP integration, Ollama integration at `src/server/chat.ts`
- **MCP SDK documentation** — StreamableHTTP transport, tool registration patterns
- **po-community-mcp reference project** — Prompt Opinion integration patterns, CORS configuration, stateless transport setup

### Secondary (MEDIUM confidence)
- **Domain expertise** — medical-benefit drug policy management workflows, coverage determination processes, prior authorization criteria
- **Hackathon POC patterns** — pragmatic engineering for time-constrained demos, when to over-engineer vs when to hard-code

### Tertiary (LOW confidence, needs validation)
- **Ollama prompt engineering** — specific prompt structure to prevent hallucination in medical policy Q&A context (needs experimentation during Phase 3)

---
*Research completed: 2026-04-11*
*Ready for roadmap: yes*
