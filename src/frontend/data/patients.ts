import patient01 from '../../../data/patients/demo-patients/patient-01-full-match.json';
import patient02 from '../../../data/patients/demo-patients/patient-02-partial-match.json';
import patient03 from '../../../data/patients/demo-patients/patient-03-poor-match.json';

export { extractPatientData } from '../../mcp/fhir/extractors.js';
export { matchPatientAgainstPolicy } from '../../mcp/matching/criteria_matcher.js';
export type { CriterionResult } from '../../mcp/matching/criteria_matcher.js';
export type { ClinicalStatus } from '../../mcp/matching/language.js';
export { DISCLAIMER } from '../../mcp/matching/language.js';

export interface DemoPatient {
  id: string;
  name: string;
  summary: string;
  payer: string;
  bundle: any;
}

export interface StoredPatientDocument {
  documentId: string;
  fileName: string;
  documentType:
    | 'clinical_note'
    | 'prior_treatment_history'
    | 'lab_results'
    | 'referral'
    | 'medication_order'
    | 'denial_letter'
    | 'fhir_bundle'
    | 'uploaded_document';
  contentType: string;
  storedAt: string;
  summary: string;
  factCount: number;
}

export interface StoredPatientFact {
  factId: string;
  category: string;
  label: string;
  value: string;
  sourceDocumentId: string;
  evidenceSnippet?: string;
  confidence: 'high' | 'medium';
}

export interface EvaluationPolicyEvidence {
  policyId: string;
  policyVersion: number;
  document: string;
  page: number | null;
  section: string;
  fieldLabel: string;
  snippet: string;
}

export interface EvaluationPatientEvidence {
  sourceDocumentId: string;
  sourceDocumentName?: string;
  snippet?: string;
}

export interface EvaluationChecklistFact {
  factId: string;
  label: string;
  value: string;
  sourceDocumentId: string;
  evidenceSnippet?: string;
  confidence: 'high' | 'medium';
}

export interface StoredEvaluationChecklistItem {
  criterion: string;
  category: string;
  status: 'PASS' | 'MISSING' | 'UNKNOWN' | 'NEEDS REVIEW';
  rationale: string;
  matchedFact?: EvaluationChecklistFact;
  patientEvidence?: EvaluationPatientEvidence;
  policyEvidence: EvaluationPolicyEvidence;
}

export interface StoredCoverageEvaluation {
  evalId: string;
  caseId: string;
  policyId: string;
  policyVersion: number;
  policyTitle?: string;
  payer?: string;
  drugFamily?: string;
  patientName?: string;
  requestedDrug?: string;
  diagnosis?: string;
  evaluatedAt: string;
  coverageStatus:
    | 'Covered'
    | 'PA Required'
    | 'Likely Eligible but Docs Missing'
    | 'Not Covered'
    | 'Preferred Alternative Required'
    | 'Unclear';
  checklist: StoredEvaluationChecklistItem[];
}

export interface MissingDocItem {
  criterion: string;
  category: string;
  rationale: string;
  policyEvidence: {
    snippet: string;
    document: string;
    page: number | null;
    section: string;
    fieldLabel: string;
  };
}

export interface PayerAnalystCriterion {
  criterion: string;
  status: string;
  policyEvidence: {
    snippet: string;
    document: string;
    page: number | null;
    section: string;
  };
  clinicAction: string;
}

export interface PayerAnalystBreakdown {
  summary: string;
  criteriaAnalysis: PayerAnalystCriterion[];
}

export interface NextStepsPayload {
  evalId: string;
  clinicNextSteps: string[];
  missingDocsList: MissingDocItem[];
  patientExplanation: string;
  payerAnalystBreakdown: PayerAnalystBreakdown;
}

export interface PatientPolicyOption {
  policyId: string;
  payer: string;
  title: string;
  drugFamily: string;
  versions: number[];
  currentVersion: number;
  relevance: 'recommended' | 'possible' | 'other';
  matchReasons: string[];
}

export interface StoredPatientCase {
  caseId: string;
  payer: string;
  requestedDrug: string;
  diagnosis: string;
  patientName: string;
  status: 'missing-docs' | 'ready-for-eval' | 'complete';
  createdAt: string;
  updatedAt: string;
  documentFiles: string[];
  documents: StoredPatientDocument[];
  extractedFacts: StoredPatientFact[];
  seeded?: boolean;
}

export const demoPatients: DemoPatient[] = [
  {
    id: 'patient-01',
    name: 'Sarah Anderson',
    summary: 'RA with seropositive dx, active methotrexate, UHC coverage',
    payer: 'UHC',
    bundle: patient01,
  },
  {
    id: 'patient-02',
    name: 'Michael Chen',
    summary: 'RA unspecified dx, recent methotrexate start, UHC coverage',
    payer: 'UHC',
    bundle: patient02,
  },
  {
    id: 'patient-03',
    name: 'Linda Washington',
    summary: 'RA unspecified dx, no DMARD history, Aetna coverage',
    payer: 'Aetna',
    bundle: patient03,
  },
];

export function getPatientById(id: string): DemoPatient | undefined {
  return demoPatients.find((patient) => patient.id === id);
}

export async function fetchPatientCases(): Promise<{ cases: StoredPatientCase[] }> {
  const response = await fetch('/api/patients/cases');
  if (!response.ok) {
    throw new Error('Failed to load patient cases');
  }

  return response.json() as Promise<{ cases: StoredPatientCase[] }>;
}

export async function fetchPatientCase(caseId: string): Promise<{ case: StoredPatientCase }> {
  const response = await fetch(`/api/patients/cases/${encodeURIComponent(caseId)}`);
  if (!response.ok) {
    throw new Error('Failed to load patient case');
  }

  return response.json() as Promise<{ case: StoredPatientCase }>;
}

export async function createStoredPatientCase(input: {
  patientName: string;
  payer: string;
  requestedDrug: string;
  diagnosis: string;
}): Promise<{ case: StoredPatientCase }> {
  const response = await fetch('/api/patients/cases', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Failed to create case' }));
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to create case');
  }

  return response.json() as Promise<{ case: StoredPatientCase }>;
}

export async function uploadPatientDocument(input: {
  caseId: string;
  fileName: string;
  content: string;
  contentType?: string;
  documentType?: string;
}): Promise<{ case: StoredPatientCase; document: StoredPatientDocument }> {
  const response = await fetch(`/api/patients/cases/${encodeURIComponent(input.caseId)}/documents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileName: input.fileName,
      content: input.content,
      contentType: input.contentType,
      documentType: input.documentType
    })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Failed to upload document' }));
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to upload document');
  }

  return response.json() as Promise<{ case: StoredPatientCase; document: StoredPatientDocument }>;
}

export async function fetchPatientPolicyOptions(caseId: string): Promise<{ caseId: string; policies: PatientPolicyOption[] }> {
  const response = await fetch(`/api/patients/cases/${encodeURIComponent(caseId)}/policy-options`);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Failed to load patient policy options' }));
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to load patient policy options');
  }

  return response.json() as Promise<{ caseId: string; policies: PatientPolicyOption[] }>;
}

export async function fetchCaseEvaluations(caseId: string): Promise<{ evaluations: StoredCoverageEvaluation[] }> {
  const response = await fetch(`/api/patients/cases/${encodeURIComponent(caseId)}/evaluations`);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Failed to load case evaluations' }));
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to load case evaluations');
  }

  return response.json() as Promise<{ evaluations: StoredCoverageEvaluation[] }>;
}

export async function createCaseEvaluation(input: {
  caseId: string;
  policyId: string;
  policyVersion: number;
}): Promise<{ evaluation: StoredCoverageEvaluation }> {
  const response = await fetch(`/api/patients/cases/${encodeURIComponent(input.caseId)}/evaluations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      policyId: input.policyId,
      policyVersion: input.policyVersion
    })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Failed to create evaluation' }));
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to create evaluation');
  }

  return response.json() as Promise<{ evaluation: StoredCoverageEvaluation }>;
}

export async function fetchNextSteps(evalId: string): Promise<NextStepsPayload> {
  const response = await fetch(`/api/patients/evaluations/${encodeURIComponent(evalId)}/next-steps`);
  if (!response.ok) {
    throw new Error(`Failed to load next steps: ${response.status}`);
  }

  return response.json() as Promise<NextStepsPayload>;
}

export async function fetchEvaluation(evalId: string): Promise<{ evaluation: StoredCoverageEvaluation }> {
  const response = await fetch(`/api/patients/evaluations/${encodeURIComponent(evalId)}`);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: 'Failed to load evaluation' }));
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to load evaluation');
  }

  return response.json() as Promise<{ evaluation: StoredCoverageEvaluation }>;
}
