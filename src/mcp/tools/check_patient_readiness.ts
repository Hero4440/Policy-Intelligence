import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { patientReadinessInput } from '../schemas/tool_inputs.js';
import { findPolicy, getAllPolicies } from '../policy_store/loader.js';
import { normalizeDrugName } from '../../../data/lookup/drug-aliases.js';
import { extractFhirToken, createFhirClient, fetchPatientBundle } from '../fhir/client.js';
import { extractPatientData } from '../fhir/extractors.js';
import { matchPatientAgainstPolicy, CriterionResult } from '../matching/criteria_matcher.js';
import { DISCLAIMER } from '../matching/language.js';

export function registerCheckPatientReadiness(server: McpServer): void {
  server.registerTool(
    'check_patient_readiness',
    {
      description: "Analyze a patient's clinical context against a health plan's prior authorization criteria for a specific drug. Returns which PA requirements the patient appears to meet, which are missing or unverifiable, and what documentation may still be needed. When patient_context includes fhir_token and patient_id, retrieves patient FHIR data and performs automated readiness analysis. Without FHIR context, returns the criteria checklist for manual review.",
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

        // Try to extract FHIR token from patient context
        const fhirToken = extractFhirToken(patient_context);

        // MODE A: With FHIR token - perform automated analysis
        if (fhirToken) {
          try {
            // Create FHIR client and fetch patient data
            const fhirClient = createFhirClient(
              fhirToken.fhir_server_url || process.env.FHIR_SERVER_URL || 'https://fhir.promptopinion.ai',
              fhirToken.fhir_token
            );
            const patientBundle = await fetchPatientBundle(
              fhirClient,
              fhirToken.patient_id
            );

            // Extract patient data
            const patientData = extractPatientData(patientBundle);

            // Match patient data against policy requirements
            const criteriaResults = matchPatientAgainstPolicy(patientData, policy);

            // Calculate readiness summary
            const criteriaMet = criteriaResults.filter(
              r => r.status === 'appears_to_match'
            ).length;
            const criteriaPossiblyMissing = criteriaResults.filter(
              r => r.status === 'may_be_missing'
            ).length;
            const criteriaNeedingDoc = criteriaResults.filter(
              r => r.status === 'documentation_may_be_needed'
            ).length;
            const criteriaUnableToVerify = criteriaResults.filter(
              r => r.status === 'unable_to_verify'
            ).length;

            // Generate overall assessment
            let overallAssessment: string;
            if (criteriaMet === criteriaResults.length) {
              overallAssessment = 'All criteria appear to be met based on available data';
            } else if (criteriaPossiblyMissing > 0 || criteriaUnableToVerify > 0) {
              overallAssessment = 'Some criteria may require additional documentation or may not be met';
            } else {
              overallAssessment = 'Some criteria require clinical documentation beyond automated analysis';
            }

            // Build response with FHIR analysis
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
              readiness_summary: {
                criteria_met: criteriaMet,
                criteria_possibly_missing: criteriaPossiblyMissing,
                criteria_needing_documentation: criteriaNeedingDoc,
                criteria_unable_to_verify: criteriaUnableToVerify,
                total_criteria: criteriaResults.length
              },
              overall_assessment: overallAssessment,
              criteria_details: criteriaResults,
              patient_data_summary: {
                diagnoses_found: patientData.diagnoses.length,
                medications_found: patientData.medications.length,
                coverage_found: patientData.coverage !== null
              },
              disclaimer: DISCLAIMER,
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
          } catch (fhirError) {
            // FHIR error fallback - return criteria checklist with error info
            const errorMessage = fhirError instanceof Error ? fhirError.message : String(fhirError);

            // Build criteria checklist
            const criteriaChecklist = buildCriteriaChecklist(policy);

            const fallbackResult = {
              drug: {
                brand: policy.drug.brandName,
                generic: policy.drug.genericName,
                queried_name: drug,
                normalized_to: normalizedDrug
              },
              payer: policy.payer,
              plan: policy.plan,
              indication: policy.indication,
              readiness_status: 'fhir_error_fallback',
              fhir_error: {
                message: `Failed to retrieve patient data: ${errorMessage}`,
                suggestion: 'Verify FHIR token is valid and patient_id exists'
              },
              criteria_checklist: criteriaChecklist,
              total_criteria: criteriaChecklist.length,
              note: 'Unable to perform automated analysis due to FHIR error. Review criteria checklist manually.',
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
                  text: JSON.stringify(fallbackResult, null, 2)
                }
              ]
            };
          }
        }

        // MODE B: Without FHIR token - return criteria checklist
        const criteriaChecklist = buildCriteriaChecklist(policy);

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
          readiness_status: 'requires_patient_data',
          criteria_checklist: criteriaChecklist,
          total_criteria: criteriaChecklist.length,
          note: "Provide fhir_token and patient_id in patient_context for automated readiness analysis",
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

/**
 * Helper function to build criteria checklist from policy
 * Used in Mode B (no FHIR token) and FHIR error fallback
 */
function buildCriteriaChecklist(policy: any): any[] {
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

  return criteriaChecklist;
}
