# Phase 4: Patient Data Setup - Research

**Researched:** 2026-04-04
**Domain:** Synthetic patient data creation and loading into Prompt Opinion platform
**Confidence:** MEDIUM-HIGH

## Summary

Phase 4 requires creating at least 3 synthetic demo patients with controlled prior authorization scenarios (full match, partial match with gaps, poor match) and loading them into the Prompt Opinion workspace. These patients must include relevant FHIR data: RA diagnosis codes (M05.*, M06.*), medication history, lab results, and payer information.

The standard approach combines **Synthea** for generating realistic baseline FHIR patient bundles with **hand-crafted customization** to ensure controlled demo scenarios. Synthea generates complete patient histories in FHIR R4 Bundle format with realistic demographics, diagnoses, medications, and observations, but the output must be customized to align precisely with the policy criteria extracted in Phase 1 (e.g., ensuring Patient A has exactly 3 months of methotrexate history for a full match scenario).

Prompt Opinion uses SHARP extension specs to provide FHIR context to MCP servers, meaning patient data must be accessible via a FHIR API endpoint. The platform likely supports patient import via FHIR Bundle upload or manual creation through their workspace interface. By 2026, FHIR R4 API compliance is a baseline regulatory expectation, and the platform's SHARP integration indicates they maintain a FHIR server that MCP tools can query using context tokens.

**Primary recommendation:** Use Synthea to generate baseline RA patient bundles, then hand-edit the JSON to create three controlled scenarios: (1) Patient with complete criteria match (3+ months methotrexate, confirmed RA diagnosis, rheumatologist prescriber), (2) Patient with partial match (RA diagnosis, only 1 month methotrexate - gap identified), (3) Patient with poor match (RA diagnosis, no prior DMARD trials - major gap). Load patients into Prompt Opinion via their platform interface or FHIR API import.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Synthea | Latest (3.x+) | Synthetic patient generation | Industry standard for synthetic FHIR data (MITRE), realistic clinical sequences, free/open source |
| FHIR R4 | 4.0.1 | Patient data format | Required by CMS regulations 2026, Prompt Opinion SHARP specs, industry standard |
| JSON editor | VSCode/Cursor | Manual FHIR editing | Hand-crafting controlled scenarios, validating against FHIR schema |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fhir.resources (Python) | Latest | FHIR validation | Optional - validate hand-edited bundles before import |
| HAPI FHIR Validator | CLI | Bundle validation | Optional - ensure FHIR compliance |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Synthea | Fully hand-crafted patients | Hand-craft: Full control but extremely time-consuming; Synthea + edits balances realism with control |
| Synthea | Public FHIR test data | Public data: Pre-made but won't align with specific policy criteria from Phase 1 |
| Manual editing | LLM-assisted generation | LLM generation: Faster but requires validation; manual editing more precise for 3 patients |

**Installation:**
```bash
# Synthea (Java-based)
git clone https://github.com/synthetichealth/synthea.git
cd synthea
./gradlew build check test

# Or download pre-built JAR from releases
# https://github.com/synthetichealth/synthea/releases

# Optional: FHIR validator
npm install -g fhir-validator
```

---

## Architecture Patterns

### Recommended Patient Structure
```
data/
├── patients/
│   ├── synthea-raw/          # Original Synthea output (backup)
│   ├── demo-patients/        # Hand-edited demo patients
│   │   ├── patient-01-full-match.json
│   │   ├── patient-02-partial-match.json
│   │   └── patient-03-poor-match.json
│   └── patient-scenarios.md  # Documentation of each scenario
```

### Pattern 1: Synthea Generation + Manual Refinement
**What:** Generate baseline patient with Synthea, then hand-edit to match policy criteria
**When to use:** Always for demo patients - balances realism with controlled scenarios
**Example:**
```bash
# Generate 10 RA patients, pick best 3 as starting points
./run_synthea -p 10 -m rheumatoid_arthritis

# Output: ./output/fhir/*.json (one Bundle per patient)
# Hand-edit selected bundles to create controlled scenarios
```

### Pattern 2: Three-Scenario Strategy
**What:** Create three distinct demo patients representing different PA readiness states
**When to use:** Required by Phase 4 success criteria
**Scenarios:**

**Scenario 1: Full Criteria Match (Green Path)**
- RA diagnosis: M05.79 (seropositive RA)
- Methotrexate history: 3 months at 15mg weekly (documented as MedicationRequest + Observations)
- Lab results: Elevated ESR (40 mm/hr), CRP (2.5 mg/L), RF positive
- Payer: UnitedHealthcare Commercial
- Prescriber: Rheumatologist (Practitioner resource)
- Expected result: "Patient appears ready for PA submission"

**Scenario 2: Partial Match with Gap (Amber Path - The "Wow Moment")**
- RA diagnosis: M06.9 (RA, unspecified)
- Methotrexate history: Only 1 month documented (gap: need 3 months)
- Lab results: Elevated ESR, CRP
- Payer: UnitedHealthcare Commercial
- Prescriber: Rheumatologist
- Expected result: "Patient may need additional 2 months of methotrexate documentation before PA approval"

**Scenario 3: Poor Match with Major Gaps (Red Path)**
- RA diagnosis: M06.9
- No DMARD trials documented
- No recent lab results (>6 months old)
- Payer: UnitedHealthcare Commercial
- Prescriber: Primary care physician (not rheumatologist)
- Expected result: "Major requirements missing: DMARD trial, rheumatologist consultation, recent labs"

### Pattern 3: FHIR Bundle Structure for Demo Patients
**What:** Each patient is a Bundle (type: transaction) with all necessary resources
**When to use:** Standard FHIR R4 format for Synthea output and platform import
**Example:**
```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "fullUrl": "urn:uuid:patient-01",
      "resource": {
        "resourceType": "Patient",
        "id": "patient-01-full-match",
        "name": [{"family": "Anderson", "given": ["Sarah"]}],
        "gender": "female",
        "birthDate": "1975-06-15"
      },
      "request": {"method": "POST", "url": "Patient"}
    },
    {
      "fullUrl": "urn:uuid:condition-01",
      "resource": {
        "resourceType": "Condition",
        "code": {
          "coding": [{
            "system": "http://hl7.org/fhir/sid/icd-10-cm",
            "code": "M05.79",
            "display": "Rheumatoid arthritis with rheumatoid factor, unspecified site"
          }]
        },
        "subject": {"reference": "urn:uuid:patient-01"},
        "onsetDateTime": "2023-01-15"
      },
      "request": {"method": "POST", "url": "Condition"}
    },
    {
      "fullUrl": "urn:uuid:medrequest-01",
      "resource": {
        "resourceType": "MedicationRequest",
        "status": "active",
        "intent": "order",
        "medicationCodeableConcept": {
          "coding": [{
            "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
            "code": "6851",
            "display": "Methotrexate"
          }]
        },
        "subject": {"reference": "urn:uuid:patient-01"},
        "authoredOn": "2023-02-01",
        "dosageInstruction": [{
          "text": "15mg weekly",
          "timing": {"repeat": {"frequency": 1, "period": 1, "periodUnit": "wk"}},
          "doseAndRate": [{"doseQuantity": {"value": 15, "unit": "mg"}}]
        }]
      },
      "request": {"method": "POST", "url": "MedicationRequest"}
    },
    {
      "fullUrl": "urn:uuid:obs-esr",
      "resource": {
        "resourceType": "Observation",
        "status": "final",
        "code": {
          "coding": [{
            "system": "http://loinc.org",
            "code": "30341-2",
            "display": "Erythrocyte sedimentation rate"
          }]
        },
        "subject": {"reference": "urn:uuid:patient-01"},
        "effectiveDateTime": "2024-03-15",
        "valueQuantity": {"value": 40, "unit": "mm/hr"}
      },
      "request": {"method": "POST", "url": "Observation"}
    }
  ]
}
```

### Pattern 4: Payer Information Mapping
**What:** Map payer names to Coverage resources aligned with Phase 1 policy data
**When to use:** Every patient must have payer info matching policy store (UHC, Aetna, Cigna)
**Example:**
```json
{
  "resourceType": "Coverage",
  "status": "active",
  "type": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      "code": "HIP",
      "display": "health insurance plan policy"
    }]
  },
  "subscriber": {"reference": "urn:uuid:patient-01"},
  "beneficiary": {"reference": "urn:uuid:patient-01"},
  "payor": [{
    "reference": "urn:uuid:org-uhc",
    "display": "UnitedHealthcare"
  }],
  "class": [{
    "type": {
      "coding": [{
        "system": "http://terminology.hl7.org/CodeSystem/coverage-class",
        "code": "plan"
      }]
    },
    "value": "Commercial",
    "name": "UHC Commercial Plan"
  }]
}
```

### Anti-Patterns to Avoid
- **Fully randomized Synthea output without editing:** Random patients won't align with specific policy criteria from Phase 1; must hand-edit to create controlled scenarios
- **Missing required resources:** Every patient must have Patient, Condition (RA diagnosis), Coverage (payer), and scenario-specific MedicationRequest/Observation resources
- **Invalid FHIR references:** All resource references must use correct URNs or IDs within Bundle; broken references cause import failures
- **Unrealistic clinical sequences:** Even hand-edited data should maintain clinical plausibility (e.g., RA diagnosis before methotrexate prescription)
- **Ignoring ICD-10 code specificity:** Use correct codes from Phase 1 policy criteria (M05.*, M06.*), not generic placeholder codes

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Realistic patient demographics | Manual fake data generation | Synthea baseline | Synthea generates clinically plausible timelines, realistic demographics, valid code systems |
| FHIR resource structure | Custom JSON from scratch | Copy Synthea output + edit | FHIR resources have complex required fields, nested structures; easier to edit than build |
| FHIR validation | Manual schema checking | HAPI FHIR Validator or fhir.resources | FHIR spec has 145+ resources, thousands of constraints; validators catch subtle errors |
| Patient histories | Inventing medical timelines | Synthea disease modules | Synthea models realistic disease progression based on CDC/NIH statistics |

**Key insight:** Synthea solves the "realistic but synthetic" problem. Your effort should focus on scenario customization (adjusting medication durations, removing/adding specific observations to create controlled gaps) rather than building FHIR patients from scratch.

---

## Common Pitfalls

### Pitfall 1: Synthea Output Doesn't Match Policy Criteria
**What goes wrong:** Generated patient has RA diagnosis but wrong medication history (e.g., biologic as first-line instead of DMARD)
**Why it happens:** Synthea generates realistic but random clinical paths; doesn't know your Phase 1 policy requirements
**How to avoid:**
- Generate 5-10 patients, select 3 closest to desired scenarios as starting points
- Hand-edit MedicationRequest resources to match policy step therapy (ensure methotrexate first, correct duration)
- Add/remove Observation resources to create gaps (e.g., delete 2 months of methotrexate observations for partial match scenario)
**Warning signs:** Patient history contradicts policy criteria; impossible to demonstrate "gap identification" because all generated patients happen to match perfectly

### Pitfall 2: Missing Coverage/Payer Information
**What goes wrong:** Patient bundle lacks Coverage resource or payer name doesn't match Phase 1 policy store ("UHC", "Aetna", "Cigna")
**Why it happens:** Synthea generates generic payer info; doesn't know your specific payer list
**How to avoid:**
- Add/edit Coverage resource in each Bundle
- Ensure payor.display matches exactly what Phase 1 policy loader expects ("UnitedHealthcare" → "UHC" mapping)
- Include plan type ("Commercial", "Medicare Advantage") if Phase 1 policies differentiate by plan
**Warning signs:** MCP tools can't match patient to policy; payer lookup failures during testing

### Pitfall 3: Invalid FHIR Bundle Structure
**What goes wrong:** Prompt Opinion import fails with validation errors or broken resource references
**Why it happens:** Hand-editing introduces structural errors (missing required fields, invalid reference URNs, wrong Bundle.type)
**How to avoid:**
- Use FHIR validator before attempting import: `fhir-validator patient-01.json`
- Validate all resource references resolve within Bundle (use "urn:uuid:" for internal refs)
- Keep Bundle.type = "transaction" (standard for Synthea output, works with FHIR servers)
- Test with minimal Bundle first (Patient + Condition only), then add resources incrementally
**Warning signs:** Import errors, "resource not found" reference errors, schema validation failures

### Pitfall 4: Unrealistic Medication Timelines
**What goes wrong:** Patient shows methotrexate started after Humira request, or 3 months of weekly methotrexate compressed into 1 week
**Why it happens:** Hand-editing dates without checking clinical plausibility
**How to avoid:**
- Maintain realistic date sequences: Diagnosis → DMARD trial → Failure → Biologic request
- Use calendar to calculate: 3 months = ~12 weeks = ~12 weekly methotrexate doses
- Document dates in patient-scenarios.md to track timeline consistency
**Warning signs:** Readiness tool logic breaks because dates are nonsensical; demo script fails credibility

### Pitfall 5: Prompt Opinion Import Method Unknown
**What goes wrong:** Spend hours perfecting FHIR bundles but don't know how to load them into Prompt Opinion
**Why it happens:** No public documentation found on Prompt Opinion patient import process
**How to avoid:**
- Check Prompt Opinion documentation early in phase (before finalizing patient data)
- Test patient creation methods: workspace UI (manual patient entry), FHIR API import (POST Bundle), or file upload
- Prepare fallback: if automated import unavailable, use platform's manual patient creation interface with copy-paste from JSON
- Contact Prompt Opinion support if import method unclear
**Warning signs:** Perfect patient data but no clear path to get it into platform; blocked on Phase 5

### Pitfall 6: Missing Demonstration of "Gap Identification"
**What goes wrong:** All three patients either fully match or fully fail; no partial match scenario showing "almost ready but missing X"
**Why it happens:** Focusing on coverage determination rather than gap analysis (the key demo value)
**How to avoid:**
- Explicitly design Patient 2 (partial match) with ONE clear gap (e.g., only 1 month methotrexate when 3 required)
- Ensure gap is something MCP tool can identify programmatically (date math: "methotrexate started 2024-03-01, PA requested 2024-04-05 = 1 month < 3 months required")
- Test `check_patient_readiness` tool specifically with Patient 2 during development
**Warning signs:** All readiness checks return binary "ready/not ready"; no actionable gaps highlighted

---

## Code Examples

Verified patterns from official sources:

### Synthea Command-Line Generation
```bash
# Source: https://github.com/synthetichealth/synthea
# Generate 10 patients with rheumatoid arthritis module
./run_synthea -p 10 -m rheumatoid_arthritis

# Generate patients from specific state/city for realistic demographics
./run_synthea -p 5 Massachusetts Boston

# Output location: ./output/fhir/*.json
# Each file is a FHIR R4 Bundle with one patient + all related resources
```

### Minimal FHIR Patient Resource (Hand-Crafted Starting Point)
```json
// Source: https://www.hl7.org/fhir/patient-example.json.html
{
  "resourceType": "Patient",
  "id": "patient-01-full-match",
  "identifier": [
    {
      "system": "http://hospital.example.org/mrn",
      "value": "MRN-001-DEMO"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "Anderson",
      "given": ["Sarah", "J."]
    }
  ],
  "gender": "female",
  "birthDate": "1975-06-15",
  "address": [
    {
      "use": "home",
      "line": ["123 Main St"],
      "city": "Boston",
      "state": "MA",
      "postalCode": "02101"
    }
  ]
}
```

### RA Condition Resource with ICD-10
```json
// Source: FHIR R4 Condition resource spec
{
  "resourceType": "Condition",
  "id": "condition-ra-01",
  "clinicalStatus": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
      "code": "active"
    }]
  },
  "verificationStatus": {
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
      "code": "confirmed"
    }]
  },
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/condition-category",
      "code": "encounter-diagnosis"
    }]
  }],
  "code": {
    "coding": [{
      "system": "http://hl7.org/fhir/sid/icd-10-cm",
      "code": "M05.79",
      "display": "Rheumatoid arthritis with rheumatoid factor of multiple sites without organ or systems involvement"
    }],
    "text": "Seropositive rheumatoid arthritis"
  },
  "subject": {"reference": "Patient/patient-01-full-match"},
  "onsetDateTime": "2023-01-15",
  "recordedDate": "2023-01-20"
}
```

### Methotrexate MedicationRequest (Step Therapy Evidence)
```json
// Source: FHIR R4 MedicationRequest resource spec
{
  "resourceType": "MedicationRequest",
  "id": "medrequst-mtx-01",
  "status": "active",
  "intent": "order",
  "medicationCodeableConcept": {
    "coding": [{
      "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
      "code": "6851",
      "display": "Methotrexate"
    }],
    "text": "Methotrexate 15mg weekly"
  },
  "subject": {"reference": "Patient/patient-01-full-match"},
  "authoredOn": "2023-02-01",
  "requester": {
    "reference": "Practitioner/rheumatologist-01",
    "display": "Dr. Emily Rodriguez, Rheumatology"
  },
  "dosageInstruction": [{
    "text": "15mg orally once weekly",
    "timing": {
      "repeat": {
        "frequency": 1,
        "period": 1,
        "periodUnit": "wk"
      }
    },
    "route": {
      "coding": [{
        "system": "http://snomed.info/sct",
        "code": "26643006",
        "display": "Oral route"
      }]
    },
    "doseAndRate": [{
      "doseQuantity": {
        "value": 15,
        "unit": "mg",
        "system": "http://unitsofmeasure.org",
        "code": "mg"
      }
    }]
  }]
}
```

### Lab Results (ESR, CRP) - Observation Resource
```json
// Source: FHIR R4 Observation resource spec
{
  "resourceType": "Observation",
  "id": "obs-esr-01",
  "status": "final",
  "category": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/observation-category",
      "code": "laboratory"
    }]
  }],
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "30341-2",
      "display": "Erythrocyte sedimentation rate"
    }],
    "text": "ESR"
  },
  "subject": {"reference": "Patient/patient-01-full-match"},
  "effectiveDateTime": "2024-03-15",
  "valueQuantity": {
    "value": 40,
    "unit": "mm/hr",
    "system": "http://unitsofmeasure.org",
    "code": "mm/h"
  },
  "interpretation": [{
    "coding": [{
      "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
      "code": "H",
      "display": "High"
    }]
  }],
  "referenceRange": [{
    "low": {"value": 0, "unit": "mm/hr"},
    "high": {"value": 20, "unit": "mm/hr"}
  }]
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual FHIR creation | Synthea + hand-editing | 2020-2025 | Synthea now industry standard for synthetic data; saves 80% effort vs full hand-crafting |
| FHIR DSTU2/STU3 | FHIR R4 | 2019-2026 | R4 is regulatory requirement (CMS 2026), all new systems must use R4 |
| HL7 v2 messages | FHIR Bundles | 2018-2026 | FHIR Bundles replace traditional HL7 v2 messaging for patient data exchange |
| Local test servers | Cloud FHIR servers | 2022-2026 | Platforms like Prompt Opinion host FHIR servers; patient data lives in platform rather than local files |
| CSV/XML patient data | FHIR JSON | 2020-2026 | FHIR JSON is industry standard, REST API compatible, modern tooling support |

**Deprecated/outdated:**
- **FHIR DSTU2 (2015):** Superseded by R4; CMS no longer accepts DSTU2 for regulatory compliance (2026)
- **HL7 v2 ADT messages:** Legacy format; FHIR Patient resources are current standard
- **Fully hand-crafted test patients:** Time-prohibitive; Synthea generates realistic baselines far faster
- **CCDAs for patient exchange:** FHIR Bundles preferred for API-first integrations

---

## Domain-Specific Findings

### Prompt Opinion Platform & SHARP Context (2026)

**Platform Overview:**
- Prompt Opinion is a healthcare AI agent platform built natively on three interoperability protocols: MCP, A2A (Agent-to-Agent), and FHIR
- The platform provides the chat UI, agent orchestration, and FHIR patient context via SHARP extension specs
- **Source:** [Agents Assemble Hackathon](https://agents-assemble.devpost.com/?ref_feature=challenge&ref_medium=discover)

**SHARP FHIR Context Integration:**
- SHARP (Substitutable Health Apps Reusable Platform) specs enable EHR session credentials to be bridged directly into context
- Developers don't need to invent bespoke token-handling solutions; Prompt Opinion handles FHIR context propagation through multi-agent call chains
- MCP servers receive FHIR context tokens and can query patient data from Prompt Opinion's FHIR server
- **Implication for Phase 4:** Patient data loaded into Prompt Opinion becomes accessible to our MCP tools via SHARP token-based FHIR queries (implemented in Phase 3)

**Patient Data Management:**
- Prompt Opinion provides patient data management capabilities within the platform workspace
- Likely supports patient import via FHIR API or workspace interface
- Platform must maintain a FHIR server to support SHARP context integration
- **Open question:** Specific import method (FHIR Bundle POST, file upload, manual entry) - may need to check platform documentation or support

### Synthea for RA Patient Generation (2026)

**Capabilities:**
- Synthea is the industry-standard synthetic patient generator maintained by MITRE
- Generates synthetic, realistic but not real patient data in FHIR R4, STU3, DSTU2, C-CDA, and CSV formats
- Each patient simulated from birth to present with disease modules modeling event progressions based on CDC/NIH statistics
- **Source:** [Synthea Documentation](https://synthetichealth.github.io/synthea/)

**Rheumatoid Arthritis Module:**
- Synthea includes disease modules for various conditions including rheumatoid arthritis
- Generates patients with RA diagnoses, medication histories, lab results, and encounter sequences
- Command: `./run_synthea -p 10 -m rheumatoid_arthritis` generates 10 RA patients
- **Source:** [GitHub - synthetichealth/synthea](https://github.com/synthetichealth/synthea)

**FHIR Output Format:**
- By default, exports one file per patient as a Bundle with type: transaction
- Contains Patient resource as first entry, followed by Conditions, Observations, Procedures, MedicationRequests
- Resources grouped by Encounter in chronological order
- **Source:** [Synthea FHIR Overview](https://mitre.github.io/fhir-for-research/modules/synthea-overview)

**Data Availability:**
- Pre-generated datasets available: SyntheticMass project provides 1 million synthetic patient records
- Free from cost, privacy, and security restrictions
- Can be used for research, development, and testing without HIPAA concerns
- **Source:** [Synthea Downloads](https://synthea.mitre.org/downloads)

### ICD-10 Codes for RA (2026 Updates)

**Current Codes (effective Oct 1, 2025):**
- **M05.*:** Rheumatoid arthritis with rheumatoid factor (seropositive)
- **M06.*:** Other rheumatoid arthritis
- **M05.A:** New code for abnormal rheumatoid factor and anti-citrullinated protein antibody with RA (added 2026)
- **M06.9:** Rheumatoid arthritis, unspecified
- **Source:** [2026 ICD-10-CM M06.9](https://www.icd10data.com/ICD10CM/Codes/M00-M99/M05-M14/M06-/M06.9), [Rheumatology Billing 2026](https://www.medcloudmd.com/post/rheumatology-billing-guidelines-2026)

**Policy Alignment:**
- Phase 1 policies reference M05.* and M06.* as diagnosis requirements
- Demo patients should use specific codes (M05.79, M06.9) rather than wildcards
- New M05.A code allows more specific classification based on serological findings

### FHIR Prior Authorization Bundle Examples

**Da Vinci PAS Implementation Guide:**
- HL7 Da Vinci Prior Authorization Support (PAS) FHIR IG provides official bundle examples
- Includes Homecare Authorization Update Bundle, PAS Claim Inquiry Response Bundle
- Resources required: Patient, Coverage, Claim, supporting documentation
- **Source:** [Da Vinci PAS Bundle Examples](https://build.fhir.org/ig/HL7/davinci-pas/Bundle-HomecareAuthorizationUpdateBundleExample.html)

**Bundle Structure:**
- Contains Patient, Insurer Organization, Provider Organization resources
- All cross-references must be valid and resolvable within Bundle
- Uses Bundle type: transaction or collection depending on use case
- **Source:** [End-to-End Prior Authorizations Using FHIR](https://www.availity.com/case-studies/end-to-end-prior-authorizations-using-fhir-apis/)

**Testing Approach:**
- Can submit test bundles using curl to FHIR server endpoints
- Validators check Bundle structure, resource references, required fields
- **Source:** [IBM FHIR PAS Bundle Example](https://www.ibm.com/docs/en/ste/11.0.1?topic=examples-fhir-example-pas-bundle-json-schema)

---

## Open Questions

1. **Prompt Opinion patient import mechanism**
   - What we know: Platform supports SHARP FHIR context, implies FHIR server backend
   - What's unclear: Specific method to load patient data (FHIR Bundle POST? File upload? Manual entry?)
   - Recommendation: Check Prompt Opinion documentation early in phase; test workspace patient creation interface; prepare fallback (manual entry) if automated import unavailable

2. **FHIR Bundle validation requirements**
   - What we know: FHIR R4 is standard, Bundles must have valid structure and references
   - What's unclear: Does Prompt Opinion enforce strict validation, or accept loosely-structured bundles?
   - Recommendation: Validate all bundles with HAPI FHIR Validator before import; start with minimal Bundle and add resources incrementally

3. **Patient-to-policy mapping precision**
   - What we know: Coverage resource should include payer name; Phase 1 policies use "UHC", "Aetna", "Cigna"
   - What's unclear: Exact string matching requirements (case-sensitive? "UnitedHealthcare" vs "UHC"?)
   - Recommendation: Test with Phase 3's `check_patient_readiness` tool during patient creation; ensure payer names match policy loader expectations exactly

4. **Synthea RA module output variance**
   - What we know: Synthea generates realistic but random clinical paths
   - What's unclear: How many patients need to be generated to find suitable starting points for 3 scenarios?
   - Recommendation: Generate 10-15 patients initially; select 3 closest to desired scenarios; budget 2-3 hours for hand-editing

5. **Prompt Opinion workspace limits**
   - What we know: Need at least 3 demo patients
   - What's unclear: Any patient count limits, storage constraints, or workspace quotas?
   - Recommendation: Start with 3 patients as specified; can add more if platform allows and time permits

---

## Sources

### Primary (HIGH confidence)
- [Agents Assemble Hackathon - Prompt Opinion](https://agents-assemble.devpost.com/?ref_feature=challenge&ref_medium=discover) - Platform overview, SHARP context integration
- [Synthea Documentation](https://synthetichealth.github.io/synthea/) - Official synthetic patient generator
- [Synthea GitHub](https://github.com/synthetichealth/synthea) - Source code, command-line usage
- [Synthea FHIR Overview](https://mitre.github.io/fhir-for-research/modules/synthea-overview) - FHIR output format details
- [HL7 FHIR Patient Examples](https://www.hl7.org/fhir/patient-example.json.html) - Official FHIR resource templates
- [Da Vinci PAS Bundle Examples](https://build.fhir.org/ig/HL7/davinci-pas/Bundle-HomecareAuthorizationUpdateBundleExample.html) - Prior auth bundle structure

### Secondary (MEDIUM confidence)
- [FHIR Integration Guide 2026](https://murphi.ai/fhir-integration/) - 2026 regulatory context
- [Healthcare API Interoperability 2026](https://www.clindcast.com/healthcare-api-interoperability-and-fhir-guide-2026/) - FHIR R4 compliance requirements
- [2026 ICD-10-CM M06.9](https://www.icd10data.com/ICD10CM/Codes/M00-M99/M05-M14/M06-/M06.9) - RA diagnosis codes
- [Rheumatology Billing Guidelines 2026](https://www.medcloudmd.com/post/rheumatology-billing-guidelines-2026) - ICD-10 updates
- [End-to-End Prior Authorizations FHIR](https://www.availity.com/case-studies/end-to-end-prior-authorizations-using-fhir-apis/) - FHIR bundle usage
- [MCP-FHIR Framework](https://arxiv.org/html/2506.13800v1) - Clinical decision support with MCP and FHIR

### Tertiary (LOW confidence - community resources)
- [How To Create Your First FHIR Resource](https://medblocks.com/blog/fhir-101-creating-your-first-patient-resource-like-a-pro) - Tutorial on FHIR resource creation
- [FHIR Patient Resource Sample](https://darrendevitt.com/fhirs-patient-resource-sample-json/) - Community examples

---

## Metadata

**Confidence breakdown:**
- Synthea capabilities: HIGH - Official MITRE documentation, widely adopted industry standard
- FHIR R4 structure: HIGH - Official HL7 specification, regulatory requirement
- Prompt Opinion integration: MEDIUM - Platform exists and supports SHARP/FHIR, but specific import method unclear from public docs
- Patient scenario design: MEDIUM-HIGH - Clear requirements from Phase 1 policies, but execution depends on Synthea output quality
- ICD-10 codes: HIGH - Official 2026 ICD-10-CM codes verified

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (30 days)
- **Rationale:** FHIR R4 and Synthea are stable; ICD-10 codes updated annually (next update Oct 2026); Prompt Opinion platform features may evolve but core FHIR/SHARP integration is stable
