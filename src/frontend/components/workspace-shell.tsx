import type { ReactNode } from 'react';

type WorkspaceShellProps = {
  pageNav?: ReactNode;
  sidebar: ReactNode;
  listPane: ReactNode;
  detailPane: ReactNode;
};

export function WorkspaceShell({ pageNav, sidebar, listPane, detailPane }: WorkspaceShellProps) {
  return (
    <div className="workspace-frame">
      <div className="workspace-topbar">
        <div>
          <p className="eyebrow">PolicyPilot</p>
          <h1>Policy Intelligence</h1>
        </div>
        <div className="topbar-actions">
          {pageNav}
          <div className="topbar-status">
            <span className="status-dot" />
            Hybrid policy intelligence layer live
          </div>
        </div>
      </div>

      <div className="workspace-grid">
        {sidebar}
        <section className="workspace-column workspace-column-list">{listPane}</section>
        <section className="workspace-column workspace-column-detail">{detailPane}</section>
      </div>
    </div>
  );
}
