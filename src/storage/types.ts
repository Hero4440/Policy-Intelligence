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
  extractedFactsFile?: string;
}

export interface EvaluationChecklistItem {
  criterion: string;
  status: 'PASS' | 'MISSING' | 'UNKNOWN' | 'NEEDS REVIEW';
  matchedFact?: string;
  evidenceSnippet?: string;
}

export interface CoverageEvaluation {
  evalId: string;
  caseId: string;
  policyId: string;
  policyVersion: number;
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
