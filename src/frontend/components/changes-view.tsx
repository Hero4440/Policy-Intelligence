import type { AntonRxChangeWatch } from '../data/policy-types.js';
import { InfoChip } from './info-chip.js';

type ChangesViewProps = {
  changeWatch: AntonRxChangeWatch | null;
};

function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'Unknown') return 'Unknown';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function sourceAge(dateStr: string): 'current' | 'aging' | 'stale' {
  if (!dateStr || dateStr === 'Unknown') return 'stale';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (months <= 6) return 'current';
    if (months <= 18) return 'aging';
    return 'stale';
  } catch {
    return 'stale';
  }
}

const ageLabels: Record<string, string> = {
  current: 'Current',
  aging: 'Aging',
  stale: 'Stale / proxy-era',
};

const ageColors: Record<string, string> = {
  current: 'status-green',
  aging: 'status-yellow',
  stale: 'status-red',
};

export function ChangesView({ changeWatch }: ChangesViewProps) {
  if (!changeWatch) {
    return <div className="empty-state">Choose a drug to inspect version posture and change-watch signals.</div>;
  }

  const { summary, sourceDates, notableSignals, drugQuery } = changeWatch;

  // Group sources by issuer
  const byIssuer = new Map<string, typeof sourceDates>();
  for (const source of sourceDates) {
    const group = byIssuer.get(source.issuerName) ?? [];
    group.push(source);
    byIssuer.set(source.issuerName, group);
  }

  const paRate = summary.planMatches > 0 ? Math.round((summary.priorAuthPlans / summary.planMatches) * 100) : 0;
  const stRate = summary.planMatches > 0 ? Math.round((summary.stepTherapyPlans / summary.planMatches) * 100) : 0;

  return (
    <div className="compare-view">
      <p className="compare-subtitle">
        Change watch for <strong>{drugQuery}</strong>
      </p>

      <div className="compare-legend">
        <InfoChip label="Change Watch" description="Tracks source freshness, coverage posture shifts, and requirement signals across visible plan snapshots for this drug." />
        <InfoChip label="Source Age" description="Current = within 6 months. Aging = 6-18 months. Stale = older proxy-era data that should be refreshed." />
      </div>

      {/* Summary dashboard */}
      <div className="change-dashboard">
        <div className="change-stat">
          <span className="change-stat-num">{summary.planMatches}</span>
          <span className="change-stat-label">Plans visible</span>
        </div>
        <div className="change-stat">
          <span className="change-stat-num">{summary.issuers}</span>
          <span className="change-stat-label">Issuers</span>
        </div>
        <div className="change-stat">
          <span className="change-stat-num">{summary.deepPolicyMatches}</span>
          <span className="change-stat-label">Deep policies</span>
        </div>
        <div className="change-stat">
          <span className="change-stat-num">{paRate}%</span>
          <span className="change-stat-label">Require PA</span>
        </div>
        <div className="change-stat">
          <span className="change-stat-num">{stRate}%</span>
          <span className="change-stat-label">Step therapy</span>
        </div>
      </div>

      {/* Signals */}
      <div className="detail-section">
        <h3>Notable signals</h3>
        {notableSignals.map((signal, i) => (
          <article key={`signal-${i}`} className="detail-card">
            <p>{signal}</p>
          </article>
        ))}
        {summary.proxySourceMatches > 0 && (
          <article className="detail-card" style={{ borderColor: 'var(--color-warning)' }}>
            <p className="detail-card-title">Source freshness alert</p>
            <p>{summary.proxySourceMatches} of {summary.planMatches} plan snapshots come from proxy-era source files (pre-2025). These should be refreshed for production use.</p>
          </article>
        )}
      </div>

      {/* Per-issuer timeline */}
      <div className="detail-section">
        <h3>Source timeline by issuer</h3>
        {[...byIssuer.entries()].map(([issuer, sources]) => (
          <article key={issuer} className="detail-card">
            <div className="readiness-card-header">
              <p className="detail-card-title" style={{ margin: 0 }}>{issuer}</p>
              <span className={`status-badge ${ageColors[sourceAge(sources[0]?.sourceEffectiveDate)]}`}>
                {ageLabels[sourceAge(sources[0]?.sourceEffectiveDate)]}
              </span>
            </div>
            {sources.map((source, i) => (
              <div key={`${source.sourceFile}-${i}`} style={{ marginTop: '8px' }}>
                <p style={{ margin: '0 0 2px', fontSize: '0.9rem' }}>{source.sourceFile}</p>
                <small>Effective: {formatDate(source.sourceEffectiveDate)}</small>
                {source.note && <small style={{ display: 'block' }}>{source.note}</small>}
              </div>
            ))}
          </article>
        ))}
      </div>
    </div>
  );
}
