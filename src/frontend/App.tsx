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
import { PatientSidebar } from './components/patient-sidebar.js';
import { PatientCasesView } from './components/patient-cases-view.js';
import { PatientCaseDetailView } from './components/patient-case-detail-view.js';
import { PolicyCompareBuilder } from './components/policy-compare-builder.js';
import { PolicyCompareView } from './components/policy-compare-view.js';
import { PolicyChangesFilters, PolicyChangesView } from './components/policy-changes-view.js';
import { PolicyInsightsBuilder, PolicyInsightsView } from './components/policy-insights-view.js';
import { PolicyVersionDiffView } from './components/policy-version-diff-view.js';
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
import {
  createCaseEvaluation,
  createStoredPatientCase,
  fetchCaseEvaluations,
  fetchPatientCase,
  fetchPatientCases,
  fetchPatientPolicyOptions,
  type PatientPolicyOption,
  type StoredCoverageEvaluation,
  type StoredPatientCase,
  uploadPatientDocument
} from './data/patients.js';
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
  type PolicyEvidenceRef,
  type PolicyInsightsPayload,
  type PolicyVersionDiffPayload
} from './data/policies.js';

export default function App() {
  const [activePage, setActivePage] = useState<'workspace' | 'compare' | 'insights' | 'changes' | 'data' | 'patients'>('workspace');
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
  const [patientCases, setPatientCases] = useState<StoredPatientCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedCase, setSelectedCase] = useState<StoredPatientCase | null>(null);
  const [patientPolicyOptions, setPatientPolicyOptions] = useState<PatientPolicyOption[]>([]);
  const [patientEvaluations, setPatientEvaluations] = useState<StoredCoverageEvaluation[]>([]);
  const [selectedEvaluationPolicyId, setSelectedEvaluationPolicyId] = useState('');
  const [selectedEvaluationPolicyVersion, setSelectedEvaluationPolicyVersion] = useState<number | ''>('');
  const [isPatientPolicyOptionsLoading, setIsPatientPolicyOptionsLoading] = useState(false);
  const [isPatientEvaluationsLoading, setIsPatientEvaluationsLoading] = useState(false);
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
      fetchAntonRxSummary().catch(() => ({ summary: null as AntonRxCatalogSummary | null })),
      fetchIngestionSources().catch(() => ({ sources: [] as IngestedSourceRecord[], summary: null as IngestionSummary | null })),
      fetchAntonRxIssuers().catch(() => ({ issuers: [] as string[] }))
    ]);

    setCatalogSummary(summaryPayload.summary);
    setIngestedSources(sourcePayload.sources);
    setIngestionSummary(sourcePayload.summary);
    setIssuers(issuerPayload.issuers);
  }

  async function refreshPatientCases(preferredCaseId?: string) {
    const payload = await fetchPatientCases();
    setPatientCases(payload.cases);
    const nextSelectedCaseId = preferredCaseId && payload.cases.some((entry) => entry.caseId === preferredCaseId)
      ? preferredCaseId
      : payload.cases.some((entry) => entry.caseId === selectedCaseId)
        ? selectedCaseId
        : payload.cases[0]?.caseId ?? '';
    setSelectedCaseId(nextSelectedCaseId);
  }

  async function refreshPatientCaseWorkspace(caseId: string) {
    setIsPatientPolicyOptionsLoading(true);
    setIsPatientEvaluationsLoading(true);
    try {
      const [casePayload, policyPayload, evaluationPayload] = await Promise.all([
        fetchPatientCase(caseId),
        fetchPatientPolicyOptions(caseId),
        fetchCaseEvaluations(caseId)
      ]);
      setSelectedCase(casePayload.case);
      setPatientPolicyOptions(policyPayload.policies);
      setPatientEvaluations(evaluationPayload.evaluations);
    } finally {
      setIsPatientPolicyOptionsLoading(false);
      setIsPatientEvaluationsLoading(false);
    }
  }

  useEffect(() => {
    void refreshDataViews();
  }, [refreshToken]);

  useEffect(() => {
    void refreshPatientCases();
  }, []);

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

  useEffect(() => {
    if (!selectedCaseId) {
      setSelectedCase(null);
      setPatientPolicyOptions([]);
      setPatientEvaluations([]);
      setSelectedEvaluationPolicyId('');
      setSelectedEvaluationPolicyVersion('');
      return;
    }

    void refreshPatientCaseWorkspace(selectedCaseId).catch(() => {
      setSelectedCase(null);
      setPatientPolicyOptions([]);
      setPatientEvaluations([]);
    });
  }, [selectedCaseId]);

  useEffect(() => {
    if (patientPolicyOptions.length === 0) {
      setSelectedEvaluationPolicyId('');
      return;
    }

    setSelectedEvaluationPolicyId((current) =>
      patientPolicyOptions.some((option) => option.policyId === current)
        ? current
        : patientPolicyOptions[0].policyId
    );
  }, [patientPolicyOptions]);

  useEffect(() => {
    if (!selectedEvaluationPolicyId) {
      setSelectedEvaluationPolicyVersion('');
      return;
    }

    const selectedOption = patientPolicyOptions.find((option) => option.policyId === selectedEvaluationPolicyId);
    if (!selectedOption) {
      setSelectedEvaluationPolicyVersion('');
      return;
    }

    setSelectedEvaluationPolicyVersion((current) =>
      current !== '' && selectedOption.versions.includes(current)
        ? current
        : selectedOption.currentVersion
    );
  }, [patientPolicyOptions, selectedEvaluationPolicyId]);

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
    if (activePage !== 'changes') {
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

  async function handleCreatePatientCase(input: {
    patientName: string;
    payer: string;
    requestedDrug: string;
    diagnosis: string;
  }) {
    const created = await createStoredPatientCase(input);
    await refreshPatientCases(created.case.caseId);
    await refreshPatientCaseWorkspace(created.case.caseId);
  }

  async function handleUploadPatientDocument(input: {
    caseId: string;
    fileName: string;
    content: string;
    contentType?: string;
    documentType?: string;
  }) {
    const payload = await uploadPatientDocument(input);
    setSelectedCase(payload.case);
    await refreshPatientCases(payload.case.caseId);
    await refreshPatientCaseWorkspace(payload.case.caseId);
  }

  async function handleRunPatientEvaluation(input: {
    caseId: string;
    policyId: string;
    policyVersion: number;
  }) {
    await createCaseEvaluation(input);
    await refreshPatientCases(input.caseId);
    await refreshPatientCaseWorkspace(input.caseId);
  }

  function renderPhaseSidebar(
    title: string,
    copy: string,
    noteBadge = 'Phase 7',
    noteText = 'Every compare cell and insight cell is wired to evidence. The graph is intentionally simple and static.'
  ) {
    return (
      <aside className="sidebar">
        <div className="sidebar-section">
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
            className={`page-nav-btn${activePage === 'insights' ? ' page-nav-btn-active' : ''}`}
            onClick={() => setActivePage('insights')}
          >
            Insights
          </button>
          <button
            type="button"
            className={`page-nav-btn${activePage === 'changes' ? ' page-nav-btn-active' : ''}`}
            onClick={() => setActivePage('changes')}
          >
            Changes
          </button>
          <button
            type="button"
            className={`page-nav-btn${activePage === 'data' ? ' page-nav-btn-active' : ''}`}
            onClick={() => setActivePage('data')}
          >
            Data
          </button>
          <button
            type="button"
            className={`page-nav-btn${activePage === 'patients' ? ' page-nav-btn-active' : ''}`}
            onClick={() => setActivePage('patients')}
          >
            Patients
          </button>
        </nav>
      }
      sidebar={
        activePage === 'patients' ? (
          <PatientSidebar caseCount={patientCases.length} selectedCaseName={selectedCase?.patientName} />
        ) : activePage === 'compare' ? (
          renderPhaseSidebar(
            'Cross-payer compare',
            'Choose a drug family and at least two payers to inspect preferred products, prior auth, step therapy, covered indications, and restrictions.'
          )
        ) : activePage === 'insights' ? (
          renderPhaseSidebar(
            'Heat map and graph',
            'Filter the current policy corpus and drill into payer-by-rule patterns through a heat map and relationship graph.'
          )
        ) : activePage === 'changes' ? (
          renderPhaseSidebar(
            'Change history and diff',
            'Track policy updates over time, inspect materiality labels, and open side-by-side version diffs.',
            'Phase 8',
            'Policy changes are classified deterministically as cosmetic, operational, or clinical.'
          )
        ) : (
          <Sidebar
            issuers={issuers}
            selectedIssuer={selectedIssuer}
            drugQuery={drugQuery}
            onIssuerChange={setSelectedIssuer}
            onDrugQueryChange={setDrugQuery}
          />
        )
      }
      listPane={
        activePage === 'patients' ? (
          <PatientCasesView
            cases={patientCases}
            selectedCaseId={selectedCaseId}
            onSelectCase={setSelectedCaseId}
            onCreateCase={handleCreatePatientCase}
          />
        ) : activePage === 'data' ? (
          <IngestionPanel
            ingestedSources={ingestedSources}
            ingestionSummary={ingestionSummary}
            catalogSummary={catalogSummary}
            onIngestionComplete={handleIngestionComplete}
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
        ) : activePage === 'insights' ? (
          <PolicyInsightsBuilder
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
          <PolicyChangesFilters
            options={policyChanges?.filters ?? null}
            selectedPayer={changesPayer}
            selectedDrugFamily={changesDrugFamily}
            selectedSeverity={changesSeverity}
            onPayerChange={setChangesPayer}
            onDrugFamilyChange={setChangesDrugFamily}
            onSeverityChange={setChangesSeverity}
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
        activePage === 'patients' ? (
          <PatientCaseDetailView
            patientCase={selectedCase}
            policyOptions={patientPolicyOptions}
            evaluations={patientEvaluations}
            selectedPolicyId={selectedEvaluationPolicyId}
            selectedPolicyVersion={selectedEvaluationPolicyVersion}
            policyOptionsLoading={isPatientPolicyOptionsLoading}
            evaluationsLoading={isPatientEvaluationsLoading}
            onPolicyChange={setSelectedEvaluationPolicyId}
            onPolicyVersionChange={setSelectedEvaluationPolicyVersion}
            onRunEvaluation={handleRunPatientEvaluation}
            onUploadDocument={handleUploadPatientDocument}
          />
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
            />
          )
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
