# Codebase Structure

**Analysis Date:** 2026-04-11

## Directory Layout

```
inovationhacks_2/
├── src/                           # All application code
│   ├── mcp/                       # Model Context Protocol server and tools
│   │   ├── index.ts               # MCP server setup, tool registration
│   │   ├── tools/                 # MCP tool implementations
│   │   ├── policy_store/          # Policy data loading and querying
│   │   ├── matching/              # Patient-to-policy criteria matching
│   │   ├── fhir/                  # FHIR client and patient data extraction
│   │   └── schemas/               # Tool input schemas (Zod)
│   ├── server/                    # Express API server and backend services
│   │   ├── index.ts               # Express app, middleware setup
│   │   ├── ingestion/             # File upload and normalization pipeline
│   │   ├── antonrx-data.ts        # Unified coverage search interface
│   │   ├── antonrx-routes.ts      # /api/antonrx endpoints
│   │   ├── chat.ts                # Chat interface routes
│   │   ├── uploads.ts             # File upload helpers
│   │   ├── normalization.ts       # Canonical key generation, rule facet inference
│   │   └── session-store.ts       # Session/message persistence
│   ├── frontend/                  # React SPA
│   │   ├── App.tsx                # Main app component, routing logic
│   │   ├── main.tsx               # React entry point
│   │   ├── components/            # UI components (views, panels)
│   │   ├── data/                  # Frontend API clients (antonrx.ts, patients.ts)
│   │   └── styles.css             # Global styles
│   ├── extraction/                # Text processing utilities
│   │   ├── pdf-extractor.ts       # PDF text extraction command
│   │   └── text-cleaner.ts        # Whitespace/special char normalization
│   ├── lookup/                    # Reference data
│   └── types/                     # TypeScript type definitions
├── data/                          # Data storage (runtime and static)
│   ├── policies/                  # Static policy data
│   │   ├── structured/            # Pre-processed PolicyRecord JSONs
│   │   ├── raw/                   # Original policy documents
│   │   └── extracted/             # Extracted policy text
│   ├── ingestion/                 # Uploaded file and normalization results
│   │   ├── raw/                   # Raw uploaded files (base64 stored)
│   │   ├── extracted/             # Text extracted from PDFs/DOCX
│   │   ├── sources/               # IngestedSourceRecord metadata
│   │   └── db.json                # Ingestion index and snapshots
│   ├── patients/                  # Demo patient FHIR bundles
│   │   └── demo-patients/         # Example patient data for readiness testing
│   ├── lookup/                    # Runtime lookup tables (drug aliases)
│   └── schemas/                   # JSON Schema files for validation
├── tests/                         # Test code
│   ├── mcp/                       # MCP server tests
│   ├── ingestion/                 # Ingestion pipeline tests
│   └── query/                     # Query/matching tests
├── scripts/                       # Utility scripts
├── docs/                          # Documentation and reference data
├── dist/                          # Built frontend (production only)
├── package.json                   # Dependencies, scripts
├── tsconfig.json                  # TypeScript config
└── vite.config.ts                 # Vite frontend build config
```

## Directory Purposes

**src/mcp/:**
- Purpose: Model Context Protocol server providing policy tools to Claude and other MCP clients
- Contains: Tool implementations, policy store, patient matching logic, FHIR integration
- Key files: `index.ts` (server entry), `tools/*.ts` (three MCP tools)

**src/mcp/tools/:**
- Purpose: Individual tool implementations for MCP protocol
- Contains: Tool registration, input validation, response formatting
- Key files:
  - `get_drug_coverage.ts` - Check if drug is covered by plan
  - `get_prior_auth_criteria.ts` - Retrieve prior auth requirements
  - `check_patient_readiness.ts` - Analyze patient against criteria with FHIR integration

**src/mcp/policy_store/:**
- Purpose: Manage in-memory policy cache and query access
- Contains: File-based loading, synchronous queries
- Key files:
  - `loader.ts` - Load policies at startup, findPolicy(), getAllPolicies()
  - `types.ts` - PolicyStore interface

**src/mcp/fhir/:**
- Purpose: FHIR server integration for patient data
- Contains: Bearer token client, bundle pagination, patient data extraction
- Key files:
  - `client.ts` - createFhirClient(), fetchPatientBundle(), extractFhirToken()
  - `extractors.ts` - Extract diagnoses, medications, coverage from bundles
  - `types.ts` - FhirToken interface

**src/mcp/matching/:**
- Purpose: Patient-to-policy criteria matching logic
- Contains: Criteria evaluation, medical code normalization
- Key files:
  - `criteria_matcher.ts` - matchPatientAgainstPolicy(), CriterionResult generation
  - `language.ts` - Disclaimer text

**src/server/:**
- Purpose: Express HTTP API server hosting MCP and REST endpoints
- Contains: Route handlers, ingestion pipeline, Anton Rx search
- Key files:
  - `index.ts` - Express app, port binding, middleware setup
  - `ingestion/index.ts` - File upload and normalization (852 lines)
  - `antonrx-data.ts` - Coverage search engine combining policies + ingested data
  - `antonrx-routes.ts` - REST endpoints (/api/antonrx/*)
  - `chat.ts` - Chat interface for tool execution
  - `uploads.ts` - Multipart file handling
  - `normalization.ts` - canonicalDrugKey(), canonicalIssuerKey(), inferRuleFacets()

**src/server/ingestion/:**
- Purpose: Multi-format file ingestion and normalization
- Contains: PDF/CSV/JSON/DOCX/JSONL parsing, drug detection, schema mapping
- Key files:
  - `index.ts` - Main ingestion orchestrator, format detection, normalization dispatch
  - `store.ts` - Persist sources and snapshots to filesystem
  - `pdf-policy-parser.ts` - Extract policy structure from PDF text

**src/frontend/:**
- Purpose: React single-page application
- Contains: Components, state management, API clients
- Key files:
  - `App.tsx` - Main component with page routing (workspace, compare, data views)
  - `main.tsx` - React entry point
  - `components/*.tsx` - UI components (AskView, PolicyList, DetailTabs, etc.)
  - `data/antonrx.ts` - API client for /api/antonrx endpoints
  - `data/patients.ts` - Demo patient data
  - `styles.css` - Global CSS

**src/frontend/components/:**
- Purpose: Reusable React components for different views
- Contains: Presentational and container components
- Key files:
  - `workspace-shell.tsx` - Layout container
  - `sidebar.tsx` - Drug search and issuer filter
  - `policy-list.tsx` - Results list pane
  - `detail-tabs.tsx` - Tab navigation (coverage, readiness, changes, compare, ask)
  - `compare-view.tsx`, `compare-builder-view.tsx` - Plan comparison UI
  - `readiness-view.tsx` - Patient readiness analysis
  - `ingestion-panel.tsx` - File upload interface

**data/policies/structured/:**
- Purpose: Pre-processed PolicyRecord JSON files ready for query
- Contains: One JSON per payer-drug combination
- Key files:
  - `uhc-adalimumab-ra.json` - Example policy
  - `policies-index.json` - Index of all available policies
- Pattern: Loaded by loader.ts at startup, never modified

**data/ingestion/:**
- Purpose: Storage for user-uploaded files and normalized results
- Contains: Raw uploads, extracted text, normalized snapshots
- Key files:
  - `raw/` - Base64-encoded uploaded files
  - `extracted/` - Text extracted from PDFs
  - `sources/` - IngestedSourceRecord metadata
  - `db.json` - Index of all ingested sources and coverage snapshots

**data/patients/demo-patients/:**
- Purpose: Example FHIR patient bundles for testing readiness analysis
- Contains: FHIR-compliant JSON bundles with diagnoses, medications
- Key files:
  - `patient-01-full-match.json` - Patient meeting all criteria
  - `patient-02-partial-match.json` - Patient meeting some criteria
  - `patient-03-poor-match.json` - Patient with mismatches

**src/types/:**
- Purpose: Shared TypeScript type definitions
- Contains: CORS type augmentation
- Key files: `cors.d.ts`

**src/lookup/:**
- Purpose: Reference data for lookups
- Contains: Drug alias mappings
- Key files: `drug-aliases.js` - normalizeDrugName()

**scripts/:**
- Purpose: Build, development, and utility scripts
- Contains: Shell scripts for local stack setup
- Key files: `dev-stack.sh` - Start MCP + API + frontend

## Key File Locations

**Entry Points:**
- `src/mcp/index.ts` - MCP server (npm run start)
- `src/server/index.ts` - Combined API server (npm run server:dev)
- `src/frontend/main.tsx` - React app (npm run frontend:dev)

**Configuration:**
- `package.json` - Dependencies, scripts
- `tsconfig.json` - TypeScript compiler options
- `vite.config.ts` - Frontend build and dev server config
- `.gitignore` - Excluded files

**Core Logic:**
- `src/mcp/policy_store/loader.ts` - Policy loading and querying
- `src/server/ingestion/index.ts` - Multi-format file normalization (1002 lines - largest file)
- `src/server/antonrx-data.ts` - Unified coverage search
- `src/frontend/App.tsx` - Frontend state and routing logic

**Testing:**
- `tests/mcp/smoke-remote-server.ts` - Remote MCP server test
- `tests/ingestion/` - Ingestion pipeline tests
- `tests/query/` - Query tests

## Naming Conventions

**Files:**
- Component files: kebab-case with .tsx (e.g., `policy-list.tsx`, `detail-tabs.tsx`)
- Service files: camelCase with .ts (e.g., `antonrx-data.ts`, `session-store.ts`)
- Data files: kebab-case with .json or .js (e.g., `uhc-adalimumab-ra.json`)
- Index files: `index.ts` for directory exports

**Directories:**
- Functional domains: lowercase plural or singular (mcp, server, frontend, tools, ingestion)
- Feature directories: lowercase kebab-case (demo-patients)

**Constants:**
- Environment variables: UPPER_SNAKE_CASE (FHIR_SERVER_URL, PORT, OLLAMA_URL)
- API endpoints: /api/[domain]/[action] (e.g., /api/ingestion/upload, /api/antonrx/compare)

## Where to Add New Code

**New MCP Tool:**
- Implementation: `src/mcp/tools/[tool-name].ts`
- Registration: Import and call server.registerTool() in `src/mcp/index.ts`
- Input Schema: Define Zod schema in `src/mcp/schemas/tool_inputs.ts`

**New REST Endpoint:**
- Route handler: `src/server/[domain]-routes.ts` or expand existing
- Registration: Import and call registerXyzRoutes(app) in `src/server/index.ts`
- Use pattern: registerXyzRoutes() function that takes Express app

**New Frontend View:**
- Component: `src/frontend/components/[view-name].tsx`
- Add to Tab: Import in `src/frontend/App.tsx`, add case to renderDetailContent()
- Add routes: App.tsx activePage state controls which views render

**New File Format in Ingestion:**
- Detection: Add case to classifySourceKind() in `src/server/ingestion/index.ts`
- Normalization: Add function normalizeXyzUpload() returning IngestedCoverageSnapshot[]
- Dispatch: Add case to ingestOneFile() calling the normalizer

**New Utility/Service:**
- Shared logic: `src/[domain]/[service-name].ts`
- Export functions as named exports
- Import in tools/routes/components that need them

**New Policy Data:**
- Structured policy: `data/policies/structured/[issuer]-[drug]-[indication].json`
- Update `data/policies/structured/policies-index.json` with new entry
- Validate against PolicyRecordSchema before committing

## Special Directories

**data/policies/structured/:**
- Purpose: Immutable policy definitions loaded at startup
- Generated: No - manually created from source documents
- Committed: Yes - all policies committed to git
- Access: Read-only via src/mcp/policy_store/loader.ts

**data/ingestion/:**
- Purpose: User-uploaded files and normalized results
- Generated: Yes - created during file upload
- Committed: No - listed in .gitignore (user data)
- Access: Read/write via src/server/ingestion/store.ts

**dist/:**
- Purpose: Built frontend for production deployment
- Generated: Yes - by vite build
- Committed: No - build artifact
- Served: Via express.static() when NODE_ENV=production

**node_modules/:**
- Purpose: npm dependencies
- Generated: Yes - by npm install
- Committed: No - listed in .gitignore

---

*Structure analysis: 2026-04-11*
