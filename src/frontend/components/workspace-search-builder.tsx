import { useEffect, useState } from 'react';

type WorkspaceSearchBuilderProps = {
  issuers: string[];
  selectedIssuer: string;
  drugQuery: string;
  onIssuerChange: (issuer: string) => void;
  onDrugQueryChange: (drug: string) => void;
};

export function WorkspaceSearchBuilder({
  issuers,
  selectedIssuer,
  drugQuery,
  onIssuerChange,
  onDrugQueryChange,
}: WorkspaceSearchBuilderProps) {
  const [allDrugs, setAllDrugs] = useState<string[]>([]);

  // Fetch all available drugs on mount
  useEffect(() => {
    void fetch('/api/policy/drugs?query=')
      .then((res) => (res.ok ? res.json() : { drugs: [] }))
      .then((data) => setAllDrugs((data as { drugs: string[] }).drugs || []))
      .catch(() => setAllDrugs([]));
  }, []);

  return (
    <div className="compare-builder">
      <div className="panel-header sidebar-section-header">
        <div>
          <p className="eyebrow">Policy Search</p>
          <h2>Medical Benefit Drug Policy Intelligence</h2>
          <p className="sidebar-copy">
            Search a drug, compare how plans handle it, and drill into coverage signals, prior auth rules, and source provenance.
          </p>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-field">
          <label className="field-label" htmlFor="drug-query">
            Drug Query
          </label>
          <select
            id="drug-query"
            className="field-input"
            value={drugQuery}
            onChange={(event) => onDrugQueryChange(event.target.value)}
          >
            {allDrugs.length === 0 && (
              <option value={drugQuery}>{drugQuery}</option>
            )}
            {allDrugs.map((drug) => (
              <option key={drug} value={drug}>
                {drug}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label className="field-label" htmlFor="issuer-filter">
            Issuer
          </label>
          <select
            id="issuer-filter"
            className="field-input"
            value={selectedIssuer}
            onChange={(event) => onIssuerChange(event.target.value)}
          >
            <option value="">All issuers</option>
            {issuers.map((issuer) => (
              <option key={issuer} value={issuer}>
                {issuer}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
