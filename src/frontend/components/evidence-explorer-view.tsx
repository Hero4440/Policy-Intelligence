import { useState } from 'react';
import { fetchEvidenceSearch, type EvidenceSearchResult } from '../data/policies.js';

type EvidenceExplorerViewProps = {
  onSelectPolicy: (policyId: string, result: EvidenceSearchResult) => void;
};

export function EvidenceExplorerView({ onSelectPolicy }: EvidenceExplorerViewProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<EvidenceSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Enter a keyword to search policy evidence.');
      setResults([]);
      setLastQuery('');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload = await fetchEvidenceSearch(trimmed);
      setResults(payload.results);
      setLastQuery(payload.query);
    } catch (loadError) {
      setResults([]);
      setLastQuery(trimmed);
      setError(loadError instanceof Error ? loadError.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="panel-header">
        <div>
          <p className="eyebrow">Evidence Explorer</p>
          <h2>Search across all loaded policy evidence snippets</h2>
        </div>
      </div>

      <form className="evidence-search-form" onSubmit={handleSubmit}>
        <input
          type="search"
          className="evidence-search-input"
          placeholder="e.g. step therapy, prior authorization, Humira"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="submit" className="primary-button" disabled={isLoading}>
          {isLoading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {isLoading && <p>Searching evidence…</p>}
      {!isLoading && lastQuery && !error && (
        <p>
          {results.length} result{results.length !== 1 ? 's' : ''} for "{lastQuery}"
        </p>
      )}
      {!isLoading && lastQuery && !error && results.length === 0 && (
        <p>No evidence snippets matched "{lastQuery}". Try a different keyword.</p>
      )}

      {results.length > 0 && (
        <ul className="evidence-results-list">
          {results.map((result) => (
            <li key={`${result.policyId}-${result.fieldLabel}-${result.document}-${result.page ?? 'na'}-${result.section}`}>
              <button
                type="button"
                className="evidence-result-card"
                onClick={() => onSelectPolicy(result.policyId, result)}
              >
                <div className="evidence-result-meta">
                  <span className="status-badge status-blue">{result.payer}</span>
                  <span>{result.policyTitle || result.drugFamily}</span>
                  <span className="evidence-field-label">{result.fieldLabel}</span>
                </div>
                <p className="evidence-snippet">"{result.snippet}"</p>
                <small className="evidence-ref">
                  {result.document}
                  {result.page ? ` · page ${result.page}` : ''}
                  {result.section ? ` · ${result.section}` : ''}
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
