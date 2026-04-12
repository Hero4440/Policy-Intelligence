# Stack Research

**Domain:** Medical-benefit drug policy intelligence MCP server
**Researched:** 2026-04-11
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies (Already Present — No Changes Needed)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| TypeScript | 6.0.2 | Primary language | Existing |
| Express | 5.2.1 | HTTP server + MCP middleware | Existing |
| @modelcontextprotocol/sdk | 1.29.0 | MCP server + StreamableHTTP | Existing |
| Zod | 4.3.6 | Schema validation | Existing |
| pdf-parse | 2.4.5 | PDF text extraction | Existing |
| fhir-kit-client | 1.9.2 | FHIR patient data | Existing |

### Additional Libraries Needed

| Library | Version | Purpose | Why Recommended |
|---------|---------|---------|-----------------|
| (none required) | — | — | Existing stack sufficient for POC |

**Rationale:** This is a hackathon POC with 2 documents and 2 drug families. The existing stack (TypeScript + Express + MCP SDK + Zod + Ollama) covers everything needed:

- **Deterministic Q&A:** Pure TypeScript object filtering/matching against normalized PolicyRecord data. No vector DB or embedding library needed for 2 documents.
- **LLM fallback:** Ollama is already integrated (`src/server/chat.ts`). Use direct HTTP fetch to Ollama `/api/chat` for complex questions. No LangChain or AI SDK needed.
- **Evidence extraction:** String matching and Zod-validated structured data. The policy data is small enough to hold entirely in memory.
- **Cross-payer comparison:** TypeScript array operations across PolicyRecord objects. Lodash/ramda add no value here.
- **Schema validation:** Zod already handles all validation needs for tool inputs and policy records.

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| LangChain | Massive dependency, overkill for 2 documents, adds complexity | Direct Ollama HTTP calls |
| Vector databases (Pinecone, Weaviate, Chroma) | 2 documents don't need semantic search; structured lookup is faster and more reliable | In-memory PolicyRecord filtering |
| @xenova/transformers | Embedding computation unnecessary for small corpus | Direct field matching |
| Vercel AI SDK | Extra abstraction layer over Ollama with no benefit for this POC | Direct fetch to Ollama API |
| OpenAI API | Contradicts local-first approach; adds API key dependency | Ollama (already integrated) |
| Full NLP libraries (compromise, natural) | Drug/payer names are known; no NLP needed for structured lookup | Exact match + drug alias normalization |

## Alternatives Considered

| Approach | When to Reconsider |
|----------|-------------------|
| Vector search + embeddings | If scaling to 50+ policy documents where keyword matching fails |
| LangChain | If building multi-step retrieval-augmented generation pipelines |
| AI SDK (Vercel) | If switching to streaming structured outputs with multiple LLM providers |

## Stack Pattern for This POC

**Deterministic-first, LLM-fallback:**
1. Parse user query → identify drug/payer/intent
2. Look up in normalized PolicyRecord store (fast, reliable, evidence-backed)
3. If no deterministic match → format context + query → Ollama → validate response has evidence
4. Every response: structured_result + evidence array + confidence level

**No new dependencies needed.** The existing stack is sufficient for a 2-document, 2-drug-family POC.

## Sources

- Existing codebase analysis (`.planning/codebase/STACK.md`, `ARCHITECTURE.md`)
- MCP SDK documentation (already integrated)
- Ollama API documentation (already integrated at `src/server/chat.ts`)

---
*Stack research for: medical-benefit drug policy intelligence*
*Researched: 2026-04-11*
