type PatientSidebarProps = {
  caseCount: number;
  selectedCaseName?: string;
};

export function PatientSidebar({ caseCount, selectedCaseName }: PatientSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <p className="eyebrow">Phase 9</p>
        <h2 className="sidebar-title">Patient cases and coverage evaluation</h2>
        <p className="sidebar-copy">
          Manage synthetic cases, upload clinical artifacts, inspect extracted facts, and run evidence-backed coverage evaluation against stored policy versions.
        </p>
      </div>

      <div className="sidebar-section sidebar-note">
        <span className="note-badge">Cases</span>
        <p>{caseCount} patient case{caseCount === 1 ? '' : 's'} available{selectedCaseName ? ` · focused on ${selectedCaseName}` : ''}.</p>
      </div>

      <div className="sidebar-section sidebar-note">
        <span className="note-badge">Upload</span>
        <p>FHIR Bundle JSON extracts diagnoses, medications, and payer automatically. Plain-text notes support lightweight field parsing.</p>
      </div>

      <div className="sidebar-section sidebar-note">
        <span className="note-badge">Evaluation</span>
        <p>Use the selected case to choose a policy version, run the checklist, and inspect the patient evidence and policy evidence side by side.</p>
      </div>
    </aside>
  );
}
