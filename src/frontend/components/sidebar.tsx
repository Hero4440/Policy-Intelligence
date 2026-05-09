import { useEffect, useRef, useState } from 'react';

type SidebarProps = {
  issuers: string[];
  selectedIssuer: string;
  drugQuery: string;
  onIssuerChange: (issuer: string) => void;
  onDrugQueryChange: (drug: string) => void;
};

export function Sidebar({
  issuers,
  selectedIssuer,
  drugQuery,
  onIssuerChange,
  onDrugQueryChange,
}: SidebarProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [localInput, setLocalInput] = useState(drugQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Sync external drugQuery changes
  useEffect(() => {
    setLocalInput(drugQuery);
  }, [drugQuery]);

  // Fetch suggestions on input change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!localInput.trim()) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(() => {
      void fetch(`/api/policy/drugs?query=${encodeURIComponent(localInput.trim())}`)
        .then((res) => (res.ok ? res.json() : { drugs: [] }))
        .then((data) => setSuggestions((data as { drugs: string[] }).drugs || []))
        .catch(() => setSuggestions([]));
    }, 200);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localInput]);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectDrug(drug: string) {
    setLocalInput(drug);
    setShowSuggestions(false);
    onDrugQueryChange(drug);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-section sidebar-section-header">
        <p className="eyebrow">Policy Search</p>
        <h2 className="sidebar-title">Medical Benefit Drug Policy Intelligence</h2>
        <p className="sidebar-copy">
          Search a drug, compare how plans handle it, and drill into coverage signals, prior auth rules, and source provenance.
        </p>
      </div>

      <div className="sidebar-section">
        <div className="filter-row">
          <div className="filter-field" ref={wrapperRef}>
            <label className="field-label" htmlFor="drug-query">
              Drug Query
            </label>
            <input
              id="drug-query"
              className="field-input"
              value={localInput}
              onChange={(event) => {
                setLocalInput(event.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  setShowSuggestions(false);
                  onDrugQueryChange(localInput);
                }
              }}
              placeholder="adalimumab, Humira, Rituxan..."
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="drug-suggestions">
                {suggestions.map((drug) => (
                  <button
                    key={drug}
                    type="button"
                    className="drug-suggestion-item"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectDrug(drug)}
                  >
                    {drug}
                  </button>
                ))}
              </div>
            )}
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
    </aside>
  );
}
