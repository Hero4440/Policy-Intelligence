import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RightSidebar } from './right-sidebar';

describe('RightSidebar - Rendering on Supported Pages', () => {
  it('renders workspace right sidebar content', () => {
    const context = {
      selectedPlanId: 'plan-123',
      matches: [
        { planId: 'plan-123', issuerName: 'Issuer A', primaryDrugLabel: 'Drug A' },
        { planId: 'plan-456', issuerName: 'Issuer B', primaryDrugLabel: 'Drug B' },
      ],
    };

    render(
      <RightSidebar
        page="workspace"
        context={context}
        collapsed={false}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Related Policies')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('renders compare right sidebar content', () => {
    render(
      <RightSidebar
        page="compare"
        context={{}}
        collapsed={false}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Comparison History')).toBeInTheDocument();
    expect(screen.getByText('Saved Comparisons')).toBeInTheDocument();
  });

  it('renders changes right sidebar content', () => {
    render(
      <RightSidebar
        page="changes"
        context={{}}
        collapsed={false}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Timeline')).toBeInTheDocument();
    expect(screen.getByText('Quick Filters')).toBeInTheDocument();
  });

  it('renders patients right sidebar content', () => {
    const context = {
      selectedCase: {
        patientName: 'John Doe',
        diagnosis: 'Rheumatoid Arthritis',
      },
    };

    render(
      <RightSidebar
        page="patients"
        context={context}
        collapsed={false}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Case Summary')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Rheumatoid Arthritis')).toBeInTheDocument();
  });

  it('renders dashboard right sidebar content', () => {
    render(
      <RightSidebar
        page="dashboard"
        context={{}}
        collapsed={false}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Recent Notifications')).toBeInTheDocument();
    expect(screen.getByText('System Alerts')).toBeInTheDocument();
  });

  it('renders insights right sidebar with empty state', () => {
    render(
      <RightSidebar
        page="insights"
        context={{}}
        collapsed={false}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('No contextual information available')).toBeInTheDocument();
  });
});

describe('RightSidebar - Toggle Button Functionality', () => {
  it('calls onToggle when toggle button is clicked in expanded state', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={false}
        onToggle={onToggle}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /collapse right sidebar/i });
    await user.click(toggleButton);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onToggle when toggle button is clicked in collapsed state', async () => {
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
    await user.click(toggleButton);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('RightSidebar - Collapsed and Expanded States', () => {
  it('renders only toggle button when collapsed', () => {
    const { container } = render(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={true}
        onToggle={() => {}}
      />
    );

    // Should only render the toggle button
    const toggleButton = screen.getByRole('button', { name: /expand right sidebar/i });
    expect(toggleButton).toBeInTheDocument();

    // Should not render the container or content
    expect(container.querySelector('.right-sidebar-container')).not.toBeInTheDocument();
    expect(container.querySelector('.right-sidebar-content')).not.toBeInTheDocument();
  });

  it('renders full content when expanded', () => {
    const { container } = render(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={false}
        onToggle={() => {}}
      />
    );

    // Should render the container and content
    expect(container.querySelector('.right-sidebar-container')).toBeInTheDocument();
    expect(container.querySelector('.right-sidebar-content')).toBeInTheDocument();

    // Should render the toggle button in the header
    const toggleButton = screen.getByRole('button', { name: /collapse right sidebar/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('toggle button has correct CSS class', () => {
    const { container } = render(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={true}
        onToggle={() => {}}
      />
    );

    const toggleButton = container.querySelector('.right-sidebar-toggle');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveClass('right-sidebar-toggle');
  });
});

describe('RightSidebar - ARIA Labels', () => {
  it('has appropriate ARIA label on toggle button when collapsed', () => {
    render(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={true}
        onToggle={() => {}}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /expand right sidebar/i });
    expect(toggleButton).toHaveAttribute('aria-label', 'Expand right sidebar');
  });

  it('has appropriate ARIA label on toggle button when expanded', () => {
    render(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={false}
        onToggle={() => {}}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /collapse right sidebar/i });
    expect(toggleButton).toHaveAttribute('aria-label', 'Collapse right sidebar');
  });

  it('toggle button has title attribute for tooltip', () => {
    const { rerender } = render(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={true}
        onToggle={() => {}}
      />
    );

    let toggleButton = screen.getByRole('button', { name: /expand right sidebar/i });
    expect(toggleButton).toHaveAttribute('title', 'Expand sidebar');

    rerender(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={false}
        onToggle={() => {}}
      />
    );

    toggleButton = screen.getByRole('button', { name: /collapse right sidebar/i });
    expect(toggleButton).toHaveAttribute('title', 'Collapse sidebar');
  });
});

describe('RightSidebar - Empty States', () => {
  it('shows empty state when workspace has no selected plan', () => {
    render(
      <RightSidebar
        page="workspace"
        context={{}}
        collapsed={false}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Select a policy to see related options')).toBeInTheDocument();
  });

  it('shows empty state when patients has no selected case', () => {
    render(
      <RightSidebar
        page="patients"
        context={{}}
        collapsed={false}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('Select a case to view summary')).toBeInTheDocument();
  });

  it('shows empty state for compare page', () => {
    render(
      <RightSidebar
        page="compare"
        context={{}}
        collapsed={false}
        onToggle={() => {}}
      />
    );

    expect(screen.getByText('No recent comparisons')).toBeInTheDocument();
    expect(screen.getByText('No saved comparisons')).toBeInTheDocument();
  });
});
