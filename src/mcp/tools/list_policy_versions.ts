import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { listPolicyIndex, readPolicyVersion } from '../../storage/policy-store.js';
import { buildErrorResponse, buildStandardResponse } from '../utils/response_builder.js';

const listPolicyVersionsInput = z.object({
  policy_id: z.string().describe('Policy ID as returned by list_policies or upload_policy_document')
});

export function registerListPolicyVersions(server: McpServer): void {
  server.registerTool(
    'list_policy_versions',
    {
      description: 'List all versions of a policy by policyId. Returns version numbers, metadata (savedAt, fileName), and which version is current. Use this before calling diff_policy_versions to discover available versions.',
      inputSchema: listPolicyVersionsInput.shape
    },
    async ({ policy_id }) => {
      const entries = listPolicyIndex();
      const entry = entries.find((item) => item.policyId === policy_id);

      if (!entry) {
        return buildErrorResponse(`Policy not found: ${policy_id}`, {
          available_policy_ids: entries.map((item) => item.policyId),
          hint: 'Use list_policies or list_policy_versions with a valid policy_id from the structured policy store.'
        });
      }

      const versions = entry.versions
        .map((version) => {
          const policyVersion = readPolicyVersion(policy_id, version);
          if (!policyVersion) {
            return null;
          }

          return {
            version,
            fileName: policyVersion.fileName,
            savedAt: policyVersion.savedAt,
            isCurrent: version === entry.currentVersion,
            policyTitle: policyVersion.record.policyTitle ?? policyVersion.record.indication,
            coverageStatus: policyVersion.record.coverageStatus,
            paRequired: policyVersion.record.paRequired
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      return buildStandardResponse(
        `${entry.title} (${entry.payer}) has ${entry.versions.length} version(s). Current: v${entry.currentVersion}. Versions available: ${entry.versions.join(', ')}.`,
        {
          policyId: entry.policyId,
          payer: entry.payer,
          title: entry.title,
          drugFamily: entry.drugFamily,
          currentVersion: entry.currentVersion,
          totalVersions: entry.versions.length,
          versions
        },
        [],
        'HIGH'
      );
    }
  );
}
