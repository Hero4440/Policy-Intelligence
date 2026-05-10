/**
 * Structured output format for Doctor Agent based on system prompt
 * Implements the required response format: Answer, Status, Patient Facts, Policy Findings, etc.
 */

export type ReadinessStatus =
  | 'Ready for PA submission'
  | 'Likely eligible but documentation missing'
  | 'Needs review'
  | 'Not covered based on available evidence'
  | 'Insufficient policy evidence'
  | 'Insufficient patient data';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type CriterionStatus = 'PASS' | 'FAIL' | 'UNKNOWN' | 'MISSING';

export interface PatientFact {
  fact: string;
  evidenceSource: string;
  confidence: ConfidenceLevel;
}

export interface CriteriaChecklistItem {
  requirement: string;
  status: CriterionStatus;
  patientEvidence: string;
  policyEvidence: string;
}

export interface PolicyFinding {
  payer: string;
  policy: string;
  drug: string;
  coverageStatus: string;
  paRequired: boolean;
  preferredProductRequirement?: string;
  stepTherapy?: string;
  keyCriteria: string[];
}

export interface SourceCitation {
  tool: string;
  source: string;
  evidence?: string;
}

export interface DoctorAgentResponse {
  // Section 1: Direct answer
  answer: string;

  // Section 1b: Explanation with evidence
  answerExplanation: string;

  // Section 2: Readiness status
  status: ReadinessStatus;

  // Section 3: Patient facts used
  patientFacts: PatientFact[];

  // Section 4: Policy findings
  policyFindings: PolicyFinding[];

  // Section 5: Criteria checklist
  criteriaChecklist: CriteriaChecklistItem[];

  // Section 6: Missing information
  missingInformation: string[];

  // Section 7: Recommended next steps
  recommendedNextSteps: string[];

  // Section 8: Source citations
  sources: SourceCitation[];

  // Section 9: Confidence assessment
  confidence: ConfidenceLevel;
  confidenceExplanation: string;
}

/**
 * Format DoctorAgentResponse as readable markdown
 */
export function formatDoctorAgentResponse(response: DoctorAgentResponse): string {
  const lines: string[] = [];

  // Answer
  lines.push('## Answer');
  lines.push(response.answer);
  lines.push('');

  // Answer Explanation with source references
  lines.push('## Explanation');
  lines.push(response.answerExplanation);
  lines.push('');

  // Status
  lines.push('## Status');
  lines.push(`**${response.status}**`);
  lines.push('');

  // Patient Facts Used
  lines.push('## Patient Facts Used');
  if (response.patientFacts.length === 0) {
    lines.push('None');
  } else {
    for (const fact of response.patientFacts) {
      lines.push(`- **Fact:** ${fact.fact}`);
      lines.push(`  - Evidence source: ${fact.evidenceSource}`);
      lines.push(`  - Confidence: ${fact.confidence}`);
    }
  }
  lines.push('');

  // Policy Findings
  lines.push('## Policy Findings');
  if (response.policyFindings.length === 0) {
    lines.push('No policy findings available.');
  } else {
    for (const finding of response.policyFindings) {
      lines.push(`### ${finding.payer} - ${finding.drug}`);
      lines.push(`- **Policy:** ${finding.policy}`);
      lines.push(`- **Coverage Status:** ${finding.coverageStatus}`);
      lines.push(`- **PA Required:** ${finding.paRequired ? 'Yes' : 'No'}`);
      if (finding.preferredProductRequirement) {
        lines.push(`- **Preferred Product Requirement:** ${finding.preferredProductRequirement}`);
      }
      if (finding.stepTherapy) {
        lines.push(`- **Step Therapy:** ${finding.stepTherapy}`);
      }
      lines.push(`- **Key Criteria:** ${finding.keyCriteria.join(', ')}`);
      lines.push('');
    }
  }
  lines.push('');

  // Criteria Checklist
  lines.push('## Criteria Checklist');
  if (response.criteriaChecklist.length === 0) {
    lines.push('No criteria checklist available.');
  } else {
    lines.push('| Requirement | Status | Patient Evidence | Policy Evidence |');
    lines.push('|---|---|---|---|');
    for (const item of response.criteriaChecklist) {
      const statusEmoji = {
        PASS: '✅',
        FAIL: '❌',
        UNKNOWN: '❓',
        MISSING: '⚠️'
      }[item.status] || item.status;
      lines.push(`| ${item.requirement} | ${statusEmoji} ${item.status} | ${item.patientEvidence} | ${item.policyEvidence} |`);
    }
  }
  lines.push('');

  // Missing Information
  lines.push('## Missing Information');
  if (response.missingInformation.length === 0) {
    lines.push('All required information is available.');
  } else {
    for (const missing of response.missingInformation) {
      lines.push(`- ${missing}`);
    }
  }
  lines.push('');

  // Recommended Next Steps
  lines.push('## Recommended Next Steps');
  if (response.recommendedNextSteps.length === 0) {
    lines.push('No additional steps required.');
  } else {
    for (const step of response.recommendedNextSteps) {
      lines.push(`- ${step}`);
    }
  }
  lines.push('');

  // Sources
  lines.push('## Sources');
  if (response.sources.length === 0) {
    lines.push('No sources cited.');
  } else {
    for (const source of response.sources) {
      lines.push(`- **Tool:** ${source.tool}`);
      lines.push(`  - **Source:** ${source.source}`);
      if (source.evidence) {
        lines.push(`  - **Evidence:** "${source.evidence}"`);
      }
    }
  }
  lines.push('');

  // Confidence
  lines.push('## Confidence');
  lines.push(`**${response.confidence}**`);
  lines.push('');
  lines.push(response.confidenceExplanation);

  return lines.join('\n');
}

/**
 * Example factory for creating DoctorAgentResponse objects
 */
export function createDoctorAgentResponse(
  answer: string,
  status: ReadinessStatus,
  overrides?: Partial<DoctorAgentResponse>
): DoctorAgentResponse {
  return {
    answer,
    answerExplanation: '',
    status,
    patientFacts: [],
    policyFindings: [],
    criteriaChecklist: [],
    missingInformation: [],
    recommendedNextSteps: [],
    sources: [],
    confidence: 'MEDIUM',
    confidenceExplanation: 'Standard confidence assessment.',
    ...overrides
  };
}
