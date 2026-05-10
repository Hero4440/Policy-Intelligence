# Doctor Agent Structured Output

This document describes the structured output format for the Doctor Agent opinion system. It implements the response format defined in the system prompt for prior authorization readiness assessments.

## Overview

The Doctor Agent produces structured JSON output following this exact format:

```json
{
  "answer": "string",
  "answerExplanation": "string with source references",
  "status": "Ready for PA submission | Likely eligible but documentation missing | ...",
  "patientFacts": [
    {
      "fact": "string",
      "evidenceSource": "string",
      "confidence": "HIGH | MEDIUM | LOW"
    }
  ],
  "policyFindings": [
    {
      "payer": "string",
      "policy": "string",
      "drug": "string",
      "coverageStatus": "string",
      "paRequired": boolean,
      "preferredProductRequirement": "string?",
      "stepTherapy": "string?",
      "keyCriteria": ["string"]
    }
  ],
  "criteriaChecklist": [
    {
      "requirement": "string",
      "status": "PASS | FAIL | UNKNOWN | MISSING",
      "patientEvidence": "string",
      "policyEvidence": "string"
    }
  ],
  "missingInformation": ["string"],
  "recommendedNextSteps": ["string"],
  "sources": [
    {
      "tool": "string",
      "source": "string",
      "evidence": "string?"
    }
  ],
  "confidence": "HIGH | MEDIUM | LOW",
  "confidenceExplanation": "string"
}
```

## Sections Explained

### 1. Answer & Explanation

A short, direct answer to the user's question, followed by a detailed explanation that ties the answer to sources.

#### Answer

Direct statement of readiness status and criteria match count.

**Example:**

```text
"3/5 criteria appear met for prior authorization. Patient likely eligible but documentation missing."
```

#### Explanation

Detailed narrative that includes:

- Patient context and drug/payer information
- Coverage status with policy evidence
- Criteria assessment breakdown (passed, failed, uncertain)
- Policy requirements summary
- Evidence quality assessment
- Source citations

**Example:**

```markdown
**Patient:** Sarah Anderson
**Requested Drug:** Adalimumab
**Payer:** UHC

### Coverage Status

Adalimumab is **Covered with prior authorization required** under the UHC plan. Prior authorization is required.

*Evidence: get_prior_auth_criteria from UHC Adalimumab RA Policy (effective 2024-01-01)*

### Criteria Assessment

Based on the policy requirements from the UHC plan:

- **Passed:** 3 criteria
- **Failed:** 1 criteria
- **Uncertain:** 1 criteria requiring verification

**Criteria Met:**

- Rheumatoid arthritis diagnosis confirmed: Patient evidence shows "Confirmed RA diagnosis with positive RF and anti-CCP"
- Inadequate response to DMARDs: Patient evidence shows "Failed methotrexate monotherapy"
- Current disease activity: Patient evidence shows "DAS28 score 5.2 (high activity)"

**Criteria Needing Review:**

- Biologic-naive status (Not met): Policy requires "No prior biologic therapy"
- ECOG performance status (Uncertain): Policy requires "ECOG 0-3"
```

### 2. Status
A short, direct answer to the user's question about prior authorization readiness.

**Example:**
```
"3/5 criteria appear met for prior authorization. Patient likely eligible but documentation missing."
```

### 2. Status

One of six predefined readiness statuses:

- **Ready for PA submission** — All criteria met, documentation complete
- **Likely eligible but documentation missing** — Criteria likely met, but evidence gaps exist
- **Needs review** — Some criteria unmet or uncertain, requires clinical judgment
- **Not covered based on available evidence** — Policy clearly excludes this drug/indication
- **Insufficient policy evidence** — PolicyPilot lacks specific policy details
- **Insufficient patient data** — Unable to assess without complete patient information

### 3. Patient Facts Used

Array of clinical facts extracted from the patient context and clinical records.

**Structure:**

```json
{
  "fact": "Age: 53",
  "evidenceSource": "Patient demographics",
  "confidence": "HIGH"
}
```

**Confidence levels:**

- `HIGH` — Direct documentation, no ambiguity
- `MEDIUM` — Documented but may require confirmation
- `LOW` — Inferred or partially documented

### 4. Policy Findings

Array of coverage rules extracted from payer policies.

**Structure:**

```json
{
  "payer": "BCBS",
  "policy": "Bevacizumab Medical Coverage Guideline v3",
  "drug": "Bevacizumab",
  "coverageStatus": "Covered with prior authorization required",
  "paRequired": true,
  "preferredProductRequirement": "Avastin preferred over biosimilars",
  "stepTherapy": "Prior FOLFOX therapy required",
  "keyCriteria": [
    "Metastatic colorectal cancer diagnosis",
    "Prior chemotherapy progression",
    "Performance status 0-2"
  ]
}
```

### 5. Criteria Checklist

Table format checking each requirement against patient evidence.

**Status meanings:**

- `PASS` (✅) — Patient meets or exceeds requirement
- `FAIL` (❌) — Patient does not meet requirement
- `UNKNOWN` (❓) — Requirement uncertain, needs verification
- `MISSING` (⚠️) — No patient data available for requirement

**Example row:**

```
| Metastatic disease confirmed | PASS | CT imaging 2023-11-15 | "Confirmed metastatic disease" |
```

### 6. Missing Information

List of data truly required for determination (not just nice-to-have).

**Example:**

```json
[
  "Current ECOG performance status assessment",
  "Recent imaging confirming disease progression",
  "Documentation of intolerance to step therapy alternatives"
]
```

### 7. Recommended Next Steps

Operational clinic actions only (not system-level tasks).

**Example:**

```json
[
  "Obtain recent ECOG performance status from oncology note",
  "Request recent imaging study from radiology",
  "Submit PA request with gathered documentation"
]
```

### 8. Sources

Every policy claim includes:

- `tool` — Which MCP tool produced the evidence
- `source` — Payer/policy name and document identifier
- `evidence` — Optional policy text snippet

**Example:**

```json
{
  "tool": "get_prior_auth_criteria",
  "source": "BCBS NC Bevacizumab Medical Coverage Guideline (v3, effective 2024-01-01)",
  "evidence": "Member has an inadequate response, contraindication, or intolerance to Mvasi or Zirabev"
}
```

### 9. Confidence Assessment

Overall confidence in the determination.

**Factors considered:**

- Evidence completeness (tool results, policy details)
- Patient data completeness (clinical findings documented)
- Policy specificity (general guidelines vs. specific criteria)
- Criteria match rate (% of requirements met)

**Example explanation:**

```
"HIGH confidence: All patient clinical data documented (4+ findings), 
specific policy criteria available (5 requirements), 100% criteria match rate."
```

## API Endpoints

### JSON Response

```bash
POST /api/chat/doctor-agent
Content-Type: application/json

{
  "sessionId": "session-123",
  "messages": [
    {
      "role": "user",
      "content": "Is patient Sarah Anderson ready for adalimumab PA submission?"
    }
  ],
  "context": {
    "selectedDrug": "adalimumab",
    "selectedIssuer": "UHC"
  }
}
```

**Returns:** `DoctorAgentResponse` JSON object

### Markdown Response

```bash
POST /api/chat/doctor-agent/markdown
Content-Type: application/json

{
  "sessionId": "session-123",
  "messages": [
    {
      "role": "user",
      "content": "Is patient Sarah Anderson ready for adalimumab PA submission?"
    }
  ],
  "context": {
    "selectedDrug": "adalimumab",
    "selectedIssuer": "UHC"
  }
}
```

**Returns:** Human-readable markdown formatted response

## Integration with System Prompt

This output format implements the system prompt's "Required Workflow" and "Response Rules":

### ✅ System Prompt Requirements Met

1. **Ground every claim in MCP tool evidence** — Every policy finding includes tool source
2. **Clearly distinguish** patient facts, clinical reasoning, payer requirements, assumptions
3. **Identify exactly what is unknown** — Explicit in "Missing Information" section
4. **Present findings** in exact format — Answer → Status → Facts → Findings → Checklist → Missing → Steps → Sources → Confidence
5. **Tool routing rules** — Automatic tool selection based on user question context
6. **Critical constraints** — All policy questions routed through MCP tools, no fabrication

## Example Flow

### User Request
```
"Is Michael Chen ready for prior authorization of bevacizumab?"
```

### System Routing
1. Chat endpoint receives request
2. Determines "readiness" intent → routes to `check_patient_readiness` tool
3. Tool executes with Michael Chen's patient data and bevacizumab policy
4. Results compiled into structured response

### JSON Response
```json
{
  "answer": "4/5 criteria appear met. Patient likely eligible but ECOG status needs confirmation.",
  "status": "Likely eligible but documentation missing",
  "patientFacts": [
    {
      "fact": "Michael Chen, 47 years old",
      "evidenceSource": "Patient demographics",
      "confidence": "HIGH"
    },
    {
      "fact": "Diagnosis: Metastatic colorectal cancer, stage IV",
      "evidenceSource": "Clinical records",
      "confidence": "HIGH"
    }
  ],
  "policyFindings": [
    {
      "payer": "UHC",
      "policy": "Bevacizumab Coverage Guideline",
      "drug": "Bevacizumab",
      "coverageStatus": "Covered with prior authorization",
      "paRequired": true,
      "stepTherapy": "Prior FOLFOX therapy required",
      "keyCriteria": [
        "Metastatic CRC diagnosis",
        "Prior fluoropyrimidine-based regimen",
        "ECOG performance status 0-2",
        "No active bleeding"
      ]
    }
  ],
  "criteriaChecklist": [
    {
      "requirement": "Metastatic colorectal cancer confirmed",
      "status": "PASS",
      "patientEvidence": "Pathology report 2024-03-15, staging CT confirmed",
      "policyEvidence": "Metastatic CRC indication required"
    },
    {
      "requirement": "Prior FOLFOX treatment with progression",
      "status": "PASS",
      "patientEvidence": "FOLFOX x8 cycles, completed 2024-02-01, progressive disease",
      "policyEvidence": "Prior fluoropyrimidine regimen required"
    },
    {
      "requirement": "ECOG performance status 0-2",
      "status": "UNKNOWN",
      "patientEvidence": "Last documented: ECOG 1 (oncology note 2024-01-15)",
      "policyEvidence": "ECOG 0-2 required at time of PA submission"
    }
  ],
  "missingInformation": [
    "Current ECOG performance status (last documented 2 months ago)"
  ],
  "recommendedNextSteps": [
    "Obtain current oncology note with updated ECOG performance status",
    "Submit PA request with performance status documentation"
  ],
  "sources": [
    {
      "tool": "check_patient_readiness",
      "source": "UHC Bevacizumab Coverage Guideline (effective 2024-01-01)",
      "evidence": "Prior treatment with fluoropyrimidine-based chemotherapy required"
    }
  ],
  "confidence": "MEDIUM",
  "confidenceExplanation": "4/5 criteria confirmed, but current ECOG status requires recent documentation. Once ECOG status is verified, confidence will be HIGH."
}
```

### Markdown Response
Same information formatted as readable markdown with tables and visual indicators (✅ ❌ ⚠️ ❓).

## Usage in Frontend

### React Component Pattern
```typescript
// Fetch structured response
const response = await fetch('/api/chat/doctor-agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: currentSession.id,
    messages: chatHistory,
    context: { selectedDrug, selectedIssuer }
  })
});

const structured = await response.json();

// Access sections directly
console.log(structured.status);              // "Ready for PA submission"
console.log(structured.criteriaChecklist);   // Array of checklist items
console.log(structured.confidence);          // "HIGH"

// Or fetch markdown for display
const mdResponse = await fetch('/api/chat/doctor-agent/markdown', {...});
const markdown = await mdResponse.text();
```

## Error Handling

Both endpoints return structured errors:

```json
{
  "error": "sessionId is required"
}
```

Common errors:
- `sessionId is required` — Missing session identifier
- `A user message is required` — No user question provided
- `Unknown error` — System-level exception (check server logs)

## Performance Considerations

- **Tool execution time:** 500-2000ms per tool call (depends on policy complexity)
- **Response time:** 1-3 seconds for most queries (MCP server roundtrip)
- **Confidence accuracy:** Improves with more complete patient/policy data

## Future Enhancements

- [ ] Support for batch assessments (multiple patients)
- [ ] Streaming response option for real-time updates
- [ ] Policy change impact analysis
- [ ] Alternative therapy recommendations
- [ ] Appeal strategy recommendations
