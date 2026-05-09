import { useState } from 'react';
import type { AntonRxCatalogSummary, IngestedSourceRecord, IngestionSummary } from '../data/policy-types.js';
import { InfoLabel } from './info-chip.js';

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
  const [drugPage, setDrugPage] = useState(0);
  const statusCounts = countByStatus(ingestedSources);
  const detectedDrugCounts = new Map<string, number>();
  for (const source of ingestedSources) {
    for (const drug of source.detectedDrugs) {
      detectedDrugCounts.set(drug, (detectedDrugCounts.get(drug) ?? 0) + 1);
    }
  }
  const topDetectedDrugs = [...detectedDrugCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  const DRUGS_PER_PAGE = 10;

  return (
    <div className="data-overview">
      <div className="panel-header">
        <div>
          <h2>Dataset visibility and ingestion health</h2>
        </div>
      </div>

      <div className="detail-summary-card">
        <div>
          <InfoLabel label="Seeded Plans" description="Plans loaded from the packaged dataset that give the app baseline plan coverage breadth." />
          <strong>{catalogSummary?.planCount ?? '—'}</strong>
        </div>
        <div>
          <InfoLabel label="Uploaded Sources" description="Raw files uploaded into the system, such as PDFs, CSVs, JSON policy files, or FHIR bundles." />
          <strong>{ingestionSummary?.sourceCount ?? 0}</strong>
        </div>
        <div>
          <InfoLabel label="Uploaded Snapshots" description="Searchable normalized records created from uploaded files. These are the records used by compare and detail views." />
          <strong>{catalogSummary?.ingestedSnapshotCount ?? ingestionSummary?.snapshotCount ?? 0}</strong>
        </div>
      </div>

      <div className="detail-section">
        <h3>
          <InfoLabel label="Source status" description="How uploaded files were processed. Normalized means usable records were created. Partial means the file was understood only in part. Stored means it was saved without full normalization. Rejected means it could not be processed." />
        </h3>
        <div className="data-bars">
          {([
            ['normalized', statusCounts.normalized],
            ['partial', statusCounts.partial],
            ['stored', statusCounts.stored],
            ['rejected', statusCounts.rejected]
          ] as Array<[string, number]>).map(([label, value]) => (
            <article key={label} className="data-bar-card">
              <div className="data-bar-header">
                <InfoLabel
                  label={label}
                  description={
                    label === 'normalized'
                      ? 'The upload was successfully turned into searchable structured records.'
                      : label === 'partial'
                        ? 'The system extracted some useful information, but not enough to fully normalize the file.'
                        : label === 'stored'
                          ? 'The file was accepted and saved, but only as a raw source artifact.'
                          : 'The file was invalid or did not match a supported structure.'
                  }
                />
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
        <h3>
          <InfoLabel label="Most frequently detected uploaded drugs" description="Drug names the system detected most often across uploaded source files. This gives a quick view of what your uploaded corpus is mostly about." />
        </h3>
        {topDetectedDrugs.length === 0 ? (
          <div className="empty-state">Upload policy files to see detected drug families.</div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Drug</th>
                  <th>Sources</th>
                </tr>
              </thead>
              <tbody>
                {topDetectedDrugs
                  .slice(drugPage * DRUGS_PER_PAGE, (drugPage + 1) * DRUGS_PER_PAGE)
                  .map(([drug, count], i) => (
                    <tr key={drug}>
                      <td className="row-num">{drugPage * DRUGS_PER_PAGE + i + 1}</td>
                      <td>{drug}</td>
                      <td>{count}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {topDetectedDrugs.length > DRUGS_PER_PAGE && (
              <div className="table-pagination">
                <button
                  type="button"
                  disabled={drugPage === 0}
                  onClick={() => setDrugPage((p) => p - 1)}
                >
                  Prev
                </button>
                <span>
                  {drugPage + 1} / {Math.ceil(topDetectedDrugs.length / DRUGS_PER_PAGE)}
                </span>
                <button
                  type="button"
                  disabled={(drugPage + 1) * DRUGS_PER_PAGE >= topDetectedDrugs.length}
                  onClick={() => setDrugPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="detail-section">
        <h3>
          <InfoLabel label="Seeded corpus snapshot" description="Summary of the packaged baseline dataset already loaded into the app before considering new uploads." />
        </h3>
        <div className="data-kind-grid">
          <article className="detail-card">
            <p className="detail-card-title"><InfoLabel label="Formulary rows" description="Coverage rows loaded from formulary-style data sources in the packaged dataset." /></p>
            <p>{catalogSummary?.formularyRowCount ?? '—'}</p>
          </article>
          <article className="detail-card">
            <p className="detail-card-title"><InfoLabel label="Medical benefit rows" description="Rows explicitly flagged as medical benefit coverage in the packaged dataset." /></p>
            <p>{catalogSummary?.medicalBenefitRowCount ?? '—'}</p>
          </article>
          <article className="detail-card">
            <p className="detail-card-title"><InfoLabel label="Structured policies" description="Deep policy records that already exist in structured form and can support richer detail and criteria views." /></p>
            <p>{catalogSummary?.structuredPolicyCount ?? '—'}</p>
          </article>
          <article className="detail-card">
            <p className="detail-card-title"><InfoLabel label="Issuers" description="Distinct payer or issuer names currently represented in the packaged dataset." /></p>
            <p>{catalogSummary?.issuers.length ?? '—'}</p>
          </article>
        </div>
      </div>
    </div>
  );
}
