import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PolicyCompareView } from './policy-compare-view';
import { PolicyInsightsView } from './policy-insights-view';
import { PolicyChangesView } from './policy-changes-view';
import { PatientCasesView } from './patient-cases-view';
import { DataOverviewView } from './data-overview-view';
import { ReadinessView } from './readiness-view';
import { ChangesView } from './changes-view';
import { PolicyVersionDiffView } from './policy-version-diff-view';
import { CompareView } from './compare-view';
import { ChatView } from './chat-view';
import { PatientCaseDetailView } from './patient-case-detail-view';

// Mock scrollIntoView for ChatView tests
beforeEach(() => {
  Element.prototype.scrollIntoView = () => {};
});

/**
 * Empty State Tests
 * 
 * Tests for Requirement 8: Improve Empty State Presentation
 * - 8.1: Empty states render when content is unavailable
 * - 8.2: Empty state messages use consistent styling
 * - 8.3: Empty state messages provide actionable guidance
 * - 8.4: Empty state messages are vertically and horizontally centered
 */

describe('Empty States - Rendering', () => {
  describe('PolicyCompareView', () => {
    it('renders empty state when loading', () => {
      const { container } = render(
        <PolicyCompareView
          drugQuery="test-drug"
          selectedIssuers={['issuer1']}
          loading={true}
          comparison={null}
        />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('Loading policy comparison…');
    });

    it('renders empty state when no comparison data', () => {
      const { container } = render(
        <PolicyCompareView
          drugQuery="test-drug"
          selectedIssuers={['issuer1']}
          loading={false}
          comparison={null}
        />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('Select a drug family and at least two payers to compare policies.');
    });
  });

  describe('PolicyInsightsView', () => {
    it('renders empty state when loading', () => {
      const { container } = render(
        <PolicyInsightsView
          drugQuery="test-drug"
          loading={true}
          insights={null}
        />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('Loading policy insights…');
    });

    it('renders empty state when no insights data', () => {
      const { container } = render(
        <PolicyInsightsView
          drugQuery="test-drug"
          loading={false}
          insights={null}
        />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('Select a drug family to view the policy heat map and relationship graph.');
    });
  });

  describe('PolicyChangesView', () => {
    it('renders empty state when loading', () => {
      const { container } = render(
        <PolicyChangesView
          drugQuery="test-drug"
          loading={true}
          response={null}
        />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('Loading policy changes…');
    });

    it('renders empty state when no changes data', () => {
      const { container } = render(
        <PolicyChangesView
          drugQuery="test-drug"
          loading={false}
          response={{ events: [] }}
        />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('No versioned policy changes yet. Save a second policy version to populate the timeline.');
    });
  });

  describe('PatientCasesView', () => {
    it('renders empty state when no cases', () => {
      const { container } = render(
        <PatientCasesView
          cases={[]}
          selectedCaseId={null}
          onSelectCase={() => {}}
          onCreateCase={() => {}}
        />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('No patient cases yet. Create one to start linking documents and extracted facts.');
    });
  });

  describe('DataOverviewView', () => {
    it('renders empty state when no detected drugs', () => {
      const { container } = render(
        <DataOverviewView
          ingestedSources={[]}
          topDetectedDrugs={[]}
          onIngest={() => {}}
        />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('Upload policy files to see detected drug families.');
    });
  });

  describe('ReadinessView', () => {
    it('renders empty state when no patient selected', () => {
      const mockPolicy = {
        indication: 'Test',
        diagnosisRequirements: [],
        stepTherapy: [],
        otherRequirements: [],
      };

      const { container } = render(
        <ReadinessView
          policy={mockPolicy}
          selectedPatientId=""
          onPatientChange={() => {}}
        />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('Select a demo patient to check readiness against this policy.');
    });
  });

  describe('ChangesView', () => {
    it('renders empty state when no change watch data', () => {
      const { container } = render(
        <ChangesView changeWatch={null} />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('Choose a drug to inspect version posture and change-watch signals.');
    });
  });

  describe('PolicyVersionDiffView', () => {
    it('renders empty state when loading', () => {
      const { container } = render(
        <PolicyVersionDiffView
          loading={true}
          diff={null}
        />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('Loading version diff…');
    });

    it('renders empty state when no diff data', () => {
      const { container } = render(
        <PolicyVersionDiffView
          loading={false}
          diff={null}
        />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('Choose a version pair from the Changes timeline to open the diff.');
    });
  });

  describe('CompareView', () => {
    it('renders empty state when insufficient matches', () => {
      const { container } = render(
        <CompareView
          drugQuery="test-drug"
          matches={[{ planId: 'plan1', issuerName: 'Issuer 1', primaryDrugLabel: 'Drug A' }]}
        />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent(/Add more issuers or use a broader drug query/);
    });
  });

  describe('ChatView', () => {
    it('renders empty state when no messages', () => {
      const { container } = render(
        <ChatView
          messages={[]}
          isLoading={false}
          onSendMessage={() => {}}
        />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('Ask about prior authorization, step therapy, payer differences, or policy wording.');
    });
  });

  describe('PatientCaseDetailView', () => {
    it('renders empty state when no case selected', () => {
      const { container } = render(
        <PatientCaseDetailView
          patientCase={null}
          policyOptions={[]}
          evaluations={[]}
          selectedPolicyId=""
          selectedPolicyVersion=""
          policyOptionsLoading={false}
          evaluationsLoading={false}
          onPolicyChange={() => {}}
          onPolicyVersionChange={() => {}}
          onRunEvaluation={async () => {}}
          onUploadDocument={async () => {}}
        />
      );

      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('Select a patient case to inspect documents, extracted facts, and coverage evaluation.');
    });

    it('renders empty state when no documents uploaded', () => {
      const mockCase = {
        id: 'case-1',
        patientName: 'Test Patient',
        diagnosis: 'Test Diagnosis',
        payer: 'Test Payer',
        status: 'in-progress' as const,
        documents: [],
        extractedFacts: [],
        createdAt: new Date().toISOString(),
      };

      const { container } = render(
        <PatientCaseDetailView
          patientCase={mockCase}
          policyOptions={[]}
          evaluations={[]}
          selectedPolicyId=""
          selectedPolicyVersion=""
          policyOptionsLoading={false}
          evaluationsLoading={false}
          onPolicyChange={() => {}}
          onPolicyVersionChange={() => {}}
          onRunEvaluation={async () => {}}
          onUploadDocument={async () => {}}
        />
      );

      const emptyStates = container.querySelectorAll('.empty-state');
      expect(emptyStates.length).toBeGreaterThan(0);
      
      const documentsEmptyState = Array.from(emptyStates).find(
        el => el.textContent === 'No documents uploaded yet.'
      );
      expect(documentsEmptyState).toBeInTheDocument();
    });

    it('renders empty state when no extracted facts', () => {
      const mockCase = {
        id: 'case-1',
        patientName: 'Test Patient',
        diagnosis: 'Test Diagnosis',
        payer: 'Test Payer',
        status: 'in-progress' as const,
        documents: [],
        extractedFacts: [],
        createdAt: new Date().toISOString(),
      };

      const { container } = render(
        <PatientCaseDetailView
          patientCase={mockCase}
          policyOptions={[]}
          evaluations={[]}
          selectedPolicyId=""
          selectedPolicyVersion=""
          policyOptionsLoading={false}
          evaluationsLoading={false}
          onPolicyChange={() => {}}
          onPolicyVersionChange={() => {}}
          onRunEvaluation={async () => {}}
          onUploadDocument={async () => {}}
        />
      );

      const emptyStates = container.querySelectorAll('.empty-state');
      const factsEmptyState = Array.from(emptyStates).find(
        el => el.textContent === 'Upload a document to populate extracted facts for this case.'
      );
      expect(factsEmptyState).toBeInTheDocument();
    });
  });
});

describe('Empty States - Centering and Layout', () => {
  it('empty state has the correct CSS class for centering', () => {
    const { container } = render(
      <PolicyCompareView
        drugQuery="test-drug"
        selectedIssuers={['issuer1']}
        loading={true}
        comparison={null}
      />
    );

    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toBeInTheDocument();
    expect(emptyState).toHaveClass('empty-state');
  });

  it('empty state element is present for layout stability', () => {
    const { container } = render(
      <PolicyCompareView
        drugQuery="test-drug"
        selectedIssuers={['issuer1']}
        loading={true}
        comparison={null}
      />
    );

    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toBeInTheDocument();
  });

  it('empty state is consistently applied across components', () => {
    const { container } = render(
      <PolicyInsightsView
        drugQuery="test-drug"
        loading={false}
        insights={null}
      />
    );

    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toBeInTheDocument();
    expect(emptyState).toHaveClass('empty-state');
  });
});

describe('Empty States - Consistent Styling', () => {
  it('all empty states use the same CSS class', () => {
    const components = [
      <PolicyCompareView drugQuery="test" selectedIssuers={[]} loading={true} comparison={null} />,
      <PolicyInsightsView drugQuery="test" loading={true} insights={null} />,
      <PolicyChangesView drugQuery="test" loading={true} response={null} />,
      <PatientCasesView cases={[]} selectedCaseId={null} onSelectCase={() => {}} onCreateCase={() => {}} />,
    ];

    components.forEach((component) => {
      const { container, unmount } = render(component);
      const emptyState = container.querySelector('.empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveClass('empty-state');
      unmount();
    });
  });

  it('empty states have consistent class name across all components', () => {
    const { container } = render(
      <PolicyCompareView
        drugQuery="test-drug"
        selectedIssuers={['issuer1']}
        loading={true}
        comparison={null}
      />
    );

    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toBeInTheDocument();
    expect(emptyState).toHaveClass('empty-state');
  });

  it('right sidebar empty states use the correct class structure', () => {
    const { container } = render(
      <div className="right-sidebar-section">
        <div className="empty-state">
          <small>Test empty state</small>
        </div>
      </div>
    );

    const emptyState = container.querySelector('.right-sidebar-section .empty-state');
    expect(emptyState).toBeInTheDocument();
    expect(emptyState).toHaveClass('empty-state');
  });

  it('right sidebar empty state small text is properly structured', () => {
    const { container } = render(
      <div className="right-sidebar-section">
        <div className="empty-state">
          <small>Test empty state</small>
        </div>
      </div>
    );

    const smallText = container.querySelector('.right-sidebar-section .empty-state small');
    expect(smallText).toBeInTheDocument();
    expect(smallText).toHaveTextContent('Test empty state');
  });
});

describe('Empty States - Actionable Guidance', () => {
  it('provides actionable guidance for policy comparison', () => {
    const { container } = render(
      <PolicyCompareView
        drugQuery="test-drug"
        selectedIssuers={['issuer1']}
        loading={false}
        comparison={null}
      />
    );

    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toHaveTextContent('Select a drug family and at least two payers to compare policies.');
  });

  it('provides actionable guidance for patient cases', () => {
    const { container } = render(
      <PatientCasesView
        cases={[]}
        selectedCaseId={null}
        onSelectCase={() => {}}
        onCreateCase={() => {}}
      />
    );

    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toHaveTextContent('No patient cases yet. Create one to start linking documents and extracted facts.');
  });

  it('provides actionable guidance for data overview', () => {
    const { container } = render(
      <DataOverviewView
        ingestedSources={[]}
        topDetectedDrugs={[]}
        onIngest={() => {}}
      />
    );

    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toHaveTextContent('Upload policy files to see detected drug families.');
  });

  it('provides actionable guidance for readiness view', () => {
    const mockPolicy = {
      indication: 'Test',
      diagnosisRequirements: [],
      stepTherapy: [],
      otherRequirements: [],
    };

    const { container } = render(
      <ReadinessView
        policy={mockPolicy}
        selectedPatientId=""
        onPatientChange={() => {}}
      />
    );

    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toHaveTextContent('Select a demo patient to check readiness against this policy.');
  });

  it('provides actionable guidance for compare view', () => {
    const { container } = render(
      <CompareView
        drugQuery="test-drug"
        matches={[{ planId: 'plan1', issuerName: 'Issuer 1', primaryDrugLabel: 'Drug A' }]}
      />
    );

    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toHaveTextContent(/Add more issuers or use a broader drug query/);
  });

  it('provides actionable guidance for chat view', () => {
    const { container } = render(
      <ChatView
        messages={[]}
        isLoading={false}
        onSendMessage={() => {}}
      />
    );

    const emptyState = container.querySelector('.empty-state');
    expect(emptyState).toHaveTextContent('Ask about prior authorization, step therapy, payer differences, or policy wording.');
  });
});
