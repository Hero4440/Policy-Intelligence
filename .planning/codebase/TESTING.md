# Testing Patterns

**Analysis Date:** 2026-04-11

## Test Framework

**Runner:**
- No formal test runner configured
- Tests are executed as standalone Node scripts using `tsx`
- Package scripts define test entry points: `tsx tests/validate-demo-patients.ts`, `tsx tests/ingestion/ingestion-matrix.ts`

**Assertion Framework:**
- No external assertion library (no Jest, Mocha, Vitest, etc.)
- Custom assertion function pattern:
  ```typescript
  function assert(condition: boolean, message: string): void {
    if (!condition) {
      console.log(`${RED}✗ FAIL${RESET}: ${message}`);
      process.exit(1);
    }
    console.log(`${GREEN}✓ PASS${RESET}: ${message}`);
  }
  ```
- Located in: `tests/validate-demo-patients.ts`

**Run Commands:**
```bash
npm test                                    # Echo "no test specified" (placeholder)
tsx tests/validate-demo-patients.ts        # Validate FHIR patient bundles
tsx tests/ingestion/ingestion-matrix.ts    # Test ingestion pipeline
tsx tests/normalization/normalization-audit.ts  # Test normalization
tsx tests/query/query-audit.ts             # Test query functionality
tsx tests/mcp/smoke-remote-server.ts       # Test MCP server
```

## Test File Organization

**Location:**
- Co-located in `tests/` directory at project root (separate from source)
- Mirrors source structure loosely:
  - `tests/ingestion/` - ingestion logic
  - `tests/normalization/` - normalization logic
  - `tests/query/` - query logic
  - `tests/mcp/` - MCP server functionality
  - `tests/validate-demo-patients.ts` - FHIR extraction validation

**Naming:**
- Descriptive names indicating test purpose
- Suffixes: `-matrix.ts`, `-audit.ts`, `validate-*.ts`, `smoke-*.ts`
- Examples:
  - `ingestion-matrix.ts` - comprehensive test matrix
  - `ingestion-audit.ts` - audit/verification test
  - `validate-demo-patients.ts` - validation test
  - `smoke-remote-server.ts` - smoke test

**Structure:**
```
tests/
├── ingestion/
│   ├── ingestion-matrix.ts      # Upload test cases and matrix
│   └── ingestion-audit.ts       # Verify ingestion results
├── normalization/
│   └── normalization-audit.ts   # Drug name normalization verification
├── query/
│   └── query-audit.ts           # Query execution tests
├── mcp/
│   └── smoke-remote-server.ts   # MCP endpoint smoke test
└── validate-demo-patients.ts    # FHIR bundle validation
```

## Test Structure

**Suite Organization:**
No formal test suites (no `describe`/`it` blocks). Instead: sequential execution with checkpoints.

**Pattern from `validate-demo-patients.ts`:**
```typescript
// 1. Setup - load test data
const patient1 = loadPatientBundle('patient-01-full-match.json');
const data1 = extractPatientData(patient1);

// 2. Assert - verify expectations
assert(data1.diagnoses.length > 0, 'Patient 1: Has diagnoses');
assert(
  data1.diagnoses.some(d => d.code === 'M05.79'),
  'Patient 1: Has M05.79 diagnosis'
);

// 3. Continue to next section
console.log('');
```

**Patterns:**
- **Setup:** Load fixtures, initialize test data
- **Assertions:** Call custom `assert()` function with condition and message
- **Teardown:** Not used (no cleanup needed for stateless tests)
- **Output:** Print colored ANSI messages showing pass/fail

**Example from smoke test:**
```typescript
function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    fail(`${url} returned ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T;
}
```

## Mocking

**Framework:** No mocking library (no Sinon, Jest mocks, etc.)

**Patterns:**
- Tests run against real implementations, not mocks
- In-memory data structures used for state (no external dependencies)
- Example: `src/server/session-store.ts` uses `Map<string, SessionState>()` for in-memory storage
- URL/endpoint mocking through environment variables:
  ```typescript
  const baseUrl = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const OLLAMA_BASE_URL = (process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434').replace(/\/+$/, '');
  ```

**What to Mock:**
- File system interactions: actual files from `data/` directory
- Network calls: real HTTP fetch to running servers
- Not mocked (direct use):
  - FHIR extraction logic
  - Policy matching logic
  - Data transformation functions

**What NOT to Mock:**
- Core business logic (matching, extraction)
- Data structures
- Type checking

## Fixtures and Factories

**Test Data:**
Pattern from `ingestion-matrix.ts`:
```typescript
type UploadCase = {
  name: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
};

function makeCaseFromFile(name: string, filePath: string, mimeType: string): UploadCase {
  return {
    name,
    fileName: basename(filePath),
    mimeType,
    bytes: readFileSync(filePath)
  };
}

function makeJsonCase(name: string, fileName: string, payload: unknown): UploadCase {
  return {
    name,
    fileName,
    mimeType: 'application/json',
    bytes: Buffer.from(JSON.stringify(payload))
  };
}
```

**Location:**
- Fixtures: `data/patients/demo-patients/*.json` - FHIR bundles
- Fixtures: `data/policies/structured/*.json` - Policy documents
- Fixtures: `docs/hackaathon2/` - Example policies and formularies
- Factory functions: Defined inline within test files

**Loading Pattern:**
```typescript
function loadPatientBundle(filename: string): any {
  const filePath = path.join(process.cwd(), 'data', 'patients', 'demo-patients', filename);
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

const patient1 = loadPatientBundle('patient-01-full-match.json');
```

## Coverage

**Requirements:** Not enforced or configured

**View Coverage:**
- No coverage reporting setup detected
- Would require integration with test runner (not currently in place)

## Test Types

**Unit Tests:**
- Scope: Individual functions in isolation
- Approach: Call function with test input, assert output
- Examples:
  - `extractPatientData()` - `tests/validate-demo-patients.ts`
  - `compareDrugAcrossPlans()` - `tests/ingestion/ingestion-audit.ts`
  - `extractDiagnoses()` - implicitly tested via `validate-demo-patients.ts`

**Integration Tests:**
- Scope: Multiple components together
- Approach: Upload file, parse, validate results
- Examples:
  - `ingestion-matrix.ts` - PDF parsing + JSON parsing + validation
  - `ingestion-audit.ts` - File upload + processing + data verification
  - `normalization-audit.ts` - Drug name normalization in context

**E2E Tests:**
- Framework: Custom HTTP-based smoke test
- Location: `tests/mcp/smoke-remote-server.ts`
- Approach: Make HTTP requests to running server, verify responses
- Covered:
  - Health check endpoint
  - Tool availability
  - Tool execution and streaming response parsing

**Example E2E:**
```typescript
async function main() {
  // Check health
  const health = await fetchJson<HealthResponse>(`${baseUrl}/health`);

  // List tools
  const tools = await fetchJsonRpc(
    `${baseUrl}/mcp`,
    { method: 'POST', body: JSON.stringify(...) }
  );

  // Execute tool
  const result = await fetchJson(`${baseUrl}/api/antonrx/compare?drug=adalimumab`);
}
```

## Common Patterns

**Async Testing:**
- `async function main()` pattern wraps all async operations
- No explicit promises/await handling beyond standard async/await
- Example:
  ```typescript
  async function main() {
    const validStructured = makeCaseFromFile(...);
    const result = await ingestFiles([validStructured]);
    assert(result.summary.total > 0, 'Ingest produces summary');
  }

  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
  ```

**Error Testing:**
- Errors cause test exit via `fail()` or `assert()`
- No explicit error/exception testing pattern
- Process exit code indicates failure: `process.exit(1)`
- Example:
  ```typescript
  function assert(condition: boolean, message: string): void {
    if (!condition) {
      console.log(`${RED}✗ FAIL${RESET}: ${message}`);
      process.exit(1);  // Fail test
    }
    console.log(`${GREEN}✓ PASS${RESET}: ${message}`);
  }
  ```

**Validation in Tests:**
- Zod schema validation used in main code, not in tests
- Tests manually assert specific fields
- Example from patient validation:
  ```typescript
  assert(data1.diagnoses.length > 0, 'Patient 1: Has diagnoses');
  assert(
    data1.diagnoses.some(d => d.code === 'M05.79'),
    'Patient 1: Has M05.79 diagnosis'
  );
  ```

## Test Output

**Colored Output:**
```typescript
const GREEN = '\x1b[32m';    // Passing test
const RED = '\x1b[31m';      // Failing test
const YELLOW = '\x1b[33m';   // Section header
const RESET = '\x1b[0m';     // Reset color

console.log(`${GREEN}✓ PASS${RESET}: ${message}`);
console.log(`${RED}✗ FAIL${RESET}: ${message}`);
console.log(`${YELLOW}Section Title${RESET}`);
```

**Example Output:**
```
=== Demo Patient Bundle Validation ===

Patient 1: Sarah Anderson (Full Match)
✓ PASS: Patient 1: Has diagnoses
✓ PASS: Patient 1: Has M05.79 diagnosis
✓ PASS: Patient 1: Has medications
✓ PASS: Patient 1: Has methotrexate medication
```

## Running Tests

**From package.json:**
```json
{
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "extract": "tsx src/extraction/pdf-extractor.ts",
    "validate": "tsx src/structuring/validators.ts",
    "smoke:mcp": "tsx tests/mcp/smoke-remote-server.ts"
  }
}
```

**Run specific tests:**
```bash
# Validate FHIR patient extraction
tsx tests/validate-demo-patients.ts

# Test ingestion pipeline
tsx tests/ingestion/ingestion-matrix.ts
tsx tests/ingestion/ingestion-audit.ts

# Test normalization
tsx tests/normalization/normalization-audit.ts

# Test queries
tsx tests/query/query-audit.ts

# Smoke test MCP server (requires server running)
npm run smoke:mcp
```

## Notes

- **No dedicated test runner:** Tests are TSX scripts that handle assertions internally
- **No mocking library:** Real implementations tested; state managed in-memory
- **No coverage tools:** Manual coverage verification needed
- **Assertion library:** Custom `assert()` function pattern
- **Test data:** FHIR bundles and policy JSON fixtures in `data/` directory
- **Exit codes:** Process exit(1) indicates test failure for CI/CD integration

---

*Testing analysis: 2026-04-11*
