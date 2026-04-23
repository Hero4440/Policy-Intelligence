import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { listPolicyIndex, readPolicyVersion } from '../../storage/policy-store.js';
import { buildErrorResponse, buildStandardResponse } from '../utils/response_builder.js';

const getPolicyEvidenceInput = z.object({
  policy_id: z.string().describe('Policy ID — use list_policies or list_policy_versions to find IDs'),
  version: z.number().int().optional().describe('Version number (omit for current version)'),
  field_filter: z.string().optional().describe("Filter by field label: 'diagnosis_requirements', 'step_therapy', 'other_requirements', or a substring match")
});

type PolicyEvidenceEntry = {
  fieldLabel: string;
  snippet: string;
  document: string;
  page: number | null;
  section: string;
};

export function registerGetPolicyEvidence(server: McpServer): void {
  server.registerTool(
    'get_policy_evidence',
    {
      description: "Retrieve evidence snippets for a specific policy. Optionally filter by field label. Every result includes policy name, payer, page, section, and the exact evidence text.",
      inputSchema: getPolicyEvidenceInput.shape
    },
    async ({ policy_id, version, field_filter }) => {
      const entries = listPolicyIndex();
      const entry = entries.find((item) => item.policyId === policy_id);

      if (!entry) {
        return buildErrorResponse(`Policy not found: ${policy_id}`, {
          available_policy_ids: entries.map((item) => item.policyId),
          hint: 'Use list_policies or list_policy_versions to find a valid policy_id.'
        });
      }

      const resolvedVersion = version ?? entry.currentVersion;
      const policyVersion = readPolicyVersion(policy_id, resolvedVersion);
      if (!policyVersion) {
        return buildErrorResponse(`Policy version not found: ${policy_id} v${resolvedVersion}`, {
          hint: 'Call list_policy_versions to see which versions are available for this policy.'
        });
      }

      const record = policyVersion.record;
      const evidenceItems: PolicyEvidenceEntry[] = [
        ...record.diagnosisRequirements
          .filter((item) => Boolean(item.evidenceText))
          .map((item) => ({
            fieldLabel: 'diagnosis_requirements',
            snippet: item.evidenceText,
            document: item.source.document,
            page: item.source.page,
            section: item.source.section
          })),
        ...record.stepTherapy
          .filter((item) => Boolean(item.evidenceText))
          .map((item) => ({
            fieldLabel: 'step_therapy',
            snippet: item.evidenceText,
            document: item.source.document,
            page: item.source.page,
            section: item.source.section
          })),
        ...record.otherRequirements
          .filter((item) => Boolean(item.evidenceText))
          .map((item) => ({
            fieldLabel: item.category || 'other_requirements',
            snippet: item.evidenceText,
            document: item.source.document,
            page: item.source.page,
            section: item.source.section
          }))
      ];

      const filtered = field_filter
        ? evidenceItems.filter((item) => item.fieldLabel.toLowerCase().includes(field_filter.toLowerCase()))
        : evidenceItems;

      return buildStandardResponse(
        `Found ${filtered.length} evidence item(s) for ${record.policyTitle ?? record.indication} (${record.payer}), version ${resolvedVersion}${field_filter ? `, field: ${field_filter}` : ''}.`,
        {
          policyId: policy_id,
          policyTitle: record.policyTitle ?? record.indication,
          payer: record.payer,
          version: resolvedVersion,
          evidenceCount: filtered.length,
          evidence: filtered.map((item) => ({
            fieldLabel: item.fieldLabel,
            snippet: item.snippet,
            document: item.document,
            page: item.page,
            section: item.section
          }))
        },
        filtered.slice(0, 10).map((item) => ({
          field: item.fieldLabel,
          text: item.snippet,
          source: {
            policy_id,
            policy_title: record.policyTitle ?? record.indication,
            page: item.page ?? 0,
            section: item.section
          }
        })),
        filtered.length > 0 ? 'HIGH' : 'LOW'
      );
    }
  );
}
