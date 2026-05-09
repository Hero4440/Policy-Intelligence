import { InfoChip } from './info-chip.js';
import {
  summarizeChangeSeverity,
  type ChangeSeverity,
  type PolicyChangesResponse
} from '../data/policies.js';

type PolicyChangesFiltersProps = {
  options: PolicyChangesResponse['filters'] | null;
  selectedPayer: string;
  selectedDrugFamily: string;
  selectedSeverity: string;
  onPayerChange: (value: string) => void;
  onDrugFamilyChange: (value: string) => void;
  onSeverityChange: (value: string) => void;
};

type PolicyChangesViewProps = {
  response: PolicyChangesResponse | null;
  loading: boolean;
  error: string | null;
  onOpenDiff: (input: { policyId: string; fromVersion: number; toVersion: number }) => void;
  // Filter props
  options: PolicyChangesResponse['filters'] | null;
  selectedPayer: string;
  selectedDrugFamily: string;
  selectedSeverity: string;
  onPayerChange: (value: string) => void;
  onDrugFamilyChange: (value: string) => void;
  onSeverityChange: (value: string) => void;
};

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function severityClass(severity: ChangeSeverity): string {
  switch (severity) {
    case 'cosmetic':
      return 'change-severity-cosmetic';
    case 'operational':
      return 'change-severity-operational';
    case 'clinical':
      return 'change-severity-clinical';
  }
}

export function PolicyChangesFilters({
  options,
  selectedPayer,
  selectedDrugFamily,
  selectedSeverity,
  onPayerChange,
  onDrugFamilyChange,
  onSeverityChange
}: PolicyChangesFiltersProps) {
  if (!options) {
    return <div className="empty-state">Loading change filters…</div>;
  }

  return (
    <div className="compare-builder">
      <div className="panel-header sidebar-section-header">
        <div>
          <p className="eyebrow">Policy Changes</p>
          <h2>Timeline filters</h2>
          <p className="sidebar-copy">
            Narrow the version timeline by payer, drug family, and severity.
          </p>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-field">
          <label className="field-label" htmlFor="changes-payer">
            Payer
          </label>
          <select
            id="changes-payer"
            className="field-input"
            value={selectedPayer}
            onChange={(event) => onPayerChange(event.target.value)}
          >
            <option value="">All payers</option>
            {options.payerOptions.map((payer) => (
              <option key={payer} value={payer}>
                {payer}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label className="field-label" htmlFor="changes-drug-family">
            Drug Family
          </label>
          <select
            id="changes-drug-family"
            className="field-input"
            value={selectedDrugFamily}
            onChange={(event) => onDrugFamilyChange(event.target.value)}
          >
            <option value="">All drug families</option>
            {options.drugFamilyOptions.map((family) => (
              <option key={family} value={family}>
                {family}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="detail-card">
        <label className="field-label" htmlFor="changes-severity">
          Severity
        </label>
        <select
          id="changes-severity"
          className="field-input"
          value={selectedSeverity}
          onChange={(event) => onSeverityChange(event.target.value)}
        >
          <option value="">All severities</option>
          {options.severityOptions.map((severity) => (
            <option key={severity} value={severity}>
              {summarizeChangeSeverity(severity)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function PolicyChangesView({
  response,
  loading,
  error,
  onOpenDiff,
  options,
  selectedPayer,
  selectedDrugFamily,
  selectedSeverity,
  onPayerChange,
  onDrugFamilyChange,
  onSeverityChange
}: PolicyChangesViewProps) {
  if (loading) {
    return <div className="empty-state">Loading policy changes…</div>;
  }

  if (error) {
    return <div className="chat-error">{error}</div>;
  }

  if (!response || response.events.length === 0) {
    return <div className="empty-state">No versioned policy changes yet. Save a second policy version to populate the timeline.</div>;
  }

  return (
    <div className="compare-view">
      <div className="panel-header sidebar-section-header">
        <div>
          <p className="eyebrow">Policy Changes</p>
          <h2>Timeline filters</h2>
          <p className="sidebar-copy">
            Narrow the version timeline by payer, drug family, and severity.
          </p>
        </div>
        <span className="panel-count">{response.events.length} events</span>
      </div>

      {options && (
        <div className="workspace-top-filters">
          <div className="filter-row">
            <div className="filter-field">
              <label className="field-label" htmlFor="changes-payer">
                Payer
              </label>
              <select
                id="changes-payer"
                className="field-input"
                value={selectedPayer}
                onChange={(event) => onPayerChange(event.target.value)}
              >
                <option value="">All payers</option>
                {options.payerOptions.map((payer) => (
                  <option key={payer} value={payer}>
                    {payer}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label className="field-label" htmlFor="changes-drug-family">
                Drug Family
              </label>
              <select
                id="changes-drug-family"
                className="field-input"
                value={selectedDrugFamily}
                onChange={(event) => onDrugFamilyChange(event.target.value)}
              >
                <option value="">All drug families</option>
                {options.drugFamilyOptions.map((family) => (
                  <option key={family} value={family}>
                    {family}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label className="field-label" htmlFor="changes-severity">
                Severity
              </label>
              <select
                id="changes-severity"
                className="field-input"
                value={selectedSeverity}
                onChange={(event) => onSeverityChange(event.target.value)}
              >
                <option value="">All severities</option>
                {options.severityOptions.map((severity) => (
                  <option key={severity} value={severity}>
                    {summarizeChangeSeverity(severity)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="compare-legend">
        <InfoChip label="Clinical" description="Coverage-impacting changes such as PA, step therapy, restrictions, product positioning, or status shifts." />
        <InfoChip label="Operational" description="Interpretation or workflow metadata changes that are not direct coverage-rule changes." />
        <InfoChip label="Cosmetic" description="Formatting or source metadata changes with no material coverage impact." />
      </div>

      <div className="changes-timeline">
        {response.events.map((event) => (
          <section key={`${event.policyId}-${event.fromVersion}-${event.toVersion}`} className="changes-event-card">
            <div className="panel-header panel-header-spaced changes-event-header">
              <div className="changes-event-meta">
                <p className="detail-card-title">{event.policyTitle}</p>
                <p className="compare-subtitle">
                  {event.payer} · {event.drugFamily} · v{event.fromVersion} → v{event.toVersion}
                </p>
                <small>{formatDate(event.timestamp)}</small>
              </div>
              <button
                type="button"
                className="page-nav-btn page-nav-btn-active"
                onClick={() => onOpenDiff({
                  policyId: event.policyId,
                  fromVersion: event.fromVersion,
                  toVersion: event.toVersion
                })}
              >
                Open Version Diff
              </button>
            </div>

            <div className="changes-summary-row">
              <p>{event.summary}</p>
              <div className="changes-severity-chip-list">
                {(['clinical', 'operational', 'cosmetic'] as const).map((severity) => (
                  event.severityCounts[severity] > 0 ? (
                    <span key={severity} className={`changes-severity-chip ${severityClass(severity)}`}>
                      {event.severityCounts[severity]} {summarizeChangeSeverity(severity)}
                    </span>
                  ) : null
                ))}
              </div>
            </div>

            {event.warning && (
              <article className="detail-card">
                <small>{event.warning}</small>
              </article>
            )}

            <div className="changes-table-wrapper">
              <table className="changes-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                    <th>Severity</th>
                    <th>Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {event.changes.map((change, index) => (
                    <tr key={`${change.field}-${index}`}>
                      <td className="changes-field-cell">{change.field}</td>
                      <td><pre>{change.oldValue}</pre></td>
                      <td><pre>{change.newValue}</pre></td>
                      <td>
                        <span className={`changes-severity-chip ${severityClass(change.severity)}`}>
                          {summarizeChangeSeverity(change.severity)}
                        </span>
                      </td>
                      <td>{change.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
