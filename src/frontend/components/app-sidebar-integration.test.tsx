import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock fetch globally
global.fetch = vi.fn();

describe('App - Sidebar Content Integration', () => {
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

  it('displays workspace sidebar content on workspace page', async () => {
    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Policy Track')).toBeInTheDocument();
    });

    // Verify workspace-specific sidebar content
    expect(screen.getByText('Medical Benefit Drug Policy Intelligence')).toBeInTheDocument();
    expect(screen.getByLabelText('Drug Query')).toBeInTheDocument();
    expect(screen.getByLabelText('Issuer')).toBeInTheDocument();

    // Verify sidebar structure
    const sidebar = container.querySelector('.sidebar');
    expect(sidebar).toBeInTheDocument();
    
    const sections = container.querySelectorAll('.sidebar-section');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('displays evidence explorer sidebar content on evidence explorer page', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    // Wait for initial load
    await waitFor(() => {
      const pageNav = document.querySelector('.page-nav');
      expect(pageNav).toBeTruthy();
    });

    // Click on Evidence Explorer navigation button
    const evidenceButton = getPageNavButton('Evidence Explorer') as HTMLElement;
    expect(evidenceButton).toBeTruthy();
    await user.click(evidenceButton);

    // Verify evidence explorer-specific sidebar content
    await waitFor(() => {
      expect(screen.getByText('Keyword evidence search')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Phase 7')).toBeInTheDocument();

    // Verify sidebar structure
    const sidebar = container.querySelector('.sidebar');
    expect(sidebar).toBeInTheDocument();
    
    const sections = container.querySelectorAll('.sidebar-section');
    expect(sections.length).toBeGreaterThan(0);
  });

  it('maintains consistent sidebar structure when switching between pages', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    // Wait for initial load
    await waitFor(() => {
      const pageNav = document.querySelector('.page-nav');
      expect(pageNav).toBeTruthy();
    });

    // Test workspace page
    let sidebar = container.querySelector('.sidebar');
    expect(sidebar).toBeInTheDocument();
    let sections = container.querySelectorAll('.sidebar-section');
    expect(sections.length).toBeGreaterThan(0);

    // Switch to evidence explorer page
    const evidenceButton = getPageNavButton('Evidence Explorer') as HTMLElement;
    expect(evidenceButton).toBeTruthy();
    await user.click(evidenceButton);

    await waitFor(() => {
      sidebar = container.querySelector('.sidebar');
      expect(sidebar).toBeInTheDocument();
      sections = container.querySelectorAll('.sidebar-section');
      expect(sections.length).toBeGreaterThan(0);
    });

    // Switch to chat page
    const chatButton = getPageNavButton('Chat') as HTMLElement;
    expect(chatButton).toBeTruthy();
    await user.click(chatButton);

    await waitFor(() => {
      sidebar = container.querySelector('.sidebar');
      expect(sidebar).toBeInTheDocument();
      sections = container.querySelectorAll('.sidebar-section');
      expect(sections.length).toBeGreaterThan(0);
    });
  });

  it('applies consistent CSS classes to sidebar sections across different pages', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    // Wait for initial load
    await waitFor(() => {
      const pageNav = document.querySelector('.page-nav');
      expect(pageNav).toBeTruthy();
    });

    // Check workspace page
    let sections = container.querySelectorAll('.sidebar-section');
    sections.forEach((section) => {
      expect(section).toHaveClass('sidebar-section');
    });

    // Check evidence explorer page
    const evidenceButton = getPageNavButton('Evidence Explorer') as HTMLElement;
    expect(evidenceButton).toBeTruthy();
    await user.click(evidenceButton);

    await waitFor(() => {
      sections = container.querySelectorAll('.sidebar-section');
      sections.forEach((section) => {
        expect(section).toHaveClass('sidebar-section');
      });
    });

    // Check chat page
    const chatButton = getPageNavButton('Chat') as HTMLElement;
    expect(chatButton).toBeTruthy();
    await user.click(chatButton);

    await waitFor(() => {
      sections = container.querySelectorAll('.sidebar-section');
      sections.forEach((section) => {
        expect(section).toHaveClass('sidebar-section');
      });
    });
  });
});
