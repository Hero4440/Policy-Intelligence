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

export const listPoliciesInput = z.object({
  payer: z.string().optional().describe("Filter by payer name (e.g., 'UHC', 'BCBS-NC', 'Cigna', 'Aetna'). Case-insensitive. Omit to list all payers."),
  drug_family: z.string().optional().describe("Filter by drug generic name (e.g., 'bevacizumab', 'rituximab', 'adalimumab') or brand/biosimilar name (e.g., 'Avastin', 'Mvasi'). Resolved via drug alias system. Omit to list all drugs.")
});

export const policySummaryInput = z.object({
  policy_id: z.string().optional().describe("Direct policy ID (e.g., 'bcbs-nc-bevacizumab-oncology', 'uhc-adalimumab-ra')"),
  payer: z.string().optional().describe("Payer name (e.g., 'BCBS-NC', 'Cigna'). Use with 'drug' param."),
  drug: z.string().optional().describe("Drug name - brand, generic, or biosimilar (e.g., 'bevacizumab', 'Avastin', 'Mvasi'). Use with 'payer' param.")
});

export const compareDrugInput = z.object({
  drug_family: z.string().describe("Drug family to compare across payers. Accepts generic name (e.g., 'bevacizumab'), brand name (e.g., 'Avastin'), or biosimilar name (e.g., 'Mvasi'). Resolved via drug alias system to canonical generic name.")
});

export const askPolicyQuestionInput = z.object({
  question: z.string().describe('Natural language question about loaded medical insurance policies. Examples: "What prior authorization criteria does Cigna require for rituximab?", "Compare bevacizumab coverage across payers", "What policies are loaded?"')
});
