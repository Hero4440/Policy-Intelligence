# Architecture Patterns

**Domain:** Prior Authorization Readiness Agent
**Researched:** 2026-04-04

## Recommended Architecture

```
┌─────────────────────────────────────────────┐
│              Chat UI (Streamlit)             │
│         st.chat_input / st.chat_message     │
└──────────────────┬──────────────────────────┘
                   │ user message
                   ▼
┌─────────────────────────────────────────────┐
│           Agent Orchestrator                │
│        (Python + Claude API)                │
│                                             │
│  1. Receive user question                   │
│  2. Call Claude with tool definitions        │
│  3. Claude decides which MCP tools to call   │
│  4. Execute tool calls                       │
│  5. Return grounded response                 │
└──────┬──────────────┬───────────────────────┘
       │              │
       ▼              ▼
┌──────────────┐  ┌──────────────────────────┐
│ FHIR Patient │  │    MCP Policy Server     │
│   Context    │  │   (mcp[cli] / FastMCP)   │
│              │  │                          │
│ Load from:   │  │ Tools:                   │
│ - Synthea    │  │ - get_drug_coverage()    │
│   bundles    │  │ - get_prior_auth_criteria│
│ - Hand-      │  │ - check_patient_         │
│   crafted    │  │   readiness()            │
│   JSON       │  └──────────┬───────────────┘
└──────────────┘             │
                             ▼
                   ┌──────────────────────┐
                   │  Policy Rules Store  │
                   │     (JSON files)     │
                   │                      │
                   │ policies/            │
                   │ ├── uhc.json         │
                   │ ├── aetna.json       │
                   │ └── cigna.json       │
                   └──────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With | Interface |
|-----------|---------------|-------------------|-----------|
| **Chat UI** | Accept user input, display responses, show evidence citations | Agent Orchestrator | Function calls (same process if Streamlit) |
| **Agent Orchestrator** | Route questions to Claude, execute tool calls, merge patient context with policy results | Chat UI, Claude API, MCP Server, FHIR Context | Claude tool_use API |
| **MCP Policy Server** | Expose policy lookup as 3 MCP tools, query JSON store, return structured results with evidence | Agent Orchestrator | MCP protocol (stdio or SSE) |
| **FHIR Patient Context** | Parse Synthea bundles, extract relevant clinical fields, provide patient summary | Agent Orchestrator | Python module import |
| **Policy Rules Store** | Store structured policy data, load on server start, provide lookup functions | MCP Policy Server | JSON file read → Pydantic models |

### Data Flow

**Runtime (user asks a question):**
```
1. User types: "Does UHC cover Humira for RA?"
2. Chat UI → Agent Orchestrator
3. Orchestrator sends to Claude with tool definitions + system prompt
4. Claude responds with tool_use: get_drug_coverage(plan="UHC", drug="Humira")
5. Orchestrator calls MCP tool → queries JSON store → returns structured result
6. Orchestrator sends tool result back to Claude
7. Claude generates grounded response citing policy evidence
8. Response displayed in Chat UI with evidence section
```

**Patient readiness flow:**
```
1. User asks: "For this patient, what's missing before PA submission?"
2. Claude calls: check_patient_readiness(plan="UHC", drug="Humira", patient_context={...})
3. MCP tool:
   a. Loads policy criteria from JSON
   b. Receives patient context (diagnosis, meds, labs)
   c. Compares patient data against each requirement
   d. Returns: matched[], missing[], documentation_needed[]
4. Claude generates cautious natural language response
```

**Offline (data preparation):**
```
1. Download public payer policy PDFs
2. Extract text with PyMuPDF
3. Send to Claude for structured extraction
4. Validate with Pydantic models
5. Save as JSON files in policies/ directory
```

## Patterns to Follow

### Pattern 1: Tool-First Agent Design
**What:** Define MCP tools with clear input/output contracts first, then build the agent around them.
**When:** Always — tools are the API contract.
**Why:** Claude's tool_use works best with well-typed, well-documented tools. Tool descriptions become the agent's "knowledge" of what it can do.

```python
@mcp.tool()
def get_drug_coverage(plan: str, drug: str) -> dict:
    """Check if a specific drug is covered under a payer plan.

    Returns coverage status, source policy document, and supporting evidence text.
    """
    # ...
```

### Pattern 2: Evidence-Grounded Responses
**What:** Every response must cite specific policy text, not generate medical claims.
**When:** All patient-facing outputs.
**Why:** Healthcare requires traceability. The agent is a lookup tool, not a medical advisor.

```python
# Tool returns include evidence_text field
return {
    "coverage_status": "covered_with_pa",
    "evidence_text": "Humira is covered under medical benefit when used for...",
    "source_document": "UHC Medical Benefit Drug Policy 2026-001"
}
```

### Pattern 3: Separation of Policy Logic from LLM
**What:** Keep all policy matching logic in deterministic Python code. Claude interprets and presents; it does not decide coverage.
**When:** All policy queries.
**Why:** LLMs hallucinate. Policy matching must be exact. Claude's role is natural language interface, not decision engine.

### Pattern 4: Patient Context as Structured Data
**What:** Parse FHIR bundles into a flat, tool-friendly dict before passing to agent.
**When:** Loading patient data.
**Why:** Claude doesn't need raw FHIR JSON. Extract the 5-6 fields that matter: diagnosis codes, active medications, payer, recent labs.

```python
patient_context = {
    "diagnoses": ["M05.79"],  # RA, unspecified
    "active_medications": ["methotrexate"],
    "payer": "UnitedHealthcare",
    "plan": "Choice Plus",
    "recent_labs": {"ESR": 42, "CRP": 2.1}
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Vector Search for Policy Lookup
**What:** Using embeddings + similarity search for policy queries.
**Why bad:** Policy matching needs exact matches (drug name + plan name), not fuzzy similarity. Vector search adds complexity and introduces false matches.
**Instead:** Structured JSON lookup with exact key matching.

### Anti-Pattern 2: Multi-Agent Architecture
**What:** Multiple specialized agents coordinating (policy agent, patient agent, etc.).
**Why bad:** Adds latency, complexity, and debugging difficulty. For 3 tools, one agent is sufficient.
**Instead:** Single agent with multiple tools.

### Anti-Pattern 3: LLM Makes Coverage Decisions
**What:** Asking Claude to "decide" if a drug is covered based on policy text.
**Why bad:** LLMs can misinterpret complex conditional logic. Policy matching must be deterministic.
**Instead:** Deterministic Python code matches criteria; Claude presents results in natural language.

### Anti-Pattern 4: Raw FHIR Bundles to LLM
**What:** Passing entire FHIR Bundle JSON to Claude as context.
**Why bad:** Bundles are 10K+ tokens of mostly irrelevant data. Wastes context, confuses the model.
**Instead:** Extract relevant fields into a compact patient_context dict.

## Suggested Build Order

Build order follows dependency chain (each layer depends on the one before):

| Order | Component | Depends On | Estimated Time |
|-------|-----------|------------|----------------|
| 1 | Policy data extraction (PDFs → JSON) | Nothing | 4-6 hrs |
| 2 | Policy rules store (Pydantic models + JSON loading) | Step 1 output |1-2 hrs |
| 3 | MCP server (3 tools) | Steps 1-2 | 2-3 hrs |
| 4 | FHIR patient context (Synthea + hand-crafted) | Nothing (parallel with 1-3) | 2-3 hrs |
| 5 | Agent orchestrator (Claude + tool calling) | Steps 3-4 | 2-3 hrs |
| 6 | Chat UI (Streamlit) | Step 5 | 2-3 hrs |
| 7 | Deployment | Steps 1-6 | 2-3 hrs |
| 8 | Integration testing + demo prep | All | 2-3 hrs |

**Critical path:** Steps 1 → 2 → 3 → 5 → 6 → 7
**Parallel track:** Step 4 can run alongside Steps 1-3

## Sources

- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [FastMCP Tutorial](https://www.firecrawl.dev/blog/fastmcp-tutorial-building-mcp-servers-python)
- [Claude Tool Use Docs](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)
- [fhir.resources](https://github.com/nazrulworld/fhir.resources)
- [Synthea FHIR Overview](https://mitre.github.io/fhir-for-research/modules/synthea-overview)
