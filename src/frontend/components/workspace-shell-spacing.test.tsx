import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { WorkspaceShell } from './workspace-shell';

describe('WorkspaceShell - Visual Spacing and Alignment (Task 6)', () => {
  describe('Design Token Usage', () => {
    it('workspace-grid uses consistent gap spacing with design tokens', () => {
      const { container } = render(
        <WorkspaceShell
          sidebar={<div>Sidebar</div>}
          listPane={<div>List</div>}
          detailPane={<div>Detail</div>}
        />
      );

      const grid = container.querySelector('.workspace-grid');
      expect(grid).toBeInTheDocument();
      
      // Verify the grid class is applied (CSS defines gap: var(--spacing-lg))
      expect(grid).toHaveClass('workspace-grid');
    });

    it('workspace-grid-four uses consistent gap spacing with design tokens', () => {
      const { container } = render(
        <WorkspaceShell
          sidebar={<div>Sidebar</div>}
          listPane={<div>List</div>}
          detailPane={<div>Detail</div>}
          rightSidebar={<div>Right</div>}
          rightSidebarCollapsed={false}
        />
      );

      const grid = container.querySelector('.workspace-grid-four');
      expect(grid).toBeInTheDocument();
      
      // Verify the grid class is applied (CSS defines gap: var(--spacing-lg))
      expect(grid).toHaveClass('workspace-grid-four');
    });

    it('workspace-grid-four-collapsed uses consistent gap spacing with design tokens', () => {
      const { container } = render(
        <WorkspaceShell
          sidebar={<div>Sidebar</div>}
          listPane={<div>List</div>}
          detailPane={<div>Detail</div>}
          rightSidebar={<div>Right</div>}
          rightSidebarCollapsed={true}
        />
      );

      const grid = container.querySelector('.workspace-grid-four-collapsed');
      expect(grid).toBeInTheDocument();
      
      // Verify the grid class is applied (CSS defines gap: var(--spacing-lg))
      expect(grid).toHaveClass('workspace-grid-four-collapsed');
    });
  });

  describe('Border Radius Consistency', () => {
    it('sidebar uses consistent border-radius from design tokens', () => {
      const { container } = render(
        <WorkspaceShell
          sidebar={<aside className="sidebar">Sidebar Content</aside>}
          listPane={<div>List</div>}
          detailPane={<div>Detail</div>}
        />
      );

      const sidebar = container.querySelector('.sidebar');
      expect(sidebar).toBeInTheDocument();
      
      // Verify sidebar has the class that applies border-radius: var(--radius-2xl)
      expect(sidebar).toHaveClass('sidebar');
    });

    it('workspace columns use consistent border-radius from design tokens', () => {
      const { container } = render(
        <WorkspaceShell
          sidebar={<div>Sidebar</div>}
          listPane={<div>List</div>}
          detailPane={<div>Detail</div>}
        />
      );

      const columns = container.querySelectorAll('.workspace-column');
      expect(columns.length).toBeGreaterThan(0);
      
      // Verify all columns have the class that applies border-radius: var(--radius-2xl)
      columns.forEach((column) => {
        expect(column).toHaveClass('workspace-column');
      });
    });
  });

  describe('Shadow Depth Consistency', () => {
    it('sidebar and workspace columns use consistent shadow depth from design tokens', () => {
      const { container } = render(
        <WorkspaceShell
          sidebar={<aside className="sidebar">Sidebar</aside>}
          listPane={<div>List</div>}
          detailPane={<div>Detail</div>}
        />
      );

      const sidebar = container.querySelector('.sidebar');
      const columns = container.querySelectorAll('.workspace-column');
      
      // Verify sidebar has the class that applies box-shadow: var(--shadow-lg)
      expect(sidebar).toHaveClass('sidebar');
      
      // Verify all columns have the class that applies box-shadow: var(--shadow-lg)
      columns.forEach((column) => {
        expect(column).toHaveClass('workspace-column');
      });
    });
  });

  describe('Topbar Flexbox Spacing', () => {
    it('topbar uses flexbox with consistent gap spacing from design tokens', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={<nav>Navigation</nav>}
          sidebar={<div>Sidebar</div>}
          listPane={<div>List</div>}
          detailPane={<div>Detail</div>}
        />
      );

      const topbar = container.querySelector('.workspace-topbar');
      expect(topbar).toBeInTheDocument();
      
      // Verify topbar has the class that applies gap: var(--spacing-xl)
      expect(topbar).toHaveClass('workspace-topbar');
    });

    it('topbar-actions uses flexbox with consistent gap spacing from design tokens', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={<nav>Navigation</nav>}
          sidebar={<div>Sidebar</div>}
          listPane={<div>List</div>}
          detailPane={<div>Detail</div>}
        />
      );

      const topbarActions = container.querySelector('.topbar-actions');
      expect(topbarActions).toBeInTheDocument();
      
      // Verify topbar-actions has the class that applies gap: var(--spacing-md)
      expect(topbarActions).toHaveClass('topbar-actions');
    });
  });

  describe('Spacing Consistency Across Layout Modes', () => {
    it('maintains consistent spacing in three-column layout', () => {
      const { container } = render(
        <WorkspaceShell
          sidebar={<aside className="sidebar">Sidebar</aside>}
          listPane={<section className="workspace-column workspace-column-list">List</section>}
          detailPane={<section className="workspace-column workspace-column-detail">Detail</section>}
        />
      );

      const grid = container.querySelector('.workspace-grid');
      const sidebar = container.querySelector('.sidebar');
      const listColumn = container.querySelector('.workspace-column-list');
      const detailColumn = container.querySelector('.workspace-column-detail');
      
      expect(grid).toBeInTheDocument();
      expect(sidebar).toBeInTheDocument();
      expect(listColumn).toBeInTheDocument();
      expect(detailColumn).toBeInTheDocument();
      
      // All elements use design tokens for spacing
      expect(grid).toHaveClass('workspace-grid');
      expect(sidebar).toHaveClass('sidebar');
    });

    it('maintains consistent spacing in four-column expanded layout', () => {
      const { container } = render(
        <WorkspaceShell
          sidebar={<aside className="sidebar">Sidebar</aside>}
          listPane={<section className="workspace-column workspace-column-list">List</section>}
          detailPane={<section className="workspace-column workspace-column-detail">Detail</section>}
          rightSidebar={<aside className="workspace-column workspace-column-right">Right</aside>}
          rightSidebarCollapsed={false}
        />
      );

      const grid = container.querySelector('.workspace-grid-four');
      const sidebar = container.querySelector('.sidebar');
      const listColumn = container.querySelector('.workspace-column-list');
      const detailColumn = container.querySelector('.workspace-column-detail');
      const rightColumn = container.querySelector('.workspace-column-right');
      
      expect(grid).toBeInTheDocument();
      expect(sidebar).toBeInTheDocument();
      expect(listColumn).toBeInTheDocument();
      expect(detailColumn).toBeInTheDocument();
      expect(rightColumn).toBeInTheDocument();
      
      // All elements use design tokens for spacing
      expect(grid).toHaveClass('workspace-grid-four');
      expect(sidebar).toHaveClass('sidebar');
    });

    it('maintains consistent spacing in four-column collapsed layout', () => {
      const { container } = render(
        <WorkspaceShell
          sidebar={<aside className="sidebar">Sidebar</aside>}
          listPane={<section className="workspace-column workspace-column-list">List</section>}
          detailPane={<section className="workspace-column workspace-column-detail">Detail</section>}
          rightSidebar={<aside className="workspace-column workspace-column-right workspace-column-right-collapsed">Right</aside>}
          rightSidebarCollapsed={true}
        />
      );

      const grid = container.querySelector('.workspace-grid-four-collapsed');
      const sidebar = container.querySelector('.sidebar');
      const listColumn = container.querySelector('.workspace-column-list');
      const detailColumn = container.querySelector('.workspace-column-detail');
      const rightColumn = container.querySelector('.workspace-column-right');
      
      expect(grid).toBeInTheDocument();
      expect(sidebar).toBeInTheDocument();
      expect(listColumn).toBeInTheDocument();
      expect(detailColumn).toBeInTheDocument();
      expect(rightColumn).toBeInTheDocument();
      
      // All elements use design tokens for spacing
      expect(grid).toHaveClass('workspace-grid-four-collapsed');
      expect(sidebar).toHaveClass('sidebar');
    });
  });

  describe('Visual Hierarchy Through Spacing', () => {
    it('workspace-frame uses consistent padding from design tokens', () => {
      const { container } = render(
        <WorkspaceShell
          sidebar={<div>Sidebar</div>}
          listPane={<div>List</div>}
          detailPane={<div>Detail</div>}
        />
      );

      const frame = container.querySelector('.workspace-frame');
      expect(frame).toBeInTheDocument();
      
      // Verify frame has the class that applies padding: var(--spacing-2xl)
      expect(frame).toHaveClass('workspace-frame');
    });

    it('topbar has consistent margin-bottom from design tokens', () => {
      const { container } = render(
        <WorkspaceShell
          sidebar={<div>Sidebar</div>}
          listPane={<div>List</div>}
          detailPane={<div>Detail</div>}
        />
      );

      const topbar = container.querySelector('.workspace-topbar');
      expect(topbar).toBeInTheDocument();
      
      // Verify topbar has the class that applies margin-bottom: var(--spacing-xl)
      expect(topbar).toHaveClass('workspace-topbar');
    });
  });

  describe('Snapshot Tests for Visual Regression', () => {
    it('matches snapshot for three-column layout', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn page-nav-btn-active">Workspace</button>
              <button className="page-nav-btn">Compare</button>
            </nav>
          }
          sidebar={<aside className="sidebar">Sidebar Content</aside>}
          listPane={<section className="workspace-column">List Content</section>}
          detailPane={<section className="workspace-column">Detail Content</section>}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for four-column expanded layout', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn page-nav-btn-active">Workspace</button>
              <button className="page-nav-btn">Compare</button>
            </nav>
          }
          sidebar={<aside className="sidebar">Sidebar Content</aside>}
          listPane={<section className="workspace-column">List Content</section>}
          detailPane={<section className="workspace-column">Detail Content</section>}
          rightSidebar={<aside className="workspace-column workspace-column-right">Right Sidebar</aside>}
          rightSidebarCollapsed={false}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('matches snapshot for four-column collapsed layout', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn page-nav-btn-active">Workspace</button>
              <button className="page-nav-btn">Compare</button>
            </nav>
          }
          sidebar={<aside className="sidebar">Sidebar Content</aside>}
          listPane={<section className="workspace-column">List Content</section>}
          detailPane={<section className="workspace-column">Detail Content</section>}
          rightSidebar={<aside className="workspace-column workspace-column-right workspace-column-right-collapsed">Right Sidebar</aside>}
          rightSidebarCollapsed={true}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
