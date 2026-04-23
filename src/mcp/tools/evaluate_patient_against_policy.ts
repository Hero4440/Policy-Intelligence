import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { evaluatePatientCaseAgainstPolicy } from '../../server/patient-evaluation.js';
import { listPolicyIndex } from '../../storage/policy-store.js';
import { saveEvaluation } from '../../storage/evaluation-store.js';
import { getPatientCase, updateCaseStatus } from '../../storage/patient-store.js';
import { buildErrorResponse, buildStandardResponse } from '../utils/response_builder.js';

const evaluatePatientAgainstPolicyInput = z.object({
  case_id: z.string().describe('Patient case ID'),
  policy_id: z.string().describe('Policy ID to evaluate against'),
  policy_version: z.number().int().optional().describe('Policy version (omit for current version)')
});

export function registerEvaluatePatientAgainstPolicy(server: McpServer): void {
  server.registerTool(
    'evaluate_patient_against_policy',
    {
      description: 'Run a coverage evaluation for a patient case against a specific policy version. Returns coverage status and a full requirement checklist with policy evidence links. Saves the evaluation and returns an evalId.',
      inputSchema: evaluatePatientAgainstPolicyInput.shape
    },
    async ({ case_id, policy_id, policy_version }) => {
      const patientCase = getPatientCase(case_id);
      if (!patientCase) {
        return buildErrorResponse(`Patient case not found: ${case_id}`, {
          hint: 'Use get_case_summary or the portal /api/patients/cases endpoint to find valid case IDs.'
        });
      }

      const policyEntry = listPolicyIndex().find((item) => item.policyId === policy_id);
      if (!policyEntry) {
        return buildErrorResponse(`Policy not found: ${policy_id}`, {
          available_policy_ids: listPolicyIndex().map((item) => item.policyId),
          hint: 'Use list_policy_versions to find valid policy IDs and versions.'
        });
      }

      const resolvedVersion = policy_version ?? policyEntry.currentVersion;

      try {
        const payload = evaluatePatientCaseAgainstPolicy({
          caseId: case_id,
          policyId: policy_id,
          policyVersion: resolvedVersion
        });
        const evaluation = saveEvaluation(payload);
        updateCaseStatus(case_id, 'complete');

        const statusCounts = payload.checklist.reduce(
          (counts, item) => {
            counts[item.status] += 1;
            return counts;
          },
          { PASS: 0, MISSING: 0, UNKNOWN: 0, 'NEEDS REVIEW': 0 }
        );

        return buildStandardResponse(
          `Evaluation ${evaluation.evalId} saved for case ${case_id} against ${payload.policyTitle}. Coverage status: ${payload.coverageStatus}. Checklist results: ${statusCounts.PASS} PASS, ${statusCounts.MISSING} MISSING, ${statusCounts.UNKNOWN} UNKNOWN, ${statusCounts['NEEDS REVIEW']} NEEDS REVIEW.`,
          {
            evalId: evaluation.evalId,
            caseId: evaluation.caseId,
            patientName: evaluation.patientName,
            policyId: evaluation.policyId,
            policyVersion: evaluation.policyVersion,
            policyTitle: evaluation.policyTitle,
            payer: evaluation.payer,
            drugFamily: evaluation.drugFamily,
            requestedDrug: evaluation.requestedDrug,
            diagnosis: evaluation.diagnosis,
            coverageStatus: evaluation.coverageStatus,
            evaluatedAt: evaluation.evaluatedAt,
            checklistSummary: statusCounts,
            checklist: evaluation.checklist
          },
          evaluation.checklist.slice(0, 10).map((item) => ({
            field: item.category,
            text: item.policyEvidence.snippet,
            source: {
              policy_id: item.policyEvidence.policyId,
              policy_title: evaluation.policyTitle ?? evaluation.policyId,
              page: item.policyEvidence.page ?? 0,
              section: item.policyEvidence.section
            }
          })),
          evaluation.coverageStatus === 'Covered' ? 'HIGH' : 'MEDIUM'
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return buildErrorResponse(`Failed to evaluate patient case: ${message}`, {
          hint: 'Verify the case and policy exist and that the selected policy version is valid.'
        });
      }
    }
  );
}
