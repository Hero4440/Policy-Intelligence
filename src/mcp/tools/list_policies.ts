import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listPoliciesInput } from '../schemas/tool_inputs.js';
import { getAllPolicies } from '../policy_store/loader.js';
import { normalizeDrugName } from '../../../data/lookup/drug-aliases.js';
import { buildErrorResponse, buildStandardResponse } from '../utils/response_builder.js';

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function pluralizePolicy(count: number): string {
  return count === 1 ? 'policy' : 'policies';
}

export function registerListPolicies(server: McpServer): void {
  server.registerTool(
    'list_policies',
    {
      description: 'List all loaded medical policy documents with metadata. Returns payer name, policy title, effective date, and covered drug families for each policy. Use this tool to discover what policies are available before querying for details or comparisons. Optionally filter by payer name or drug family. Accepts brand names, generic names, or biosimilar names for drug filtering.',
      inputSchema: listPoliciesInput.shape
    },
    async ({ payer, drug_family }) => {
      const allPolicies = getAllPolicies();
      let filteredPolicies = allPolicies;
      const filterDescriptions: string[] = [];

      if (payer) {
        const payerFilter = payer.toLowerCase();
        filteredPolicies = filteredPolicies.filter(policy =>
          policy.payer.toLowerCase().includes(payerFilter)
        );
        filterDescriptions.push(`payer matching "${payer}"`);
      }

      if (drug_family) {
        const normalizedDrug = normalizeDrugName(drug_family);
        filteredPolicies = filteredPolicies.filter(policy =>
          policy.drug.genericName.toLowerCase() === normalizedDrug.toLowerCase()
        );
        filterDescriptions.push(`drug family "${drug_family}" normalized to "${normalizedDrug}"`);
      }

      const availablePayers = uniqueSorted(allPolicies.map(policy => policy.payer));
      const availableDrugs = uniqueSorted(allPolicies.map(policy => policy.drug.genericName));

      if (filteredPolicies.length === 0) {
        return buildErrorResponse('No policies match filters', {
          available_payers: availablePayers,
          available_drugs: availableDrugs,
          hint: `Try payer values such as ${availablePayers.join(', ')} or drug_family values such as ${availableDrugs.join(', ')}.`
        });
      }

      const policies = filteredPolicies.map(policy => ({
        policy_id: policy.id,
        payer: policy.payer,
        policy_title: policy.policyTitle || policy.sourceDocument.filename,
        effective_date: policy.sourceDocument.effectiveDate,
        drug_family: policy.drug.genericName,
        drug_brand: policy.drug.brandName,
        indications: policy.indications || [policy.indication]
      }));

      const payers = uniqueSorted(filteredPolicies.map(policy => policy.payer));
      const drugs = uniqueSorted(filteredPolicies.map(policy => policy.drug.genericName));
      const filterText = filterDescriptions.length > 0
        ? ` matching ${filterDescriptions.join(' and ')}`
        : '';
      const answer = `Found ${filteredPolicies.length} ${pluralizePolicy(filteredPolicies.length)}${filterText}. Payers: ${payers.join(', ')}. Drug families: ${drugs.join(', ')}.`;

      return buildStandardResponse(
        answer,
        {
          total_count: policies.length,
          policies
        },
        [],
        'HIGH'
      );
    }
  );
}
