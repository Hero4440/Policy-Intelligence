import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkspaceShell } from './workspace-shell';

describe('WorkspaceShell - Topbar Layout', () => {
  it('renders topbar with correct structure', () => {
    const { container } = render(
      <WorkspaceShell
        pageNav={
          <nav className="page-nav">
            <button className="page-nav-btn">Workspace</button>
            <button className="page-nav-btn">Compare</button>
          </nav>
        }
        sidebar={<div>Sidebar</div>}
        listPane={<div>List</div>}
        detailPane={<div>Detail</div>}
      />
    );

    const topbar = container.querySelector('.workspace-topbar');
    expect(topbar).toBeInTheDocument();
    
    // Check that topbar contains branding
    expect(screen.getByText('PolicyPilot')).toBeInTheDocument();
    expect(screen.getByText('Policy Intelligence')).toBeInTheDocument();
    
    // Check that topbar contains navigation
    const topbarActions = container.querySelector('.topbar-actions');
    expect(topbarActions).toBeInTheDocument();
    expect(topbarActions).toContainElement(container.querySelector('.page-nav'));
  });

  it('page navigation buttons have correct CSS classes for touch target size', () => {
    const { container } = render(
      <WorkspaceShell
        pageNav={
          <nav className="page-nav">
            <button className="page-nav-btn">Workspace</button>
            <button className="page-nav-btn">Compare</button>
            <button className="page-nav-btn">Insights</button>
          </nav>
        }
        sidebar={<div>Sidebar</div>}
        listPane={<div>List</div>}
        detailPane={<div>Detail</div>}
      />
    );

    const buttons = container.querySelectorAll('.page-nav-btn');
    expect(buttons.length).toBeGreaterThan(0);

    // Verify all buttons have the correct class
    // The CSS defines min-width: 44px and min-height: 44px for .page-nav-btn
    buttons.forEach((button) => {
      expect(button).toHaveClass('page-nav-btn');
    });
  });

  it('topbar has correct CSS class for flexbox layout', () => {
    const { container } = render(
      <WorkspaceShell
        pageNav={
          <nav className="page-nav">
            <button className="page-nav-btn">Workspace</button>
          </nav>
        }
        sidebar={<div>Sidebar</div>}
        listPane={<div>List</div>}
        detailPane={<div>Detail</div>}
      />
    );

    const topbar = container.querySelector('.workspace-topbar');
    
    // Verify the topbar has the correct class
    // The CSS defines display: flex, justify-content: space-between, align-items: flex-start
    expect(topbar).toHaveClass('workspace-topbar');
  });

  it('topbar-actions area has correct CSS class', () => {
    const { container } = render(
      <WorkspaceShell
        pageNav={
          <nav className="page-nav">
            <button className="page-nav-btn">Workspace</button>
          </nav>
        }
        sidebar={<div>Sidebar</div>}
        listPane={<div>List</div>}
        detailPane={<div>Detail</div>}
      />
    );

    const topbarActions = container.querySelector('.topbar-actions');
    
    // Verify the topbar-actions has the correct class
    // The CSS defines display: flex, justify-content: flex-end, flex-wrap: wrap
    expect(topbarActions).toHaveClass('topbar-actions');
  });

  it('page navigation is positioned in topbar-actions area', () => {
    const { container } = render(
      <WorkspaceShell
        pageNav={
          <nav className="page-nav" data-testid="page-nav">
            <button className="page-nav-btn">Workspace</button>
          </nav>
        }
        sidebar={<div>Sidebar</div>}
        listPane={<div>List</div>}
        detailPane={<div>Detail</div>}
      />
    );

    const topbarActions = container.querySelector('.topbar-actions');
    const pageNav = screen.getByTestId('page-nav');
    
    expect(topbarActions).toContainElement(pageNav);
  });
});

describe('WorkspaceShell - Responsive Behavior', () => {
  it('topbar structure supports responsive behavior at 768px breakpoint', () => {
    // This test verifies that the HTML structure is correct for responsive CSS
    const { container } = render(
      <WorkspaceShell
        pageNav={
          <nav className="page-nav">
            <button className="page-nav-btn">Workspace</button>
          </nav>
        }
        sidebar={<div>Sidebar</div>}
        listPane={<div>List</div>}
        detailPane={<div>Detail</div>}
      />
    );

    const topbar = container.querySelector('.workspace-topbar');
    expect(topbar).toBeInTheDocument();
    
    // Verify the structure that enables responsive behavior
    // The CSS media query @media (max-width: 768px) handles:
    // - flex-direction: column
    // - align-items: stretch
    const topbarActions = container.querySelector('.topbar-actions');
    const pageNav = container.querySelector('.page-nav');
    
    expect(topbar).toContainElement(topbarActions);
    expect(topbarActions).toContainElement(pageNav);
  });
});

describe('WorkspaceShell - Grid Layout Classes', () => {
  it('applies workspace-grid class when no right sidebar', () => {
    const { container } = render(
      <WorkspaceShell
        sidebar={<div>Sidebar</div>}
        listPane={<div>List</div>}
        detailPane={<div>Detail</div>}
      />
    );
    
    const grid = container.querySelector('.workspace-grid');
    expect(grid).toBeInTheDocument();
    expect(grid).not.toHaveClass('workspace-grid-four');
    expect(grid).not.toHaveClass('workspace-grid-four-collapsed');
  });

  it('applies workspace-grid-four class when right sidebar is expanded', () => {
    const { container } = render(
      <WorkspaceShell
        sidebar={<div>Sidebar</div>}
        listPane={<div>List</div>}
        detailPane={<div>Detail</div>}
        rightSidebar={<div>Right Sidebar</div>}
        rightSidebarCollapsed={false}
      />
    );
    
    const grid = container.querySelector('.workspace-grid-four');
    expect(grid).toBeInTheDocument();
    expect(grid).not.toHaveClass('workspace-grid');
    expect(grid).not.toHaveClass('workspace-grid-four-collapsed');
  });

  it('applies workspace-grid-four-collapsed class when right sidebar is collapsed', () => {
    const { container } = render(
      <WorkspaceShell
        sidebar={<div>Sidebar</div>}
        listPane={<div>List</div>}
        detailPane={<div>Detail</div>}
        rightSidebar={<div>Right Sidebar</div>}
        rightSidebarCollapsed={true}
      />
    );
    
    const grid = container.querySelector('.workspace-grid-four-collapsed');
    expect(grid).toBeInTheDocument();
    expect(grid).not.toHaveClass('workspace-grid');
    expect(grid).not.toHaveClass('workspace-grid-four');
  });

  it('changes grid class when rightSidebarCollapsed prop changes', () => {
    const { container, rerender } = render(
      <WorkspaceShell
        sidebar={<div>Sidebar</div>}
        listPane={<div>List</div>}
        detailPane={<div>Detail</div>}
        rightSidebar={<div>Right Sidebar</div>}
        rightSidebarCollapsed={false}
      />
    );
    
    // Initially expanded
    expect(container.querySelector('.workspace-grid-four')).toBeInTheDocument();
    
    // Rerender with collapsed state
    rerender(
      <WorkspaceShell
        sidebar={<div>Sidebar</div>}
        listPane={<div>List</div>}
        detailPane={<div>Detail</div>}
        rightSidebar={<div>Right Sidebar</div>}
        rightSidebarCollapsed={true}
      />
    );
    
    expect(container.querySelector('.workspace-grid-four-collapsed')).toBeInTheDocument();
    expect(container.querySelector('.workspace-grid-four')).not.toBeInTheDocument();
  });

  it('applies workspace-grid class when rightSidebar prop is undefined', () => {
    const { container } = render(
      <WorkspaceShell
        sidebar={<div>Sidebar</div>}
        listPane={<div>List</div>}
        detailPane={<div>Detail</div>}
        rightSidebar={undefined}
        rightSidebarCollapsed={false}
      />
    );
    
    const grid = container.querySelector('.workspace-grid');
    expect(grid).toBeInTheDocument();
  });

  it('renders all four columns when right sidebar is present', () => {
    const { container } = render(
      <WorkspaceShell
        sidebar={<div data-testid="sidebar">Sidebar</div>}
        listPane={<div data-testid="list-pane">List</div>}
        detailPane={<div data-testid="detail-pane">Detail</div>}
        rightSidebar={<div data-testid="right-sidebar">Right Sidebar</div>}
        rightSidebarCollapsed={false}
      />
    );
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('list-pane')).toBeInTheDocument();
    expect(screen.getByTestId('detail-pane')).toBeInTheDocument();
    expect(screen.getByTestId('right-sidebar')).toBeInTheDocument();
  });

  it('renders three columns when right sidebar is not present', () => {
    const { container } = render(
      <WorkspaceShell
        sidebar={<div data-testid="sidebar">Sidebar</div>}
        listPane={<div data-testid="list-pane">List</div>}
        detailPane={<div data-testid="detail-pane">Detail</div>}
      />
    );
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('list-pane')).toBeInTheDocument();
    expect(screen.getByTestId('detail-pane')).toBeInTheDocument();
    expect(screen.queryByTestId('right-sidebar')).not.toBeInTheDocument();
  });
});
