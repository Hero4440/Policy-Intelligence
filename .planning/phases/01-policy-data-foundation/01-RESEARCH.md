# Phase 1: Policy Data Foundation - Research

**Researched:** 2026-04-04
**Domain:** PDF text extraction and medical policy data structuring
**Confidence:** HIGH

## Summary

Phase 1 requires extracting real payer policy data from public PDFs (UHC, Aetna, Cigna) covering RA biologics, then structuring it into queryable JSON. The standard stack centers on **pdf-parse** (2M weekly downloads, simple text extraction) or **unpdf** (200K downloads, modern TypeScript-first alternative) for PDF parsing, **Zod** for TypeScript-first schema validation and type inference, and Node.js built-in `fs/promises` for JSON file operations.

The primary technical challenge is **text quality**: medical policy PDFs contain inconsistent whitespace, multi-column layouts, tables, and footnotes. Successful extraction requires aggressive text cleaning (collapse whitespace, deduplicate spaces, remove artifacts), manual verification of extracted content against source PDFs, and a hybrid data model that captures structured criteria (diagnosis codes, step therapy) alongside evidence text (policy quotes with source attribution).

All three payers (UHC, Aetna, Cigna) provide public medical policy documents accessible without authentication. UHC offers Medical Policy Update Bulletins and drug policies at uhcprovider.com. Aetna provides Clinical Policy Bulletins (CPBs) searchable by keyword or number. Cigna maintains a Coverage Policies resource library with monthly policy updates available as PDFs.

**Primary recommendation:** Use **pdf-parse** for initial extraction (proven, stable, 2M downloads), implement aggressive text cleaning pipeline, manually verify all extracted policy text against source PDFs, and design JSON schema with Zod to balance structured fields (for programmatic queries) with evidence text (for LLM interpretation and trust-building).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Policy & drug selection:**
- Target top 3-4 RA biologics: Humira (adalimumab), Enbrel (etanercept), Remicade (infliximab), and potentially one JAK inhibitor like Rinvoq
- Three payers: UHC, Aetna, Cigna — all have public medical policy documents
- Use whatever the actual policies say — don't engineer variation between payers for demo purposes; let real differences emerge
- Support both brand and generic name lookups (e.g., "Humira" and "adalimumab" both return results)

**Extraction granularity:**
- Full detail on step therapy: capture each required prior therapy, duration, and failure criteria (e.g., "Must fail methotrexate 15mg+ for 3 months")
- Hybrid approach for complex conditional logic: structure main criteria (diagnosis codes, step therapy requirements, lab requirements) as discrete fields, keep nuanced conditional language as evidence text for LLM interpretation
- Flag ambiguous policy language with an ambiguity marker — downstream tools can surface this to users rather than guessing
- Quantity limits and dosing restrictions: capture in evidence text only, not as structured fields — LLM interprets at query time

**Demo scenario coverage:**
- The key demo moment is gap identification — a patient who's ALMOST ready but missing one thing (e.g., "You need a documented methotrexate failure")
- Include at least one denial scenario (drug/payer combo where coverage is excluded) alongside covered-with-requirements scenarios
- Target 3 distinct scenarios: one clear approval path, one with gaps (the wow moment), one denial
- Let scenario mapping emerge from real policy data rather than pre-planning which drug+payer maps to which scenario

**Evidence text handling:**
- Lightly edited policy quotes: clean up PDF formatting artifacts but preserve substance and traceability
- Full source attribution: document name, page number, and section header for every evidence quote
- Key sentences only (1-2 most relevant sentences per criterion), not full paragraphs
- Evidence always shown inline with determinations — every coverage result includes supporting policy quote

### Claude's Discretion
- JSON schema design and field naming
- PDF extraction technique and tooling
- File organization within the policy store
- Handling of policies that don't cleanly fit the schema

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope

</user_constraints>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pdf-parse | 2.4.5 | PDF text extraction | Most popular Node.js PDF parser (2M weekly downloads), simple API returns text + metadata, proven stability |
| Zod | Latest (3.x) | Schema validation + type inference | TypeScript-first schema library, automatic type inference, industry standard for runtime validation (2026) |
| Node.js fs/promises | Built-in | JSON file I/O | Native async file operations, no dependencies needed |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| unpdf | Latest (0.7.x+) | Modern PDF extraction alternative | If edge runtime support needed or prefer modern async/await API over pdf-parse |
| zod-to-json-schema | Latest | Convert Zod schemas to JSON Schema | If need JSON Schema output for documentation or external tool integration |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pdf-parse | unpdf | unpdf: modern UnJS project, edge-compatible, better TypeScript support BUT lower adoption (200K vs 2M downloads), less proven |
| pdf-parse | pdfjs-dist | pdfjs-dist: full Mozilla PDF renderer, handles complex layouts BUT heavyweight (3M+ downloads), overkill for text-only extraction |
| Zod | AJV | AJV: faster validation, adheres to JSON Schema standards BUT requires separate TypeScript types, less ergonomic DX |
| Zod | TypeBox | TypeBox: JSON Schema in TypeScript, good performance BUT less ecosystem adoption than Zod in 2026 |

**Installation:**
```bash
npm install pdf-parse zod
# Optional:
npm install unpdf zod-to-json-schema
```

---

## Architecture Patterns

### Recommended Project Structure
```
data/
├── policies/
│   ├── raw/              # Original PDF files (source of truth)
│   ├── extracted/        # Intermediate: raw extracted text (for debugging)
│   └── structured/       # Final JSON policy records
├── schemas/
│   └── policy.schema.ts  # Zod schema definitions
src/
├── extraction/
│   ├── pdf-extractor.ts  # PDF → raw text
│   └── text-cleaner.ts   # Clean formatting artifacts
├── structuring/
│   ├── policy-parser.ts  # Text → structured data
│   └── validators.ts     # Zod validation
└── lookup/
    └── drug-aliases.ts   # Brand/generic name mapping
```

### Pattern 1: Two-Stage Extraction Pipeline
**What:** Separate PDF extraction from data structuring
**When to use:** Always — separates messy PDF parsing from business logic
**Example:**
```typescript
// Stage 1: Extract raw text
const rawText = await extractPdfText('policy.pdf');
const cleanedText = cleanWhitespace(rawText);
await fs.writeFile('extracted/policy.txt', cleanedText);

// Stage 2: Parse into structured data (manual or semi-automated)
const policyData = parsePolicy(cleanedText);
const validated = policySchema.parse(policyData);
await fs.writeFile('structured/policy.json', JSON.stringify(validated, null, 2));
```

### Pattern 2: Hybrid Schema Design
**What:** Balance structured fields with evidence text
**When to use:** Medical policies with complex, conditional language
**Example:**
```typescript
import { z } from 'zod';

const StepTherapyRequirement = z.object({
  drugName: z.string(),
  dosage: z.string().optional(),
  duration: z.string(),
  failureCriteria: z.string(),
  evidenceText: z.string(), // Policy quote
  source: z.object({
    document: z.string(),
    page: z.number(),
    section: z.string()
  })
});

const PolicyRecord = z.object({
  payer: z.enum(['UHC', 'Aetna', 'Cigna']),
  plan: z.string(),
  drug: z.object({
    brandName: z.string(),
    genericName: z.string(),
    aliases: z.array(z.string()).default([])
  }),
  indication: z.string(), // e.g., "Rheumatoid Arthritis"
  coverageStatus: z.enum(['covered', 'covered-with-pa', 'excluded']),
  diagnosisRequirements: z.array(z.object({
    icd10Codes: z.array(z.string()),
    description: z.string(),
    evidenceText: z.string(),
    source: z.object({ document: z.string(), page: z.number(), section: z.string() })
  })),
  stepTherapy: z.array(StepTherapyRequirement),
  otherRequirements: z.array(z.object({
    category: z.string(), // e.g., "lab values", "prescriber qualification"
    requirement: z.string(),
    evidenceText: z.string(),
    source: z.object({ document: z.string(), page: z.number(), section: z.string() }),
    ambiguous: z.boolean().default(false) // Flag unclear language
  })),
  sourceDocument: z.object({
    filename: z.string(),
    url: z.string().url().optional(),
    retrievalDate: z.string() // ISO date
  })
});

type PolicyRecord = z.infer<typeof PolicyRecord>;
```

### Pattern 3: Drug Name Aliasing
**What:** Support brand/generic lookups without duplicating policy data
**When to use:** Required — clinicians use both names interchangeably
**Example:**
```typescript
// data/lookup/drug-aliases.json
{
  "adalimumab": {
    "brandNames": ["Humira", "Amjevita", "Cyltezo"],
    "genericName": "adalimumab",
    "class": "TNF inhibitor"
  },
  "etanercept": {
    "brandNames": ["Enbrel", "Erelzi"],
    "genericName": "etanercept",
    "class": "TNF inhibitor"
  }
}

// Query logic
function findPolicies(drugQuery: string): PolicyRecord[] {
  const normalized = normalizeDrugName(drugQuery); // Check aliases
  return policies.filter(p =>
    p.drug.brandName === normalized ||
    p.drug.genericName === normalized ||
    p.drug.aliases.includes(normalized)
  );
}
```

### Anti-Patterns to Avoid
- **Over-structuring complex criteria:** Don't try to parse conditional logic like "if patient has X AND (Y OR Z)" into discrete fields — capture in evidence text for LLM interpretation
- **Fabricating policy text:** Never synthesize or paraphrase policy language; extract actual quotes even if messy
- **Hiding source attribution:** Every coverage criterion must include document/page/section reference
- **Premature optimization:** Don't build query indexes or caching for 3-5 policies; flat JSON files with linear search are fine

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation + TypeScript types | Separate validation + manual type definitions | Zod | Zod infers TypeScript types from schema definitions automatically; maintaining separate validation and types causes drift |
| PDF text extraction | Custom PDF parser | pdf-parse or unpdf | PDF format is complex (glyph encoding, fonts, spacing); libraries handle ToUnicode CMaps, font encoding, text matrix operations |
| Whitespace normalization | Ad-hoc regex patterns | Tested cleaning pipeline | PDF whitespace issues are non-obvious (word spacing, character spacing, leading, text matrix); requires iterative refinement and test cases |
| Drug name normalization | Case-insensitive string matching | Curated alias lookup table | Biosimilars, generic variations, abbreviations require domain knowledge; lookup table is authoritative and testable |

**Key insight:** Medical policy extraction is 80% text cleaning, 20% schema design. PDF parsers solve format complexity; your code should focus on domain-specific cleaning (multi-column layouts, table detection, footnote removal) and verification (extracted text matches source PDF).

---

## Common Pitfalls

### Pitfall 1: PDF Encoding and Whitespace Corruption
**What goes wrong:** Extracted text contains bizarre characters, extra spaces within words, or missing spaces between words
**Why it happens:** PDFs store text as glyph IDs, not Unicode; spacing defined via Character Spacing, Word Spacing, and Text Matrix operations rather than explicit whitespace characters
**How to avoid:**
- Use established libraries (pdf-parse, unpdf) that handle ToUnicode CMap lookups
- Implement aggressive text cleaning: `.replace(/\s{2,}/g, ' ')` to collapse whitespace, `.replace(/\n{3,}/g, '\n\n')` to normalize newlines
- Manually verify extracted text against source PDF for every policy document
**Warning signs:** Text output with "strange whitespace", unreadable characters, or words split across unexpected boundaries

### Pitfall 2: Multi-Column Layout Detection Failures
**What goes wrong:** Text from different columns gets interleaved (e.g., "Prior Authorization Required [text from sidebar] Coverage Criteria")
**Why it happens:** PDF parsers extract text in reading order based on coordinates; multi-column layouts may not follow left-to-right, top-to-bottom expectations
**How to avoid:**
- Use pdf.js-extract (not pdf-parse) if need coordinate data for layout detection
- For simple extraction: manually verify multi-column sections and hand-edit if necessary (only 3-5 policies)
- Keep raw extracted text in `data/policies/extracted/` for debugging
**Warning signs:** Extracted text doesn't read sequentially; sentences interrupted by unrelated content

### Pitfall 3: Over-Engineering Schema for 3-5 Policies
**What goes wrong:** Building complex query systems, indexes, caching layers for tiny dataset
**Why it happens:** Anticipating future scale instead of solving current requirements
**How to avoid:**
- Flat JSON files with linear search are sufficient for 3-5 policies
- Focus effort on extraction quality and schema design, not query optimization
- Use simple `JSON.parse()` + `.filter()` for lookups
- Plan for future database migration via clean schema design, but don't implement now
**Warning signs:** Building database abstractions, query builders, caching logic for <10 records

### Pitfall 4: Ambiguous Policy Language Without Markers
**What goes wrong:** Policy says "may require" or "in some cases" — unclear if hard requirement or conditional
**Why it happens:** Payers intentionally leave flexibility in policy language
**How to avoid:**
- Add `ambiguous: boolean` flag to requirements schema
- Capture exact policy quote in evidenceText
- Document uncertainty in extraction notes
- Let downstream tools surface ambiguity to users rather than making assumptions
**Warning signs:** Extraction team debates "does this mean required or optional?" — if you're unsure, flag it

### Pitfall 5: Missing Source Attribution
**What goes wrong:** Extracted data lacks document name, page number, or section reference
**Why it happens:** Focus on content extraction, forgetting traceability requirements
**How to avoid:**
- Schema enforces source attribution: every evidence quote MUST include `{ document, page, section }`
- Track page numbers during manual extraction (PDF viewers show page #)
- Include `sourceDocument` metadata at policy level (filename, URL, retrieval date)
**Warning signs:** Evidence text without clear provenance; inability to verify quotes against source PDF

---

## Code Examples

Verified patterns from official sources and established practices:

### PDF Text Extraction (pdf-parse)
```typescript
// Source: https://www.npmjs.com/package/pdf-parse
import fs from 'fs/promises';
import pdf from 'pdf-parse';

async function extractPdfText(pdfPath: string): Promise<string> {
  const dataBuffer = await fs.readFile(pdfPath);
  const data = await pdf(dataBuffer);

  console.log(`Extracted ${data.numpages} pages from ${pdfPath}`);
  return data.text;
}
```

### PDF Text Extraction (unpdf alternative)
```typescript
// Source: https://github.com/unjs/unpdf
import { readFile } from 'node:fs/promises';
import { extractText, getDocumentProxy } from 'unpdf';

async function extractPdfTextModern(pdfPath: string): Promise<string> {
  const buffer = await readFile(pdfPath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, { mergePages: true });

  console.log(`Extracted ${totalPages} pages from ${pdfPath}`);
  return text;
}
```

### Text Cleaning Pipeline
```typescript
// Source: Community best practices from web search findings
function cleanPolicyText(rawText: string): string {
  return rawText
    // Collapse multiple newlines to maximum 2 (paragraph breaks)
    .replace(/\n{3,}/g, '\n\n')
    // Collapse multiple spaces/tabs to single space
    .replace(/\s{2,}/g, ' ')
    // Trim each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Remove common PDF artifacts
    .replace(/\f/g, '') // Form feed characters
    .trim();
}
```

### Zod Schema with Type Inference
```typescript
// Source: https://zod.dev/
import { z } from 'zod';

const PolicyRecordSchema = z.object({
  payer: z.enum(['UHC', 'Aetna', 'Cigna']),
  drug: z.object({
    brandName: z.string(),
    genericName: z.string(),
  }),
  coverageStatus: z.enum(['covered', 'covered-with-pa', 'excluded']),
  stepTherapy: z.array(z.object({
    drugName: z.string(),
    duration: z.string(),
    failureCriteria: z.string(),
    evidenceText: z.string(),
    source: z.object({
      document: z.string(),
      page: z.number(),
      section: z.string()
    })
  }))
});

// Automatic type inference
type PolicyRecord = z.infer<typeof PolicyRecordSchema>;

// Validation with error handling
function validatePolicy(data: unknown): PolicyRecord {
  const result = PolicyRecordSchema.safeParse(data);
  if (!result.success) {
    console.error('Validation failed:', result.error.format());
    throw new Error('Invalid policy data');
  }
  return result.data;
}
```

### Drug Name Aliasing Lookup
```typescript
interface DrugAlias {
  brandNames: string[];
  genericName: string;
  class: string;
}

const drugAliases: Record<string, DrugAlias> = {
  "adalimumab": {
    brandNames: ["Humira", "Amjevita", "Cyltezo", "Hadlima", "Hyrimoz"],
    genericName: "adalimumab",
    class: "TNF inhibitor"
  },
  "etanercept": {
    brandNames: ["Enbrel", "Erelzi", "Eticovo"],
    genericName: "etanercept",
    class: "TNF inhibitor"
  },
  "infliximab": {
    brandNames: ["Remicade", "Inflectra", "Renflexis", "Avsola"],
    genericName: "infliximab",
    class: "TNF inhibitor"
  }
};

function normalizeDrugName(query: string): string {
  const normalized = query.toLowerCase().trim();

  // Check if it's a generic name
  if (drugAliases[normalized]) {
    return drugAliases[normalized].genericName;
  }

  // Check if it's a brand name
  for (const [generic, data] of Object.entries(drugAliases)) {
    if (data.brandNames.some(brand => brand.toLowerCase() === normalized)) {
      return data.genericName;
    }
  }

  return normalized; // Return as-is if not found
}
```

### JSON File Operations
```typescript
// Source: Node.js built-in fs/promises
import fs from 'fs/promises';

async function savePolicyJson(policy: PolicyRecord, filename: string): Promise<void> {
  const json = JSON.stringify(policy, null, 2); // Pretty-print with 2-space indent
  await fs.writeFile(`data/policies/structured/${filename}`, json, 'utf-8');
}

async function loadPolicyJson(filename: string): Promise<PolicyRecord> {
  const json = await fs.readFile(`data/policies/structured/${filename}`, 'utf-8');
  const data = JSON.parse(json);
  return PolicyRecordSchema.parse(data); // Validate on load
}

async function loadAllPolicies(): Promise<PolicyRecord[]> {
  const files = await fs.readdir('data/policies/structured');
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  const policies = await Promise.all(
    jsonFiles.map(f => loadPolicyJson(f))
  );

  return policies;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSON Schema + separate TypeScript types | Zod (schema + types unified) | 2024-2025 | Zod became industry standard; eliminates type/validation drift |
| PyPDF2 / PDFMiner (Python) | pdf-parse / unpdf (Node.js) | 2023-2025 | Node.js ecosystem matured; native async/await, TypeScript support |
| AJV for validation | Zod for TypeScript projects | 2024-2026 | Zod offers better DX for TypeScript; AJV still faster but requires manual types |
| Custom JSON file stores | Embedded databases (SQLite) | Emerging 2025-2026 | For larger datasets (100+ policies); not needed for Phase 1 (3-5 policies) |
| Manual PDF extraction | LLM-assisted extraction | Emerging 2026 | GPT-4o/Claude can extract structured data from PDFs; still needs manual verification |

**Deprecated/outdated:**
- **pdf2json**: Still works but less maintained; pdf-parse and unpdf are more actively developed (2026)
- **PDFKit for extraction**: PDFKit is for PDF generation, not extraction; confusion common for newcomers
- **Class-based validators (class-validator)**: Zod's functional approach preferred in modern TypeScript (2026)

---

## Domain-Specific Findings

### Payer Policy Document Access (2026)

**UnitedHealthcare (UHC):**
- **Where:** uhcprovider.com under "Policies and Protocols"
- **Document types:** Medical Policy Update Bulletins (monthly), Medical Benefit Drug Policies, Oncology Medication Clinical Coverage
- **Format:** Publicly accessible PDFs, no authentication required
- **2026 updates:** January 2026 bulletin covers commercial, Medicare Advantage, Community Plans, Exchange
- **Source:** [UHC Medical Policy Updates](https://www.uhcprovider.com/en/resource-library/news/2026/mpub-updates-jan-2026.html)

**Aetna:**
- **Where:** aetna.com/health-care-professionals/clinical-policy-bulletins
- **Document types:** Clinical Policy Bulletins (CPBs) — medical and pharmacy
- **Format:** Searchable by keyword, CPB number, or alphabetically; downloadable PDFs
- **Features:** "What's new" section, periodic review schedule, state-specific deviations
- **Access:** Public access for healthcare professionals, no special registration
- **Source:** [Aetna Clinical Policy Bulletins](https://www.aetna.com/health-care-professionals/clinical-policy-bulletins.html)

**Cigna:**
- **Where:** static.cigna.com/assets/chcp/resourceLibrary/coveragePolicies
- **Document types:** Coverage Policies (medical, behavioral, administrative), monthly policy updates
- **Format:** A-Z index, searchable by policy number or drug name
- **2026 updates:** January 2026 (ambulance services, speech devices), March 2026 (Wegovy, quantity management)
- **Access:** Publicly available PDFs at static URLs
- **Source:** [Cigna Coverage Policies](https://static.cigna.com/assets/chcp/resourceLibrary/coveragePolicies/index.html)

### Rheumatoid Arthritis Biologics — Coverage Landscape (2026)

**Target drugs (as specified in requirements):**
- **Humira (adalimumab):** Most common first-line biologic; multiple biosimilars available (Amjevita, Cyltezo, Hadlima)
- **Enbrel (etanercept):** Medicare negotiated pricing starting 2026; biosimilars include Erelzi, Eticovo
- **Remicade (infliximab):** Biosimilars widely available (Inflectra, Renflexis, Avsola)
- **Rinvoq (upadacitinib):** JAK inhibitor; different mechanism than TNF inhibitors

**Common step therapy requirements:**
- Must fail methotrexate (DMARD) first — typically 3 months at therapeutic dose (15mg+)
- Some plans require failure of 2+ conventional DMARDs before biologic approval
- Biosimilar preference: plans increasingly require biosimilar trial before brand-name approval
- **Source:** [UHC Adalimumab PA Policy](https://www.uhcprovider.com/content/dam/provider/docs/public/prior-auth/drugs-pharmacy/commercial/a-g/PA-Med-Nec-Adalimumab.pdf)

**Diagnosis requirements:**
- ICD-10 codes for rheumatoid arthritis: M05.* (seropositive RA), M06.* (other RA)
- Typically require confirmed diagnosis by rheumatologist
- May require lab confirmation (RF positive, anti-CCP positive, elevated CRP/ESR)

**Prior authorization landscape:**
- All three payers require PA for biologics
- Turnaround times (2026): Standard PA within 7 days, urgent within 72 hours (new CMS requirements)
- Submission platforms: CoverMyMeds (multi-payer), individual payer portals
- **Source:** [Prior Auth Requirements by Payer 2026](https://www.getgreenlightmed.com/blog/prior-auth-requirements-by-payer)

### ICD-10 Coding for Medical Policies

**2026 Updates:**
- Effective October 1, 2025: 614 new codes, 28 deletions, 38 revisions
- Increased specificity requirements (e.g., laterality for pain codes)
- **Impact on extraction:** Diagnosis requirements in policies may reference new codes; verify codes are current
- **Source:** [2026 ICD-10-CM Updates](https://hiacode.com/blog/icd-10-cm-code-updates-april-1)

**Rheumatoid arthritis codes:**
- M05.* — Rheumatoid arthritis with rheumatoid factor (seropositive)
- M06.* — Other rheumatoid arthritis
- M05.40 - M05.49 — Rheumatoid myopathy with rheumatoid arthritis
- **Usage in policies:** Diagnosis requirements typically list ICD-10 code ranges (e.g., "M05.*, M06.*") rather than exhaustive lists

---

## Open Questions

1. **Multi-column layout handling in policy PDFs**
   - What we know: pdf-parse extracts text in reading order; multi-column layouts can cause interleaving
   - What's unclear: Whether all target payer PDFs (UHC, Aetna, Cigna) use multi-column layouts
   - Recommendation: Download sample policy PDFs first; if multi-column is common, consider pdf.js-extract (coordinate-based) or manual verification/editing (acceptable for 3-5 policies)

2. **Policy versioning and effective dates**
   - What we know: Payers publish monthly policy updates (UHC: Medical Policy Update Bulletins, Cigna: monthly policy updates)
   - What's unclear: Whether to capture policy effective dates and version history in schema
   - Recommendation: Include `effectiveDate` and `retrievalDate` in schema for traceability; version history out of scope for Phase 1

3. **Biosimilar vs brand-name policy differences**
   - What we know: Plans increasingly prefer biosimilars; may have separate coverage criteria
   - What's unclear: Whether biosimilars should be separate policy records or variants within same record
   - Recommendation: Treat biosimilars as drug aliases for initial implementation; separate if policies differ significantly during extraction

4. **Ambiguity threshold for flagging unclear policy language**
   - What we know: Should flag ambiguous language with `ambiguous: boolean`
   - What's unclear: Exact criteria for "ambiguous" (subjective judgment call during extraction)
   - Recommendation: Document ambiguity criteria in extraction guide (e.g., "may require", "in some cases", "at plan discretion"); prefer flagging when in doubt

---

## Sources

### Primary (HIGH confidence)
- npm pdf-parse package: [https://www.npmjs.com/package/pdf-parse](https://www.npmjs.com/package/pdf-parse)
- unpdf GitHub repository: [https://github.com/unjs/unpdf](https://github.com/unjs/unpdf)
- Zod official documentation: [https://zod.dev/](https://zod.dev/)
- Zod GitHub repository: [https://github.com/colinhacks/zod](https://github.com/colinhacks/zod)
- Node.js fs/promises documentation (built-in)

### Secondary (MEDIUM confidence)
- PDF parsing libraries comparison 2026: [https://www.pkgpulse.com/blog/unpdf-vs-pdf-parse-vs-pdfjs-dist-pdf-parsing-extraction-nodejs-2026](https://www.pkgpulse.com/blog/unpdf-vs-pdf-parse-vs-pdfjs-dist-pdf-parsing-extraction-nodejs-2026)
- Strapi PDF parsing guide: [https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025](https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025)
- UHC Medical Policy Updates (January 2026): [https://www.uhcprovider.com/en/resource-library/news/2026/mpub-updates-jan-2026.html](https://www.uhcprovider.com/en/resource-library/news/2026/mpub-updates-jan-2026.html)
- Aetna Clinical Policy Bulletins: [https://www.aetna.com/health-care-professionals/clinical-policy-bulletins.html](https://www.aetna.com/health-care-professionals/clinical-policy-bulletins.html)
- Cigna Coverage Policies: [https://static.cigna.com/assets/chcp/resourceLibrary/coveragePolicies/index.html](https://static.cigna.com/assets/chcp/resourceLibrary/coveragePolicies/index.html)
- UHC Adalimumab PA Policy (PDF): [https://www.uhcprovider.com/content/dam/provider/docs/public/prior-auth/drugs-pharmacy/commercial/a-g/PA-Med-Nec-Adalimumab.pdf](https://www.uhcprovider.com/content/dam/provider/docs/public/prior-auth/drugs-pharmacy/commercial/a-g/PA-Med-Nec-Adalimumab.pdf)
- ICD-10 2026 updates: [https://hiacode.com/blog/icd-10-cm-code-updates-april-1](https://hiacode.com/blog/icd-10-cm-code-updates-april-1)
- Prior auth requirements by payer 2026: [https://www.getgreenlightmed.com/blog/prior-auth-requirements-by-payer](https://www.getgreenlightmed.com/blog/prior-auth-requirements-by-payer)

### Tertiary (LOW confidence)
- PDF text extraction pitfalls: [https://www.sensible.so/blog/solving-direct-text-extraction-from-pdfs](https://www.sensible.so/blog/solving-direct-text-extraction-from-pdfs)
- Medical data extraction challenges: [https://pmc.ncbi.nlm.nih.gov/articles/PMC10566734/](https://pmc.ncbi.nlm.nih.gov/articles/PMC10566734/)
- JSON Schema vs Zod comparison: [https://www.bitovi.com/blog/comparing-schema-validation-libraries-ajv-joi-yup-and-zod](https://www.bitovi.com/blog/comparing-schema-validation-libraries-ajv-joi-yup-and-zod)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pdf-parse and Zod are well-documented, widely adopted (2M and industry standard respectively), stable APIs
- Architecture: HIGH — Patterns based on established Node.js/TypeScript best practices, verified against official docs
- Payer document access: HIGH — All three payers confirmed to have public policy documents with direct URLs provided
- PDF extraction pitfalls: MEDIUM — Based on community reports and technical documentation, but specifics vary by PDF source
- RA biologics coverage: MEDIUM — Based on publicly available policy documents and healthcare industry sources, but policies change frequently

**Research date:** 2026-04-04
**Valid until:** Approximately 60 days (until ~2026-06-04)
- **Rationale:** PDF parsing libraries are stable (slow-moving domain); medical policies update monthly but structure is consistent; Zod API stable; main volatility is payer policy content (not extraction technique)
