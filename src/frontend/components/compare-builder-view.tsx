import type { AntonRxCoverageMatch } from '../data/policy-types.js';
import { InfoChip } from './info-chip.js';

type CompareBuilderViewProps = {
  matches: AntonRxCoverageMatch[];
  selectedPlanIds: string[];
  onTogglePlan: (planId: string) => void;
  onSelectTopPlans: () => void;
};

export function CompareBuilderView({
  matches,
  selectedPlanIds,
  onTogglePlan,
  onSelectTopPlans
}: CompareBuilderViewProps) {
  return (
    <div className="compare-builder">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Compare Page</p>
          <h2>Select plans to compare</h2>
          <p className="sidebar-copy">
            Choose up to 4 plan responses for a tighter analyst view of coverage posture, restrictions, normalized rule facets, and confidence.
          </p>
        </div>
        <span className="panel-count">{selectedPlanIds.length} selected</span>
      </div>

      <div className="compare-legend">
        <InfoChip label="Selected" description="Only selected plans appear in the compare matrix. Keep this to 2 to 4 plans for a readable judge demo." />
        <InfoChip label="Rule Facets" description="Normalized restriction categories inferred from structured rules or uploaded policy text." />
      </div>

      <div className="compare-builder-actions">
        <button type="button" className="ask-submit" onClick={onSelectTopPlans}>
          Select top 4
        </button>
        <span className="sidebar-copy">Compare works best with 2 to 4 plans.</span>
      </div>

      <div className="compare-builder-list">
        {matches.map((match) => {
          const selected = selectedPlanIds.includes(match.planId);
          const normalizedRuleFacets = match.normalizedRuleFacets ?? [];
          return (
            <label
              key={match.planId}
              className={`compare-builder-card${selected ? ' compare-builder-card-selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onTogglePlan(match.planId)}
              />
              <div>
                <strong>{match.issuerName}</strong>
                <p>{match.planName}</p>
                <small>
                  {match.coverageLabel} · {match.confidenceLabel} · {normalizedRuleFacets.join(', ') || 'no normalized facets'}
                </small>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
