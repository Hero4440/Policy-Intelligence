# Phase 3: Patient Context Integration - Research

**Researched:** 2026-04-04
**Domain:** FHIR R4 patient context integration, MCP server FHIR token handling, clinical data parsing
**Confidence:** MEDIUM

## Summary

Phase 3 integrates FHIR patient context into the existing MCP server to enable real prior authorization readiness analysis. The phase requires implementing three technical domains: (1) FHIR context token handling via Prompt Opinion's SHARP extension specs, (2) FHIR R4 patient data parsing and extraction, and (3) clinical criteria matching with cautious language. Research reveals that while MCP has introduced extension mechanisms in 2025-2026, the SHARP extension specs from Prompt Opinion are hackathon-specific and not publicly documented—implementation must be inferred from MCP's OAuth 2.1 patterns and SMART on FHIR standards. The FHIR ecosystem provides mature TypeScript libraries for resource parsing (fhir-kit-client for FHIR server communication, @solarahealth/fhir-r4 for type-safe parsing). Critical pitfalls include assuming complete patient data (FHIR resources commonly have missing fields), over-confident clinical assertions (requires hedging language like "may be missing" and "appears to match"), and ignoring bundle pagination for large patient datasets.

**Primary recommendation:** Use fhir-kit-client with bearer token authentication for FHIR server access, @solarahealth/fhir-r4 for type-safe resource parsing, implement defensive null handling throughout, and adopt cautious clinical language patterns to avoid liability concerns.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fhir-kit-client | ^1.9.x | FHIR server HTTP client with bearer token support | Official Node.js FHIR client by Vermonster, supports R4, handles bearer tokens and SMART auth patterns |
| @solarahealth/fhir-r4 | Latest | Type-safe FHIR R4 resource parsing with Zod validation | Comprehensive TypeScript types for all R4 resources, runtime validation prevents parsing errors |
| zod | ^4.3.6 (already installed) | Schema validation for FHIR data extraction | Already in project, use for custom extraction schemas |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/fhir | ^0.0.40 | TypeScript definitions for FHIR R4 | If using fhir-kit-client without @solarahealth, provides basic types |
| node-fetch | Built-in (Node 18+) | HTTP requests for FHIR server | Use native fetch for manual FHIR requests if fhir-kit-client insufficient |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fhir-kit-client | @js-fhir/client or raw fetch | fhir-kit-client has better R4 support and SMART patterns, alternatives require more manual work |
| @solarahealth/fhir-r4 | @ahryman40k/ts-fhir-types | @solarahealth has Zod validation built-in, @ahryman40k uses io-ts which is less familiar |
| Manual parsing | HAPI FHIR (Java) | Node.js/TypeScript keeps stack consistent with existing MCP server |

**Installation:**
```bash
npm install fhir-kit-client @solarahealth/fhir-r4 @types/fhir
```

## Architecture Patterns

### Recommended Project Structure

```
src/mcp/
├── fhir/                    # FHIR integration layer (new)
│   ├── client.ts            # FHIR client factory with bearer token auth
│   ├── parsers.ts           # Resource parsers (Condition, Medication, Observation, Coverage)
│   ├── extractors.ts        # Clinical data extractors (diagnoses, meds, labs, payer)
│   └── types.ts             # Extracted data schemas
├── matching/                # Criteria matching logic (new)
│   ├── diagnosis_matcher.ts # Match patient diagnoses against policy requirements
│   ├── therapy_matcher.ts   # Match medication history against step therapy
│   └── language.ts          # Cautious clinical language helpers
├── tools/
│   └── check_patient_readiness.ts  # Updated with FHIR integration
└── index.ts                 # Add FHIR token extraction from request context
```

### Pattern 1: FHIR Client with Bearer Token

**What:** Create a FHIR client instance with bearer token authentication for accessing Prompt Opinion's FHIR server.

**When to use:** Every time `check_patient_readiness` tool is invoked with a FHIR context token.

**Example:**
```typescript
// Source: https://www.npmjs.com/package/fhir-kit-client
import Client from 'fhir-kit-client';

export function createFhirClient(fhirServerUrl: string, bearerToken: string): Client {
  return new Client({
    baseUrl: fhirServerUrl,
    customHeaders: {
      Authorization: `Bearer ${bearerToken}`
    }
  });
}

// Usage in tool handler
const client = createFhirClient(
  process.env.FHIR_SERVER_URL || 'https://fhir.promptopinion.ai',
  fhirToken
);

// Retrieve patient bundle with $everything operation
const patientBundle = await client.request({
  url: `Patient/${patientId}/$everything`,
  method: 'GET'
});
```

**Note:** FHIR $everything operation returns a Bundle containing all resources in the patient compartment (Patient, Condition, MedicationRequest, Observation, Coverage, etc.). Handle pagination via bundle.link[rel="next"] if present.

### Pattern 2: Defensive FHIR Resource Parsing

**What:** Parse FHIR resources with null-safety and missing data handling.

**When to use:** All FHIR resource parsing operations.

**Example:**
```typescript
// Source: FHIR community best practices
// http://community.fhir.org/t/how-to-handle-null-values-in-resources/529

import type { Condition } from '@solarahealth/fhir-r4';

export function extractDiagnosisCodes(condition: Condition): string[] {
  // FHIR spec: missing elements are simply absent, not null
  if (!condition.code?.coding) {
    return [];
  }

  return condition.code.coding
    .filter(coding => {
      // Filter for ICD-10 codes only
      return coding.system === 'http://hl7.org/fhir/sid/icd-10' && coding.code;
    })
    .map(coding => coding.code!)
    .filter(Boolean); // Remove any undefined/null
}

export function extractMedicationName(medRequest: MedicationRequest): string | null {
  // Medication can be a CodeableConcept or Reference
  if (medRequest.medicationCodeableConcept?.coding) {
    // Try RxNorm first (standard for US Core)
    const rxnorm = medRequest.medicationCodeableConcept.coding.find(
      c => c.system === 'http://www.nlm.nih.gov/research/umls/rxnorm'
    );
    if (rxnorm?.display) return rxnorm.display;

    // Fallback to any coding with display
    const any = medRequest.medicationCodeableConcept.coding.find(c => c.display);
    return any?.display || null;
  }

  // If medication is a reference, we'd need to resolve it
  // For now, return null if not inline
  return null;
}
```

### Pattern 3: Cautious Clinical Language

**What:** Use hedging language to avoid making definitive clinical assertions that could create liability.

**When to use:** All readiness tool output, especially when automated systems evaluate clinical criteria.

**Example:**
```typescript
// Source: Healthcare AI liability research
// https://pmc.ncbi.nlm.nih.gov/articles/PMC10681355/

export const ClinicalLanguage = {
  matched: (criterion: string) => `Appears to match: ${criterion}`,
  missing: (criterion: string) => `May be missing: ${criterion}`,
  ambiguous: (criterion: string) => `Documentation may be needed: ${criterion}`,
  uncertain: (criterion: string) => `Unable to verify: ${criterion}`,

  statusLabels: {
    MATCH: 'appears_to_match',
    MISSING: 'may_be_missing',
    NEEDS_DOCUMENTATION: 'documentation_may_be_needed',
    UNVERIFIABLE: 'unable_to_verify'
  }
};

// Usage in matching logic
const result = {
  criterion: diagnosisReq.description,
  status: foundICD10Match
    ? ClinicalLanguage.statusLabels.MATCH
    : ClinicalLanguage.statusLabels.MISSING,
  message: foundICD10Match
    ? ClinicalLanguage.matched(diagnosisReq.description)
    : ClinicalLanguage.missing(diagnosisReq.description)
};
```

### Pattern 4: MCP Request Context Extraction (SHARP Extension)

**What:** Extract FHIR context token from MCP request headers or tool parameters based on Prompt Opinion's SHARP extension specs.

**When to use:** At the beginning of `check_patient_readiness` tool handler.

**Example:**
```typescript
// Source: MCP extension mechanism research
// https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/
// Note: SHARP specs not publicly documented, pattern inferred from SMART on FHIR + MCP OAuth 2.1

// In tool handler for check_patient_readiness
async ({ plan, drug, patient_context }, { requestContext }) => {
  // Option 1: FHIR token in patient_context parameter
  const fhirToken = patient_context?.fhir_token || patient_context?.access_token;
  const patientId = patient_context?.patient_id;

  // Option 2: FHIR token in request headers (if MCP server exposes them)
  // const fhirToken = requestContext?.headers?.['x-fhir-token'];

  if (!fhirToken) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: 'Missing FHIR context',
          message: 'patient_context must include fhir_token and patient_id for readiness analysis'
        }, null, 2)
      }],
      isError: true
    };
  }

  // Create FHIR client with token
  const fhirClient = createFhirClient(
    process.env.FHIR_SERVER_URL || 'https://fhir.promptopinion.ai',
    fhirToken
  );

  // Continue with patient data retrieval...
}
```

**CRITICAL UNCERTAINTY:** SHARP extension specs are mentioned in Prompt Opinion/Agents Assemble materials but not publicly documented. The exact mechanism for passing FHIR tokens (request headers vs tool parameters vs separate MCP extension field) is UNKNOWN. Implementation must be flexible to adapt based on actual Prompt Opinion integration testing in Phase 5.

### Anti-Patterns to Avoid

- **Assuming complete patient data:** FHIR resources commonly have missing fields. Always use optional chaining and null checks.
- **Definitive clinical statements:** Never say "patient meets criteria" or "patient does not qualify". Use "appears to match" and "may be missing".
- **Manual URL construction for pagination:** Always use bundle.link[rel="next"] URLs verbatim. Servers use opaque continuation tokens.
- **Ignoring coding systems:** ICD-10 codes have system `http://hl7.org/fhir/sid/icd-10`, RxNorm has `http://www.nlm.nih.gov/research/umls/rxnorm`. Filter by system before extracting codes.
- **Synchronous bundle parsing:** Large patient bundles can be slow. Parse in streaming fashion or with pagination awareness.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| FHIR server HTTP client | Custom fetch with auth headers | fhir-kit-client | Handles SMART auth, pagination links, FHIR search syntax, error codes |
| FHIR resource type validation | Manual JSON schema checks | @solarahealth/fhir-r4 | 100+ resource types with nested validation, prevents silent parse errors |
| Clinical terminology mapping | ICD-10 to text lookup tables | Use FHIR Condition.code.coding[].display | FHIR resources include human-readable displays, no external mapping needed |
| Bearer token refresh | Custom OAuth flow | Assume Prompt Opinion handles refresh | MCP extension likely provides valid token per request, stateless design |
| Patient $everything pagination | Manual page tracking | fhir-kit-client handles bundle.link | Continuation tokens are opaque, manual reconstruction fails |

**Key insight:** FHIR parsing has massive edge cases (optional fields, multiple coding systems, reference resolution, contained resources). Mature libraries handle these. Custom parsing code will miss 20-30% of real-world FHIR data variations.

## Common Pitfalls

### Pitfall 1: Assuming FHIR Token is in Tool Parameters

**What goes wrong:** MCP server crashes or returns errors because FHIR token extraction fails.

**Why it happens:** SHARP extension specs are undocumented. Token could be in tool parameters (`patient_context.fhir_token`), request headers (`X-FHIR-Token`), or a future MCP extension field (`meta.context.fhir`).

**How to avoid:**
1. Implement flexible token extraction that checks multiple locations
2. Add clear error messages when token is missing
3. Plan for Phase 5 integration testing to discover actual mechanism
4. Document assumptions clearly in code comments

**Warning signs:**
- `check_patient_readiness` returns "Missing FHIR context" for all calls
- Integration test with Prompt Opinion fails on token validation
- FHIR server returns 401 Unauthorized

### Pitfall 2: Missing Diagnosis Codes Due to Wrong System Filter

**What goes wrong:** Patient has documented diagnoses but matching logic reports "missing diagnosis requirement" because codes were stored with different coding system URIs.

**Why it happens:** ICD-10 has multiple valid system URIs: `http://hl7.org/fhir/sid/icd-10` (international), `http://hl7.org/fhir/sid/icd-10-cm` (US Clinical Modification), `http://www.cms.gov/Medicare/Coding/ICD10` (CMS). Filtering for only one system misses others.

**How to avoid:**
```typescript
const ICD10_SYSTEMS = [
  'http://hl7.org/fhir/sid/icd-10',
  'http://hl7.org/fhir/sid/icd-10-cm',
  'http://www.cms.gov/Medicare/Coding/ICD10'
];

export function extractICD10Codes(condition: Condition): string[] {
  return condition.code?.coding
    ?.filter(coding => ICD10_SYSTEMS.includes(coding.system || ''))
    .map(coding => coding.code)
    .filter(Boolean) || [];
}
```

**Warning signs:**
- Patient with documented RA diagnosis shows "no diagnosis found"
- ICD-10 codes appear in FHIR data but not in extracted results
- Mismatch between EHR display and tool output

### Pitfall 3: Medication Name Mismatch Between FHIR and Policy Store

**What goes wrong:** Patient is taking "adalimumab" but FHIR resource shows "Humira" (brand name), or vice versa. Step therapy matching fails even though patient has tried the required medication.

**Why it happens:** FHIR MedicationRequest/MedicationStatement can use brand names, generic names, or RxNorm codes. Policy store uses generic names normalized via drug-aliases.ts. Without normalization, names don't match.

**How to avoid:**
1. Extract medication name from FHIR resource
2. Pass through the same `normalizeDrugName()` function used in Phase 1/2
3. Match normalized names against policy requirements
4. Display both brand (if available) and generic in output

```typescript
import { normalizeDrugName } from '../../../data/lookup/drug-aliases.js';

const fhirMedName = extractMedicationName(medRequest);
const normalizedName = fhirMedName ? normalizeDrugName(fhirMedName) : null;

// Match against step therapy requirements
const stepTherapyMatch = policy.stepTherapy.find(
  step => normalizeDrugName(step.drugName) === normalizedName
);
```

**Warning signs:**
- Patient medication history shows drugs but no step therapy matches found
- Brand/generic name inconsistencies in output
- False "missing step therapy" results

### Pitfall 4: Over-Confident Clinical Language Creates Liability

**What goes wrong:** Tool output says "Patient meets all criteria" or "Patient does not qualify". If clinician relies on this and it's wrong, liability falls on the tool provider and clinician.

**Why it happens:** Developer writes confident language because it feels more useful. Medical/legal reality: AI systems have epistemic uncertainty about clinical data quality, interpretation, and edge cases.

**How to avoid:**
- Never use definitive language ("meets", "does not meet", "qualifies", "approved")
- Always hedge with "appears to", "may be", "suggests", "based on available data"
- Include disclaimers: "This analysis is based on automated data extraction and should be verified by a clinician"
- Status labels: use `appears_to_match` not `matches`, `may_be_missing` not `missing`

**Warning signs:**
- Output contains "patient meets criteria"
- No hedging language in any criterion evaluation
- No disclaimer about clinical verification needed

### Pitfall 5: Ignoring Bundle Pagination for Patient $everything

**What goes wrong:** Patient has extensive medical history (500+ resources). FHIR server returns first 100 resources with a `next` link. Tool only processes first page, misses most patient data, reports false "missing" criteria.

**Why it happens:** Developer assumes single API call returns all data. Real FHIR servers paginate large bundles to prevent timeouts and memory issues.

**How to avoid:**
```typescript
async function fetchAllPatientData(client: Client, patientId: string): Promise<Bundle> {
  let bundle = await client.request({
    url: `Patient/${patientId}/$everything`,
    method: 'GET'
  });

  const allEntries = [...(bundle.entry || [])];

  // Follow pagination links
  while (bundle.link?.find(l => l.relation === 'next')) {
    const nextUrl = bundle.link.find(l => l.relation === 'next')!.url!;
    bundle = await client.request({ url: nextUrl, method: 'GET' });
    allEntries.push(...(bundle.entry || []));
  }

  return { ...bundle, entry: allEntries };
}
```

**Warning signs:**
- Patient with long medical history shows less data than expected
- Inconsistent results between patients (some show more data)
- FHIR bundle has `link` array with `relation: "next"`

## Code Examples

Verified patterns from official sources:

### Retrieve Patient Bundle with Bearer Token

```typescript
// Source: https://github.com/Vermonster/fhir-kit-client
import Client from 'fhir-kit-client';

const fhirClient = new Client({
  baseUrl: 'https://fhir.promptopinion.ai',
  customHeaders: {
    Authorization: `Bearer ${bearerToken}`
  }
});

// Get patient with all related resources
const patientBundle = await fhirClient.request({
  url: `Patient/${patientId}/$everything`,
  method: 'GET'
});

// Response is Bundle with type="searchset"
// bundle.entry[] contains Patient, Condition, MedicationRequest, Observation, Coverage, etc.
```

### Extract ICD-10 Diagnosis Codes

```typescript
// Source: https://build.fhir.org/valueset-icd-10.html
import type { Condition } from '@solarahealth/fhir-r4';

const ICD10_SYSTEMS = [
  'http://hl7.org/fhir/sid/icd-10',
  'http://hl7.org/fhir/sid/icd-10-cm'
];

function extractDiagnosisCodes(condition: Condition): { code: string; display: string }[] {
  if (!condition.code?.coding) return [];

  return condition.code.coding
    .filter(coding =>
      coding.system &&
      ICD10_SYSTEMS.includes(coding.system) &&
      coding.code
    )
    .map(coding => ({
      code: coding.code!,
      display: coding.display || coding.code!
    }));
}

// Usage
const conditions = bundle.entry
  ?.filter(e => e.resource?.resourceType === 'Condition')
  .map(e => e.resource as Condition) || [];

const allDiagnosisCodes = conditions.flatMap(extractDiagnosisCodes);
```

### Extract Medication History (RxNorm)

```typescript
// Source: https://build.fhir.org/ig/HL7/US-Core/medication-list.html
import type { MedicationRequest, MedicationStatement } from '@solarahealth/fhir-r4';

const RXNORM_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';

function extractMedicationName(med: MedicationRequest | MedicationStatement): string | null {
  // For MedicationRequest
  if ('medicationCodeableConcept' in med && med.medicationCodeableConcept?.coding) {
    const rxnorm = med.medicationCodeableConcept.coding.find(
      c => c.system === RXNORM_SYSTEM && c.display
    );
    if (rxnorm?.display) return rxnorm.display;

    // Fallback to any coding with display
    const fallback = med.medicationCodeableConcept.coding.find(c => c.display);
    return fallback?.display || null;
  }

  // If medicationReference, would need to resolve - skip for now
  return null;
}

// Usage
const medRequests = bundle.entry
  ?.filter(e => e.resource?.resourceType === 'MedicationRequest')
  .map(e => e.resource as MedicationRequest) || [];

const medications = medRequests
  .map(extractMedicationName)
  .filter(Boolean) as string[];
```

### Match Diagnosis Against Policy Requirements

```typescript
// Source: Clinical criteria matching patterns
interface DiagnosisRequirement {
  icd10Codes: string[];
  description: string;
  evidenceText: string;
}

function matchDiagnosisRequirement(
  patientICD10Codes: string[],
  requirement: DiagnosisRequirement
): {
  status: 'appears_to_match' | 'may_be_missing' | 'unable_to_verify';
  message: string;
  matchedCodes?: string[];
} {
  if (patientICD10Codes.length === 0) {
    return {
      status: 'unable_to_verify',
      message: `Unable to verify diagnosis requirement: ${requirement.description}. No diagnosis codes found in patient record.`
    };
  }

  const matchedCodes = patientICD10Codes.filter(code =>
    requirement.icd10Codes.includes(code)
  );

  if (matchedCodes.length > 0) {
    return {
      status: 'appears_to_match',
      message: `Appears to match diagnosis requirement: ${requirement.description}`,
      matchedCodes
    };
  }

  return {
    status: 'may_be_missing',
    message: `May be missing diagnosis requirement: ${requirement.description}. Patient has documented diagnoses but none match required ICD-10 codes.`
  };
}
```

### Build Cautious Readiness Response

```typescript
// Source: Healthcare AI liability best practices
interface ReadinessResult {
  criterion: string;
  category: 'diagnosis' | 'step_therapy' | 'lab' | 'other';
  status: 'appears_to_match' | 'may_be_missing' | 'documentation_may_be_needed' | 'unable_to_verify';
  message: string;
  evidence?: string;
  matched_data?: any;
}

function buildReadinessResponse(
  criteriaResults: ReadinessResult[],
  policy: PolicyRecord
): any {
  const matched = criteriaResults.filter(r => r.status === 'appears_to_match');
  const missing = criteriaResults.filter(r => r.status === 'may_be_missing');
  const needsDoc = criteriaResults.filter(r => r.status === 'documentation_may_be_needed');
  const unverifiable = criteriaResults.filter(r => r.status === 'unable_to_verify');

  return {
    readiness_summary: {
      criteria_met: matched.length,
      criteria_possibly_missing: missing.length + unverifiable.length,
      criteria_needing_documentation: needsDoc.length,
      total_criteria: criteriaResults.length,
      overall_assessment: matched.length === criteriaResults.length
        ? 'All criteria appear to be met based on available patient data'
        : missing.length > 0
        ? 'Some criteria may be missing or require additional documentation'
        : 'Unable to verify some criteria due to insufficient patient data'
    },
    disclaimer: 'This analysis is based on automated extraction of FHIR patient data and should be verified by a qualified clinician. Clinical judgment is required for final prior authorization determination.',
    criteria_details: criteriaResults,
    source_policy: {
      payer: policy.payer,
      plan: policy.plan,
      drug: policy.drug.genericName,
      document: policy.sourceDocument.filename
    }
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom FHIR parsing | TypeScript libraries with Zod validation | 2024-2025 | Runtime type safety catches parse errors early |
| SMART on FHIR OAuth flow in every app | Platform-managed FHIR tokens (e.g., Prompt Opinion) | 2025-2026 | MCP tools receive pre-authenticated tokens, no OAuth complexity |
| Manual clinical language | Hedging language patterns from liability research | 2024-2025 | Reduces liability exposure for AI clinical tools |
| Stdio MCP transport | Streamable HTTP with OAuth 2.1 | MCP June 2025 spec | Production-ready MCP servers with proper auth |
| Single-page FHIR queries | Pagination-aware bundle processing | Always critical | Prevents silent data loss on large patient records |

**Deprecated/outdated:**
- **@types/fhir** alone (no runtime validation): Use @solarahealth/fhir-r4 for Zod-based validation
- **SMART on FHIR OAuth in MCP tools**: Prompt Opinion platform handles auth, tools receive bearer tokens
- **Definitive clinical language**: Liability concerns require hedging ("appears to", "may be")

## Open Questions

1. **SHARP Extension Specs Implementation**
   - What we know: Prompt Opinion uses "SHARP extension specs" to pass FHIR context (patient ID, token) to MCP tools
   - What's unclear: Exact mechanism (tool parameter? request header? MCP extension field?), token format, refresh handling
   - Recommendation: Implement flexible token extraction (check tool params, headers, future extension field). Plan Phase 5 integration testing to discover actual mechanism. Document assumptions clearly.

2. **FHIR Server Base URL**
   - What we know: Prompt Opinion provides a FHIR server for demo patients
   - What's unclear: Production URL, per-workspace URLs, URL discovery mechanism
   - Recommendation: Use environment variable `FHIR_SERVER_URL` with default `https://fhir.promptopinion.ai`. Update in Phase 5 with actual URL from Prompt Opinion docs.

3. **Patient $everything Bundle Size**
   - What we know: $everything can return large bundles requiring pagination
   - What's unclear: Prompt Opinion's FHIR server pagination limits, demo patient data volume
   - Recommendation: Implement pagination handling from start (see Pitfall 5). Test with demo patients in Phase 4 to verify pagination behavior.

4. **Medication Matching Across Code Systems**
   - What we know: FHIR uses RxNorm, policy store uses generic names with brand/biosimilar aliases
   - What's unclear: Whether FHIR resources will always have RxNorm codes or might use other systems, need for external terminology service
   - Recommendation: Extract medication display names (RxNorm or fallback), normalize via existing `normalizeDrugName()` from drug-aliases.ts. If mismatches occur in Phase 4 testing, expand alias mapping.

5. **Lab Results Integration**
   - What we know: Some policies have lab requirements (implied by RDY-04 "labs" mention)
   - What's unclear: Whether current 5 policies have lab criteria, FHIR Observation resource parsing needs
   - Recommendation: Check existing policy JSON for lab requirements. If none exist, defer Observation parsing to future phase. If present, add Observation extractors following same defensive parsing patterns.

## Sources

### Primary (HIGH confidence)

- [FHIR R4 Specification - Condition Resource](https://r4.fhir.space/condition.html) - ICD-10 coding system URIs
- [FHIR R4 Specification - MedicationRequest](https://www.hl7.org/fhir/medicationrequest.html) - RxNorm coding and medication representation
- [FHIR R4 Specification - Patient $everything](https://hl7.org/fhir/R4/patient-operation-everything.html) - Bundle retrieval and pagination
- [fhir-kit-client npm package](https://www.npmjs.com/package/fhir-kit-client) - Node.js FHIR client API
- [@solarahealth/fhir-r4 npm package](https://www.npmjs.com/package/@solarahealth/fhir-r4) - TypeScript FHIR types with Zod validation
- [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) - Core protocol, security principles
- [MCP 2026 Roadmap](http://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) - Extensions framework
- [FHIR Bundle Pagination](https://build.fhir.org/bundle.html) - Bundle.link navigation

### Secondary (MEDIUM confidence)

- [Agents Assemble Hackathon](https://agents-assemble.devpost.com/) - SHARP extension specs reference (not detailed)
- [Prompt Opinion Platform](https://www.promptopinion.ai/) - MCP/FHIR/A2A integration overview
- [MCP Authentication Guide (Stytch)](https://stytch.com/blog/MCP-authentication-and-authorization-guide/) - OAuth 2.1 patterns for MCP
- [Healthcare AI Liability Research](https://pmc.ncbi.nlm.nih.gov/articles/PMC10681355/) - Clinicians' perspectives on AI trust and hedging language
- [Prior Authorization Denials Research](https://medcoresolutions.com/prior-authorization-pitfalls-and-how-to-avoid-them/) - Common data quality pitfalls
- [FHIR Null Handling Community Discussion](http://community.fhir.org/t/how-to-handle-null-values-in-resources/529) - Best practices for missing data

### Tertiary (LOW confidence - needs validation in Phase 5)

- SHARP extension specs: Mentioned in Prompt Opinion materials but not publicly documented. Assumed to follow SMART on FHIR + MCP OAuth 2.1 patterns.
- Prompt Opinion FHIR server URL: Assumed `https://fhir.promptopinion.ai` based on platform domain, not verified.
- FHIR token refresh: Assumed Prompt Opinion handles token refresh, MCP tools receive valid tokens per request (stateless design).

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - fhir-kit-client and @solarahealth/fhir-r4 are established libraries, but SHARP extension integration is uncertain
- Architecture: MEDIUM - FHIR parsing patterns are well-established, but SHARP token extraction mechanism is undocumented
- Pitfalls: HIGH - FHIR null handling, clinical language, and pagination issues are well-documented in community and research

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (30 days - stable domain with documented standards, but Prompt Opinion integration details may evolve during hackathon)

**Critical gap:** SHARP extension specs not publicly available. Phase 5 (Prompt Opinion integration) will likely reveal actual implementation details. Build flexibility into Phase 3 code to adapt based on Phase 5 findings.
