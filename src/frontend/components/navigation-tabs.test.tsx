import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.js';

describe('Navigation Tabs - Unit Tests', () => {
  beforeEach(() => {
    // Mock scrollIntoView for chat view
    Element.prototype.scrollIntoView = vi.fn();
    
    // Mock fetch for API calls
    global.fetch = vi.fn((url) => {
      if (typeof url === 'string') {
        if (url.includes('/api/antonrx/issuers')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ issuers: [] }) });
        }
        if (url.includes('/api/antonrx/summary')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ summary: null }) });
        }
        if (url.includes('/api/ingestion/sources')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ sources: [], summary: null }) });
        }
        if (url.includes('/api/policies/compare/options')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              drugFamilies: [{ key: 'test-family', label: 'Test Family', payers: ['Payer A', 'Payer B'] }],
              versions: [1, 2],
              ruleTypes: [{ key: 'pa', label: 'Prior Authorization' }]
            })
          });
        }
        if (url.includes('/api/policies/changes')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              events: [],
              filters: { payerOptions: ['Payer A'], drugFamilyOptions: ['Family A'], severityOptions: ['high', 'medium', 'low'] }
            })
          });
        }
        if (url.includes('/api/antonrx/compare')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ matches: [] }) });
        }
        if (url.includes('/api/antonrx/changes')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ changeWatch: null }) });
        }
      }
      return Promise.reject(new Error('Unhandled fetch'));
    }) as typeof fetch;
  });

  // Helper to get page nav button by exact text
  function getPageNavButton(text: string): HTMLElement | null {
    const pageNav = document.querySelector('.page-nav');
    if (!pageNav) return null;
    const buttons = Array.from(pageNav.querySelectorAll('button'));
    return buttons.find(btn => btn.textContent === text) as HTMLElement || null;
  }

  describe('Tab Presence', () => {
    it('does not render Patients tab', () => {
      render(<App />);
      const patientsBtn = getPageNavButton('Patients');
      expect(patientsBtn).toBeNull();
    });

    it('renders all 7 expected tabs', () => {
      render(<App />);
      const pageNav = document.querySelector('.page-nav');
      expect(pageNav).toBeTruthy();
      const buttons = pageNav!.querySelectorAll('button');
      expect(buttons.length).toBe(7);
    });

    it('renders Workspace tab', () => {
      render(<App />);
      expect(getPageNavButton('Workspace')).toBeTruthy();
    });

    it('renders Compare tab', () => {
      render(<App />);
      expect(getPageNavButton('Compare')).toBeTruthy();
    });

    it('renders Insights tab', () => {
      render(<App />);
      expect(getPageNavButton('Insights')).toBeTruthy();
    });

    it('renders Changes tab', () => {
      render(<App />);
      expect(getPageNavButton('Changes')).toBeTruthy();
    });

    it('renders Data tab', () => {
      render(<App />);
      expect(getPageNavButton('Data')).toBeTruthy();
    });

    it('renders Evidence Explorer tab', () => {
      render(<App />);
      expect(getPageNavButton('Evidence Explorer')).toBeTruthy();
    });

    it('renders Chat tab', () => {
      render(<App />);
      expect(getPageNavButton('Chat')).toBeTruthy();
    });
  });

  describe('Tab Switching', () => {
    it('switches to Compare page when Compare tab is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const compareBtn = getPageNavButton('Compare')!;
      await user.click(compareBtn);
      
      await waitFor(() => {
        expect(compareBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('switches to Insights page when Insights tab is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const insightsBtn = getPageNavButton('Insights')!;
      await user.click(insightsBtn);
      
      await waitFor(() => {
        expect(insightsBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('switches to Changes page when Changes tab is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const changesBtn = getPageNavButton('Changes')!;
      await user.click(changesBtn);
      
      await waitFor(() => {
        expect(changesBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('switches to Data page when Data tab is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const dataBtn = getPageNavButton('Data')!;
      await user.click(dataBtn);
      
      await waitFor(() => {
        expect(dataBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('switches to Evidence Explorer page when Evidence Explorer tab is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const evidenceBtn = getPageNavButton('Evidence Explorer')!;
      await user.click(evidenceBtn);
      
      await waitFor(() => {
        expect(evidenceBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('switches to Chat page when Chat tab is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const chatBtn = getPageNavButton('Chat')!;
      await user.click(chatBtn);
      
      await waitFor(() => {
        expect(chatBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('switches back to Workspace when Workspace tab is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // First go to Compare
      const compareBtn = getPageNavButton('Compare')!;
      await user.click(compareBtn);
      await waitFor(() => expect(compareBtn).toHaveClass('page-nav-btn-active'));
      
      // Then go back to Workspace
      const workspaceBtn = getPageNavButton('Workspace')!;
      await user.click(workspaceBtn);
      
      await waitFor(() => {
        expect(workspaceBtn).toHaveClass('page-nav-btn-active');
        expect(compareBtn).not.toHaveClass('page-nav-btn-active');
      });
    });

    it('only one tab is active at a time', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const compareBtn = getPageNavButton('Compare')!;
      await user.click(compareBtn);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav')!;
        const activeButtons = pageNav.querySelectorAll('.page-nav-btn-active');
        expect(activeButtons.length).toBe(1);
      });
    });
  });
});
