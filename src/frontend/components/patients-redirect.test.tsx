import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App.js';

describe('Patients Route Redirect', () => {
  beforeEach(() => {
    // Mock fetch for API calls
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
          json: () => Promise.resolve({ drugFamilies: [] })
        });
      }
      return Promise.reject(new Error('Unhandled fetch'));
    }) as typeof fetch;
  });

  it('redirects /patients to /workspace on initial load', () => {
    // Set up the URL to /patients
    window.history.pushState({}, '', '/patients');
    
    render(<App />);
    
    // Verify the URL was changed to /workspace
    expect(window.location.pathname).toBe('/workspace');
    
    // Verify the workspace page is active
    const workspaceBtn = screen.getByRole('button', { name: /workspace/i });
    expect(workspaceBtn).toHaveClass('page-nav-btn-active');
  });

  it('redirects /patients/ (with trailing slash) to /workspace', () => {
    window.history.pushState({}, '', '/patients/');
    
    render(<App />);
    
    expect(window.location.pathname).toBe('/workspace');
    
    const workspaceBtn = screen.getByRole('button', { name: /workspace/i });
    expect(workspaceBtn).toHaveClass('page-nav-btn-active');
  });

  it('redirects /patients/any-subpath to /workspace', () => {
    window.history.pushState({}, '', '/patients/some-case-id');
    
    render(<App />);
    
    expect(window.location.pathname).toBe('/workspace');
    
    const workspaceBtn = screen.getByRole('button', { name: /workspace/i });
    expect(workspaceBtn).toHaveClass('page-nav-btn-active');
  });

  it('does not have a Patients navigation button', () => {
    render(<App />);
    
    // Verify there is no Patients button in the navigation
    const patientsBtn = screen.queryByRole('button', { name: /^patients$/i });
    expect(patientsBtn).not.toBeInTheDocument();
  });

  it('displays all expected navigation tabs without Patients', () => {
    render(<App />);
    
    // Get the page navigation element by class name
    const pageNav = document.querySelector('.page-nav');
    expect(pageNav).toBeTruthy();
    
    // Verify all expected tabs are present in the page navigation
    const navButtons = pageNav!.querySelectorAll('button');
    const navButtonTexts = Array.from(navButtons).map(btn => btn.textContent);
    
    expect(navButtonTexts).toContain('Workspace');
    expect(navButtonTexts).toContain('Compare');
    expect(navButtonTexts).toContain('Insights');
    expect(navButtonTexts).toContain('Changes');
    expect(navButtonTexts).toContain('Data');
    expect(navButtonTexts).toContain('Evidence Explorer');
    expect(navButtonTexts).toContain('Chat');
    
    // Verify Patients tab is not present
    expect(navButtonTexts).not.toContain('Patients');
    expect(navButtonTexts.length).toBe(7); // Exactly 7 navigation buttons
  });

  it('handles bookmarked /patients URL gracefully', () => {
    // Simulate a user visiting a bookmarked /patients URL
    window.history.pushState({}, '', '/patients');
    
    render(<App />);
    
    // Should redirect to workspace without errors
    expect(window.location.pathname).toBe('/workspace');
    
    // Should display workspace content
    expect(screen.getByText(/which plans cover/i)).toBeInTheDocument();
  });
});
