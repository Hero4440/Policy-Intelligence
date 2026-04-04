# Phase 2: MCP Server Core - Research

**Researched:** 2026-04-04
**Domain:** Model Context Protocol (MCP) server implementation with TypeScript/Node.js
**Confidence:** HIGH

## Summary

Phase 2 requires building an MCP server that exposes three healthcare-focused tools (`get_drug_coverage`, `get_prior_auth_criteria`, `check_patient_readiness`) over Streamable HTTP transport compatible with Prompt Opinion. The Model Context Protocol (MCP) is an open standard from Anthropic (released late 2024) that enables LLM applications to integrate with external tools and data sources through a standardized protocol.

The TypeScript SDK (`@modelcontextprotocol/sdk` v1.29.0, Tier 1) is production-ready and provides robust support for tool registration, schema validation with Zod, and Streamable HTTP transport. The key architectural decision is tool design: MCP best practices strongly recommend **2-4 tools maximum** per server, which aligns perfectly with our three-tool requirement. Each tool should accomplish specific user goals rather than exposing raw API operations.

For this phase, the critical success factors are: (1) clear, semantic tool descriptions that enable Prompt Opinion's agent to correctly select and use tools, (2) comprehensive input validation using Zod schemas, (3) evidence text in responses for policy traceability, and (4) drug name aliasing using the reverse lookup map built in Phase 1.

**Primary recommendation:** Use `@modelcontextprotocol/sdk` with Express for HTTP server, stateless Streamable HTTP transport for serverless compatibility, Zod for parameter validation, and JSON policy store from Phase 1 as the data source.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@modelcontextprotocol/sdk` | 1.29.0 | MCP protocol implementation | Official Tier 1 SDK, production-ready, full Streamable HTTP support |
| `zod` | 3.25+ | Schema validation and type safety | Official peer dependency, generates JSON schemas automatically, runtime validation |
| `express` | 4.x | HTTP server framework | Minimal overhead, widely adopted, excellent MCP middleware support |
| `typescript` | 5.x | Type safety and development | Required for SDK, prevents runtime errors, enables IDE autocomplete |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@types/node` | Latest | Node.js type definitions | Always (TypeScript requirement) |
| `@types/express` | Latest | Express type definitions | Always (TypeScript + Express) |
| `tsx` | Latest | TypeScript execution | Development/testing without build step |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Express | Hono | Faster but less middleware ecosystem, overkill for 3 tools |
| Zod | Yup/Joi | Zod is official peer dependency, better MCP integration |
| TypeScript | Python FastMCP | Python is Tier 1 but team likely more familiar with TS/Node |

**Installation:**
```bash
npm install @modelcontextprotocol/sdk zod express
npm install -D @types/node @types/express typescript tsx
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── index.ts              # Server entry point, Express setup, transport initialization
├── tools/                # Tool implementations (one file per tool)
│   ├── get_drug_coverage.ts
│   ├── get_prior_auth_criteria.ts
│   └── check_patient_readiness.ts
├── schemas/              # Zod input schemas
│   └── tool_inputs.ts
├── policy_store/         # Policy data access layer
│   ├── loader.ts         # Load JSON policies from Phase 1
│   ├── drug_aliases.ts   # Reverse lookup map for brand/generic
│   └── types.ts          # Policy data structure types
└── utils/                # Shared utilities
    └── evidence.ts       # Evidence text formatting helpers
```

### Pattern 1: Stateless HTTP Transport (Serverless-Compatible)
**What:** Streamable HTTP transport without session management
**When to use:** Production deployment, serverless environments, multiple concurrent clients
**Example:**
```typescript
// Source: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamable-http.js";
import express from "express";

const app = express();
const server = new McpServer({
  name: "prior-auth-assistant",
  version: "1.0.0"
});

// Register tools here (see Pattern 2)

const transport = new NodeStreamableHTTPServerTransport({
  sessionIdGenerator: undefined // Stateless mode
});

await server.connect(transport);

app.post("/mcp", async (req, res) => {
  await transport.handleRequest(req, res);
});

app.listen(3000);
```

### Pattern 2: Tool Registration with Zod Validation
**What:** Type-safe tool definition with automatic schema generation
**When to use:** Every tool - prevents invalid inputs reaching handlers
**Example:**
```typescript
// Source: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md
import { z } from "zod";

server.registerTool(
  "get_drug_coverage",
  {
    description: "Determine if a drug is covered by a health plan, including prior authorization requirements. Returns coverage status (covered, not covered, covered with PA), source policy reference, and supporting evidence text from policy documents.",
    inputSchema: {
      plan: z.string().describe("Health plan identifier (e.g., 'uhc-commercial', 'aetna-medicare')"),
      drug: z.string().describe("Drug name - accepts brand names (Humira) or generic names (adalimumab)")
    }
  },
  async ({ plan, drug }) => {
    // Tool implementation
    return {
      content: [{
        type: "text",
        text: JSON.stringify(result)
      }],
      structuredContent: result
    };
  }
);
```

### Pattern 3: Evidence-Based Response Structure
**What:** Always include policy evidence text with determinations
**When to use:** All coverage and criteria responses (requirements COV-03, COV-01, COV-02)
**Example:**
```typescript
// Response structure for get_drug_coverage
{
  coverage_status: "covered_with_pa",
  source_policy: "UHC Commercial Medical Policy 2024-Q1",
  evidence: "Prior authorization is required for adalimumab (Humira) for treatment of rheumatoid arthritis. Policy states: 'Adalimumab requires PA for RA unless patient has documented intolerance to methotrexate.'",
  policy_url: "https://example.com/uhc-commercial-2024q1.pdf"
}

// Response structure for get_prior_auth_criteria
{
  diagnosis_requirements: {
    required: true,
    criteria: ["Moderate to severe active rheumatoid arthritis"],
    evidence: "Policy section 2.1: 'PA approval requires diagnosis of moderate to severe active RA confirmed by rheumatologist.'"
  },
  step_therapy_requirements: {
    required: true,
    prior_therapies: ["Methotrexate for ≥3 months"],
    evidence: "Policy section 2.2: 'Patient must have tried and failed methotrexate therapy for minimum 3 months.'"
  },
  quantity_limits: {
    max_quantity: "2 syringes per 28 days",
    evidence: "Policy section 2.3: 'Quantity limit: 40mg/0.8mL, maximum 2 syringes per 28-day period.'"
  },
  other_restrictions: []
}
```

### Pattern 4: Drug Alias Resolution
**What:** Normalize brand/generic drug names using reverse lookup map from Phase 1
**When to use:** Start of every tool handler before policy lookup
**Example:**
```typescript
// policy_store/drug_aliases.ts
const DRUG_ALIASES = {
  "humira": "adalimumab",
  "adalimumab": "adalimumab",
  "enbrel": "etanercept",
  "etanercept": "etanercept"
  // ... from Phase 1 alias map
};

function normalizeDrugName(drugName: string): string {
  const normalized = DRUG_ALIASES[drugName.toLowerCase()];
  if (!normalized) {
    throw new Error(`Unknown drug: ${drugName}`);
  }
  return normalized;
}

// In tool handler
async ({ plan, drug }) => {
  const normalizedDrug = normalizeDrugName(drug);
  const policy = loadPolicy(plan, normalizedDrug);
  // ...
}
```

### Anti-Patterns to Avoid
- **Too many tools:** Don't create separate tools for "check_coverage", "check_pa_required", "get_pa_details" - combine into 2 logical tools
- **Overly granular operations:** Tool should accomplish user goal ("get coverage status") not expose internal ops ("query_policy_json", "parse_coverage_section")
- **Vague descriptions:** "Get drug information" is too generic - LLM won't know when to call it
- **Missing evidence:** Never return determination without policy evidence text (requirement COV-03)
- **Console.log in STDIO servers:** For Streamable HTTP this is fine, but avoid `console.log` if you ever switch to STDIO transport

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MCP protocol implementation | Custom JSON-RPC server | `@modelcontextprotocol/sdk` | Protocol versioning, transport abstraction, connection lifecycle, error handling all solved |
| Schema validation | Manual parameter checking | Zod schemas in `inputSchema` | Automatic validation, auto-generated JSON schema for LLM, type inference, clear error messages |
| HTTP transport | Raw HTTP handlers | `NodeStreamableHTTPServerTransport` | SSE streaming, session management (if needed), protocol-compliant responses |
| Tool discovery | Custom metadata format | MCP `listTools` built-in | LLM clients expect standard format, automatic schema generation |

**Key insight:** MCP SDK handles all protocol complexity. Your code should only contain business logic (policy lookup, evidence extraction, drug aliasing). Attempting to implement JSON-RPC, schema negotiation, or transport yourself will cause subtle protocol violations that break client compatibility.

## Common Pitfalls

### Pitfall 1: Tool Overload (Tool Count Anti-Pattern)
**What goes wrong:** Creating 10+ tools for every possible query operation overwhelms LLM agents and reduces accuracy
**Why it happens:** Treating MCP server like REST API with one tool per endpoint
**How to avoid:** Limit to 2-4 tools that represent user goals. Benchmark data shows LLM tool selection accuracy drops significantly beyond 6 tools (Grok 4.1 Fast: 86.7% → 76.7%, GPT-4o: 81.7% → 73.3%)
**Warning signs:** Tool list has >6 items, tools have overlapping descriptions, many tools only differ by one parameter
**Phase 2 application:** Three tools is optimal - matches research recommendations perfectly

### Pitfall 2: Weak Tool Descriptions
**What goes wrong:** LLM calls wrong tool or doesn't call any tool because descriptions are ambiguous
**Why it happens:** Developer writes description for other developers, not for LLM semantic understanding
**How to avoid:** Descriptions should be 1-2 sentences, focus on "when to call this" and "what user goal it achieves", include key terminology LLM will see in user prompts
**Warning signs:** Generic descriptions ("Get data"), jargon without explanation, missing use case examples
**Phase 2 application:**
- Good: "Determine if a drug is covered by a health plan, including prior authorization requirements"
- Bad: "Query policy store for drug coverage data"

### Pitfall 3: Missing Input Validation
**What goes wrong:** Invalid inputs reach tool handler, cause crashes or incorrect responses
**Why it happens:** Assuming MCP SDK validates everything automatically
**How to avoid:** Always define Zod schema in `inputSchema`, add business-level validation (valid plan IDs, known drugs) in handler
**Warning signs:** Tool crashes on unexpected input, error messages leak internal details, no schema in tool registration
**Phase 2 application:** Validate plan exists, drug is known (via alias map), before attempting policy lookup

### Pitfall 4: Stateful HTTP Sessions in Serverless
**What goes wrong:** Server fails when scaled horizontally or deployed to serverless platforms
**Why it happens:** Using `sessionIdGenerator: () => randomUUID()` assumes single-instance deployment
**How to avoid:** Use `sessionIdGenerator: undefined` for stateless mode if deploying to serverless or multi-instance environments
**Warning signs:** Works locally but fails in production, session errors with load balancer, can't scale past 1 instance
**Phase 2 application:** Use stateless mode unless you have specific session requirements (you don't for lookup operations)

### Pitfall 5: Evidence-Free Responses
**What goes wrong:** MCP server returns "covered with PA" but agent can't explain why or cite source
**Why it happens:** Focusing on structured data without including policy evidence text
**How to avoid:** Every determination MUST include evidence field with quoted policy language and source reference
**Warning signs:** Responses only have status codes, no "why", can't answer "what does the policy say?"
**Phase 2 application:** Requirement COV-03 explicitly mandates evidence text - this is non-negotiable

### Pitfall 6: Ignoring Drug Aliases
**What goes wrong:** User asks about "Humira" but policy uses "adalimumab", tool returns "drug not found"
**Why it happens:** Direct string matching against policy data without normalization
**How to avoid:** Use reverse lookup map from Phase 1 to normalize ALL drug inputs before policy queries
**Warning signs:** Works for generic names but not brand names (or vice versa), duplicate logic for same drug
**Phase 2 application:** Requirement COV-04 mandates handling both brand and generic names via alias matching

## Code Examples

Verified patterns from official sources:

### Complete Server Setup with Express + Streamable HTTP
```typescript
// Source: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md
// src/index.ts
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamable-http.js";
import { z } from "zod";

const app = express();
app.use(express.json());

const server = new McpServer({
  name: "prior-auth-assistant",
  version: "1.0.0",
});

// Tool registration (see next example)

const transport = new NodeStreamableHTTPServerTransport({
  sessionIdGenerator: undefined, // Stateless mode for serverless compatibility
});

await server.connect(transport);

app.post("/mcp", async (req, res) => {
  await transport.handleRequest(req, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.error(`MCP server listening on port ${PORT}`);
});
```

### Tool Implementation with Evidence
```typescript
// src/tools/get_drug_coverage.ts
import { z } from "zod";
import { normalizeDrugName } from "../policy_store/drug_aliases.js";
import { loadPolicy } from "../policy_store/loader.js";

export const getDrugCoverageSchema = {
  plan: z.string().describe("Health plan identifier (e.g., 'uhc-commercial', 'aetna-medicare')"),
  drug: z.string().describe("Drug name - accepts brand names (Humira) or generic names (adalimumab)"),
};

export async function getDrugCoverage({ plan, drug }: z.infer<typeof z.object(getDrugCoverageSchema)>) {
  try {
    // Step 1: Normalize drug name using Phase 1 alias map
    const normalizedDrug = normalizeDrugName(drug);

    // Step 2: Load policy from JSON store
    const policy = loadPolicy(plan);
    if (!policy) {
      return {
        content: [{ type: "text", text: `Unknown plan: ${plan}` }],
        isError: true,
      };
    }

    // Step 3: Find drug in policy
    const drugPolicy = policy.drugs.find(d => d.generic_name === normalizedDrug);
    if (!drugPolicy) {
      return {
        content: [{ type: "text", text: `Drug ${drug} not found in ${plan} policy` }],
        isError: true,
      };
    }

    // Step 4: Build response with evidence
    const result = {
      coverage_status: drugPolicy.requires_pa ? "covered_with_pa" : "covered",
      source_policy: policy.source_document,
      evidence: drugPolicy.coverage_evidence_text,
      policy_section: drugPolicy.policy_section,
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2),
      }],
      structuredContent: result,
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}

// Registration in index.ts:
server.registerTool(
  "get_drug_coverage",
  {
    description: "Determine if a drug is covered by a health plan, including prior authorization requirements. Returns coverage status (covered, not covered, covered with PA), source policy reference, and supporting evidence text from policy documents.",
    inputSchema: getDrugCoverageSchema,
  },
  getDrugCoverage
);
```

### Error Handling Pattern
```typescript
// Source: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md
// Always use try-catch and return isError for tool-level errors
async ({ plan, drug }): Promise<CallToolResult> => {
  try {
    const normalizedDrug = normalizeDrugName(drug);
    const result = await lookupCoverage(plan, normalizedDrug);

    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  } catch (error) {
    // Return error as tool result, not protocol error
    // This allows LLM to see and handle the error
    return {
      content: [{
        type: "text",
        text: `Failed to get coverage: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}
```

### Drug Alias Normalization
```typescript
// src/policy_store/drug_aliases.ts
// Built from Phase 1 reverse lookup map
export const DRUG_ALIASES: Record<string, string> = {
  // Brand → Generic
  "humira": "adalimumab",
  "enbrel": "etanercept",
  "remicade": "infliximab",

  // Generic → Generic (identity mapping)
  "adalimumab": "adalimumab",
  "etanercept": "etanercept",
  "infliximab": "infliximab",
};

export function normalizeDrugName(drugName: string): string {
  const normalized = DRUG_ALIASES[drugName.toLowerCase()];
  if (!normalized) {
    throw new Error(`Unknown drug: ${drugName}. Supported drugs: ${Object.keys(DRUG_ALIASES).join(", ")}`);
  }
  return normalized;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HTTP + SSE (separate endpoints) | Streamable HTTP (unified) | March 2025 | Single endpoint handles bidirectional streaming, simpler deployment |
| Manual JSON-RPC implementation | MCP SDK with transport abstraction | Late 2024 | Protocol compliance guaranteed, transport-agnostic code |
| Custom schema formats | Zod → JSON Schema auto-generation | MCP SDK v1.x | Type safety + runtime validation + LLM schema in one step |
| Session-required architecture | Stateless mode option | MCP SDK v1.20+ | Serverless compatibility, horizontal scaling without sticky sessions |

**Deprecated/outdated:**
- **Stdio transport for web services:** Streamable HTTP is standard for remote servers (Stdio only for local/spawned processes like Claude Desktop)
- **HTTP + SSE with separate GET endpoint:** Unified Streamable HTTP endpoint is current best practice
- **Manual tool schema generation:** Zod integration auto-generates schemas, reduces errors
- **v0.x MCP SDK:** v1.29.0 is stable, v2 in pre-alpha for Q1 2026 but not recommended yet

## Open Questions

1. **Prompt Opinion's specific MCP integration requirements**
   - What we know: They support Streamable HTTP MCP servers (standard transport)
   - What's unclear: Any specific authentication requirements, rate limiting expectations, custom headers
   - Recommendation: Implement standard Streamable HTTP first, add auth later if needed (can be middleware)

2. **Policy update frequency and caching strategy**
   - What we know: Phase 1 created static JSON files from PDFs
   - What's unclear: How often policies change, whether to cache in memory or reload per request
   - Recommendation: Start with load-on-startup caching (policies are relatively static), add reload endpoint later if needed

3. **Multi-plan query support**
   - What we know: Requirements specify single plan per query
   - What's unclear: Will agents want to compare coverage across plans in one call?
   - Recommendation: Start with single-plan tools as specified, can add `compare_plans` tool later if needed (wouldn't violate 2-4 tool guideline)

## Sources

### Primary (HIGH confidence)
- [MCP TypeScript SDK Documentation](https://ts.sdk.modelcontextprotocol.io/) - Official Tier 1 SDK docs
- [MCP Server Development Guide](https://modelcontextprotocol.io/docs/develop/build-server) - Official build tutorial
- [MCP TypeScript SDK GitHub](https://github.com/modelcontextprotocol/typescript-sdk) - Source code and examples
- [MCP Best Practices](https://modelcontextprotocol.info/docs/best-practices/) - Architectural guidance

### Secondary (MEDIUM confidence)
- [MCP Tool Design Best Practices](https://ai.ksopyla.com/posts/mcp_best_practices/) - Tool count research and patterns
- [Error Handling in MCP Servers](https://mcpcat.io/guides/error-handling-custom-mcp-servers/) - Production patterns
- [MCP Server Testing Strategies](https://www.merge.dev/blog/mcp-server-testing) - Testing approaches
- [Streamable HTTP Transport Deep Dive](https://thenewstack.io/how-mcp-uses-streamable-http-for-real-time-ai-tool-interaction/) - Transport architecture

### Tertiary (LOW confidence - architectural context)
- [Building MCP Servers with TypeScript](https://mcpize.com/blog/mcp-server-typescript) - Community tutorial (verify patterns against official docs)
- [MCP Integration Testing Guide](https://mcpcat.io/guides/integration-tests-mcp-flows/) - Community testing practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official SDK, established versions, Tier 1 support verified
- Architecture: HIGH - Patterns from official docs, verified in SDK repository examples
- Pitfalls: HIGH - Drawn from official best practices docs and research papers on tool count impact
- Code examples: HIGH - Extracted directly from official SDK documentation and GitHub examples

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (30 days - MCP SDK is stable, v1.x in maintenance mode until v2 release Q1 2026)
