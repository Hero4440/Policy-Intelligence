# Blended Agent Implementation Guide for Prompt Opinion

## Quick Start

The Blended Agent is now the **default agent** in Prompt Opinion. It automatically:

1. **Detects your persona** from how you phrase your question
2. **Selects the right format** (technical for doctors, simple for patients, policy-focused for reviewers)
3. **Backs everything with data** from PolicyPilot MCP
4. **Cites sources appropriately** for your audience

No configuration needed - just ask your question naturally.

## How It Works

### 1. Persona Detection

The agent reads your query and determines which persona fits best:

```
User says: "I have a 45-year-old with Type 2 DM and eGFR 42..."
→ Detects: DOCTOR (medical terminology, clinical context)
→ Responds with: Technical depth, clinical guidelines, policy sections

User says: "My insurance won't cover my inhaler. What do I do?"
→ Detects: PATIENT (simple language, personal concern)
→ Responds with: Simple explanation, actionable steps, timeline

User says: "Prior auth request for Ozempic - what's the approval likelihood?"
→ Detects: PRIOR AUTH (policy/administrative focus)
→ Responds with: Coverage decision, criteria evaluation, missing docs
```

### 2. Response Format Adaptation

#### When Blended Agent Detects DOCTOR Persona

**Response includes:**
- Clinical Assessment with evidence level
- Coverage Status (Covered/Not Covered/Requires Prior Auth/Unknown)
- Prior Auth Criteria with clinical reasoning
- Technical Details: Policy sections, clinical guidelines, evidence levels
- Specific Recommendation
- Data Sources (tools called)

**Example:**

```
CLINICAL ASSESSMENT
This patient meets criteria for SGLT2 inhibitor therapy despite eGFR 42. 
ADA Guidelines (2024) recommend SGLT2i for Type 2 diabetes with CKD stages 3a-4 
due to cardiorenal protective effects beyond glycemic control. eGFR 42 is stage 3b, 
within recommended range.

COVERAGE STATUS
Requires Prior Auth under most plans

PRIOR AUTH CRITERIA
✓ Diagnosis of Type 2 diabetes: MET (documented)
✓ Inadequate control on first-line agent: MET (on metformin 1g BID)
✓ eGFR ≥30: MET (eGFR 42)
✗ Prior GLP-1 failure documented: UNKNOWN (need documentation)

TECHNICAL DETAILS
- Policy Section: Section 5.2.3 - SGLT2 Inhibitor Coverage Criteria
- Clinical Guidelines: ADA Standards of Care 2024, Kidney Disease: Improving 
  Global Outcomes (KDIGO) 2022
- Evidence Level: Meta-analysis (renal protection) + RCT (cardiovascular benefit)

RECOMMENDATION
Submit prior auth with GLP-1 failure documentation to expedite approval
(typical approval: 2-3 business days with complete documentation)

DATA SOURCES
- PolicyPilot: get_drug_coverage, get_prior_auth_criteria
- Clinical: ADA 2024 Standards, KDIGO 2022 Diabetes Management in CKD
```

#### When Blended Agent Detects PATIENT Persona

**Response includes:**
- Patient-Friendly Summary (simple language, 8th grade level)
- What Happens Next (specific, numbered steps)
- Timeline (exact days, not "soon")
- Questions Addressed (cost, timeline, alternatives, side effects)
- Contact Information (who to call with questions)
- Sources (where information came from)

**Example:**

```
WHAT THIS MEANS
Your insurance wants to make sure this inhaler is the right medicine for you 
before they pay for it. This is normal and doesn't mean they're saying "no" 
- they just need more information first.

WHAT HAPPENS NEXT
1. Your doctor will send your medical information to the insurance company
2. The insurance company reviews it (takes 2-3 business days usually)
3. You'll get a phone call with their decision
4. If approved, you can pick up your inhaler right away

TIMELINE
- Insurance review: 2-3 business days
- Decision: Same day as review completion
- You'll know by: End of this week (if submitted today)

WILL THIS COST MORE?
Not if it's approved - your copay stays the same. If denied, your doctor 
can help you with other options that might be covered.

WHAT IF I NEED IT BEFORE THEN?
Call your insurance at [NUMBER] and ask about emergency coverage while 
approval is pending. Your doctor can also call if it's urgent.

QUESTIONS? CONTACT
- Your doctor's office: They started the approval process
- Insurance customer service: [NUMBER]
- Your pharmacy: They can check approval status
```

#### When Blended Agent Detects PRIOR AUTH REVIEWER Persona

**Response includes:**
- Coverage Decision (Approved/Denied/Conditional/Requires Additional Review)
- Criteria Evaluation (each criterion with status and evidence)
- Missing Documentation (exact items, why needed, who provides)
- Approval Likelihood (High/Medium/Low)
- Next Steps (action items)
- Policy References (with section numbers)
- Tools Called (which MCP tools provided data)

**Example:**

```
COVERAGE DECISION
Conditional - Approval likely pending prior GLP-1 failure documentation

CRITERIA EVALUATION
┌─ Diagnosis: Type 2 Diabetes Mellitus
│  Status: MET
│  Evidence: ICD-10 code E11.9 documented in records, HbA1c 8.2%
│
├─ Inadequate Control on First-Line Agent
│  Status: MET
│  Evidence: Currently on metformin 1000mg BID, 6 months therapy documented
│
├─ eGFR ≥30 mL/min/1.73m²
│  Status: MET
│  Evidence: Most recent eGFR 42 (Stage 3b CKD)
│
└─ Prior GLP-1 Failure or Intolerance
│  Status: NOT MET
│  Evidence: No documentation found
│  Policy Requires: Evidence of GLP-1 attempt OR documented contraindication
│  Impact: Conditional approval - can proceed if documentation provided

MISSING DOCUMENTATION
┌─ Prior GLP-1 Therapy Attempt
│  Why Needed: Policy 5.2.3(b) requires documented GLP-1 failure before SGLT2i
│  Who Provides: Prescribing physician (letter or prior med list)
│  Expected Time: 1-2 business days
│  Impact on Approval: HIGH - required for full approval
│
└─ Renal Function Confirmation
│  Why Needed: Verify eGFR ≥30; last value is 4 months old
│  Who Provides: Lab (serum creatinine) or ordering physician
│  Expected Time: 1 business day
│  Impact on Approval: MEDIUM - confirmatory only

APPROVAL LIKELIHOOD
- With all documentation: HIGH (90%+)
- Current state (missing GLP-1): CONDITIONAL (pending submission)
- Without GLP-1 documentation: MEDIUM (requires supervisor review)

NEXT STEPS
1. [DAY 1] Request GLP-1 history from prescriber (template email available)
2. [DAY 2] Request recent labs (ask for 2024 labs if patient has done labs recently)
3. [DAY 3] Resubmit authorization with additional documentation
4. [DAY 4-5] Standard review timeline with complete package
5. [CONTINGENCY] If documentation unavailable: Request supervisor review for waiver

POLICY REFERENCES
- Primary: Policy Section 5.2.3 - SGLT2 Inhibitor Coverage Requirements
  - Subsection (b): Prior GLP-1 Attempt Required
  - Exception: Documented GLP-1 contraindication
- Secondary: Section 2.1 - Renal Function Documentation Requirements
- Appeal Process: Section 12 - Authorization Appeal Procedures

TOOLS CALLED
- get_prior_auth_criteria: Confirmed SGLT2i criteria
- evaluate_patient_against_policy: Evaluated against 5 criteria
- get_case_summary: Identified documentation gaps
- search_policy_rules: Located waiver procedures
```

## Common Usage Patterns

### Pattern 1: Doctor → Patient Communication

**Doctor asks:** "Is this clinically appropriate for my patient?"
*Blended Agent responds in DOCTOR format*

**Then Doctor asks:** "Can you help me explain this to my patient?"
*Blended Agent can switch to PATIENT format for the same answer*

### Pattern 2: Insurance Review Workflow

**Reviewer asks:** "What's needed for approval?"
*Blended Agent responds in PRIOR AUTH format with missing docs*

**Patient follows up:** "What do I need to do?"
*Blended Agent switches to PATIENT format with instructions*

### Pattern 3: Multi-turn Conversation

**Turn 1 - Patient:** "My inhaler isn't covered"
*Blended Agent responds in PATIENT format (simple explanation)*

**Turn 2 - Same User (adding detail):** "My doctor says this is off-label. Is there clinical evidence for it?"
*Blended Agent detects shift toward clinical, provides DOCTOR format with evidence*

## Matching Your Audience

### Use It Like a Doctor If You:
- Speak medical terminology
- Reference clinical guidelines
- Ask about clinical appropriateness
- Need technical depth and evidence levels
- Want policy section numbers

### Use It Like a Patient If You:
- Use simple language
- Ask "What happens next?"
- Have personal health questions
- Need timelines and next steps
- Want explanations without jargon

### Use It Like a Prior Auth Reviewer If You:
- Reference policies and criteria
- Ask about documentation requirements
- Focus on "Is this approved?"
- Need approval likelihood assessment
- Want policy section citations

## Tips for Better Responses

1. **Be Yourself** - The agent detects your persona from natural language. Don't force jargon if you're a patient.

2. **Include Context** - More details help persona detection:
   - Patient context: "My insurance said...", "My doctor said..."
   - Doctor context: Clinical values (eGFR, HbA1c), diagnosis codes
   - Reviewer context: Policy numbers, documentation lists

3. **Ask Multi-part Questions** - The agent maintains conversation history:
   ```
   Q1: "Is this covered?"
   Q2: "How would you explain this to a patient?"
   Q3: "What docs do we need?"
   → Agent adapts persona for each question
   ```

4. **Reference Previous Answers** - Build on agent's findings:
   ```
   Agent: "Approval likely if GLP-1 documented"
   You: "How do I get that documentation?"
   → Agent provides specific next steps
   ```

## When Persona Detection Might Fail

**Scenario**: You use simple language but ask technical questions
```
User: "Can you explain what eGFR is and should I take SGLT2i?"
→ Agent might default to PATIENT format
→ Ask more directly: "I'm a doctor - is SGLT2i appropriate for eGFR 42?"
```

**Fix**: Be explicit if the auto-detection seems wrong. You can clarify:
- "I'm asking as a doctor..."
- "I'm a patient and I need simple explanation..."
- "I'm reviewing this for insurance..."

## Response Validation

Always check that:
- ✓ Format matches your persona/audience
- ✓ Technical depth feels appropriate
- ✓ All claims have citations (sources listed)
- ✓ Timelines are specific (not vague)
- ✓ Next steps are actionable
- ✓ Missing information is clearly identified

## Getting Help

If the agent:
- **Uses wrong format**: Describe your role ("I'm a patient...")
- **Lacks citations**: Ask "What's the source for this?"
- **Unclear next steps**: Ask "What specifically should I do?"
- **Wrong persona detected**: Be more specific ("As a physician...")
