import { PolicyEvidencePanel } from './policy-evidence-panel.js';
import { KnowledgeGraph } from './knowledge-graph.js';
import { MultiSelectDropdown } from './multi-select-dropdown.js';
import { type PolicyCompareOptions, type PolicyEvidenceRef, type PolicyInsightsPayload } from '../data/policies.js';

type PolicyInsightsBuilderProps = {
  options: PolicyCompareOptions | null;
  payerOptions: string[];
  selectedDrugFamily: string;
  selectedPayers: string[];
  selectedRuleType: string;
  selectedVersion: string;
  onDrugFamilyChange: (value: string) => void;
  onTogglePayer: (payer: string) => void;
  onRuleTypeChange: (value: string) => void;
  onVersionChange: (value: string) => void;
};

type PolicyInsightsViewProps = {
  insights: PolicyInsightsPayload | null;
  loading: boolean;
  error: string | null;
  selectedEvidence: { title: string; evidence: PolicyEvidenceRef[] } | null;
  onOpenEvidence: (title: string, evidence: PolicyEvidenceRef[]) => void;
  onClearEvidence: () => void;
  // Filter props
  options: PolicyCompareOptions | null;
  payerOptions: string[];
  selectedDrugFamily: string;
  selectedPayers: string[];
  selectedRuleType: string;
  selectedVersion: string;
  onDrugFamilyChange: (value: string) => void;
  onTogglePayer: (payer: string) => void;
  onRuleTypeChange: (value: string) => void;
  onVersionChange: (value: string) => void;
};

export function PolicyInsightsBuilder({
  options,
  payerOptions,
  selectedDrugFamily,
  selectedPayers,
  selectedRuleType,
  selectedVersion,
  onDrugFamilyChange,
  onTogglePayer,
  onRuleTypeChange,
  onVersionChange
}: PolicyInsightsBuilderProps) {
  if (!options) {
    return <div className="empty-state">Loading policy insight options…</div>;
  }

  return (
    <div className="compare-builder">
      <div className="panel-header sidebar-section-header">
        <div>
          <p className="eyebrow">Policy Insights</p>
          <h2>Relationship graph</h2>
          <p className="sidebar-copy">
            Filter the policy corpus by drug family, payer, rule type, and version.
          </p>
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-field">
          <label className="field-label" htmlFor="insights-drug-family">
            Drug Family
          </label>
          <select
            id="insights-drug-family"
            className="field-input"
            value={selectedDrugFamily}
            onChange={(event) => onDrugFamilyChange(event.target.value)}
          >
            {options.drugFamilies.map((family) => (
              <option key={family.key} value={family.key}>
                {family.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label className="field-label" htmlFor="insights-rule-type">
            Rule Type
          </label>
          <select
            id="insights-rule-type"
            className="field-input"
            value={selectedRuleType}
            onChange={(event) => onRuleTypeChange(event.target.value)}
          >
            <option value="">All rule types</option>
            {options.ruleTypes.map((ruleType) => (
              <option key={ruleType.key} value={ruleType.key}>
                {ruleType.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="detail-card">
        <label className="field-label" htmlFor="insights-version">
          Version
        </label>
        <select
          id="insights-version"
          className="field-input"
          value={selectedVersion}
          onChange={(event) => onVersionChange(event.target.value)}
        >
          <option value="">Current version</option>
          {options.versions.map((version) => (
            <option key={version} value={String(version)}>
              Version {version}
            </option>
          ))}
        </select>
      </div>

      <MultiSelectDropdown
        id="insights-builder-issuer"
        label="Issuer"
        options={options.payers}
        selected={selectedPayers}
        onToggle={onTogglePayer}
        placeholder="Select issuers…"
      />
    </div>
  );
}


export function PolicyInsightsView({
  insights,
  loading,
  error,
  selectedEvidence,
  onOpenEvidence,
  onClearEvidence,
  options,
  payerOptions,
  selectedDrugFamily,
  selectedPayers,
  selectedRuleType,
  selectedVersion,
  onDrugFamilyChange,
  onTogglePayer,
  onRuleTypeChange,
  onVersionChange
}: PolicyInsightsViewProps) {
  function renderFilters() {
    if (!options) {
      return null;
    }

    return (
      <div className="workspace-top-filters">
        <div className="filter-row">
          <div className="filter-field">
            <label className="field-label" htmlFor="insights-drug-family">
              Drug Family
            </label>
            <select
              id="insights-drug-family"
              className="field-input"
              value={selectedDrugFamily}
              onChange={(event) => onDrugFamilyChange(event.target.value)}
            >
              {options.drugFamilies.map((family) => (
                <option key={family.key} value={family.key}>
                  {family.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label className="field-label" htmlFor="insights-rule-type">
              Rule Type
            </label>
            <select
              id="insights-rule-type"
              className="field-input"
              value={selectedRuleType}
              onChange={(event) => onRuleTypeChange(event.target.value)}
            >
              <option value="">All rule types</option>
              {options.ruleTypes.map((ruleType) => (
                <option key={ruleType.key} value={ruleType.key}>
                  {ruleType.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label className="field-label" htmlFor="insights-version">
              Version
            </label>
            <select
              id="insights-version"
              className="field-input"
              value={selectedVersion}
              onChange={(event) => onVersionChange(event.target.value)}
            >
              <option value="">Current version</option>
              {options.versions.map((version) => (
                <option key={version} value={String(version)}>
                  Version {version}
                </option>
              ))}
            </select>
          </div>
        </div>

        <MultiSelectDropdown
          id="insights-view-issuer"
          label="Issuer"
          options={options.payers}
          selected={selectedPayers}
          onToggle={onTogglePayer}
          placeholder="Select issuers…"
        />
      </div>
    );
  }

  return (
    <div className="compare-view">
      <div className="panel-header sidebar-section-header">
        <div>
          <p className="eyebrow">Policy Insights</p>
          <h2>Relationship graph</h2>
          <p className="sidebar-copy">
            Filter the policy corpus by drug family, payer, rule type, and version.
          </p>
        </div>
      </div>

      {renderFilters()}

      {loading && <div className="empty-state">Loading policy insights…</div>}

      {error && <div className="chat-error">{error}</div>}

      {!loading && !error && !insights && (
        <div className="empty-state">Select a drug family to view the policy relationship graph.</div>
      )}

      {!loading && !error && insights && (
        <>
          <section className="detail-section">
            <h3>Knowledge graph</h3>
            <p className="sidebar-copy" style={{ marginBottom: '1rem' }}>
              Interactive visualization of relationships between drugs, payers, policies, and rules.
              Click nodes to view evidence, drag to reposition, scroll to zoom.
            </p>
            <KnowledgeGraph
              nodes={insights.graph.nodes}
              edges={insights.graph.edges}
              onNodeClick={(node) => {
                onOpenEvidence(
                  node.label,
                  node.evidence.length > 0
                    ? node.evidence
                    : [{
                        id: `${node.id}-context`,
                        snippet: `${node.label} is represented as a ${node.kind} node in the current policy relationship graph.`,
                        document: 'Policy Insights graph',
                        page: null,
                        section: 'Graph context',
                        fieldLabel: 'Graph node',
                        policyId: node.id,
                        policyVersion: 0,
                        payer: insights.drugFamily.label
                      }]
                );
              }}
            />
          </section>

          {selectedEvidence && (
            <PolicyEvidencePanel
              title={selectedEvidence.title}
              evidence={selectedEvidence.evidence}
              onClose={onClearEvidence}
            />
          )}
        </>
      )}
    </div>
  );
}
