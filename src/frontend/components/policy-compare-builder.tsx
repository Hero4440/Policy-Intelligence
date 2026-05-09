import type { PolicyCompareOptions } from '../data/policies.js';

type PolicyCompareBuilderProps = {
  options: PolicyCompareOptions | null;
  payerOptions: string[];
  selectedDrugFamily: string;
  selectedPayers: string[];
  selectedVersion: string;
  onDrugFamilyChange: (value: string) => void;
  onTogglePayer: (payer: string) => void;
  onVersionChange: (value: string) => void;
};

export function PolicyCompareBuilder({
  options,
  payerOptions,
  selectedDrugFamily,
  selectedPayers,
  selectedVersion,
  onDrugFamilyChange,
  onTogglePayer,
  onVersionChange
}: PolicyCompareBuilderProps) {
  if (!options) {
    return <div className="empty-state">Loading policy compare options…</div>;
  }

  return (
    <div className="compare-builder">
      <div className="panel-header sidebar-section-header">
        <div>
          <p className="eyebrow">Policy Compare</p>
          <h2>Select drug family and payers</h2>
          <p className="sidebar-copy">
            Compare current normalized policy rules side by side. Select at least two payers.
          </p>
        </div>
        <span className="panel-count">{selectedPayers.length} selected</span>
      </div>

      <div className="filter-row">
        <div className="filter-field">
          <label className="field-label" htmlFor="compare-drug-family">
            Drug Query
          </label>
          <select
            id="compare-drug-family"
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
          <label className="field-label" htmlFor="compare-version">
            Version
          </label>
          <select
            id="compare-version"
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

      <div className="filter-field" style={{ marginTop: '16px' }}>
        <label className="field-label">Issuer</label>
        <div className="compare-builder-list">
          {payerOptions.map((payer) => {
            const selected = selectedPayers.includes(payer);
            return (
              <label
                key={payer}
                className={`compare-builder-card${selected ? ' compare-builder-card-selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onTogglePayer(payer)}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>{payer}</strong>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
                    {selected ? 'Included in compare' : 'Click to include in compare'}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
