import type { ReactNode } from 'react';

export type DashboardWidgetProps = {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full-width';
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
};

export function DashboardWidget({
  title,
  children,
  actions,
  size = 'medium',
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'No data available',
  onRetry
}: DashboardWidgetProps) {
  const sizeClass = `dashboard-widget-${size}`;

  if (loading) {
    return (
      <article className={`dashboard-widget ${sizeClass}`}>
        <header className="dashboard-widget-header">
          <h3 className="dashboard-widget-title">{title}</h3>
        </header>
        <div className="dashboard-widget-content">
          <div className="dashboard-widget-skeleton">
            <div className="skeleton-line skeleton-shimmer" />
            <div className="skeleton-line skeleton-shimmer" />
            <div className="skeleton-line skeleton-shimmer" />
          </div>
        </div>
      </article>
    );
  }

  if (error) {
    return (
      <article className={`dashboard-widget ${sizeClass}`}>
        <header className="dashboard-widget-header">
          <h3 className="dashboard-widget-title">{title}</h3>
        </header>
        <div className="dashboard-widget-content">
          <div className="dashboard-widget-error">
            <p className="error-message">{error}</p>
            {onRetry && (
              <button type="button" className="btn-retry" onClick={onRetry}>
                Retry
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }

  if (empty) {
    return (
      <article className={`dashboard-widget ${sizeClass}`}>
        <header className="dashboard-widget-header">
          <h3 className="dashboard-widget-title">{title}</h3>
        </header>
        <div className="dashboard-widget-content">
          <div className="dashboard-widget-empty">
            <p>{emptyMessage}</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`dashboard-widget ${sizeClass}`}>
      <header className="dashboard-widget-header">
        <h3 className="dashboard-widget-title">{title}</h3>
        {actions && <div className="dashboard-widget-actions">{actions}</div>}
      </header>
      <div className="dashboard-widget-content">{children}</div>
    </article>
  );
}
