# Phase 2: Core MCP Tools - Research

**Researched:** 2026-04-12
**Domain:** MCP tool implementation, deterministic data retrieval, evidence-based response design, comparison tool patterns
**Confidence:** HIGH

## Summary

Phase 2 builds three deterministic MCP tools (list_policies, get_policy_summary, compare_drug_across_payers) on top of Phase 1's normalized policy data. The existing codebase provides a strong foundation: MCP SDK 1.29.0 with StreamableHTTPServerTransport, Zod-based input validation, in-memory policy store with load-time validation, and evidence-mapped policy schema. The work extends the existing tool registration pattern (used by 3 current tools) with new tools optimized for policy intelligence queries.

The MCP TypeScript SDK (v1.29.0) is production-ready with Zod schema integration for input validation, automatic JSON Schema conversion for the wire protocol, and support for structured responses via content arrays. The codebase already demonstrates best practices: stateless per-request server instances, evidence-grounded responses (get_drug_coverage returns evidence snippets), and helpful error messages with available options. Phase 2 extends these patterns with list/summary/compare capabilities, adding response standardization (human-readable + structured_result + evidence + confidence) and comparison-specific features (difference highlighting, per-payer evidence, plain-language takeaways).

**Primary recommendation:** Reuse existing tool registration pattern, policy store, and evidence mapping infrastructure. Build three new tools following the established architecture: deterministic lookup against in-memory policy cache, Zod input validation, structured JSON responses with evidence arrays. Add response wrapper pattern for consistent human-readable + structured_result + evidence + confidence format across all tools. For comparison tool, implement side-by-side format with difference highlighting and per-field evidence preservation.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Response Structure:**
- Human-readable answer verbosity: Claude's discretion per tool
- Structured result scope: Claude's discretion — full schema or query-relevant subset as appropriate
- Confidence levels: Evidence-based — HIGH when all fields have evidence, MEDIUM when some fields lack evidence snippets
- Error responses: Helpful suggestions — e.g., "Drug X not found. Did you mean: bevacizumab, rituximab?"

**Comparison Logic:**
- Format: Both views — show all fields for completeness, with differences highlighted
- Key differences: Prioritize coverage criteria (preferred/non-preferred splits, step therapy, prior auth) as the most important fields to highlight
- Partial data: Show available policy data + mark missing payer as "No policy loaded" with explanation
- Key takeaway: Always include a 1-2 sentence plain-language summary of the most important difference between payers

**Tool Input Design:**
- Drug name resolution: Accept any name (brand, generic, biosimilar) and resolve via the drug alias system from Phase 1
- Policy identification: Support both policy ID string (e.g., "bcbs-nc-bevacizumab-onc") AND payer + drug family as separate params
- list_policies filtering: Support optional payer and drug_family filter params
- Tool descriptions: Written for both audiences — primary description LLM-optimized, with developer notes in extended metadata

**Evidence Presentation:**
- Evidence structure: Both inline and separate — each field in structured_result includes its evidence reference, plus a dedicated evidence array for detailed access
- Source citations: Full citation — include policy title, effective date, and section/page where text appears
- Comparison evidence: Per-payer evidence for each compared field, so readers can verify both sides
- Missing evidence: Flag explicitly — mark field as "no evidence available" for transparency about data gaps

### Claude's Discretion

- Human-readable answer length per tool
- Structured result field selection (full vs subset)
- Exact response formatting and layout
- Loading/caching strategy for policy data

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @modelcontextprotocol/sdk | 1.29.0 | MCP server implementation | Already in use; official TypeScript SDK; v1.x stable for production |
| Zod | 4.3.6 | Input schema validation | Already in use; automatic JSON Schema conversion for MCP wire protocol; type-safe validation |
| TypeScript | 6.0.2 | Type safety | Already in use; project standard |
| Node.js | 25.6.1 | Runtime environment | Already in use; project standard |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs/promises | Built-in | Policy file loading (if needed) | Already handled by policy_store/loader.ts |
| Express | 5.2.1 | HTTP transport for MCP | Already in use; createMcpExpressApp() pattern established |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| In-memory policy cache | Database query per request | Current approach is faster and simpler for 7 policies; no scaling need |
| Zod validation | Manual validation | Zod already integrated; provides automatic JSON Schema generation |
| Custom response format | Free-form JSON | Standardized format enables consistent parsing across tools |

**Installation:**
```bash
# All dependencies already installed
npm list @modelcontextprotocol/sdk zod typescript
```

## Architecture Patterns

### Recommended Project Structure

```
src/mcp/
├── index.ts                           # Existing MCP server entry point
├── tools/
│   ├── get_drug_coverage.ts          # Existing tool (reference pattern)
│   ├── list_policies.ts              # NEW: list all policies with metadata
│   ├── get_policy_summary.ts         # NEW: detailed policy summary
│   └── compare_drug_across_payers.ts # NEW: side-by-side comparison
├── schemas/
│   ├── tool_inputs.ts                # Extend with new tool input schemas
│   └── tool_responses.ts             # NEW: shared response format schemas
├── policy_store/
│   ├── loader.ts                      # Existing policy loader (reuse)
│   └── types.ts                       # Existing policy types
└── utils/
    ├── response_builder.ts            # NEW: standard response format helper
    └── evidence_formatter.ts          # NEW: evidence array formatting
```

### Pattern 1: Standardized Tool Response Format

**What:** All Phase 2 tools return consistent response structure: human-readable answer + structured_result + evidence + confidence

**When to use:** Every new tool in Phase 2 (list_policies, get_policy_summary, compare_drug_across_payers)

**Example:**
```typescript
// Source: MCP SDK best practices + user decisions from CONTEXT.md

interface StandardToolResponse {
  answer: string;                      // Human-readable summary
  structured_result: Record<string, unknown>;  // Typed data for programmatic use
  evidence: EvidenceItem[];            // Source citations with snippets
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  metadata?: {
    query_time_ms?: number;
    policies_searched?: number;
  };
}

interface EvidenceItem {
  field: string;                       // Which field this evidence supports
  text: string;                        // 1-3 sentence snippet
  source: {
    policy_id: string;
    policy_title: string;
    effective_date?: string;
    page: number;
    section: string;
  };
}

// Response builder helper (NEW)
function buildStandardResponse(
  answer: string,
  structuredResult: Record<string, unknown>,
  evidence: EvidenceItem[],
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
): { content: Array<{ type: 'text'; text: string }> } {
  const response: StandardToolResponse = {
    answer,
    structured_result: structuredResult,
    evidence,
    confidence
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }
    ]
  };
}
```

**Rationale:**
- Existing get_drug_coverage tool returns unstructured JSON; standardizing improves consistency
- Evidence array enables source verification critical for healthcare domain
- Confidence levels signal data completeness (HIGH when all fields have evidence)
- Human-readable answer provides quick understanding for LLM consumption

### Pattern 2: Tool Registration with Zod Input Schemas

**What:** Register tools using MCP SDK's `registerTool()` with Zod schemas for automatic validation

**When to use:** All new tools (list_policies, get_policy_summary, compare_drug_across_payers)

**Example:**
```typescript
// Source: Existing get_drug_coverage.ts pattern + MCP SDK docs

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Input schema for list_policies (NEW)
const listPoliciesInput = z.object({
  payer: z.string().optional().describe("Filter by payer (e.g., 'UHC', 'BCBS-NC', 'Cigna'). Omit to list all."),
  drug_family: z.string().optional().describe("Filter by drug generic name (e.g., 'bevacizumab', 'rituximab'). Omit to list all.")
});

export function registerListPolicies(server: McpServer): void {
  server.registerTool(
    'list_policies',
    {
      description: "List all loaded medical policy documents with metadata. Returns payer name, policy title, effective date, and covered drug families. Use this to discover what policies are available before querying for details or comparisons. Optionally filter by payer or drug family.",
      inputSchema: listPoliciesInput.shape  // Zod → JSON Schema automatic conversion
    },
    async (params) => {
      // SDK validates params against schema before calling handler
      const { payer, drug_family } = params;

      // Implementation here
      const policies = getAllPolicies();
      let filtered = policies;

      if (payer) {
        filtered = filtered.filter(p =>
          p.payer.toLowerCase() === payer.toLowerCase()
        );
      }

      if (drug_family) {
        filtered = filtered.filter(p =>
          p.drug.genericName.toLowerCase() === drug_family.toLowerCase()
        );
      }

      return buildStandardResponse(
        `Found ${filtered.length} policies`,
        { policies: filtered.map(formatPolicyMetadata) },
        [],  // No field-level evidence for list operation
        'HIGH'
      );
    }
  );
}
```

**Key points:**
- Zod schema provides both validation and type safety
- `.shape` property converts Zod to JSON Schema for MCP protocol
- SDK validates inputs before handler executes (no manual validation needed)
- Tool description optimized for LLM understanding (when to use, what to expect)

### Pattern 3: Comparison Tool with Difference Highlighting

**What:** Side-by-side comparison showing all fields with differences highlighted and per-payer evidence

**When to use:** compare_drug_across_payers tool implementation

**Example:**
```typescript
// Source: User decisions + comparison table design patterns research

interface ComparisonResult {
  drug_family: string;
  payers_compared: string[];
  comparison: {
    [field: string]: {
      values: Record<string, unknown>;        // payer → value map
      differs: boolean;                        // true if values differ across payers
      evidence: Record<string, EvidenceItem>; // payer → evidence map
    };
  };
  key_differences: string[];  // Plain-language highlights
  key_takeaway: string;       // 1-2 sentence summary
}

function buildComparison(
  drugFamily: string,
  policies: PolicyRecord[]
): ComparisonResult {
  const comparison: ComparisonResult = {
    drug_family: drugFamily,
    payers_compared: policies.map(p => p.payer),
    comparison: {},
    key_differences: [],
    key_takeaway: ''
  };

  // Compare each field across payers
  const fields = ['preferred_products', 'non_preferred_products',
                  'prior_auth_required', 'step_therapy', 'indications'];

  for (const field of fields) {
    const values: Record<string, unknown> = {};
    const evidence: Record<string, EvidenceItem> = {};

    for (const policy of policies) {
      values[policy.payer] = extractField(policy, field);
      evidence[policy.payer] = extractEvidence(policy, field);
    }

    // Detect if values differ
    const uniqueValues = new Set(Object.values(values).map(JSON.stringify));
    const differs = uniqueValues.size > 1;

    comparison.comparison[field] = {
      values,
      differs,
      evidence
    };

    // Highlight key differences (user decision: prioritize coverage criteria)
    if (differs && ['preferred_products', 'step_therapy', 'prior_auth_required'].includes(field)) {
      comparison.key_differences.push(
        formatDifference(field, values)
      );
    }
  }

  // Generate key takeaway (user decision: 1-2 sentence plain-language summary)
  comparison.key_takeaway = generateTakeaway(comparison);

  return comparison;
}

function generateTakeaway(comparison: ComparisonResult): string {
  // Focus on most important difference: preferred/non-preferred split
  const preferredDiff = comparison.comparison['preferred_products'];
  if (preferredDiff?.differs) {
    return `BCBS-NC designates Mvasi and Zirabev as preferred bevacizumab products, while other payers may not distinguish tiers. This affects prior authorization requirements for non-preferred products.`;
  }

  // Fall back to step therapy differences
  const stepDiff = comparison.comparison['step_therapy'];
  if (stepDiff?.differs) {
    return `Step therapy requirements vary: some payers require trial of preferred biosimilars before reference product approval.`;
  }

  return `Coverage criteria are similar across payers for this drug family.`;
}
```

**Design rationale (from research):**
- Side-by-side format enables immediate visual comparison (comparison table design patterns)
- `differs: boolean` flag enables UI highlighting of differences
- Per-payer evidence preserves traceability for each side of comparison
- Key differences prioritize coverage criteria (user decision: preferred/non-preferred, step therapy, prior auth)
- Key takeaway provides plain-language summary (user decision: 1-2 sentences)

### Pattern 4: Policy Store Integration (Reuse Existing)

**What:** Use existing policy_store/loader.ts for all policy data access

**When to use:** All three new tools

**Example:**
```typescript
// Source: Existing src/mcp/policy_store/loader.ts

import { getAllPolicies, findPolicy, findPoliciesByDrug } from '../policy_store/loader.js';
import { normalizeDrugName } from '../../../data/lookup/drug-aliases.js';

// list_policies tool implementation
async function listPoliciesHandler(params: { payer?: string; drug_family?: string }) {
  const allPolicies = getAllPolicies();  // In-memory cache, already loaded

  let filtered = allPolicies;
  if (params.payer) {
    filtered = filtered.filter(p =>
      p.payer.toLowerCase() === params.payer.toLowerCase()
    );
  }
  if (params.drug_family) {
    const normalized = normalizeDrugName(params.drug_family);
    filtered = filtered.filter(p =>
      p.drug.genericName.toLowerCase() === normalized.toLowerCase()
    );
  }

  return filtered;
}

// get_policy_summary tool implementation
async function getPolicySummaryHandler(params: { policy_id?: string; payer?: string; drug?: string }) {
  let policy: PolicyRecord | undefined;

  // User decision: support both policy ID and payer+drug params
  if (params.policy_id) {
    policy = getAllPolicies().find(p => p.id === params.policy_id);
  } else if (params.payer && params.drug) {
    const normalized = normalizeDrugName(params.drug);
    policy = findPolicy(params.payer, normalized);
  }

  if (!policy) {
    return buildErrorResponse('Policy not found', {
      available_payers: [...new Set(getAllPolicies().map(p => p.payer))],
      available_drugs: [...new Set(getAllPolicies().map(p => p.drug.genericName))]
    });
  }

  return policy;
}

// compare_drug_across_payers tool implementation
async function compareHandler(params: { drug_family: string }) {
  const normalized = normalizeDrugName(params.drug_family);
  const policies = findPoliciesByDrug(normalized);  // Existing helper

  if (policies.length === 0) {
    return buildErrorResponse('Drug not found', {
      available_drugs: [...new Set(getAllPolicies().map(p => p.drug.genericName))],
      hint: 'Try bevacizumab, rituximab, adalimumab, or other loaded drugs'
    });
  }

  return buildComparison(normalized, policies);
}
```

**Why reuse existing loader:**
- Policy store already handles: file loading, Zod validation, in-memory caching, error handling
- `getAllPolicies()` returns all 7 policies (5 RA + 2 oncology from Phase 1)
- `findPoliciesByDrug()` already implements cross-payer lookup for comparisons
- No need to rebuild infrastructure that's working

### Pattern 5: Evidence Array Construction

**What:** Extract evidence from policy records into standardized evidence array format

**When to use:** get_policy_summary and compare_drug_across_payers tools

**Example:**
```typescript
// Source: Existing policy schema + user decision on evidence structure

function extractEvidenceArray(policy: PolicyRecord): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];

  // Extract from diagnosis requirements
  for (const diag of policy.diagnosisRequirements) {
    evidence.push({
      field: 'diagnosis_requirements',
      text: diag.evidenceText,
      source: {
        policy_id: policy.id,
        policy_title: policy.policyTitle || policy.sourceDocument.filename,
        effective_date: policy.sourceDocument.effectiveDate,
        page: diag.source.page,
        section: diag.source.section
      }
    });
  }

  // Extract from step therapy
  for (const step of policy.stepTherapy) {
    evidence.push({
      field: 'step_therapy',
      text: step.evidenceText,
      source: {
        policy_id: policy.id,
        policy_title: policy.policyTitle || policy.sourceDocument.filename,
        effective_date: policy.sourceDocument.effectiveDate,
        page: step.source.page,
        section: step.source.section
      }
    });
  }

  // Extract from other requirements
  for (const req of policy.otherRequirements) {
    evidence.push({
      field: req.category,
      text: req.evidenceText,
      source: {
        policy_id: policy.id,
        policy_title: policy.policyTitle || policy.sourceDocument.filename,
        effective_date: policy.sourceDocument.effectiveDate,
        page: req.source.page,
        section: req.source.section
      }
    });
  }

  return evidence;
}

// Confidence calculation (user decision: HIGH when all fields have evidence)
function calculateConfidence(policy: PolicyRecord): 'HIGH' | 'MEDIUM' | 'LOW' {
  const hasEvidence = {
    diagnosis: policy.diagnosisRequirements.some(d => d.evidenceText),
    stepTherapy: policy.stepTherapy.every(s => s.evidenceText) || policy.stepTherapy.length === 0,
    other: policy.otherRequirements.every(r => r.evidenceText)
  };

  const allFieldsHaveEvidence = Object.values(hasEvidence).every(v => v);
  return allFieldsHaveEvidence ? 'HIGH' : 'MEDIUM';
}
```

**Evidence structure notes:**
- User decision: both inline (in structured_result) and separate (evidence array)
- Policy schema already has evidenceText + source for all fields
- Full citation includes: policy title, effective date, section, page (user decision)
- Comparison tool must preserve per-payer evidence (user decision)

### Anti-Patterns to Avoid

- **Embedding business logic in tool handlers:** Extract to utility functions for testability and reuse
- **Custom validation instead of Zod:** SDK validates automatically; leverage existing integration
- **Breaking existing tools:** get_drug_coverage, get_prior_auth_criteria, check_patient_readiness continue working as-is
- **Inconsistent response formats:** Use standardized response builder across all new tools
- **Missing evidence for deterministic lookups:** Deterministic = HIGH confidence by definition; always include evidence array
- **Returning entire PolicyRecord objects:** Select relevant fields for structured_result to reduce token usage

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MCP protocol implementation | Custom JSON-RPC handler | @modelcontextprotocol/sdk | Handles protocol versioning, transport, session management |
| Input validation | Manual type checks | Zod schemas with `.shape` | Automatic JSON Schema generation, type safety, error messages |
| Policy loading | Per-request file reads | Existing policy_store/loader.ts | In-memory cache, load-time validation, centralized error handling |
| Drug name normalization | String similarity | Existing drug-aliases.ts lookup | Handles biosimilar families, brand/generic/biosimilar all resolve to canonical |
| Evidence extraction | String manipulation | Policy schema's evidenceText fields | Phase 1 already mapped evidence to every field |
| Response formatting | String concatenation | buildStandardResponse() helper | Ensures consistency across tools |

**Key insight:** Phase 1 and existing tools solved the hard problems (policy loading, schema validation, evidence mapping, drug normalization). Phase 2 composes these primitives into new capabilities. Don't rebuild working infrastructure.

## Common Pitfalls

### Pitfall 1: Inconsistent Confidence Levels

**What goes wrong:** Some tools return HIGH confidence for incomplete data, others return MEDIUM for complete data

**Why it happens:** No clear definition of confidence criteria

**How to avoid:**
- HIGH: All fields in structured_result have corresponding evidence snippets
- MEDIUM: Some fields missing evidence OR partial data (e.g., only 1 payer loaded for comparison)
- LOW: Data quality issues or ambiguous policy language (use `ambiguous: true` flag from schema)
- Deterministic lookups default to HIGH unless evidence is incomplete

**Warning signs:**
- Confidence levels vary for same query across multiple calls
- HIGH confidence returned when evidence array is empty

### Pitfall 2: Missing Payer Handling in Comparison Tool

**What goes wrong:** Comparison fails or returns confusing results when only 1 payer has loaded policy

**Why it happens:** User decision says "show available + mark missing" but implementation doesn't handle this

**How to avoid:**
- When comparing bevacizumab: BCBS-NC and Cigna policies might not both exist
- If only 1 payer loaded: still return comparison with "No policy loaded" for missing payers
- Include explanation: "Only BCBS-NC policy available for bevacizumab. Add Cigna policy to enable comparison."
- Return MEDIUM confidence when partial data

**Warning signs:**
- Comparison tool returns empty result instead of partial comparison
- No guidance on how to load missing policies

### Pitfall 3: Tool Descriptions Not LLM-Optimized

**What goes wrong:** LLM selects wrong tool for user query because description is unclear

**Why it happens:** Descriptions written for developers, not for LLM tool selection

**How to avoid:**
- Start with "when to use" guidance: "Use this tool when user asks about..."
- Include example queries: "Returns... Optionally filter by..."
- Mention what tool returns: "Returns payer name, policy title, effective date..."
- User decision: write for both audiences (LLM primary, developer notes in extended metadata)

**Warning signs:**
- LLM calls get_policy_summary when user wants comparison
- LLM tries to call compare_drug_across_payers for single-payer query

### Pitfall 4: Evidence Array Duplication

**What goes wrong:** Evidence snippets repeated in both inline structured_result and evidence array, bloating response

**Why it happens:** User decision says "both inline and separate" but unclear how to avoid duplication

**How to avoid:**
- Inline evidence: include evidence *reference* (page, section) not full text
- Evidence array: include full evidenceText snippets
- Structured_result references evidence by field name: `{ field: 'step_therapy', evidence_ref: 'step_therapy' }`
- User decision clarified: each field *includes its evidence reference*, separate array for *detailed access*

**Warning signs:**
- Response size > 10KB for single policy summary
- Same 200-character evidence snippet appears 3+ times in response

### Pitfall 5: Comparison Key Takeaway Too Generic

**What goes wrong:** Key takeaway says "Coverage varies" without specifics

**Why it happens:** No logic to identify most important difference

**How to avoid:**
- User decision: prioritize preferred/non-preferred splits, step therapy, prior auth
- Check fields in priority order: preferred_products → step_therapy → prior_auth_required
- Generate specific takeaway: "BCBS-NC designates Mvasi/Zirabev as preferred..." not "Coverage differs"
- Include business impact if detectable: "...affects prior authorization requirements"

**Warning signs:**
- Key takeaway identical for bevacizumab and rituximab comparisons
- Takeaway doesn't mention specific drug names or payers

## Code Examples

Verified patterns from existing codebase and research:

### Tool Registration Pattern (Existing Reference)

```typescript
// Source: src/mcp/tools/get_drug_coverage.ts (existing)

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { drugCoverageInput } from '../schemas/tool_inputs.js';

export function registerGetDrugCoverage(server: McpServer): void {
  server.registerTool(
    'get_drug_coverage',
    {
      description: "Determine if a specific drug is covered by a health insurance plan for rheumatoid arthritis treatment. Returns coverage status (covered, not covered, covered with prior authorization), the source policy document reference, and direct quotes from the policy supporting the determination. Use this tool when a user asks about whether a drug is covered, if prior auth is needed, or what a plan's stance is on a medication.",
      inputSchema: drugCoverageInput.shape  // Zod → JSON Schema
    },
    async ({ plan, drug }) => {
      // Implementation...
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );
}
```

### list_policies Tool Implementation (NEW)

```typescript
// Source: New implementation following existing patterns

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getAllPolicies } from '../policy_store/loader.js';
import { normalizeDrugName } from '../../../data/lookup/drug-aliases.js';

const listPoliciesInput = z.object({
  payer: z.string().optional().describe("Filter by payer (e.g., 'UHC', 'BCBS-NC', 'Cigna'). Omit to list all."),
  drug_family: z.string().optional().describe("Filter by drug generic name (e.g., 'bevacizumab', 'rituximab'). Omit to list all.")
});

export function registerListPolicies(server: McpServer): void {
  server.registerTool(
    'list_policies',
    {
      description: "List all loaded medical policy documents with metadata. Returns payer name, policy title, effective date, and covered drug families. Use this to discover what policies are available before querying for details or comparisons. Optionally filter by payer or drug family.",
      inputSchema: listPoliciesInput.shape
    },
    async (params) => {
      const { payer, drug_family } = params;
      const allPolicies = getAllPolicies();

      let filtered = allPolicies;
      if (payer) {
        const payerKey = payer.toLowerCase().split('-')[0];
        filtered = filtered.filter(p =>
          p.payer.toLowerCase().includes(payerKey)
        );
      }
      if (drug_family) {
        const normalized = normalizeDrugName(drug_family);
        filtered = filtered.filter(p =>
          p.drug.genericName.toLowerCase() === normalized.toLowerCase()
        );
      }

      const metadata = filtered.map(p => ({
        policy_id: p.id,
        payer: p.payer,
        policy_title: p.policyTitle || p.sourceDocument.filename,
        effective_date: p.sourceDocument.effectiveDate,
        drug_family: p.drug.genericName,
        indications: p.indications || [p.indication]
      }));

      const response = {
        answer: `Found ${filtered.length} ${payer ? payer + ' ' : ''}${drug_family ? drug_family + ' ' : ''}policies`,
        structured_result: {
          total_count: filtered.length,
          policies: metadata
        },
        evidence: [],  // List operation doesn't cite evidence
        confidence: 'HIGH'
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }
        ]
      };
    }
  );
}
```

### get_policy_summary Tool Implementation (NEW)

```typescript
// Source: New implementation following existing patterns + user decisions

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getAllPolicies, findPolicy } from '../policy_store/loader.js';
import { normalizeDrugName } from '../../../data/lookup/drug-aliases.js';

const policySummaryInput = z.object({
  policy_id: z.string().optional().describe("Policy ID (e.g., 'bcbs-nc-bevacizumab-oncology')"),
  payer: z.string().optional().describe("Payer name (e.g., 'BCBS-NC', 'Cigna')"),
  drug: z.string().optional().describe("Drug name - brand, generic, or biosimilar (e.g., 'bevacizumab', 'Avastin', 'Mvasi')")
}).refine(data => data.policy_id || (data.payer && data.drug), {
  message: "Must provide either policy_id OR both payer and drug"
});

export function registerGetPolicySummary(server: McpServer): void {
  server.registerTool(
    'get_policy_summary',
    {
      description: "Get detailed summary of a single medical policy including all coverage criteria, prior authorization requirements, step therapy logic, preferred/non-preferred product tiers, and evidence citations. Use this when user asks about specific requirements for a drug under a particular payer. Returns structured normalized data with source evidence.",
      inputSchema: policySummaryInput.shape
    },
    async (params) => {
      let policy;

      if (params.policy_id) {
        policy = getAllPolicies().find(p => p.id === params.policy_id);
      } else if (params.payer && params.drug) {
        const normalized = normalizeDrugName(params.drug);
        policy = findPolicy(params.payer, normalized);
      }

      if (!policy) {
        const allPolicies = getAllPolicies();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Policy not found',
                message: `No policy found for ${params.policy_id || `${params.payer} + ${params.drug}`}`,
                available_payers: [...new Set(allPolicies.map(p => p.payer))],
                available_drugs: [...new Set(allPolicies.map(p => p.drug.genericName))],
                hint: 'Use list_policies tool to see all available policies'
              }, null, 2)
            }
          ]
        };
      }

      // Build structured result (query-relevant subset, user decision)
      const structured = {
        policy_id: policy.id,
        payer: policy.payer,
        policy_title: policy.policyTitle,
        effective_date: policy.sourceDocument.effectiveDate,
        drug: {
          generic_name: policy.drug.genericName,
          brand_name: policy.drug.brandName,
          preferred_products: policy.drug.products?.filter(p => p.tier === 'preferred').map(p => p.name) || [],
          non_preferred_products: policy.drug.products?.filter(p => p.tier === 'non-preferred').map(p => p.name) || []
        },
        coverage: {
          status: policy.coverageStatus,
          prior_auth_required: policy.paRequired,
          indications: policy.indications || [policy.indication]
        },
        requirements: {
          diagnosis: policy.diagnosisRequirements.map(d => ({
            icd10_codes: d.icd10Codes,
            description: d.description,
            evidence_ref: 'diagnosis_requirements'
          })),
          step_therapy: policy.stepTherapy.map(s => ({
            prior_drug: s.drugName,
            duration: s.duration,
            failure_criteria: s.failureCriteria,
            evidence_ref: 'step_therapy'
          })),
          other: policy.otherRequirements.map(r => ({
            category: r.category,
            requirement: r.requirement,
            ambiguous: r.ambiguous,
            evidence_ref: r.category
          }))
        }
      };

      // Extract evidence array
      const evidence = [];
      for (const diag of policy.diagnosisRequirements) {
        evidence.push({
          field: 'diagnosis_requirements',
          text: diag.evidenceText,
          source: {
            policy_id: policy.id,
            policy_title: policy.policyTitle || policy.sourceDocument.filename,
            effective_date: policy.sourceDocument.effectiveDate,
            page: diag.source.page,
            section: diag.source.section
          }
        });
      }
      for (const step of policy.stepTherapy) {
        evidence.push({
          field: 'step_therapy',
          text: step.evidenceText,
          source: {
            policy_id: policy.id,
            policy_title: policy.policyTitle || policy.sourceDocument.filename,
            effective_date: policy.sourceDocument.effectiveDate,
            page: step.source.page,
            section: step.source.section
          }
        });
      }
      for (const req of policy.otherRequirements) {
        evidence.push({
          field: req.category,
          text: req.evidenceText,
          source: {
            policy_id: policy.id,
            policy_title: policy.policyTitle || policy.sourceDocument.filename,
            effective_date: policy.sourceDocument.effectiveDate,
            page: req.source.page,
            section: req.source.section
          }
        });
      }

      // Confidence: HIGH when all fields have evidence
      const hasEvidence = evidence.length > 0;
      const allFieldsHaveEvidence =
        policy.diagnosisRequirements.every(d => d.evidenceText) &&
        policy.stepTherapy.every(s => s.evidenceText) &&
        policy.otherRequirements.every(r => r.evidenceText);

      const response = {
        answer: `${policy.payer} ${policy.drug.genericName} policy: ${policy.coverageStatus}, ${policy.paRequired ? 'prior auth required' : 'no prior auth'}. ${policy.stepTherapy.length > 0 ? `Step therapy: ${policy.stepTherapy[0].drugName}.` : ''} ${policy.drug.products?.filter(p => p.tier === 'preferred').length || 0} preferred products.`,
        structured_result: structured,
        evidence: evidence,
        confidence: (hasEvidence && allFieldsHaveEvidence) ? 'HIGH' : 'MEDIUM'
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }
        ]
      };
    }
  );
}
```

### compare_drug_across_payers Tool Implementation (NEW)

```typescript
// Source: New implementation following user decisions + comparison design patterns

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { findPoliciesByDrug, getAllPolicies } from '../policy_store/loader.js';
import { normalizeDrugName } from '../../../data/lookup/drug-aliases.js';

const compareDrugInput = z.object({
  drug_family: z.string().describe("Drug family generic name (e.g., 'bevacizumab', 'rituximab')")
});

export function registerCompareDrug(server: McpServer): void {
  server.registerTool(
    'compare_drug_across_payers',
    {
      description: "Compare coverage policies for the same drug family across different payers. Returns side-by-side comparison showing preferred vs non-preferred products, prior authorization requirements, step therapy logic, and key differences highlighted. Use this when user asks 'how does X coverage differ between payers' or 'compare Y across plans'.",
      inputSchema: compareDrugInput.shape
    },
    async (params) => {
      const normalized = normalizeDrugName(params.drug_family);
      const policies = findPoliciesByDrug(normalized);

      if (policies.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Drug not found',
                message: `No policies loaded for drug family "${params.drug_family}" (normalized to "${normalized}")`,
                available_drugs: [...new Set(getAllPolicies().map(p => p.drug.genericName))],
                hint: 'Try bevacizumab, rituximab, adalimumab, or use list_policies to see all drugs'
              }, null, 2)
            }
          ]
        };
      }

      // Build comparison object
      const comparison: Record<string, any> = {};
      const payers = policies.map(p => p.payer);

      // Compare preferred products
      comparison.preferred_products = {
        values: {},
        differs: false,
        evidence: {}
      };
      for (const policy of policies) {
        const preferred = policy.drug.products?.filter(p => p.tier === 'preferred').map(p => p.name) || [];
        comparison.preferred_products.values[policy.payer] = preferred;

        // Extract evidence for preferred products
        const prefReq = policy.otherRequirements.find(r => r.category === 'preferred product requirement');
        if (prefReq) {
          comparison.preferred_products.evidence[policy.payer] = {
            field: 'preferred_products',
            text: prefReq.evidenceText,
            source: {
              policy_id: policy.id,
              policy_title: policy.policyTitle || policy.sourceDocument.filename,
              effective_date: policy.sourceDocument.effectiveDate,
              page: prefReq.source.page,
              section: prefReq.source.section
            }
          };
        }
      }
      const uniquePreferred = new Set(
        Object.values(comparison.preferred_products.values).map(v => JSON.stringify(v))
      );
      comparison.preferred_products.differs = uniquePreferred.size > 1;

      // Compare step therapy (similar pattern)
      comparison.step_therapy = {
        values: {},
        differs: false,
        evidence: {}
      };
      for (const policy of policies) {
        comparison.step_therapy.values[policy.payer] = policy.stepTherapy.map(s => ({
          prior_drug: s.drugName,
          duration: s.duration
        }));

        if (policy.stepTherapy.length > 0) {
          comparison.step_therapy.evidence[policy.payer] = {
            field: 'step_therapy',
            text: policy.stepTherapy[0].evidenceText,
            source: {
              policy_id: policy.id,
              policy_title: policy.policyTitle || policy.sourceDocument.filename,
              effective_date: policy.sourceDocument.effectiveDate,
              page: policy.stepTherapy[0].source.page,
              section: policy.stepTherapy[0].source.section
            }
          };
        }
      }
      const uniqueStep = new Set(
        Object.values(comparison.step_therapy.values).map(v => JSON.stringify(v))
      );
      comparison.step_therapy.differs = uniqueStep.size > 1;

      // Compare prior auth (boolean field)
      comparison.prior_auth_required = {
        values: {},
        differs: false,
        evidence: {}
      };
      for (const policy of policies) {
        comparison.prior_auth_required.values[policy.payer] = policy.paRequired;
      }
      const uniquePA = new Set(Object.values(comparison.prior_auth_required.values));
      comparison.prior_auth_required.differs = uniquePA.size > 1;

      // Generate key differences (user decision: prioritize coverage criteria)
      const keyDifferences = [];
      if (comparison.preferred_products.differs) {
        const payersWithPreferred = Object.entries(comparison.preferred_products.values)
          .filter(([_, v]) => (v as string[]).length > 0)
          .map(([payer, _]) => payer);
        if (payersWithPreferred.length > 0) {
          keyDifferences.push(
            `Preferred product tiers: ${payersWithPreferred.join(', ')} designate specific biosimilars as preferred`
          );
        }
      }
      if (comparison.step_therapy.differs) {
        keyDifferences.push('Step therapy requirements vary across payers');
      }
      if (comparison.prior_auth_required.differs) {
        keyDifferences.push('Prior authorization requirements differ');
      }

      // Generate key takeaway (user decision: 1-2 sentence plain-language)
      let keyTakeaway = '';
      if (comparison.preferred_products.differs) {
        const bcbsPreferred = comparison.preferred_products.values['BCBS-NC'];
        if (bcbsPreferred && bcbsPreferred.length > 0) {
          keyTakeaway = `BCBS-NC designates ${bcbsPreferred.join(' and ')} as preferred ${normalized} products, requiring documented trial and failure for non-preferred products. Other payers may not distinguish product tiers.`;
        } else {
          keyTakeaway = `Payers differ in preferred biosimilar designation for ${normalized}, affecting prior authorization pathways.`;
        }
      } else if (comparison.step_therapy.differs) {
        keyTakeaway = `Step therapy requirements vary: some payers require trial of specific prior medications before ${normalized} approval.`;
      } else {
        keyTakeaway = `Coverage criteria are similar across payers for ${normalized}.`;
      }

      // Flatten evidence array
      const allEvidence = [];
      for (const field of Object.keys(comparison)) {
        for (const [payer, ev] of Object.entries(comparison[field].evidence || {})) {
          allEvidence.push(ev);
        }
      }

      const response = {
        answer: `Compared ${normalized} across ${payers.length} payers: ${payers.join(', ')}. ${keyDifferences.length > 0 ? 'Key differences: ' + keyDifferences.join('; ') : 'No major differences detected'}.`,
        structured_result: {
          drug_family: normalized,
          payers_compared: payers,
          comparison: comparison,
          key_differences: keyDifferences,
          key_takeaway: keyTakeaway
        },
        evidence: allEvidence,
        confidence: policies.length > 1 ? 'HIGH' : 'MEDIUM'  // MEDIUM if only 1 payer
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2)
          }
        ]
      };
    }
  );
}
```

### Registering New Tools in MCP Server

```typescript
// Source: src/mcp/index.ts (modification)

import { registerGetDrugCoverage } from './tools/get_drug_coverage.js';
import { registerGetPriorAuthCriteria } from './tools/get_prior_auth_criteria.js';
import { registerCheckPatientReadiness } from './tools/check_patient_readiness.js';
// NEW: Phase 2 tools
import { registerListPolicies } from './tools/list_policies.js';
import { registerGetPolicySummary } from './tools/get_policy_summary.js';
import { registerCompareDrug } from './tools/compare_drug_across_payers.js';

// In createMcpApp(), inside POST /mcp handler:
registerGetDrugCoverage(server);
registerGetPriorAuthCriteria(server);
registerCheckPatientReadiness(server);
// NEW: Register Phase 2 tools
registerListPolicies(server);
registerGetPolicySummary(server);
registerCompareDrug(server);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Free-form JSON responses | Standardized response format (answer + structured_result + evidence + confidence) | Phase 2 design decision | Enables consistent parsing, evidence verification, confidence assessment |
| Single evidence field | Evidence array with per-field citations | Phase 1 schema design | Supports source traceability for every claim |
| Comparison as text description | Side-by-side structured comparison with difference highlighting | Comparison table design patterns (2024+) | Enables UI highlighting, programmatic difference detection |
| LLM-based policy parsing | Deterministic lookup against normalized data | Phase 1 + 2 architecture | Eliminates hallucination risk, guarantees evidence grounding |
| Generic error messages | Helpful suggestions with available options | MCP best practices (2025+) | Improves discoverability, reduces user frustration |

**Deprecated/outdated:**
- **Unstructured MCP responses**: MCP spec (Nov 2025) now encourages structured content alongside text
- **Evidence-free AI responses in healthcare**: Regulatory and trust requirements now demand source citations
- **Single-format comparisons**: Modern comparison tools provide both side-by-side (completeness) and difference-only (clarity) views

## Open Questions

1. **Response Size Limits**
   - What we know: MCP tools return JSON via `content: [{ type: 'text', text: String }]`
   - What's unclear: Is there a practical size limit for tool responses? Should we truncate for large policies?
   - Recommendation: Start without truncation; 7 policies unlikely to hit limits; add pagination if needed

2. **Comparison with Missing Payers**
   - What we know: User decision says "show available + mark missing"
   - What's unclear: Should comparison fail if <2 payers, or show single-payer data with note?
   - Recommendation: Show single-payer data with MEDIUM confidence and note: "Only 1 payer loaded; add more policies to enable comparison"

3. **Human-Readable Answer Length**
   - What we know: User decision says "Claude's discretion per tool"
   - What's unclear: Optimal length for LLM consumption vs human readability
   - Recommendation: list_policies = 1 sentence, get_policy_summary = 2-3 sentences, compare = 3-4 sentences with key takeaway

4. **Evidence Array Ordering**
   - What we know: Evidence array includes all field-level citations
   - What's unclear: Should evidence be ordered by importance, by field order, or by page number?
   - Recommendation: Order by field appearance in structured_result for easier cross-referencing

5. **Confidence Calculation for Ambiguous Fields**
   - What we know: Policy schema has `ambiguous: boolean` flag on OtherRequirement
   - What's unclear: Should ambiguous fields lower confidence even if evidence exists?
   - Recommendation: Ambiguous fields don't lower confidence; confidence based on evidence presence only; note ambiguity in field itself

## Sources

### Primary (HIGH confidence)

- **Existing Codebase**: `/Users/hero4440/Documents/Code/inovationhacks_2/`
  - `src/mcp/index.ts` — MCP server setup, tool registration pattern
  - `src/mcp/tools/get_drug_coverage.ts` — Existing tool implementation reference
  - `src/mcp/policy_store/loader.ts` — Policy loading and lookup functions
  - `data/schemas/policy.schema.ts` — Policy record schema with evidence structure
  - `data/policies/structured/bcbs-nc-bevacizumab-oncology.json` — Example policy with preferred/non-preferred tiers
  - `package.json` — @modelcontextprotocol/sdk 1.29.0, Zod 4.3.6

- **MCP SDK Official Documentation**:
  - GitHub: [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) — Official TypeScript SDK repository
  - npm: [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) — Package documentation
  - Docs: [typescript-sdk/docs/server.md](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md) — Server implementation guide

### Secondary (MEDIUM confidence)

- **MCP Design Patterns** (verified with multiple sources):
  - Medium: [Agent-Aware MCP: 10 Patterns for Actionable Tool Responses](https://medium.com/@kumaran.isk/agent-aware-mcp-10-patterns-for-actionable-tool-responses-54029e337941) — Reasoning steps, error handling patterns
  - MCP Bundles: [The Six-Tool Pattern: MCP Server Design That Scales](https://www.mcpbundles.com/blog/mcp-tool-design-pattern) — Tool organization principles
  - Klavis: [Less is More: 4 design patterns for building better MCP servers](https://www.klavis.ai/blog/less-is-more-mcp-design-patterns-for-ai-agents) — Deterministic routing patterns

- **Structured Output & Confidence Levels**:
  - FastMCP: [Tools - FastMCP](https://gofastmcp.com/servers/tools) — Output schema examples, metadata patterns
  - ForgeCode: [MCP 2025-06-18 Spec Update](https://forgecode.dev/blog/mcp-spec-updates/) — Structured content, confidence fields

- **Evidence-Based Healthcare AI**:
  - Wolters Kluwer: [AI in UpToDate](https://www.wolterskluwer.com/en/solutions/uptodate/ai-clinical-decision-support) — Citation validation, evidence grounding
  - Elsevier: [ClinicalKey AI](https://www.elsevier.com/products/clinicalkey/clinicalkey-ai) — Trusted content, source prioritization

- **Comparison Table Design**:
  - NN/g: [Comparison Tables for Products, Services, and Features](https://www.nngroup.com/articles/comparison-tables/) — Side-by-side layouts, difference highlighting
  - Smashing Magazine: [Designing The Perfect Feature Comparison Table](https://www.smashingmagazine.com/2017/08/designing-perfect-feature-comparison-table/) — Focus on key differences, interactive features

### Tertiary (LOW confidence)

- **General AI Tool Design**: Medium/DEV Community articles on MCP — educational content, not official specs; used for pattern discovery only

## Metadata

**Confidence breakdown:**
- **Standard stack**: HIGH — All libraries already in use, versions verified via package.json and existing tool implementations
- **Architecture patterns**: HIGH — Patterns extracted from existing get_drug_coverage.ts, policy_store/loader.ts, validated against MCP SDK docs
- **Tool response design**: MEDIUM-HIGH — User decisions from CONTEXT.md provide clear guidance; MCP spec updates support structured content
- **Comparison logic**: MEDIUM — Comparison table design patterns well-established; specific implementation for policy data is new
- **Evidence presentation**: HIGH — Policy schema already has evidence structure; extraction pattern straightforward

**Research date:** 2026-04-12
**Valid until:** 2026-05-12 (30 days for stable domain — MCP SDK v1.x is stable, policy schema from Phase 1 is locked)

**Research completeness:**
- ✅ All domains investigated (MCP SDK, tool patterns, response design, comparison logic, evidence handling)
- ✅ Existing codebase thoroughly reviewed (3 existing tools, policy store, schema structure)
- ✅ User decisions from CONTEXT.md incorporated into all patterns
- ✅ Multiple sources cross-referenced for MCP best practices (SDK docs, design pattern articles, healthcare AI standards)
- ✅ Confidence levels assigned honestly (HIGH for existing infrastructure, MEDIUM for new comparison patterns)
- ✅ "What might I have missed?" review completed — flagged open questions on response size limits, missing payer handling

**Notes:**
- Existing codebase provides exceptionally strong foundation — policy store, schema, evidence mapping all production-ready
- MCP SDK integration already proven with 3 working tools (get_drug_coverage, get_prior_auth_criteria, check_patient_readiness)
- Phase 2 is primarily composition work: combine existing primitives (policy lookup, drug normalization, evidence extraction) into new capabilities (list, summary, compare)
- User decisions from CONTEXT.md are well-scoped and actionable — no conflicting requirements detected
- Comparison tool is the most complex new feature; side-by-side format with difference highlighting is well-established pattern in other domains (product comparison tables, feature matrices)
