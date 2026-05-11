import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { drugCoverageInput } from '../schemas/tool_inputs.js';
import { findPolicy, getAllPolicies } from '../policy_store/loader.js';
import { normalizeDrugName } from '../../../data/lookup/drug-aliases.ts';

export function registerGetDrugCoverage(server: McpServer): void {
  server.registerTool(
    'get_drug_coverage',
    {
      description: "Determine if a specific drug is covered by a health insurance plan for rheumatoid arthritis treatment. Returns coverage status (covered, not covered, covered with prior authorization), the source policy document reference, and direct quotes from the policy supporting the determination. Use this tool when a user asks about whether a drug is covered, if prior auth is needed, or what a plan's stance is on a medication.",
      inputSchema: drugCoverageInput.shape
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

        // Build coverage response
        const result = {
          coverage_status: policy.coverageStatus,
          drug_name: {
            brand: policy.drug.brandName,
            generic: policy.drug.genericName,
            queried_name: drug,
            normalized_to: normalizedDrug
          },
          payer: policy.payer,
          plan: policy.plan,
          prior_auth_required: policy.paRequired,
          source: {
            document: policy.sourceDocument.filename,
            effective_date: policy.sourceDocument.effectiveDate,
            url: policy.sourceDocument.url
          },
          evidence: {
            diagnosis: policy.diagnosisRequirements[0]?.evidenceText || 'No specific diagnosis requirement documented',
            prior_auth_summary: policy.paRequired
              ? `Prior authorization required. Key requirements: ${policy.stepTherapy.length > 0 ? 'Step therapy - ' + policy.stepTherapy[0].evidenceText : 'See full criteria'}`
              : 'No prior authorization required'
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
