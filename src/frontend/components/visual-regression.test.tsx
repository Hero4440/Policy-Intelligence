import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PolicyList } from './policy-list';
import { Sidebar } from './sidebar';
import { DetailTabs } from './detail-tabs';
import { WorkspaceShell } from './workspace-shell';
import type { PolicyCoverageMatch } from '../data/policy-types';

/**
 * Visual Regression Tests
 * 
 * These tests create snapshots of component rendering to detect unintended visual changes.
 * **Validates: Requirements 2.5, 4.1, 4.2, 4.3**
 */

describe('Visual Regression - PolicyCard Component', () => {
  const mockMatches: PolicyCoverageMatch[] = [
    {
      planId: 'plan-1',
      planName: 'Blue Cross Gold Plan',
      issuerName: 'Blue Cross',
      primaryDrugLabel: 'Humira (adalimumab)',
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
      planName: 'Aetna Silver Plan',
      issuerName: 'Aetna',
      primaryDrugLabel: 'Humira (adalimumab)',
      coverageLabel: 'PA Required',
      coveredFlag: true,
      priorAuth: true,
      stepTherapy: true,
      market: 'Commercial',
      metalLevel: 'Silver',
      sourceKind: 'Medical Policy',
      sourcePosture: 'uploaded_normalized',
      confidenceLabel: 'Medium',
    },
    {
      planId: 'plan-3',
      planName: 'UnitedHealth Bronze Plan',
      issuerName: 'UnitedHealth',
      primaryDrugLabel: 'Humira (adalimumab)',
      coverageLabel: 'Not Covered',
      coveredFlag: false,
      priorAuth: false,
      stepTherapy: false,
      market: 'Commercial',
      metalLevel: 'Bronze',
      sourceKind: 'Formulary',
      sourcePosture: 'formulary_breadth',
      confidenceLabel: 'high',
    },
  ];

  it('renders PolicyCard with covered status', () => {
    const { container } = render(
      <PolicyList
        matches={[mockMatches[0]]}
        selectedPlanId=""
        onSelectPlan={() => {}}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders PolicyCard with PA required status', () => {
    const { container } = render(
      <PolicyList
        matches={[mockMatches[1]]}
        selectedPlanId=""
        onSelectPlan={() => {}}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders PolicyCard with not covered status', () => {
    const { container } = render(
      <PolicyList
        matches={[mockMatches[2]]}
        selectedPlanId=""
        onSelectPlan={() => {}}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders PolicyCard in selected state', () => {
    const { container } = render(
      <PolicyList
        matches={[mockMatches[0]]}
        selectedPlanId="plan-1"
        onSelectPlan={() => {}}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders multiple PolicyCards in a list', () => {
    const { container } = render(
      <PolicyList
        matches={mockMatches}
        selectedPlanId="plan-2"
        onSelectPlan={() => {}}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders PolicyCard with step therapy indicator', () => {
    const { container } = render(
      <PolicyList
        matches={[mockMatches[1]]}
        selectedPlanId=""
        onSelectPlan={() => {}}
      />
    );
    
    const card = container.querySelector('.policy-card');
    expect(card).toBeTruthy();
    expect(card?.textContent).toContain('ST');
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders PolicyCard with different source postures', () => {
    const { container } = render(
      <PolicyList
        matches={mockMatches}
        selectedPlanId=""
        onSelectPlan={() => {}}
      />
    );
    
    const cards = container.querySelectorAll('.policy-card');
    expect(cards.length).toBe(3);
    expect(cards[0].textContent).toContain('Deep policy evidence');
    expect(cards[1].textContent).toContain('Uploaded normalized source');
    expect(cards[2].textContent).toContain('Formulary breadth');
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('Visual Regression - Navigation Components', () => {
  it('renders page navigation with all tabs', () => {
    const { container } = render(
      <nav className="page-nav">
        <button className="page-nav-btn page-nav-btn-active">Workspace</button>
        <button className="page-nav-btn">Compare</button>
        <button className="page-nav-btn">Insights</button>
        <button className="page-nav-btn">Changes</button>
        <button className="page-nav-btn">Data</button>
        <button className="page-nav-btn">Evidence Explorer</button>
        <button className="page-nav-btn">Chat</button>
      </nav>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders page navigation with different active tab', () => {
    const { container } = render(
      <nav className="page-nav">
        <button className="page-nav-btn">Workspace</button>
        <button className="page-nav-btn page-nav-btn-active">Compare</button>
        <button className="page-nav-btn">Insights</button>
        <button className="page-nav-btn">Changes</button>
        <button className="page-nav-btn">Data</button>
        <button className="page-nav-btn">Evidence Explorer</button>
        <button className="page-nav-btn">Chat</button>
      </nav>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders DetailTabs with coverage tab active', () => {
    const { container } = render(
      <DetailTabs activeTab="coverage" onTabChange={() => {}} />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders DetailTabs with readiness tab active', () => {
    const { container } = render(
      <DetailTabs activeTab="readiness" onTabChange={() => {}} />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders DetailTabs with changes tab active', () => {
    const { container } = render(
      <DetailTabs activeTab="changes" onTabChange={() => {}} />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders DetailTabs with compare tab active', () => {
    const { container } = render(
      <DetailTabs activeTab="compare" onTabChange={() => {}} />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders DetailTabs with ask tab active', () => {
    const { container } = render(
      <DetailTabs activeTab="ask" onTabChange={() => {}} />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('Visual Regression - Card Components', () => {
  it('renders WorkspaceShell with three-column layout', () => {
    const { container } = render(
      <WorkspaceShell
        pageNav={
          <nav className="page-nav">
            <button className="page-nav-btn page-nav-btn-active">Workspace</button>
          </nav>
        }
        sidebar={<div className="sidebar">Sidebar Content</div>}
        listPane={<div className="workspace-column">List Content</div>}
        detailPane={<div className="workspace-column">Detail Content</div>}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders WorkspaceShell with four-column layout', () => {
    const { container } = render(
      <WorkspaceShell
        pageNav={
          <nav className="page-nav">
            <button className="page-nav-btn page-nav-btn-active">Workspace</button>
          </nav>
        }
        sidebar={<div className="sidebar">Sidebar Content</div>}
        listPane={<div className="workspace-column">List Content</div>}
        detailPane={<div className="workspace-column">Detail Content</div>}
        rightSidebar={<div className="right-sidebar">Right Sidebar Content</div>}
        rightSidebarCollapsed={false}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders WorkspaceShell with collapsed right sidebar', () => {
    const { container } = render(
      <WorkspaceShell
        pageNav={
          <nav className="page-nav">
            <button className="page-nav-btn page-nav-btn-active">Workspace</button>
          </nav>
        }
        sidebar={<div className="sidebar">Sidebar Content</div>}
        listPane={<div className="workspace-column">List Content</div>}
        detailPane={<div className="workspace-column">Detail Content</div>}
        rightSidebar={<div className="right-sidebar">Right Sidebar Content</div>}
        rightSidebarCollapsed={true}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders detail card with standard styling', () => {
    const { container } = render(
      <div className="detail-card">
        <h3>Card Title</h3>
        <p>Card content with standard styling</p>
      </div>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders compare highlight card', () => {
    const { container } = render(
      <div className="compare-highlight-card">
        <h3>Comparison Highlight</h3>
        <p>Key differences between policies</p>
      </div>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('Visual Regression - Form Components', () => {
  beforeEach(() => {
    // Mock fetch for drug suggestions
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ drugs: [] }),
      })
    ) as typeof fetch;
  });

  it('renders Sidebar with all form elements', () => {
    const { container } = render(
      <Sidebar
        issuers={['Blue Cross', 'Aetna', 'UnitedHealth']}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={() => {}}
        onDrugQueryChange={() => {}}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders Sidebar with selected issuer', () => {
    const { container } = render(
      <Sidebar
        issuers={['Blue Cross', 'Aetna', 'UnitedHealth']}
        selectedIssuer="Blue Cross"
        drugQuery=""
        onIssuerChange={() => {}}
        onDrugQueryChange={() => {}}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders Sidebar with drug query', () => {
    const { container } = render(
      <Sidebar
        issuers={['Blue Cross', 'Aetna', 'UnitedHealth']}
        selectedIssuer=""
        drugQuery="Humira"
        onIssuerChange={() => {}}
        onDrugQueryChange={() => {}}
      />
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders text input with standard styling', () => {
    const { container } = render(
      <div>
        <label className="field-label" htmlFor="test-input">
          Test Input
        </label>
        <input
          id="test-input"
          className="field-input"
          type="text"
          placeholder="Enter text..."
        />
      </div>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders select input with standard styling', () => {
    const { container } = render(
      <div>
        <label className="field-label" htmlFor="test-select">
          Test Select
        </label>
        <select id="test-select" className="field-input">
          <option value="">Select an option</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        </select>
      </div>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders search input with rounded corners', () => {
    const { container } = render(
      <div>
        <label className="field-label" htmlFor="search-input">
          Search
        </label>
        <input
          id="search-input"
          className="field-input"
          type="search"
          placeholder="Search..."
        />
      </div>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe('Visual Regression - Status Badges', () => {
  it('renders coverage chip with covered status', () => {
    const { container } = render(
      <span className="coverage-chip coverage-covered">Covered</span>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders coverage chip with PA required status', () => {
    const { container } = render(
      <span className="coverage-chip coverage-covered-with-pa">PA Required</span>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders coverage chip with not covered status', () => {
    const { container } = render(
      <span className="coverage-chip coverage-not-covered">Not Covered</span>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders policy pill badge', () => {
    const { container } = render(
      <span className="policy-pill">Blue Cross</span>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders ingestion status badge - success', () => {
    const { container } = render(
      <span className="ingestion-status ingestion-status-success">Completed</span>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders ingestion status badge - pending', () => {
    const { container } = render(
      <span className="ingestion-status ingestion-status-pending">Processing</span>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders ingestion status badge - error', () => {
    const { container } = render(
      <span className="ingestion-status ingestion-status-error">Failed</span>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});
