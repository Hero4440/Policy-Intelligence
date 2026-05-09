import {
  buildCompareColumn,
  canonicalDrugFamily,
  compareRows,
  loadComparablePolicies,
  type ComparablePolicyRecord,
  type PolicyCompareCell,
  type PolicyCompareColumn,
  type PolicyCompareRowKey,
  type PolicyDrugFamilyOption,
  type PolicyEvidenceRef,
  type PolicyStatusTone,
} from './policy-compare.js';

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
  drugFamily: { key: string; label: string };
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

export interface PolicyInsightsOptions {
  drugFamilies: PolicyDrugFamilyOption[];
  payers: string[];
  versions: number[];
  ruleTypes: Array<{ key: PolicyCompareRowKey; label: string }>;
}

interface PolicyInsightsFilters {
  drugFamily: string;
  payers?: string[];
  ruleType?: PolicyCompareRowKey;
  version?: number;
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function uniqueValues<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function normalizeSelectedPayers(
  selected: string[] | undefined,
  available: string[]
): string[] {
  if (!selected || selected.length === 0) {
    return available;
  }
  const filtered = selected.filter((payer) => available.includes(payer));
  return filtered.length > 0 ? filtered : available;
}

function buildGraphFromColumns(
  drugFamily: PolicyDrugFamilyOption,
  columns: PolicyCompareColumn[],
  ruleFilter?: PolicyCompareRowKey
) {
  const nodes: PolicyGraphNode[] = [];
  const edges: PolicyGraphEdge[] = [];
  const seenNodes = new Set<string>();
  const addNode = (node: PolicyGraphNode) => {
    if (seenNodes.has(node.id)) {
      return;
    }
    seenNodes.add(node.id);
    nodes.push(node);
  };

  const drugNodeId = `drug:${drugFamily.key}`;
  addNode({
    id: drugNodeId,
    label: drugFamily.label,
    kind: 'drug',
    evidence: []
  });

  for (const column of columns) {
    const payerNodeId = `payer:${column.payer}`;
    const policyNodeId = `policy:${column.policyId}:v${column.policyVersion}`;

    addNode({
      id: payerNodeId,
      label: column.payer,
      kind: 'payer',
      evidence: []
    });
    addNode({
      id: policyNodeId,
      label: `${column.title} v${column.policyVersion}`,
      kind: 'policy',
      evidence: Object.values(column.cells).flatMap((cell) => cell.evidence).slice(0, 3)
    });

    edges.push({ from: drugNodeId, to: payerNodeId, label: 'covered by payer' });
    edges.push({ from: payerNodeId, to: policyNodeId, label: 'current policy' });

    const cells = Object.values(column.cells).filter((cell) => !ruleFilter || cell.rowKey === ruleFilter);
    for (const cell of cells) {
      const ruleNodeId = `rule:${column.policyId}:${cell.rowKey}`;
      addNode({
        id: ruleNodeId,
        label: compareRows.find((row) => row.key === cell.rowKey)?.label ?? cell.rowKey,
        kind: 'rule',
        evidence: cell.evidence
      });
      edges.push({ from: policyNodeId, to: ruleNodeId, label: cell.status });
    }
  }

  return { nodes, edges };
}

function calculateFrictionScore(cells: Record<PolicyCompareRowKey, PolicyCompareCell>): number {
  const weights: Record<PolicyStatusTone, number> = {
    favorable: 1,
    conditional: 5,
    restrictive: 10,
    unknown: 0,
  };

  let totalScore = 0;
  let count = 0;

  Object.values(cells).forEach((cell) => {
    if (cell.status !== 'unknown') {
      totalScore += weights[cell.status];
      count++;
    }
  });

  return count > 0 ? Math.round((totalScore / count) * 10) / 10 : 0;
}

function getOverallStatus(score: number): PolicyStatusTone {
  if (score === 0) return 'unknown';
  if (score <= 3) return 'favorable';
  if (score <= 7) return 'conditional';
  return 'restrictive';
}

function toInsightCell(payer: string, drug: string, cells: Record<PolicyCompareRowKey, PolicyCompareCell>): PolicyInsightCell {
  const score = calculateFrictionScore(cells);
  const status = getOverallStatus(score);
  const evidence = Object.values(cells).flatMap((cell) => cell.evidence).slice(0, 5);

  return {
    payer,
    drug,
    status,
    score,
    evidence,
  };
}

/** List drug families for insights (requires >= 1 payer, unlike compare which needs >= 2). */
function listInsightsDrugFamilies(versionFilter?: number): PolicyDrugFamilyOption[] {
  const families = new Map<string, { label: string; payers: Set<string> }>();
  for (const policy of loadComparablePolicies(versionFilter)) {
    const family = canonicalDrugFamily(policy.record);
    if (!families.has(family.key)) {
      families.set(family.key, { label: family.label, payers: new Set<string>() });
    }
    families.get(family.key)?.payers.add(policy.record.payer);
  }

  return [...families.entries()]
    .map(([key, value]) => ({
      key,
      label: value.label,
      payers: [...value.payers].sort()
    }))
    .filter((family) => family.payers.length >= 1)
    .sort((left, right) => left.label.localeCompare(right.label));
}

/** Pick best (highest version) column per payer for a given drug family. */
function pickInsightsColumns(
  drugFamilyKey: string,
  selectedPayers: string[],
  versionFilter?: number
): { columns: PolicyCompareColumn[]; drugFamily: PolicyDrugFamilyOption } {
  const allPolicies = loadComparablePolicies(versionFilter);
  const matchingPolicies = allPolicies.filter(
    (policy) => canonicalDrugFamily(policy.record).key === drugFamilyKey
  );

  if (matchingPolicies.length === 0) {
    throw new Error(`No policies found for drug family: ${drugFamilyKey}`);
  }

  const byPayer = new Map<string, ComparablePolicyRecord>();
  for (const policy of matchingPolicies) {
    if (!selectedPayers.includes(policy.record.payer)) {
      continue;
    }
    const existing = byPayer.get(policy.record.payer);
    if (!existing || policy.version > existing.version) {
      byPayer.set(policy.record.payer, policy);
    }
  }

  const columns = selectedPayers
    .map((payer) => byPayer.get(payer))
    .filter((policy): policy is ComparablePolicyRecord => Boolean(policy))
    .map(buildCompareColumn);

  return {
    columns,
    drugFamily: canonicalDrugFamily(matchingPolicies[0].record)
  };
}

export function getPolicyInsightsOptions(): PolicyInsightsOptions {
  const drugFamilies = listInsightsDrugFamilies();
  const policies = loadComparablePolicies().filter((policy) =>
    drugFamilies.some((family) => family.key === canonicalDrugFamily(policy.record).key)
  );
  const payers = uniqueValues(policies.map((policy) => policy.record.payer)).sort();
  const versions = uniqueValues(policies.map((policy) => policy.version)).sort((a, b) => a - b);

  return {
    drugFamilies,
    payers,
    versions,
    ruleTypes: compareRows.map((row) => ({ key: row.key, label: row.label }))
  };
}

export function buildPolicyInsights(filters: PolicyInsightsFilters): PolicyInsightsPayload {
  const options = getPolicyInsightsOptions();

  const drugFamilyKey = normalizeKey(filters.drugFamily);
  if (!drugFamilyKey) {
    throw new Error('drugFamily is required');
  }

  const drugFamilyOption = options.drugFamilies.find((f) => f.key === drugFamilyKey);
  if (!drugFamilyOption) {
    throw new Error(`Unknown drug family: ${filters.drugFamily}`);
  }

  const selectedPayers = normalizeSelectedPayers(filters.payers, drugFamilyOption.payers);
  const { columns, drugFamily } = pickInsightsColumns(drugFamilyKey, selectedPayers, filters.version);

  if (columns.length === 0) {
    throw new Error(`No policy data found for ${filters.drugFamily} with the selected payers`);
  }

  const rowFilter = filters.ruleType;
  const drugs = [drugFamily.label];
  const heatmapCells = columns.map((column) =>
    toInsightCell(column.payer, drugFamily.label, column.cells)
  );

  return {
    drugFamily,
    filters: {
      payerOptions: options.payers,
      versionOptions: options.versions,
      drugOptions: drugs,
    },
    heatmap: {
      payers: columns.map((column) => column.payer),
      drugs,
      cells: heatmapCells,
    },
    graph: buildGraphFromColumns(drugFamily, columns, rowFilter)
  };
}
