# External Integrations

**Analysis Date:** 2026-04-11

## APIs & External Services

**FHIR (Fast Healthcare Interoperability Resources):**
- FHIR Server - Clinical patient data retrieval
  - Default: https://fhir.promptopinion.ai (configurable via `FHIR_SERVER_URL` env var)
  - SDK/Client: fhir-kit-client v1.9.2
  - Auth: Bearer token via `Authorization` header
  - Integration: `src/mcp/fhir/client.ts` - createFhirClient(), fetchPatientBundle()
  - Usage: `src/mcp/tools/check_patient_readiness.ts` - Fetches patient data for readiness analysis
  - Supports Patient/$everything operation with pagination following `link.relation === 'next'`

**Ollama (Local LLM Service):**
- Ollama - Local language model for chat responses
  - Default: http://127.0.0.1:11434 (configurable via `OLLAMA_URL` env var)
  - Model: llama3.1 (configurable via `OLLAMA_MODEL` env var)
  - Integration: `src/server/chat.ts` lines 69-150
  - Endpoints:
    - `/api/tags` - List available models (health check)
    - `/api/chat` - Chat completion (streaming)
    - `/v1/chat/completions` - OpenAI-compatible chat endpoint (fallback)
  - Auth: None (local service)
  - Usage: Powers chat interface for policy/patient analysis

## Data Storage

**Databases:**
- None configured - Uses local filesystem only

**File Storage:**
- Local filesystem for all data
  - Ingestion database: `data/ingestion/db.json` (JSON with sources and snapshots)
  - Raw uploads: `data/ingestion/raw/` - Original files (PDFs, JSONs, CSVs, DOCX)
  - Extracted text: `data/ingestion/extracted/` - Cleaned policy text
  - Patient demo data: `data/patients/demo-patients/` - FHIR bundle examples
  - Policy records: `data/policies/` - Structured policy data
  - Drug aliases: `data/lookup/drug-aliases.ts` - Normalization mapping
  - Schemas: `data/schemas/policy.schema.ts` - Zod validation schemas

**Caching:**
- In-memory session store: `src/server/session-store.ts`
  - Structure: Map<sessionId, SessionState> with chat messages and uploaded files
  - Lifetime: Runtime only (lost on restart)
  - No persistence layer

**Session Management:**
- In-memory Map<sessionId, SessionState> in `src/server/session-store.ts`
  - Per-session chat history
  - Per-session uploaded patient bundles and policies
  - Timestamps: createdAt, updatedAt, per-message createdAt

## Authentication & Identity

**Auth Provider:**
- Custom bearer token validation (external FHIR servers only)

**Implementation:**
- FHIR bearer tokens extracted from `patient_context` object via `src/mcp/fhir/client.ts:extractFhirToken()`
- Token extraction supports multiple field naming conventions:
  - `fhir_token`, `access_token`, `token`, `bearer_token`, `bearerToken`
- Used for FHIR API requests: `Authorization: Bearer {token}`
- No session authentication (stateless MCP design)
- MCP endpoint accepts session ID from `Mcp-Session-Id` header

## Monitoring & Observability

**Error Tracking:**
- None configured - Errors logged to stderr

**Logs:**
- Console output (stderr) for:
  - Server startup messages
  - Policy load count
  - Health check availability
  - Request processing (chat, ingestion)
- No centralized logging system
- MCP server logs to stderr in `src/mcp/index.ts` lines 78-82

## CI/CD & Deployment

**Hosting:**
- Self-hosted Node.js application
- Express server on configurable PORT (default 3000)
- Static frontend assets served from `dist/` directory (production mode)

**CI Pipeline:**
- None configured - No GitHub Actions, Jenkins, or other CI detected

**Build Process:**
- Frontend: `npm run frontend:build` → Vite builds to `dist/`
- MCP Server: `npm start` → Runs `tsx src/mcp/index.ts`
- Express Server: `npm run server:dev` → Runs `tsx watch src/server/index.ts`
- Development: `npm run frontend:dev` → Vite dev server (port 4173) with proxy to backend

## Environment Configuration

**Required env vars:**
- `PORT` - Express server port (default: 3000)
- `NODE_ENV` - Set to 'production' to serve static frontend
- `FHIR_SERVER_URL` - FHIR server endpoint (default: https://fhir.promptopinion.ai)
- `OLLAMA_URL` - Ollama service URL (default: http://127.0.0.1:11434)
- `OLLAMA_MODEL` - Model name (default: llama3.1)

**Secrets location:**
- Bearer tokens passed via `patient_context` in API requests
- No .env file tracked (respects standard .gitignore for credentials)

## Webhooks & Callbacks

**Incoming:**
- POST `/mcp` - MCP protocol endpoint for AI tool invocations
- POST `/api/chat` - Chat message processing (calls policy matching tools)
- POST `/api/ingestion/upload` - Policy/patient file ingestion
- POST `/api/upload` - Patient bundle upload via UI
- GET `/health` - MCP health check
- GET `/api/health` - Express health check

**Outgoing:**
- Fetch to Ollama API (`/api/chat`, `/api/tags`, `/v1/chat/completions`)
- Fetch to FHIR server (Patient/$everything operation)
- No webhook callbacks configured

## MCP Tools (Protocol Integrations)

**Registered Tools:**
- `get_drug_coverage` - `src/mcp/tools/get_drug_coverage.ts`
  - Input: plan name, drug name
  - Output: Coverage status, requirements, prior auth needs

- `get_prior_auth_criteria` - `src/mcp/tools/get_prior_auth_criteria.ts`
  - Input: plan name, drug name
  - Output: PA criteria checklist with diagnosis requirements, step therapy, other restrictions

- `check_patient_readiness` - `src/mcp/tools/check_patient_readiness.ts`
  - Input: plan, drug, patient_context (optional FHIR token)
  - Output: Readiness analysis against PA criteria
  - Integrates with FHIR if token provided

**Tool Registration:**
- Location: `src/mcp/index.ts:38-65` - Server creation and tool registration per request
- Stateless design: New McpServer instance per MCP POST request
- Capability: `ai.promptopinion/fhir-context` extension for FHIR integration hints

## File Format Support

**Ingestion:**
- PDF (pdf-parse) - Extract text, infer issuer/drugs, create snapshots
- JSON (structured policy) - Validate against PolicyRecordSchema, normalize to compare format
- CSV (formulary) - Detect schema (drug+plan, drugs-only, plans-only, coverage rules), parse and normalize
- JSONL - Parse plan+drug records, create snapshots per drug
- DOCX - Extract text via ZIP+XML parsing, process like PDF
- FHIR Bundle (JSON) - Recognized but stored without processing

**Normalization:**
- All formats normalized to `IngestedCoverageSnapshot` schema for comparison
- Stored snapshots include: coverage label, prior auth flag, step therapy, quantity limits, effectiveness date

---

*Integration audit: 2026-04-11*
