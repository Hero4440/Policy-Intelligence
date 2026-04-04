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
  patient_context: z.object({}).passthrough().describe("Patient clinical context (FHIR data) - full integration in Phase 3")
});
