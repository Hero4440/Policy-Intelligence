type PatientSidebarProps = {
  caseCount: number;
  selectedCaseName?: string;
};

export function PatientSidebar({ caseCount, selectedCaseName }: PatientSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <p className="eyebrow">Milestone 6</p>
        <h2 className="sidebar-title">Patient documents and extracted facts</h2>
        <p className="sidebar-copy">
          Manage synthetic cases, upload clinical artifacts, and inspect the fact layer that will feed policy matching.
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
        <span className="note-badge">Next</span>
        <p>This page feeds Milestone 7 patient-to-policy evaluation by persisting case-linked evidence and document-derived facts.</p>
      </div>
    </aside>
  );
}
