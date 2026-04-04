# Demo Patient Scenarios

Three hand-crafted FHIR R4 patient bundles representing controlled prior authorization readiness scenarios for demonstration purposes.

## Patient Scenarios

### Patient 1: Sarah J. Anderson (Full Criteria Match)

**File:** `patient-01-full-match.json`

**Demographics:**
- Female, DOB: 1975-06-15
- Boston, MA
- MRN: MRN-001-DEMO

**Clinical Profile:**
- **Diagnosis:** M05.79 (Seropositive RA with rheumatoid factor)
  - Onset: January 15, 2023
  - Status: Active, confirmed
- **Medications:** Methotrexate 15mg weekly
  - Started: February 1, 2023
  - Duration: 3+ years (well exceeds 3-month requirement)
- **Lab Results:**
  - ESR: 40 mm/hr (High) - November 15, 2025
  - CRP: 2.5 mg/L (High) - November 15, 2025
  - RF: Positive - October 20, 2025
- **Coverage:** UHC Commercial
- **Prescriber:** Dr. Emily Rodriguez, Rheumatology

**Mapped Policy:** uhc-adalimumab-ra

**Expected Outcome:** Full match - all PA criteria met. Patient appears ready for prior authorization submission.

---

### Patient 2: Michael R. Chen (Partial Match - Documentation Gap)

**File:** `patient-02-partial-match.json`

**Demographics:**
- Male, DOB: 1982-03-22
- Chicago, IL
- MRN: MRN-002-DEMO

**Clinical Profile:**
- **Diagnosis:** M06.9 (Rheumatoid arthritis, unspecified)
  - Onset: September 1, 2025
  - Status: Active, confirmed
- **Medications:** Methotrexate 15mg weekly
  - Started: February 1, 2026
  - Duration: ~2 months (by demo time April 2026)
  - **GAP:** Policy requires 3-month trial, only 2 months documented
- **Lab Results:**
  - ESR: 35 mm/hr (High) - December 10, 2025
  - CRP: 3.1 mg/L (High) - December 10, 2025
- **Coverage:** UHC Commercial
- **Prescriber:** Dr. James Park, Rheumatology

**Mapped Policy:** uhc-adalimumab-ra

**Expected Outcome:** Partial match with actionable gap. Patient may need an additional 1 month of methotrexate documentation before PA approval. This is the "wow moment" - the system identifies the specific gap automatically.

---

### Patient 3: Linda M. Washington (Poor Match - Major Gaps)

**File:** `patient-03-poor-match.json`

**Demographics:**
- Female, DOB: 1968-11-30
- Houston, TX
- MRN: MRN-003-DEMO

**Clinical Profile:**
- **Diagnosis:** M06.9 (Rheumatoid arthritis, unspecified)
  - Onset: June 15, 2025
  - Status: Active, confirmed
- **Medications:** None documented
  - **GAP:** No DMARD trial history
- **Lab Results:**
  - ESR: 28 mm/hr (High) - June 20, 2024 (over 9 months old - stale)
  - **GAP:** No recent CRP
- **Coverage:** Aetna Commercial
- **Prescriber:** Dr. Robert Martinez, Family Medicine
  - **GAP:** PCP instead of rheumatologist

**Mapped Policy:** aetna-adalimumab-ra

**Expected Outcome:** Poor match with multiple major gaps. Patient needs:
1. DMARD trial documentation (3 months methotrexate or equivalent)
2. Recent lab results (ESR is stale, CRP missing)
3. Rheumatology consultation/prescriber

---

## FHIR Structure Notes

All bundles follow FHIR R4 specification with:
- **Bundle type:** `collection` (local files, not server transactions)
- **Resources included:** Patient, Condition, MedicationRequest (where applicable), Observation (labs), Coverage, Practitioner
- **Code systems:**
  - Diagnoses: `http://hl7.org/fhir/sid/icd-10-cm`
  - Medications: `http://www.nlm.nih.gov/research/umls/rxnorm`
  - Labs: `http://loinc.org`

**Critical alignment:**
- Coverage.payor[0].display uses EXACTLY "UHC" or "Aetna" to match policy store expectations
- Diagnosis codes (M05.79, M06.9) align with policy criteria (M05.*, M06.*)
- MedicationRequest.authoredOn dates create controlled duration scenarios

---

## Prompt Opinion Loading

Loading these patients into Prompt Opinion's patient selector will happen in **Phase 5 (Deployment and Integration)**.

### Option A - MCP Server Patient Loading (Most Likely)

1. Register the MCP server with Prompt Opinion workspace (Phase 5 DEP-02)
2. The MCP server's `get_patient_data` tool reads from `data/patients/demo-patients/*.json`
3. Patients become accessible via MCP tool calls - Prompt Opinion's patient selector invokes `get_patient_data` with a patient ID
4. Verify each patient appears in the selector: Sarah Anderson (full match), Michael Chen (partial match), Linda Washington (poor match)

### Option B - FHIR Bundle POST (If Prompt Opinion Has FHIR Endpoint)

1. POST each bundle to Prompt Opinion's FHIR endpoint (URL TBD during Phase 5)
2. Verify patients appear in patient selector UI
3. Confirm patient data matches expected scenarios

### Option C - Manual Entry (Fallback)

1. Use Prompt Opinion's patient creation UI (if available)
2. Enter each patient's demographics, diagnoses, medications, and coverage
3. Verify data matches the FHIR bundles

### Validation After Loading (Any Option)

- Open Prompt Opinion patient selector
- Confirm 3 patients visible: Sarah Anderson, Michael Chen, Linda Washington
- Select each patient and verify key data appears (diagnosis codes, medications, payer)

---

## Policy Mapping

| Patient | Payer | Policy File | Expected PA Readiness |
|---------|-------|-------------|----------------------|
| Sarah Anderson | UHC | uhc-adalimumab-ra.json | Full match - ready |
| Michael Chen | UHC | uhc-adalimumab-ra.json | Partial match - needs 1 more month methotrexate |
| Linda Washington | Aetna | aetna-adalimumab-ra.json | Poor match - multiple major gaps |

---

## Testing with FHIR Extractors

All three bundles have been validated against the FHIR extractors in `src/mcp/fhir/extractors.ts`. See `tests/validate-demo-patients.ts` for validation script.

**Validation results:**
- Patient 1: Extracts M05.79, methotrexate, UHC coverage
- Patient 2: Extracts M06.9, methotrexate, UHC coverage
- Patient 3: Extracts M06.9, no medications, Aetna coverage
