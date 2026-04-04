import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { patientReadinessInput } from '../schemas/tool_inputs.js';
import { findPolicy, getAllPolicies } from '../policy_store/loader.js';
import { normalizeDrugName } from '../../../data/lookup/drug-aliases.js';

export function registerCheckPatientReadiness(server: McpServer): void {
  server.registerTool(
    'check_patient_readiness',
    {
      description: "Analyze a patient's clinical context against a health plan's prior authorization criteria for a specific drug. Returns which PA requirements the patient appears to meet, which are missing or unverifiable, and what documentation may still be needed. Use this tool after identifying that a drug requires prior auth, to assess whether a specific patient is likely to meet the approval criteria. Note: Full patient context integration via FHIR is coming in a future update — currently returns the criteria checklist that would be evaluated.",
      inputSchema: patientReadinessInput.shape
    },
    async ({ plan, drug, patient_context }) => {
      try {
        // Normalize drug name
        const normalizedDrug = normalizeDrugName(drug);

        // Find policy
        const policy = findPolicy(plan, normalizedDrug);

        if (!policy) {
          // Get available payers and drugs for helpful error
          const allPolicies = getAllPolicies();
          const payers = [...new Set(allPolicies.map(p => p.payer))];
          const drugs = [...new Set(allPolicies.map(p => p.drug.genericName))];

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: 'Policy not found',
                  message: `No policy found for plan "${plan}" and drug "${drug}" (normalized to "${normalizedDrug}")`,
                  available_payers: payers,
                  available_drugs: drugs,
                  hint: 'Try one of the available payers and drugs listed above'
                }, null, 2)
              }
            ]
          };
        }

        // Extract all requirements into a checklist
        const criteriaChecklist = [];

        // Add diagnosis requirements
        for (const diagReq of policy.diagnosisRequirements) {
          criteriaChecklist.push({
            criterion: diagReq.description,
            category: 'diagnosis',
            status: 'requires_patient_data',
            evidence: diagReq.evidenceText,
            source: {
              document: diagReq.source.document,
              page: diagReq.source.page,
              section: diagReq.source.section
            }
          });
        }

        // Add step therapy requirements
        for (const stepReq of policy.stepTherapy) {
          const criterion = `${stepReq.drugName}${stepReq.dosage ? ' (' + stepReq.dosage + ')' : ''} for ${stepReq.duration} - ${stepReq.failureCriteria}`;
          criteriaChecklist.push({
            criterion: criterion,
            category: 'step_therapy',
            status: 'requires_patient_data',
            evidence: stepReq.evidenceText,
            source: {
              document: stepReq.source.document,
              page: stepReq.source.page,
              section: stepReq.source.section
            }
          });
        }

        // Add other requirements
        for (const otherReq of policy.otherRequirements) {
          criteriaChecklist.push({
            criterion: otherReq.requirement,
            category: otherReq.category,
            status: 'requires_patient_data',
            evidence: otherReq.evidenceText,
            is_ambiguous: otherReq.ambiguous,
            source: {
              document: otherReq.source.document,
              page: otherReq.source.page,
              section: otherReq.source.section
            }
          });
        }

        // Build response
        const result = {
          drug: {
            brand: policy.drug.brandName,
            generic: policy.drug.genericName,
            queried_name: drug,
            normalized_to: normalizedDrug
          },
          payer: policy.payer,
          plan: policy.plan,
          indication: policy.indication,
          readiness_status: 'pending_patient_context',
          message: "Patient context integration pending. Below are the prior authorization criteria that would be checked against the patient's clinical data.",
          criteria_checklist: criteriaChecklist,
          total_criteria: criteriaChecklist.length,
          note: "Full FHIR patient context matching will be available in a future update. For now, use this checklist to manually assess patient readiness.",
          source: {
            document: policy.sourceDocument.filename,
            url: policy.sourceDocument.url,
            effective_date: policy.sourceDocument.effectiveDate,
            retrieval_date: policy.sourceDocument.retrievalDate
          }
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Internal error',
                message: errorMessage
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    }
  );
}
