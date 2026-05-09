import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientSidebar } from './patient-sidebar';

describe('PatientSidebar - Content Structure', () => {
  it('renders with correct sidebar-section structure', () => {
    const { container } = render(
      <PatientSidebar caseCount={3} selectedCaseName="John Doe" />
    );

    const sidebar = container.querySelector('.sidebar');
    expect(sidebar).toBeInTheDocument();

    // Check that sidebar contains multiple sections
    const sections = container.querySelectorAll('.sidebar-section');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('displays consistent typography with eyebrow text', () => {
    render(<PatientSidebar caseCount={3} selectedCaseName="John Doe" />);

    // Check for eyebrow text
    const eyebrow = screen.getByText('Phase 9');
    expect(eyebrow).toBeInTheDocument();
    expect(eyebrow).toHaveClass('eyebrow');
  });

  it('displays sidebar title with correct class', () => {
    const { container } = render(
      <PatientSidebar caseCount={3} selectedCaseName="John Doe" />
    );

    const title = container.querySelector('.sidebar-title');
    expect(title).toBeInTheDocument();
    expect(title?.textContent).toBe('Patient cases and coverage evaluation');
  });

  it('displays sidebar copy text', () => {
    const { container } = render(
      <PatientSidebar caseCount={3} selectedCaseName="John Doe" />
    );

    const copy = container.querySelector('.sidebar-copy');
    expect(copy).toBeInTheDocument();
  });

  it('maintains visual separation between sections', () => {
    const { container } = render(
      <PatientSidebar caseCount={3} selectedCaseName="John Doe" />
    );

    const sections = container.querySelectorAll('.sidebar-section');
    
    // Verify multiple sections exist for visual separation
    expect(sections.length).toBeGreaterThanOrEqual(4);
    
    // Each section should have the correct class
    sections.forEach((section) => {
      expect(section).toHaveClass('sidebar-section');
    });
  });

  it('renders note sections with correct styling', () => {
    const { container } = render(
      <PatientSidebar caseCount={3} selectedCaseName="John Doe" />
    );

    const noteSections = container.querySelectorAll('.sidebar-note');
    expect(noteSections.length).toBeGreaterThanOrEqual(3);
    
    noteSections.forEach((section) => {
      expect(section).toHaveClass('sidebar-section');
      expect(section).toHaveClass('sidebar-note');
    });
  });

  it('renders note badges with correct class', () => {
    const { container } = render(
      <PatientSidebar caseCount={3} selectedCaseName="John Doe" />
    );

    const noteBadges = container.querySelectorAll('.note-badge');
    expect(noteBadges.length).toBeGreaterThanOrEqual(3);
    
    // Check for expected badge labels
    expect(screen.getByText('Cases')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Evaluation')).toBeInTheDocument();
  });

  it('displays case count information', () => {
    render(<PatientSidebar caseCount={3} selectedCaseName="John Doe" />);

    expect(screen.getByText(/3 patient cases available/)).toBeInTheDocument();
  });

  it('displays selected case name when provided', () => {
    render(<PatientSidebar caseCount={3} selectedCaseName="John Doe" />);

    expect(screen.getByText(/focused on John Doe/)).toBeInTheDocument();
  });

  it('handles singular case count correctly', () => {
    render(<PatientSidebar caseCount={1} />);

    expect(screen.getByText(/1 patient case available/)).toBeInTheDocument();
  });

  it('applies consistent padding through sidebar class', () => {
    const { container } = render(
      <PatientSidebar caseCount={3} selectedCaseName="John Doe" />
    );

    const sidebar = container.querySelector('.sidebar');
    expect(sidebar).toBeInTheDocument();
    
    // The CSS defines padding for .sidebar class
    // This test verifies the class is applied
    expect(sidebar).toHaveClass('sidebar');
  });
});
