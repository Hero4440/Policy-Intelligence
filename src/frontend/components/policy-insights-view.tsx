import { Fragment } from 'react';
import { PolicyEvidencePanel } from './policy-evidence-panel.js';
import { KnowledgeGraph } from './knowledge-graph.js';
import { summarizePolicyStatus, type PolicyCompareOptions, type PolicyEvidenceRef, type PolicyInsightsPayload, type PolicyStatusTone } from '../data/policies.js';
import { InfoChip } from './info-chip.js';

type PolicyInsightsBuilderProps = {
  options: PolicyCompareOptions | null;
  payerOptions: string[];
  selectedDrugFamily: string;
  selectedPayers: string[];
  selectedRuleType: string;
  selectedVersion: string;
  onDrugFamilyChange: (value: string) => void;
  onTogglePayer: (payer: string) => void;
  onRuleTypeChange: (value: string) => void;
  onVersionChange: (value: string) => void;
};

type PolicyInsightsViewProps = {
  insights: PolicyInsightsPayload | null;
  loading: boolean;
  error: string | null;
  selectedEvidence: { title: string; evidence: PolicyEvidenceRef[] } | null;
  onOpenEvidence: (title: string, evidence: PolicyEvidenceRef[]) => void;
  onClearEvidence: () => void;
  // Filter props
  options: PolicyCompareOptions | null;
  payerOptions: string[];
  selectedDrugFamily: string;
  selectedPayers: string[];
  selectedRuleType: string;
  selectedVersion: string;
  onDrugFamilyChange: (value: string) => void;
  onTogglePayer: (payer: string) => void;
  onRuleTypeChange: (value: string) => void;
  onVersionChange: (value: string) => void;
};

export function PolicyInsightsBuilder({
  options,
  payerOptions,
  selectedDrugFamily,
  selectedPayers,
  selectedRuleType,
  selectedVersion,
  onDrugFamilyChange,
  onTogglePayer,
  onRuleTypeChange,
  onVersionChange
}: PolicyInsightsBuilderProps) {
  if (!options) {
    return <div className="empty-state">Loading policy insight options…</div>;
  }

  return (
    <div className="compare-builder">
      <div className="panel-header sidebar-section-header">
        <div>
          <p className="eyebrow">Policy Insights</p>
          <h2>Heat map and relationship graph</h2>
          <p className="sidebar-copy">
            Filter the policy corpus by drug family, payer, rule type, and version.
          </p>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-field">
          <label className="field-label" htmlFor="insights-drug-family">
            Drug Family
          </label>
          <select
            id="insights-drug-family"
            className="field-input"
            value={selectedDrugFamily}
            onChange={(event) => onDrugFamilyChange(event.target.value)}
          >
            {options.drugFamilies.map((family) => (
              <option key={family.key} value={family.key}>
                {family.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label className="field-label" htmlFor="insights-rule-type">
            Rule Type
          </label>
          <select
            id="insights-rule-type"
            className="field-input"
            value={selectedRuleType}
            onChange={(event) => onRuleTypeChange(event.target.value)}
          >
            <option value="">All rule types</option>
            {options.ruleTypes.map((ruleType) => (
              <option key={ruleType.key} value={ruleType.key}>
                {ruleType.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="detail-card">
        <label className="field-label" htmlFor="insights-version">
          Version
        </label>
        <select
          id="insights-version"
          className="field-input"
          value={selectedVersion}
          onChange={(event) => onVersionChange(event.target.value)}
        >
          <option value="">Current version</option>
          {options.versions.map((version) => (
            <option key={version} value={String(version)}>
              Version {version}
            </option>
          ))}
        </select>
      </div>

      <div className="compare-builder-list">
        {payerOptions.map((payer) => {
          const selected = selectedPayers.includes(payer);
          return (
            <label
              key={payer}
              className={`compare-builder-card${selected ? ' compare-builder-card-selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onTogglePayer(payer)}
              />
              <div>
                <strong>{payer}</strong>
                <p>{selected ? 'Included in insights' : 'Click to include in insights'}</p>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function heatmapClass(status: PolicyStatusTone): string {
  switch (status) {
    case 'favorable':
      return 'heatmap-cell-favorable';
    case 'conditional':
      return 'heatmap-cell-conditional';
    case 'restrictive':
      return 'heatmap-cell-restrictive';
    case 'unknown':
      return 'heatmap-cell-unknown';
  }
}

function getOverallStatus(score: number): PolicyStatusTone {
  if (score === 0) return 'unknown';
  if (score <= 3) return 'favorable';
  if (score <= 7) return 'conditional';
  return 'restrictive';
}

export function PolicyInsightsView({
  insights,
  loading,
  error,
  selectedEvidence,
  onOpenEvidence,
  onClearEvidence,
  options,
  payerOptions,
  selectedDrugFamily,
  selectedPayers,
  selectedRuleType,
  selectedVersion,
  onDrugFamilyChange,
  onTogglePayer,
  onRuleTypeChange,
  onVersionChange
}: PolicyInsightsViewProps) {
  if (loading) {
    return <div className="empty-state">Loading policy insights…</div>;
  }

  if (error) {
    return <div className="chat-error">{error}</div>;
  }

  if (!insights) {
    return <div className="empty-state">Select a drug family to view the policy heat map and relationship graph.</div>;
  }

  return (
    <div className="compare-view">
      <div className="panel-header sidebar-section-header">
        <div>
          <p className="eyebrow">Policy Insights</p>
          <h2>Heat map and relationship graph</h2>
          <p className="sidebar-copy">
            Filter the policy corpus by drug family, payer, rule type, and version.
          </p>
        </div>
      </div>

      {options && (
        <div className="workspace-top-filters">
          <div className="filter-row">
            <div className="filter-field">
              <label className="field-label" htmlFor="insights-drug-family">
                Drug Family
              </label>
              <select
                id="insights-drug-family"
                className="field-input"
                value={selectedDrugFamily}
                onChange={(event) => onDrugFamilyChange(event.target.value)}
              >
                {options.drugFamilies.map((family) => (
                  <option key={family.key} value={family.key}>
                    {family.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label className="field-label" htmlFor="insights-rule-type">
                Rule Type
              </label>
              <select
                id="insights-rule-type"
                className="field-input"
                value={selectedRuleType}
                onChange={(event) => onRuleTypeChange(event.target.value)}
              >
                <option value="">All rule types</option>
                {options.ruleTypes.map((ruleType) => (
                  <option key={ruleType.key} value={ruleType.key}>
                    {ruleType.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label className="field-label" htmlFor="insights-version">
                Version
              </label>
              <select
                id="insights-version"
                className="field-input"
                value={selectedVersion}
                onChange={(event) => onVersionChange(event.target.value)}
              >
                <option value="">Current version</option>
                {options.versions.map((version) => (
                  <option key={version} value={String(version)}>
                    Version {version}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="compare-builder-list">
            {payerOptions.map((payer) => {
              const selected = selectedPayers.includes(payer);
              return (
                <label
                  key={payer}
                  className={`compare-builder-card${selected ? ' compare-builder-card-selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onTogglePayer(payer)}
                  />
                  <div>
                    <strong>{payer}</strong>
                    <p>{selected ? 'Included in insights' : 'Click to include in insights'}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="compare-legend">
        <InfoChip label="Green" description="Low friction (score 1-3). Favorable or minimal restrictions." />
        <InfoChip label="Yellow" description="Medium friction (score 4-7). Conditional or prior-auth requirements." />
        <InfoChip label="Red" description="High friction (score 8-10). Restrictive policies like step therapy." />
        <InfoChip label="Evidence" description="Click any cell to inspect supporting evidence and policy details." />
      </div>

      <div className="heatmap-grid" style={{ gridTemplateColumns: `220px repeat(${insights.heatmap.drugs.length}, minmax(140px, 1fr)) 100px` }}>
        <div className="compare-cell compare-header" />
        {insights.heatmap.drugs.map((drug) => (
          <div key={drug} className="compare-cell compare-header">
            <strong>{drug}</strong>
          </div>
        ))}
        <div className="compare-cell compare-header">
          <strong>Row Avg</strong>
        </div>

        {insights.heatmap.payers.map((payer) => {
          const payerCells = insights.heatmap.cells.filter((entry) => entry.payer === payer);
          const avgScore = payerCells.length > 0
            ? Math.round((payerCells.reduce((sum, cell) => sum + cell.score, 0) / payerCells.length) * 10) / 10
            : 0;
          const avgStatus = getOverallStatus(avgScore);

          return (
            <Fragment key={payer}>
              <div className="compare-cell compare-label">{payer}</div>
              {insights.heatmap.drugs.map((drug) => {
                const cell = insights.heatmap.cells.find((entry) => entry.payer === payer && entry.drug === drug);
                if (!cell) {
                  return (
                    <div key={`${payer}-${drug}`} className="compare-cell compare-cell-unknown">
                      No data
                    </div>
                  );
                }
                return (
                  <button
                    key={`${payer}-${drug}`}
                    type="button"
                    className={`compare-cell compare-cell-button heatmap-cell ${heatmapClass(cell.status)}`}
                    onClick={() => onOpenEvidence(`${payer} · ${drug}`, cell.evidence)}
                  >
                    <span>{summarizePolicyStatus(cell.status)}</span>
                    <small>{cell.score}</small>
                  </button>
                );
              })}
              <div className={`compare-cell heatmap-cell ${heatmapClass(avgStatus)}`}>
                <small>{avgScore}</small>
              </div>
            </Fragment>
          );
        })}
      </div>

      <section className="detail-section">
        <h3>Knowledge graph</h3>
        <p className="sidebar-copy" style={{ marginBottom: '1rem' }}>
          Interactive visualization of relationships between drugs, payers, policies, and rules. 
          Click nodes to view evidence, drag to reposition, scroll to zoom.
        </p>
        <KnowledgeGraph
          nodes={insights.graph.nodes}
          edges={insights.graph.edges}
          onNodeClick={(node) => {
            onOpenEvidence(
              node.label,
              node.evidence.length > 0
                ? node.evidence
                : [{
                    id: `${node.id}-context`,
                    snippet: `${node.label} is represented as a ${node.kind} node in the current policy relationship graph.`,
                    document: 'Policy Insights graph',
                    page: null,
                    section: 'Graph context',
                    fieldLabel: 'Graph node',
                    policyId: node.id,
                    policyVersion: 0,
                    payer: insights.drugFamily.label
                  }]
            );
          }}
        />
      </section>

      {selectedEvidence && (
        <PolicyEvidencePanel
          title={selectedEvidence.title}
          evidence={selectedEvidence.evidence}
          onClose={onClearEvidence}
        />
      )}
    </div>
  );
}
