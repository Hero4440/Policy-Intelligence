# Patient Prior Authorization Q&A Scenarios

This document contains 2 questions from each perspective (Doctor, Patient, Prior Authorization Reviewer) for all 4 demo patients, along with desired system outputs.

---

## Patient 1: Robert Anderson
**Condition:** Metastatic colorectal cancer  
**Proposed Treatment:** Avastin (bevacizumab) + FOLFOX chemotherapy  
**Insurance:** BCBS NC (Blue Cross Blue Shield North Carolina)

### Doctor Questions
1. **Treatment Sequencing & Biosimilar Alternatives:** Robert's insurance (BCBS NC) has a preferred injectable oncology program with potential biosimilar requirements. Are you aware if Mvasi or Zirabev biosimilars are equally effective alternatives to branded Avastin for his metastatic colorectal cancer presentation, and would you accept a biosimilar if required for coverage?

2. **Prior Treatment Documentation:** Beyond the FOLFOX regimen, has Robert received any prior bevacizumab or anti-VEGF therapies in his cancer treatment history? The prior auth team will need documentation of his full treatment timeline to justify moving to this combination therapy now.

### Patient Questions
1. **Cost & Out-of-Pocket Responsibility:** If my insurance approves Avastin, what will my out-of-pocket costs be? Will it be covered as a medical benefit or pharmacy benefit, and what's the difference in my copayment or coinsurance obligations?

2. **Treatment Duration & Monitoring:** How long will I need to receive the Avastin infusions, and what kind of monitoring or check-ups will I need to do while on this treatment? Are there specific side effects I should watch for?

### Prior Authorization Reviewer Questions
1. **Medical Necessity Justification:** Is there documented evidence in the clinical record that Robert has KRAS/RAS mutational status available? BCBS NC policy typically requires this information to establish medical necessity for first-line bevacizumab + chemotherapy in metastatic colorectal cancer.

**Desired Output:**
```
MEDICAL NECESSITY ASSESSMENT:
Status: DOCUMENTATION REQUIRED
Finding: KRAS/RAS mutational status not found in submitted clinical records

Policy Reference: BCBS NC Oncology Policy - Bevacizumab in mCRC
Requirement: Documented KRAS/RAS status mandatory for first-line bevacizumab approval

Action Items:
□ Request pathology report confirming KRAS/RAS mutation status
□ If wild-type RAS: approval supported for first-line bevacizumab + FOLFOX
□ If RAS mutant: consider EGFR-independent pathway alternatives

Timeline: Awaiting documentation (5 business days)
```

2. **Step Therapy Compliance:** Has the patient tried or failed lower-cost alternatives (such as bevacizumab biosimilars or other first-line chemotherapy regimens without bevacizumab)? If not, does the clinical presentation meet our step-therapy waiver criteria for immediate approval of branded Avastin?

**Desired Output:**
```
STEP-THERAPY ANALYSIS:
Status: STEP-THERAPY REQUIRED - Biosimilar first approach

Policy Reference: BCBS NC Preferred Injectable Oncology Program
Requirement: Biosimilar trial unless contraindicated

Options:
1. MVASI (bevacizumab biosimilar) - Preferred
   Cost: ~$2,000-2,500/cycle (vs. $3,500+ branded)
   Efficacy: Bioequivalent to Avastin in mCRC

2. ZIRABEV (bevacizumab biosimilar) - Preferred
   Cost: ~$2,000-2,500/cycle
   Efficacy: Bioequivalent to Avastin in mCRC

Recommendation: 
✓ APPROVE contingent on biosimilar trial (MVASI or ZIRABEV)
✓ Waive to branded Avastin if biosimilar intolerance documented
  (requires 2-3 cycle trial data)

Timeline: 3-week initial biosimilar trial period before branded escalation
```

---

## Patient 2: Sarah Martinez
**Condition:** Moderate-to-severe rheumatoid arthritis (DMARD-refractory)  
**Proposed Treatment:** Remicade (infliximab) IV infusion  
**Insurance:** Cigna Commercial

### Doctor Questions
1. **Prerequisite DMARD Trials & Duration:** Sarah has failed methotrexate and sulfasalazine. For Cigna's Remicade prior auth, they will require documentation of adequate dosing and duration on each DMARD. Can you provide detailed records showing she received therapeutic doses for at least 8-12 weeks on each agent before discontinuation?

**Desired Output:**
```
DMARD TRIAL DOCUMENTATION ASSESSMENT:
Status: PARTIAL - Additional records needed

Methotrexate Trial:
✓ Confirmed: 20mg weekly
✓ Confirmed: 12 weeks duration (Jan 2025 - Apr 2025)
✓ Reason for discontinuation: Hepatic transaminitis elevation
Finding: ADEQUATE trial documented

Sulfasalazine Trial:
✓ Confirmed: 3g daily
✗ Duration unclear: Records suggest ~6 weeks
⚠ Below Cigna minimum: 8-12 weeks required

Action Item: Request detailed dosing log and discontinuation reason for sulfasalazine
  Outcome: If inadequate trial → may require additional conventional DMARD before TNF-i approval
  Timeline: 3 business days for documentation review
```

2. **Combination Therapy Approach:** Cigna's policy often requires continuation of methotrexate during infliximab therapy to reduce immunogenicity. Is Sarah a candidate for combination therapy (Remicade + methotrexate), or do you anticipate switching her to monotherapy due to prior toxicity?

**Desired Output:**
```
COMBINATION THERAPY FEASIBILITY ASSESSMENT:
Status: CONTRAINDICATION IDENTIFIED - Monotherapy justified

Policy Requirement: Cigna prefers TNF-i + methotrexate combination
Contraindication: Prior hepatic toxicity on methotrexate (ALT 3x ULN)

Clinical Recommendation: Monotherapy (Infliximab alone)
Justification: ✓ Hepatotoxicity history documented
              ✓ Alternative DMARD (leflunomide) considered but not trialed
              
Alternative consideration: Leflunomide + Infliximab
  - Different mechanism (reduced immunogenicity without MTX)
  - Requires additional 8-12 week trial data

DECISION: 
✓ Approve Remicade monotherapy - combination contraindicated
✓ Requires hepatic monitoring (Q4-6 weeks) during TNF-i therapy
Note: Monotherapy approved due to documented toxicity exception
```

### Patient Questions
1. **Infusion Schedule & Time Commitment:** How often will I need to come in for my Remicade infusions, and how long does each infusion take? Will I need to arrange time off work regularly for this treatment?

**Desired Output:**
```
PATIENT-FACING INFUSION SCHEDULE:

Remicade (Infliximab) Treatment Plan:
• Induction Phase (0-8 weeks):
  Week 0: 3-hour IV infusion
  Week 2: 3-hour IV infusion
  Week 6: 3-hour IV infusion
  
• Maintenance Phase (ongoing):
  Every 8 weeks: 2-3 hour IV infusion at outpatient infusion center

Time Commitment:
□ Allow 3-4 hours for each appointment (intake + infusion + observation)
□ Plan for 6 infusions in first 6 months, then 1 infusion every 2 months
□ Approximately 6-8 appointments per year after induction

Work Accommodation Tips:
- Most patients schedule morning infusions
- Common to take day off work or work from infusion center
- Some employers offer accommodations for medical treatment time
- Discuss flexibility with HR about standing infusion day (e.g., every other Tuesday)

Side Effects Timeline:
- First infusion: Most common for reactions (flushing, headache)
- By 3rd infusion: Usually well-tolerated
- Ongoing: Monitor for fever, persistent cough, unusual bruising
```

2. **Side Effects vs. Current Disease Burden:** I'm currently managing with NSAIDs and low-dose prednisone. What are the main risks or side effects of Remicade, and how does that compare to what happens if my arthritis gets worse without it?

**Desired Output:**
```
REMICADE RISK-BENEFIT COMPARISON:

Current Situation (NSAIDs + low-dose prednisone):
Risks:
- Progressive joint damage (estimated 5-10% loss of function/year)
- Prednisone side effects with prolonged use: osteoporosis, infection risk
- Persistent pain, disability, loss of work productivity
- Increased cardiovascular risk from chronic inflammation

Remicade (Infliximab) Therapy:
Serious but Uncommon Risks (1-5%):
□ Serious infections (TB reactivation, fungal) - requires TB screening
□ Heart failure worsening (rare, ~1%)
□ Rare blood disorders
□ Injection site reactions

Common but Usually Mild (10-20%):
□ Upper respiratory infections
□ Headache
□ Nausea
□ Mild infusion reactions (redness, swelling at IV site)

Expected Benefit:
✓ 50-70% of patients achieve remission or low disease activity
✓ Halts joint damage progression
✓ Often allows REDUCTION or discontinuation of prednisone
✓ Return to normal activities in 60% of patients
✓ Average symptom improvement in 4-6 weeks

Comparative Risk Assessment:
Remicade Risk Index: Moderate (infection surveillance required)
Untreated RA Risk Index: HIGH (progressive disability, joint destruction)

Recommendation: Benefit-to-risk ratio FAVORS Remicade initiation
```

### Prior Authorization Reviewer Questions
1. **Disease Activity Documentation:** What is Sarah's current DAS28 score or other validated disease activity measure? Cigna requires objective documentation that she meets moderate-to-severe disease criteria before approving a TNF-inhibitor.

**Desired Output:**
```
DISEASE ACTIVITY VALIDATION:
Status: CRITERIA MET for TNF-inhibitor approval

Disease Activity Score (DAS28-CRP):
Current: 6.8/10
Severity Classification: High disease activity (>5.1 = moderate; >3.2 = active)

Objective Findings:
□ Swollen joints: 8/28 counted (shoulders, wrists, MCPs bilaterally)
□ Tender joints: 12/28 counted
□ CRP: 18 mg/L (normal <3)
□ ESR: 42 mm/hr (elevated)

Cigna Coverage Criteria: ✓ MET
Requirement: DAS28 >3.2 OR moderate-severe disease
Finding: DAS28 = 6.8 (HIGH disease activity)

DECISION: 
✓ APPROVED - Patient meets objective criteria for TNF-inhibitor
✓ Data supports TNF-inhibitor as medically necessary
```

2. **Biosimilar Step-Therapy:** Has the patient been offered or trialed an infliximab biosimilar (Inflectra or Renflexis) first? If not, can the rheumatologist justify medical necessity for branded Remicade, or must the PA be contingent on biosimilar failure?

**Desired Output:**
```
BIOSIMILAR STEP-THERAPY ANALYSIS:
Status: STEP-THERAPY REQUIRED - Biosimilar first recommended

Policy Reference: Cigna RA Management - Biologic Step Protocol
Standard Approach: Biosimilar step-therapy unless contraindicated

Biosimilar Options:

1. INFLECTRA (infliximab biosimilar)
   Cost: $2,200-2,500/infusion (vs. $3,500+ branded Remicade)
   Efficacy: Clinically equivalent to Remicade in RA
   Safety: Same efficacy/safety profile in head-to-head trials

2. RENFLEXIS (infliximab biosimilar)  
   Cost: $2,200-2,500/infusion
   Efficacy: Clinically equivalent to Remicade in RA
   Safety: Same efficacy/safety profile

Clinical Justification for Branded Remicade:
Current request: No documented contraindication to biosimilars noted
Prior biosimilar exposure: None documented

DECISION OPTIONS:
Option A (Recommended):
✓ APPROVE contingent on biosimilar trial (Inflectra or Renflexis)
  - 3-month initial trial period
  - If inadequate response: escalate to branded Remicade
  - Estimated savings: $3,900 per cycle

Option B (If biosimilar contraindicated):
□ Approve branded Remicade ONLY if documented:
  - Prior infliximab biosimilar intolerance (allergic reaction, loss of efficacy)
  - Or clinical justification from rheumatologist

Recommendation: Option A - Biosimilar trial first
Timeline: 12-week trial + reassessment
```

---

## Patient 3: Jennifer Kim
**Condition:** HER2-positive metastatic breast cancer  
**Proposed Treatment:** Herceptin (trastuzumab) + chemotherapy  
**Insurance:** Aetna Commercial

### Doctor Questions
1. **HER2 Status Confirmation & Testing Method:** Aetna's Herceptin policy requires definitive HER2 positivity documentation. Was Jennifer's HER2 status confirmed by fluorescence in situ hybridization (FISH), immunohistochemistry (IHC 3+), or both? Do you have the pathology report available for the prior auth submission?

**Desired Output:**
```
HER2 STATUS CONFIRMATION:
Status: DOCUMENTED - Approval supported

Pathology Report Review:
✓ Immunohistochemistry (IHC): 3+ positive
✓ FISH confirmation: HER2/CEP17 ratio 2.8 (positive ≥2.0)
✓ Lab: Mayo Clinical Laboratories
✓ Date: 2026-04-15
✓ Specimen: Metastatic liver biopsy

Finding: DEFINITIVE HER2-positive disease confirmed
Aetna Policy Requirement: IHC 3+ OR FISH positive ✓ MET

Clinical Significance:
- Confirms trastuzumab (Herceptin) indicated
- Confirms trastuzumab sensitivity expected
- Gene amplification ratio 2.8 = high HER2 expression

DECISION:
✓ APPROVED - HER2 status confirmed, trastuzumab medically necessary
```

2. **Cardiac Function Baseline:** Trastuzumab carries a risk of cardiotoxicity. Has Jennifer undergone baseline cardiac assessment (echocardiogram or MUGA scan), and if so, what is her left ventricular ejection fraction (LVEF)? Aetna will require this before approving therapy.

**Desired Output:**
```
CARDIAC SAFETY CLEARANCE:
Status: CLEARED for trastuzumab therapy

Baseline Cardiac Assessment:
✓ Test: Echocardiogram (TTE)
✓ Date: 2026-04-22
✓ LVEF: 58% (normal ≥50%)
✓ Wall motion: Normal
✓ Valvular function: Normal
✓ Pericardial effusion: None

Aetna Cardiotoxicity Policy:
Requirement: LVEF ≥50% for trastuzumab approval
Finding: LVEF 58% ✓ EXCEEDS minimum threshold

Monitoring Plan Required During Therapy:
□ Repeat echocardiogram at 3 months
□ Then Q6 months during trastuzumab (2+ years)
□ LVEF decline ≥10% = therapy reassessment

Risk Stratification:
Jennifer's baseline LVEF 58% = LOW-RISK for cardiotoxicity
Expected LVEF decline: 5-10% (manageable with monitoring)

DECISION:
✓ APPROVED - Baseline cardiac function adequate for trastuzumab
✓ Requires cardio-oncology co-management and serial monitoring
```

### Patient Questions
1. **Survival Benefit & Treatment Goals:** What does adding Herceptin to my chemotherapy do for my cancer, and how much longer might it help me survive compared to chemotherapy alone? I want to understand if the benefits justify the risks and side effects.

**Desired Output:**
```
HERCEPTIN SURVIVAL BENEFIT SUMMARY:

What Herceptin Does:
- Targets HER2 protein on cancer cells
- Stops cancer cells from growing and reproducing
- Allows immune system to recognize and kill cancer cells
- Works synergistically with chemotherapy

Your Specific Situation (HER2+ metastatic breast cancer):

Chemotherapy Alone:
- Median overall survival: 12-15 months
- Response rate: 40-50%
- Progression-free survival: 6-8 months

Herceptin + Chemotherapy:
- Median overall survival: 25-30 months (DOUBLED)
- Response rate: 70-80%
- Progression-free survival: 12-18 months
- Complete response rate: 35-50%

Your Potential Benefit:
✓ Estimated added survival: 10-18 additional months
✓ Higher chance of initial response: 70% vs 40% (chemotherapy alone)
✓ Longer time before cancer progresses: 12-18 months vs 6-8 months

Survival Comparison (Simple View):
Without Herceptin: ~14 months average
With Herceptin: ~27 months average
DIFFERENCE: ~13 months longer with combination therapy

Important Context:
- These are averages; individual outcomes vary
- Some patients do better, some do worse
- New cancer treatments may extend survival further if needed
- Goal: Maximize time with family, activities, quality of life

Side Effects vs. Benefits:
Most common side effects (manageable with treatment):
- Nausea/vomiting: Controlled with anti-nausea medications
- Fatigue: Expected but manageable with rest, exercise
- Hair loss: Temporary, regrows after treatment
- Heart effect: Monitored closely; most recover fully

Serious complications (rare, <5%):
- Heart muscle weakness: Detected early with echo monitoring
- Severe allergic reaction: <1% risk

Risk-Benefit Summary:
SIDE EFFECTS: Temporary, manageable, reversible
BENEFITS: 13+ months additional survival, better quality of life

RECOMMENDATION: Herceptin + chemotherapy offers significant survival advantage
```

2. **Managing Side Effects During Treatment:** What should I expect in terms of side effects—both from the chemotherapy and from Herceptin specifically? Are there medications or strategies to help me manage nausea, fatigue, or other symptoms while working?

**Desired Output:**
```
SIDE EFFECTS MANAGEMENT PLAN:

CHEMOTHERAPY + HERCEPTIN SIDE EFFECTS:

Most Common (50-70% of patients):

1. NAUSEA & VOMITING
   Timing: 6-24 hours after infusion
   Severity: Mild-moderate (manageable)
   Prevention Strategy:
   ✓ Anti-nausea medications: Ondansetron 8mg Q8H
   ✓ Aprepitant: Day of chemo + 2 days after
   ✓ Dexamethasone: 8mg daily x 3 days
   Success Rate: 80-90% control with prevention
   
   At-Home Tips:
   □ Small, frequent meals instead of large ones
   □ Ginger tea or ginger candies
   □ Avoid strong food smells
   □ Stay hydrated (small sips throughout day)

2. FATIGUE
   Timing: Days 2-7 after treatment
   Severity: Mild-moderate (most common complaint)
   Management:
   ✓ Plan rest days after infusions
   ✓ Regular light exercise (walking): Improves energy
   ✓ Adequate sleep: 8-10 hours nightly
   ✓ Nutritional support: High-protein diet, B vitamins
   
   Work Accommodation Tips:
   □ Request flexible hours first 2 weeks post-chemo
   □ Schedule treatments on Friday for weekend recovery
   □ Consider remote work days post-treatment
   □ Energy typically returns by day 10-14

3. HAIR LOSS
   Timing: 1-2 weeks after first dose
   Severity: Complete (usually temporary)
   Management:
   ✓ Scalp cooling: Reduces hair loss 50%+ (pre-treatment available)
   ✓ Wigs/hats: Many covered by insurance
   ✓ Shorter haircut pre-treatment: Easier transition
   Duration: 3-6 months post-treatment for regrowth
   
   Emotional Support:
   □ Hair usually grows back fuller, sometimes different texture
   □ Support groups for cancer patients
   □ Professional wig fitting services

Herceptin-Specific Side Effects (Less Common):

1. INFUSION REACTIONS (5-10%)
   Symptoms: Fever, chills, headache, muscle aches
   Timing: During or immediately after first 2 infusions
   Management:
   ✓ Pre-medication: Acetaminophen, diphenhydramine
   ✓ Slower infusion rate for 1st dose
   ✓ Usually doesn't require stopping treatment

2. HEART EFFECTS (Rare, <5%, monitored closely)
   Symptoms: Shortness of breath, unusual fatigue
   Monitoring: Echo scans every 3-6 months
   Management: Dosage adjustment or temporary pause if needed

3. DIARRHEA (10-20%)
   Management: Loperamide as needed, dietary changes

WORK CAPACITY PLANNING:

Week 1 (Chemo infusion week):
□ Work capacity: 50-75% (possible fatigue)
□ Recommendation: Plan lighter tasks, flexible schedule

Week 2-3 (Post-chemo recovery):
□ Work capacity: 75-90% (most feel better)
□ Recommendation: Return toward normal

Week 4-5 (Recovery phase):
□ Work capacity: 100% (between treatments)

OVERALL WORK STRATEGY:
21-day cycle: Infusion + recovery (6 cycles recommended)
Suggested accommodation: 1-2 lighter weeks per month
Many patients continue working throughout treatment

MEDICATIONS & SUPPORT:
Anti-nausea: Ondansetron, aprepitant, dexamethasone
Anti-fatigue: CoQ10 supplement (may help)
Nutritional: Protein powder, multivitamins, high-calorie drinks
Emotional: Counseling, support groups, patient navigators

Side Effects Timeline:
Week 1 of cycle: Nausea, fatigue (worst days)
Week 2 of cycle: Improving (80% feel better)
Week 3 of cycle: Near normal (98% feel normal)

Bottom Line:
✓ Most side effects are MANAGEABLE with proper support
✓ Fatigue is most limiting but improves over days
✓ Many patients work throughout treatment
✓ Support team available: Oncology nurse, nutritionist, social worker
```

### Prior Authorization Reviewer Questions
1. **Biosimilar Step-Therapy Policy:** Aetna's 2026 guidelines emphasize biosimilar-first approaches for monoclonal antibodies in oncology. Has the prescriber considered or documented why Ogivri or Herzuma biosimilars are not appropriate for Jennifer, or should this PA be approved contingent on biosimilar trial?

**Desired Output:**
```
BIOSIMILAR STEP-THERAPY ANALYSIS:
Status: STEP-THERAPY REQUIRED - Biosimilar first approach (Aetna 2026 Guidelines)

Policy Reference: Aetna 2026 Oncology Prior Authorization Guidelines
Requirement: Biosimilar-first approach for monoclonal antibody therapies
Rationale: Cost containment, clinical equivalence established

Trastuzumab Biosimilar Options:

1. OGIVRI (trastuzumab biosimilar)
   Manufacturer: Pfizer
   Cost: $2,500-3,000/infusion (vs. $4,500+ branded Herceptin)
   Efficacy: FDA-approved as bioequivalent to Herceptin in HER2+ breast cancer
   Safety: Identical safety profile to branded trastuzumab
   Clinical Evidence: KANJINTI trial - non-inferiority proven
   Savings: 30-35% cost reduction per cycle

2. HERZUMA (trastuzumab biosimilar)
   Manufacturer: Celltrion
   Cost: $2,400-2,900/infusion
   Efficacy: FDA-approved as bioequivalent to Herceptin
   Safety: Identical safety profile to branded trastuzumab
   Clinical Evidence: Multiple clinical trials confirm equivalence
   Savings: 35-40% cost reduction per cycle

Clinical Justification Assessment:

Request Status: Branded Herceptin (no biosimilar contraindication documented)
Prescriber Notes: No documented reason provided for biosimilar exclusion
Prior Biosimilar Experience: None documented for this patient

Clinical Scenarios for Branded Herceptin Approval:
✗ History of trastuzumab biosimilar intolerance (allergic, loss of efficacy)
✗ Documented pharmacogenomic contraindication to biosimilar
✗ Patient participation in clinical trial requiring branded drug
✗ Special manufacturing requirement (none applicable)

Current Submission: LACKS documented justification for branded drug

DECISION OPTIONS:

Option A (Recommended per Aetna 2026 Guidelines):
✓ APPROVE contingent on biosimilar trial (OGIVRI or HERZUMA)
  - Initial biosimilar therapy: 4-6 week trial (2-3 infusions)
  - Response assessment: Same as branded trastuzumab
  - If inadequate response OR intolerance: Escalate to branded Herceptin
  - Savings: ~$8,000-12,000 per 8-week cycle
  - Timeline: Biosimilar trial period = 4-6 weeks

Option B (Branded Herceptin - Requires Justification):
□ APPROVE branded Herceptin ONLY if:
  - Prescriber documents clinical contraindication to biosimilar, OR
  - Patient has documented biosimilar intolerance, OR
  - Compelling clinical reason provided by oncologist

Recommendation per Aetna 2026 Policy:
✓ APPROVE contingent on biosimilar (OGIVRI or HERZUMA) trial first
  Clinical evidence: Biosimilars equivalent to Herceptin in HER2+ metastatic breast cancer
  Cost impact: Potential $24,000-48,000 savings for treatment course
  Response rate: 70-80% with biosimilar (equivalent to branded)

Oncologist Response Pathway:
If oncologist provides justification → Escalate to branded Herceptin
If no response within 5 days → Default to biosimilar-contingent approval

Timeline: 
- Decision point: 2 business days (pending oncologist feedback)
- Biosimilar trial period: 4-6 weeks
- Reassessment for branded escalation: Post-trial response evaluation
```

2. **Prior Chemotherapy Response & Treatment Line:** Is this Jennifer's first time receiving chemotherapy for metastatic disease, or has she progressed on prior chemotherapy? Aetna's coverage determination differs based on treatment line and prior response, so the clinical history is critical.

**Desired Output:**
```
TREATMENT LINE & CHEMOTHERAPY HISTORY ASSESSMENT:
Status: FIRST-LINE METASTATIC THERAPY - Optimal candidate for Herceptin combination

Prior Treatment Timeline:

ADJUVANT (Early-Stage) THERAPY:
✓ Paclitaxel + Herceptin: 12 months
  Status: Completed 2024
  Outcome: Complete remission (NED = no evidence of disease)
  Duration of remission: 18 months (2024-2026)

DISEASE PROGRESSION:
Diagnosis: Metastatic disease 2026-03
Metastatic sites: Liver (3 lesions), bone (2 lesions)
Status: Newly diagnosed metastatic recurrence

CURRENT PROPOSED TREATMENT:
First-line metastatic therapy: Herceptin + Taxane (paclitaxel/docetaxel)

Treatment Line Classification:
→ FIRST-LINE METASTATIC CHEMOTHERAPY
(Despite prior adjuvant therapy - this is first-line for metastatic disease)

Aetna Coverage Rationale by Treatment Line:

1st-LINE METASTATIC (Jennifer's situation):
✓ Herceptin + chemotherapy: STRONGLY RECOMMENDED
  Response rate: 70-80%
  Median overall survival: 25-30 months
  Standard of care: Preferred initial approach
  Aetna Coverage: APPROVED (medically necessary)

2nd-LINE (if 1st-line fails):
✓ Alternative Herceptin combinations or HER2-directed therapies
  Expected response: 30-40%
  Median survival: 12-18 months

3rd-LINE+ (heavily pretreated):
✓ Limited Aetna coverage without prior PA approval
  May require additional justification

Key Clinical Considerations for Jennifer:

1. RECURRENCE TIMING MATTERS:
   Time to recurrence: 18 months post-adjuvant therapy
   Clinical Interpretation: Late recurrence (favorable prognostic sign)
   Implication: Likely to respond to Herceptin re-challenge

2. HERCEPTIN RE-EXPOSURE SAFETY:
   Prior Herceptin exposure: 12 months adjuvant therapy
   Current proposal: Re-challenge with Herceptin
   Safety: Well-established in practice; no absolute contraindication
   Expected benefit: HER2 remains positive driver of disease

3. OPTIMAL SEQUENCING:
   Most effective approach: Immediate Herceptin + chemotherapy
   Alternative (inferior): Chemotherapy alone then Herceptin (delays benefit)

DECISION:
✓ APPROVED - First-line metastatic Herceptin + chemotherapy
✓ Medically necessary as front-line treatment
✓ Standard of care for HER2+ metastatic breast cancer
✓ Expected response: 70-80% disease response
✓ No requirement for prior chemotherapy trial

Coverage Determination:
Aetna Approval: STANDARD COVERAGE
Authorization: No additional steps required beyond standard prior auth

Notes:
- Not a higher treatment line requiring enhanced justification
- Not heavily pretreated (only 1 prior Herceptin regimen)
- Early metastatic recurrence (favorable for response)
- Herceptin rechallenge appropriate and effective

Timeline: Expedited approval recommended (medical necessity clear)
```

---

## Patient 4: Marcus Chen
**Condition:** Moderate-to-severe refractory Crohn's disease  
**Proposed Treatment:** Humira (adalimumab) SC injection  
**Insurance:** Pennsylvania Medical Assistance (Medicaid)

### Doctor Questions
1. **Conventional DMARD Failure Documentation:** PA Medicaid's guidelines require evidence that Marcus has failed adequate trials of azathioprine or 6-mercaptopurine, and that he has been on corticosteroids with documented inadequate response. Can you provide the azathioprine dosing history, duration, and reason for discontinuation (lack of efficacy vs. toxicity)?

**Desired Output:**
```
CONVENTIONAL THERAPY FAILURE DOCUMENTATION:
Status: CRITERIA MET - PA Medicaid requirement satisfied

Azathioprine (AZA) Trial Documentation:
✓ Starting dose: 50mg daily
✓ Therapeutic dose: 2.5 mg/kg = 175mg daily (achieved by week 4)
✓ Duration: 16 weeks (adequate per PA Medicaid ≥8-12 weeks)
✓ Reason for discontinuation: Inadequate response (persistent diarrhea, abdominal pain)
✓ Disease activity at discontinuation: Moderate-severe (HBI score 12)

Response Assessment:
□ Colonoscopy at week 12: Persistent ulceration, patchy inflammation
□ CRP at discontinuation: 24 mg/L (elevated, no improvement from baseline 22)
□ Clinical symptoms: No improvement in stool frequency or urgency

Finding: ADEQUATE AZATHIOPRINE TRIAL - failed for lack of efficacy

Corticosteroid Trial Documentation:
✓ Prednisone: Induced with 40mg daily
✓ Taper: Reduced by 5mg Q 1 week
✓ Response: Temporary improvement of diarrhea (days 3-7)
✓ Duration: Unable to taper below 10mg without symptom flare
✓ Status: Corticosteroid-dependent (inadequate response)

Finding: CORTICOSTEROID-DEPENDENT disease confirmed
PA Medicaid Interpretation: Inadequate response to conventional therapy

DECISION:
✓ APPROVED - Conventional therapy failure documented
✓ TNF-inhibitor justified based on inadequate corticosteroid/AZA response
✓ Medical necessity criteria MET for TNF-i therapy
```

2. **TB Screening & Safety Clearance:** Before initiating a TNF-inhibitor like Humira, PA Medicaid requires TB screening (tuberculin skin test or IGRA) and appropriate vaccinations. Has Marcus been screened for latent TB and cleared for TNF-inhibitor therapy?

**Desired Output:**
```
INFECTIOUS DISEASE SCREENING & SAFETY CLEARANCE:
Status: CLEARED for TNF-inhibitor therapy

TB SCREENING:
✓ Tuberculin Skin Test (TST): Placed 2026-04-15
✓ Reading at 48-72 hours: 3mm induration (NEGATIVE)
✓ Interpretation: No latent tuberculosis infection
✓ Baseline CXR: Clear (no cavitary disease)
✓ Clearance: APPROVED for TNF-inhibitor without TB prophylaxis

Alternative: IGRA could substitute if TST unavailable

VACCINATION STATUS:
□ Influenza vaccine: Current (given 2025-10)
□ Pneumococcal vaccine (PCV20): Current (given 2025-09)
□ MMR: Documented immunity (titer positive)
□ Varicella: Documented immunity (prior chickenpox)
□ COVID-19: Up-to-date (most recent dose: 2025-12)

Finding: VACCINATIONS ADEQUATE for TNF-inhibitor use

PA MEDICAID CLEARANCE SUMMARY:
✓ TB screening: NEGATIVE (no prophylaxis required)
✓ Baseline infections: None active
✓ Vaccinations: Current
✓ Prior infections: Hepatitis B non-immune (consider HBV vaccine series)

RECOMMENDATION:
✓ CLEARED for Humira initiation
✓ No TB prophylaxis required (TST negative)
✓ Consider HBV vaccination series (timing: before or after TNF-i start)
✓ Annual flu and pneumococcal vaccination required during TNF-i

Monitoring During TNF-i Therapy:
□ Baseline CBC, CMP: Obtained 2026-04-20 (normal)
□ Repeat labs: Q 3 months first year, then Q 6 months
□ Annual TB screening: TST or IGRA repeat
□ Monitor for signs of opportunistic infection

Timeline: APPROVED - No delays for TB/infection concerns
```

### Patient Questions
1. **Injection Frequency & Administration:** Will I be able to inject Humira myself at home, or do I need to come to a clinic or hospital? How often will I need to do the injections, and is this something I can manage on my own?

**Desired Output:**
```
HUMIRA SELF-INJECTION TRAINING & SCHEDULE:

INJECTION ADMINISTRATION:
✓ Route: Subcutaneous injection (under the skin)
✓ Self-administration: YES - can inject at home
✓ Training: Nurse will train you (1-2 sessions, ~30 minutes each)
✓ Auto-injector pen: Easy-to-use prefilled pen (pushbutton activation)
✓ No experience needed: Most patients learn in first visit

INJECTION SCHEDULE:

Initial Induction:
Week 0: Humira 160mg (2 injections of 40mg each)
Week 1: Humira 40mg
Week 2: Humira 40mg
Week 3 onward: Humira 40mg EVERY 2 WEEKS (maintenance)

Typical Dosing (Your Plan):
□ First 3 injections: Weekly (weeks 0, 1, 2)
□ Then: Every 2 weeks indefinitely
□ If good response: May stay on 40mg Q2W long-term

Injection Technique (Simple):
1. Wash hands
2. Inject in thigh or abdomen (rotate injection sites)
3. Push auto-pen button = injection complete (lasts 5-10 seconds)
4. No needle handling required (hidden needle design)

Pain Level:
□ Needle size: Very thin (same as insulin needle)
□ Pain: Most report "minimal" or "no pain"
□ Duration: Injection is quick (< 10 seconds)
□ Comparison: Much less painful than IV infusion

WORK/LIFE ACCOMMODATION:
✓ Time required: 5-10 minutes per injection
✓ Location: Anywhere private (home, office bathroom, etc.)
✓ No travel to clinic needed after training
✓ Easy to travel with (refrigerated travel case provided)
✓ No special equipment beyond the auto-injector pen

TRAINING & SUPPORT PROVIDED:
□ Injection demonstration: Nurse-led training
□ Practice injection: With dummy pen (no medication)
□ Auto-injector walkthrough: Step-by-step instruction
□ Support materials: Video demonstrations provided
□ Manufacturer support line: Free 24/7 help if questions

STORAGE:
□ Keep refrigerated 36-46°F (auto-injectors provided)
□ Allow to warm room temperature 15-30 min before injecting
□ Helpful tip: Mark injection days on calendar (e.g., Tuesdays & Fridays)

SIDE EFFECTS AT INJECTION SITE:
□ Redness, swelling, bruising: Common (usually mild)
□ Itching at site: Temporary (resolves in hours)
□ Severity: Decreases with each injection (body adapts)

Success Tips:
✓ Set phone reminder for injection day
✓ Inject at same time of day (easier habit)
✓ Rotate injection sites (thigh one week, abdomen next)
✓ Don't rub injection site after
✓ Many patients do injections at home Friday evening

Most patients report:
"After first injection, I was surprised how easy it is"
"The auto-pen makes it painless"
"I prefer home injections to clinic visits"

Bottom Line:
✓ YES - You can absolutely inject at home
✓ NO - No clinic visits required for injections after training
✓ Easy - 99% of patients self-inject successfully
✓ Quick - 5-10 minutes, every 2 weeks
✓ Minimal discomfort - Most report "hardly feel it"

Timeline:
First visit: Training + first injection at clinic
Subsequent injections: Self-administered at home
```

2. **Medication Cost & Assistance Programs:** Humira is very expensive. Even though I have Medicaid, will I have any out-of-pocket costs? Are there patient assistance programs that can help if my Medicaid coverage has gaps?

**Desired Output:**
```
HUMIRA COST & FINANCIAL ASSISTANCE SUMMARY:

MEDICATION COST CONTEXT:
Humira retail price: $6,000-7,000 per month (~$72,000-84,000/year)
Marcus's cost with PA Medicaid: $0-$5 copay (state-dependent)

YOUR EXPECTED COSTS:

With Pennsylvania Medicaid:
✓ Most likely: $0 copay per injection (PA Medicaid covers biologics)
✓ PA Medicaid rule: Copayments usually waived for biologic therapies
✓ Your responsibility: Minimal to none

Potential out-of-pocket scenarios:
□ Standard copay: $0-$5 per month
□ Specialty pharmacy: May have small copay ($15-25/month)
□ Non-formulary challenge: Temporary gap while appeals processed
□ Income-based cost-sharing: PA Medicaid may have minimal income-based cost

FINANCIAL ASSISTANCE PROGRAMS:

1. PENNSYLVANIA MEDICAID (PRIMARY COVERAGE):
Status: Covers Humira (biologic diseases)
Approval process: Prior authorization (typically approved)
Cost to patient: Usually $0
Appeal process: If denied, patient advocate can help

2. ABBVIE PATIENT ASSISTANCE PROGRAM (Humira manufacturer):
Eligibility: Income-based assistance
Coverage if: Medicaid denied OR coverage gap exists
Cost to patient: Free medication (copay assistance also available)
How to enroll: Doctor's office helps with enrollment
Phone: 1-800-222-6885

3. CO-PAY ASSISTANCE PROGRAMS:
Program: Humira CoPay Card
Eligibility: Patients with insurance co-pays
Benefit: Reduces copay to $5 per month (up to insurance max)
Cost to patient: Free (paid by manufacturer)

4. FEDERAL PATIENT ASSISTANCE (if Medicaid denied):
Program: 340B Ceiling Price Program
Benefit: Pharmacy can access reduced medication pricing
Cost to patient: Minimal if Medicaid coverage denied

5. NON-PROFIT ASSISTANCE ORGANIZATIONS:
Crohn's & Colitis Foundation
- Free financial assistance counseling
- Links to additional funding programs
- Phone: 1-888-694-8872

Patient Advocate Foundation
- Medication co-pay assistance
- Financial navigation services

REALISTIC FINANCIAL SCENARIO FOR YOU:

Most Likely Case:
✓ Humira covered by PA Medicaid
✓ Your out-of-pocket cost: $0-5 per injection
✓ AbbVie assistance: Not needed (Medicaid covers)

If Medicaid Has Temporary Coverage Gap:
✓ AbbVie Patient Assistance: FREE medication during gap
✓ Your out-of-pocket cost: $0
✓ Enrollment time: 1-2 weeks

If Medicaid Denies Authorization:
✓ Appeal process: Covered by state
✓ AbbVie assistance during appeal: FREE medication
✓ Your cost: $0 (manufacturer covers)

FINANCIAL PROTECTION SUMMARY:
✗ No scenario where Humira is completely unaffordable
✓ PA Medicaid covers biologics well
✓ AbbVie assistance covers gaps
✓ Non-profit organizations provide additional support

What You Need to Do:
1. Confirm Medicaid active (eligibility check)
2. Let doctor's office handle prior auth (routine)
3. Ask pharmacy about copay amount at start
4. If any cost concern: Contact AbbVie 1-800-222-6885
5. Crohn's Foundation patient advocate: 1-888-694-8872

Timeline:
Week 1-2: Prior auth processed (usually approved)
Week 2-3: Pick up first injection from pharmacy
Ongoing: $0-5 per month (or FREE via assistance)

NO PATIENTS SHOULD STOP TREATMENT DUE TO COST:
If you can't afford → Call AbbVie immediately
Financial crisis support available even with Medicaid

Important Note:
Your cost should NEVER be a barrier to getting needed treatment.
Multiple financial safety nets exist to ensure affordability.
```

### Prior Authorization Reviewer Questions
1. **Inflammatory Bowel Disease Activity & Endoscopic Findings:** What is Marcus's current inflammatory bowel disease activity score (e.g., Harvey-Bradshaw Index for Crohn's)? PA Medicaid requires recent colonoscopy or imaging evidence showing active inflammation before approving TNF-inhibitor therapy.

**Desired Output:**
```
IBD DISEASE ACTIVITY & ENDOSCOPIC CONFIRMATION:
Status: CONFIRMED - Active inflammation documented, TNF-i justified

DISEASE ACTIVITY SCORING:

Harvey-Bradshaw Index (HBI) for Crohn's Disease:
Current score: 13/21 (Moderate-severe disease)
Interpretation: Moderate-severe activity (≥5 = active; ≥8 = severe)
Components:
□ General well-being: 2 (occasionally poor)
□ Abdominal pain: 3 (severe most of time)
□ Liquid stools: 3 (≥6/day)
□ Abdominal mass: 1 (palpable)
□ Perirectal complications: 1 (fistula present)

PA Medicaid Requirement: HBI ≥5 (active disease) ✓ MET with HBI=13

INFLAMMATORY MARKERS:

Laboratory Evidence:
✓ CRP: 28 mg/L (normal <3; markedly elevated)
✓ ESR: 45 mm/hr (elevated; normal <20)
✓ Fecal calprotectin: 850 mcg/g (normal <50; indicates mucosal inflammation)
✓ Hemoglobin: 10.2 g/dL (mild anemia of chronic disease)
✓ Albumin: 3.1 g/dL (mildly low; indicates nutritional impact)

Finding: BIOCHEMICAL EVIDENCE OF ACTIVE INFLAMMATION

ENDOSCOPIC FINDINGS:

Colonoscopy Date: 2026-04-10 (Recent = <6 months)
Findings: Consistent with active Crohn's disease
□ Patchy inflammation: Terminal ileum + colon
□ Ulceration: Multiple deep ulcers (> 1cm)
□ Stenosis: Stricture in terminal ileum (not yet obstructive)
□ Aphthous ulcers: Throughout colon
□ No toxic megacolon or perforation

Mayo Score (endoscopic severity): 2 (Moderate)
Interpretation: Active inflammation seen on visualization

Pathology from Biopsy:
□ Transmural inflammation: Consistent with Crohn's
□ Crypt distortion: Present
□ Increased lymphoplasmacytic infiltrate: Marked
□ No granulomas observed
Finding: HISTOLOGIC CONFIRMATION of active Crohn's disease

IMAGING CONFIRMATION:

CT Enterography (2026-04-05):
□ Bowel wall thickening: Terminal ileum (8mm thickness; normal <2mm)
□ Fat stranding: Mesenteric inflammation present
□ Mesenteric lymph nodes: Reactive enlargement
□ No abscess or free perforation
Finding: RADIOGRAPHIC CONFIRMATION of active inflammation

PA MEDICAID APPROVAL CRITERIA:

Requirement 1: Active disease confirmed ✓
Evidence: HBI=13, CRP=28, ESR=45

Requirement 2: Endoscopic inflammation documented ✓
Evidence: Recent colonoscopy with deep ulcers, patchy inflammation

Requirement 3: Failed conventional therapy ✓
Evidence: Inadequate response to azathioprine 16 weeks, corticosteroid-dependent

Requirement 4: Infectious disease screening ✓
Evidence: TB negative, vaccinations adequate

DECISION:
✓ APPROVED - All PA Medicaid criteria MET
✓ Active inflammation confirmed by HBI, labs, endoscopy, imaging
✓ TNF-inhibitor medically necessary

Medical Necessity Summary:
Crohn's disease activity: MODERATE-SEVERE (HBI=13/21)
Inflammation location: Terminal ileum + colon
Type: Deep ulcerating disease requiring biological therapy
Prognosis if untreated: Progressive stricturing, increased surgical risk

Approval: Expedited (medical necessity clear and documented)
```

2. **Step-Therapy & Biosimilar Consideration:** Has Marcus been offered a trial of adalimumab biosimilars (Hadlima or Hyrimoz) before approval of branded Humira? PA Medicaid emphasizes cost-effective alternatives, so the PA should clarify whether biosimilar step-therapy applies or if branded Humira is medically necessary.

**Desired Output:**
```
BIOSIMILAR STEP-THERAPY ANALYSIS:
Status: STEP-THERAPY RECOMMENDED but biologics generally require rapid initiation

Policy Reference: PA Medicaid Cost Containment Initiative - Biologics
Approach: Biosimilar-first when clinically appropriate; expedited initiation for urgent disease

Adalimumab Biosimilar Options:

1. HADLIMA (adalimumab biosimilar)
   Manufacturer: Sandoz
   Cost: $1,800-2,200/month (vs. $6,000-7,000 branded Humira)
   Efficacy: FDA-approved bioequivalent to Humira in IBD
   Safety: Identical safety profile to Humira
   Clinical Evidence: Non-inferiority proven in IBD studies
   Savings: 60-70% cost reduction (~$51,600-62,400/year savings)

2. HYRIMOZ (adalimumab biosimilar)
   Manufacturer: Organon
   Cost: $1,900-2,400/month
   Efficacy: FDA-approved bioequivalent to Humira in Crohn's
   Safety: Identical safety profile to Humira
   Clinical Evidence: Equivalent efficacy in moderate-moderate-severe IBD
   Savings: 60-70% cost reduction

Clinical Considerations for Biosimilar Approach:

Marcus's Situation:
✓ Moderate-severe, symptomatic Crohn's disease
✓ High inflammatory burden (CRP=28, calprotectin=850)
✓ Active deep ulceration on colonoscopy
✓ Corticosteroid-dependent (medical urgency)
✓ Previous conventional therapy failure (no alternative)

Biosimilar Clinical Appropriateness:
✓ Hadlima/Hyrimoz: Clinically equivalent to Humira in IBD
✓ Safety: Well-established in inflammatory bowel disease
✓ No contraindication to biosimilar initiation

PA MEDICAID COST-REDUCTION PRIORITY:
Biologics represent significant Medicaid expenditure
Biosimilars offer 60-70% savings while maintaining efficacy
Policy incentive: Strongly favor biosimilar when medically appropriate

DECISION OPTIONS:

Option A (Recommended for Cost Savings):
✓ APPROVE Hadlima or Hyrimoz (adalimumab biosimilar)
  - Cost savings: ~$51,600-62,400 annually
  - Clinical efficacy: Equivalent to branded Humira
  - PA Medicaid requirement: Met
  - If inadequate response: Escalate to branded Humira after 12 weeks
  - Outcome: Same remission rates, substantial savings

Option B (Branded Humira - Requires Justification):
□ Approve branded Humira ONLY if:
  - Prescriber documents prior biosimilar intolerance (allergic reaction, loss of efficacy), OR
  - Clinical contraindication to biosimilar therapy, OR
  - Biosimilar unavailable/supply issue

TIMING CONSIDERATION - URGENT DISEASE:
Marcus has severe, symptomatic disease with:
- Deep ulceration requiring prompt TNF-i initiation
- High inflammatory markers (medical urgency)
- Corticosteroid dependence (time-sensitive)

Recommendation:
✓ Expedited biosimilar approval (minimal delay)
  Timeline: Approval within 1-2 business days
  Rationale: Biosimilar equally effective; cost priority aligns
  
Alternative: If prescriber insists on branded:
- Requires clinical justification documented
- Must explain why biosimilar inadequate for THIS patient
- Currently no documented contraindication exists

COST-IMPACT SUMMARY:
Hadlima (biosimilar): $23,600/year (PA Medicaid cost)
Humira (branded): $72,000-84,000/year (PA Medicaid cost)
Annual savings: $48,400-60,400 per patient

PA MEDICAID DECISION:
✓ APPROVED for Hadlima or Hyrimoz initiation
✓ Biosimilar appropriate clinical choice
✓ Substantial cost savings align with state budget priorities
✓ Rapid approval: Disease severity warrants expedited processing

Notes:
- Biosimilars equally effective in IBD (FDA-approved equivalence)
- Prescriber can request branded Humira with documented justification
- If inadequate biosimilar response: Branded escalation approved

Timeline: Expedited (1-2 business days for biosimilar approval)
```

---

## Summary Matrix

| Patient | Specialty | Indication | Insurance | Key PA Hurdles | System Output Summary |
|---------|-----------|-----------|-----------|---|---|
| Robert Anderson | Oncology | Metastatic CRC | BCBS NC | KRAS status, biosimilar step-therapy | Documentation required for KRAS; biosimilar trial contingent approval |
| Sarah Martinez | Rheumatology | RA (DMARD-fail) | Cigna | DMARD trial documentation, DAS28 score | DMARD adequacy confirmed; combination contraindicated; biosimilar trial required |
| Jennifer Kim | Oncology | HER2+ breast cancer | Aetna | HER2 confirmation, LVEF baseline, biosimilar step-therapy | HER2 confirmed, cardiac cleared; biosimilar (Ogivri/Herzuma) trial contingent |
| Marcus Chen | Gastroenterology | Crohn's (refractory) | PA Medicaid | TB screening, IBD activity score, biosimilar step-therapy | TB cleared, disease activity confirmed; biosimilar (Hadlima/Hyrimoz) approved for cost savings |
