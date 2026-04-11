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
import type { TabId } from './components/detail-tabs.js';
import {
  fetchAntonRxChanges,
  fetchAntonRxCompare,
  fetchAntonRxDetail,
  fetchAntonRxIssuers,
  fetchAntonRxSummary,
  fetchIngestionSources,
  type AntonRxCatalogSummary,
  type AntonRxChangeWatch,
  type AntonRxCoverageMatch,
  type IngestedSourceRecord,
  type IngestionSummary,
  type IngestionUploadResult,
  type AntonRxPlanDrugDetail
} from './data/antonrx.js';

export default function App() {
  const [activePage, setActivePage] = useState<'workspace' | 'compare' | 'data'>('workspace');
  const [drugQuery, setDrugQuery] = useState('adalimumab');
  const [selectedIssuer, setSelectedIssuer] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('coverage');
  const [issuers, setIssuers] = useState<string[]>([]);
  const [matches, setMatches] = useState<AntonRxCoverageMatch[]>([]);
  const [comparePlanIds, setComparePlanIds] = useState<string[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [detail, setDetail] = useState<AntonRxPlanDrugDetail | null>(null);
  const [changeWatch, setChangeWatch] = useState<AntonRxChangeWatch | null>(null);
  const [ingestedSources, setIngestedSources] = useState<IngestedSourceRecord[]>([]);
  const [ingestionSummary, setIngestionSummary] = useState<IngestionSummary | null>(null);
  const [catalogSummary, setCatalogSummary] = useState<AntonRxCatalogSummary | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function refreshDataViews() {
    const [summaryPayload, sourcePayload, issuerPayload] = await Promise.all([
      fetchAntonRxSummary().catch(() => ({ summary: null as AntonRxCatalogSummary | null })),
      fetchIngestionSources().catch(() => ({ sources: [] as IngestedSourceRecord[], summary: null as IngestionSummary | null })),
      fetchAntonRxIssuers().catch(() => ({ issuers: [] as string[] }))
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
    if (!drugQuery.trim()) {
      setMatches([]);
      setDetail(null);
      setChangeWatch(null);
      setSelectedPlanId('');
      return;
    }

    setIsLoading(true);
    setError(null);

    void Promise.all([
      fetchAntonRxCompare(drugQuery, selectedIssuer || undefined),
      fetchAntonRxChanges(drugQuery, selectedIssuer || undefined)
    ])
      .then(([comparePayload, changePayload]) => {
        setMatches(comparePayload.matches);
        setChangeWatch(changePayload.changeWatch);
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
        setError(loadError instanceof Error ? loadError.message : 'Failed to load Anton Rx data');
        setMatches([]);
        setChangeWatch(null);
      })
      .finally(() => setIsLoading(false));
  }, [drugQuery, selectedIssuer, refreshToken]);

  useEffect(() => {
    if (!selectedPlanId || !drugQuery.trim()) {
      setDetail(null);
      return;
    }

    void fetchAntonRxDetail(selectedPlanId, drugQuery)
      .then((payload) => setDetail(payload.detail))
      .catch(() => setDetail(null));
  }, [selectedPlanId, drugQuery]);

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
            selectedPatientId={selectedPatientId}
            onPatientChange={setSelectedPatientId}
          />
        ) : (
          <div className="empty-state">
            Select a plan with deep medical policy evidence to check patient readiness.
            <br />
            <small style={{ color: '#7a9fb4' }}>Readiness checking requires a structured policy with diagnosis and step therapy criteria.</small>
          </div>
        );
      case 'changes':
        return <ChangesView changeWatch={changeWatch} />;
      case 'compare':
        return <CompareView drugQuery={drugQuery} matches={detailCompareMatches} selectedPlanId={selectedPlanId} />;
      case 'ask':
        return <AskView selectedDrug={drugQuery} selectedPayer={selectedIssuer} selectedPlanId={selectedPlanId} />;
    }
  }

  return (
    <WorkspaceShell
      pageNav={
        <nav className="page-nav">
          <button
            type="button"
            className={`page-nav-btn${activePage === 'workspace' ? ' page-nav-btn-active' : ''}`}
            onClick={() => setActivePage('workspace')}
          >
            Workspace
          </button>
          <button
            type="button"
            className={`page-nav-btn${activePage === 'compare' ? ' page-nav-btn-active' : ''}`}
            onClick={() => setActivePage('compare')}
          >
            Compare
          </button>
          <button
            type="button"
            className={`page-nav-btn${activePage === 'data' ? ' page-nav-btn-active' : ''}`}
            onClick={() => setActivePage('data')}
          >
            Data
          </button>
        </nav>
      }
      sidebar={
        <Sidebar
          issuers={issuers}
          selectedIssuer={selectedIssuer}
          drugQuery={drugQuery}
          onIssuerChange={setSelectedIssuer}
          onDrugQueryChange={setDrugQuery}
        />
      }
      listPane={
        activePage === 'data' ? (
          <IngestionPanel
            ingestedSources={ingestedSources}
            ingestionSummary={ingestionSummary}
            catalogSummary={catalogSummary}
            onIngestionComplete={handleIngestionComplete}
          />
        ) : activePage === 'compare' ? (
          <CompareBuilderView
            matches={matches}
            selectedPlanIds={comparePlanIds}
            onTogglePlan={toggleComparePlan}
            onSelectTopPlans={selectTopComparePlans}
          />
        ) : (
          <>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Drug Search</p>
                <h2>Which plans cover {drugQuery || 'this drug'}?</h2>
              </div>
              <span className="panel-count">{matches.length} results</span>
            </div>

            {error && <div className="chat-error">{error}</div>}
            {isLoading && <div className="empty-state">Loading Anton Rx plan matches…</div>}
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
          </>
        )
      }
      detailPane={
        activePage === 'data' ? (
          <DataOverviewView
            ingestedSources={ingestedSources}
            ingestionSummary={ingestionSummary}
            catalogSummary={catalogSummary}
          />
        ) : activePage === 'compare' ? (
          <CompareView
            drugQuery={drugQuery}
            matches={compareMatches}
            selectedPlanId={comparePlanIds[0] ?? ''}
          />
        ) : (
          <>
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
          </>
        )
      }
    />
  );
}
