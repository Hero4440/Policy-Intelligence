import { useMemo } from 'react';
import {
  demoPatients,
  getPatientById,
  extractPatientData,
  matchPatientAgainstPolicy,
  DISCLAIMER,
} from '../data/patients.js';
import type { CriterionResult, ClinicalStatus } from '../data/patients.js';
type PolicyLike = {
  indication?: string;
  diagnosisRequirements: Array<{ description: string; evidenceText: string; icd10Codes: string[] }>;
  stepTherapy: Array<{ drugName: string; duration: string; evidenceText: string }>;
  otherRequirements: Array<{ category: string; requirement: string; evidenceText: string }>;
};

type ReadinessViewProps = {
  policy: PolicyLike;
  selectedPatientId: string;
  onPatientChange: (id: string) => void;
};

const statusColors: Record<ClinicalStatus, string> = {
  appears_to_match: 'status-green',
  may_be_missing: 'status-red',
  documentation_may_be_needed: 'status-yellow',
  unable_to_verify: 'status-gray',
};

const statusLabels: Record<ClinicalStatus, string> = {
  appears_to_match: 'Appears to match',
  may_be_missing: 'May be missing',
  documentation_may_be_needed: 'Docs needed',
  unable_to_verify: 'Unable to verify',
};

export function ReadinessView({ policy, selectedPatientId, onPatientChange }: ReadinessViewProps) {
  const patient = getPatientById(selectedPatientId);

  const results: CriterionResult[] = useMemo(() => {
    if (!patient) return [];
    const data = extractPatientData(patient.bundle);
    return matchPatientAgainstPolicy(data, policy as any);
  }, [patient, policy]);

  const matchCount = results.filter(r => r.status === 'appears_to_match').length;
  const total = results.length;

  return (
    <div className="readiness-view">
      <div className="readiness-patient-select">
        <label className="field-label" htmlFor="patient-select-readiness">
          Demo Patient
        </label>
        <select
          id="patient-select-readiness"
          className="field-input"
          value={selectedPatientId}
          onChange={e => onPatientChange(e.target.value)}
        >
          <option value="">Select a patient...</option>
          {demoPatients.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.payer}
            </option>
          ))}
        </select>
      </div>

      {patient && results.length > 0 && (
        <>
          <div className="readiness-summary-bar">
            <div className="readiness-score">
              <span className="readiness-num">{matchCount}</span>
              <span className="readiness-denom">/{total}</span>
              <span className="readiness-label">criteria appear met</span>
            </div>
            <div className="readiness-bar-track">
              <div
                className="readiness-bar-fill"
                style={{ width: `${total > 0 ? (matchCount / total) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="readiness-results">
            {results.map((result, i) => (
              <article key={i} className={`detail-card readiness-card`}>
                <div className="readiness-card-header">
                  <span className={`status-badge ${statusColors[result.status]}`}>
                    {statusLabels[result.status]}
                  </span>
                  <span className="readiness-category">{result.category}</span>
                </div>
                <p className="detail-card-title">{result.criterion}</p>
                <p>{result.message}</p>
                {result.matched_data && (
                  <small className="readiness-evidence">
                    Matched: {JSON.stringify(result.matched_data)}
                  </small>
                )}
              </article>
            ))}
          </div>

          <p className="readiness-disclaimer">{DISCLAIMER}</p>
        </>
      )}

      {patient && results.length === 0 && (
        <div className="empty-state">No criteria to evaluate for this policy.</div>
      )}

      {!patient && (
        <div className="empty-state">Select a demo patient to check readiness against this policy.</div>
      )}
    </div>
  );
}
