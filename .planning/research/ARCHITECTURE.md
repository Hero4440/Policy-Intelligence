# Architecture Research

**Domain:** Medical-benefit drug policy intelligence MCP server
**Researched:** 2026-04-11
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────��───────────────────────────┐
│                    Prompt Opinion (Client)                    │
│                  StreamableHTTP → POST /mcp                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼──────────────────────────���────────────┐
│                    MCP Server Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ list_    │  │ get_     │  │ compare_ │  │ ask_     │    │
│  │ policies │  │ policy_  │  │ drug_    │  │ policy_  │    │
│  │          │  │ summary  │  │ across_  │  │ question │    │
│  │          │  │          │  │ payers   │  │          │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │              │              │              │          │
├───────┴──────────────┴──────────────┴──────────────┴─────────┤
│                    Query Router Layer                         │
│  ┌────────────────────────��─────────────────────────────┐    │
│  │  Deterministic Lookup → Drug Normalizer → Evidence   │    │
│  │            ↓ (if no match)                           │    │
│  │       LLM Fallback (Ollama) → Evidence Validator     │    │
│  └─────────────────────────────────────────────��────────┘    │
├───────────────────────────────���──────────────────────────────┤
│                    Data Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Normalized   │  │ Drug Alias   │  │ Evidence     │       │
│  │ Policy Store │  │ Lookup       │  │ Index        │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| MCP Server | Register tools, handle StreamableHTTP requests, route to tool handlers | `src/mcp/index.ts` (existing) |
| list_policies tool | Return loaded policy metadata | New tool in `src/mcp/tools/` |
| get_policy_summary tool | Return normalized summary for one policy with evidence | New tool in `src/mcp/tools/` |
| compare_drug_across_payers tool | Cross-payer comparison for a drug family | New tool in `src/mcp/tools/` |
| ask_policy_question tool | Hybrid Q&A with deterministic + LLM fallback | New tool in `src/mcp/tools/` |
| Query Router | Route questions to deterministic lookup or LLM | New module `src/mcp/query/` |
| Normalized Policy Store | Load, validate, and serve normalized policy data | Extend existing `src/mcp/policy_store/` |
| Drug Alias Lookup | Normalize drug names across policies | Existing `data/lookup/drug-aliases.ts` |
| Evidence Index | Map extracted fields to source text snippets | New module alongside policy store |
| Ollama Client | Send context + question to local LLM, validate response | Adapt existing `src/server/chat.ts` |

## Recommended Project Structure (Extensions)

```
src/mcp/
├── index.ts                    # MCP server setup (existing — add new tool registrations)
├── policy_store/
│   ├── loader.ts               # Existing policy loader
│   ├── normalized.ts           # NEW: Normalized policy schema + loader
│   └── evidence.ts             # NEW: Evidence snippet index
├── query/
│   ├── router.ts               # NEW: Deterministic vs LLM routing
│   ├── deterministic.ts        # NEW: Structured lookup against normalized data
│   └── llm-fallback.ts         # NEW: Ollama-based Q&A with evidence validation
├── tools/
│   ├── get_drug_coverage.ts    # Existing
│   ├── get_prior_auth_criteria.ts # Existing
│   ├── check_patient_readiness.ts # Existing
│   ├── list_policies.ts        # NEW
│   ├── get_policy_summary.ts   # NEW
│   ├── compare_drug.ts         # NEW
│   └── ask_policy_question.ts  # NEW
└── types/
    └── responses.ts            # NEW: Shared response types (structured_result, evidence, confidence)

data/policies/
├── structured/                 # Existing PolicyRecord JSONs
└── normalized/                 # NEW: Normalized policy JSONs with evidence mappings
```

### Structure Rationale

- **`src/mcp/query/`:** Separates routing logic from tool handlers. Tools stay thin (validate input → call router → format response).
- **`src/mcp/types/responses.ts`:** Shared response format ensures all tools return consistent structure.
- **`data/policies/normalized/`:** Separate from existing structured data to avoid breaking existing tools.

## Architectural Patterns

### Pattern 1: Thin Tool Handlers

**What:** MCP tool handlers only validate input and format output. Business logic lives in query layer.
**When to use:** Always — keeps tools testable and composable.
**Trade-offs:** Slight indirection, but huge maintainability gain.

```typescript
// Tool handler — thin
server.tool("compare_drug_across_payers", schema, async ({ drug_family }) => {
  const normalized = normalizeDrugName(drug_family);
  const comparison = buildComparison(normalized, policyStore);
  return formatMcpResponse(comparison);
});

// Business logic — separate
function buildComparison(drug: string, store: PolicyStore): ComparisonResult {
  const policies = store.findByDrug(drug);
  return { policies: policies.map(p => extractComparisonFields(p)) };
}
```

### Pattern 2: Evidence-First Response Construction

**What:** Every response starts by collecting evidence snippets, then builds the answer around them.
**When to use:** All tools that reference policy data.
**Trade-offs:** Slightly more work per response, but guarantees evidence grounding.

```typescript
// Build evidence first, then answer
const evidence = collectEvidence(policy, fields);
const answer = summarizeFromEvidence(evidence);
return { human_readable: answer, structured_result: fields, evidence, confidence: "HIGH" };
```

### Pattern 3: Hybrid Query Routing

**What:** Try deterministic lookup first. Only invoke LLM when structured lookup fails.
**When to use:** `ask_policy_question` tool only.
**Trade-offs:** More complex routing logic, but faster responses for common questions and more reliable answers.

```typescript
// 1. Parse intent from question
const intent = parseQuestionIntent(question);

// 2. Try deterministic
const deterministicResult = tryDeterministicLookup(intent, policyStore);
if (deterministicResult) return { ...deterministicResult, confidence: "HIGH" };

// 3. Fallback to LLM with policy context
const llmResult = await queryOllama(question, relevantPolicies);
const validated = validateLlmEvidence(llmResult, policyStore);
return { ...validated, confidence: validated.evidenceFound ? "MEDIUM" : "LOW" };
```

### Pattern 4: Normalized Policy Schema

**What:** A common schema that every policy gets normalized into, regardless of source format.
**When to use:** Data loading phase — normalize once, query many times.

```typescript
interface NormalizedPolicy {
  payer: string;
  policy_title: string;
  effective_date: string;
  drug_family: string;
  preferred_products: string[];
  non_preferred_products: string[];
  prior_auth_required: boolean;
  step_therapy: StepTherapyRule[];
  covered_indications: string[];
  notable_restrictions: string[];
  evidence: Record<string, EvidenceSnippet[]>; // field → source text
}
```

## Data Flow

### Tool Request Flow

```
Prompt Opinion → POST /mcp (StreamableHTTP)
    ↓
McpServer (per-request, stateless)
    ↓
Tool Handler (validate input with Zod)
    ↓
Query Layer (deterministic lookup or LLM routing)
    ↓
Policy Store (in-memory normalized data)
    ↓
Response Builder (structured_result + evidence + confidence)
    ↓
MCP JSON Response → Prompt Opinion
```

### Evidence Flow

```
Raw Policy Text → Normalization → Extracted Fields + Evidence Snippets
                                        ↓
                              Stored in NormalizedPolicy.evidence
                                        ↓
                              Tools query fields, attach relevant evidence
                                        ↓
                              Response includes evidence[] array
```

### LLM Fallback Flow

```
Question (no deterministic match)
    ↓
Select relevant policies (by drug/payer mentioned in question)
    ↓
Build context prompt (normalized data + original text excerpts)
    ↓
Ollama /api/chat (system: "answer based on evidence only")
    ↓
Validate: does response reference actual policy content?
    ↓
If yes → return with confidence: "MEDIUM"
If no  → return "I cannot find evidence to answer this question"
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Embedding-First for Small Corpus

**What people do:** Set up vector DB + embeddings for 2 documents.
**Why it's wrong:** Massive overhead, introduces hallucination risk, slower than direct lookup for small data.
**Do this instead:** In-memory normalized data with direct field matching.

### Anti-Pattern 2: LLM-First for Structured Questions

**What people do:** Send every question to LLM, even "list all policies."
**Why it's wrong:** Slower, less reliable, wastes tokens, higher hallucination risk.
**Do this instead:** Deterministic first. LLM only when structured lookup fails.

### Anti-Pattern 3: Generic Policy Parser

**What people do:** Build a universal parser that "handles any payer format."
**Why it's wrong:** Every payer formats differently. Universal parsing is a multi-month R&D project.
**Do this instead:** Hand-normalize 2 specific documents. Parse once, query many times.

### Anti-Pattern 4: Separate Evidence from Data

**What people do:** Extract fields but don't track which source text they came from.
**Why it's wrong:** Can't provide source attribution. Users can't verify answers.
**Do this instead:** Store evidence snippets alongside every extracted field from day one.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Prompt Opinion | POST /mcp (StreamableHTTP) | Stateless, per-request MCP server instances |
| Ollama (optional) | HTTP fetch to /api/chat | Only for LLM fallback in ask_policy_question |
| FHIR Server (optional) | fhir-kit-client | Existing integration, not needed for new tools |

### Build Order (Dependencies)

1. **Normalized Policy Schema + Data** — Foundation. Everything depends on this.
2. **Evidence Index** — Cross-cutting. Must be built alongside normalization.
3. **list_policies + get_policy_summary** — Simpler tools, validate normalization works.
4. **compare_drug_across_payers** — Builds on normalization + drug alias lookup.
5. **ask_policy_question** — Most complex. Needs query router + LLM fallback.
6. **Integration testing** — End-to-end with Prompt Opinion via ngrok.

## Sources

- Existing codebase analysis (`.planning/codebase/ARCHITECTURE.md`, `STACK.md`)
- MCP SDK StreamableHTTP transport patterns
- Prompt Opinion MCP reference project (`po-community-mcp`)
- Hybrid Q&A architecture patterns (deterministic + LLM fallback)

---
*Architecture research for: medical-benefit drug policy intelligence*
*Researched: 2026-04-11*
