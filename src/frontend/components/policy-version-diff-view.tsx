import { summarizeChangeSeverity, type PolicyVersionDiffPayload } from '../data/policies.js';

type PolicyVersionDiffViewProps = {
  diff: PolicyVersionDiffPayload | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
};

function severityClass(severity: 'cosmetic' | 'operational' | 'clinical'): string {
  switch (severity) {
    case 'cosmetic':
      return 'change-severity-cosmetic';
    case 'operational':
      return 'change-severity-operational';
    case 'clinical':
      return 'change-severity-clinical';
  }
}

export function PolicyVersionDiffView({
  diff,
  loading,
  error,
  onBack
}: PolicyVersionDiffViewProps) {
  if (loading) {
    return <div className="empty-state">Loading version diff…</div>;
  }

  if (error) {
    return <div className="chat-error">{error}</div>;
  }

  if (!diff) {
    return <div className="empty-state">Choose a version pair from the Changes timeline to open the diff.</div>;
  }

  return (
    <div className="compare-view">
      <div className="panel-header panel-header-spaced">
        <div>
          <p className="eyebrow">Version Diff</p>
          <h2>{diff.policyTitle}</h2>
          <p className="compare-subtitle">
            {diff.payer} · {diff.drugFamily} · v{diff.fromVersion} → v{diff.toVersion}
          </p>
        </div>
        <button type="button" className="page-nav-btn" onClick={onBack}>
          Back to Changes
        </button>
      </div>

      <section className="detail-section">
        <h3>Structured changes</h3>
        <div className="changes-table-wrapper">
          <table className="changes-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Old Value</th>
                <th>New Value</th>
                <th>Severity</th>
                <th>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {diff.structuredChanges.map((change, index) => (
                <tr key={`${change.field}-${index}`}>
                  <td className="changes-field-cell">{change.field}</td>
                  <td><pre>{change.oldValue}</pre></td>
                  <td><pre>{change.newValue}</pre></td>
                  <td>
                    <span className={`changes-severity-chip ${severityClass(change.severity)}`}>
                      {summarizeChangeSeverity(change.severity)}
                    </span>
                  </td>
                  <td>{change.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="detail-section">
        <h3>Side-by-side text snapshots</h3>
        <div className="version-diff-grid">
          <article className="version-diff-panel">
            <header className="version-diff-header">
              <strong>{diff.textSnapshot.leftLabel}</strong>
            </header>
            <pre className="version-diff-text">{diff.textSnapshot.leftText}</pre>
          </article>
          <article className="version-diff-panel">
            <header className="version-diff-header">
              <strong>{diff.textSnapshot.rightLabel}</strong>
            </header>
            <pre className="version-diff-text">{diff.textSnapshot.rightText}</pre>
          </article>
        </div>
      </section>
    </div>
  );
}
