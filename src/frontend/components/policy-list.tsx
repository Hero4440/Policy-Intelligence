import { useState } from 'react';
import type { AntonRxCoverageMatch } from '../data/policy-types.js';

type PolicyListProps = {
  matches: AntonRxCoverageMatch[];
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
};

const ITEMS_PER_PAGE = 5;

export function PolicyList({ matches, selectedPlanId, onSelectPlan }: PolicyListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(matches.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentMatches = matches.slice(startIndex, endIndex);

  function sourcePostureLabel(sourcePosture: AntonRxCoverageMatch['sourcePosture']) {
    if (sourcePosture === 'deep_medical_policy') {
      return 'Deep policy evidence';
    }
    if (sourcePosture === 'uploaded_normalized') {
      return 'Uploaded normalized source';
    }
    return 'Formulary breadth';
  }

  function handlePreviousPage() {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }

  function handleNextPage() {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }

  return (
    <>
      <div className="policy-list">
        {currentMatches.map((match) => {
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

      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="pagination-btn"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages} ({matches.length} total)
          </span>
          <button
            type="button"
            className="pagination-btn"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </>
  );
}
