import type { ReactNode } from 'react';

export type RightSidebarPage = 'dashboard' | 'workspace' | 'compare' | 'insights' | 'changes' | 'patients';

type RightSidebarProps = {
  page: RightSidebarPage;
  context: Record<string, unknown>;
  collapsed: boolean;
  onToggle: () => void;
};

export function RightSidebar({ page, context, collapsed, onToggle }: RightSidebarProps) {
  if (collapsed) {
    return (
      <button 
        className="right-sidebar-toggle"
        onClick={onToggle}
        aria-label="Expand right sidebar"
        title="Expand sidebar"
      >
        ◀
      </button>
    );
  }

  return (
    <div className="right-sidebar-container">
      <div className="right-sidebar-header">
        <button 
          className="right-sidebar-toggle"
          onClick={onToggle}
          aria-label="Collapse right sidebar"
          title="Collapse sidebar"
        >
          ▶
        </button>
      </div>
      <div className="right-sidebar-content">
        {renderContent(page, context)}
      </div>
    </div>
  );
}

function renderContent(page: RightSidebarPage, context: Record<string, unknown>): ReactNode {
  switch (page) {
    case 'dashboard':
      return <DashboardRightSidebar context={context} />;
    case 'workspace':
      return <WorkspaceRightSidebar context={context} />;
    case 'compare':
      return <CompareRightSidebar context={context} />;
    case 'changes':
      return <ChangesRightSidebar context={context} />;
    case 'patients':
      return <PatientsRightSidebar context={context} />;
    default:
      return <div className="empty-state">No contextual information available</div>;
  }
}

// Dashboard right sidebar: Recent notifications and system alerts
function DashboardRightSidebar({ context }: { context: Record<string, unknown> }) {
  return (
    <div className="right-sidebar-section">
      <h3 className="right-sidebar-section-title">Recent Notifications</h3>
      <div className="empty-state">
        <small>No recent notifications</small>
      </div>

      <h3 className="right-sidebar-section-title">System Alerts</h3>
      <div className="empty-state">
        <small>All systems operational</small>
      </div>
    </div>
  );
}

// Workspace right sidebar: Related policies and quick comparison options
function WorkspaceRightSidebar({ context }: { context: Record<string, unknown> }) {
  const selectedPlanId = context.selectedPlanId as string | undefined;
  const matches = context.matches as Array<{ planId: string; issuerName: string; primaryDrugLabel: string }> | undefined;

  if (!selectedPlanId || !matches || matches.length === 0) {
    return (
      <div className="right-sidebar-section">
        <h3 className="right-sidebar-section-title">Related Policies</h3>
        <div className="empty-state">
          <small>Select a policy to see related options</small>
        </div>
      </div>
    );
  }

  const selectedMatch = matches.find((m) => m.planId === selectedPlanId);
  const relatedPolicies = matches.filter((m) => m.planId !== selectedPlanId).slice(0, 5);

  return (
    <div className="right-sidebar-section">
      <h3 className="right-sidebar-section-title">Related Policies</h3>
      {relatedPolicies.length > 0 ? (
        <div className="right-sidebar-list">
          {relatedPolicies.map((match) => (
            <div key={match.planId} className="right-sidebar-item">
              <p className="right-sidebar-item-title">{match.issuerName}</p>
              <small>{match.primaryDrugLabel}</small>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <small>No related policies found</small>
        </div>
      )}

      <h3 className="right-sidebar-section-title">Quick Actions</h3>
      <div className="right-sidebar-list">
        <button className="right-sidebar-action-btn" disabled>
          Compare with similar plans
        </button>
        <button className="right-sidebar-action-btn" disabled>
          View change history
        </button>
      </div>
    </div>
  );
}

// Compare right sidebar: Comparison history and saved comparisons
function CompareRightSidebar({ context }: { context: Record<string, unknown> }) {
  return (
    <div className="right-sidebar-section">
      <h3 className="right-sidebar-section-title">Comparison History</h3>
      <div className="empty-state">
        <small>No recent comparisons</small>
      </div>

      <h3 className="right-sidebar-section-title">Saved Comparisons</h3>
      <div className="empty-state">
        <small>No saved comparisons</small>
      </div>
    </div>
  );
}

// Changes right sidebar: Change filters and timeline navigation
function ChangesRightSidebar({ context }: { context: Record<string, unknown> }) {
  return (
    <div className="right-sidebar-section">
      <h3 className="right-sidebar-section-title">Timeline</h3>
      <div className="empty-state">
        <small>Timeline navigation coming soon</small>
      </div>

      <h3 className="right-sidebar-section-title">Quick Filters</h3>
      <div className="right-sidebar-list">
        <button className="right-sidebar-action-btn" disabled>
          Show clinical changes only
        </button>
        <button className="right-sidebar-action-btn" disabled>
          Show last 30 days
        </button>
      </div>
    </div>
  );
}

// Patients right sidebar: Patient case summary and document checklist
function PatientsRightSidebar({ context }: { context: Record<string, unknown> }) {
  const selectedCase = context.selectedCase as { patientName?: string; diagnosis?: string } | null | undefined;

  return (
    <div className="right-sidebar-section">
      <h3 className="right-sidebar-section-title">Case Summary</h3>
      {selectedCase ? (
        <div className="right-sidebar-item">
          <p className="right-sidebar-item-title">{selectedCase.patientName || 'Unnamed Patient'}</p>
          <small>{selectedCase.diagnosis || 'No diagnosis specified'}</small>
        </div>
      ) : (
        <div className="empty-state">
          <small>Select a case to view summary</small>
        </div>
      )}

      <h3 className="right-sidebar-section-title">Document Checklist</h3>
      <div className="empty-state">
        <small>Document checklist coming soon</small>
      </div>
    </div>
  );
}
