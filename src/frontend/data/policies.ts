export type PolicyCompareRowKey =
  | 'preferred_products'
  | 'non_preferred_products'
  | 'prior_auth'
  | 'step_therapy'
  | 'covered_indications'
  | 'key_restrictions';

export type PolicyStatusTone = 'favorable' | 'conditional' | 'restrictive' | 'unknown';

export interface PolicyEvidenceRef {
  id: string;
  snippet: string;
  document: string;
  page: number | null;
  section: string;
  fieldLabel: string;
  policyId: string;
  policyVersion: number;
  payer: string;
}

export interface PolicyCompareCell {
  rowKey: PolicyCompareRowKey;
  value: string;
  status: PolicyStatusTone;
  evidence: PolicyEvidenceRef[];
}

export interface PolicyCompareColumn {
  policyId: string;
  payer: string;
  plan: string;
  title: string;
  drugFamilyKey: string;
  drugFamilyLabel: string;
  policyVersion: number;
  effectiveDate: string;
  coverageStatus: 'covered' | 'covered-with-pa' | 'excluded';
  cells: Record<PolicyCompareRowKey, PolicyCompareCell>;
}

export interface PolicyCompareRowDefinition {
  key: PolicyCompareRowKey;
  label: string;
  description: string;
}

export interface PolicyCompareHighlight {
  kind: string;
  text: string;
  payers: string[];
  rowKeys: PolicyCompareRowKey[];
}

export interface PolicyDrugFamilyOption {
  key: string;
  label: string;
  payers: string[];
}

export interface PolicyCompareOptions {
  drugFamilies: PolicyDrugFamilyOption[];
  payers: string[];
  versions: number[];
  ruleTypes: Array<{ key: PolicyCompareRowKey; label: string }>;
}

export interface PolicyComparePayload {
  drugFamily: PolicyDrugFamilyOption;
  selectedPayers: string[];
  rows: PolicyCompareRowDefinition[];
  columns: PolicyCompareColumn[];
  highlights: PolicyCompareHighlight[];
}

export interface PolicyInsightCell {
  payer: string;
  ruleType: PolicyCompareRowKey;
  status: PolicyStatusTone;
  value: string;
  evidence: PolicyEvidenceRef[];
}

export interface PolicyGraphNode {
  id: string;
  label: string;
  kind: 'drug' | 'payer' | 'policy' | 'rule';
  evidence: PolicyEvidenceRef[];
}

export interface PolicyGraphEdge {
  from: string;
  to: string;
  label: string;
}

export interface PolicyInsightsPayload {
  drugFamily: PolicyDrugFamilyOption;
  filters: {
    payerOptions: string[];
    versionOptions: number[];
    ruleTypeOptions: Array<{ key: PolicyCompareRowKey; label: string }>;
  };
  heatmap: {
    rows: Array<{ key: PolicyCompareRowKey; label: string }>;
    payers: string[];
    cells: PolicyInsightCell[];
  };
  graph: {
    nodes: PolicyGraphNode[];
    edges: PolicyGraphEdge[];
  };
}

async function fetchJson<T>(input: string): Promise<T> {
  const response = await fetch(input);
  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const payload = await response.json() as { error?: string };
      if (payload.error) {
        message = payload.error;
      }
    } catch {
      // Ignore JSON parse failures and keep the default message.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function fetchPolicyCompareOptions() {
  return fetchJson<PolicyCompareOptions>('/api/policies/compare/options');
}

export function fetchPolicyComparison(input: {
  drugFamily: string;
  payers: string[];
  version?: number;
}) {
  const params = new URLSearchParams({
    drugFamily: input.drugFamily,
    payers: input.payers.join(',')
  });
  if (input.version !== undefined) {
    params.set('version', String(input.version));
  }
  return fetchJson<PolicyComparePayload>(`/api/policies/compare?${params.toString()}`);
}

export function fetchPolicyInsights(input: {
  drugFamily: string;
  payers?: string[];
  ruleType?: PolicyCompareRowKey;
  version?: number;
}) {
  const params = new URLSearchParams({
    drugFamily: input.drugFamily
  });
  if (input.payers && input.payers.length > 0) {
    params.set('payers', input.payers.join(','));
  }
  if (input.ruleType) {
    params.set('ruleType', input.ruleType);
  }
  if (input.version !== undefined) {
    params.set('version', String(input.version));
  }
  return fetchJson<PolicyInsightsPayload>(`/api/policies/insights?${params.toString()}`);
}

export function summarizePolicyStatus(status: PolicyStatusTone): string {
  switch (status) {
    case 'favorable':
      return 'Favorable';
    case 'conditional':
      return 'Conditional';
    case 'restrictive':
      return 'Restrictive';
    case 'unknown':
      return 'Unknown';
  }
}
