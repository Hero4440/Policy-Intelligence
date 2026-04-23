import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildPolicyVersionDiff } from '../../server/policy-changes.js';
import { buildErrorResponse, buildStandardResponse } from '../utils/response_builder.js';

const diffPolicyVersionsInput = z.object({
  policy_id: z.string().describe('Policy ID to diff'),
  from_version: z.number().int().describe('Starting policy version number'),
  to_version: z.number().int().describe('Ending policy version number')
});

export function registerDiffPolicyVersions(server: McpServer): void {
  server.registerTool(
    'diff_policy_versions',
    {
      description: 'Compare two versions of a policy and return structured field-level changes including change type, severity, rationale, and before/after values.',
      inputSchema: diffPolicyVersionsInput.shape
    },
    async ({ policy_id, from_version, to_version }) => {
      try {
        const diff = buildPolicyVersionDiff(policy_id, from_version, to_version);
        const severityCounts = diff.structuredChanges.reduce(
          (counts, change) => {
            counts[change.severity] += 1;
            return counts;
          },
          { cosmetic: 0, operational: 0, clinical: 0 }
        );

        return buildStandardResponse(
          `${diff.policyTitle} (${diff.payer}) changed from v${from_version} to v${to_version} with ${diff.structuredChanges.length} field change(s): ${severityCounts.clinical} clinical, ${severityCounts.operational} operational, ${severityCounts.cosmetic} cosmetic.`,
          {
            policyId: diff.policyId,
            policyTitle: diff.policyTitle,
            payer: diff.payer,
            drugFamily: diff.drugFamily,
            fromVersion: diff.fromVersion,
            toVersion: diff.toVersion,
            severityCounts,
            changes: diff.structuredChanges,
            textSnapshot: diff.textSnapshot
          },
          [],
          'HIGH'
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return buildErrorResponse(`Unable to diff policy versions: ${message}`, {
          hint: 'Verify the policy_id and version numbers exist and choose two different saved versions.'
        });
      }
    }
  );
}
