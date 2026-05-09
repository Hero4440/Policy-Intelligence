import {
  buildPolicyComparison,
  compareRows,
  getPolicyCompareOptions,
  type PolicyCompareCell,
  type PolicyCompareRowKey,
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

interface PolicyInsightsFilters {
  drugFamily: string;
  payers?: string[];
  ruleType?: PolicyCompareRowKey;
  version?: number;
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

function buildGraph(payload: ReturnType<typeof buildPolicyComparison>, ruleFilter?: PolicyCompareRowKey) {
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

  const drugNodeId = `drug:${payload.drugFamily.key}`;
  addNode({
    id: drugNodeId,
    label: payload.drugFamily.label,
    kind: 'drug',
    evidence: []
  });

  for (const column of payload.columns) {
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
  // Calculate friction score based on rule statuses
  // favorable = 1, conditional = 5, restrictive = 10, unknown = 0
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

export function buildPolicyInsights(filters: PolicyInsightsFilters): PolicyInsightsPayload {
  const options = getPolicyCompareOptions();
  const selectedPayers = normalizeSelectedPayers(filters.payers, options.payers);
  const comparePayload = buildPolicyComparison(filters.drugFamily, selectedPayers, filters.version);
  const rowFilter = filters.ruleType;

  // Build heatmap: payers (rows) x drugs (columns)
  const drugs = [comparePayload.drugFamily.label]; // For now, single drug family
  const heatmapCells = comparePayload.columns.map((column) =>
    toInsightCell(column.payer, comparePayload.drugFamily.label, column.cells)
  );

  return {
    drugFamily: comparePayload.drugFamily,
    filters: {
      payerOptions: options.payers,
      versionOptions: options.versions,
      drugOptions: drugs,
    },
    heatmap: {
      payers: comparePayload.columns.map((column) => column.payer),
      drugs,
      cells: heatmapCells,
    },
    graph: buildGraph(comparePayload, rowFilter)
  };
}
