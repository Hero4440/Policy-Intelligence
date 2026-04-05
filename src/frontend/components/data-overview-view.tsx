import type { AntonRxCatalogSummary, IngestedSourceRecord, IngestionSummary } from '../data/antonrx.js';
import { InfoChip } from './info-chip.js';

type DataOverviewViewProps = {
  ingestedSources: IngestedSourceRecord[];
  ingestionSummary: IngestionSummary | null;
  catalogSummary: AntonRxCatalogSummary | null;
};

function countByStatus(sources: IngestedSourceRecord[]) {
  return {
    normalized: sources.filter((source) => source.status === 'normalized').length,
    partial: sources.filter((source) => source.status === 'partial').length,
    stored: sources.filter((source) => source.status === 'stored').length,
    rejected: sources.filter((source) => source.status === 'rejected').length
  };
}

export function DataOverviewView({
  ingestedSources,
  ingestionSummary,
  catalogSummary
}: DataOverviewViewProps) {
  const statusCounts = countByStatus(ingestedSources);
  const detectedDrugCounts = new Map<string, number>();
  for (const source of ingestedSources) {
    for (const drug of source.detectedDrugs) {
      detectedDrugCounts.set(drug, (detectedDrugCounts.get(drug) ?? 0) + 1);
    }
  }
  const topDetectedDrugs = [...detectedDrugCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 8);

  return (
    <div className="data-overview">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Data Page</p>
          <h2>Dataset visibility and ingestion health</h2>
        </div>
      </div>

      <div className="data-overview-legend">
        <InfoChip label="Uploaded Sources" description="Raw files that entered the system, including PDFs, JSON, CSV, and FHIR bundles." />
        <InfoChip label="Uploaded Snapshots" description="Normalized plan-drug records created from uploaded sources. These are what power compare and detail views." />
        <InfoChip label="Normalized" description="Upload produced structured searchable records. Partial means the source was stored with metadata but still needs deeper normalization." />
      </div>

      <div className="detail-summary-card">
        <div>
          <span className="detail-label">Seeded Plans</span>
          <strong>{catalogSummary?.planCount ?? '—'}</strong>
        </div>
        <div>
          <span className="detail-label">Uploaded Sources</span>
          <strong>{ingestionSummary?.sourceCount ?? 0}</strong>
        </div>
        <div>
          <span className="detail-label">Uploaded Snapshots</span>
          <strong>{catalogSummary?.ingestedSnapshotCount ?? ingestionSummary?.snapshotCount ?? 0}</strong>
        </div>
      </div>

      <div className="detail-section">
        <h3>Source status</h3>
        <div className="data-bars">
          {[
            ['normalized', statusCounts.normalized],
            ['partial', statusCounts.partial],
            ['stored', statusCounts.stored],
            ['rejected', statusCounts.rejected]
          ].map(([label, value]) => (
            <article key={label} className="data-bar-card">
              <div className="data-bar-header">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
              <div className="data-bar-track">
                <div
                  className={`data-bar-fill data-bar-fill-${label}`}
                  style={{ width: `${Math.min(100, ingestedSources.length === 0 ? 0 : (Number(value) / ingestedSources.length) * 100)}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="detail-section">
        <h3>Most frequently detected uploaded drugs</h3>
        {topDetectedDrugs.length === 0 ? (
          <div className="empty-state">Upload policy files to see detected drug families.</div>
        ) : (
          topDetectedDrugs.map(([drug, count]) => (
            <article key={drug} className="detail-card">
              <p className="detail-card-title">{drug}</p>
              <p>Detected in {count} uploaded source{count === 1 ? '' : 's'}</p>
            </article>
          ))
        )}
      </div>

      <div className="detail-section">
        <h3>Seeded corpus snapshot</h3>
        <div className="data-kind-grid">
          <article className="detail-card">
            <p className="detail-card-title">Formulary rows</p>
            <p>{catalogSummary?.formularyRowCount ?? '—'}</p>
          </article>
          <article className="detail-card">
            <p className="detail-card-title">Medical benefit rows</p>
            <p>{catalogSummary?.medicalBenefitRowCount ?? '—'}</p>
          </article>
          <article className="detail-card">
            <p className="detail-card-title">Structured policies</p>
            <p>{catalogSummary?.structuredPolicyCount ?? '—'}</p>
          </article>
          <article className="detail-card">
            <p className="detail-card-title">Issuers</p>
            <p>{catalogSummary?.issuers.length ?? '—'}</p>
          </article>
        </div>
      </div>
    </div>
  );
}
