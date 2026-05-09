import { useRef, useState } from 'react';
import {
  uploadIngestionFiles,
  type AntonRxCatalogSummary,
  type IngestedSourceRecord,
  type IngestionSummary,
  type IngestionUploadResult
} from '../data/policy-types.js';

type IngestionPanelProps = {
  ingestedSources: IngestedSourceRecord[];
  ingestionSummary: IngestionSummary | null;
  catalogSummary: AntonRxCatalogSummary | null;
  onIngestionComplete: (result: IngestionUploadResult) => Promise<void> | void;
};

export function IngestionPanel({
  ingestedSources,
  ingestionSummary,
  catalogSummary,
  onIngestionComplete
}: IngestionPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  async function handleFiles(nextFiles: FileList | null) {
    const files = nextFiles ? Array.from(nextFiles) : [];
    if (files.length === 0 || isUploading) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadNotice(null);
    try {
      const result = await uploadIngestionFiles(files);
      await onIngestionComplete(result);
      const normalizedCount = result.accepted.reduce((count, item) => count + item.snapshotCount, 0);
      setUploadNotice(
        normalizedCount > 0
          ? `Uploaded ${files.length} file${files.length === 1 ? '' : 's'} and created ${normalizedCount} searchable snapshot${normalizedCount === 1 ? '' : 's'}.`
          : `Uploaded ${files.length} file${files.length === 1 ? '' : 's'}. The new sources were stored, but no searchable snapshots were created yet.`
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="ingestion-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Ingest</p>
          <h2>Upload payer policy files</h2>
          <p className="sidebar-copy">
            Upload PDFs, structured policy JSON, or normalized CSV files. PDFs become provisional searchable policy snapshots with preserved provenance.
          </p>
        </div>
      </div>

      <div className="ingestion-stats-grid">
        <article className="ingestion-stat-card">
          <span className="detail-label">Structured policies</span>
          <strong>{catalogSummary?.structuredPolicyCount ?? '—'}</strong>
        </article>
        <article className="ingestion-stat-card">
          <span className="detail-label">Uploaded sources</span>
          <strong>{ingestionSummary?.sourceCount ?? 0}</strong>
        </article>
        <article className="ingestion-stat-card">
          <span className="detail-label">Uploaded snapshots</span>
          <strong>{catalogSummary?.ingestedSnapshotCount ?? ingestionSummary?.snapshotCount ?? 0}</strong>
        </article>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.json,.csv,.jsonl,application/pdf,application/json,text/csv"
        multiple
        hidden
        onChange={(event) => {
          void handleFiles(event.target.files);
        }}
      />

      <div className="ingestion-upload-row">
        <button
          type="button"
          className="ask-submit"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? 'Uploading…' : 'Choose files'}
        </button>
        <div
          className="ingestion-dropzone ingestion-dropzone-large"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void handleFiles(event.dataTransfer.files);
          }}
        >
          Drop PDFs or policy files here.
          <br />
          `.pdf` for raw policy ingestion, `.json` for structured policy, `.csv` for normalized rows.
        </div>
      </div>

      {uploadError && <div className="chat-error">{uploadError}</div>}
      {uploadNotice && <div className="chat-upload-zone">{uploadNotice}</div>}

      <div className="ingestion-source-list">
        {ingestedSources.length === 0 && (
          <div className="empty-state">
            No uploaded sources yet. The seeded policy package is already loaded and searchable.
          </div>
        )}
        {ingestedSources.slice(0, 6).map((source) => (
          <article key={source.id} className="ingestion-source-card">
            <div className="ingestion-source-topline">
              <strong>{source.fileName}</strong>
              <span className={`ingestion-status ingestion-status-${source.status}`}>{source.status}</span>
            </div>
            <p className="ingestion-source-summary">{source.summary}</p>
            <small>
              {source.sourceKind} · {source.issuerName} · {source.effectiveDate}
            </small>
            {source.detectedDrugs.length > 0 && (
              <p className="ingestion-drugs">Detected: {source.detectedDrugs.join(', ')}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
