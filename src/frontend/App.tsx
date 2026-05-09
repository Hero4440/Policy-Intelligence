import { WorkspaceSearchBuilder } from './components/workspace-search-builder.js';
import { useEffect, useMemo, useState } from 'react';
import { WorkspaceShell } from './components/workspace-shell.js';
import { Sidebar } from './components/sidebar.js';
import { PolicyList } from './components/policy-list.js';
import { DetailTabs } from './components/detail-tabs.js';
import { CompareView } from './components/compare-view.js';
import { AskView } from './components/ask-view.js';
import { ChangesView } from './components/changes-view.js';
import { ReadinessView } from './components/readiness-view.js';
import { IngestionPanel } from './components/ingestion-panel.js';
import { DataOverviewView } from './components/data-overview-view.js';
import { InfoChip } from './components/info-chip.js';
import { CompareBuilderView } from './components/compare-builder-view.js';
import { EvidenceExplorerView } from './components/evidence-explorer-view.js';
import { ChatView } from './components/chat-view.js';
import { PolicyCompareBuilder } from './components/policy-compare-builder.js';
import { PolicyCompareView } from './components/policy-compare-view.js';
import { PolicyChangesFilters, PolicyChangesView } from './components/policy-changes-view.js';
import { PolicyInsightsBuilder, PolicyInsightsView } from './components/policy-insights-view.js';
import { PolicyVersionDiffView } from './components/policy-version-diff-view.js';
import { RightSidebar, type RightSidebarPage } from './components/right-sidebar.js';
import type { TabId } from './components/detail-tabs.js';
import {
  fetchPolicyCompare,
  fetchPolicyDetail,
  fetchPolicyIssuers,
  fetchPolicySummary,
  fetchIngestionSources,
  type PolicyCatalogSummary,
  type PolicyChangeWatch,
  type PolicyCoverageMatch,
  type IngestedSourceRecord,
  type IngestionSummary,
  type IngestionUploadResult,
  type PolicyPlanDrugDetail
} from './data/policy-types.js';
import {
  fetchPolicyCompareOptions,
  fetchPolicyComparison,
  fetchPolicyChanges,
  fetchPolicyInsights,
  fetchPolicyVersionDiff,
  type ChangeSeverity,
  type PolicyChangesResponse,
  type PolicyCompareOptions,
  type PolicyComparePayload,
  type EvidenceSearchResult,
  type PolicyEvidenceRef,
  type PolicyInsightsPayload,
  type PolicyVersionDiffPayload
} from './data/policies.js';

export default function App() {
  // Initialize activePage, redirecting /patients to workspace
  const getInitialPage = (): 'workspace' | 'compare' | 'insights' | 'changes' | 'data' | 'evidence-explorer' | 'chat' => {
    const path = window.location.pathname;
    if (path === '/patients' || path.startsWith('/patients/')) {
      // Redirect /patients to workspace
      window.history.replaceState(null, '', '/workspace');
      return 'workspace';
    }
    // Map other paths to pages
    if (path === '/workspace') return 'workspace';
    if (path === '/compare') return 'compare';
    if (path === '/insights') return 'insights';
    if (path === '/changes') return 'changes';
    if (path === '/data') return 'data';
    if (path === '/evidence-explorer') return 'evidence-explorer';
    if (path === '/chat') return 'chat';
    // Default to chat page for root path
    return 'chat';
  };

  const [activePage, setActivePage] = useState<'workspace' | 'compare' | 'insights' | 'changes' | 'data' | 'evidence-explorer' | 'chat'>(getInitialPage());
  
  // Update URL when page changes
  const navigateToPage = (page: typeof activePage) => {
    setActivePage(page);
    const path = page === 'chat' ? '/' : `/${page}`;
    window.history.pushState(null, '', path);
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const page = getInitialPage();
      setActivePage(page);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [drugQuery, setDrugQuery] = useState('adalimumab');
  const [selectedIssuer, setSelectedIssuer] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('coverage');
  const [issuers, setIssuers] = useState<string[]>([]);
  const [matches, setMatches] = useState<PolicyCoverageMatch[]>([]);
  const [comparePlanIds, setComparePlanIds] = useState<string[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [detail, setDetail] = useState<PolicyPlanDrugDetail | null>(null);
  const [ingestedSources, setIngestedSources] = useState<IngestedSourceRecord[]>([]);
  const [ingestionSummary, setIngestionSummary] = useState<IngestionSummary | null>(null);
  const [catalogSummary, setCatalogSummary] = useState<PolicyCatalogSummary | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [policyCompareOptions, setPolicyCompareOptions] = useState<PolicyCompareOptions | null>(null);
  const [compareDrugFamily, setCompareDrugFamily] = useState('');
  const [comparePayers, setComparePayers] = useState<string[]>([]);
  const [compareVersion, setCompareVersion] = useState('');
  const [policyComparison, setPolicyComparison] = useState<PolicyComparePayload | null>(null);
  const [policyCompareError, setPolicyCompareError] = useState<string | null>(null);
  const [isPolicyCompareLoading, setIsPolicyCompareLoading] = useState(false);
  const [selectedCompareEvidence, setSelectedCompareEvidence] = useState<{ title: string; evidence: PolicyEvidenceRef[] } | null>(null);
  const [insightsDrugFamily, setInsightsDrugFamily] = useState('');
  const [insightsPayers, setInsightsPayers] = useState<string[]>([]);
  const [insightsRuleType, setInsightsRuleType] = useState('');
  const [insightsVersion, setInsightsVersion] = useState('');
  const [policyInsights, setPolicyInsights] = useState<PolicyInsightsPayload | null>(null);
  const [policyInsightsError, setPolicyInsightsError] = useState<string | null>(null);
  const [isPolicyInsightsLoading, setIsPolicyInsightsLoading] = useState(false);
  const [selectedInsightsEvidence, setSelectedInsightsEvidence] = useState<{ title: string; evidence: PolicyEvidenceRef[] } | null>(null);
  const [policyChanges, setPolicyChanges] = useState<PolicyChangesResponse | null>(null);
  const [policyChangesError, setPolicyChangesError] = useState<string | null>(null);
  const [isPolicyChangesLoading, setIsPolicyChangesLoading] = useState(false);
  const [changesPayer, setChangesPayer] = useState('');
  const [changesDrugFamily, setChangesDrugFamily] = useState('');
  const [changesSeverity, setChangesSeverity] = useState('');
  const [selectedVersionDiff, setSelectedVersionDiff] = useState<{ policyId: string; fromVersion: number; toVersion: number } | null>(null);
  const [policyVersionDiff, setPolicyVersionDiff] = useState<PolicyVersionDiffPayload | null>(null);
  const [policyVersionDiffError, setPolicyVersionDiffError] = useState<string | null>(null);
  const [isPolicyVersionDiffLoading, setIsPolicyVersionDiffLoading] = useState(false);
  const comparePayerOptions = useMemo(
    () => policyCompareOptions?.drugFamilies.find((entry) => entry.key === compareDrugFamily)?.payers ?? [],
    [policyCompareOptions, compareDrugFamily]
  );
  const insightsPayerOptions = useMemo(
    () => policyCompareOptions?.drugFamilies.find((entry) => entry.key === insightsDrugFamily)?.payers ?? [],
    [policyCompareOptions, insightsDrugFamily]
  );

  async function refreshDataViews() {
    const [summaryPayload, sourcePayload, issuerPayload] = await Promise.all([
      fetchPolicySummary().catch(() => ({ summary: null as PolicyCatalogSummary | null })),
      fetchIngestionSources().catch(() => ({ sources: [] as IngestedSourceRecord[], summary: null as IngestionSummary | null })),
      fetchPolicyIssuers().catch(() => ({ issuers: [] as string[] }))
    ]);

    setCatalogSummary(summaryPayload.summary);
    setIngestedSources(sourcePayload.sources);
    setIngestionSummary(sourcePayload.summary);
    setIssuers(issuerPayload.issuers);
  }

  useEffect(() => {
    void refreshDataViews();
  }, [refreshToken]);

  useEffect(() => {
    void fetchPolicyCompareOptions()
      .then((payload) => {
        setPolicyCompareOptions(payload);
        if (!compareDrugFamily && payload.drugFamilies[0]) {
          setCompareDrugFamily(payload.drugFamilies[0].key);
          setComparePayers(payload.drugFamilies[0].payers.slice(0, 3));
        }
        if (!insightsDrugFamily && payload.drugFamilies[0]) {
          setInsightsDrugFamily(payload.drugFamilies[0].key);
          setInsightsPayers(payload.drugFamilies[0].payers);
        }
      })
      .catch((loadError) => {
        const message = loadError instanceof Error ? loadError.message : 'Failed to load compare options';
        setPolicyCompareError(message);
        setPolicyInsightsError(message);
      });
  }, []);

  useEffect(() => {
    const family = policyCompareOptions?.drugFamilies.find((entry) => entry.key === compareDrugFamily);
    if (!family) {
      return;
    }
    setComparePayers((current) => {
      const filtered = current.filter((payer) => family.payers.includes(payer));
      return filtered.length >= 2 ? filtered : family.payers.slice(0, 3);
    });
  }, [policyCompareOptions, compareDrugFamily]);

  useEffect(() => {
    const family = policyCompareOptions?.drugFamilies.find((entry) => entry.key === insightsDrugFamily);
    if (!family) {
      return;
    }
    setInsightsPayers((current) => {
      const filtered = current.filter((payer) => family.payers.includes(payer));
      return filtered.length > 0 ? filtered : family.payers;
    });
  }, [policyCompareOptions, insightsDrugFamily]);

  useEffect(() => {
    if (!drugQuery.trim()) {
      setMatches([]);
      setDetail(null);
      setSelectedPlanId('');
      return;
    }

    setIsLoading(true);
    setError(null);

    void Promise.all([
      fetchPolicyCompare(drugQuery, selectedIssuer || undefined),
      fetchPolicyChanges({ payer: selectedIssuer || undefined })
    ])
      .then(([comparePayload, changePayload]) => {
        setMatches(comparePayload.matches);
        setComparePlanIds((current) => {
          const stillValid = current.filter((planId) => comparePayload.matches.some((match) => match.planId === planId));
          if (stillValid.length > 0) {
            return stillValid.slice(0, 4);
          }
          return comparePayload.matches.slice(0, 4).map((match) => match.planId);
        });
        setSelectedPlanId((current) =>
          comparePayload.matches.some((match) => match.planId === current)
            ? current
            : comparePayload.matches[0]?.planId ?? ''
        );
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load policy data');
        setMatches([]);
      })
      .finally(() => setIsLoading(false));
  }, [drugQuery, selectedIssuer, refreshToken]);

  useEffect(() => {
    if (!selectedPlanId || !drugQuery.trim()) {
      setDetail(null);
      return;
    }

    void fetchPolicyDetail(selectedPlanId, drugQuery)
      .then((payload) => setDetail(payload.detail))
      .catch(() => setDetail(null));
  }, [selectedPlanId, drugQuery]);

  useEffect(() => {
    if (!compareDrugFamily || comparePayers.length < 2 || activePage !== 'compare') {
      return;
    }

    setIsPolicyCompareLoading(true);
    setPolicyCompareError(null);

    void fetchPolicyComparison({
      drugFamily: compareDrugFamily,
      payers: comparePayers,
      version: compareVersion ? Number(compareVersion) : undefined
    })
      .then((payload) => setPolicyComparison(payload))
      .catch((loadError) => {
        setPolicyComparison(null);
        setPolicyCompareError(loadError instanceof Error ? loadError.message : 'Failed to load policy comparison');
      })
      .finally(() => setIsPolicyCompareLoading(false));
  }, [activePage, compareDrugFamily, comparePayers, compareVersion]);

  useEffect(() => {
    if (!insightsDrugFamily || activePage !== 'insights') {
      return;
    }

    setIsPolicyInsightsLoading(true);
    setPolicyInsightsError(null);

    void fetchPolicyInsights({
      drugFamily: insightsDrugFamily,
      payers: insightsPayers,
      ruleType: insightsRuleType ? insightsRuleType as Parameters<typeof fetchPolicyInsights>[0]['ruleType'] : undefined,
      version: insightsVersion ? Number(insightsVersion) : undefined
    })
      .then((payload) => setPolicyInsights(payload))
      .catch((loadError) => {
        setPolicyInsights(null);
        setPolicyInsightsError(loadError instanceof Error ? loadError.message : 'Failed to load policy insights');
      })
      .finally(() => setIsPolicyInsightsLoading(false));
  }, [activePage, insightsDrugFamily, insightsPayers, insightsRuleType, insightsVersion]);

  useEffect(() => {
    if (activePage !== 'changes' && activePage !== 'dashboard') {
      return;
    }

    setIsPolicyChangesLoading(true);
    setPolicyChangesError(null);

    void fetchPolicyChanges({
      payer: changesPayer || undefined,
      drugFamily: changesDrugFamily || undefined,
      severity: changesSeverity ? changesSeverity as ChangeSeverity : undefined
    })
      .then((payload) => setPolicyChanges(payload))
      .catch((loadError) => {
        setPolicyChanges(null);
        setPolicyChangesError(loadError instanceof Error ? loadError.message : 'Failed to load policy changes');
      })
      .finally(() => setIsPolicyChangesLoading(false));
  }, [activePage, changesPayer, changesDrugFamily, changesSeverity]);

  useEffect(() => {
    if (activePage !== 'changes' || !selectedVersionDiff) {
      return;
    }

    setIsPolicyVersionDiffLoading(true);
    setPolicyVersionDiffError(null);

    void fetchPolicyVersionDiff(
      selectedVersionDiff.policyId,
      selectedVersionDiff.fromVersion,
      selectedVersionDiff.toVersion
    )
      .then((payload) => setPolicyVersionDiff(payload))
      .catch((loadError) => {
        setPolicyVersionDiff(null);
        setPolicyVersionDiffError(loadError instanceof Error ? loadError.message : 'Failed to load policy version diff');
      })
      .finally(() => setIsPolicyVersionDiffLoading(false));
  }, [activePage, selectedVersionDiff]);

  async function handleIngestionComplete(result: IngestionUploadResult) {
    setIngestionSummary(result.summary);
    setIngestedSources((current) => {
      const next = [...result.accepted.map((item) => item.source), ...current];
      const deduped = new Map(next.map((source) => [source.id, source]));
      return [...deduped.values()];
    });
    await refreshDataViews();
    setRefreshToken((current) => current + 1);
  }

  const selectedMatch = useMemo(
    () => matches.find((match) => match.planId === selectedPlanId) ?? matches[0] ?? null,
    [matches, selectedPlanId]
  );
  const compareMatches = useMemo(
    () => matches.filter((match) => comparePlanIds.includes(match.planId)),
    [matches, comparePlanIds]
  );
  const detailCompareMatches = useMemo(
    () => (compareMatches.length >= 2 ? compareMatches : matches.slice(0, 4)),
    [compareMatches, matches]
  );

  useEffect(() => {
    if (activePage !== 'compare') {
      return;
    }
    if (matches.length >= 2 && comparePlanIds.length < 2) {
      setComparePlanIds(matches.slice(0, 4).map((match) => match.planId));
    }
  }, [activePage, matches, comparePlanIds]);

  function toggleComparePlan(planId: string) {
    setComparePlanIds((current) => {
      if (current.includes(planId)) {
        return current.filter((item) => item !== planId);
      }
      return [...current, planId].slice(0, 4);
    });
  }

  function selectTopComparePlans() {
    setComparePlanIds(matches.slice(0, 4).map((match) => match.planId));
  }

  function toggleStringValue(current: string[], nextValue: string) {
    if (current.includes(nextValue)) {
      return current.filter((value) => value !== nextValue);
    }
    return [...current, nextValue];
  }

  function renderPhaseSidebar(
    title: string,
    copy: string,
    noteBadge = 'Phase 7',
    noteText = 'Every compare cell and insight cell is wired to evidence. The graph is intentionally simple and static.'
  ) {
    return (
      <aside className="sidebar">
        <div className="sidebar-section sidebar-section-header">
          <p className="eyebrow">PolicyPilot</p>
          <h2 className="sidebar-title">{title}</h2>
          <p className="sidebar-copy">{copy}</p>
        </div>

        <div className="sidebar-section sidebar-note">
          <span className="note-badge">{noteBadge}</span>
          <p>{noteText}</p>
        </div>
      </aside>
    );
  }

  function handleEvidenceExplorerSelectPolicy(_policyId: string, result: EvidenceSearchResult) {
    setDrugQuery(result.drugFamily);
    setSelectedIssuer(result.payer);
    navigateToPage('workspace');
  }

  function renderCoverageDetail() {
    if (!detail) {
      return <div className="empty-state">Choose a plan result to inspect plan and drug detail.</div>;
    }

    return (
      <>
        <div className="detail-summary-card">
          <div>
            <span className="detail-label">Plan</span>
            <strong>{detail.planName}</strong>
          </div>
          <div>
            <span className="detail-label">Evidence Depth</span>
            <strong>{detail.sourcePosture === 'deep_medical_policy' ? 'Deep medical policy' : 'Broad formulary package'}</strong>
          </div>
          <div>
            <span className="detail-label">Source</span>
            <strong>{detail.sourceFile}</strong>
          </div>
        </div>

        <div className="detail-section">
          <h3>Coverage signals</h3>
          <div className="detail-section-help">
            <InfoChip label="Evidence Depth" description="Deep medical policy means the record is backed by extracted policy criteria. Broad formulary means it comes from wider formulary/package data." />
            <InfoChip label="Confidence" description="High confidence means structured source-backed normalization. Medium confidence means broader formulary or heuristic uploaded-policy normalization." />
          </div>
          <article className="detail-card">
            <p className="detail-card-title">{detail.coverageLabel}</p>
            <p>{detail.primaryDrugLabel}</p>
            <small>
              {detail.priorAuth ? 'PA signaled' : 'No PA signal'}
              {detail.stepTherapy ? ' · Step therapy signaled' : ''}
              {detail.medicalBenefit ? ' · Medical benefit signal' : ''}
            </small>
          </article>
          <article className="detail-card">
            <p className="detail-card-title">Confidence</p>
            <p>{detail.confidenceLabel.toUpperCase()}</p>
            <small>{detail.confidenceRationale}</small>
          </article>
        </div>

        <div className="detail-section">
          <h3>Requirements summary</h3>
          {detail.requirementsSummary.length > 0 ? (
            detail.requirementsSummary.map((item) => (
              <article key={item} className="detail-card">
                <p>{item}</p>
              </article>
            ))
          ) : (
            <div className="empty-state">No detailed requirement summary loaded for this plan and drug.</div>
          )}
        </div>

        {detail.structuredPolicy && (
          <div className="detail-section">
            <h3>Structured medical policy evidence</h3>
            {detail.structuredPolicy.diagnosisRequirements.map((requirement) => (
              <article key={requirement.description} className="detail-card">
                <p className="detail-card-title">{requirement.description}</p>
                <p>{requirement.evidenceText}</p>
                <small>{requirement.icd10Codes.join(', ')}</small>
              </article>
            ))}
          </div>
        )}

        <div className="detail-section">
          <h3>Plan rules</h3>
          <div className="detail-section-help">
            <InfoChip label="Plan rules" description="Rule text loaded from plan-level rule sources. These can apply to a whole formulary, a class, or a plan and are shown alongside plan-drug detail." />
          </div>
          {detail.planRules.length > 0 ? (
            detail.planRules.slice(0, 12).map((rule) => (
              <article key={`${rule.ruleCode}-${rule.ruleName}`} className="detail-card">
                <p className="detail-card-title">{rule.ruleName || rule.ruleCode || 'Plan rule'}</p>
                <p>{rule.ruleText || 'Rule metadata loaded without descriptive text.'}</p>
                <small>{rule.sourceFile}{rule.sourcePage ? ` · page ${rule.sourcePage}` : ''}</small>
              </article>
            ))
          ) : (
            <div className="empty-state">No plan-level rules were loaded for this selection.</div>
          )}
        </div>
      </>
    );
  }

  function renderDetailContent() {
    switch (activeTab) {
      case 'coverage':
        return renderCoverageDetail();
      case 'readiness':
        return detail?.structuredPolicy ? (
          <ReadinessView
            policy={detail.structuredPolicy}
          />
        ) : (
          <div className="empty-state">
            Select a plan with deep medical policy evidence to check patient readiness.
            <br />
            <small style={{ color: 'var(--color-gray-600)' }}>Readiness checking requires a structured policy with diagnosis and step therapy criteria.</small>
          </div>
        );
    }
  }

  // Determine if right sidebar should be shown for current page
  const shouldShowRightSidebar = ['workspace', 'compare', 'changes'].includes(activePage);
  
  // Build right sidebar context based on active page
  function getRightSidebarContext(): Record<string, unknown> {
    switch (activePage) {
      case 'workspace':
        return {
          selectedPlanId,
          matches,
          drugQuery,
          selectedIssuer
        };
      case 'compare':
        return {
          compareDrugFamily,
          comparePayers,
          policyComparison
        };
      case 'changes':
        return {
          changesPayer,
          changesDrugFamily,
          changesSeverity,
          policyChanges
        };
      default:
        return {};
    }
  }

  return (
    <WorkspaceShell
      pageNav={
        <nav className="page-nav">
          <div className="page-nav-main">
            <button
              type="button"
              className={`page-nav-btn${activePage === 'chat' ? ' page-nav-btn-active' : ''}`}
              onClick={() => navigateToPage('chat')}
            >
              Chat
            </button>
            <button
              type="button"
              className={`page-nav-btn${activePage === 'workspace' ? ' page-nav-btn-active' : ''}`}
              onClick={() => navigateToPage('workspace')}
            >
              Workspace
            </button>
            <button
              type="button"
              className={`page-nav-btn${activePage === 'compare' ? ' page-nav-btn-active' : ''}`}
              onClick={() => navigateToPage('compare')}
            >
              Compare
            </button>
            <button
              type="button"
              className={`page-nav-btn${activePage === 'insights' ? ' page-nav-btn-active' : ''}`}
              onClick={() => navigateToPage('insights')}
            >
              Insights
            </button>
            <button
              type="button"
              className={`page-nav-btn${activePage === 'changes' ? ' page-nav-btn-active' : ''}`}
              onClick={() => navigateToPage('changes')}
            >
              Changes
            </button>
            <button
              type="button"
              className={`page-nav-btn${activePage === 'data' ? ' page-nav-btn-active' : ''}`}
              onClick={() => navigateToPage('data')}
            >
              Data
            </button>
          </div>
        </nav>
      }
      sidebar={
        activePage === 'chat' ? null : activePage === 'compare' ? null : activePage === 'workspace' ? null : activePage === 'dashboard' ? (
          renderPhaseSidebar(
            'Dashboard Overview',
            'Monitor system status, recent changes, and access quick actions for common workflows.',
            'Phase 7',
            'The dashboard provides a centralized view of key metrics and system health.'
          )
        ) : activePage === 'evidence-explorer' ? (
          renderPhaseSidebar(
            'Keyword evidence search',
            'Search all stored policy evidence snippets by rule language, document section, or field label.'
          )
        ) : activePage === 'compare' ? (
          renderPhaseSidebar(
            'Cross-payer compare',
            'Choose a drug family and at least two payers to inspect preferred products, prior auth, step therapy, covered indications, and restrictions.'
          )
        ) : activePage === 'insights' ? null : activePage === 'changes' ? null : null
      }
      listPane={
        activePage === 'chat' ? null : activePage === 'compare' ? null : activePage === 'evidence-explorer' ? (
          <div className="workspace-column">
            <div className="empty-state">Search from the detail pane to explore stored policy evidence.</div>
          </div>
        ) : activePage === 'insights' ? null : activePage === 'changes' ? null : activePage === 'data' ? (
          <IngestionPanel
            ingestedSources={ingestedSources}
            ingestionSummary={ingestionSummary}
            catalogSummary={catalogSummary}
            onIngestionComplete={handleIngestionComplete}
          />
        ) : (
          <div className="workspace-column">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Drug Search</p>
                <h2>Which plans cover {drugQuery || 'this drug'}?</h2>
              </div>
              <span className="panel-count">{matches.length} results</span>
            </div>

            {error && <div className="chat-error">{error}</div>}
            {isLoading && <div className="empty-state">Loading plan matches…</div>}
            {!isLoading && matches.length === 0 && (
              <div className="empty-state">No plan matches yet. Try a broader brand or generic drug query.</div>
            )}
            {!isLoading && matches.length > 0 && (
              <PolicyList
                matches={matches}
                selectedPlanId={selectedPlanId}
                onSelectPlan={setSelectedPlanId}
              />
            )}
          </div>
        )
      }
      detailPane={
        activePage === 'evidence-explorer' ? (
          <EvidenceExplorerView onSelectPolicy={handleEvidenceExplorerSelectPolicy} />
        ) : activePage === 'chat' ? (
          <ChatView />
        ) : activePage === 'data' ? (
          <DataOverviewView
            ingestedSources={ingestedSources}
            ingestionSummary={ingestionSummary}
            catalogSummary={catalogSummary}
          />
        ) : activePage === 'compare' ? (
          <PolicyCompareView
            comparison={policyComparison}
            loading={isPolicyCompareLoading}
            error={policyCompareError}
            selectedEvidence={selectedCompareEvidence}
            onOpenEvidence={(title, evidence) => setSelectedCompareEvidence({ title, evidence })}
            onClearEvidence={() => setSelectedCompareEvidence(null)}
          />
        ) : activePage === 'insights' ? (
          <PolicyInsightsView
            insights={policyInsights}
            loading={isPolicyInsightsLoading}
            error={policyInsightsError}
            selectedEvidence={selectedInsightsEvidence}
            onOpenEvidence={(title, evidence) => setSelectedInsightsEvidence({ title, evidence })}
            onClearEvidence={() => setSelectedInsightsEvidence(null)}
            options={policyCompareOptions}
            payerOptions={insightsPayerOptions}
            selectedDrugFamily={insightsDrugFamily}
            selectedPayers={insightsPayers}
            selectedRuleType={insightsRuleType}
            selectedVersion={insightsVersion}
            onDrugFamilyChange={setInsightsDrugFamily}
            onTogglePayer={(payer) => setInsightsPayers((current) => toggleStringValue(current, payer))}
            onRuleTypeChange={setInsightsRuleType}
            onVersionChange={setInsightsVersion}
          />
        ) : activePage === 'changes' ? (
          selectedVersionDiff ? (
            <PolicyVersionDiffView
              diff={policyVersionDiff}
              loading={isPolicyVersionDiffLoading}
              error={policyVersionDiffError}
              onBack={() => {
                setSelectedVersionDiff(null);
                setPolicyVersionDiff(null);
                setPolicyVersionDiffError(null);
              }}
            />
          ) : (
            <PolicyChangesView
              response={policyChanges}
              loading={isPolicyChangesLoading}
              error={policyChangesError}
              onOpenDiff={(input) => {
                setSelectedVersionDiff(input);
                setPolicyVersionDiff(null);
                setPolicyVersionDiffError(null);
              }}
              options={policyChanges?.filters ?? null}
              selectedPayer={changesPayer}
              selectedDrugFamily={changesDrugFamily}
              selectedSeverity={changesSeverity}
              onPayerChange={setChangesPayer}
              onDrugFamilyChange={setChangesDrugFamily}
              onSeverityChange={setChangesSeverity}
            />
          )
        ) : (
          <div className="workspace-column">
            {selectedMatch && (
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Plan Detail</p>
                  <h2>
                    {selectedMatch.issuerName} · {selectedMatch.primaryDrugLabel}
                  </h2>
                </div>
                <span className={`coverage-chip ${!selectedMatch.coveredFlag ? 'coverage-not-covered' : selectedMatch.priorAuth ? 'coverage-covered-with-pa' : 'coverage-covered'}`}>
                  {selectedMatch.coverageLabel}
                </span>
              </div>
            )}
            <DetailTabs activeTab={activeTab} onTabChange={setActiveTab} />
            {renderDetailContent()}
          </div>
        )
      }
      rightSidebar={undefined}
      rightSidebarCollapsed={false}
      onToggleRightSidebar={() => {}}
      topFilters={
        activePage === 'workspace' ? (
          <WorkspaceSearchBuilder
            issuers={issuers}
            selectedIssuer={selectedIssuer}
            drugQuery={drugQuery}
            onIssuerChange={setSelectedIssuer}
            onDrugQueryChange={setDrugQuery}
          />
        ) : activePage === 'compare' ? (
          <PolicyCompareBuilder
            options={policyCompareOptions}
            payerOptions={comparePayerOptions}
            selectedDrugFamily={compareDrugFamily}
            selectedPayers={comparePayers}
            selectedVersion={compareVersion}
            onDrugFamilyChange={setCompareDrugFamily}
            onTogglePayer={(payer) => setComparePayers((current) => toggleStringValue(current, payer))}
            onVersionChange={setCompareVersion}
          />
        ) : undefined
      }
    />
  );
}
