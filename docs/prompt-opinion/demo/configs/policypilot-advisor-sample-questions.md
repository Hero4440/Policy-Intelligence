# PolicyPilot Advisor - Sample Questions by Persona

## About Available Data

**Sample Patients Available:**
- Marcus Chen (45M): Crohn's disease, considering Humira (adalimumab)
- Sarah Martinez (61F): Rheumatoid Arthritis, considering Remicade (infliximab)
- Jennifer Kim (47F): HER2+ metastatic breast cancer, considering Herceptin (trastuzumab)
- David Thompson & Robert Anderson (additional demo patients)

**Sample Policies Loaded:**
- Aetna Adalimumab (RA) - with step therapy requirements
- Cigna Herceptin (Breast Cancer) - covered with PA
- Blue Shield NC Adalimumab (RA)
- Multiple payer policies for biologics and cancer medications

---

## Doctor/Physician Questions

### Clinical Assessment & Appropriateness

**For Marcus Chen (Crohn's Disease → Humira):**
- "Patient: Marcus Chen, 45M, DOB 09/12/1980. Diagnosis: Moderate-to-severe refractory Crohn's disease. Current treatment: [Previous TNF inhibitor details if applicable]. Proposed: Adalimumab (Humira) SC injection. Insurance: Pennsylvania Medical Assistance. Is adalimumab clinically appropriate for this patient compared to infliximab?"
- "Marcus Chen: 45-year-old male with refractory Crohn's disease on Pennsylvania Medical Assistance. What's the clinical evidence for TNF inhibitor choice (adalimumab vs infliximab) for this patient? Any contraindications to SC vs IV administration?"
- "Patient Marcus Chen (45M, Crohn's disease) - what baseline labs and monitoring are required before starting Humira (adalimumab)? What should I monitor during therapy?"
- "Marcus Chen, 45M with moderate-to-severe Crohn's disease, previously tried [specify if any prior biologics]. Is adalimumab appropriate, or should I try a different TNF inhibitor class?"

**For Sarah Martinez (RA → Remicade/Infliximab):**
- "Patient: Sarah Martinez, 61F, DOB 03/22/1965. Diagnosis: Rheumatoid Arthritis (moderate-to-severe). Current: Methotrexate dosage and duration [specify]. Insurance: Cigna Commercial. Proposed: Infliximab (Remicade) IV infusion. Does this patient meet clinical criteria for TNF inhibitor therapy?"
- "Sarah Martinez: 61-year-old female, moderately-to-severely active RA (provide DAS28 or SJC/TJC scores if available), on methotrexate [specify dose and duration]. Insurance: Cigna. Is infliximab (IV) clinically more appropriate than adalimumab (SC) for this patient's profile?"
- "Patient Sarah Martinez (61F, Cigna insurance, RA on MTX). What are the clinical monitoring requirements for infliximab? Any TB screening or other baseline workup needed before starting Remicade?"
- "Sarah Martinez, 61F with moderate-to-severe RA on MTX 15mg/week × [duration]. Insurance: Cigna Commercial. Does she meet criteria to start TNF inhibitor, or should we try other DMARD combinations first?"

**For Jennifer Kim (Breast Cancer → Herceptin):**
- "Patient: Jennifer Kim, 47F, DOB 11/08/1978. Diagnosis: HER2-positive metastatic breast cancer (HER2 3+ by IHC or FISH positive). Stage: [specify if known]. Prior chemotherapy: [specify agents and response]. Insurance: Aetna Commercial. Proposed: Trastuzumab (Herceptin) + [specify chemotherapy regimen]. Is Herceptin standard of care for this indication?"
- "Jennifer Kim: 47-year-old female, metastatic HER2-positive breast cancer (confirm HER2 testing method and results). Currently on [specify prior treatments]. Insurance: Aetna. What's the clinical evidence for Herceptin combination therapy? Any cardiac monitoring needed?"
- "Patient Jennifer Kim (47F, HER2+ metastatic BC, Aetna insurance). What baseline cardiac assessment (LVEF, ECG) is required before starting Herceptin? What monitoring intervals during treatment?"
- "Jennifer Kim, 47F with HER2-positive metastatic BC, ECOG performance status [specify]. Insurance: Aetna Commercial. Is Herceptin monotherapy appropriate or must it be combined with chemotherapy?"

### Prior Authorization & Coverage Questions

**For Humira (Adalimumab):**
- "What are the Aetna prior auth criteria for adalimumab in RA?"
- "Does my patient meet Aetna's step therapy requirement for methotrexate trial?"
- "My patient was only on methotrexate for 6 weeks before inadequate response. Will that count as adequate trial for PA approval?"
- "Does the patient need to be prescribed by a rheumatologist for Aetna to approve adalimumab?"
- "What's the typical approval timeline for Aetna adalimumab prior auth?"

**For Herceptin (Trastuzumab):**
- "What are Cigna's coverage requirements for Herceptin in metastatic breast cancer?"
- "Is prior auth required for Herceptin under Cigna coverage?"
- "Does my patient with metastatic HER2-positive BC automatically qualify for Herceptin?"

### Drug Coverage & Formulary

**Adalimumab Products:**
- "Is Humira (original brand) on Aetna formulary?"
- "Are adalimumab biosimilars (Hyrimoz, Amjevita) covered? What tier?"
- "Are there coverage differences between adalimumab products under Aetna?"
- "Is Amjevita preferred or non-preferred for this patient?"

**Comparative Questions:**
- "How does coverage compare: Humira vs Hyrimoz vs Amjevita under different plans?"
- "What alternatives to Herceptin might be covered if there's an issue?"

### Policy Language & Criteria Questions

**Aetna Adalimumab for RA:**
- "The Aetna policy says 'moderately to severely active RA.' How is that defined?"
- "What's the Aetna definition of 'inadequate response' to methotrexate?"
- "Does the 3-month methotrexate trial need to be at 15mg or higher?"
- "If a patient was on methotrexate 10mg/week for 3 months, does that meet Aetna criteria?"
- "Who can prescribe? Does it need to be a rheumatologist?"

**Cigna Herceptin:**
- "What does 'covered-with-pa' mean for Herceptin under Cigna?"
- "What prior auth criteria does Cigna require for Herceptin?"

### Multi-turn Doctor Conversation

```
Q1: "Is adalimumab clinically appropriate for my RA patient?"
    → Agent responds: DOCTOR format with clinical assessment

Q2: "Can you help me explain this to my patient in simple terms?"
    → Agent switches to: PATIENT format for same answer

Q3: "What's needed for Aetna to approve this?"
    → Agent switches to: PRIOR AUTH format showing Aetna requirements
    
Q4: "My patient was only on MTX for 6 weeks. Will that cause a denial?"
    → Agent provides specific Aetna policy language and advice
```

---

## Patient/Patient Advocate Questions

### Understanding Coverage Decisions

**For Marcus Chen (Crohn's → Humira):**
- "My doctor wants to start me on Humira but said I might need approval first. What does that mean?"
- "Will my insurance cover Humira, or is this expensive?"
- "Why does my insurance need to approve my doctor's choice of medicine?"

**For Sarah Martinez (RA → Remicade):**
- "My insurance said I need to try a different medicine first before Remicade. Why?"
- "I was told I need to have 'inadequate response' to my current medicine. What does that mean?"
- "Will my rheumatologist's office handle the approval, or do I need to do something?"

**For Jennifer Kim (Breast Cancer → Herceptin):**
- "My oncologist said I need Herceptin for my cancer. Will my insurance cover it?"
- "Is Herceptin covered automatically since my cancer is HER2-positive?"

### Cost & Timeline Questions

**General Biologics:**
- "How long does approval take for biologics like Humira or Remicade?"
- "Will I have to pay out-of-pocket while we wait for approval?"
- "How much will Humira cost with my insurance?"
- "If my insurance doesn't cover the brand, can my doctor prescribe a similar cheaper option?"

**For Specific Situations:**
- "My doctor wants to start me on Humira but said there might be a cheaper option. What's the difference between Humira and Hyrimoz?"
- "If my insurance denies Herceptin, what's the next step?"

### Next Steps & Action Items

**General:**
- "What do I need to do to get my medicine approved?"
- "Who should I call - my doctor's office or the insurance company?"
- "What happens after my doctor submits the approval request?"
- "How will I know when insurance approves it?"
- "Can I start the medicine while approval is pending?"

**Specific to Processes:**
- "My insurance says I need to take methotrexate first. Do I have to do that?"
- "How long do I need to be on methotrexate before I can try Humira?"

### Concern-Based Questions

**Clinical Concerns:**
- "My medicine got denied. Does that mean it's not safe for me?"
- "Why does insurance get to decide what medicine my doctor prescribes?"
- "If I have to take a different medicine, will it work as well?"
- "I'm worried about side effects with this biologic. What should I watch for?"

**Cost Concerns:**
- "I can't afford Humira even with insurance. What are my options?"
- "Is there a patient assistance program to help with costs?"
- "What if my copay is too high?"

### Personal Health Questions

**Before Starting Medication:**
- "What should I expect when I start on Humira?"
- "How long before I feel better?"
- "Do I give myself the injection or does the doctor?"
- "How often do I take Humira - daily, weekly, monthly?"
- "Will I need blood tests on Humira?"

**During Treatment:**
- "What are common side effects I should watch for?"
- "I'm experiencing [symptom]. Is that normal? Should I call my doctor?"
- "How will my doctor know if this medicine is working?"

### Multi-turn Patient Conversation

```
Q1: "My doctor wants to start Humira but needs approval. What does that mean?"
    → Agent responds: PATIENT format with simple explanation

Q2: "Will it cost me more? How long for approval?"
    → Agent responds: Specific timeline and cost information

Q3: "Can I start the shot before approval comes through?"
    → Agent responds: Possible options, next steps

Q4: "The approval was denied. What do I do?"
    → Agent provides patient-friendly appeal process
```

---

## Prior Auth Reviewer / Insurance Staff Questions

### Coverage Decision Analysis

**For Adalimumab (Aetna):**
- "Prior auth: Marcus Chen, 45M (DOB 09/12/1980), Crohn's disease (moderate-to-severe refractory). Requested: Humira (adalimumab) SC. Insurance: Pennsylvania Medical Assistance. Does this meet Aetna's coverage criteria for adalimumab? Approval likelihood?"
- "Prior auth request: Sarah Martinez, 61F (DOB 03/22/1965), RA diagnosis, on MTX 10mg/week × 12 weeks with inadequate response. Requested: Humira. Insurance: Aetna Commercial. Does patient meet Aetna's step therapy requirement (MTX 15mg/week × 3 months)? Approval likelihood?"
- "Adalimumab auth: Patient Sarah Martinez, Aetna insurance, RA (moderate-to-severe, DAS28 5.2, TJC 8, SJC 6), MTX 15mg/week × 4 months documented. Does patient meet ALL Aetna criteria? Expected approval timeline?"
- "Humira request: Patient info shows RA diagnosis, MTX therapy, but no specific dose or duration listed. Insurance: Aetna. What exact MTX documentation do I need to approve? Can I request more info before deciding?"

**For Herceptin (Aetna):**
- "Prior auth: Jennifer Kim, 47F (DOB 11/08/1978), HER2-positive (3+ by IHC) metastatic breast cancer (stage IV). Proposed: Trastuzumab (Herceptin) IV + paclitaxel. Insurance: Aetna Commercial. Is prior auth required? What's approval likelihood? What documentation is needed?"
- "Herceptin authorization: Jennifer Kim, 47F, Aetna insurance, HER2+ metastatic BC (LVEF 55%, ECOG 1, no prior trastuzumab). Is this an automatic approval indication, or does Aetna require specific prior therapy/staging documentation?"
- "Prior auth for trastuzumab: Patient Jennifer Kim, Aetna, HER2-positive metastatic BC confirmed (pathology report attached). Proposed: Herceptin monotherapy. Insurance requires prior auth or covered automatically?"

**For Infliximab:**
- "Prior auth: Sarah Martinez, 61F, Cigna Commercial insurance. Diagnosis: RA (moderate-to-severe, DAS28 5.2), on MTX 15mg/week × 3 months with documented inadequate response (TJC 8, SJC 6). Requested: Infliximab (Remicade) IV. Does patient meet step therapy requirement? What's Cigna approval likelihood for infliximab?"
- "Infliximab coverage: Patient on Cigna insurance with RA. Already tried adalimumab for 2 months with no response. Now requesting infliximab. Does Cigna allow switch between TNF inhibitors? What documentation needed?"

### Documentation & Missing Information

**For Adalimumab:**
- "Prior auth for Sarah Martinez (61F, Aetna, RA): Request says 'MTX × 3 months' but no dose specified. Does Aetna require specific dose documentation (must be 15mg/week)? Can I ask for clarification before deciding?"
- "Adalimumab auth - Sarah Martinez, Aetna: Submitted by PCP (not rheumatologist). Does Aetna require rheumatologist signature/involvement? If not submitted by rheumatologist, can I still approve?"
- "Humira request - Patient Sarah Martinez, Aetna insurance, RA: Documentation shows 'inadequate response to MTX' but no specific evidence (labs, joint counts, etc.). What level of documentation does Aetna require to verify inadequate response?"
- "Prior auth for Marcus Chen (45M, Pennsylvania MA, Crohn's): Requesting Humira. Current documentation only has diagnosis, no prior treatment history. Do I need prior TNF inhibitor trials documented, or is patient naive to biologics acceptable?"

**For Herceptin:**
- "Prior auth - Jennifer Kim (47F, Aetna, HER2+ metastatic BC): Submitted with oncologist statement of HER2+. Is pathology report with specific testing method (IHC vs FISH) required by Aetna, or is oncologist's note sufficient?"
- "Herceptin authorization: Jennifer Kim, Aetna insurance. Documentation includes tumor staging (stage IV) but no ECOG performance status or LVEF baseline. Does Aetna require these before approving Herceptin? Can I request?"
- "Trastuzumab prior auth - Jennifer Kim (47F, Aetna): Request submitted without cardiac baseline (LVEF, ECG). Does Aetna require baseline cardiac assessment documentation before approval?"

### Criteria Evaluation - Detailed

**Aetna Adalimumab for RA - Sarah Martinez (61F):**
```
Patient: Sarah Martinez, 61F, DOB 03/22/1965, Cigna insurance [VERIFY PLAN]
Requested Drug: Adalimumab (Humira) SC
Current Treatment: MTX 15mg/week × 4 months
Clinical Labs: DAS28 5.2, TJC 8, SJC 6 (documented)
Provider: Rheumatologist

Criteria Checklist:
- RA Diagnosis (ICD-10: M05.8) → MET (documented)
- Moderately-to-severely active (DAS28 5.2) → MET (labs provided)
- MTX trial: 3 months at 15mg/week+ → MET (15mg/week × 4 months documented)
- Inadequate response documented (DAS28 5.2, joints) → MET (labs show inadequate control)
- Rheumatologist prescribed/consulted → MET (submitted by rheumatology)
```

**Questions with Full Context:**
- "Sarah Martinez, 61F, Aetna/Cigna: DAS28 5.2, TJC 8, SJC 6 are documented. Does Aetna use DAS28 threshold or specific joint count to verify 'moderately-to-severely active'?"
- "Sarah Martinez prior auth: Request from rheumatologist's office. Does Aetna require the rheumatologist's signature, or can nursing staff submit if MD approves? Can PCP submit, or rheumatologist only?"
- "Sarah Martinez, 61F, Aetna, RA (DAS28 5.2): Patient age 61. Does Aetna have different step therapy requirements for patients over 60?"
- "Sarah Martinez: MTX dosage is 15mg/week. Does Aetna accept PO methotrexate, or must it be parenteral? If patient was on oral, is that different?"

### Policy Interpretation Questions

**On Step Therapy:**
- "Sarah Martinez, 61F, Aetna, RA: MTX trial was only 2.8 months at 15mg/week (policy requires 3 months). Is 2.8 months close enough, or do we strictly require full 3 months? Any medical necessity waiver available?"
- "Sarah Martinez: 'Inadequate response to MTX' - does Aetna define this by specific DAS28 threshold (like >5.0), or by physician clinical judgment? What documentation verifies adequately?"
- "Sarah Martinez, age 61: Does Aetna policy specify different step therapy for patients ≥60 years vs younger? Any age-based exceptions to MTX trial requirement?"

**On Alternatives:**
- "Sarah Martinez denied adalimumab: If Humira is denied, is switch to Hyrimoz (adalimumab-adaz) or Amjevita (adalimumab-atto) automatic, or does patient need new prior auth? Do biosimilars require new PA?"
- "Prior auth request for Humira (Sarah Martinez, Aetna): Can Aetna require patient try a DIFFERENT TNF inhibitor first (like infliximab), or must we approve requested agent if criteria met?"
- "Patient Sarah Martinez allergic to Humira: What's Aetna's protocol? Can we approve Hyrimoz or another TNF inhibitor automatically as alternative?"

**On Coverage Status:**
- "Cigna coverage for Herceptin (Jennifer Kim): Policy says 'covered-with-pa.' What specifically triggers the PA requirement? Is it all trastuzumab, or only certain indications?"
- "Jennifer Kim, Aetna, HER2+ metastatic BC: If HER2+ status (3+ by IHC) is documented, can we pre-approve Herceptin, or must we go through full PA review?"
- "Cigna Herceptin coverage: Is the PA requirement for clinical review, or just documentation verification? What triggers approval vs denial?"

### Approval Strategy Questions

**For Borderline Cases:**
- "Sarah Martinez, 61F, Aetna, RA (DAS28 5.2): MTX trial was 2.8 months at 15mg/week (policy requires exactly 3 months). Should I approve anyway, request extension, or deny? What does Aetna's waiver procedure allow?"
- "Sarah Martinez: RA is clearly severe (DAS28 5.2, multiple swollen joints), but MTX documentation is sparse (no baseline labs, unclear if methotrexate was truly 'inadequate'). Can I approve based on clinical severity alone, or must I require better MTX documentation?"
- "Sarah Martinez prior auth: Can I approve with condition: 'Continue MTX during Humira therapy' to ensure step therapy compliance? Is conditional approval standard?"

**For Appeals:**
- "Sarah Martinez appeals Aetna denial of adalimumab (denied for incomplete MTX trial - only 2.5 months). What grounds allow reversal? Is 'severe active RA' sufficient for medical necessity override?"
- "Marcus Chen (Crohn's disease) appeals adalimumab denial from Pennsylvania Medical Assistance (policy is for RA only). Can we approve off-label indication? What's the medical necessity exception process?"
- "Jennifer Kim (Aetna) appeals Herceptin denial: If denied for incomplete HER2 documentation, what additional evidence overturns the denial? Just pathology report, or other criteria?"

### Multi-turn Reviewer Conversation

```
Q1: "What's the approval likelihood for this Humira prior auth?"
    → Agent responds: PRIOR AUTH format with coverage decision

Q2: "What documentation are we missing?"
    → Agent responds: Specific missing items and why needed

Q3: "The MTX was only 2.5 months at 10mg. Will that be an issue?"
    → Agent provides Aetna policy language and guidance

Q4: "Patient appeals the denial. What's our waiver procedure?"
    → Agent explains appeal process and options
```

---

## Cross-Persona Scenario Questions

### Scenario 1: Marcus Chen (Crohn's Disease → Humira)

```
MARCUS (Patient): "My doctor wants to start Humira but said I might need approval first."
→ Agent (PATIENT format): Simple explanation of prior auth, timeline, next steps

MARCUS'S DOCTOR: "Is adalimumab appropriate for moderate-to-severe Crohn's?"
→ Agent (DOCTOR format): Clinical evidence, TNF inhibitor rationale, monitoring needs

INSURANCE REVIEWER: "Marcus Chen prior auth for Humira - approval likelihood?"
→ Agent (PRIOR AUTH format): Check if diagnosis matches policy (Aetna has RA policy, not Crohn's)
  - Flags: Aetna adalimumab policy is for RA only, may need off-label review
  - Action: Check if patient's insurance actually covers for Crohn's disease indication
```

### Scenario 2: Sarah Martinez (RA → Remicade Appeal)

```
SARAH (Patient): "Insurance denied Remicade. They said I need to try another medicine first."
→ Agent (PATIENT format): Explain step therapy requirement, what medicine they want, timeline for appeal

SARAH'S RHEUMATOLOGIST: "Why would insurance require step therapy when patient has severe RA?"
→ Agent (DOCTOR format): Check which payer's policy and criteria, explain step therapy rationale

INSURANCE REVIEWER: "Sarah Martinez appeals infliximab denial. Do we have waiver procedures?"
→ Agent (PRIOR AUTH format): Check specific payer policy for exception procedures, medical necessity process
```

### Scenario 3: Jennifer Kim (Breast Cancer → Herceptin Approval)

```
JENNIFER (Patient): "My oncologist said I need Herceptin. Will my insurance cover it?"
→ Agent (PATIENT format): Explain coverage for metastatic HER2+ BC, approval process, timeline

JENNIFER'S ONCOLOGIST: "Confirm Herceptin is standard of care for HER2+ metastatic breast cancer"
→ Agent (DOCTOR format): Clinical evidence, standard treatment protocols, monitoring requirements

INSURANCE REVIEWER: "Prior auth for trastuzumab in HER2+ metastatic BC - approval automatic?"
→ Agent (PRIOR AUTH format): Cigna Herceptin policy shows covered-with-pa
  - Documentation needed: HER2+ pathology verification, metastatic disease confirmation
  - Approval likelihood: HIGH with proper documentation
```

### Scenario 4: Comparing Options (Adalimumab Products)

```
PATIENT: "My insurance won't cover Humira. What's the difference with Hyrimoz?"
→ Agent (PATIENT format): Simple explanation of brand vs biosimilar, similar effectiveness, cost difference

DOCTOR: "Which adalimumab product has best coverage across plans?"
→ Agent (DOCTOR format): Check formulary preferences: Humira preferred, Hyrimoz preferred, Amjevita non-preferred

INSURANCE REVIEWER: "Should we require adalimumab-adaz (Amjevita) first to save costs?"
→ Agent (PRIOR AUTH format): Review formulary tier strategy, step therapy options, clinical equivalence
```

---

## Question Tips for Best Results

### For Doctors
✓ **CRITICAL: Include complete patient context:**
  - **Patient name & DOB:** "Sarah Martinez, 61F, DOB 03/22/1965"
  - **Diagnosis with ICD-10:** "Rheumatoid Arthritis (M05.8) moderate-to-severe"
  - **Current medications & exact duration:** "MTX 15mg/week × 4 months (started Jan 2026)"
  - **Clinical indicators with numbers:** "DAS28 5.2, TJC 8, SJC 6, CRP elevated"
  - **Insurance (payer & plan):** "Aetna Commercial" or "Cigna" - not "blue plan"
  - **Provider type:** "Prescribed by rheumatologist" or "PCP"
  - **Requested drug (brand & generic):** "Humira (adalimumab) SC injection 40mg"

✓ **Ask policy-specific questions with patient details:**
  - "Sarah Martinez, 61F, Aetna, MTX 15mg/week × 4 months, DAS28 5.2: Does this meet Aetna's step therapy requirement?"
  - "Patient on MTX 10mg/week (not 15mg) - does Aetna accept this, or must it be ≥15mg?"
  - "Prescribed by PCP (not rheumatologist) - does Aetna require rheumatologist involvement?"

✓ **Reference actual policy language with patient match:**
  - "The policy says 'moderately-to-severely active' - patient's DAS28 is 5.2. Is that sufficient?"

❌ **Avoid:**
  - Generic questions: "Does Aetna cover adalimumab?" (for which patient? which indication?)
  - Missing insurance plan: "Does insurance cover this?" (which payer?)
  - Vague clinical details: "Patient has RA and is on methotrexate" (what dose? how long? response?)

### For Patients
✓ **Describe your situation with ALL relevant details:**
  - **Your name & age:** "I'm Sarah, 61 years old"
  - **Your diagnosis:** "I have rheumatoid arthritis"
  - **Current treatment:** "My doctor has me on a pill called methotrexate"
  - **How long you've been on it:** "I've been on it for about 4 months"
  - **Your insurance company:** "My insurance is Aetna" or "Blue Shield" - be specific
  - **The new medicine:** "My doctor wants to start Humira shots"
  - **Why:** "It's not helping enough, my joints still hurt"

✓ **Ask about what matters to you WITH context:**
  - "I've been on methotrexate for 4 months - how long before I can try Humira?" (timeline from current state)
  - "Does Aetna cover Humira, or will my copay go up?" (with your insurance name)
  - "What do I need to do - call my doctor or insurance?" (specific next step for your situation)

✓ **Mention what doctor told you - be specific:**
  - "My rheumatologist said I need approval first"
  - "Insurance said I need to try another medicine"
  - "I was told my insurance requires a 3-month trial of methotrexate"

❌ **Avoid:**
  - Vague complaints: "My insurance won't cover my medicine" (which medicine? which insurance?)
  - Missing your details: "Will this get approved?" (approved by whom? for which patient?)
  - Generic timing: "How long will this take?" (how long for what specific step?)

### For Insurance/Reviewers
✓ **CRITICAL: Provide COMPLETE prior auth details:**
  - **Full patient info:** "Sarah Martinez, 61F, DOB 03/22/1965, Member ID: [if available]"
  - **Insurance details:** "Aetna Commercial Plan, Group #[if known]"
  - **Diagnosis with ICD-10:** "Rheumatoid Arthritis (M05.8) - moderately-to-severely active"
  - **Clinical data:** "DAS28 5.2, TJC 8, SJC 6, ESR 45, CRP 3.2"
  - **Current treatment:** "Methotrexate 15mg/week PO × 4 months (since Jan 2026) - inadequate response"
  - **Requested medication:** "Adalimumab (Humira) 40mg SC injection - prefilled syringe"
  - **Prescriber info:** "Rheumatologist Dr. [name] - submitted via [method]"
  - **Prior authorizations:** "Any previous biologic approvals/denials for this patient?"

✓ **Ask specific questions WITH all patient context:**
  - "Sarah Martinez, 61F, Aetna, RA (M05.8), MTX 15mg/week × 4 months, DAS28 5.2: Does patient meet Aetna's step therapy criteria for adalimumab?"
  - "Patient MTX was 10mg/week (not 15mg) × 3 months - does Aetna policy require ≥15mg specifically? Will this cause denial?"
  - "HER2+ breast cancer (3+ IHC) confirmed pathology - does Cigna auto-approve Herceptin, or must we review?"

✓ **Reference exact policy with patient evidence:**
  - "Aetna Policy Section 3.2 requires 'MTX 3 months at 15mg/week minimum' - patient has exactly 15mg/week × 4 months. Meets criteria?"
  - "Policy says 'moderately-to-severely active RA' - patient's DAS28 5.2 meets this threshold?"

❌ **Avoid:**
  - Missing patient demographics: "Prior auth for adalimumab" (for which patient?)
  - Vague clinical data: "Patient has RA and tried methotrexate" (what dose? how long? response?)
  - Missing insurance plan: "Does this meet criteria?" (which payer's criteria?)
  - Incomplete documentation references: "Patient documentation is attached" (what specific documents?)

---

## Question Patterns That Work Best

### Pattern 1: Full Patient Context + Specific Policy Question
```
✓ GOOD (includes all required info):
"Sarah Martinez, 61F, DOB 03/22/1965, Aetna Commercial insurance.
Diagnosis: RA (M05.8), moderately-to-severe (DAS28 5.2, TJC 8, SJC 6).
Current: MTX 15mg/week × 4 months (started Jan 2026) - inadequate response.
Requested: Adalimumab (Humira) 40mg SC, prescribed by rheumatologist.
Does patient meet Aetna's step therapy requirement? Approval likelihood?"
```
→ Agent responds with specific Aetna policy match, criteria met/not met, and approval likelihood

```
✗ POOR (missing context):
"45-year-old with RA on methotrexate. Does this meet step therapy?"
```
→ Agent can't give specific answer - missing patient name, insurance, clinical data, MTX dose/duration, etc.

### Pattern 2: Progressive Refinement with Context Persistence
```
Q1: "Marcus Chen, 45M, Pennsylvania MA insurance. Crohn's disease (moderate-to-severe, refractory).
     Requesting Humira (adalimumab). Does Marcus meet PA coverage criteria?"
     
Q2: "What if Marcus's Crohn's is documented as mild-moderate instead of moderate-to-severe?
     Would that change approval?"
     
Q3: "Can Marcus start Humira while we get approval, or must we wait?
     Pennsylvania MA coverage policy on interim access?"
```
→ Agent maintains full patient context and refines answer across turns without re-asking for details

### Pattern 3: Patient Role with Specific Context
```
✓ GOOD (specific patient details):
"I'm Sarah Martinez, 61 years old. I have rheumatoid arthritis and my doctor put me on 
methotrexate pills 4 months ago. It's not helping - my joints still hurt. Now my doctor 
wants to start Humira shots and said my insurance (Aetna) needs to approve it first. 
What does 'prior authorization' mean? How long will it take?"
```
→ Agent detects patient role and provides plain-language explanation with Sarah's specific timeline

```
✗ POOR (no specifics):
"I need help with my medicine approval. What is prior auth?"
```
→ Agent can explain generally but can't give personalized timeline/next steps

### Pattern 4: Policy Deep Dive with Patient Evidence
```
✓ GOOD (references actual patient data):
"Sarah Martinez, 61F, Aetna. RA diagnosis confirmed (ICD M05.8).
Labs submitted: DAS28 5.2, TJC 8, SJC 6, CRP 3.2.
MTX history: 15mg/week × 4 months documented.
Aetna policy says 'moderately-to-severely active RA' required.
Patient's DAS28 5.2 qualifies - does Aetna use DAS28 threshold, or specific lab values?
Is our lab evidence sufficient?"
```
→ Agent provides specific Aetna policy language interpretation with patient evidence mapping

```
✗ POOR (vague references):
"The policy mentions 'severe RA.' Is my patient severe enough?"
```
→ Agent can't evaluate without knowing actual clinical values

### Pattern 5: Multi-Stakeholder Question with Each Role's Context
```
✓ GOOD (includes role-specific details):

FOR PATIENT (Sarah):
"I'm on methotrexate for 4 months but it's not working. My rheumatologist 
wants to start Humira. My insurance is Aetna. Will approval take long? What do I do?"

FOR DOCTOR (Rheumatologist):
"Sarah Martinez, 61F, Aetna. RA (M05.8, DAS28 5.2). MTX 15mg/week × 4 months - 
inadequate response. Requesting Humira (adalimumab 40mg SC). Does patient meet 
Aetna step therapy criteria? Approval timeline?"

FOR INSURANCE (Reviewer):
"Prior Auth: Sarah Martinez, 61F (DOB 03/22/1965), Aetna Commercial. 
Diagnosis: RA (M05.8). Labs: DAS28 5.2, TJC 8, SJC 6, CRP 3.2. 
Current: MTX 15mg/week × 4 months. Requested: Humira 40mg SC (rheumatologist). 
Does meet Aetna criteria? Approval likelihood?"
```
→ Agent provides PATIENT format (simple), DOCTOR format (clinical), PRIOR AUTH format (policy) - all with Sarah's specific data

```
✗ POOR (generic for all):
"Is Humira covered? What's approval?"
```
→ Agent can't tailor response without knowing who's asking and what patient details are relevant

---

## Actual Policies Available for Reference

**Aetna Adalimumab (RA):**
- Diagnosis: ICD-10 M05.*, M06.* (moderately-to-severely active RA)
- Step Therapy: Methotrexate 15mg/week × 3 months minimum
- Failure Criteria: "Inadequate response" (defined in policy)
- Prescriber: Rheumatologist or in consultation with rheumatologist
- Products: Humira (preferred), Hyrimoz (preferred), Amjevita (non-preferred)

**Cigna Herceptin (Breast Cancer):**
- Coverage Status: Covered with Prior Auth
- Indication: HER2-positive breast cancer
- PA Required: Yes
- No explicit step therapy mentioned in current policy

**Blue Shield NC Adalimumab (RA):**
- Similar to Aetna but with Blue Shield specific requirements
- Check individual policy version for exact criteria
