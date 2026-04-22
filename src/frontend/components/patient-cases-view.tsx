import { useState } from 'react';
import type { FormEvent } from 'react';
import type { StoredPatientCase } from '../data/patients.js';

type PatientCasesViewProps = {
  cases: StoredPatientCase[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  onCreateCase: (input: {
    patientName: string;
    payer: string;
    requestedDrug: string;
    diagnosis: string;
  }) => Promise<void>;
};

export function PatientCasesView({
  cases,
  selectedCaseId,
  onSelectCase,
  onCreateCase
}: PatientCasesViewProps) {
  const [patientName, setPatientName] = useState('');
  const [payer, setPayer] = useState('');
  const [requestedDrug, setRequestedDrug] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onCreateCase({
        patientName,
        payer,
        requestedDrug,
        diagnosis
      });
      setPatientName('');
      setPayer('');
      setRequestedDrug('');
      setDiagnosis('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create patient case');
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderStatus(status: StoredPatientCase['status']) {
    return status
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  return (
    <>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Patients</p>
          <h2>Synthetic patient cases</h2>
        </div>
        <span className="panel-count">{cases.length} cases</span>
      </div>

      <form className="patient-case-form" onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="patient-name">
          Patient name
        </label>
        <input id="patient-name" className="field-input" value={patientName} onChange={(event) => setPatientName(event.target.value)} required />

        <label className="field-label" htmlFor="patient-payer">
          Payer
        </label>
        <input id="patient-payer" className="field-input" value={payer} onChange={(event) => setPayer(event.target.value)} required />

        <label className="field-label" htmlFor="patient-drug">
          Requested drug
        </label>
        <input id="patient-drug" className="field-input" value={requestedDrug} onChange={(event) => setRequestedDrug(event.target.value)} required />

        <label className="field-label" htmlFor="patient-diagnosis">
          Diagnosis
        </label>
        <input id="patient-diagnosis" className="field-input" value={diagnosis} onChange={(event) => setDiagnosis(event.target.value)} required />

        {error && <div className="chat-error">{error}</div>}

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create case'}
        </button>
      </form>

      <div className="patient-case-list">
        {cases.length === 0 ? (
          <div className="empty-state">No patient cases yet. Create one to start linking documents and extracted facts.</div>
        ) : (
          cases.map((patientCase) => (
            <button
              key={patientCase.caseId}
              type="button"
              className={`patient-case-card${selectedCaseId === patientCase.caseId ? ' patient-case-card-active' : ''}`}
              onClick={() => onSelectCase(patientCase.caseId)}
            >
              <div className="patient-case-card-header">
                <strong>{patientCase.patientName}</strong>
                <span className={`status-badge ${patientCase.status === 'ready-for-eval' ? 'status-green' : patientCase.status === 'complete' ? 'status-blue' : 'status-yellow'}`}>
                  {renderStatus(patientCase.status)}
                </span>
              </div>
              <p>{patientCase.payer} · {patientCase.requestedDrug}</p>
              <small>{patientCase.diagnosis}</small>
            </button>
          ))
        )}
      </div>
    </>
  );
}
