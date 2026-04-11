export interface AntonRxCoverageMatch {
  planId: string;
  issuerName: string;
  issuerKey: string;
  planName: string;
  planKey: string;
  market: string;
  metalLevel: string;
  sourceKind: 'formulary' | 'structured_policy' | 'uploaded_policy_json' | 'uploaded_csv' | 'uploaded_pdf_policy';
  sourcePosture: 'broad_formulary' | 'deep_medical_policy' | 'uploaded_normalized';
  sourceFile: string;
  sourceEffectiveDate: string;
  matchedDrugQuery: string;
  primaryDrugLabel: string;
  canonicalDrugKey: string;
  alternateDrugLabels: string[];
  alternateDrugKeys: string[];
  coverageLabel: string;
  coveredFlag: boolean;
  priorAuth: boolean;
  stepTherapy: boolean;
  quantityLimit: string;
  ageLimit: string;
  specialtyFlag: boolean;
  nonFormulary: boolean;
  medicalBenefit: boolean;
  therapeuticCategory: string;
  therapeuticSubcategory: string;
  notes: string;
  confidenceLabel: 'high' | 'medium';
  confidenceRationale: string;
  requirementsSummary: string[];
  evidenceSummary: string[];
  normalizedRuleFacets: string[];
}

export interface AntonRxRule {
  planId: string;
  issuerName: string;
  appliesTo: string;
  ruleType: string;
  ruleCode: string;
  ruleName: string;
  ruleText: string;
  sourceFile: string;
  sourcePage: string;
}

export interface AntonRxPlanDrugDetail extends AntonRxCoverageMatch {
  planRules: AntonRxRule[];
  matchedRows: Array<{
    drugNameDisplay: string;
    tier: string;
    requirementsLimits: string;
    priorAuth: boolean;
    stepTherapy: boolean;
    quantityLimit: string;
    ageLimit: string;
    specialtyFlag: boolean;
    nonFormulary: boolean;
    medicalBenefit: boolean;
    sourceFile: string;
    sourceEffectiveDate: string;
  }>;
  structuredPolicy?: {
    indication: string;
    diagnosisRequirements: Array<{ description: string; evidenceText: string; icd10Codes: string[] }>;
    stepTherapy: Array<{ drugName: string; duration: string; evidenceText: string }>;
    otherRequirements: Array<{ category: string; requirement: string; evidenceText: string }>;
  };
}

export interface AntonRxChangeWatch {
  drugQuery: string;
  sourceDates: Array<{ issuerName: string; sourceFile: string; sourceEffectiveDate: string; note: string }>;
  notableSignals: string[];
  summary: {
    planMatches: number;
    issuers: number;
    priorAuthPlans: number;
    stepTherapyPlans: number;
    deepPolicyMatches: number;
    proxySourceMatches: number;
  };
}

export interface IngestedSourceRecord {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sourceKind: 'pdf' | 'json_policy' | 'csv_formulary' | 'jsonl_records' | 'fhir_bundle' | 'unknown';
  status: 'normalized' | 'partial' | 'stored' | 'rejected';
  uploadedAt: string;
  issuerName: string;
  effectiveDate: string;
  detectedDrugs: string[];
  notes: string[];
  summary: string;
  normalizedSnapshotIds: string[];
}

export interface IngestionSummary {
  sourceCount: number;
  normalizedSourceCount: number;
  partialSourceCount: number;
  snapshotCount: number;
}

export interface AntonRxCatalogSummary {
  planCount: number;
  formularyRowCount: number;
  medicalBenefitRowCount: number;
  structuredPolicyCount: number;
  ingestedSnapshotCount: number;
  issuers: string[];
}

export interface IngestionUploadResult {
  accepted: Array<{ source: IngestedSourceRecord; snapshotCount: number }>;
  summary: IngestionSummary;
}

type UploadFilePayload = {
  name: string;
  mimeType: string;
  base64: string;
};

async function fetchJson<T>(input: string): Promise<T> {
  const response = await fetch(input);
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchAntonRxIssuers() {
  return fetchJson<{ issuers: string[] }>('/api/antonrx/issuers');
}

export function fetchAntonRxSummary() {
  return fetchJson<{ summary: AntonRxCatalogSummary }>('/api/antonrx/summary');
}

export function fetchAntonRxCompare(drug: string, issuer?: string) {
  const params = new URLSearchParams({ drug });
  if (issuer) {
    params.set('issuer', issuer);
  }
  return fetchJson<{ drug: string; issuer: string | null; matches: AntonRxCoverageMatch[] }>(`/api/antonrx/compare?${params.toString()}`);
}

export function fetchAntonRxDetail(planId: string, drug: string) {
  const params = new URLSearchParams({ planId, drug });
  return fetchJson<{ detail: AntonRxPlanDrugDetail }>(`/api/antonrx/detail?${params.toString()}`);
}

export function fetchAntonRxChanges(drug: string, issuer?: string) {
  const params = new URLSearchParams({ drug });
  if (issuer) {
    params.set('issuer', issuer);
  }
  return fetchJson<{ changeWatch: AntonRxChangeWatch }>(`/api/antonrx/changes?${params.toString()}`);
}

export function fetchIngestionSources() {
  return fetchJson<{ sources: IngestedSourceRecord[]; summary: IngestionSummary }>('/api/ingestion/sources');
}

export async function uploadIngestionFiles(files: File[]) {
  const payload = await Promise.all(files.map(toUploadPayload));
  const response = await fetch('/api/ingestion/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ files: payload })
  });

  if (!response.ok) {
    throw new Error(`Upload failed with ${response.status}`);
  }

  return response.json() as Promise<IngestionUploadResult>;
}

async function toUploadPayload(file: File): Promise<UploadFilePayload> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.onload = () => {
      const result = String(reader.result || '');
      const encoded = result.includes(',') ? result.split(',')[1] : result;
      resolve(encoded);
    };
    reader.readAsDataURL(file);
  });

  return {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    base64
  };
}

export function summarizeCoverage(match: AntonRxCoverageMatch): string {
  return match.coverageLabel;
}
