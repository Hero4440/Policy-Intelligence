import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from './sidebar';

describe('Sidebar - Content Structure', () => {
  it('renders with correct sidebar-section structure', () => {
    const { container } = render(
      <Sidebar
        issuers={['Issuer A', 'Issuer B']}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={vi.fn()}
        onDrugQueryChange={vi.fn()}
      />
    );

    const sidebar = container.querySelector('.sidebar');
    expect(sidebar).toBeInTheDocument();

    // Check that sidebar contains multiple sections
    const sections = container.querySelectorAll('.sidebar-section');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('displays consistent typography with eyebrow text', () => {
    render(
      <Sidebar
        issuers={['Issuer A']}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={vi.fn()}
        onDrugQueryChange={vi.fn()}
      />
    );

    // Check for eyebrow text
    const eyebrow = screen.getByText('Policy Track');
    expect(eyebrow).toBeInTheDocument();
    expect(eyebrow).toHaveClass('eyebrow');
  });

  it('displays sidebar title with correct class', () => {
    const { container } = render(
      <Sidebar
        issuers={['Issuer A']}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={vi.fn()}
        onDrugQueryChange={vi.fn()}
      />
    );

    const title = container.querySelector('.sidebar-title');
    expect(title).toBeInTheDocument();
    expect(title?.textContent).toBe('Medical Benefit Drug Policy Intelligence');
  });

  it('displays sidebar copy text', () => {
    const { container } = render(
      <Sidebar
        issuers={['Issuer A']}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={vi.fn()}
        onDrugQueryChange={vi.fn()}
      />
    );

    const copy = container.querySelector('.sidebar-copy');
    expect(copy).toBeInTheDocument();
  });

  it('maintains visual separation between sections', () => {
    const { container } = render(
      <Sidebar
        issuers={['Issuer A', 'Issuer B']}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={vi.fn()}
        onDrugQueryChange={vi.fn()}
      />
    );

    const sections = container.querySelectorAll('.sidebar-section');
    
    // Verify multiple sections exist for visual separation
    expect(sections.length).toBeGreaterThanOrEqual(3);
    
    // Each section should have the correct class
    sections.forEach((section) => {
      expect(section).toHaveClass('sidebar-section');
    });
  });

  it('renders note section with correct styling', () => {
    const { container } = render(
      <Sidebar
        issuers={['Issuer A']}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={vi.fn()}
        onDrugQueryChange={vi.fn()}
      />
    );

    const noteSection = container.querySelector('.sidebar-note');
    expect(noteSection).toBeInTheDocument();
    expect(noteSection).toHaveClass('sidebar-section');
  });

  it('renders note badge with correct class', () => {
    const { container } = render(
      <Sidebar
        issuers={['Issuer A']}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={vi.fn()}
        onDrugQueryChange={vi.fn()}
      />
    );

    const noteBadge = container.querySelector('.note-badge');
    expect(noteBadge).toBeInTheDocument();
    expect(noteBadge?.textContent).toBe('Data');
  });

  it('renders form fields with consistent structure', () => {
    const { container } = render(
      <Sidebar
        issuers={['Issuer A', 'Issuer B']}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={vi.fn()}
        onDrugQueryChange={vi.fn()}
      />
    );

    // Check for field labels
    const labels = container.querySelectorAll('.field-label');
    expect(labels.length).toBeGreaterThanOrEqual(2);

    // Check for field inputs
    const inputs = container.querySelectorAll('.field-input');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('applies consistent padding through sidebar class', () => {
    const { container } = render(
      <Sidebar
        issuers={['Issuer A']}
        selectedIssuer=""
        drugQuery=""
        onIssuerChange={vi.fn()}
        onDrugQueryChange={vi.fn()}
      />
    );

    const sidebar = container.querySelector('.sidebar');
    expect(sidebar).toBeInTheDocument();
    
    // The CSS defines padding for .sidebar class
    // This test verifies the class is applied
    expect(sidebar).toHaveClass('sidebar');
  });
});
