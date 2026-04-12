---
phase: 01-policy-data-foundation
plan: 01
subsystem: data-foundation
tags: [schema, drug-aliases, oncology, data-migration]
dependency_graph:
  requires: []
  provides: [extended-policy-schema, oncology-drug-aliases]
  affects: [policy-validation, drug-normalization]
tech_stack:
  added: [bevacizumab-family, rituximab-family]
  patterns: [optional-fields-for-backward-compatibility]
key_files:
  created: []
  modified:
    - data/schemas/policy.schema.ts
    - data/lookup/drug-aliases.ts
    - data/policies/structured/uhc-adalimumab-ra.json
    - data/policies/structured/uhc-etanercept-ra.json
    - data/policies/structured/aetna-adalimumab-ra.json
    - data/policies/structured/cigna-infliximab-ra.json
    - data/policies/structured/aetna-upadacitinib-ra.json
decisions:
  - title: Optional fields for backward compatibility
    rationale: All new schema fields (products, indications, policyTitle) are optional to ensure existing RA policies validate without modification
  - title: FDA suffix variants in alias system
    rationale: Added FDA biosimilar suffix variants (e.g., bevacizumab-awwb) to handle policy documents that reference these technical names
  - title: RA policies omit oncology fields
    rationale: Cleaner to leave products/indications absent rather than adding empty arrays to RA policies
metrics:
  duration_minutes: 2
  tasks_completed: 2
  files_modified: 7
  commits: 2
  completed_date: 2026-04-12
---

# Phase 01 Plan 01: Schema Extension and Drug Alias Foundation Summary

Extended PolicyRecordSchema with oncology fields (products, indications, policyTitle) and added bevacizumab/rituximab drug families with biosimilar and FDA suffix resolution - all backward compatible with existing RA policies.

## Tasks Completed

### Task 1: Extend Zod schema with oncology fields and add drug alias families
**Status:** Complete
**Commit:** bf2114a

**Changes:**
- Extended PolicyRecordSchema with BCBS-NC payer enum value
- Added ProductWithTier schema for oncology drug tier classification (preferred/non-preferred)
- Added optional `products` array to drug object for oncology multi-product policies
- Added optional `indications` array for oncology drugs with multiple indications
- Added optional `policyTitle` field for richer policy metadata
- Added bevacizumab drug family with 5 biosimilars (Mvasi, Zirabev, Alymsys, Vegzelma, Avzivi)
- Added rituximab drug family with 3 biosimilars (Truxima, Ruxience, Riabni)
- Added FDA biosimilar suffix variants for both families (e.g., bevacizumab-awwb, rituximab-abbs)
- All new schema fields are optional to preserve backward compatibility

**Verification:**
- Schema compiles without TypeScript errors
- normalizeDrugName resolves all bevacizumab names (brand, biosimilars, FDA suffixes) to 'bevacizumab'
- normalizeDrugName resolves all rituximab names to 'rituximab'
- Case-insensitive lookups work correctly (MVASI → bevacizumab)
- Existing uhc-adalimumab-ra.json validates against extended schema

### Task 2: Migrate 5 existing RA policies to extended schema format
**Status:** Complete
**Commit:** 61d0718

**Changes:**
- Added `policyTitle` field to all 5 RA policy JSON files:
  - uhc-adalimumab-ra.json: "UHC Adalimumab Prior Authorization Policy"
  - uhc-etanercept-ra.json: "UHC Etanercept Prior Authorization Policy"
  - aetna-adalimumab-ra.json: "Aetna Adalimumab Prior Authorization Policy"
  - cigna-infliximab-ra.json: "Cigna Infliximab Prior Authorization Policy"
  - aetna-upadacitinib-ra.json: "Aetna Upadacitinib Prior Authorization Policy"
- Did NOT add oncology-specific fields (products, indications) to RA policies - cleaner to omit optional fields

**Verification:**
- All 5 RA policies validate successfully against extended PolicyRecordSchema
- No JSON syntax errors (proper formatting, no trailing commas)
- Schema consistency achieved across full policy dataset

## Deviations from Plan

**Auto-fixed Issues:**

**1. [Rule 3 - Blocking] Git ignored data directory required force add**
- **Found during:** Task 1 commit
- **Issue:** The `/data/` directory is in .gitignore, but the modified files (data/schemas/policy.schema.ts, data/lookup/drug-aliases.ts) are already tracked in git. Git add command failed with "paths ignored" error.
- **Fix:** Used `git add -f` flag to force-add the already-tracked files. This is safe because the files are already part of the repository's history.
- **Files modified:** None (git operation only)
- **Commit:** Applied to both task commits (bf2114a, 61d0718)

No other deviations - plan executed exactly as written.

## Verification Results

All verification criteria passed:

1. Extended schema compiles without TypeScript errors ✓
2. All 5 existing RA policies validate against extended schema ✓
3. normalizeDrugName resolves all bevacizumab family names correctly ✓
   - Avastin → bevacizumab
   - Mvasi, Zirabev, Alymsys, Vegzelma, Avzivi → bevacizumab
   - bevacizumab-awwb, bevacizumab-bvzr, bevacizumab-maly, etc. → bevacizumab
4. normalizeDrugName resolves all rituximab family names correctly ✓
   - Rituxan → rituximab
   - Truxima, Ruxience, Riabni → rituximab
   - rituximab-abbs, rituximab-pvvr, rituximab-arrx → rituximab
5. Case-insensitive lookups work (MVASI, mvasi, Mvasi all resolve to bevacizumab) ✓

## Output

**Schema Foundation:**
- PolicyRecordSchema now supports both RA and oncology policies through optional field pattern
- Drug alias system expanded from 4 families to 6 families
- Reverse lookup map handles brand names, generic names, biosimilars, and FDA suffix variants

**Data Migration:**
- 5 RA policy files migrated to include policyTitle field
- All policies validate against unified schema
- Foundation ready for Plan 02 to add 2 oncology policy files

## Next Steps

Plan 02 (01-02-PLAN.md) can now:
- Create BCBS NC bevacizumab oncology policy using `products` array with tier classification
- Create Cigna rituximab oncology policy using `indications` array for multiple indications
- Both policies will validate against the same PolicyRecordSchema as RA policies
- Drug name normalization will resolve biosimilar names in policy documents

## Self-Check: PASSED

**Created files verified:**
None - this plan only modified existing files.

**Modified files verified:**
- FOUND: data/schemas/policy.schema.ts
- FOUND: data/lookup/drug-aliases.ts
- FOUND: data/policies/structured/uhc-adalimumab-ra.json
- FOUND: data/policies/structured/uhc-etanercept-ra.json
- FOUND: data/policies/structured/aetna-adalimumab-ra.json
- FOUND: data/policies/structured/cigna-infliximab-ra.json
- FOUND: data/policies/structured/aetna-upadacitinib-ra.json

**Commits verified:**
- FOUND: bf2114a (Task 1: feat(01-01): extend schema with oncology fields and add drug aliases)
- FOUND: 61d0718 (Task 2: feat(01-01): migrate RA policies to extended schema format)

All files exist, all commits recorded, all verifications passed.
