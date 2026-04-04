import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { priorAuthCriteriaInput } from '../schemas/tool_inputs.js';
import { findPolicy, getAllPolicies } from '../policy_store/loader.js';
import { normalizeDrugName } from '../../../data/lookup/drug-aliases.js';

export function registerGetPriorAuthCriteria(server: McpServer): void {
  server.registerTool(
    'get_prior_auth_criteria',
    {
      description: "Get the detailed prior authorization criteria for a drug under a specific health plan. Returns structured requirements including diagnosis criteria, step therapy (prior medications that must have been tried), quantity limits, and other restrictions — each with direct quotes from the policy document as evidence. Use this tool when a user needs to know exactly what criteria must be met for PA approval.",
      inputSchema: priorAuthCriteriaInput.shape
    },
    async ({ plan, drug }) => {
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

        // Build structured PA criteria response
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
          diagnosis_requirements: policy.diagnosisRequirements.map(req => ({
            icd10_codes: req.icd10Codes,
            description: req.description,
            evidence: req.evidenceText,
            source: {
              document: req.source.document,
              page: req.source.page,
              section: req.source.section
            }
          })),
          step_therapy: policy.stepTherapy.map(step => ({
            drug: step.drugName,
            dosage: step.dosage,
            duration: step.duration,
            failure_criteria: step.failureCriteria,
            evidence: step.evidenceText,
            source: {
              document: step.source.document,
              page: step.source.page,
              section: step.source.section
            }
          })),
          other_requirements: policy.otherRequirements.map(other => ({
            category: other.category,
            requirement: other.requirement,
            evidence: other.evidenceText,
            is_ambiguous: other.ambiguous,
            source: {
              document: other.source.document,
              page: other.source.page,
              section: other.source.section
            }
          })),
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
