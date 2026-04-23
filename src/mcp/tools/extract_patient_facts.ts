import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getPatientCase } from '../../storage/patient-store.js';
import type { PatientFactRecord } from '../../storage/types.js';
import { buildErrorResponse, buildStandardResponse } from '../utils/response_builder.js';

const extractPatientFactsInput = z.object({
  case_id: z.string().describe('Patient case ID — use get_case_summary or the portal APIs to find case IDs')
});

function byCategory(facts: PatientFactRecord[], categories: PatientFactRecord['category'][]) {
  return facts.filter((fact) => categories.includes(fact.category));
}

export function registerExtractPatientFacts(server: McpServer): void {
  server.registerTool(
    'extract_patient_facts',
    {
      description: 'Retrieve structured patient facts for a case. Returns diagnosis, requested drug, prior therapies, prescriber type, insurance/payer info, and clinical notes with source references.',
      inputSchema: extractPatientFactsInput.shape
    },
    async ({ case_id }) => {
      const patientCase = getPatientCase(case_id);
      if (!patientCase) {
        return buildErrorResponse('Patient case not found', {
          hint: 'Use get_case_summary or the portal /api/patients/cases endpoint to find valid case IDs.'
        });
      }

      const extractedFacts = patientCase.extractedFacts ?? [];
      const documentCount = patientCase.documents?.length ?? patientCase.documentFiles.length;

      return buildStandardResponse(
        `Patient case ${case_id} (${patientCase.patientName}): ${extractedFacts.length} extracted facts across ${documentCount} document(s). Diagnosis: ${patientCase.diagnosis}. Drug: ${patientCase.requestedDrug}. Payer: ${patientCase.payer}. Status: ${patientCase.status}.`,
        {
          caseId: patientCase.caseId,
          patientName: patientCase.patientName,
          payer: patientCase.payer,
          requestedDrug: patientCase.requestedDrug,
          diagnosis: patientCase.diagnosis,
          caseStatus: patientCase.status,
          extractedFacts,
          factsByCategory: {
            diagnosis: byCategory(extractedFacts, ['diagnosis']),
            requestedDrug: byCategory(extractedFacts, ['requested_drug']),
            priorTherapies: byCategory(extractedFacts, ['prior_therapy']),
            prescriber: byCategory(extractedFacts, ['prescriber']),
            insurance: byCategory(extractedFacts, ['insurance', 'payer', 'coverage']),
            clinicalNotes: byCategory(extractedFacts, ['clinical_note'])
          },
          documentCount
        },
        extractedFacts.slice(0, 10).map((fact) => ({
          field: fact.category,
          text: fact.evidenceSnippet ?? fact.value,
          source: {
            policy_id: '',
            policy_title: patientCase.patientName,
            page: 0,
            section: fact.label
          }
        })),
        extractedFacts.length > 3 ? 'HIGH' : extractedFacts.length > 0 ? 'MEDIUM' : 'LOW'
      );
    }
  );
}
