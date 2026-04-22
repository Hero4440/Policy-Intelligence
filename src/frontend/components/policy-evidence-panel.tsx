import type { PolicyEvidenceRef } from '../data/policies.js';

type PolicyEvidencePanelProps = {
  title: string;
  evidence: PolicyEvidenceRef[];
  onClose?: () => void;
};

export function PolicyEvidencePanel({ title, evidence, onClose }: PolicyEvidencePanelProps) {
  return (
    <section className="evidence-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Source Evidence</p>
          <h2>{title}</h2>
        </div>
        {onClose && (
          <button type="button" className="page-nav-btn" onClick={onClose}>
            Clear
          </button>
        )}
      </div>

      <div className="evidence-panel-list">
        {evidence.map((item) => (
          <article key={item.id} className="detail-card">
            <p>{item.snippet}</p>
            <small>
              {item.document}
              {item.page ? ` · page ${item.page}` : ''}
              {item.section ? ` · ${item.section}` : ''}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}
