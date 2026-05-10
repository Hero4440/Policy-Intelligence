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
  const [drugSuggestions, setDrugSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (drugQuery.length === 0) {
      setDrugSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    void fetch(`/api/policy/drugs?query=${encodeURIComponent(drugQuery)}`)
      .then((res) => (res.ok ? res.json() : { drugs: [] }))
      .then((data) => {
        setDrugSuggestions((data as { drugs: string[] }).drugs || []);
        setShowSuggestions(true);
      })
      .catch(() => setDrugSuggestions([]))
      .finally(() => setIsLoading(false));
  }, [drugQuery]);

  const handleSelectDrug = (drug: string) => {
    onDrugQueryChange(drug);
    setShowSuggestions(false);
  };

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
          <div style={{ position: 'relative' }}>
            <input
              id="drug-query"
              type="text"
              className="field-input"
              placeholder="Search for a drug (e.g., adalimumab, herceptin)"
              value={drugQuery}
              onChange={(event) => onDrugQueryChange(event.target.value)}
              onFocus={() => drugQuery.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              autoComplete="off"
            />
            {showSuggestions && drugSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderTop: 'none',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  zIndex: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {drugSuggestions.map((drug) => (
                  <div
                    key={drug}
                    onClick={() => handleSelectDrug(drug)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#fff';
                    }}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    {drug}
                  </div>
                ))}
              </div>
            )}
            {isLoading && drugQuery.length > 0 && (
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                Loading suggestions...
              </div>
            )}
          </div>
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
