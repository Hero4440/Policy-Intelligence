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
  drug: string;
  status: PolicyStatusTone;
  score: number;
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
    drugOptions: string[];
  };
  heatmap: {
    payers: string[];
    drugs: string[];
    cells: PolicyInsightCell[];
  };
  graph: {
    nodes: PolicyGraphNode[];
    edges: PolicyGraphEdge[];
  };
}

export type ChangeSeverity = 'cosmetic' | 'operational' | 'clinical';

export type ChangeType = 'added' | 'removed' | 'updated';

export interface ClassifiedDiffField {
  field: string;
  oldValue: string;
  newValue: string;
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

export interface PolicyChangesResponse {
  events: PolicyChangeEvent[];
  filters: {
    payerOptions: string[];
    drugFamilyOptions: string[];
    severityOptions: ChangeSeverity[];
  };
}

export interface PolicyVersionDiffPayload {
  policyId: string;
  policyTitle: string;
  payer: string;
  drugFamily: string;
  fromVersion: number;
  toVersion: number;
  structuredChanges: ClassifiedDiffField[];
  textSnapshot: {
    leftLabel: string;
    rightLabel: string;
    leftText: string;
    rightText: string;
  };
}

export interface EvidenceSearchResult {
  policyId: string;
  policyTitle: string;
  payer: string;
  drugFamily: string;
  version: number;
  fieldLabel: string;
  snippet: string;
  document: string;
  page: number | null;
  section: string;
}

export interface EvidenceSearchResponse {
  query: string;
  count: number;
  results: EvidenceSearchResult[];
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

export function fetchPolicyInsightsOptions() {
  return fetchJson<PolicyCompareOptions>('/api/policies/insights/options');
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

export function fetchPolicyChanges(filters?: {
  policyId?: string;
  payer?: string;
  drugFamily?: string;
  severity?: ChangeSeverity;
}) {
  const params = new URLSearchParams();
  if (filters?.policyId) {
    params.set('policyId', filters.policyId);
  }
  if (filters?.payer) {
    params.set('payer', filters.payer);
  }
  if (filters?.drugFamily) {
    params.set('drugFamily', filters.drugFamily);
  }
  if (filters?.severity) {
    params.set('severity', filters.severity);
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : '';
  return fetchJson<PolicyChangesResponse>(`/api/policies/changes${suffix}`);
}

export function fetchPolicyChangesForPolicy(policyId: string) {
  return fetchJson<PolicyChangesResponse>(`/api/policies/${policyId}/changes`);
}

export function fetchPolicyVersionDiff(policyId: string, fromVersion: number, toVersion: number) {
  const params = new URLSearchParams({
    fromVersion: String(fromVersion),
    toVersion: String(toVersion)
  });
  return fetchJson<PolicyVersionDiffPayload>(`/api/policies/${policyId}/diff?${params.toString()}`);
}

export function fetchEvidenceSearch(query: string) {
  return fetchJson<EvidenceSearchResponse>(`/api/evidence/search?q=${encodeURIComponent(query)}`);
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

export function summarizeChangeSeverity(severity: ChangeSeverity): string {
  switch (severity) {
    case 'cosmetic':
      return 'Cosmetic';
    case 'operational':
      return 'Operational';
    case 'clinical':
      return 'Clinical';
  }
}
