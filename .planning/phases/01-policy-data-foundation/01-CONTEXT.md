# Phase 1: Policy Data Foundation - Context

**Gathered:** 2026-04-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Normalize BCBS NC (bevacizumab/oncology) and Cigna (rituximab/non-oncology) policies into structured, evidence-backed data using the existing Zod schema — extended for oncology fields. Add bevacizumab and rituximab drug families to the alias system. Migrate existing 5 RA policies to the extended schema for consistency. PDFs are available in `docs/hackaathon/Medical Drug Coverage Policy Examples/`.

This phase builds on significant existing infrastructure: PDF extraction pipeline, Zod policy schema, drug alias system (4 drugs), 6 structured RA policies, and an MCP server with 3 tools. The work is adding 2 new policy documents and 2 new drug families to the existing foundation.

</domain>

<decisions>
## Implementation Decisions

### Data extraction approach
- Claude's discretion on extraction method (manual curation vs automated parsing) given hackathon scope of 2 documents
- Claude's discretion on whether structured data files are checked into repo or generated at runtime
- Source PDFs are already available in the repo (`docs/hackaathon/Medical Drug Coverage Policy Examples/`)
- PDFs are mostly tables + text format (structured tables with drug lists, criteria columns, surrounding text)
- Extend the existing Zod schema to accommodate oncology-specific fields (preferred/non-preferred splits, multiple indications)

### Evidence mapping strategy
- Per-field evidence granularity: every normalized field (preferred status, step therapy, restrictions) gets its own evidence snippet with 1-3 sentences
- Claude's discretion on evidence format (direct quotes vs paraphrased summaries) — pick what best serves downstream tools
- Include page/section references (e.g., "Page 3, Section 2.1") for traceability back to original PDF
- Use existing `ambiguous: true` flag pattern per field when evidence is unclear, with a note explaining what's ambiguous

### Drug alias resolution
- Add bevacizumab family: Avastin, bevacizumab-awwb/Mvasi, bevacizumab-bvzr/Zirabev
- Add rituximab family: Rituxan, rituximab-abbs/Truxima, rituximab-pvvr/Ruxience
- Keep flat TypeScript map structure in existing `data/lookup/drug-aliases.ts`
- Include therapeutic class info (VEGF inhibitor for bevacizumab, anti-CD20 for rituximab) — consistent with existing `class` field
- Claude's discretion on fuzzy/prefix matching and not-found behavior

### Schema design choices
- Products array with tier field: each product gets `tier: 'preferred' | 'non-preferred'` within the policy record for BCBS NC preferred/non-preferred splits
- Claude's discretion on multiple indications representation (array vs indication-specific sections) based on actual policy content
- Migrate all existing 5 RA policies to match extended schema — one consistent format across all records
- Load-time validation only: validate Zod schema when server starts, trust data after that

### Claude's Discretion
- Extraction method (manual vs automated) for 2 PDFs
- Data storage approach (committed files vs generated)
- Evidence format (direct quotes vs paraphrased)
- Fuzzy/prefix matching for drug aliases
- Not-found behavior for unrecognized drug names
- Indications representation design

</decisions>

<specifics>
## Specific Ideas

- Existing codebase has full PDF extraction pipeline (`src/extraction/pdf-extractor.ts`, `text-cleaner.ts`) and ingestion system (`src/server/ingestion/`) that can be leveraged
- Current structured policies at `data/policies/structured/` follow a pattern with evidenceText + source per criterion
- Drug aliases at `data/lookup/drug-aliases.ts` use `normalizeDrugName()` and `getDrugInfo()` functions
- Policy schema at `data/schemas/policy.schema.ts` is the Zod schema to extend

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-policy-data-foundation*
*Context gathered: 2026-04-11*
