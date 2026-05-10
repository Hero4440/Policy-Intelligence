/**
 * Integration layer: converts MCP tool results and chat context into DoctorAgentResponse
 */

import type { ToolExecutionResult } from './chat.js';
import type {
  DoctorAgentResponse,
  ReadinessStatus,
  PatientFact,
  PolicyFinding,
  CriteriaChecklistItem,
  SourceCitation,
  ConfidenceLevel
} from './doctor-agent-output.js';
import { createDoctorAgentResponse } from './doctor-agent-output.js';

interface PatientContext {
  name?: string;
  diagnosis?: string;
  age?: number;
  clinicalFindings?: Record<string, string>;
}

interface DoctorAgentContext {
  patient?: PatientContext;
  payer?: string;
  drug?: string;
  userMessage: string;
  toolResults: ToolExecutionResult[];
}

/**
 * Extract patient facts from tool results and context
 */
function extractPatientFacts(context: DoctorAgentContext): PatientFact[] {
  const facts: PatientFact[] = [];

  if (context.patient?.name) {
    facts.push({
      fact: `Patient: ${context.patient.name}`,
      evidenceSource: 'Patient context',
      confidence: 'HIGH'
    });
  }

  if (context.patient?.age) {
    facts.push({
      fact: `Age: ${context.patient.age}`,
      evidenceSource: 'Patient demographics',
      confidence: 'HIGH'
    });
  }

  if (context.patient?.diagnosis) {
    facts.push({
      fact: `Diagnosis: ${context.patient.diagnosis}`,
      evidenceSource: 'Clinical records',
      confidence: 'HIGH'
    });
  }

  if (context.drug) {
    facts.push({
      fact: `Requested drug: ${context.drug}`,
      evidenceSource: 'User request',
      confidence: 'HIGH'
    });
  }

  if (context.patient?.clinicalFindings) {
    for (const [finding, value] of Object.entries(context.patient.clinicalFindings)) {
      facts.push({
        fact: `${finding}: ${value}`,
        evidenceSource: 'Clinical assessment',
        confidence: 'HIGH'
      });
    }
  }

  return facts;
}

/**
 * Extract policy findings from tool results
 */
function extractPolicyFindings(toolResults: ToolExecutionResult[]): PolicyFinding[] {
  const findings: PolicyFinding[] = [];

  for (const result of toolResults) {
    if (result.tool === 'check_patient_readiness' && result.data.payer && result.data.drug) {
      findings.push({
        payer: result.data.payer,
        policy: result.data.plan || 'Unknown plan',
        drug: result.data.drug,
        coverageStatus: 'Covered (criteria evaluation in progress)',
        paRequired: true, // This is typically true for readiness checks
        keyCriteria: result.data.criteriaResults?.map((r: any) => r.criterion) || []
      });
    }

    if (result.tool === 'get_plan_drug_details' && result.data) {
      findings.push({
        payer: result.data.issuerName || 'Unknown payer',
        policy: result.data.policyName || 'Unknown policy',
        drug: result.data.drug || 'Unknown drug',
        coverageStatus: result.data.coverageLabel || 'Unknown',
        paRequired: result.data.priorAuthRequired || false,
        preferredProductRequirement: result.data.preferredProduct,
        stepTherapy: result.data.stepTherapyRules?.join('; '),
        keyCriteria: result.data.requirementsSummary || []
      });
    }

    if (result.tool === 'which_plans_cover_drug' && result.data.matches) {
      for (const match of result.data.matches.slice(0, 3)) {
        findings.push({
          payer: match.issuerName,
          policy: match.planName,
          drug: result.data.drug,
          coverageStatus: match.coverageLabel,
          paRequired: match.priorAuth || false,
          stepTherapy: match.stepTherapy ? 'Yes' : 'No',
          keyCriteria: ['Coverage status verified']
        });
      }
    }

    if (result.tool === 'compare_drug_across_plans' && result.data.matches) {
      for (const match of result.data.matches.slice(0, 3)) {
        findings.push({
          payer: match.issuerName,
          policy: match.planName,
          drug: result.data.drug,
          coverageStatus: match.coverageLabel,
          paRequired: match.priorAuth || false,
          stepTherapy: match.stepTherapy ? 'Yes' : 'No',
          keyCriteria: ['Coverage compared']
        });
      }
    }
  }

  return findings;
}

/**
 * Build criteria checklist from readiness check results
 */
function buildCriteriaChecklist(toolResults: ToolExecutionResult[]): CriteriaChecklistItem[] {
  const checklist: CriteriaChecklistItem[] = [];

  for (const result of toolResults) {
    if (result.tool === 'check_patient_readiness' && result.data.criteriaResults) {
      for (const criterion of result.data.criteriaResults) {
        const statusMap: Record<string, any> = {
          appears_to_match: 'PASS',
          does_not_match: 'FAIL',
          insufficient_evidence: 'UNKNOWN'
        };

        checklist.push({
          requirement: criterion.criterion,
          status: statusMap[criterion.status] || 'UNKNOWN',
          patientEvidence: criterion.patientValue || 'Not documented',
          policyEvidence: criterion.policyRequirement || 'Unknown'
        });
      }
    }
  }

  return checklist;
}

/**
 * Determine readiness status based on criteria
 */
function determineReadinessStatus(
  checklist: CriteriaChecklistItem[],
  hasMissingInfo: boolean
): ReadinessStatus {
  if (checklist.length === 0) {
    return 'Insufficient patient data';
  }

  const passed = checklist.filter(c => c.status === 'PASS').length;
  const failed = checklist.filter(c => c.status === 'FAIL').length;
  const total = checklist.length;

  if (failed > 0) {
    return 'Needs review';
  }

  if (passed === total) {
    return 'Ready for PA submission';
  }

  if (hasMissingInfo) {
    return 'Likely eligible but documentation missing';
  }

  return 'Needs review';
}

/**
 * Build source citations from tool results
 */
function buildSourceCitations(toolResults: ToolExecutionResult[]): SourceCitation[] {
  const citations: SourceCitation[] = [];
  const toolNames = new Set<string>();

  for (const result of toolResults) {
    if (!toolNames.has(result.tool)) {
      toolNames.add(result.tool);
      citations.push({
        tool: result.tool,
        source: `${result.data.payer || 'Unknown'} ${result.data.drug || result.data.plan || ''}`.trim(),
        evidence: result.summary?.items?.[0] || ''
      });
    }
  }

  return citations;
}

/**
 * Assess confidence based on data completeness
 */
function assessConfidence(
  context: DoctorAgentContext,
  checklist: CriteriaChecklistItem[],
  policyFindings: PolicyFinding[]
): { level: ConfidenceLevel; explanation: string } {
  const factors: string[] = [];
  let confidenceLevel: ConfidenceLevel = 'MEDIUM';

  // Check evidence completeness
  if (context.toolResults.length === 0) {
    factors.push('No tool results available');
    confidenceLevel = 'LOW';
  } else if (context.toolResults.length >= 2) {
    factors.push('Multiple tool results reviewed');
  }

  // Check patient data completeness
  if (context.patient?.clinicalFindings && Object.keys(context.patient.clinicalFindings).length >= 3) {
    factors.push('Complete patient clinical data');
  } else {
    factors.push('Partial patient data');
  }

  // Check policy specificity
  if (policyFindings.length > 0 && policyFindings[0].keyCriteria.length >= 3) {
    factors.push('Specific policy criteria available');
  } else if (policyFindings.length === 0) {
    factors.push('Limited policy information');
    confidenceLevel = 'LOW';
  }

  // Check criteria match rate
  if (checklist.length > 0) {
    const matched = checklist.filter(c => c.status === 'PASS').length;
    const matchRate = matched / checklist.length;
    if (matchRate === 1) {
      factors.push('All criteria met');
      confidenceLevel = 'HIGH';
    } else if (matchRate >= 0.7) {
      factors.push('Most criteria met');
    } else {
      factors.push('Multiple criteria unmet');
      if (confidenceLevel !== 'HIGH') confidenceLevel = 'MEDIUM';
    }
  }

  const explanation = factors.join('. ') + '.';
  return { level: confidenceLevel, explanation };
}

/**
 * Convert DoctorAgentContext and tool results into DoctorAgentResponse
 */
export function buildDoctorAgentResponse(context: DoctorAgentContext): DoctorAgentResponse {
  const patientFacts = extractPatientFacts(context);
  const policyFindings = extractPolicyFindings(context.toolResults);
  const criteriaChecklist = buildCriteriaChecklist(context.toolResults);
  const sources = buildSourceCitations(context.toolResults);

  const missingInfo: string[] = [];
  if (context.patient?.clinicalFindings === undefined) {
    missingInfo.push('Complete clinical findings documentation');
  }
  if (policyFindings.length === 0) {
    missingInfo.push('Policy coverage information for the requested drug');
  }
  if (criteriaChecklist.some(c => c.status === 'UNKNOWN')) {
    missingInfo.push('Verification of uncertain clinical criteria');
  }

  const recommendedSteps: string[] = [];
  if (criteriaChecklist.some(c => c.status === 'FAIL')) {
    recommendedSteps.push('Review why specific criteria are not met and discuss alternatives with the patient');
  }
  if (criteriaChecklist.every(c => c.status === 'PASS' || c.status === 'UNKNOWN')) {
    recommendedSteps.push('Submit prior authorization request with gathered documentation');
  }
  if (missingInfo.length > 0) {
    recommendedSteps.push(`Gather missing information: ${missingInfo.join(', ')}`);
  }

  const readinessStatus = determineReadinessStatus(criteriaChecklist, missingInfo.length > 0);
  const { level: confidenceLevel, explanation: confidenceExplanation } = assessConfidence(
    context,
    criteriaChecklist,
    policyFindings
  );

  // Build answer
  const matchedCount = criteriaChecklist.filter(c => c.status === 'PASS').length;
  const totalCriteria = criteriaChecklist.length;
  const answer =
    totalCriteria > 0
      ? `${matchedCount}/${totalCriteria} criteria appear met for prior authorization. ${readinessStatus === 'Ready for PA submission' ? 'Patient appears ready for submission.' : 'Additional review required before submission.'}`
      : 'Unable to determine readiness without complete policy and patient information.';

  return createDoctorAgentResponse(answer, readinessStatus, {
    patientFacts,
    policyFindings,
    criteriaChecklist,
    missingInformation: missingInfo,
    recommendedNextSteps: recommendedSteps,
    sources,
    confidence: confidenceLevel,
    confidenceExplanation
  });
}
