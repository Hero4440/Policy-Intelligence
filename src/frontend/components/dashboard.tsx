import { DashboardWidget } from './dashboard-widget.js';
import type { AntonRxCatalogSummary, IngestionSummary } from '../data/policy-types.js';
import type { PolicyChangesResponse } from '../data/policies.js';

export type DashboardProps = {
  catalogSummary: AntonRxCatalogSummary | null;
  ingestionSummary: IngestionSummary | null;
  recentChanges: PolicyChangesResponse | null;
  onNavigate: (page: string, context?: Record<string, unknown>) => void;
};

export function Dashboard({
  catalogSummary,
  ingestionSummary,
  recentChanges,
  onNavigate
}: DashboardProps) {
  const isLoading = !catalogSummary && !ingestionSummary;

  // Summary statistics widget (8.3)
  function renderSummaryStats() {
    if (!catalogSummary && !ingestionSummary) {
      return null;
    }

    return (
      <DashboardWidget title="System Overview" size="medium" loading={isLoading}>
        <div className="dashboard-stats-grid">
          <div className="dashboard-stat">
            <span className="dashboard-stat-value">{catalogSummary?.totalPolicies ?? 0}</span>
            <span className="dashboard-stat-label">Total Policies</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat-value">{catalogSummary?.totalPayers ?? 0}</span>
            <span className="dashboard-stat-label">Payers</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat-value">{catalogSummary?.totalDrugFamilies ?? 0}</span>
            <span className="dashboard-stat-label">Drug Families</span>
          </div>
          <div className="dashboard-stat">
            <span className="dashboard-stat-value">{ingestionSummary?.totalDocuments ?? 0}</span>
            <span className="dashboard-stat-label">Documents Ingested</span>
          </div>
        </div>
      </DashboardWidget>
    );
  }

  // Recent policy changes widget (8.4)
  function renderRecentChanges() {
    const changes = recentChanges?.changes ?? [];
    const hasChanges = changes.length > 0;

    return (
      <DashboardWidget
        title="Recent Policy Changes"
        size="medium"
        empty={!hasChanges}
        emptyMessage="No recent policy changes"
        actions={
          hasChanges ? (
            <button
              type="button"
              className="dashboard-widget-link"
              onClick={() => onNavigate('changes')}
            >
              View All
            </button>
          ) : undefined
        }
      >
        <div className="dashboard-changes-list">
          {changes.slice(0, 5).map((change, index) => (
            <div key={index} className="dashboard-change-item">
              <div className="dashboard-change-header">
                <span className="dashboard-change-payer">{change.payer}</span>
                <span className={`dashboard-change-severity dashboard-change-severity-${change.severity}`}>
                  {change.severity}
                </span>
              </div>
              <p className="dashboard-change-description">
                {change.drugFamily} · v{change.fromVersion} → v{change.toVersion}
              </p>
              <span className="dashboard-change-timestamp">
                {new Date(change.changedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </DashboardWidget>
    );
  }

  // Quick action cards widget (8.5)
  function renderQuickActions() {
    return (
      <DashboardWidget title="Quick Actions" size="full-width">
        <div className="dashboard-actions-grid">
          <button
            type="button"
            className="dashboard-action-card"
            onClick={() => onNavigate('workspace')}
          >
            <div className="dashboard-action-icon">🔍</div>
            <h4 className="dashboard-action-title">Search Drug</h4>
            <p className="dashboard-action-description">
              Search for drug coverage across payers
            </p>
          </button>

          <button
            type="button"
            className="dashboard-action-card"
            onClick={() => onNavigate('compare')}
          >
            <div className="dashboard-action-icon">⚖️</div>
            <h4 className="dashboard-action-title">Compare Policies</h4>
            <p className="dashboard-action-description">
              Compare coverage across multiple payers
            </p>
          </button>

          <button
            type="button"
            className="dashboard-action-card"
            onClick={() => onNavigate('changes')}
          >
            <div className="dashboard-action-icon">📊</div>
            <h4 className="dashboard-action-title">View Changes</h4>
            <p className="dashboard-action-description">
              Track policy updates and version history
            </p>
          </button>

          <button
            type="button"
            className="dashboard-action-card"
            onClick={() => onNavigate('patients')}
          >
            <div className="dashboard-action-icon">👤</div>
            <h4 className="dashboard-action-title">Manage Patients</h4>
            <p className="dashboard-action-description">
              Evaluate patient cases for coverage
            </p>
          </button>
        </div>
      </DashboardWidget>
    );
  }

  // System status widget (8.6)
  function renderSystemStatus() {
    const lastIngestion = ingestionSummary?.lastIngestionDate
      ? new Date(ingestionSummary.lastIngestionDate)
      : null;
    const daysSinceIngestion = lastIngestion
      ? Math.floor((Date.now() - lastIngestion.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const dataFreshness = daysSinceIngestion === null
      ? 'Unknown'
      : daysSinceIngestion === 0
        ? 'Today'
        : daysSinceIngestion === 1
          ? 'Yesterday'
          : `${daysSinceIngestion} days ago`;

    const freshnessStatus = daysSinceIngestion === null
      ? 'unknown'
      : daysSinceIngestion <= 7
        ? 'good'
        : daysSinceIngestion <= 30
          ? 'warning'
          : 'stale';

    return (
      <DashboardWidget title="System Status" size="medium">
        <div className="dashboard-status-list">
          <div className="dashboard-status-item">
            <span className="dashboard-status-label">Data Freshness</span>
            <span className={`dashboard-status-value dashboard-status-${freshnessStatus}`}>
              {dataFreshness}
            </span>
          </div>
          <div className="dashboard-status-item">
            <span className="dashboard-status-label">Service Health</span>
            <span className="dashboard-status-value dashboard-status-good">
              Operational
            </span>
          </div>
          <div className="dashboard-status-item">
            <span className="dashboard-status-label">Total Documents</span>
            <span className="dashboard-status-value">
              {ingestionSummary?.totalDocuments ?? 0}
            </span>
          </div>
        </div>
      </DashboardWidget>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">PolicyPilot Dashboard</h1>
        <p className="dashboard-subtitle">
          Medical benefit drug policy intelligence platform
        </p>
      </header>

      <div className="dashboard-grid">
        {renderSummaryStats()}
        {renderRecentChanges()}
        {renderQuickActions()}
        {renderSystemStatus()}
      </div>
    </div>
  );
}
