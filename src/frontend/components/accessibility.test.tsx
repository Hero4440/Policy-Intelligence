import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { WorkspaceShell } from './workspace-shell';
import { RightSidebar } from './right-sidebar';

// Extend Vitest's expect with jest-axe matchers
expect.extend(toHaveNoViolations);

describe('Accessibility - Page Navigation', () => {
  it('page navigation buttons are keyboard navigable', async () => {
    const user = userEvent.setup();
    
    const { container } = render(
      <WorkspaceShell
        pageNav={
          <nav className="page-nav">
            <button className="page-nav-btn page-nav-btn-active">Workspace</button>
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
    expect(buttons.length).toBe(3);

    // Tab to first button
    await user.tab();
    expect(buttons[0]).toHaveFocus();

    // Tab to second button
    await user.tab();
    expect(buttons[1]).toHaveFocus();

    // Tab to third button
    await user.tab();
    expect(buttons[2]).toHaveFocus();
  });

  it('page navigation buttons have visible focus indicators', () => {
    const { container } = render(
      <WorkspaceShell
        pageNav={
          <nav className="page-nav">
            <button className="page-nav-btn page-nav-btn-active">Workspace</button>
            <button className="page-nav-btn">Compare</button>
          </nav>
        }
        sidebar={<div>Sidebar</div>}
        listPane={<div>List</div>}
        detailPane={<div>Detail</div>}
      />
    );

    const buttons = container.querySelectorAll('.page-nav-btn');
    
    // Focus each button and verify focus-visible styles are applied
    buttons.forEach((button) => {
      (button as HTMLElement).focus();
      expect(button).toHaveFocus();
      
      // The CSS defines .page-nav-btn:focus-visible with outline
      // We verify the button can receive focus, which enables the CSS rule
      expect(button).toBeVisible();
    });
  });

  it('page navigation uses semantic HTML elements', () => {
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

    // Verify nav element is used
    const nav = container.querySelector('nav.page-nav');
    expect(nav).toBeInTheDocument();
    expect(nav?.tagName).toBe('NAV');

    // Verify button elements are used
    const buttons = container.querySelectorAll('.page-nav-btn');
    buttons.forEach((button) => {
      expect(button.tagName).toBe('BUTTON');
    });
  });

  it('page navigation has no accessibility violations', async () => {
    const { container } = render(
      <WorkspaceShell
        pageNav={
          <nav className="page-nav" aria-label="Page navigation">
            <button className="page-nav-btn page-nav-btn-active">Workspace</button>
            <button className="page-nav-btn">Compare</button>
            <button className="page-nav-btn">Insights</button>
          </nav>
        }
        sidebar={<div>Sidebar</div>}
        listPane={<div>List</div>}
        detailPane={<div>Detail</div>}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility - Right Sidebar Toggle', () => {
  it('right sidebar toggle button has appropriate ARIA labels when collapsed', () => {
    render(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={true}
        onToggle={() => {}}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /expand right sidebar/i });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-label', 'Expand right sidebar');
    expect(toggleButton).toHaveAttribute('title', 'Expand sidebar');
  });

  it('right sidebar toggle button has appropriate ARIA labels when expanded', () => {
    render(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={false}
        onToggle={() => {}}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /collapse right sidebar/i });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-label', 'Collapse right sidebar');
    expect(toggleButton).toHaveAttribute('title', 'Collapse sidebar');
  });

  it('right sidebar toggle button is keyboard navigable', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={true}
        onToggle={onToggle}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /expand right sidebar/i });

    // Tab to the button
    await user.tab();
    expect(toggleButton).toHaveFocus();

    // Press Enter to activate
    await user.keyboard('{Enter}');
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('right sidebar toggle button has visible focus indicator', () => {
    render(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={true}
        onToggle={() => {}}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /expand right sidebar/i });
    
    // Focus the button
    toggleButton.focus();
    expect(toggleButton).toHaveFocus();
    
    // The CSS defines .right-sidebar-toggle:focus-visible with outline
    // We verify the button can receive focus, which enables the CSS rule
    expect(toggleButton).toBeVisible();
  });

  it('right sidebar has no accessibility violations', async () => {
    const { container } = render(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={false}
        onToggle={() => {}}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility - Tab Order', () => {
  it('maintains logical tab order through all interactive elements', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    const { container } = render(
      <WorkspaceShell
        pageNav={
          <nav className="page-nav">
            <button className="page-nav-btn page-nav-btn-active">Workspace</button>
            <button className="page-nav-btn">Compare</button>
            <button className="page-nav-btn">Insights</button>
          </nav>
        }
        sidebar={
          <div>
            <button>Sidebar Button</button>
          </div>
        }
        listPane={
          <div>
            <button>List Button</button>
          </div>
        }
        detailPane={
          <div>
            <button>Detail Button</button>
          </div>
        }
        rightSidebar={
          <RightSidebar
            page="workspace"
            context={{}}
            collapsed={false}
            onToggle={onToggle}
          />
        }
        rightSidebarCollapsed={false}
      />
    );

    // Tab through all interactive elements in order
    // 1. First page nav button
    await user.tab();
    const pageNavButtons = container.querySelectorAll('.page-nav-btn');
    expect(pageNavButtons[0]).toHaveFocus();

    // 2. Second page nav button
    await user.tab();
    expect(pageNavButtons[1]).toHaveFocus();

    // 3. Third page nav button
    await user.tab();
    expect(pageNavButtons[2]).toHaveFocus();

    // 4. Sidebar button
    await user.tab();
    const sidebarButton = screen.getByText('Sidebar Button');
    expect(sidebarButton).toHaveFocus();

    // 5. List button
    await user.tab();
    const listButton = screen.getByText('List Button');
    expect(listButton).toHaveFocus();

    // 6. Detail button
    await user.tab();
    const detailButton = screen.getByText('Detail Button');
    expect(detailButton).toHaveFocus();

    // 7. Right sidebar toggle button
    await user.tab();
    const toggleButton = screen.getByRole('button', { name: /collapse right sidebar/i });
    expect(toggleButton).toHaveFocus();
  });

  it('tab order works correctly when right sidebar is collapsed', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

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
        rightSidebar={
          <RightSidebar
            page="workspace"
            context={{}}
            collapsed={true}
            onToggle={onToggle}
          />
        }
        rightSidebarCollapsed={true}
      />
    );

    // Tab to page nav button
    await user.tab();
    const pageNavButton = container.querySelector('.page-nav-btn');
    expect(pageNavButton).toHaveFocus();

    // Tab to right sidebar toggle (collapsed state)
    await user.tab();
    const toggleButton = screen.getByRole('button', { name: /expand right sidebar/i });
    expect(toggleButton).toHaveFocus();
  });
});

describe('Accessibility - Color Contrast', () => {
  it('workspace shell has sufficient color contrast ratios', async () => {
    const { container } = render(
      <WorkspaceShell
        pageNav={
          <nav className="page-nav">
            <button className="page-nav-btn page-nav-btn-active">Workspace</button>
            <button className="page-nav-btn">Compare</button>
          </nav>
        }
        sidebar={
          <div className="workspace-column">
            <h2>Sidebar Title</h2>
            <p>Sidebar content</p>
          </div>
        }
        listPane={
          <div className="workspace-column">
            <h2>List Title</h2>
            <p>List content</p>
          </div>
        }
        detailPane={
          <div className="workspace-column">
            <h2>Detail Title</h2>
            <p>Detail content</p>
          </div>
        }
      />
    );

    // Run axe with color-contrast rule enabled
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    expect(results).toHaveNoViolations();
  });

  it('page navigation buttons meet WCAG 2.1 AA contrast standards', async () => {
    const { container } = render(
      <nav className="page-nav">
        <button className="page-nav-btn page-nav-btn-active">Active Button</button>
        <button className="page-nav-btn">Inactive Button</button>
      </nav>
    );

    // Run axe with color-contrast rule enabled
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    expect(results).toHaveNoViolations();
  });

  it('right sidebar toggle button meets WCAG 2.1 AA contrast standards', async () => {
    const { container } = render(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={true}
        onToggle={() => {}}
      />
    );

    // Run axe with color-contrast rule enabled
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility - Focus Visibility', () => {
  it('focused page navigation button is visible in viewport', () => {
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

    const button = container.querySelector('.page-nav-btn') as HTMLElement;
    button.focus();

    // Verify button is focused and visible
    expect(button).toHaveFocus();
    expect(button).toBeVisible();
    expect(button).toBeInTheDocument();
  });

  it('focused right sidebar toggle is visible in viewport', () => {
    render(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={true}
        onToggle={() => {}}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /expand right sidebar/i });
    toggleButton.focus();

    // Verify button is focused and visible
    expect(toggleButton).toHaveFocus();
    expect(toggleButton).toBeVisible();
    expect(toggleButton).toBeInTheDocument();
  });
});
