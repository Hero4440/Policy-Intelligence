import type { AntonRxCoverageMatch } from '../data/antonrx.js';
import { InfoChip } from './info-chip.js';

type CompareViewProps = {
  drugQuery: string;
  matches: AntonRxCoverageMatch[];
  selectedPlanId: string;
};

export function CompareView({ drugQuery, matches, selectedPlanId }: CompareViewProps) {
  function sourceLabel(match: AntonRxCoverageMatch) {
    if (match.sourcePosture === 'deep_medical_policy') {
      return 'deep policy';
    }
    if (match.sourcePosture === 'uploaded_normalized') {
      return 'uploaded extract';
    }
    return 'formulary';
  }

  if (matches.length < 2) {
    return (
      <div className="empty-state">
        Add more issuers or use a broader drug query to compare multiple plan responses for {drugQuery}.
      </div>
    );
  }

  return (
    <div className="compare-view">
      <p className="compare-subtitle">
        Comparing {matches.length} plan responses for <strong>{drugQuery}</strong>
      </p>

      <div className="compare-legend">
        <InfoChip label="Coverage" description="Normalized coverage label derived from the loaded source. It reflects whether the drug is listed, excluded, or covered with prior authorization." />
        <InfoChip label="PA" description="Prior authorization signal. This is normalized from structured criteria, formulary requirements, or uploaded policy text." />
        <InfoChip label="Step Therapy" description="Whether the source indicates a step therapy requirement before the requested drug is allowed." />
        <InfoChip label="Confidence" description="How reliable the current record is. High means structured policy evidence; medium means formulary or heuristic uploaded-policy normalization." />
      </div>

      <div className="compare-grid" style={{ gridTemplateColumns: `200px repeat(${matches.length}, 1fr)` }}>
        <div className="compare-cell compare-header" />
        {matches.map((match) => (
          <div
            key={match.planId}
            className={`compare-cell compare-header${match.planId === selectedPlanId ? ' compare-active' : ''}`}
          >
            <strong>{match.issuerName}</strong>
            <small>{match.planName}</small>
          </div>
        ))}

        <div className="compare-cell compare-label">Coverage</div>
        {matches.map((match) => (
          <div key={match.planId} className="compare-cell">
            {match.coverageLabel}
          </div>
        ))}

        <div className="compare-cell compare-label">PA</div>
        {matches.map((match) => (
          <div key={match.planId} className="compare-cell">
            {match.priorAuth ? 'Required' : 'Not signaled'}
          </div>
        ))}

        <div className="compare-cell compare-label">Step Therapy</div>
        {matches.map((match) => (
          <div key={match.planId} className="compare-cell">
            {match.stepTherapy ? 'Yes' : 'No'}
          </div>
        ))}

        <div className="compare-cell compare-label">Requirements</div>
        {matches.map((match) => (
          <div key={match.planId} className="compare-cell">
            {(match.requirementsSummary ?? []).slice(0, 2).join('; ') || 'No specific requirement summary loaded'}
          </div>
        ))}

        <div className="compare-cell compare-label">Rule Facets</div>
        {matches.map((match) => (
          <div key={match.planId} className="compare-cell">
            {(match.normalizedRuleFacets ?? []).length > 0 ? (match.normalizedRuleFacets ?? []).join(', ') : 'No normalized facets'}
          </div>
        ))}

        <div className="compare-cell compare-label">Source</div>
        {matches.map((match) => (
          <div key={match.planId} className="compare-cell compare-codes">
            {match.sourceFile}
          </div>
        ))}

        <div className="compare-cell compare-label">Confidence</div>
        {matches.map((match) => (
          <div key={match.planId} className="compare-cell">
            {match.confidenceLabel} · {sourceLabel(match)}
          </div>
        ))}
      </div>
    </div>
  );
}
