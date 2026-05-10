import type { ReactNode } from 'react';

type WorkspaceShellProps = {
  pageNav?: ReactNode;
  sidebar: ReactNode;
  listPane: ReactNode;
  detailPane: ReactNode;
  rightSidebar?: ReactNode;
  rightSidebarCollapsed?: boolean;
  onToggleRightSidebar?: () => void;
  topFilters?: ReactNode;
};

export function WorkspaceShell({ 
  pageNav, 
  sidebar, 
  listPane, 
  detailPane,
  rightSidebar,
  rightSidebarCollapsed = false,
  onToggleRightSidebar,
  topFilters
}: WorkspaceShellProps) {
  // Determine grid class based on sidebar, right sidebar presence and state
  const hasSidebar = Boolean(sidebar);
  const hasRightSidebar = Boolean(rightSidebar);
  
  let gridClass = 'workspace-grid';
  if (hasRightSidebar) {
    gridClass = rightSidebarCollapsed ? 'workspace-grid-four-collapsed' : 'workspace-grid-four';
  } else if (!hasSidebar) {
    gridClass = 'workspace-grid-two';
  }

  return (
    <div className="workspace-frame">
      {/* Left navigation sidebar */}
      {pageNav && (
        <aside className="app-sidebar">
          <div className="app-sidebar-header">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
              <img
                src="/assets/policy-pilot-image.png"
                alt="PolicyPilot"
                style={{ height: '60px', width: 'auto' }}
              />
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>
                Policy Intelligence
              </h2>
            </div>
          </div>
          {pageNav}
        </aside>
      )}
      
      {/* Main content area */}
      <div className="workspace-main">
        {/* Top filters bar */}
        {topFilters && (
          <div className="workspace-top-filters">
            {topFilters}
          </div>
        )}
        
        <div className={gridClass}>
          {sidebar && <aside className="sidebar">{sidebar}</aside>}
          {listPane && <section className="workspace-column workspace-column-list">{listPane}</section>}
          <section className={`workspace-column workspace-column-detail${!listPane && !sidebar ? ' workspace-column-full-width' : !listPane ? ' workspace-column-full' : ''}`}>{detailPane}</section>
          {rightSidebar && (
            <aside className={`workspace-column workspace-column-right ${rightSidebarCollapsed ? 'workspace-column-right-collapsed' : ''}`}>
              {rightSidebar}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
