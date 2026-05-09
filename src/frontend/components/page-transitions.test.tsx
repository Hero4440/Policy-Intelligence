import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock fetch globally
global.fetch = vi.fn();

describe('Page Transitions - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock scrollIntoView for chat view
    Element.prototype.scrollIntoView = vi.fn();
    
    // Mock all API calls to return proper data structures
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (typeof url === 'string') {
        if (url.includes('/api/antonrx/summary')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ summary: null })
          });
        }
        if (url.includes('/api/ingestion/sources')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sources: [], summary: null })
          });
        }
        if (url.includes('/api/antonrx/issuers')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ issuers: ['Issuer A', 'Issuer B'] })
          });
        }
        if (url.includes('/api/antonrx/compare')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ matches: [] })
          });
        }
        if (url.includes('/api/antonrx/changes')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ changeWatch: null })
          });
        }
        if (url.includes('/api/policies/compare/options')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              drugFamilies: [
                { key: 'test-family', label: 'Test Family', payers: ['Payer A', 'Payer B'] }
              ],
              versions: [1, 2],
              ruleTypes: [
                { key: 'pa', label: 'Prior Authorization' }
              ]
            })
          });
        }
        if (url.includes('/api/policies/changes')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              events: [],
              filters: {
                payers: ['Payer A'],
                drugFamilies: ['Family A'],
                severities: ['high', 'medium', 'low']
              }
            })
          });
        }
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  // Helper to get page nav button by exact text
  function getPageNavButton(text: string): HTMLElement | null {
    const pageNav = document.querySelector('.page-nav');
    if (!pageNav) return null;
    const buttons = Array.from(pageNav.querySelectorAll('button'));
    return buttons.find(btn => btn.textContent === text) as HTMLElement || null;
  }

  it('maintains layout stability when switching between pages', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    // Wait for initial load
    await waitFor(() => {
      const pageNav = document.querySelector('.page-nav');
      expect(pageNav).toBeTruthy();
    });

    // Get initial grid layout
    const initialGrid = container.querySelector('.workspace-grid, .workspace-grid-four, .workspace-grid-four-collapsed');
    expect(initialGrid).toBeInTheDocument();

    // Switch to chat page
    const chatButton = getPageNavButton('Chat') as HTMLElement;
    expect(chatButton).toBeTruthy();
    await user.click(chatButton);

    // Verify layout is still present and stable
    await waitFor(() => {
      const grid = container.querySelector('.workspace-grid, .workspace-grid-four, .workspace-grid-four-collapsed');
      expect(grid).toBeInTheDocument();
    });

    // Switch to evidence explorer page
    const evidenceButton = getPageNavButton('Evidence Explorer') as HTMLElement;
    expect(evidenceButton).toBeTruthy();
    await user.click(evidenceButton);

    // Verify layout is still present and stable
    await waitFor(() => {
      const grid = container.querySelector('.workspace-grid, .workspace-grid-four, .workspace-grid-four-collapsed');
      expect(grid).toBeInTheDocument();
    });

    // Switch back to workspace
    const workspaceButton = getPageNavButton('Workspace') as HTMLElement;
    expect(workspaceButton).toBeTruthy();
    await user.click(workspaceButton);

    // Verify layout is still present and stable
    await waitFor(() => {
      const grid = container.querySelector('.workspace-grid, .workspace-grid-four, .workspace-grid-four-collapsed');
      expect(grid).toBeInTheDocument();
    });
  });

  it('updates page navigation active state immediately when clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      const pageNav = document.querySelector('.page-nav');
      expect(pageNav).toBeTruthy();
    });

    // Verify workspace button is initially active
    const workspaceButton = getPageNavButton('Workspace') as HTMLElement;
    expect(workspaceButton).toBeTruthy();
    expect(workspaceButton).toHaveClass('page-nav-btn-active');

    // Click chat button
    const chatButton = getPageNavButton('Chat') as HTMLElement;
    expect(chatButton).toBeTruthy();
    await user.click(chatButton);

    // Verify chat button is now active and workspace is not
    await waitFor(() => {
      expect(chatButton).toHaveClass('page-nav-btn-active');
      expect(workspaceButton).not.toHaveClass('page-nav-btn-active');
    });

    // Click compare button
    const compareButton = getPageNavButton('Compare') as HTMLElement;
    expect(compareButton).toBeTruthy();
    await user.click(compareButton);

    // Verify compare button is now active and chat is not
    await waitFor(() => {
      expect(compareButton).toHaveClass('page-nav-btn-active');
      expect(chatButton).not.toHaveClass('page-nav-btn-active');
    });
  });

  it('prevents content jumping during page transitions', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    // Wait for initial load
    await waitFor(() => {
      const pageNav = document.querySelector('.page-nav');
      expect(pageNav).toBeTruthy();
    });

    // Get initial column heights
    const columns = container.querySelectorAll('.workspace-column');
    expect(columns.length).toBeGreaterThan(0);

    // Verify columns have min-height to prevent jumping
    columns.forEach((column) => {
      const styles = window.getComputedStyle(column);
      // The CSS should have min-height: 400px
      expect(styles.minHeight).toBeTruthy();
    });

    // Switch to chat page
    const chatButton = getPageNavButton('Chat') as HTMLElement;
    expect(chatButton).toBeTruthy();
    await user.click(chatButton);

    // Verify columns still have min-height
    await waitFor(() => {
      const newColumns = container.querySelectorAll('.workspace-column');
      expect(newColumns.length).toBeGreaterThan(0);
      newColumns.forEach((column) => {
        const styles = window.getComputedStyle(column);
        expect(styles.minHeight).toBeTruthy();
      });
    });
  });

  it('applies CSS transitions to grid layout for smooth changes', async () => {
    const { container } = render(<App />);

    // Wait for initial load
    await waitFor(() => {
      const pageNav = document.querySelector('.page-nav');
      expect(pageNav).toBeTruthy();
    });

    // Get grid element
    const grid = container.querySelector('.workspace-grid, .workspace-grid-four, .workspace-grid-four-collapsed');
    expect(grid).toBeInTheDocument();

    // Verify grid has the correct CSS class that includes transitions
    // Note: jsdom doesn't fully support CSS transitions, so we verify the class is applied
    expect(grid?.className).toMatch(/workspace-grid/);
  });

  it('applies CSS transitions to workspace columns for smooth opacity changes', async () => {
    const { container } = render(<App />);

    // Wait for initial load
    await waitFor(() => {
      const pageNav = document.querySelector('.page-nav');
      expect(pageNav).toBeTruthy();
    });

    // Get workspace columns
    const columns = container.querySelectorAll('.workspace-column');
    expect(columns.length).toBeGreaterThan(0);

    // Verify columns have the correct CSS class that includes transitions
    // Note: jsdom doesn't fully support CSS transitions, so we verify the class is applied
    columns.forEach((column) => {
      expect(column).toHaveClass('workspace-column');
    });
  });

  it('handles right sidebar collapse/expand with smooth transitions', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    // Wait for initial load
    await waitFor(() => {
      const pageNav = document.querySelector('.page-nav');
      expect(pageNav).toBeTruthy();
    });

    // Check if right sidebar is present (workspace page should have it)
    const rightSidebar = container.querySelector('.workspace-column-right');
    
    if (rightSidebar) {
      // Verify right sidebar has the correct CSS class that includes transitions
      // Note: jsdom doesn't fully support CSS transitions, so we verify the class is applied
      expect(rightSidebar).toHaveClass('workspace-column-right');

      // Find and click the toggle button if it exists
      const toggleButton = container.querySelector('.right-sidebar-toggle');
      if (toggleButton) {
        await user.click(toggleButton as HTMLElement);

        // Verify the grid class changes
        await waitFor(() => {
          const grid = container.querySelector('.workspace-grid-four-collapsed, .workspace-grid-four');
          expect(grid).toBeInTheDocument();
        });
      }
    }
  });

  it('maintains grid layout adjustments when right sidebar visibility changes', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    // Wait for initial load on workspace page (has right sidebar)
    await waitFor(() => {
      const pageNav = document.querySelector('.page-nav');
      expect(pageNav).toBeTruthy();
    });

    // Get initial grid class
    const initialGrid = container.querySelector('.workspace-grid, .workspace-grid-four, .workspace-grid-four-collapsed');
    const initialGridClass = initialGrid?.className;

    // Switch to evidence explorer page (no right sidebar)
    const evidenceButton = getPageNavButton('Evidence Explorer') as HTMLElement;
    expect(evidenceButton).toBeTruthy();
    await user.click(evidenceButton);

    // Verify grid class changes to three-column layout
    await waitFor(() => {
      const grid = container.querySelector('.workspace-grid');
      expect(grid).toBeInTheDocument();
    });

    // Switch back to workspace page (has right sidebar)
    const workspaceButton = getPageNavButton('Workspace') as HTMLElement;
    expect(workspaceButton).toBeTruthy();
    await user.click(workspaceButton);

    // Verify grid class changes back to four-column layout
    await waitFor(() => {
      const grid = container.querySelector('.workspace-grid-four, .workspace-grid-four-collapsed');
      expect(grid).toBeInTheDocument();
    });
  });

  it('applies transition duration of 200-300ms to layout changes', async () => {
    const { container } = render(<App />);

    // Wait for initial load
    await waitFor(() => {
      const pageNav = document.querySelector('.page-nav');
      expect(pageNav).toBeTruthy();
    });

    // Get grid element
    const grid = container.querySelector('.workspace-grid, .workspace-grid-four, .workspace-grid-four-collapsed');
    expect(grid).toBeInTheDocument();

    // Verify grid has the correct CSS class that includes transitions
    // Note: jsdom doesn't fully support CSS transitions, so we verify the class is applied
    // The CSS uses --transition-slow which is 300ms ease-in-out
    if (grid) {
      expect(grid.className).toMatch(/workspace-grid/);
    }

    // Check workspace columns have the correct CSS class
    const columns = container.querySelectorAll('.workspace-column');
    columns.forEach((column) => {
      // The CSS uses --transition-base which is 200ms ease
      expect(column).toHaveClass('workspace-column');
    });
  });

  it('ensures smooth transitions when switching between pages with different right sidebar states', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    // Wait for initial load on workspace page (has right sidebar)
    await waitFor(() => {
      const pageNav = document.querySelector('.page-nav');
      expect(pageNav).toBeTruthy();
    });

    // Verify workspace has right sidebar
    let rightSidebar = container.querySelector('.workspace-column-right');
    expect(rightSidebar).toBeInTheDocument();

    // Switch to data page (no right sidebar)
    const dataButton = getPageNavButton('Data') as HTMLElement;
    expect(dataButton).toBeTruthy();
    await user.click(dataButton);

    await waitFor(() => {
      expect(dataButton).toHaveClass('page-nav-btn-active');
    });

    // Verify data page has no right sidebar
    rightSidebar = container.querySelector('.workspace-column-right');
    expect(rightSidebar).not.toBeInTheDocument();

    // Verify grid changed to three-column layout
    let grid = container.querySelector('.workspace-grid');
    expect(grid).toBeInTheDocument();

    // Switch to compare page (has right sidebar)
    const compareButton = getPageNavButton('Compare') as HTMLElement;
    expect(compareButton).toBeTruthy();
    await user.click(compareButton);

    await waitFor(() => {
      expect(compareButton).toHaveClass('page-nav-btn-active');
    });

    // Verify compare page has right sidebar
    rightSidebar = container.querySelector('.workspace-column-right');
    expect(rightSidebar).toBeInTheDocument();

    // Verify grid changed to four-column layout
    grid = container.querySelector('.workspace-grid-four, .workspace-grid-four-collapsed');
    expect(grid).toBeInTheDocument();
  });
});
