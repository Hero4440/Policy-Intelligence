export type { PolicyRecord } from '../../data/schemas/policy.schema.js';

import type { PolicyRecord } from '../../data/schemas/policy.schema.js';

export interface PolicyVersion {
  policyId: string;
  version: number;
  fileName: string;
  savedAt: string;
  record: PolicyRecord;
}

export interface PolicyIndexEntry {
  policyId: string;
  payer: string;
  title: string;
  drugFamily: string;
  versions: number[];
  currentVersion: number;
  currentVersionFile: string;
  lastUpdatedAt: string;
}

export interface PolicyIndex {
  updatedAt: string;
  policies: PolicyIndexEntry[];
}

export interface DiffField {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface DiffRecord {
  policyId: string;
  fromVersion: number;
  toVersion: number;
  timestamp: string;
  changes: DiffField[];
}

export type ChangeSeverity = 'cosmetic' | 'operational' | 'clinical';

export type ChangeType = 'added' | 'removed' | 'updated';

export interface ClassifiedDiffField {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  severity: ChangeSeverity;
  rationale: string;
  changeType: ChangeType;
}

export interface PolicyChangeEvent {
  policyId: string;
  policyTitle: string;
  payer: string;
  drugFamily: string;
  fromVersion: number;
  toVersion: number;
  timestamp: string;
  summary: string;
  severityCounts: Record<ChangeSeverity, number>;
  changes: ClassifiedDiffField[];
  warning?: string;
}

export interface PatientCase {
  caseId: string;
  payer: string;
  requestedDrug: string;
  diagnosis: string;
  patientName: string;
  status: 'missing-docs' | 'ready-for-eval' | 'complete';
  createdAt: string;
  updatedAt: string;
  documentFiles: string[];
  documents?: PatientDocumentRecord[];
  extractedFacts?: PatientFactRecord[];
  extractedFactsFile?: string;
  seeded?: boolean;
}

export type PatientDocumentType =
  | 'clinical_note'
  | 'prior_treatment_history'
  | 'lab_results'
  | 'referral'
  | 'medication_order'
  | 'denial_letter'
  | 'fhir_bundle'
  | 'uploaded_document';

export interface PatientDocumentRecord {
  documentId: string;
  fileName: string;
  documentType: PatientDocumentType;
  contentType: string;
  storedAt: string;
  summary: string;
  factCount: number;
}

export interface PatientFactRecord {
  factId: string;
  category:
    | 'diagnosis'
    | 'medication'
    | 'coverage'
    | 'requested_drug'
    | 'payer'
    | 'prescriber'
    | 'prior_therapy'
    | 'insurance'
    | 'clinical_note';
  label: string;
  value: string;
  sourceDocumentId: string;
  evidenceSnippet?: string;
  confidence: 'high' | 'medium';
}

export type EvaluationChecklistStatus = 'PASS' | 'MISSING' | 'UNKNOWN' | 'NEEDS REVIEW';

export interface PatientFactMatch {
  factId: string;
  label: string;
  value: string;
  sourceDocumentId: string;
  evidenceSnippet?: string;
  confidence: 'high' | 'medium';
}

export interface EvaluationPatientEvidence {
  sourceDocumentId: string;
  sourceDocumentName?: string;
  snippet?: string;
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

export interface EvaluationChecklistItem {
  criterion: string;
  category: string;
  status: EvaluationChecklistStatus;
  rationale: string;
  matchedFact?: PatientFactMatch;
  patientEvidence?: EvaluationPatientEvidence;
  policyEvidence: EvaluationPolicyEvidence;
}

export interface CoverageEvaluation {
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
  checklist: EvaluationChecklistItem[];
}
