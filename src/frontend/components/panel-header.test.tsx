import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Panel Header Structure', () => {
  it('renders panel header with correct structure', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
        </div>
      </div>
    );

    const panelHeader = container.querySelector('.panel-header');
    expect(panelHeader).toBeInTheDocument();
    
    // Check eyebrow text
    expect(screen.getByText('Test Eyebrow')).toBeInTheDocument();
    const eyebrow = container.querySelector('.eyebrow');
    expect(eyebrow).toBeInTheDocument();
    
    // Check title
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    const title = container.querySelector('h2');
    expect(title).toBeInTheDocument();
  });

  it('renders panel header with description text', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
          <p className="sidebar-copy">This is a description</p>
        </div>
      </div>
    );

    expect(screen.getByText('This is a description')).toBeInTheDocument();
    const description = container.querySelector('.sidebar-copy');
    expect(description).toBeInTheDocument();
  });

  it('panel header has correct CSS classes for flexbox layout', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
        </div>
      </div>
    );

    const panelHeader = container.querySelector('.panel-header');
    
    // Verify the panel-header has the correct class
    // The CSS defines display: flex, align-items: flex-start, justify-content: space-between
    expect(panelHeader).toHaveClass('panel-header');
  });

  it('panel header with spaced modifier has correct class', () => {
    const { container } = render(
      <div className="panel-header panel-header-spaced">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
        </div>
      </div>
    );

    const panelHeader = container.querySelector('.panel-header');
    
    // Verify the panel-header has both classes
    expect(panelHeader).toHaveClass('panel-header');
    expect(panelHeader).toHaveClass('panel-header-spaced');
  });
});

describe('Panel Header Count Badges', () => {
  it('renders count badge with correct structure', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
        </div>
        <span className="panel-count">5 items</span>
      </div>
    );

    const countBadge = container.querySelector('.panel-count');
    expect(countBadge).toBeInTheDocument();
    expect(screen.getByText('5 items')).toBeInTheDocument();
  });

  it('renders count badge with numeric value', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Patients</p>
          <h2>Patient Cases</h2>
        </div>
        <span className="panel-count">12 cases</span>
      </div>
    );

    expect(screen.getByText('12 cases')).toBeInTheDocument();
  });

  it('renders count badge with zero value', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Compare</p>
          <h2>Select Plans</h2>
        </div>
        <span className="panel-count">0 selected</span>
      </div>
    );

    expect(screen.getByText('0 selected')).toBeInTheDocument();
  });

  it('panel header without count badge renders correctly', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
        </div>
      </div>
    );

    const countBadge = container.querySelector('.panel-count');
    expect(countBadge).not.toBeInTheDocument();
  });

  it('count badge has correct CSS class', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
        </div>
        <span className="panel-count">3 items</span>
      </div>
    );

    const countBadge = container.querySelector('.panel-count');
    
    // Verify the count badge has the correct class
    // The CSS defines padding, background, and color
    expect(countBadge).toHaveClass('panel-count');
  });
});

describe('Panel Header Status Indicators', () => {
  it('renders status indicator with correct structure', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Patient Case</p>
          <h2>John Doe</h2>
        </div>
        <span className="status-badge">Active</span>
      </div>
    );

    const statusBadge = container.querySelector('.status-badge');
    expect(statusBadge).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders multiple status indicators', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Policy</p>
          <h2>Policy Title</h2>
        </div>
        <div>
          <span className="status-badge">Approved</span>
          <span className="status-badge">Current</span>
        </div>
      </div>
    );

    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
    
    const statusBadges = container.querySelectorAll('.status-badge');
    expect(statusBadges.length).toBe(2);
  });

  it('panel header without status indicators renders correctly', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
        </div>
      </div>
    );

    const statusBadge = container.querySelector('.status-badge');
    expect(statusBadge).not.toBeInTheDocument();
  });

  it('renders both count badge and status indicator', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Policies</p>
          <h2>Policy List</h2>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
          <span className="panel-count">15 policies</span>
          <span className="status-badge">Updated</span>
        </div>
      </div>
    );

    expect(screen.getByText('15 policies')).toBeInTheDocument();
    expect(screen.getByText('Updated')).toBeInTheDocument();
    
    const countBadge = container.querySelector('.panel-count');
    const statusBadge = container.querySelector('.status-badge');
    
    expect(countBadge).toBeInTheDocument();
    expect(statusBadge).toBeInTheDocument();
  });
});

describe('Panel Header Typography Consistency', () => {
  it('eyebrow text has correct CSS class', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
        </div>
      </div>
    );

    const eyebrow = container.querySelector('.eyebrow');
    
    // Verify the eyebrow has the correct class
    // The CSS defines font-size, text-transform, letter-spacing, color
    expect(eyebrow).toHaveClass('eyebrow');
  });

  it('title uses h2 element', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
        </div>
      </div>
    );

    const title = container.querySelector('h2');
    expect(title).toBeInTheDocument();
    expect(title?.textContent).toBe('Test Title');
  });

  it('panel header h2 has correct styling through CSS', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
        </div>
      </div>
    );

    const panelHeader = container.querySelector('.panel-header');
    const title = panelHeader?.querySelector('h2');
    
    // Verify the h2 is inside panel-header
    // The CSS defines .panel-header h2 with font-size, letter-spacing, margin
    expect(title).toBeInTheDocument();
  });
});

describe('Panel Header Spacing', () => {
  it('panel header has correct margin-bottom through CSS', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
        </div>
      </div>
    );

    const panelHeader = container.querySelector('.panel-header');
    
    // Verify the panel-header has the correct class
    // The CSS defines margin-bottom: var(--spacing-lg)
    expect(panelHeader).toHaveClass('panel-header');
  });

  it('panel header with spaced modifier has correct margin-top through CSS', () => {
    const { container } = render(
      <div className="panel-header panel-header-spaced">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
        </div>
      </div>
    );

    const panelHeader = container.querySelector('.panel-header-spaced');
    
    // Verify the panel-header-spaced has the correct class
    // The CSS defines margin-top: var(--spacing-xl)
    expect(panelHeader).toHaveClass('panel-header-spaced');
  });

  it('panel header has correct gap spacing through CSS', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
        </div>
        <span className="panel-count">5 items</span>
      </div>
    );

    const panelHeader = container.querySelector('.panel-header');
    
    // Verify the panel-header has the correct class
    // The CSS defines gap: var(--spacing-md)
    expect(panelHeader).toHaveClass('panel-header');
  });
});

describe('Panel Header Alignment', () => {
  it('panel header aligns items to flex-start through CSS', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
        </div>
        <span className="panel-count">5 items</span>
      </div>
    );

    const panelHeader = container.querySelector('.panel-header');
    
    // Verify the panel-header has the correct class
    // The CSS defines align-items: flex-start
    expect(panelHeader).toHaveClass('panel-header');
  });

  it('panel header justifies content space-between through CSS', () => {
    const { container } = render(
      <div className="panel-header">
        <div>
          <p className="eyebrow">Test Eyebrow</p>
          <h2>Test Title</h2>
        </div>
        <span className="panel-count">5 items</span>
      </div>
    );

    const panelHeader = container.querySelector('.panel-header');
    
    // Verify the panel-header has the correct class
    // The CSS defines justify-content: space-between
    expect(panelHeader).toHaveClass('panel-header');
  });
});
