import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
  fetchNextSteps,
  type NextStepsPayload,
  type PatientPolicyOption,
  type StoredCoverageEvaluation,
  type StoredPatientCase
} from '../data/patients.js';

type PatientCaseDetailViewProps = {
  patientCase: StoredPatientCase | null;
  policyOptions: PatientPolicyOption[];
  evaluations: StoredCoverageEvaluation[];
  selectedPolicyId: string;
  selectedPolicyVersion: number | '';
  policyOptionsLoading: boolean;
  evaluationsLoading: boolean;
  onPolicyChange: (policyId: string) => void;
  onPolicyVersionChange: (version: number) => void;
  onRunEvaluation: (input: { caseId: string; policyId: string; policyVersion: number }) => Promise<void>;
  onUploadDocument: (input: {
    caseId: string;
    fileName: string;
    content: string;
    contentType?: string;
    documentType?: string;
  }) => Promise<void>;
};

type PatientEvaluationTab = 'coverage' | 'next-steps';

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return value;
  }
}

function titleCaseStatus(value: string): string {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function evaluationStatusTone(status: StoredCoverageEvaluation['coverageStatus']): string {
  if (status === 'Covered') {
    return 'status-green';
  }
  if (status === 'PA Required' || status === 'Likely Eligible but Docs Missing') {
    return 'status-yellow';
  }
  if (status === 'Preferred Alternative Required' || status === 'Not Covered') {
    return 'status-red';
  }
  return 'status-gray';
}

function checklistStatusTone(status: 'PASS' | 'MISSING' | 'UNKNOWN' | 'NEEDS REVIEW'): string {
  if (status === 'PASS') {
    return 'status-green';
  }
  if (status === 'MISSING') {
    return 'status-red';
  }
  if (status === 'UNKNOWN') {
    return 'status-gray';
  }
  return 'status-yellow';
}

export function PatientCaseDetailView({
  patientCase,
  policyOptions,
  evaluations,
  selectedPolicyId,
  selectedPolicyVersion,
  policyOptionsLoading,
  evaluationsLoading,
  onPolicyChange,
  onPolicyVersionChange,
  onRunEvaluation,
  onUploadDocument
}: PatientCaseDetailViewProps) {
  const [textFileName, setTextFileName] = useState('clinical-note.txt');
  const [documentType, setDocumentType] = useState('clinical_note');
  const [textContent, setTextContent] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeEvaluationTab, setActiveEvaluationTab] = useState<PatientEvaluationTab>('coverage');
  const [nextSteps, setNextSteps] = useState<NextStepsPayload | null>(null);
  const [nextStepsLoading, setNextStepsLoading] = useState(false);
  const [nextStepsError, setNextStepsError] = useState<string | null>(null);

  const factsByDocument = useMemo(() => {
    if (!patientCase) {
      return new Map<string, number>();
    }

    const counts = new Map<string, number>();
    for (const fact of patientCase.extractedFacts) {
      counts.set(fact.sourceDocumentId, (counts.get(fact.sourceDocumentId) ?? 0) + 1);
    }
    return counts;
  }, [patientCase]);

  const selectedPolicy = useMemo(
    () => policyOptions.find((option) => option.policyId === selectedPolicyId) ?? null,
    [policyOptions, selectedPolicyId]
  );
  const latestEvaluation = evaluations[0] ?? null;

  useEffect(() => {
    setNextSteps(null);
    setNextStepsError(null);
    setActiveEvaluationTab('coverage');
  }, [latestEvaluation?.evalId]);

  useEffect(() => {
    if (!latestEvaluation || nextSteps || nextStepsLoading) {
      return;
    }

    let cancelled = false;
    setNextStepsLoading(true);
    setNextStepsError(null);

    void fetchNextSteps(latestEvaluation.evalId)
      .then((payload) => {
        if (cancelled) {
          return;
        }
        setNextSteps(payload);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setNextStepsError(error instanceof Error ? error.message : 'Failed to load next steps');
      })
      .finally(() => {
        if (!cancelled) {
          setNextStepsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [latestEvaluation, nextSteps, nextStepsLoading]);

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!patientCase || !file) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const content = await file.text();
      await onUploadDocument({
        caseId: patientCase.caseId,
        fileName: file.name,
        content,
        contentType: file.type || 'text/plain',
        documentType
      });
      event.target.value = '';
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleTextSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!patientCase || !textContent.trim()) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      await onUploadDocument({
        caseId: patientCase.caseId,
        fileName: textFileName,
        content: textContent,
        contentType: 'text/plain',
        documentType
      });
      setTextContent('');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload note');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRunEvaluation() {
    if (!patientCase || !selectedPolicyId || selectedPolicyVersion === '') {
      return;
    }

    setIsEvaluating(true);
    setEvaluationError(null);
    try {
      await onRunEvaluation({
        caseId: patientCase.caseId,
        policyId: selectedPolicyId,
        policyVersion: selectedPolicyVersion
      });
    } catch (error) {
      setEvaluationError(error instanceof Error ? error.message : 'Failed to run evaluation');
    } finally {
      setIsEvaluating(false);
    }
  }

  if (!patientCase) {
    return <div className="empty-state">Select a patient case to inspect documents, extracted facts, and coverage evaluation.</div>;
  }

  return (
    <div className="patient-case-detail">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Patient Case</p>
          <h2>{patientCase.patientName}</h2>
        </div>
        <span className={`status-badge ${patientCase.status === 'ready-for-eval' ? 'status-green' : patientCase.status === 'complete' ? 'status-blue' : 'status-yellow'}`}>
          {titleCaseStatus(patientCase.status)}
        </span>
      </div>

      <div className="detail-summary-card">
        <div>
          <span className="detail-label">Payer</span>
          <strong>{patientCase.payer}</strong>
        </div>
        <div>
          <span className="detail-label">Requested Drug</span>
          <strong>{patientCase.requestedDrug}</strong>
        </div>
        <div>
          <span className="detail-label">Diagnosis</span>
          <strong>{patientCase.diagnosis}</strong>
        </div>
      </div>

      <div className="detail-section">
        <h3>Upload documents</h3>
        <div className="patient-upload-toolbar">
          <label className="field-label" htmlFor="patient-document-type">
            Document type
          </label>
          <select
            id="patient-document-type"
            className="field-select"
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value)}
          >
            <option value="clinical_note">Clinical note</option>
            <option value="prior_treatment_history">Prior treatment history</option>
            <option value="lab_results">Lab results</option>
            <option value="referral">Referral</option>
            <option value="medication_order">Medication order</option>
            <option value="denial_letter">Denial letter</option>
            <option value="fhir_bundle">FHIR bundle</option>
            <option value="uploaded_document">Generic upload</option>
          </select>
        </div>
        <div className="patient-upload-grid">
          <label className="upload-dropzone">
            <input type="file" accept=".json,.txt,.md,.csv" onChange={handleFileUpload} />
            <span>Upload supported patient document</span>
            <small>JSON/FHIR bundles and plain-text notes are supported in this milestone.</small>
          </label>

          <form className="patient-note-form" onSubmit={handleTextSubmit}>
            <label className="field-label" htmlFor="text-file-name">
              Inline note filename
            </label>
            <input id="text-file-name" className="field-input" value={textFileName} onChange={(event) => setTextFileName(event.target.value)} />

            <label className="field-label" htmlFor="text-content">
              Quick clinical note
            </label>
            <textarea
              id="text-content"
              className="field-textarea"
              value={textContent}
              onChange={(event) => setTextContent(event.target.value)}
              placeholder={'Patient: Jane Example\nDiagnosis: Breast Cancer\nRequested Drug: Herceptin\nPrior Therapies: paclitaxel, docetaxel\nPrescriber: medical oncologist\nInsurance: Cigna Commercial'}
            />

            <button type="submit" className="primary-button" disabled={isUploading || !textContent.trim()}>
              {isUploading ? 'Uploading…' : 'Save note'}
            </button>
          </form>
        </div>
        {uploadError && <div className="chat-error">{uploadError}</div>}
      </div>

      <div className="detail-section">
        <h3>Documents</h3>
        {patientCase.documents.length === 0 ? (
          <div className="empty-state">No documents uploaded yet.</div>
        ) : (
          patientCase.documents.map((document) => (
            <article key={document.documentId} className="detail-card">
              <div className="patient-doc-header">
                <p className="detail-card-title">{document.fileName}</p>
                <span className="status-badge status-gray">{document.documentType}</span>
              </div>
              <p>{document.summary}</p>
              <small>
                {formatDate(document.storedAt)} · {factsByDocument.get(document.documentId) ?? document.factCount} extracted facts
              </small>
            </article>
          ))
        )}
      </div>

      <div className="detail-section">
        <h3>Extracted facts</h3>
        {patientCase.extractedFacts.length === 0 ? (
          <div className="empty-state">Upload a document to populate extracted facts for this case.</div>
        ) : (
          <div className="patient-facts-grid">
            {patientCase.extractedFacts.map((fact) => (
              <article key={fact.factId} className="detail-card">
                <div className="patient-doc-header">
                  <p className="detail-card-title">{fact.label}</p>
                  <span className={`status-badge ${fact.confidence === 'high' ? 'status-green' : 'status-yellow'}`}>
                    {fact.confidence}
                  </span>
                </div>
                <p>{fact.value}</p>
                <small>{fact.evidenceSnippet || `Source document ${fact.sourceDocumentId}`}</small>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="detail-section">
        <h3>Coverage evaluation</h3>
        <div className="patient-eval-toolbar">
          <div className="patient-eval-field">
            <label className="field-label" htmlFor="policy-select">
              Policy
            </label>
            <select
              id="policy-select"
              className="field-select"
              value={selectedPolicyId}
              onChange={(event) => onPolicyChange(event.target.value)}
              disabled={policyOptionsLoading || policyOptions.length === 0}
            >
              <option value="">Select policy</option>
              {policyOptions.map((policy) => (
                <option key={policy.policyId} value={policy.policyId}>
                  {policy.title} · {policy.payer} · {policy.drugFamily}
                </option>
              ))}
            </select>
          </div>

          <div className="patient-eval-field">
            <label className="field-label" htmlFor="policy-version-select">
              Version
            </label>
            <select
              id="policy-version-select"
              className="field-select"
              value={selectedPolicyVersion}
              onChange={(event) => onPolicyVersionChange(Number(event.target.value))}
              disabled={!selectedPolicy || selectedPolicy.versions.length === 0}
            >
              <option value="">Select version</option>
              {selectedPolicy?.versions.map((version) => (
                <option key={version} value={version}>
                  Version {version}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="primary-button"
            disabled={
              isEvaluating
              || policyOptionsLoading
              || !selectedPolicyId
              || selectedPolicyVersion === ''
              || patientCase.documents.length === 0
            }
            onClick={() => void handleRunEvaluation()}
          >
            {isEvaluating ? 'Evaluating…' : 'Run evaluation'}
          </button>
        </div>

        {policyOptionsLoading && <div className="empty-state">Loading policy options…</div>}
        {!policyOptionsLoading && policyOptions.length === 0 && (
          <div className="empty-state">No policy versions are currently available for this case. Load policy data first.</div>
        )}
        {selectedPolicy && (
          <div className="detail-section-help">
            {selectedPolicy.matchReasons.map((reason) => (
              <span key={reason} className={`status-badge ${selectedPolicy.relevance === 'recommended' ? 'status-green' : selectedPolicy.relevance === 'possible' ? 'status-yellow' : 'status-gray'}`}>
                {reason}
              </span>
            ))}
          </div>
        )}
        {evaluationError && <div className="chat-error">{evaluationError}</div>}

        {evaluationsLoading ? (
          <div className="empty-state">Loading saved evaluations…</div>
        ) : latestEvaluation ? (
          <div className="patient-evaluation-results">
            <div className="tab-bar patient-evaluation-tab-bar">
              <button
                type="button"
                className={`tab-btn${activeEvaluationTab === 'coverage' ? ' tab-btn-active' : ''}`}
                onClick={() => setActiveEvaluationTab('coverage')}
              >
                Coverage
              </button>
              <button
                type="button"
                className={`tab-btn${activeEvaluationTab === 'next-steps' ? ' tab-btn-active' : ''}`}
                onClick={() => setActiveEvaluationTab('next-steps')}
              >
                Next Steps
              </button>
            </div>

            <article className="detail-card patient-evaluation-summary">
              <div className="patient-doc-header">
                <p className="detail-card-title">Latest result</p>
                <span className={`status-badge ${evaluationStatusTone(latestEvaluation.coverageStatus)}`}>
                  {latestEvaluation.coverageStatus}
                </span>
              </div>
              <p>
                {latestEvaluation.policyTitle || latestEvaluation.policyId} · Version {latestEvaluation.policyVersion}
              </p>
              <small>{formatDate(latestEvaluation.evaluatedAt)}</small>
            </article>

            {activeEvaluationTab === 'coverage' ? (
              <div className="patient-checklist">
                {latestEvaluation.checklist.map((item) => (
                  <article key={`${item.category}-${item.criterion}`} className="detail-card patient-checklist-item">
                    <div className="patient-doc-header">
                      <p className="detail-card-title">{item.criterion}</p>
                      <span className={`status-badge ${checklistStatusTone(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <p>{item.rationale}</p>
                    <div className="patient-evidence-grid">
                      <div className="patient-evidence-card">
                        <span className="detail-label">Patient evidence</span>
                        <strong>{item.matchedFact ? `${item.matchedFact.label}: ${item.matchedFact.value}` : 'No matched fact'}</strong>
                        <small>
                          {item.patientEvidence?.sourceDocumentName || item.patientEvidence?.sourceDocumentId || 'No linked patient document'}
                          {item.patientEvidence?.snippet ? ` · ${item.patientEvidence.snippet}` : ''}
                        </small>
                      </div>
                      <div className="patient-evidence-card">
                        <span className="detail-label">Policy evidence</span>
                        <strong>{item.policyEvidence.fieldLabel}</strong>
                        <small>
                          {item.policyEvidence.document}
                          {item.policyEvidence.page ? ` · page ${item.policyEvidence.page}` : ''}
                          {` · ${item.policyEvidence.section}`}
                        </small>
                        <p>{item.policyEvidence.snippet}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="next-steps-tab">
                <details open>
                  <summary>Clinic Next Steps</summary>
                  {nextStepsLoading && <p>Generating next steps…</p>}
                  {nextStepsError && <p className="error-text">{nextStepsError}</p>}
                  {nextSteps && (
                    <ol>
                      {nextSteps.clinicNextSteps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  )}
                </details>

                <details>
                  <summary>Missing Documentation ({nextSteps?.missingDocsList.length ?? 0} items)</summary>
                  {nextSteps && nextSteps.missingDocsList.length > 0 ? (
                    <ul className="missing-docs-list">
                      {nextSteps.missingDocsList.map((item) => (
                        <li key={`${item.category}-${item.criterion}`}>
                          <label>
                            <input type="checkbox" /> {item.criterion}
                          </label>
                          <small>{item.rationale}</small>
                          <small className="evidence-ref">
                            {item.policyEvidence.document}
                            {item.policyEvidence.page ? ` · page ${item.policyEvidence.page}` : ''}
                            {item.policyEvidence.section ? ` · ${item.policyEvidence.section}` : ''}
                          </small>
                        </li>
                      ))}
                    </ul>
                  ) : nextSteps ? (
                    <p>No missing documentation items — all criteria are satisfied.</p>
                  ) : null}
                </details>

                <details>
                  <summary>Patient-Friendly Explanation</summary>
                  <div className="patient-explanation">
                    {(nextSteps?.patientExplanation || '').split(/\n\n+/).filter(Boolean).map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </details>

                <details>
                  <summary>Payer Analyst Breakdown</summary>
                  {nextSteps?.payerAnalystBreakdown && (
                    <>
                      <p>{nextSteps.payerAnalystBreakdown.summary}</p>
                      <div className="patient-checklist">
                        {nextSteps.payerAnalystBreakdown.criteriaAnalysis.map((item) => (
                          <article key={`${item.criterion}-${item.status}`} className="detail-card">
                            <div className="patient-doc-header">
                              <p className="detail-card-title">{item.criterion}</p>
                              <span className={`status-badge ${checklistStatusTone(item.status as 'PASS' | 'MISSING' | 'UNKNOWN' | 'NEEDS REVIEW')}`}>
                                {item.status}
                              </span>
                            </div>
                            <p><strong>Clinic action:</strong> {item.clinicAction}</p>
                            <p>{item.policyEvidence.snippet}</p>
                            <small className="evidence-ref">
                              {item.policyEvidence.document}
                              {item.policyEvidence.page ? ` · page ${item.policyEvidence.page}` : ''}
                              {item.policyEvidence.section ? ` · ${item.policyEvidence.section}` : ''}
                            </small>
                          </article>
                        ))}
                      </div>
                    </>
                  )}
                </details>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">No saved evaluation yet. Select a policy version and run an evaluation for this case.</div>
        )}
      </div>
    </div>
  );
}
