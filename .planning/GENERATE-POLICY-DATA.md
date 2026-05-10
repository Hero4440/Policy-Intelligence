# Policy Data Generation Task

## Goal
Generate policy JSON records for the Compare feature to work. Currently, only 1 policy exists (Cigna Herceptin). Need at least 2-3 comparable policies for different payers.

## Data Structure

### Schema Location
`data/schemas/policy.schema.ts` — defines the exact structure required

### Key Constraints
- **Payer enum**: Must be one of: `UHC`, `Aetna`, `Cigna`, `BCBS-NC`
- **Coverage Status**: `covered` | `covered-with-pa` | `excluded`
- **Drug Products**: Must include `tier: 'preferred'` or `tier: 'non-preferred'`
- **Source Reference**: Every evidence snippet needs `{ document, page, section }`

## What to Generate

### Target: Humira (Adalimumab) for Compare Demo
Create 2-3 policies for the same drug, different payers:

1. **UHC Adalimumab RA Policy**
   - File: `data/policies/structured/uhc-adalimumab-ra.json` (already exists - verify it)
   - Payer: `UHC`
   - Indication: `Rheumatoid Arthritis`
   - Include: Prior auth, step therapy, preferred/non-preferred products, restrictions

2. **Aetna Adalimumab RA Policy** ← NEEDS TO BE CREATED
   - File: `data/policies/structured/aetna-adalimumab-ra.json`
   - Payer: `Aetna`
   - Indication: `Rheumatoid Arthritis`
   - Include: Prior auth (different from UHC), step therapy, products, restrictions

3. **Cigna Adalimumab RA Policy** (optional, for 3-payer compare)
   - File: `data/policies/structured/cigna-adalimumab-ra.json`
   - Payer: `Cigna`
   - Similar structure with variations to show differences

### OR: Use Existing Herceptin
If generating new policies is complex, create:
- `aetna-herceptin.json` (Aetna version)
- `uhc-herceptin.json` (UHC version)

Then the Compare feature will auto-populate with Herceptin options.

## JSON Schema - Example Structure

```json
{
  "id": "aetna-adalimumab-ra",
  "payer": "Aetna",
  "plan": "Commercial",
  "policyTitle": "Aetna Adalimumab Prior Authorization Policy",
  "drug": {
    "brandName": "Humira",
    "genericName": "adalimumab",
    "aliases": ["adalimumab", "humira"],
    "products": [
      {
        "name": "Humira (40mg/0.8mL prefilled syringe)",
        "tier": "preferred",
        "aliases": []
      },
      {
        "name": "Amjevita",
        "tier": "preferred",
        "aliases": ["adalimumab biosimilar"]
      }
    ]
  },
  "indication": "Rheumatoid Arthritis",
  "coverageStatus": "covered-with-pa",
  "paRequired": true,
  "diagnosisRequirements": [
    {
      "icd10Codes": ["M05.*", "M06.*"],
      "description": "ICD-10 codes for RA",
      "evidenceText": "Prior authorization required for diagnoses including M05.* and M06.*",
      "source": {
        "document": "Aetna_RA_PA_Policy_2026.pdf",
        "page": 3,
        "section": "Covered Indications"
      }
    }
  ],
  "stepTherapy": [
    {
      "drugName": "methotrexate",
      "dosage": "15mg+",
      "duration": "3 months",
      "failureCriteria": "inadequate response or intolerance",
      "evidenceText": "Prior therapy with methotrexate 15mg or higher required for 3 months",
      "source": {
        "document": "Aetna_RA_PA_Policy_2026.pdf",
        "page": 4,
        "section": "Step Therapy Requirements"
      }
    }
  ],
  "otherRequirements": [
    {
      "category": "prescriber qualification",
      "requirement": "Prescribed by rheumatologist or authorized specialist",
      "evidenceText": "Drug must be prescribed by a board-certified rheumatologist",
      "source": {
        "document": "Aetna_RA_PA_Policy_2026.pdf",
        "page": 5,
        "section": "Prescriber Requirements"
      },
      "ambiguous": false
    }
  ],
  "sourceDocument": {
    "filename": "Aetna_RA_PA_Policy_2026.pdf",
    "url": "https://example.com/aetna-ra-policy",
    "retrievalDate": "2026-05-10",
    "effectiveDate": "2026-01-01"
  }
}
```

## Verification Checklist

After generating files:

1. ✅ File saved to `data/policies/structured/{name}.json`
2. ✅ JSON is valid (no syntax errors)
3. ✅ Payer is exactly: `UHC`, `Aetna`, `Cigna`, or `BCBS-NC` (case-sensitive)
4. ✅ Coverage status is: `covered`, `covered-with-pa`, or `excluded`
5. ✅ All `evidenceText` fields have corresponding `source` with `{ document, page, section }`
6. ✅ `paRequired` boolean matches `coverageStatus` logic:
   - If `coverageStatus: "covered-with-pa"` → `paRequired: true`
   - If `coverageStatus: "covered"` → `paRequired: false` (usually)
   - If `coverageStatus: "excluded"` → `paRequired` doesn't matter
7. ✅ Drug generic/brand names match the display in video script (e.g., "Humira (adalimumab)")
8. ✅ For comparing: ensure 2+ payers have the SAME drug family to see differences

## How It's Used

1. **Frontend**: Calls `/api/policy/compare-options` → returns all available drug families
2. **Backend**: `getPolicyCompareOptions()` in `src/server/policy-compare.ts` loads all JSON files
3. **Comparison**: `buildPolicyComparison(drugFamily, payers)` fetches matching policies and builds the table

## Testing After Generation

```bash
# Verify JSON validity
jq . data/policies/structured/aetna-adalimumab-ra.json

# Check if policies are detected
curl http://localhost:3000/api/policy/compare-options
```

Expected response should include `"Humira (adalimumab)"` with `payers: ["Aetna", "UHC", ...]`

## Notes for Gemini

- Use realistic but plausible policy language (can be inspired by public formularies)
- Vary the policies: Aetna might have stricter PA, UHC might have different step therapy
- This creates the visual "Key restrictions diverge" highlight shown in the demo video
- If real PDFs are available, extract actual quotes; otherwise, create synthetic but realistic restrictions
