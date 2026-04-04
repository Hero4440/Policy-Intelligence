import { z } from 'zod';

export const drugCoverageInput = z.object({
  plan: z.string().describe("Payer/plan name (e.g., 'UHC', 'Aetna', 'Cigna')"),
  drug: z.string().describe("Drug name - brand (Humira), generic (adalimumab), or biosimilar (Amjevita)")
});

export const priorAuthCriteriaInput = z.object({
  plan: z.string().describe("Payer/plan name (e.g., 'UHC', 'Aetna', 'Cigna')"),
  drug: z.string().describe("Drug name - brand (Humira), generic (adalimumab), or biosimilar (Amjevita)")
});

export const patientReadinessInput = z.object({
  plan: z.string().describe("Payer/plan name (e.g., 'UHC', 'Aetna', 'Cigna')"),
  drug: z.string().describe("Drug name - brand (Humira), generic (adalimumab), or biosimilar (Amjevita)"),
  patient_context: z.object({
    fhir_token: z.string().optional().describe("FHIR bearer token from Prompt Opinion SHARP extension"),
    patient_id: z.string().optional().describe("FHIR Patient resource ID"),
    fhir_server_url: z.string().optional().describe("FHIR server base URL (defaults to env FHIR_SERVER_URL)")
  }).passthrough().describe("Patient clinical context. Include fhir_token and patient_id for automated readiness analysis. Without them, returns criteria checklist only.")
});
