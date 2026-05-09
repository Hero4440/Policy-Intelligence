import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.js';

describe('Navigation Unit Tests', () => {
  beforeEach(() => {
    // Mock scrollIntoView for chat view
    Element.prototype.scrollIntoView = vi.fn();
    
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
      if (typeof url === 'string' && url.includes('/api/policies/changes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            events: [],
            filters: {
              payerOptions: ['Payer A'],
              drugFamilyOptions: ['Family A'],
              severityOptions: ['high', 'medium', 'low']
            }
          })
        });
      }
      if (typeof url === 'string' && url.includes('/api/antonrx/compare')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ matches: [] })
        });
      }
      if (typeof url === 'string' && url.includes('/api/antonrx/changes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ changeWatch: null })
        });
      }
      return Promise.reject(new Error('Unhandled fetch'));
    }) as typeof fetch;
  });

  // Helper function to get page nav buttons specifically
  function getPageNavButton(name: string): HTMLElement | null {
    const pageNav = document.querySelector('.page-nav');
    if (!pageNav) return null;
    
    const buttons = Array.from(pageNav.querySelectorAll('button'));
    return buttons.find(btn => btn.textContent === name) as HTMLElement || null;
  }

  describe('Navigation Tab Presence', () => {
    it('does not render Patients tab in navigation', () => {
      render(<App />);
      
      const patientsBtn = getPageNavButton('Patients');
      expect(patientsBtn).toBeNull();
    });

    it('renders Workspace tab in navigation', () => {
      render(<App />);
      
      const workspaceBtn = getPageNavButton('Workspace');
      expect(workspaceBtn).toBeTruthy();
    });

    it('renders Compare tab in navigation', () => {
      render(<App />);
      
      const compareBtn = getPageNavButton('Compare');
      expect(compareBtn).toBeTruthy();
    });

    it('renders Insights tab in navigation', () => {
      render(<App />);
      
      const insightsBtn = getPageNavButton('Insights');
      expect(insightsBtn).toBeTruthy();
    });

    it('renders Changes tab in navigation', () => {
      render(<App />);
      
      const changesBtn = getPageNavButton('Changes');
      expect(changesBtn).toBeTruthy();
    });

    it('renders Data tab in navigation', () => {
      render(<App />);
      
      const dataBtn = getPageNavButton('Data');
      expect(dataBtn).toBeTruthy();
    });

    it('renders Evidence Explorer tab in navigation', () => {
      render(<App />);
      
      const evidenceBtn = getPageNavButton('Evidence Explorer');
      expect(evidenceBtn).toBeTruthy();
    });

    it('renders Chat tab in navigation', () => {
      render(<App />);
      
      const chatBtn = getPageNavButton('Chat');
      expect(chatBtn).toBeTruthy();
    });

    it('renders exactly 7 navigation tabs', () => {
      render(<App />);
      
      const pageNav = document.querySelector('.page-nav');
      expect(pageNav).toBeTruthy();
      
      const navButtons = pageNav!.querySelectorAll('button');
      expect(navButtons.length).toBe(7);
    });

    it('renders all expected tabs in correct order', () => {
      render(<App />);
      
      const pageNav = document.querySelector('.page-nav');
      const navButtons = pageNav!.querySelectorAll('button');
      const navButtonTexts = Array.from(navButtons).map(btn => btn.textContent);
      
      expect(navButtonTexts).toEqual([
        'Workspace',
        'Compare',
        'Insights',
        'Changes',
        'Data',
        'Evidence Explorer',
        'Chat'
      ]);
    });
  });

  describe('Navigation Tab Switching', () => {
    it('switches to Compare page when Compare tab is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const compareBtn = getPageNavButton('Compare') as HTMLElement;
      expect(compareBtn).toBeTruthy();
      await user.click(compareBtn);
      
      await waitFor(() => {
        expect(compareBtn).toHaveClass('page-nav-btn-active');
        expect(window.location.pathname).toBe('/compare');
      });
    });

    it('switches to Insights page when Insights tab is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const insightsBtn = getPageNavButton('Insights') as HTMLElement;
      expect(insightsBtn).toBeTruthy();
      await user.click(insightsBtn);
      
      await waitFor(() => {
        expect(insightsBtn).toHaveClass('page-nav-btn-active');
        expect(window.location.pathname).toBe('/insights');
      });
    });

    it('switches to Changes page when Changes tab is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const changesBtn = getPageNavButton('Changes') as HTMLElement;
      expect(changesBtn).toBeTruthy();
      await user.click(changesBtn);
      
      await waitFor(() => {
        expect(changesBtn).toHaveClass('page-nav-btn-active');
        expect(window.location.pathname).toBe('/changes');
      });
    });

    it('switches to Data page when Data tab is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const dataBtn = getPageNavButton('Data') as HTMLElement;
      expect(dataBtn).toBeTruthy();
      await user.click(dataBtn);
      
      await waitFor(() => {
        expect(dataBtn).toHaveClass('page-nav-btn-active');
        expect(window.location.pathname).toBe('/data');
      });
    });

    it('switches to Evidence Explorer page when Evidence Explorer tab is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const evidenceBtn = getPageNavButton('Evidence Explorer') as HTMLElement;
      expect(evidenceBtn).toBeTruthy();
      await user.click(evidenceBtn);
      
      await waitFor(() => {
        expect(evidenceBtn).toHaveClass('page-nav-btn-active');
        expect(window.location.pathname).toBe('/evidence-explorer');
      });
    });

    it('switches to Chat page when Chat tab is clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const chatBtn = getPageNavButton('Chat') as HTMLElement;
      expect(chatBtn).toBeTruthy();
      await user.click(chatBtn);
      
      await waitFor(() => {
        expect(chatBtn).toHaveClass('page-nav-btn-active');
        expect(window.location.pathname).toBe('/chat');
      });
    });

    it('switches to Workspace page when Workspace tab is clicked from another page', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      // First navigate to Compare
      const compareBtn = getPageNavButton('Compare') as HTMLElement;
      expect(compareBtn).toBeTruthy();
      await user.click(compareBtn);
      
      await waitFor(() => {
        expect(compareBtn).toHaveClass('page-nav-btn-active');
      });
      
      // Then navigate back to Workspace
      const workspaceBtn = getPageNavButton('Workspace') as HTMLElement;
      expect(workspaceBtn).toBeTruthy();
      await user.click(workspaceBtn);
      
      await waitFor(() => {
        expect(workspaceBtn).toHaveClass('page-nav-btn-active');
        expect(window.location.pathname).toBe('/');
      });
    });

    it('removes active state from previous tab when switching', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const workspaceBtn = getPageNavButton('Workspace') as HTMLElement;
      const compareBtn = getPageNavButton('Compare') as HTMLElement;
      expect(workspaceBtn).toBeTruthy();
      expect(compareBtn).toBeTruthy();
      
      // Workspace should be active initially
      await waitFor(() => {
        expect(workspaceBtn).toHaveClass('page-nav-btn-active');
      });
      expect(compareBtn).not.toHaveClass('page-nav-btn-active');
      
      // Click Compare
      await user.click(compareBtn);
      
      await waitFor(() => {
        expect(compareBtn).toHaveClass('page-nav-btn-active');
        expect(workspaceBtn).not.toHaveClass('page-nav-btn-active');
      });
    });

    it('updates URL correctly when switching between multiple tabs', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      // Navigate to Compare
      const compareBtn = getPageNavButton('Compare') as HTMLElement;
      expect(compareBtn).toBeTruthy();
      await user.click(compareBtn);
      await waitFor(() => expect(window.location.pathname).toBe('/compare'));
      
      // Navigate to Insights
      const insightsBtn = getPageNavButton('Insights') as HTMLElement;
      expect(insightsBtn).toBeTruthy();
      await user.click(insightsBtn);
      await waitFor(() => expect(window.location.pathname).toBe('/insights'));
      
      // Navigate to Changes
      const changesBtn = getPageNavButton('Changes') as HTMLElement;
      expect(changesBtn).toBeTruthy();
      await user.click(changesBtn);
      await waitFor(() => expect(window.location.pathname).toBe('/changes'));
      
      // Navigate back to Workspace
      const workspaceBtn = getPageNavButton('Workspace') as HTMLElement;
      expect(workspaceBtn).toBeTruthy();
      await user.click(workspaceBtn);
      await waitFor(() => expect(window.location.pathname).toBe('/'));
    });
  });

  describe('Navigation Active State', () => {
    it('shows Workspace tab as active on initial load', async () => {
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const workspaceBtn = getPageNavButton('Workspace') as HTMLElement;
      expect(workspaceBtn).toBeTruthy();
      await waitFor(() => {
        expect(workspaceBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('shows Compare tab as active when on Compare page', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const compareBtn = getPageNavButton('Compare') as HTMLElement;
      expect(compareBtn).toBeTruthy();
      await user.click(compareBtn);
      
      await waitFor(() => {
        expect(compareBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('shows Insights tab as active when on Insights page', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const insightsBtn = getPageNavButton('Insights') as HTMLElement;
      expect(insightsBtn).toBeTruthy();
      await user.click(insightsBtn);
      
      await waitFor(() => {
        expect(insightsBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('shows Changes tab as active when on Changes page', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const changesBtn = getPageNavButton('Changes') as HTMLElement;
      expect(changesBtn).toBeTruthy();
      await user.click(changesBtn);
      
      await waitFor(() => {
        expect(changesBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('shows Data tab as active when on Data page', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const dataBtn = getPageNavButton('Data') as HTMLElement;
      expect(dataBtn).toBeTruthy();
      await user.click(dataBtn);
      
      await waitFor(() => {
        expect(dataBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('shows Evidence Explorer tab as active when on Evidence Explorer page', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const evidenceBtn = getPageNavButton('Evidence Explorer') as HTMLElement;
      expect(evidenceBtn).toBeTruthy();
      await user.click(evidenceBtn);
      
      await waitFor(() => {
        expect(evidenceBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('shows Chat tab as active when on Chat page', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const chatBtn = getPageNavButton('Chat') as HTMLElement;
      expect(chatBtn).toBeTruthy();
      await user.click(chatBtn);
      
      await waitFor(() => {
        expect(chatBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('only one tab is active at a time', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const compareBtn = getPageNavButton('Compare') as HTMLElement;
      expect(compareBtn).toBeTruthy();
      await user.click(compareBtn);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
        const activeButtons = pageNav!.querySelectorAll('.page-nav-btn-active');
        expect(activeButtons.length).toBe(1);
        expect(activeButtons[0]).toBe(compareBtn);
      });
    });
  });

  describe('Navigation URL Handling', () => {
    it('loads Workspace page when URL is /', async () => {
      window.history.pushState({}, '', '/');
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/which plans cover/i)).toBeInTheDocument();
      });
      
      const workspaceBtn = getPageNavButton('Workspace') as HTMLElement;
      expect(workspaceBtn).toBeTruthy();
      await waitFor(() => {
        expect(workspaceBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('loads Compare page when URL is /compare', async () => {
      window.history.pushState({}, '', '/compare');
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const compareBtn = getPageNavButton('Compare') as HTMLElement;
      expect(compareBtn).toBeTruthy();
      await waitFor(() => {
        expect(compareBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('loads Insights page when URL is /insights', async () => {
      window.history.pushState({}, '', '/insights');
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const insightsBtn = getPageNavButton('Insights') as HTMLElement;
      expect(insightsBtn).toBeTruthy();
      await waitFor(() => {
        expect(insightsBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('loads Changes page when URL is /changes', async () => {
      window.history.pushState({}, '', '/changes');
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const changesBtn = getPageNavButton('Changes') as HTMLElement;
      expect(changesBtn).toBeTruthy();
      await waitFor(() => {
        expect(changesBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('loads Data page when URL is /data', async () => {
      window.history.pushState({}, '', '/data');
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const dataBtn = getPageNavButton('Data') as HTMLElement;
      expect(dataBtn).toBeTruthy();
      await waitFor(() => {
        expect(dataBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('loads Evidence Explorer page when URL is /evidence-explorer', async () => {
      window.history.pushState({}, '', '/evidence-explorer');
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const evidenceBtn = getPageNavButton('Evidence Explorer') as HTMLElement;
      expect(evidenceBtn).toBeTruthy();
      await waitFor(() => {
        expect(evidenceBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('loads Chat page when URL is /chat', async () => {
      window.history.pushState({}, '', '/chat');
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const chatBtn = getPageNavButton('Chat') as HTMLElement;
      expect(chatBtn).toBeTruthy();
      await waitFor(() => {
        expect(chatBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('handles browser back button correctly', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      // Navigate to Compare
      const compareBtn = getPageNavButton('Compare') as HTMLElement;
      expect(compareBtn).toBeTruthy();
      await user.click(compareBtn);
      await waitFor(() => expect(compareBtn).toHaveClass('page-nav-btn-active'));
      
      // Navigate to Insights
      const insightsBtn = getPageNavButton('Insights') as HTMLElement;
      expect(insightsBtn).toBeTruthy();
      await user.click(insightsBtn);
      await waitFor(() => expect(insightsBtn).toHaveClass('page-nav-btn-active'));
      
      // Go back
      window.history.back();
      window.dispatchEvent(new PopStateEvent('popstate'));
      
      await waitFor(() => {
        expect(compareBtn).toHaveClass('page-nav-btn-active');
        expect(insightsBtn).not.toHaveClass('page-nav-btn-active');
      });
    });

    it('handles browser forward button correctly', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      // Navigate to Compare
      const compareBtn = getPageNavButton('Compare') as HTMLElement;
      expect(compareBtn).toBeTruthy();
      await user.click(compareBtn);
      await waitFor(() => expect(compareBtn).toHaveClass('page-nav-btn-active'));
      
      // Navigate to Insights
      const insightsBtn = getPageNavButton('Insights') as HTMLElement;
      expect(insightsBtn).toBeTruthy();
      await user.click(insightsBtn);
      await waitFor(() => expect(insightsBtn).toHaveClass('page-nav-btn-active'));
      
      // Go back
      window.history.back();
      window.dispatchEvent(new PopStateEvent('popstate'));
      await waitFor(() => expect(compareBtn).toHaveClass('page-nav-btn-active'));
      
      // Go forward
      window.history.forward();
      window.dispatchEvent(new PopStateEvent('popstate'));
      
      await waitFor(() => {
        expect(insightsBtn).toHaveClass('page-nav-btn-active');
        expect(compareBtn).not.toHaveClass('page-nav-btn-active');
      });
    });
  });

  describe('Navigation Accessibility', () => {
    it('all navigation tabs are keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const workspaceBtn = getPageNavButton('Workspace') as HTMLElement;
      const compareBtn = getPageNavButton('Compare') as HTMLElement;
      expect(workspaceBtn).toBeTruthy();
      expect(compareBtn).toBeTruthy();
      
      // Focus on workspace button
      workspaceBtn.focus();
      expect(workspaceBtn).toHaveFocus();
      
      // Tab to next button
      await user.tab();
      expect(compareBtn).toHaveFocus();
    });

    it('navigation tabs can be activated with Enter key', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const compareBtn = getPageNavButton('Compare') as HTMLElement;
      expect(compareBtn).toBeTruthy();
      compareBtn.focus();
      
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(compareBtn).toHaveClass('page-nav-btn-active');
      });
    });

    it('navigation tabs can be activated with Space key', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await waitFor(() => {
        const pageNav = document.querySelector('.page-nav');
        expect(pageNav).toBeTruthy();
      });
      
      const compareBtn = getPageNavButton('Compare') as HTMLElement;
      expect(compareBtn).toBeTruthy();
      compareBtn.focus();
      
      await user.keyboard(' ');
      
      await waitFor(() => {
        expect(compareBtn).toHaveClass('page-nav-btn-active');
      });
    });
  });
});
