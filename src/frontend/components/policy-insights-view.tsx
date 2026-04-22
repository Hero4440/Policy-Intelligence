import { Fragment } from 'react';
import { PolicyEvidencePanel } from './policy-evidence-panel.js';
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
      <div className="panel-header">
        <div>
          <p className="eyebrow">Policy Insights</p>
          <h2>Heat map and relationship graph</h2>
          <p className="sidebar-copy">
            Filter the policy corpus by drug family, payer, rule type, and version.
          </p>
        </div>
      </div>

      <div className="detail-card">
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

      <div className="detail-card">
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

export function PolicyInsightsView({
  insights,
  loading,
  error,
  selectedEvidence,
  onOpenEvidence,
  onClearEvidence
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
      <div className="panel-header">
        <div>
          <p className="eyebrow">Policy Insights</p>
          <h2>{insights.drugFamily.label}</h2>
          <p className="compare-subtitle">
            Heat map and graph derived from normalized policy rows.
          </p>
        </div>
      </div>

      <div className="compare-legend">
        <InfoChip label="Green" description="Favorable or low-friction posture." />
        <InfoChip label="Yellow" description="Conditional or prior-auth style posture." />
        <InfoChip label="Red" description="Restrictive posture such as step therapy or non-preferred requirements." />
        <InfoChip label="Evidence" description="Click any heat map cell or graph node to inspect supporting evidence." />
      </div>

      <div className="heatmap-grid" style={{ gridTemplateColumns: `220px repeat(${insights.heatmap.payers.length}, minmax(140px, 1fr))` }}>
        <div className="compare-cell compare-header" />
        {insights.heatmap.payers.map((payer) => (
          <div key={payer} className="compare-cell compare-header">
            <strong>{payer}</strong>
          </div>
        ))}

        {insights.heatmap.rows.map((row) => (
          <Fragment key={row.key}>
            <div className="compare-cell compare-label">{row.label}</div>
            {insights.heatmap.payers.map((payer) => {
              const cell = insights.heatmap.cells.find((entry) => entry.payer === payer && entry.ruleType === row.key);
              if (!cell) {
                return (
                  <div key={`${payer}-${row.key}`} className="compare-cell compare-cell-unknown">
                    No signal
                  </div>
                );
              }
              return (
                <button
                  key={`${payer}-${row.key}`}
                  type="button"
                  className={`compare-cell compare-cell-button heatmap-cell ${heatmapClass(cell.status)}`}
                  onClick={() => onOpenEvidence(`${payer} · ${row.label}`, cell.evidence)}
                >
                  <span>{summarizePolicyStatus(cell.status)}</span>
                  <small>{cell.value}</small>
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>

      <section className="detail-section">
        <h3>Knowledge graph</h3>
        <div className="graph-grid">
          {insights.graph.nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              className={`graph-node graph-node-${node.kind}`}
              onClick={() => onOpenEvidence(node.label, node.evidence.length > 0 ? node.evidence : [{
                id: `${node.id}-context`,
                snippet: `${node.label} is represented as a ${node.kind} node in the current policy relationship graph.`,
                document: 'Policy Insights graph',
                page: null,
                section: 'Graph context',
                fieldLabel: 'Graph node',
                policyId: node.id,
                policyVersion: 0,
                payer: insights.drugFamily.label
              }])}
            >
              <strong>{node.label}</strong>
              <small>{node.kind}</small>
            </button>
          ))}
        </div>

        <div className="graph-edge-list">
          {insights.graph.edges.map((edge) => (
            <article key={`${edge.from}-${edge.to}-${edge.label}`} className="detail-card">
              <p>{edge.from} → {edge.to}</p>
              <small>{edge.label}</small>
            </article>
          ))}
        </div>
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
