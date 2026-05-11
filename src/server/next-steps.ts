import type { CoverageEvaluation, EvaluationChecklistItem, EvaluationPolicyEvidence } from '../storage/types.js';
import { getEvaluation } from '../storage/evaluation-store.js';
import { geminiChat, getDefaultModel } from './gemini-client.js';

export interface MissingDocItem {
  criterion: string;
  category: string;
  rationale: string;
  policyEvidence: {
    snippet: string;
    document: string;
    page: number | null;
    section: string;
    fieldLabel: string;
  };
}

export interface PayerAnalystCriterion {
  criterion: string;
  status: string;
  policyEvidence: {
    snippet: string;
    document: string;
    page: number | null;
    section: string;
  };
  clinicAction: string;
}

export interface PayerAnalystBreakdown {
  summary: string;
  criteriaAnalysis: PayerAnalystCriterion[];
}

export interface NextStepsPayload {
  evalId: string;
  clinicNextSteps: string[];
  missingDocsList: MissingDocItem[];
  patientExplanation: string;
  payerAnalystBreakdown: PayerAnalystBreakdown;
}

export class EvaluationNotFoundError extends Error {
  constructor(evalId: string) {
    super(`Evaluation not found: ${evalId}`);
    this.name = 'EvaluationNotFoundError';
  }
}

type ChatPayload = Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;

function readEvaluation(evalId: string): CoverageEvaluation | null {
  return getEvaluation(evalId);
}

function buildMissingDocItem(item: EvaluationChecklistItem): MissingDocItem {
  return {
    criterion: item.criterion,
    category: item.category,
    rationale: item.rationale,
    policyEvidence: {
      snippet: item.policyEvidence.snippet,
      document: item.policyEvidence.document,
      page: item.policyEvidence.page,
      section: item.policyEvidence.section,
      fieldLabel: item.policyEvidence.fieldLabel
    }
  };
}

function buildMissingDocsList(evaluation: CoverageEvaluation): MissingDocItem[] {
  return evaluation.checklist
    .filter((item) => item.status === 'MISSING')
    .map(buildMissingDocItem);
}

function pushUnique(target: string[], value: string): void {
  if (!target.includes(value)) {
    target.push(value);
  }
}

function buildClinicAction(item: Pick<EvaluationChecklistItem, 'criterion' | 'status'>): string {
  if (item.status === 'PASS') {
    return 'Evidence already satisfies this criterion.';
  }
  if (item.status === 'MISSING') {
    return `Obtain ${item.criterion} documentation before submission.`;
  }
  if (item.status === 'NEEDS REVIEW') {
    return `Review ${item.criterion} manually with the clinical team.`;
  }
  return `Clarify ${item.criterion} before final submission.`;
}

function buildClinicNextSteps(evaluation: CoverageEvaluation, missingDocsList: MissingDocItem[]): string[] {
  const steps: string[] = [];
  const payer = evaluation.payer || 'the payer';

  pushUnique(steps, 'Review evaluation results with the clinical team');

  if (
    evaluation.coverageStatus === 'PA Required'
    || evaluation.coverageStatus === 'Likely Eligible but Docs Missing'
  ) {
    pushUnique(steps, `Submit prior authorization request to ${payer}`);
  }

  for (const item of missingDocsList) {
    pushUnique(steps, `Obtain ${item.criterion} documentation`);
  }

  if (evaluation.coverageStatus === 'Not Covered') {
    pushUnique(steps, 'Discuss alternative treatment options with prescriber');
  }

  if (evaluation.coverageStatus === 'Preferred Alternative Required') {
    pushUnique(steps, 'Review preferred alternatives with prescriber before resubmission');
  }

  pushUnique(steps, 'Document all communications with payer in the case record');
  return steps;
}

async function callGemini(prompt: string): Promise<string> {
  const messages: ChatPayload = [
    {
      role: 'system',
      content: 'You generate concise policy workflow summaries and structured JSON when requested. Follow the user prompt exactly.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  return await geminiChat(messages, getDefaultModel());
}

function buildPatientExplanationFallback(evaluation: CoverageEvaluation, missingDocsList: MissingDocItem[]): string {
  const payer = evaluation.payer || 'your insurance plan';
  const drug = evaluation.requestedDrug || 'the requested treatment';
  const missingDocs = missingDocsList.map((item) => item.criterion).join(', ');

  const firstParagraph = `${payer} reviewed the request for ${drug} and the current status is ${evaluation.coverageStatus}. This means the clinic has enough information to understand the payer rule set, but there may still be documents or payer steps needed before a final approval is secured.`;
  const secondParagraph = missingDocsList.length > 0
    ? `Right now, the clinic still needs to gather the following information: ${missingDocs}. Once those items are collected, the team can submit or update the authorization package with the supporting documentation the payer expects.`
    : 'At this stage, there are no remaining missing documentation items in the saved checklist. The clinic can move forward with the next payer-facing action based on the evaluation result.';
  const thirdParagraph = 'The clinic team should keep you informed about what has been submitted, whether the payer asks for anything else, and whether an alternative treatment discussion is needed. You may be asked to help confirm treatment history or provide records from prior care.';

  return [firstParagraph, secondParagraph, thirdParagraph].join('\n\n');
}

function mapPolicyEvidence(policyEvidence: EvaluationPolicyEvidence) {
  return {
    snippet: policyEvidence.snippet,
    document: policyEvidence.document,
    page: policyEvidence.page,
    section: policyEvidence.section
  };
}

function buildAnalystFallback(evaluation: CoverageEvaluation): PayerAnalystBreakdown {
  const summary = `${evaluation.coverageStatus} based on ${evaluation.checklist.length} evaluated criteria for ${evaluation.requestedDrug || evaluation.policyTitle || evaluation.policyId}. ${evaluation.checklist.filter((item) => item.status === 'MISSING').length} criteria remain missing evidence.`;

  return {
    summary,
    criteriaAnalysis: evaluation.checklist.map((item) => ({
      criterion: item.criterion,
      status: item.status,
      policyEvidence: mapPolicyEvidence(item.policyEvidence),
      clinicAction: buildClinicAction(item)
    }))
  };
}

async function buildPatientExplanation(
  evaluation: CoverageEvaluation,
  missingDocsList: MissingDocItem[]
): Promise<string> {
  const prompt = `You are a patient care coordinator. Given this coverage evaluation result, write a friendly 2-3 paragraph explanation for the patient. Coverage status: ${evaluation.coverageStatus}. Drug: ${evaluation.requestedDrug || evaluation.policyTitle || evaluation.policyId}. Payer: ${evaluation.payer || 'Unknown payer'}. Missing items: ${missingDocsList.map((item) => item.criterion).join(', ') || 'none'}. Be empathetic and avoid medical jargon.`;

  try {
    return await callGemini(prompt);
  } catch {
    return buildPatientExplanationFallback(evaluation, missingDocsList);
  }
}

async function buildPayerAnalystBreakdown(
  evaluation: CoverageEvaluation
): Promise<PayerAnalystBreakdown> {
  const prompt = `You are a payer analyst. Given this coverage evaluation, write a concise clinical analyst narrative. For each criterion, note status and what evidence satisfies it. Respond in JSON with keys: summary (string), criteriaAnalysis (array of {criterion, status, policyEvidence: {snippet, document, page, section}, clinicAction}). Evaluation: ${JSON.stringify(evaluation)}`;

  try {
    const raw = await callGemini(prompt);
    const parsed = JSON.parse(raw) as Partial<PayerAnalystBreakdown>;
    if (!parsed.summary || !Array.isArray(parsed.criteriaAnalysis)) {
      throw new Error('Gemini response missing required keys');
    }

    return {
      summary: parsed.summary,
      criteriaAnalysis: parsed.criteriaAnalysis.map((item, index) => {
        const checklistItem = evaluation.checklist[index];
        const criterion = typeof item?.criterion === 'string' ? item.criterion : checklistItem?.criterion || 'Criterion';
        const status = typeof item?.status === 'string' ? item.status : checklistItem?.status || 'UNKNOWN';
        const policyEvidence = item?.policyEvidence && typeof item.policyEvidence === 'object'
          ? {
              snippet: typeof item.policyEvidence.snippet === 'string'
                ? item.policyEvidence.snippet
                : checklistItem?.policyEvidence.snippet || '',
              document: typeof item.policyEvidence.document === 'string'
                ? item.policyEvidence.document
                : checklistItem?.policyEvidence.document || '',
              page: typeof item.policyEvidence.page === 'number' ? item.policyEvidence.page : checklistItem?.policyEvidence.page ?? null,
              section: typeof item.policyEvidence.section === 'string'
                ? item.policyEvidence.section
                : checklistItem?.policyEvidence.section || ''
            }
          : mapPolicyEvidence(checklistItem?.policyEvidence ?? {
              policyId: evaluation.policyId,
              policyVersion: evaluation.policyVersion,
              document: '',
              page: null,
              section: '',
              fieldLabel: '',
              snippet: ''
            });
        const clinicAction = typeof item?.clinicAction === 'string'
          ? item.clinicAction
          : buildClinicAction({ criterion, status: status as EvaluationChecklistItem['status'] });

        return {
          criterion,
          status,
          policyEvidence,
          clinicAction
        };
      })
    };
  } catch {
    try {
      const summary = await callGemini(
        `You are a payer analyst. Write a one-paragraph summary of which criteria apply in this evaluation, what evidence is still needed, and the likely next payer-facing action. Evaluation: ${JSON.stringify(evaluation)}`
      );
      const fallback = buildAnalystFallback(evaluation);
      return { ...fallback, summary };
    } catch {
      return buildAnalystFallback(evaluation);
    }
  }
}

export async function generateNextSteps(evalId: string): Promise<NextStepsPayload> {
  const evaluation = readEvaluation(evalId);
  if (!evaluation) {
    throw new EvaluationNotFoundError(evalId);
  }

  const missingDocsList = buildMissingDocsList(evaluation);
  const [patientExplanation, payerAnalystBreakdown] = await Promise.all([
    buildPatientExplanation(evaluation, missingDocsList),
    buildPayerAnalystBreakdown(evaluation)
  ]);

  return {
    evalId: evaluation.evalId,
    clinicNextSteps: buildClinicNextSteps(evaluation, missingDocsList),
    missingDocsList,
    patientExplanation,
    payerAnalystBreakdown
  };
}
