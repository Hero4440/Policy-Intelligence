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
    access_token: z.string().optional().describe("Alternate SHARP/OAuth token field"),
    token: z.string().optional().describe("Generic token field alias"),
    patient_id: z.string().optional().describe("FHIR Patient resource ID"),
    patientId: z.string().optional().describe("Camel-case patient ID alias"),
    fhir_server_url: z.string().optional().describe("FHIR server base URL (defaults to env FHIR_SERVER_URL)"),
    server_url: z.string().optional().describe("Alternate FHIR server URL field"),
    sharp_context: z.record(z.string(), z.unknown()).optional().describe("Nested SHARP context object if the platform passes patient/FHIR fields under a wrapper")
  }).passthrough().describe("Patient clinical context. Supports flat or nested SHARP context fields. Include patient ID plus a FHIR bearer token for automated readiness analysis. Without them, returns criteria checklist only.")
});
