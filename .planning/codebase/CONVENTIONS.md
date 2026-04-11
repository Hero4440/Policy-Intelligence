# Coding Conventions

**Analysis Date:** 2026-04-11

## Naming Patterns

**Files:**
- Component files: PascalCase with `.tsx` extension (e.g., `AskView.tsx`, `WorkspaceShell.tsx`)
  - Located in `src/frontend/components/`
- Service/utility files: camelCase with `.ts` extension (e.g., `session-store.ts`, `criteria_matcher.ts`)
- Route files: camelCase with `-routes` suffix (e.g., `antonrx-routes.ts`)
- Data/type files: camelCase with `.ts` extension (e.g., `extractors.ts`, `policies.ts`)

**Functions:**
- camelCase for all functions, both exported and internal
- Descriptive verbs at start: `get*`, `fetch*`, `extract*`, `match*`, `register*`, `list*`, `search*`, `normalize*`
- Examples:
  - `extractPatientData()` - `src/mcp/fhir/extractors.ts`
  - `matchPatientAgainstPolicy()` - `src/mcp/matching/criteria_matcher.ts`
  - `registerAntonRxRoutes()` - `src/server/antonrx-routes.ts`
  - `fetchAntonRxCompare()` - `src/frontend/data/antonrx.ts`
  - `getOrCreateSession()` - `src/server/session-store.ts`

**Variables:**
- camelCase for all variables and constants
- const for immutable values, no uppercase for constants
- Boolean prefixes: `is*`, `has*`, `should*`, `can*` (e.g., `isDragOver`, `hasMatches`, `should*`)
- Collection suffixes: plural names for arrays (e.g., `messages`, `diagnoses`, `medications`)
- Private/helper variables: may use underscore prefix for clarity but not enforced

**Types:**
- PascalCase for all type/interface names
- Use `type` keyword for unions and simple type aliases
- Use `interface` keyword for object contracts
- Suffix conventions:
  - Result types: `*Result` (e.g., `CriterionResult`)
  - Props types: `*Props` (e.g., `AskViewProps`, `DetailTabsProps`)
  - Data types: `*Data`, `*State` (e.g., `ExtractedPatientData`, `SessionState`)
  - Response types: `*Response` (e.g., `HealthResponse`, `JsonRpcResponse`)
- Examples:
  - `interface ChatMessage` - `src/server/session-store.ts`
  - `interface ExtractedPatientData` - `src/mcp/fhir/types.ts`
  - `type CriterionResult` - `src/mcp/matching/criteria_matcher.ts`

## Code Style

**Formatting:**
- No explicit formatter configuration (no .prettierrc or eslint config found)
- Consistent indentation: 2 spaces (observed in all files)
- Line length: varies, no hard limit enforced
- Single quotes for string literals (observed pattern)
- Semicolons: Always present at end of statements

**Linting:**
- No explicit linting configuration detected
- TypeScript `strict` mode enabled in `tsconfig.json`
- ESNext module system with ES2022 target

**Key tsconfig.json Settings:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Import Organization

**Order:**
1. External packages from node_modules (e.g., `react`, `express`, `zod`)
2. Type imports with `type` keyword
3. Local relative imports using `./` or `../` paths
4. JSON/data imports (when applicable)

**Examples:**
```typescript
// External packages first
import express from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { dirname, join } from 'path';

// Type imports
import type { Express, Request, Response } from 'express';
import type { ChatMessage } from './session-store.js';

// Local imports with .js extensions (required for ESM)
import { extractPatientData } from '../mcp/fhir/extractors.js';
import { matchPatientAgainstPolicy } from '../mcp/matching/criteria_matcher.js';
```

**Path Aliases:**
- Absolute imports from project root use relative `../` paths
- All imports to local files include `.js` extension (required for ESM)
- Imports from `data/` directory prefix with `../../data/` from src location

## Error Handling

**Patterns:**
- Null coalescing: `.catch(() => defaultValue)` for graceful degradation
- State management for errors: `setError(message)` in React components
- Type guards before using: `if (!array || !Array.isArray(array)) return;`
- Explicit error messages: pass Error object when possible
- React components catch errors and update state:
  ```typescript
  .catch((loadError) => {
    setError(loadError instanceof Error ? loadError.message : 'Failed to load');
  })
  ```
- Test assertions throw with descriptive messages:
  ```typescript
  function assert(condition: boolean, message: string): void {
    if (!condition) {
      console.log(`FAIL: ${message}`);
      process.exit(1);
    }
  }
  ```

**Error Contexts:**
- Network errors: default to null or empty array
- Parsing errors: log and continue
- Validation errors: throw with message (Zod schema validation)

## Logging

**Framework:** `console` directly (no logger library)

**Patterns:**
- `console.error()` for startup/diagnostics and error messages
- `console.log()` for test output and information
- Colored ANSI output in test scripts:
  ```typescript
  const GREEN = '\x1b[32m';
  const RED = '\x1b[31m';
  const YELLOW = '\x1b[33m';
  const RESET = '\x1b[0m';
  console.log(`${GREEN}✓ PASS${RESET}: message`);
  ```

**What to Log:**
- Server startup information (port, services enabled)
- Diagnostic information (number of resources loaded)
- Test pass/fail assertions
- Errors and failures (use console.error)

**What NOT to Log:**
- Request/response bodies (security concern)
- Sensitive patient/policy data
- Verbose debugging (not in prod)

## Comments

**When to Comment:**
- JSDoc blocks at top of files for module purpose
- Block comments above complex functions explaining approach
- Inline comments for non-obvious business logic
- Comments for edge cases and defensive programming

**JSDoc/TSDoc:**
- Use block comments for module descriptions:
  ```typescript
  /**
   * Criteria Matcher
   *
   * Compares extracted patient FHIR data against policy requirements
   * using cautious clinical language. Handles diagnosis matching with
   * ICD-10 wildcards, step therapy with drug name normalization, and
   * other requirements that may need documentation.
   */
  ```
- Function documentation above exported functions
- Parameter and return types handled by TypeScript (no need for @param/@returns)
- Document non-obvious assumptions

**Example Comments:**
- See `src/mcp/matching/criteria_matcher.ts` for block comment style
- See `src/mcp/fhir/extractors.ts` for module documentation

## Function Design

**Size:**
- Keep functions under 50 lines when possible
- Extract complex logic into helper functions
- Examples:
  - `matchDiagnosisRequirements()` - 30 lines - `src/mcp/matching/criteria_matcher.ts`
  - `extractDiagnoses()` - 34 lines - `src/mcp/fhir/extractors.ts`
  - `registerAntonRxRoutes()` - 78 lines - `src/server/antonrx-routes.ts`

**Parameters:**
- Use type annotations for all parameters
- Destructure object parameters when multiple options
- Example:
  ```typescript
  export function matchPatientAgainstPolicy(
    patientData: ExtractedPatientData,
    policy: PolicyRecord
  ): CriterionResult[]
  ```

**Return Values:**
- Explicit return types required (TypeScript strict mode)
- Use type unions for multiple return types (not overloading)
- Return null or empty array for "not found", not undefined (from observed patterns)
- Async functions return Promises

## Module Design

**Exports:**
- Named exports for functions and types
- Default exports for React components (when appropriate)
- Example React component:
  ```typescript
  export default function App() { ... }
  ```
- Example service module:
  ```typescript
  export function getOrCreateSession() { ... }
  export function appendSessionMessage() { ... }
  ```

**Barrel Files:**
- Not heavily used; imports typically direct to module files
- Exception: `src/frontend/data/patients.ts` re-exports from deeper modules:
  ```typescript
  export { extractPatientData } from '../../mcp/fhir/extractors.js';
  export type { CriterionResult } from '../../mcp/matching/criteria_matcher.js';
  ```

**Module Organization:**
- One main responsibility per file
- Keep related types and functions together
- Helper/private functions before main exports
- No deep nesting beyond 3-4 levels

---

*Convention analysis: 2026-04-11*
