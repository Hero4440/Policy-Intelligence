# 11-04 Summary

- Added `extract_patient_facts` in [src/mcp/tools/extract_patient_facts.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/mcp/tools/extract_patient_facts.ts).
- The tool reads a patient case from the file-backed case store and groups extracted facts into diagnosis, requested drug, prior therapies, prescriber, insurance, and clinical-note buckets.
- Added `evaluate_patient_against_policy` in [src/mcp/tools/evaluate_patient_against_policy.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/mcp/tools/evaluate_patient_against_policy.ts).
- The evaluation tool reuses the existing patient-policy evaluation engine, persists the result through the evaluation store, updates case status to `complete`, and returns the checklist plus evidence-backed coverage status.

**Verification**

- `npx tsc --noEmit` passes
- `grep -n "registerExtractPatientFacts\|getPatientCase\|buildStandardResponse" src/mcp/tools/extract_patient_facts.ts` passes
- `grep -n "registerEvaluatePatientAgainstPolicy\|evaluatePatientCaseAgainstPolicy\|saveEvaluation\|buildStandardResponse" src/mcp/tools/evaluate_patient_against_policy.ts` passes
