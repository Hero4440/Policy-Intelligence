import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { EvaluationNotFoundError, generateNextSteps } from '../../server/next-steps.js';
import { listEvaluations } from '../../storage/evaluation-store.js';
import { getPatientCase } from '../../storage/patient-store.js';
import { buildErrorResponse, buildStandardResponse } from '../utils/response_builder.js';

const getCaseSummaryInput = z.object({
  case_id: z.string().describe('Patient case ID'),
  include_next_steps: z.boolean().optional().describe('Include next step guidance for the most recent evaluation (requires LLM and may be slower)')
});

export function registerGetCaseSummary(server: McpServer): void {
  server.registerTool(
    'get_case_summary',
    {
      description: 'Get a comprehensive summary of a patient case including patient facts, all coverage evaluations, the most recent evaluation checklist and coverage status, and optional next-step guidance.',
      inputSchema: getCaseSummaryInput.shape
    },
    async ({ case_id, include_next_steps }) => {
      const patientCase = getPatientCase(case_id);
      if (!patientCase) {
        return buildErrorResponse(`Patient case not found: ${case_id}`, {
          hint: 'Use the portal /api/patients/cases endpoint to find valid case IDs.'
        });
      }

      const evaluations = listEvaluations({ caseId: case_id });
      const latestEval = evaluations[0] ?? null;

      try {
        const nextStepsData = include_next_steps && latestEval
          ? await generateNextSteps(latestEval.evalId)
          : null;

        return buildStandardResponse(
          `Case ${case_id} for ${patientCase.patientName}: ${evaluations.length} evaluation(s), status ${patientCase.status}, payer ${patientCase.payer}, diagnosis ${patientCase.diagnosis}, requested drug ${patientCase.requestedDrug}.`,
          {
            caseId: patientCase.caseId,
            patientName: patientCase.patientName,
            payer: patientCase.payer,
            requestedDrug: patientCase.requestedDrug,
            diagnosis: patientCase.diagnosis,
            caseStatus: patientCase.status,
            documentFiles: patientCase.documentFiles,
            documents: patientCase.documents ?? [],
            extractedFacts: patientCase.extractedFacts ?? [],
            evaluations,
            latestEvaluation: latestEval,
            nextSteps: nextStepsData
          },
          latestEval
            ? latestEval.checklist.slice(0, 10).map((item) => ({
                field: item.category,
                text: item.policyEvidence.snippet,
                source: {
                  policy_id: item.policyEvidence.policyId,
                  policy_title: latestEval.policyTitle ?? latestEval.policyId,
                  page: item.policyEvidence.page ?? 0,
                  section: item.policyEvidence.section
                }
              }))
            : [],
          latestEval ? 'HIGH' : (patientCase.extractedFacts?.length ?? 0) > 0 ? 'MEDIUM' : 'LOW'
        );
      } catch (error) {
        if (error instanceof EvaluationNotFoundError) {
          return buildErrorResponse('Most recent evaluation not found for next-step generation.', {
            hint: 'Run evaluate_patient_against_policy first or omit include_next_steps.'
          });
        }

        const message = error instanceof Error ? error.message : String(error);
        return buildErrorResponse(`Failed to build case summary: ${message}`, {
          hint: 'Retry without include_next_steps if the local next-steps generation path is unavailable.'
        });
      }
    }
  );
}
