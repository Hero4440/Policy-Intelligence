---
phase: 04-patient-data-setup
plan: 01
subsystem: demo-data
tags: [fhir, patient-data, demo-scenarios, validation]

dependency_graph:
  requires:
    - 01-01 (policy data schema)
    - 01-02 (policy data population)
    - 03-01 (FHIR extractors)
  provides:
    - three_demo_patient_bundles
    - controlled_pa_scenarios
    - patient_validation_script
  affects:
    - 05-deployment (patient loading into Prompt Opinion)

tech_stack:
  added:
    - FHIR R4 Bundle (collection type)
    - RxNorm medication codes
    - ICD-10-CM diagnosis codes
    - LOINC lab codes
  patterns:
    - Hand-crafted FHIR bundles with controlled scenarios
    - Payer name alignment with policy store
    - URN-based resource references within bundles

key_files:
  created:
    - data/patients/demo-patients/patient-01-full-match.json
    - data/patients/demo-patients/patient-02-partial-match.json
    - data/patients/demo-patients/patient-03-poor-match.json
    - data/patients/demo-patients/README.md
    - tests/validate-demo-patients.ts
  modified: []

decisions:
  - decision: Hand-craft FHIR bundles instead of using Synthea
    rationale: "Only 3 patients needed, full control over scenarios critical for demo, faster than Synthea generation + editing"
    alternatives: ["Synthea + manual editing", "Fully hand-crafted from scratch"]
  - decision: Use FHIR Bundle type 'collection' instead of 'transaction'
    rationale: "Local files not server submissions, collection type appropriate for static demo data"
    alternatives: ["transaction type", "individual resource files"]
  - decision: Set payer names to exact match policy store (UHC, Aetna)
    rationale: "FHIR extractor reads payor[0].display, must match policy store strings exactly for check_patient_readiness tool"
    alternatives: ["Full names like UnitedHealthcare", "Use payer IDs/codes"]
  - decision: Create 2-month methotrexate gap for Patient 2 (not 1 month)
    rationale: "authoredOn 2026-02-01 to demo time 2026-04-04 = ~2 months, clearly short of 3-month requirement, creates obvious gap for demo"
    alternatives: ["1 month gap", "2.5 month gap"]

metrics:
  duration_minutes: 46
  tasks_completed: 3
  files_created: 5
  commits: 2
  test_assertions: 17
  completed_date: 2026-04-04
---

# Phase 4 Plan 1: Demo Patient FHIR Bundles Summary

**One-liner:** Three hand-crafted FHIR R4 patient bundles (full match, partial match with 2-month methotrexate gap, poor match with no DMARDs) validated against extractors with exact payer name alignment for policy matching.

## What Was Built

Created three synthetic demo patients as FHIR R4 Bundle JSON files with controlled prior authorization readiness scenarios:

1. **Patient 1 - Sarah Anderson (Full Match):**
   - M05.79 diagnosis (seropositive RA)
   - Methotrexate started Feb 2023 (3+ years documented)
   - Recent labs: ESR 40, CRP 2.5, RF positive
   - UHC Commercial coverage
   - Rheumatologist prescriber (Dr. Emily Rodriguez)
   - **Result:** All PA criteria met

2. **Patient 2 - Michael Chen (Partial Match - The "Wow Moment"):**
   - M06.9 diagnosis (RA unspecified)
   - Methotrexate started Feb 2026 (only ~2 months by demo time)
   - **Gap:** Policy requires 3-month trial, only 2 months documented
   - Recent labs: ESR 35, CRP 3.1
   - UHC Commercial coverage
   - Rheumatologist prescriber (Dr. James Park)
   - **Result:** System identifies specific 1-month gap automatically

3. **Patient 3 - Linda Washington (Poor Match - Multiple Gaps):**
   - M06.9 diagnosis
   - **Gap:** No DMARD trial history (no MedicationRequest resources)
   - **Gap:** Stale labs (ESR from June 2024, >9 months old), no CRP
   - **Gap:** PCP prescriber (Dr. Robert Martinez, Family Medicine) instead of rheumatologist
   - Aetna Commercial coverage
   - **Result:** Multiple major missing requirements identified

All bundles use FHIR R4 specification with proper code systems (ICD-10-CM for diagnoses, RxNorm for medications, LOINC for labs) and URN-based internal references.

## Deviations from Plan

None - plan executed exactly as written.

## Technical Implementation

**FHIR Bundle Structure:**
- Bundle type: `collection` (local files, not server transactions)
- Resources per patient:
  - Patient 1: 8 entries (Patient, Condition, MedicationRequest, 3 Observations, Coverage, Practitioner)
  - Patient 2: 7 entries (Patient, Condition, MedicationRequest, 2 Observations, Coverage, Practitioner)
  - Patient 3: 5 entries (Patient, Condition, 1 Observation, Coverage, Practitioner)

**Critical Alignment Points:**
- `Coverage.payor[0].display` set to EXACTLY "UHC" or "Aetna" to match policy store expectations
- Diagnosis codes M05.79 and M06.9 align with policy criteria (M05.*, M06.*)
- `MedicationRequest.authoredOn` dates create controlled duration scenarios for gap detection

**Validation Script:**
Created `tests/validate-demo-patients.ts` that:
- Imports `extractPatientData` from FHIR extractors
- Loads all three patient bundles
- Asserts expected diagnoses, medications, and coverage data
- All 17 assertions pass successfully

**Validation Results:**
```
Patient 1: 1 diagnoses, 1 medications, payer=UHC
Patient 2: 1 diagnoses, 1 medications, payer=UHC
Patient 3: 1 diagnoses, 0 medications, payer=Aetna
```

## Phase 5 Integration Bridge

Documented three loading options in README.md for Phase 5 (Deployment and Integration):

**Option A - MCP Server Patient Loading (Most Likely):**
1. Register MCP server with Prompt Opinion workspace (Phase 5 DEP-02)
2. MCP server's `get_patient_data` tool reads from `data/patients/demo-patients/*.json`
3. Patients accessible via MCP tool calls
4. Verify patients appear in selector

**Option B - FHIR Bundle POST:**
1. POST each bundle to Prompt Opinion's FHIR endpoint
2. Verify patients appear in selector UI

**Option C - Manual Entry (Fallback):**
1. Use Prompt Opinion's patient creation UI
2. Enter demographics, diagnoses, medications, coverage from JSON files

No platform loading happens in Phase 4 - this is intentional.

## Testing & Verification

**Automated Validation:**
```bash
npx tsx tests/validate-demo-patients.ts
```

All assertions passed:
- Patient 1: M05.79 diagnosis, methotrexate medication, UHC coverage
- Patient 2: M06.9 diagnosis, methotrexate medication, UHC coverage
- Patient 3: M06.9 diagnosis, NO medications (expected gap), Aetna coverage

**File Structure Verification:**
```bash
node -e "const fs=require('fs'); ['patient-01-full-match.json','patient-02-partial-match.json','patient-03-poor-match.json'].forEach(f => { const d=JSON.parse(fs.readFileSync('data/patients/demo-patients/'+f,'utf8')); console.log(f+': '+d.entry.length+' entries, type='+d.type); });"
```

Output confirmed correct bundle structure and entry counts.

## Files Created

1. **data/patients/demo-patients/patient-01-full-match.json** (9,664 bytes)
   - Full criteria match patient bundle
   - 8 FHIR resources
   - Sarah Anderson demographics

2. **data/patients/demo-patients/patient-02-partial-match.json** (8,414 bytes)
   - Partial match with methotrexate gap
   - 7 FHIR resources
   - Michael Chen demographics

3. **data/patients/demo-patients/patient-03-poor-match.json** (5,412 bytes)
   - Poor match with multiple gaps
   - 5 FHIR resources
   - Linda Washington demographics

4. **data/patients/demo-patients/README.md** (5,769 bytes)
   - Patient scenario documentation
   - Policy mapping table
   - Phase 5 loading instructions
   - FHIR structure notes

5. **tests/validate-demo-patients.ts** (3,033 bytes)
   - Automated validation script
   - 17 assertions covering all extraction paths
   - Color-coded output

## Success Criteria Met

- [x] Three FHIR Bundle JSON files exist in data/patients/demo-patients/
- [x] Each file is valid JSON parseable by Node.js
- [x] FHIR extractors successfully parse all bundles (17/17 assertions pass)
- [x] Payer names match policy store expectations ("UHC", "Aetna")
- [x] Patient scenarios clearly differentiated: full match, partial match (short MTX), poor match (no DMARDs)
- [x] Validation script passes with all assertions green
- [x] Prompt Opinion patient loading steps documented with explicit bridge to Phase 5

## Commits

1. **7722dcf** - `feat(04-01): create three FHIR R4 demo patient bundles`
   - Created all three patient bundle JSON files
   - Created README.md with scenario documentation
   - Set up controlled PA readiness scenarios

2. **58b8c7b** - `test(04-01): add demo patient validation script`
   - Created validation script with 17 assertions
   - Validates diagnoses, medications, coverage extraction
   - All tests passing

## Self-Check: PASSED

**Created files verification:**
```bash
[ -f "data/patients/demo-patients/patient-01-full-match.json" ] && echo "FOUND: patient-01-full-match.json" || echo "MISSING: patient-01-full-match.json"
```
Result: FOUND

```bash
[ -f "data/patients/demo-patients/patient-02-partial-match.json" ] && echo "FOUND: patient-02-partial-match.json" || echo "MISSING: patient-02-partial-match.json"
```
Result: FOUND

```bash
[ -f "data/patients/demo-patients/patient-03-poor-match.json" ] && echo "FOUND: patient-03-poor-match.json" || echo "MISSING: patient-03-poor-match.json"
```
Result: FOUND

```bash
[ -f "data/patients/demo-patients/README.md" ] && echo "FOUND: README.md" || echo "MISSING: README.md"
```
Result: FOUND

```bash
[ -f "tests/validate-demo-patients.ts" ] && echo "FOUND: validate-demo-patients.ts" || echo "MISSING: validate-demo-patients.ts"
```
Result: FOUND

**Commits verification:**
```bash
git log --oneline --all | grep -q "7722dcf" && echo "FOUND: 7722dcf" || echo "MISSING: 7722dcf"
```
Result: FOUND

```bash
git log --oneline --all | grep -q "58b8c7b" && echo "FOUND: 58b8c7b" || echo "MISSING: 58b8c7b"
```
Result: FOUND

All files created and commits exist as documented.

## Next Steps

**Immediate (Phase 4 continuation):**
- Phase 4 Plan 2 likely covers deeper demo scenario testing or integration preparation

**Phase 5 (Deployment and Integration):**
- Load patients into Prompt Opinion workspace using documented approach
- Verify patient selector shows all 3 patients
- Test MCP tools with each patient scenario
- Confirm gap detection works for Patient 2 (methotrexate duration gap)
- Confirm multiple gaps identified for Patient 3

**Known Dependencies:**
- Phase 5 DEP-02/DEP-03 will need README.md loading instructions
- MCP server registration must happen before patient data accessible
- Patient data supports demo script development in later phases
