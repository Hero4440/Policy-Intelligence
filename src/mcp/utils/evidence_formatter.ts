import type { PolicyRecord } from '../../../data/schemas/policy.schema.ts';
import type { ConfidenceLevel, EvidenceItem } from './response_builder.js';

type EvidenceSource = {
  page: number;
  section: string;
};

type EvidenceBackedRequirement = {
  evidenceText: string;
  source: EvidenceSource;
};

export function formatSourceCitation(policy: PolicyRecord): {
  policy_id: string;
  policy_title: string;
  effective_date?: string;
} {
  return {
    policy_id: policy.id,
    policy_title: policy.policyTitle || policy.sourceDocument.filename,
    effective_date: policy.sourceDocument.effectiveDate
  };
}

function buildEvidenceItem(
  policy: PolicyRecord,
  field: string,
  requirement: EvidenceBackedRequirement
): EvidenceItem {
  return {
    field,
    text: requirement.evidenceText,
    source: {
      ...formatSourceCitation(policy),
      page: requirement.source.page,
      section: requirement.source.section
    }
  };
}

export function extractEvidenceArray(policy: PolicyRecord): EvidenceItem[] {
  return [
    ...policy.diagnosisRequirements.map(requirement =>
      buildEvidenceItem(policy, 'diagnosis_requirements', requirement)
    ),
    ...policy.stepTherapy.map(requirement =>
      buildEvidenceItem(policy, 'step_therapy', requirement)
    ),
    ...policy.otherRequirements.map(requirement =>
      buildEvidenceItem(policy, requirement.category, requirement)
    )
  ];
}

export function calculateConfidence(policy: PolicyRecord): ConfidenceLevel {
  const requirements: EvidenceBackedRequirement[] = [
    ...policy.diagnosisRequirements,
    ...policy.stepTherapy,
    ...policy.otherRequirements
  ];

  if (requirements.length === 0) {
    return 'LOW';
  }

  const allHaveEvidence = requirements.every(requirement =>
    requirement.evidenceText.trim().length > 0
  );

  return allHaveEvidence ? 'HIGH' : 'MEDIUM';
}
