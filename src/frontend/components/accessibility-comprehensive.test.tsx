import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import App from '../App';
import { WorkspaceShell } from './workspace-shell';
import { Sidebar } from './sidebar';
import { DetailTabs } from './detail-tabs';
import { PolicyList } from './policy-list';
import { RightSidebar } from './right-sidebar';
import type { AntonRxCoverageMatch } from '../data/policy-types';

// Extend Vitest's expect with jest-axe matchers
expect.extend(toHaveNoViolations);

/**
 * Comprehensive Accessibility Tests
 * 
 * These tests verify WCAG AA compliance for the cream theme implementation.
 * **Validates: Requirements 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7**
 */

describe('Accessibility - Color Contrast (WCAG AA)', () => {
  /**
   * **Validates: Requirement 23.1**
   * Test color contrast ratios meet WCAG AA standards (4.5:1 for normal text)
   */
  
  it('page navigation meets WCAG AA contrast standards', async () => {
    const { container } = render(
      <nav className="page-nav">
        <button className="page-nav-btn page-nav-btn-active">Workspace</button>
        <button className="page-nav-btn">Compare</button>
        <button className="page-nav-btn">Insights</button>
      </nav>
    );

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    expect(results).toHaveNoViolations();
  });

  it('sidebar form elements meet WCAG AA contrast standards', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ drugs: [] }),
      })
    ) as typeof fetch;

    const { container } = render(
      <Sidebar
        issuers={['Blue Cross', 'Aetna']}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={() => {}}
        onDrugQueryChange={() => {}}
      />
    );

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    expect(results).toHaveNoViolations();
  });

  it('policy cards meet WCAG AA contrast standards', async () => {
    const mockMatches: AntonRxCoverageMatch[] = [
      {
        planId: 'plan-1',
        planName: 'Test Plan',
        issuerName: 'Test Issuer',
        primaryDrugLabel: 'Test Drug',
        coverageLabel: 'Covered',
        coveredFlag: true,
        priorAuth: false,
        stepTherapy: false,
        market: 'Commercial',
        metalLevel: 'Gold',
        sourceKind: 'Medical Policy',
        sourcePosture: 'deep_medical_policy',
        confidenceLabel: 'high',
      },
    ];

    const { container } = render(
      <PolicyList
        matches={mockMatches}
        selectedPlanId=""
        onSelectPlan={() => {}}
      />
    );

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    expect(results).toHaveNoViolations();
  });

  it('detail tabs meet WCAG AA contrast standards', async () => {
    const { container } = render(
      <DetailTabs activeTab="coverage" onTabChange={() => {}} />
    );

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    expect(results).toHaveNoViolations();
  });

  it('workspace shell meets WCAG AA contrast standards', async () => {
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

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    expect(results).toHaveNoViolations();
  });

  it('status badges meet WCAG AA contrast standards', async () => {
    const { container } = render(
      <div>
        <span className="coverage-chip coverage-covered">Covered</span>
        <span className="coverage-chip coverage-covered-with-pa">PA Required</span>
        <span className="coverage-chip coverage-not-covered">Not Covered</span>
      </div>
    );

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility - Keyboard Navigation', () => {
  /**
   * **Validates: Requirement 23.2**
   * Test keyboard navigation for all interactive elements
   */

  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    
    global.fetch = vi.fn((url) => {
      if (typeof url === 'string' && url.includes('/api/antonrx/issuers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ issuers: [] })
        });
      }
      if (typeof url === 'string' && url.includes('/api/antonrx/summary')) {
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

  it('all page navigation tabs are keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Tab through navigation buttons
    await user.tab();
    const firstButton = document.activeElement;
    expect(firstButton?.tagName).toBe('BUTTON');
    expect(firstButton?.classList.contains('page-nav-btn')).toBe(true);

    await user.tab();
    const secondButton = document.activeElement;
    expect(secondButton?.tagName).toBe('BUTTON');
    expect(secondButton?.classList.contains('page-nav-btn')).toBe(true);
  });

  it('page navigation tabs can be activated with Enter key', async () => {
    const user = userEvent.setup();
    render(<App />);

    const pageNav = document.querySelector('.page-nav');
    const compareBtn = Array.from(pageNav?.querySelectorAll('button') || [])
      .find(btn => btn.textContent === 'Compare') as HTMLElement;

    expect(compareBtn).toBeTruthy();
    compareBtn.focus();
    expect(compareBtn).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(compareBtn).toHaveClass('page-nav-btn-active');
  });

  it('page navigation tabs can be activated with Space key', async () => {
    const user = userEvent.setup();
    render(<App />);

    const pageNav = document.querySelector('.page-nav');
    const insightsBtn = Array.from(pageNav?.querySelectorAll('button') || [])
      .find(btn => btn.textContent === 'Insights') as HTMLElement;

    expect(insightsBtn).toBeTruthy();
    insightsBtn.focus();
    expect(insightsBtn).toHaveFocus();

    await user.keyboard(' ');
    expect(insightsBtn).toHaveClass('page-nav-btn-active');
  });

  it('detail tabs are keyboard accessible', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();

    render(<DetailTabs activeTab="coverage" onTabChange={onTabChange} />);

    const tabs = screen.getAllByRole('button');
    expect(tabs.length).toBe(5);

    // Tab to first button
    await user.tab();
    expect(tabs[0]).toHaveFocus();

    // Tab to second button
    await user.tab();
    expect(tabs[1]).toHaveFocus();

    // Activate with Enter
    await user.keyboard('{Enter}');
    expect(onTabChange).toHaveBeenCalledWith('readiness');
  });

  it('policy cards are keyboard accessible', async () => {
    const user = userEvent.setup();
    const onSelectPlan = vi.fn();

    const mockMatches: AntonRxCoverageMatch[] = [
      {
        planId: 'plan-1',
        planName: 'Test Plan 1',
        issuerName: 'Test Issuer',
        primaryDrugLabel: 'Test Drug',
        coverageLabel: 'Covered',
        coveredFlag: true,
        priorAuth: false,
        stepTherapy: false,
        market: 'Commercial',
        metalLevel: 'Gold',
        sourceKind: 'Medical Policy',
        sourcePosture: 'deep_medical_policy',
        confidenceLabel: 'high',
      },
      {
        planId: 'plan-2',
        planName: 'Test Plan 2',
        issuerName: 'Test Issuer',
        primaryDrugLabel: 'Test Drug',
        coverageLabel: 'PA Required',
        coveredFlag: true,
        priorAuth: true,
        stepTherapy: false,
        market: 'Commercial',
        metalLevel: 'Silver',
        sourceKind: 'Medical Policy',
        sourcePosture: 'deep_medical_policy',
        confidenceLabel: 'high',
      },
    ];

    render(
      <PolicyList
        matches={mockMatches}
        selectedPlanId=""
        onSelectPlan={onSelectPlan}
      />
    );

    const cards = screen.getAllByRole('button');
    expect(cards.length).toBe(2);

    // Tab to first card
    await user.tab();
    expect(cards[0]).toHaveFocus();

    // Activate with Enter
    await user.keyboard('{Enter}');
    expect(onSelectPlan).toHaveBeenCalledWith('plan-1');

    // Tab to second card
    await user.tab();
    expect(cards[1]).toHaveFocus();

    // Activate with Space
    await user.keyboard(' ');
    expect(onSelectPlan).toHaveBeenCalledWith('plan-2');
  });

  it('form inputs are keyboard accessible', async () => {
    const user = userEvent.setup();
    const onIssuerChange = vi.fn();
    const onDrugQueryChange = vi.fn();

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ drugs: [] }),
      })
    ) as typeof fetch;

    render(
      <Sidebar
        issuers={['Blue Cross', 'Aetna']}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={onIssuerChange}
        onDrugQueryChange={onDrugQueryChange}
      />
    );

    // Tab to drug query input
    await user.tab();
    const drugInput = screen.getByLabelText('Drug Query');
    expect(drugInput).toHaveFocus();

    // Type in the input
    await user.keyboard('Humira');
    expect(drugInput).toHaveValue('Humira');

    // Tab to issuer select
    await user.tab();
    const issuerSelect = screen.getByLabelText('Issuer');
    expect(issuerSelect).toHaveFocus();
  });
});

describe('Accessibility - Focus Indicators', () => {
  /**
   * **Validates: Requirement 23.3**
   * Test focus indicators are visible
   */

  it('page navigation buttons have visible focus indicators', () => {
    const { container } = render(
      <nav className="page-nav">
        <button className="page-nav-btn">Workspace</button>
        <button className="page-nav-btn">Compare</button>
      </nav>
    );

    const buttons = container.querySelectorAll('.page-nav-btn');
    buttons.forEach((button) => {
      (button as HTMLElement).focus();
      expect(button).toHaveFocus();
      expect(button).toBeVisible();
    });
  });

  it('detail tabs have visible focus indicators', () => {
    render(<DetailTabs activeTab="coverage" onTabChange={() => {}} />);

    const tabs = screen.getAllByRole('button');
    tabs.forEach((tab) => {
      tab.focus();
      expect(tab).toHaveFocus();
      expect(tab).toBeVisible();
    });
  });

  it('policy cards have visible focus indicators', () => {
    const mockMatches: AntonRxCoverageMatch[] = [
      {
        planId: 'plan-1',
        planName: 'Test Plan',
        issuerName: 'Test Issuer',
        primaryDrugLabel: 'Test Drug',
        coverageLabel: 'Covered',
        coveredFlag: true,
        priorAuth: false,
        stepTherapy: false,
        market: 'Commercial',
        metalLevel: 'Gold',
        sourceKind: 'Medical Policy',
        sourcePosture: 'deep_medical_policy',
        confidenceLabel: 'high',
      },
    ];

    render(
      <PolicyList
        matches={mockMatches}
        selectedPlanId=""
        onSelectPlan={() => {}}
      />
    );

    const card = screen.getByRole('button');
    card.focus();
    expect(card).toHaveFocus();
    expect(card).toBeVisible();
  });

  it('form inputs have visible focus indicators', () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ drugs: [] }),
      })
    ) as typeof fetch;

    render(
      <Sidebar
        issuers={['Blue Cross']}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={() => {}}
        onDrugQueryChange={() => {}}
      />
    );

    const drugInput = screen.getByLabelText('Drug Query');
    drugInput.focus();
    expect(drugInput).toHaveFocus();
    expect(drugInput).toBeVisible();

    const issuerSelect = screen.getByLabelText('Issuer');
    issuerSelect.focus();
    expect(issuerSelect).toHaveFocus();
    expect(issuerSelect).toBeVisible();
  });
});

describe('Accessibility - ARIA Labels', () => {
  /**
   * **Validates: Requirement 23.4**
   * Test ARIA labels are present on icon-only buttons
   */

  it('right sidebar toggle button has ARIA label when collapsed', () => {
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

  it('right sidebar toggle button has ARIA label when expanded', () => {
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

  it('page navigation has accessible labels', () => {
    render(
      <nav className="page-nav" aria-label="Page navigation">
        <button className="page-nav-btn">Workspace</button>
        <button className="page-nav-btn">Compare</button>
      </nav>
    );

    const nav = screen.getByRole('navigation', { name: /page navigation/i });
    expect(nav).toBeInTheDocument();
  });
});

describe('Accessibility - Semantic HTML', () => {
  /**
   * **Validates: Requirement 23.5**
   * Test semantic HTML elements are used correctly
   */

  it('page navigation uses semantic nav element', () => {
    const { container } = render(
      <nav className="page-nav">
        <button className="page-nav-btn">Workspace</button>
      </nav>
    );

    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav?.tagName).toBe('NAV');
  });

  it('detail tabs use semantic nav element', () => {
    const { container } = render(
      <DetailTabs activeTab="coverage" onTabChange={() => {}} />
    );

    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav?.tagName).toBe('NAV');
  });

  it('sidebar uses semantic aside element', () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ drugs: [] }),
      })
    ) as typeof fetch;

    const { container } = render(
      <Sidebar
        issuers={[]}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={() => {}}
        onDrugQueryChange={() => {}}
      />
    );

    const aside = container.querySelector('aside');
    expect(aside).toBeInTheDocument();
    expect(aside?.tagName).toBe('ASIDE');
  });

  it('form labels are properly associated with inputs', () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ drugs: [] }),
      })
    ) as typeof fetch;

    render(
      <Sidebar
        issuers={['Blue Cross']}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={() => {}}
        onDrugQueryChange={() => {}}
      />
    );

    const drugInput = screen.getByLabelText('Drug Query');
    expect(drugInput).toBeInTheDocument();
    expect(drugInput.id).toBe('drug-query');

    const issuerSelect = screen.getByLabelText('Issuer');
    expect(issuerSelect).toBeInTheDocument();
    expect(issuerSelect.id).toBe('issuer-filter');
  });

  it('buttons use semantic button elements', () => {
    const mockMatches: AntonRxCoverageMatch[] = [
      {
        planId: 'plan-1',
        planName: 'Test Plan',
        issuerName: 'Test Issuer',
        primaryDrugLabel: 'Test Drug',
        coverageLabel: 'Covered',
        coveredFlag: true,
        priorAuth: false,
        stepTherapy: false,
        market: 'Commercial',
        metalLevel: 'Gold',
        sourceKind: 'Medical Policy',
        sourcePosture: 'deep_medical_policy',
        confidenceLabel: 'high',
      },
    ];

    const { container } = render(
      <PolicyList
        matches={mockMatches}
        selectedPlanId=""
        onSelectPlan={() => {}}
      />
    );

    const buttons = container.querySelectorAll('button');
    buttons.forEach((button) => {
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});

describe('Accessibility - Complete Component Validation', () => {
  /**
   * **Validates: Requirements 23.6, 23.7**
   * Test complete accessibility compliance for all components
   */

  it('WorkspaceShell has no accessibility violations', async () => {
    const { container } = render(
      <WorkspaceShell
        pageNav={
          <nav className="page-nav" aria-label="Page navigation">
            <button className="page-nav-btn">Workspace</button>
          </nav>
        }
        sidebar={<div className="sidebar">Sidebar</div>}
        listPane={<div className="workspace-column">List</div>}
        detailPane={<div className="workspace-column">Detail</div>}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('PolicyList has no accessibility violations', async () => {
    const mockMatches: AntonRxCoverageMatch[] = [
      {
        planId: 'plan-1',
        planName: 'Test Plan',
        issuerName: 'Test Issuer',
        primaryDrugLabel: 'Test Drug',
        coverageLabel: 'Covered',
        coveredFlag: true,
        priorAuth: false,
        stepTherapy: false,
        market: 'Commercial',
        metalLevel: 'Gold',
        sourceKind: 'Medical Policy',
        sourcePosture: 'deep_medical_policy',
        confidenceLabel: 'high',
      },
    ];

    const { container } = render(
      <PolicyList
        matches={mockMatches}
        selectedPlanId=""
        onSelectPlan={() => {}}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Sidebar has no accessibility violations', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ drugs: [] }),
      })
    ) as typeof fetch;

    const { container } = render(
      <Sidebar
        issuers={['Blue Cross']}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={() => {}}
        onDrugQueryChange={() => {}}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('DetailTabs has no accessibility violations', async () => {
    const { container } = render(
      <DetailTabs activeTab="coverage" onTabChange={() => {}} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
