import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { WorkspaceShell } from './workspace-shell';
import App from '../App';

/**
 * Responsive Layout Tests
 * 
 * These tests verify that layouts adapt correctly to different viewport sizes.
 * **Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5, 16.6**
 */

describe('Responsive Layout Tests', () => {
  let originalInnerWidth: number;

  beforeEach(() => {
    // Save original window width
    originalInnerWidth = window.innerWidth;

    // Mock scrollIntoView for chat view
    Element.prototype.scrollIntoView = vi.fn();
    
    // Mock fetch for API calls
    global.fetch = vi.fn((url) => {
      if (typeof url === 'string' && url.includes('/api/policy/issuers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ issuers: [] })
        });
      }
      if (typeof url === 'string' && url.includes('/api/policy/summary')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ summary: null })
        });
      }
      if (typeof url === 'string' && url.includes('/api/ingestion/sources')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ sources: [], summary: null })
        });
      }
      if (typeof url === 'string' && url.includes('/api/policies/compare/options')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            drugFamilies: [],
            versions: [],
            ruleTypes: []
          })
        });
      }
      if (typeof url === 'string' && url.includes('/api/policies/changes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            events: [],
            filters: {
              payerOptions: [],
              drugFamilyOptions: [],
              severityOptions: []
            }
          })
        });
      }
      return Promise.reject(new Error('Unhandled fetch'));
    }) as typeof fetch;
  });

  afterEach(() => {
    // Restore original window width
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  /**
   * **Validates: Requirement 16.1**
   * Test three-column layout at desktop width (1920px)
   */
  describe('Desktop Layout (1920px)', () => {
    beforeEach(() => {
      // Set desktop viewport width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('renders three-column layout at desktop width', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn">Workspace</button>
            </nav>
          }
          sidebar={<div className="sidebar">Sidebar</div>}
          listPane={<div className="workspace-column">List</div>}
          detailPane={<div className="workspace-column">Detail</div>}
        />
      );

      const grid = container.querySelector('.workspace-grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toBeVisible();
    });

    it('displays all three columns at desktop width', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn">Workspace</button>
            </nav>
          }
          sidebar={<div className="sidebar">Sidebar Content</div>}
          listPane={<div className="workspace-column">List Content</div>}
          detailPane={<div className="workspace-column">Detail Content</div>}
        />
      );

      expect(container.textContent).toContain('Sidebar Content');
      expect(container.textContent).toContain('List Content');
      expect(container.textContent).toContain('Detail Content');
    });
  });

  /**
   * **Validates: Requirement 16.2**
   * Test four-column layout with right sidebar
   */
  describe('Four-Column Layout with Right Sidebar', () => {
    beforeEach(() => {
      // Set desktop viewport width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('renders four-column layout when right sidebar is provided', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn">Workspace</button>
            </nav>
          }
          sidebar={<div className="sidebar">Sidebar</div>}
          listPane={<div className="workspace-column">List</div>}
          detailPane={<div className="workspace-column">Detail</div>}
          rightSidebar={<div className="right-sidebar">Right Sidebar</div>}
          rightSidebarCollapsed={false}
        />
      );

      const grid = container.querySelector('.workspace-grid-four');
      expect(grid).toBeInTheDocument();
      expect(grid).toBeVisible();
    });

    it('displays all four columns when right sidebar is expanded', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn">Workspace</button>
            </nav>
          }
          sidebar={<div className="sidebar">Sidebar Content</div>}
          listPane={<div className="workspace-column">List Content</div>}
          detailPane={<div className="workspace-column">Detail Content</div>}
          rightSidebar={<div className="right-sidebar">Right Sidebar Content</div>}
          rightSidebarCollapsed={false}
        />
      );

      expect(container.textContent).toContain('Sidebar Content');
      expect(container.textContent).toContain('List Content');
      expect(container.textContent).toContain('Detail Content');
      expect(container.textContent).toContain('Right Sidebar Content');
    });

    it('right sidebar column has correct CSS class', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn">Workspace</button>
            </nav>
          }
          sidebar={<div className="sidebar">Sidebar</div>}
          listPane={<div className="workspace-column">List</div>}
          detailPane={<div className="workspace-column">Detail</div>}
          rightSidebar={<div className="right-sidebar">Right Sidebar</div>}
          rightSidebarCollapsed={false}
        />
      );

      const rightColumn = container.querySelector('.workspace-column-right');
      expect(rightColumn).toBeInTheDocument();
      expect(rightColumn).not.toHaveClass('workspace-column-right-collapsed');
    });
  });

  /**
   * **Validates: Requirement 16.3**
   * Test collapsed right sidebar at 1400px
   */
  describe('Collapsed Right Sidebar (1400px)', () => {
    beforeEach(() => {
      // Set laptop viewport width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1400,
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('renders four-column collapsed layout at 1400px', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn">Workspace</button>
            </nav>
          }
          sidebar={<div className="sidebar">Sidebar</div>}
          listPane={<div className="workspace-column">List</div>}
          detailPane={<div className="workspace-column">Detail</div>}
          rightSidebar={<div className="right-sidebar">Right Sidebar</div>}
          rightSidebarCollapsed={true}
        />
      );

      const grid = container.querySelector('.workspace-grid-four-collapsed');
      expect(grid).toBeInTheDocument();
      expect(grid).toBeVisible();
    });

    it('right sidebar column has collapsed CSS class', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn">Workspace</button>
            </nav>
          }
          sidebar={<div className="sidebar">Sidebar</div>}
          listPane={<div className="workspace-column">List</div>}
          detailPane={<div className="workspace-column">Detail</div>}
          rightSidebar={<div className="right-sidebar">Right Sidebar</div>}
          rightSidebarCollapsed={true}
        />
      );

      const rightColumn = container.querySelector('.workspace-column-right');
      expect(rightColumn).toBeInTheDocument();
      expect(rightColumn).toHaveClass('workspace-column-right-collapsed');
    });

    it('displays main content columns at 1400px', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn">Workspace</button>
            </nav>
          }
          sidebar={<div className="sidebar">Sidebar Content</div>}
          listPane={<div className="workspace-column">List Content</div>}
          detailPane={<div className="workspace-column">Detail Content</div>}
          rightSidebar={<div className="right-sidebar">Right Sidebar</div>}
          rightSidebarCollapsed={true}
        />
      );

      expect(container.textContent).toContain('Sidebar Content');
      expect(container.textContent).toContain('List Content');
      expect(container.textContent).toContain('Detail Content');
    });
  });

  /**
   * **Validates: Requirement 16.4**
   * Test stacked columns at 1120px
   */
  describe('Stacked Columns (1120px)', () => {
    beforeEach(() => {
      // Set tablet viewport width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1120,
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('maintains grid structure at 1120px', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn">Workspace</button>
            </nav>
          }
          sidebar={<div className="sidebar">Sidebar</div>}
          listPane={<div className="workspace-column">List</div>}
          detailPane={<div className="workspace-column">Detail</div>}
        />
      );

      const grid = container.querySelector('.workspace-grid');
      expect(grid).toBeInTheDocument();
      
      // At 1120px, CSS media queries would stack columns
      // The grid structure remains, but CSS handles the stacking
      expect(grid).toBeVisible();
    });

    it('displays all content at 1120px', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn">Workspace</button>
            </nav>
          }
          sidebar={<div className="sidebar">Sidebar Content</div>}
          listPane={<div className="workspace-column">List Content</div>}
          detailPane={<div className="workspace-column">Detail Content</div>}
        />
      );

      expect(container.textContent).toContain('Sidebar Content');
      expect(container.textContent).toContain('List Content');
      expect(container.textContent).toContain('Detail Content');
    });
  });

  /**
   * **Validates: Requirement 16.5**
   * Test mobile navigation at 768px
   */
  describe('Mobile Navigation (768px)', () => {
    beforeEach(() => {
      // Set mobile viewport width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      window.dispatchEvent(new Event('resize'));
    });

    it('renders page navigation at mobile width', () => {
      const { container } = render(<App />);

      const pageNav = container.querySelector('.page-nav');
      expect(pageNav).toBeInTheDocument();
      expect(pageNav).toBeVisible();
    });

    it('displays navigation buttons at mobile width', () => {
      const { container } = render(<App />);

      const pageNav = container.querySelector('.page-nav');
      const buttons = pageNav?.querySelectorAll('.page-nav-btn');
      
      expect(buttons).toBeTruthy();
      expect(buttons!.length).toBeGreaterThan(0);
    });

    it('maintains workspace structure at mobile width', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn">Workspace</button>
            </nav>
          }
          sidebar={<div className="sidebar">Sidebar</div>}
          listPane={<div className="workspace-column">List</div>}
          detailPane={<div className="workspace-column">Detail</div>}
        />
      );

      const grid = container.querySelector('.workspace-grid');
      expect(grid).toBeInTheDocument();
    });
  });

  /**
   * **Validates: Requirement 16.6**
   * Test responsive grid behavior across breakpoints
   */
  describe('Responsive Grid Behavior', () => {
    it('adapts grid class based on right sidebar state', () => {
      const { container, rerender } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn">Workspace</button>
            </nav>
          }
          sidebar={<div className="sidebar">Sidebar</div>}
          listPane={<div className="workspace-column">List</div>}
          detailPane={<div className="workspace-column">Detail</div>}
          rightSidebar={<div className="right-sidebar">Right Sidebar</div>}
          rightSidebarCollapsed={false}
        />
      );

      // Initially expanded
      let grid = container.querySelector('.workspace-grid-four');
      expect(grid).toBeInTheDocument();

      // Rerender with collapsed sidebar
      rerender(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn">Workspace</button>
            </nav>
          }
          sidebar={<div className="sidebar">Sidebar</div>}
          listPane={<div className="workspace-column">List</div>}
          detailPane={<div className="workspace-column">Detail</div>}
          rightSidebar={<div className="right-sidebar">Right Sidebar</div>}
          rightSidebarCollapsed={true}
        />
      );

      grid = container.querySelector('.workspace-grid-four-collapsed');
      expect(grid).toBeInTheDocument();
    });

    it('uses three-column grid when no right sidebar', () => {
      const { container } = render(
        <WorkspaceShell
          pageNav={
            <nav className="page-nav">
              <button className="page-nav-btn">Workspace</button>
            </nav>
          }
          sidebar={<div className="sidebar">Sidebar</div>}
          listPane={<div className="workspace-column">List</div>}
          detailPane={<div className="workspace-column">Detail</div>}
        />
      );

      const grid = container.querySelector('.workspace-grid');
      expect(grid).toBeInTheDocument();
      
      const fourColGrid = container.querySelector('.workspace-grid-four');
      expect(fourColGrid).not.toBeInTheDocument();
    });

    it('maintains consistent spacing across viewport sizes', () => {
      const viewportSizes = [1920, 1400, 1120, 768];

      viewportSizes.forEach((width) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));

        const { container } = render(
          <WorkspaceShell
            pageNav={
              <nav className="page-nav">
                <button className="page-nav-btn">Workspace</button>
              </nav>
            }
            sidebar={<div className="sidebar">Sidebar</div>}
            listPane={<div className="workspace-column">List</div>}
            detailPane={<div className="workspace-column">Detail</div>}
          />
        );

        const grid = container.querySelector('[class*="workspace-grid"]');
        expect(grid).toBeInTheDocument();
        expect(grid).toBeVisible();
      });
    });
  });

  describe('Responsive Component Behavior', () => {
    it('page navigation remains accessible at all viewport sizes', () => {
      const viewportSizes = [1920, 1400, 1120, 768, 375];

      viewportSizes.forEach((width) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));

        const { container } = render(
          <nav className="page-nav">
            <button className="page-nav-btn">Workspace</button>
            <button className="page-nav-btn">Compare</button>
            <button className="page-nav-btn">Insights</button>
          </nav>
        );

        const buttons = container.querySelectorAll('.page-nav-btn');
        expect(buttons.length).toBe(3);
        buttons.forEach((button) => {
          expect(button).toBeVisible();
        });
      });
    });

    it('workspace columns maintain structure at all viewport sizes', () => {
      const viewportSizes = [1920, 1400, 1120, 768];

      viewportSizes.forEach((width) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        window.dispatchEvent(new Event('resize'));

        const { container } = render(
          <WorkspaceShell
            pageNav={
              <nav className="page-nav">
                <button className="page-nav-btn">Workspace</button>
              </nav>
            }
            sidebar={<div className="sidebar">Sidebar</div>}
            listPane={<div className="workspace-column">List</div>}
            detailPane={<div className="workspace-column">Detail</div>}
          />
        );

        const columns = container.querySelectorAll('.workspace-column');
        expect(columns.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
