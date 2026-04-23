import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { searchPolicyEvidence } from '../../server/evidence-search.js';
import { buildErrorResponse, buildStandardResponse } from '../utils/response_builder.js';

const searchPolicyRulesInput = z.object({
  query: z.string().describe("Keyword search across policy rules and evidence snippets, e.g. 'step therapy' or 'rituximab prior authorization'")
});

export function registerSearchPolicyRules(server: McpServer): void {
  server.registerTool(
    'search_policy_rules',
    {
      description: 'Keyword search across all loaded policy rules and evidence snippets. Returns ranked results with policy name, payer, page, section heading, snippet text, and field label.',
      inputSchema: searchPolicyRulesInput.shape
    },
    async ({ query }) => {
      const normalized = query.trim();
      if (!normalized) {
        return buildErrorResponse('Search query is required.', {
          hint: 'Provide a clinical or policy keyword such as "step therapy", "prior authorization", or a drug name.'
        });
      }

      const results = searchPolicyEvidence(normalized);

      return buildStandardResponse(
        `Found ${results.length} matching policy evidence result(s) for "${normalized}".`,
        {
          query: normalized,
          resultCount: results.length,
          results
        },
        results.slice(0, 10).map((result) => ({
          field: result.fieldLabel,
          text: result.snippet,
          source: {
            policy_id: result.policyId,
            policy_title: result.policyTitle,
            page: result.page ?? 0,
            section: result.section
          }
        })),
        results.length > 0 ? 'HIGH' : 'LOW'
      );
    }
  );
}
