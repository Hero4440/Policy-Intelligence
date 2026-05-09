import { Fragment } from 'react';
import { PolicyEvidencePanel } from './policy-evidence-panel.js';
import { summarizePolicyStatus, type PolicyComparePayload, type PolicyEvidenceRef } from '../data/policies.js';
import { InfoChip } from './info-chip.js';

type PolicyCompareViewProps = {
  comparison: PolicyComparePayload | null;
  loading: boolean;
  error: string | null;
  selectedEvidence: { title: string; evidence: PolicyEvidenceRef[] } | null;
  onOpenEvidence: (title: string, evidence: PolicyEvidenceRef[]) => void;
  onClearEvidence: () => void;
};

function coverageChipClass(status: string): string {
  if (status === 'covered') {
    return 'coverage-covered';
  }
  if (status === 'covered-with-pa') {
    return 'coverage-covered-with-pa';
  }
  return 'coverage-not-covered';
}

export function PolicyCompareView({
  comparison,
  loading,
  error,
  selectedEvidence,
  onOpenEvidence,
  onClearEvidence
}: PolicyCompareViewProps) {
  if (loading) {
    return <div className="empty-state">Loading policy comparison…</div>;
  }

  if (error) {
    return <div className="chat-error">{error}</div>;
  }

  if (!comparison || !comparison.columns) {
    return <div className="empty-state">Select a drug family and at least two payers to compare policies.</div>;
  }

  const columnTemplate = `220px repeat(${comparison.columns.length}, minmax(240px, 1fr))`;

  return (
    <div className="compare-view">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Policy Compare</p>
          <h2>{comparison.drugFamily.label}</h2>
          <p className="compare-subtitle">
            Comparing {comparison.columns.length} payer policies with evidence-backed cells.
          </p>
        </div>
      </div>

      <div className="compare-legend">
        <InfoChip label="Highlights" description="Deterministic summaries of material differences across selected payers." />
        <InfoChip label="Evidence" description="Click any comparison cell to inspect the supporting snippet and page reference." />
      </div>

      <div className="compare-highlight-list">
        {comparison.highlights.length > 0 ? (
          comparison.highlights.map((highlight) => (
            <article key={`${highlight.kind}-${highlight.text}`} className="compare-highlight-card">
              <p>{highlight.text}</p>
              <small>{highlight.payers.join(', ')}</small>
            </article>
          ))
        ) : (
          <article className="compare-highlight-card compare-highlight-muted">
            <p>Selected payers look materially similar for current loaded rules.</p>
          </article>
        )}
      </div>

      <div className="compare-grid" style={{ gridTemplateColumns: columnTemplate }}>
        <div className="compare-cell compare-header" />
        {comparison.columns.map((column) => (
          <div key={column.policyId} className="compare-cell compare-header">
            <strong>{column.payer}</strong>
            <small>{column.title}</small>
            <span className={`status-badge ${coverageChipClass(column.coverageStatus)}`}>
              {column.coverageStatus}
            </span>
          </div>
        ))}

        {comparison.rows.map((row) => (
          <Fragment key={row.key}>
            <div className="compare-cell compare-label">
              {row.label}
              <small className="compare-label-help">{row.description}</small>
            </div>
            {comparison.columns.map((column) => {
              const cell = column.cells[row.key];
              return (
                <button
                  key={`${column.policyId}-${row.key}`}
                  type="button"
                  className={`compare-cell compare-cell-button compare-cell-${cell.status}`}
                  onClick={() => onOpenEvidence(`${column.payer} · ${row.label}`, cell.evidence)}
                >
                  <span>{cell.value}</span>
                  <small>{summarizePolicyStatus(cell.status)}</small>
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>

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
