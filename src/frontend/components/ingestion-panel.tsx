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

    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    const MAX_PAYLOAD_BYTES = 18 * 1024 * 1024; // ~18 MB raw → ~24 MB base64 (server limit is 25 MB)
    if (totalBytes > MAX_PAYLOAD_BYTES) {
      const sizeMB = (totalBytes / (1024 * 1024)).toFixed(1);
      setUploadError(`Total file size is ${sizeMB} MB which exceeds the ~18 MB upload limit. Try uploading fewer or smaller files.`);
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
      const msg = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(`Upload failed: ${msg}. Check that the file is a valid PDF, DOCX, JSON, CSV, or JSONL.`);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="ingestion-panel-topbar">
      <div className="ingestion-topbar-header">
        <div>
          <p className="eyebrow">Data Page · Ingest</p>
          <h2>Upload payer policy files</h2>
        </div>
        <div className="ingestion-topbar-stats">
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
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.json,.csv,.jsonl,.docx,application/pdf,application/json,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
          Drop policy files here — `.pdf`, `.docx`, `.json`, `.csv`
        </div>
      </div>

      {uploadError && <div className="chat-error">{uploadError}</div>}
      {uploadNotice && <div className="chat-upload-zone">{uploadNotice}</div>}
    </section>
  );
}
