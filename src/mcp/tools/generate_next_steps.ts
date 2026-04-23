import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { EvaluationNotFoundError, generateNextSteps } from '../../server/next-steps.js';
import { buildErrorResponse, buildStandardResponse } from '../utils/response_builder.js';

const generateNextStepsInput = z.object({
  eval_id: z.string().describe('Evaluation ID returned from evaluate_patient_against_policy')
});

export function registerGenerateNextSteps(server: McpServer): void {
  server.registerTool(
    'generate_next_steps',
    {
      description: 'Generate role-specific next steps for a coverage evaluation, including clinic actions, missing documentation, a patient explanation, and a payer-analyst breakdown.',
      inputSchema: generateNextStepsInput.shape
    },
    async ({ eval_id }) => {
      try {
        const payload = await generateNextSteps(eval_id);
        return buildStandardResponse(
          `Next steps for evaluation ${eval_id}: ${payload.clinicNextSteps.length} action(s), ${payload.missingDocsList.length} missing document(s). ${payload.clinicNextSteps.slice(0, 2).join('. ')}.`,
          {
            evalId: payload.evalId,
            clinicNextSteps: payload.clinicNextSteps,
            missingDocsList: payload.missingDocsList.map((item) => ({
              criterion: item.criterion,
              category: item.category,
              rationale: item.rationale,
              policyEvidence: item.policyEvidence
            })),
            patientExplanation: payload.patientExplanation,
            payerAnalystBreakdown: {
              summary: payload.payerAnalystBreakdown.summary,
              criteriaAnalysis: payload.payerAnalystBreakdown.criteriaAnalysis
            }
          },
          payload.missingDocsList.slice(0, 10).map((item) => ({
            field: item.criterion,
            text: item.policyEvidence.snippet,
            source: {
              policy_id: '',
              policy_title: item.category,
              page: item.policyEvidence.page ?? 0,
              section: item.policyEvidence.section
            }
          })),
          payload.missingDocsList.length === 0 ? 'HIGH' : 'MEDIUM'
        );
      } catch (error) {
        if (error instanceof EvaluationNotFoundError) {
          return buildErrorResponse('Evaluation not found. Run evaluate_patient_against_policy first.', {
            hint: 'Provide a valid evalId from a previous evaluation.'
          });
        }

        const message = error instanceof Error ? error.message : String(error);
        return buildErrorResponse(`Failed to generate next steps: ${message}`, {
          hint: 'Retry with a valid evalId and ensure the local next-steps dependencies are available.'
        });
      }
    }
  );
}
