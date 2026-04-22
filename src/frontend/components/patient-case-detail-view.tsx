import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { StoredPatientCase } from '../data/patients.js';

type PatientCaseDetailViewProps = {
  patientCase: StoredPatientCase | null;
  onUploadDocument: (input: {
    caseId: string;
    fileName: string;
    content: string;
    contentType?: string;
    documentType?: string;
  }) => Promise<void>;
};

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

export function PatientCaseDetailView({ patientCase, onUploadDocument }: PatientCaseDetailViewProps) {
  const [textFileName, setTextFileName] = useState('clinical-note.txt');
  const [textContent, setTextContent] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
        contentType: file.type || 'text/plain'
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
        documentType: 'clinical_note'
      });
      setTextContent('');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload note');
    } finally {
      setIsUploading(false);
    }
  }

  if (!patientCase) {
    return <div className="empty-state">Select a patient case to inspect documents and extracted facts.</div>;
  }

  return (
    <div className="patient-case-detail">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Patient Case</p>
          <h2>{patientCase.patientName}</h2>
        </div>
        <span className={`status-badge ${patientCase.status === 'ready-for-eval' ? 'status-green' : patientCase.status === 'complete' ? 'status-blue' : 'status-yellow'}`}>
          {patientCase.status}
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
        <div className="patient-upload-grid">
          <label className="upload-dropzone">
            <input type="file" accept=".json,.txt,.md,.csv" onChange={handleFileUpload} />
            <span>Upload FHIR bundle or note file</span>
            <small>JSON and plain text are supported in this milestone.</small>
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
              placeholder={'Diagnosis: Rheumatoid arthritis\nRequested Drug: adalimumab\nPrior Therapy: methotrexate for 90 days\nPrescriber: rheumatologist'}
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
          patientCase.extractedFacts.map((fact) => (
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
          ))
        )}
      </div>
    </div>
  );
}
