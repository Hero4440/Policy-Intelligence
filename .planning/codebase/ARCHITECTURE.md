# Architecture

**Analysis Date:** 2026-04-11

## Pattern Overview

**Overall:** Multi-tier service architecture with three distinct interfaces:

1. **MCP (Model Context Protocol) Server** - Direct policy query tool registry
2. **Express API Server** - Stateless REST endpoints for ingestion, data management, and chat
3. **React Frontend** - Single-page application consuming both APIs

**Key Characteristics:**
- Clear separation between policy data layer, query engines, and presentation
- Stateless HTTP transports for both MCP and REST APIs
- File-based policy store loaded at startup (immutable during runtime)
- Multiple data normalization pipelines for ingested content
- Asynchronous FHIR patient data integration for readiness analysis

## Layers

**Policy Data Layer:**
- Purpose: Immutable, validated policy records loaded from filesystem
- Location: `src/mcp/policy_store/loader.ts`
- Contains: PolicyRecord schema validation, in-memory cache of all policies
- Depends on: Filesystem (data/policies/structured/), Zod schema validation
- Used by: All query tools (get_drug_coverage, get_prior_auth_criteria, check_patient_readiness)
- Pattern: Synchronous file loading on module init, read-only accessor functions

**Query Engine Layer:**
- Purpose: Execute policy searches and criteria matching against loaded policies
- Location: `src/mcp/tools/` (get_drug_coverage.ts, get_prior_auth_criteria.ts, check_patient_readiness.ts)
- Contains: MCP tool registration, input validation, policy lookup logic
- Depends on: Policy store, drug normalization, FHIR client (optional)
- Used by: MCP server, chat backend

**Patient Data Layer:**
- Purpose: Fetch and extract FHIR patient context for readiness analysis
- Location: `src/mcp/fhir/`
- Contains: FHIR client with bearer token auth, patient bundle pagination, data extraction
- Depends on: fhir-kit-client, patient context headers
- Used by: check_patient_readiness tool, readiness view component

**Ingestion Pipeline:**
- Purpose: Accept multiple file formats and normalize into queryable coverage snapshots
- Location: `src/server/ingestion/index.ts`
- Contains: File type detection, PDF/CSV/JSON/DOCX parsing, drug detection, issuer inference, validation
- Depends on: pdf-parse, drug lexicon, policy schema
- Used by: REST upload endpoint, Anton Rx catalog builder

**Anton Rx Catalog Layer:**
- Purpose: Unified coverage search interface combining structured policies and ingested data
- Location: `src/server/antonrx-data.ts`
- Contains: Drug/plan matching, change tracking, plan enrichment
- Depends on: Structured policies, ingested snapshots, normalization utilities
- Used by: Frontend compare view, chat tool executor

**Frontend State & Views:**
- Purpose: Interactive policy search, plan comparison, patient readiness checking
- Location: `src/frontend/`
- Contains: React components for workspace, comparison, data ingestion, detail views
- Depends on: Anton Rx API, ingestion API, session management
- Used by: Browser clients

## Data Flow

**Policy Query Flow:**

1. User requests drug coverage via MCP tool (get_drug_coverage)
2. Tool normalizes drug name using alias lookup
3. Policy store's findPolicy() searches loaded policies by payer + normalized drug
4. Tool formats response with coverage status, prior auth, evidence
5. Response returned as JSON text via MCP

**Patient Readiness Analysis Flow:**

1. User invokes check_patient_readiness with plan, drug, and optional FHIR token
2. Policy is located via query engine
3. If FHIR token provided:
   - FHIR client established with bearer auth
   - Patient bundle fetched with pagination
   - Patient data extracted (diagnoses, medications, coverage)
   - matchPatientAgainstPolicy() compares patient data to policy criteria
   - Results categorized: appears_to_match, may_be_missing, documentation_may_be_needed, unable_to_verify
4. If no FHIR token: criteria checklist returned for manual review
5. Result includes disclaimer and source attribution

**File Ingestion Flow:**

1. User uploads file via /api/ingestion/upload
2. File classified by MIME type and extension
3. Based on sourceKind (pdf, csv, json_policy, docx, jsonl):
   - Extracted text cleaned
   - Issuer inferred from filename/content
   - Effective date detected via regex
   - Drugs detected against known drug lexicon
   - Parsed into IngestedCoverageSnapshot records
4. Snapshots validated against schema
5. Snapshots persisted to data/ingestion/
6. Anton Rx catalog invalidated (rebuilt on next query)
7. Response includes snapshot counts and notes

**Frontend Workspace Flow:**

1. User selects drug via search input (e.g., "adalimumab")
2. App.tsx triggers fetchAntonRxCompare() which calls /api/antonrx/compare
3. API returns AntonRxCoverageMatch[] across all plans
4. User selects plan → triggers fetchAntonRxDetail()
5. Detail view renders coverage status, requirements, plan rules
6. User can toggle plan for comparison view
7. Change watch shows policy updates across time

**State Management:**
- Frontend: React hooks (useState, useEffect, useMemo)
- Backend: Stateless HTTP - each request independent
- Persistence: Filesystem (policies, ingestion records, sessions)
- In-memory: Policy cache (loaded once at MCP startup)

## Key Abstractions

**PolicyRecord:**
- Purpose: Structured representation of a single payer-drug policy with full clinical criteria
- Examples: `data/policies/structured/uhc-adalimumab-ra.json`
- Pattern: JSON schema validated at load time, immutable, referenced by all query tools
- Fields: drug (brand/generic/aliases), payer, plan, coverage status, prior auth requirements, diagnosis requirements, step therapy, other requirements, source document reference

**IngestedCoverageSnapshot:**
- Purpose: Normalized coverage data from uploaded files, queryable like Anton Rx formulary entries
- Location: Generated by ingestion pipeline, persisted to `data/ingestion/db.json`
- Pattern: Flat structure with boolean flags, text summaries, confidence labels, rule facets
- Used by: Anton Rx comparison engine for unified search across structured + ingested

**AntonRxCoverageMatch:**
- Purpose: Single plan-drug match result with coverage signals and source provenance
- Location: `src/server/antonrx-data.ts`
- Pattern: Contains coverage label, confidence, prior auth/step therapy flags, requirements summary
- Used by: Frontend PolicyList, DetailTabs, comparison builders

**NormalizedRuleFacet:**
- Purpose: Structured categorization of coverage rules extracted from policies
- Examples: prior_auth_required, step_therapy, quantity_limit, medical_benefit, specialty_required
- Pattern: Inferred during normalization via inferRuleFacets(), used for filtering/tagging

**FhirToken:**
- Purpose: FHIR server credentials and patient identifier for readiness analysis
- Location: `src/mcp/fhir/types.ts`
- Pattern: Extracted from patient context via extractFhirToken() supporting multiple naming conventions
- Fields: fhir_token, patient_id, fhir_server_url

## Entry Points

**MCP HTTP Server:**
- Location: `src/mcp/index.ts`
- Triggers: npm run start (direct) or used as middleware in src/server/index.ts
- Responsibilities:
  - Bind Express app to port 3000 (configurable via PORT env var)
  - Register three MCP tools on /mcp POST endpoint
  - Serve /health endpoint with policy/payer/drug counts

**Express API Server:**
- Location: `src/server/index.ts`
- Triggers: npm run server:dev
- Responsibilities:
  - Start Express on port 3000
  - Mount MCP app as middleware
  - Register ingestion routes (/api/ingestion/upload, /api/ingestion/sources)
  - Register Anton Rx routes (/api/antonrx/*)
  - Register chat routes (/api/chat)
  - Serve static frontend in production
  - Health check endpoint

**Frontend Entry:**
- Location: `src/frontend/main.tsx`
- Triggers: npm run frontend:dev (Vite dev server on 4173) or frontend:build (dist/)
- Responsibilities:
  - Render React App component
  - Initialize state for workspace, compare, and data views
  - Fetch from /api endpoints proxied to localhost:3000

## Error Handling

**Strategy:** Try-catch with fallback patterns

**Patterns:**

**Policy not found:** Query tools return JSON error object with available_payers and available_drugs list for user guidance

**FHIR fetch failure:** check_patient_readiness catches error and falls back to criteria_checklist mode (manual review) rather than full failure

**Ingestion parse errors:** File parsing errors don't reject the upload - file stored as "stored" status, errors logged in notes, user sees partial success

**CSV/JSON schema mismatches:** Detected via header inspection, mapped to appropriate normalizer or stored as-is if unrecognized

**Invalid policy JSON:** Rejected during Zod schema parse, errors returned in HTTP response body

## Cross-Cutting Concerns

**Logging:**
- Approach: console.error() for server startup messages, errors during policy load
- Location: stderr used for non-error diagnostics to avoid polluting stdout

**Validation:**
- Approach: Zod schema validation (PolicyRecordSchema) at policy load time
- CSV/JSONL validation: Schema detection via header inspection, optional validation during normalization

**Authentication:**
- Approach: Bearer token-based for FHIR client (Authorization header)
- CORS: Enabled on both MCP and API servers to support cross-origin requests
- No session authentication for MCP tools - all inputs self-contained in request body

**Drug Normalization:**
- Approach: Canonical lookup via data/lookup/drug-aliases.js
- Applied at query time (findPolicy with normalized drug name)
- Also applied during ingestion detection (detectDrugs) for brand-to-generic matching

---

*Architecture analysis: 2026-04-11*
