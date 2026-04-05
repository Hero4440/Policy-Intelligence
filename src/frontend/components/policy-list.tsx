import type { AntonRxCoverageMatch } from '../data/antonrx.js';

type PolicyListProps = {
  matches: AntonRxCoverageMatch[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
};

export function PolicyList({ matches, selectedPlanId, onSelectPlan }: PolicyListProps) {
  function sourcePostureLabel(sourcePosture: AntonRxCoverageMatch['sourcePosture']) {
    if (sourcePosture === 'deep_medical_policy') {
      return 'Deep policy evidence';
    }
    if (sourcePosture === 'uploaded_normalized') {
      return 'Uploaded normalized source';
    }
    return 'Formulary breadth';
  }

  return (
    <div className="policy-list">
      {matches.map((match) => {
        const selected = match.planId === selectedPlanId;

        return (
          <button
            key={match.planId}
            className={`policy-card${selected ? ' policy-card-selected' : ''}`}
            onClick={() => onSelectPlan(match.planId)}
            type="button"
          >
            <div className="policy-card-header">
              <span className="policy-pill">{match.issuerName}</span>
              <span className={`coverage-chip ${!match.coveredFlag ? 'coverage-not-covered' : match.priorAuth ? 'coverage-covered-with-pa' : 'coverage-covered'}`}>
                {match.coverageLabel}
              </span>
            </div>
            <h3>
              {match.planName}
              <span>{match.primaryDrugLabel}</span>
            </h3>
            <p>{match.market || 'Market unspecified'}</p>
            <div className="policy-card-meta">
              <span>{match.metalLevel || match.sourceKind}</span>
              <span>
                {match.priorAuth ? 'PA' : 'No PA'}
                {match.stepTherapy ? ' · ST' : ''}
              </span>
            </div>
            <div className="policy-card-meta">
              <span>{sourcePostureLabel(match.sourcePosture)}</span>
              <span>Confidence: {match.confidenceLabel}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
