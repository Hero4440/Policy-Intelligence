import { normalizeDrugName } from '../../data/lookup/drug-aliases.js';
import type { PolicyRecord } from '../storage/types.js';
import type {
  CoverageEvaluation,
  EvaluationChecklistItem,
  EvaluationChecklistStatus,
  PatientCase,
  PatientDocumentRecord,
  PatientFactMatch,
  PatientFactRecord
} from '../storage/types.js';
import { getPatientCase } from '../storage/patient-store.js';
import { listPolicyIndex, readPolicyVersion } from '../storage/policy-store.js';

export interface PatientPolicyOption {
  policyId: string;
  payer: string;
  title: string;
  drugFamily: string;
  versions: number[];
  currentVersion: number;
  relevance: 'recommended' | 'possible' | 'other';
  matchReasons: string[];
}

type PolicyEvidenceInput = {
  policyId: string;
  policyVersion: number;
  snippet: string;
  document: string;
  page?: number | null;
  section?: string;
  fieldLabel: string;
};

type CaseEvaluationPayload = Omit<CoverageEvaluation, 'evalId' | 'evaluatedAt'>;

function normalizeText(value: string | undefined | null): string {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function valueLooksRelated(left: string | undefined, right: string | undefined): boolean {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  if (!normalizedLeft || !normalizedRight) {
    return false;
  }
  return normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
}

function collectFactValues(facts: PatientFactRecord[], categories: PatientFactRecord['category'][]): string[] {
  return uniqueStrings(
    facts
      .filter((fact) => categories.includes(fact.category))
      .map((fact) => fact.value)
  );
}

function findDocument(documents: PatientDocumentRecord[], documentId: string | undefined): PatientDocumentRecord | undefined {
  return documents.find((document) => document.documentId === documentId);
}

function toPatientFactMatch(fact: PatientFactRecord): PatientFactMatch {
  return {
    factId: fact.factId,
    label: fact.label,
    value: fact.value,
    sourceDocumentId: fact.sourceDocumentId,
    evidenceSnippet: fact.evidenceSnippet,
    confidence: fact.confidence
  };
}

function buildPolicyEvidence(input: PolicyEvidenceInput): EvaluationChecklistItem['policyEvidence'] {
  return {
    policyId: input.policyId,
    policyVersion: input.policyVersion,
    document: input.document,
    page: input.page ?? null,
    section: input.section ?? 'Normalized policy record',
    fieldLabel: input.fieldLabel,
    snippet: input.snippet
  };
}

function buildChecklistItem(input: {
  criterion: string;
  category: string;
  status: EvaluationChecklistStatus;
  rationale: string;
  policyEvidence: PolicyEvidenceInput;
  matchedFact?: PatientFactRecord;
  documents: PatientDocumentRecord[];
}): EvaluationChecklistItem {
  const document = findDocument(input.documents, input.matchedFact?.sourceDocumentId);
  return {
    criterion: input.criterion,
    category: input.category,
    status: input.status,
    rationale: input.rationale,
    matchedFact: input.matchedFact ? toPatientFactMatch(input.matchedFact) : undefined,
    patientEvidence: input.matchedFact
      ? {
          sourceDocumentId: input.matchedFact.sourceDocumentId,
          sourceDocumentName: document?.fileName,
          snippet: input.matchedFact.evidenceSnippet
        }
      : undefined,
    policyEvidence: buildPolicyEvidence(input.policyEvidence)
  };
}

function pickBestFact(
  facts: PatientFactRecord[],
  categories: PatientFactRecord['category'][],
  searchTerms: string[]
): PatientFactRecord | undefined {
  const normalizedTerms = searchTerms.map((term) => normalizeText(term)).filter(Boolean);
  const candidates = facts.filter((fact) => categories.includes(fact.category));
  return candidates.find((fact) =>
    normalizedTerms.some((term) => {
      const factValue = normalizeText(fact.value);
      const factLabel = normalizeText(fact.label);
      return factValue.includes(term) || term.includes(factValue) || factLabel.includes(term);
    })
  );
}

function caseFacts(caseRecord: PatientCase): PatientFactRecord[] {
  return caseRecord.extractedFacts ?? [];
}

function caseDocuments(caseRecord: PatientCase): PatientDocumentRecord[] {
  return caseRecord.documents ?? [];
}

function buildRequestedDrugChecklist(
  caseRecord: PatientCase,
  policyId: string,
  policyVersion: number,
  policy: PolicyRecord
): EvaluationChecklistItem {
  const facts = caseFacts(caseRecord);
  const documents = caseDocuments(caseRecord);
  const policyDrugNames = uniqueStrings([
    policy.drug.brandName,
    policy.drug.genericName,
    ...(policy.drug.aliases ?? []),
    ...((policy.drug.products ?? []).map((product) => product.name))
  ]);
  const normalizedPolicyDrugNames = uniqueStrings(policyDrugNames.map((name) => normalizeDrugName(name)));
  const requestedDrugFact = pickBestFact(
    facts,
    ['requested_drug', 'medication', 'prior_therapy'],
    [...policyDrugNames, ...normalizedPolicyDrugNames]
  );

  const normalizedCaseDrug = normalizeDrugName(caseRecord.requestedDrug);
  const matchesCaseDrug = normalizedPolicyDrugNames.includes(normalizedCaseDrug);

  if (requestedDrugFact || matchesCaseDrug) {
    return buildChecklistItem({
      criterion: `Requested drug aligns with ${policy.drug.brandName}`,
      category: 'requested_drug',
      status: 'PASS',
      rationale: requestedDrugFact
        ? 'The patient case includes a requested-drug or medication fact that matches the evaluated policy drug family.'
        : 'The requested drug on the case header matches the evaluated policy drug family.',
      matchedFact: requestedDrugFact,
      documents,
      policyEvidence: {
        policyId,
        policyVersion,
        document: policy.sourceDocument.filename,
        fieldLabel: 'Drug family',
        snippet: `${policy.drug.brandName}${policy.drug.genericName ? ` (${policy.drug.genericName})` : ''}`,
        section: 'Drug family'
      }
    });
  }

  return buildChecklistItem({
    criterion: `Requested drug aligns with ${policy.drug.brandName}`,
    category: 'requested_drug',
    status: caseRecord.requestedDrug ? 'NEEDS REVIEW' : 'UNKNOWN',
    rationale: caseRecord.requestedDrug
      ? 'The case requested drug does not clearly match the evaluated policy drug family.'
      : 'The case does not contain a clear requested drug signal.',
    documents,
    policyEvidence: {
      policyId,
      policyVersion,
      document: policy.sourceDocument.filename,
      fieldLabel: 'Drug family',
      snippet: `${policy.drug.brandName}${policy.drug.genericName ? ` (${policy.drug.genericName})` : ''}`,
      section: 'Drug family'
    }
  });
}

function buildIndicationChecklist(
  caseRecord: PatientCase,
  policyId: string,
  policyVersion: number,
  policy: PolicyRecord
): EvaluationChecklistItem {
  const facts = caseFacts(caseRecord);
  const documents = caseDocuments(caseRecord);
  const indications = uniqueStrings([policy.indication, ...(policy.indications ?? [])]);
  const matchedFact = pickBestFact(facts, ['diagnosis'], indications);
  const diagnosisValues = collectFactValues(facts, ['diagnosis']);
  const caseDiagnosis = caseRecord.diagnosis;
  const matchesCaseDiagnosis = indications.some((indication) => valueLooksRelated(indication, caseDiagnosis));

  if (matchedFact || matchesCaseDiagnosis) {
    return buildChecklistItem({
      criterion: `Diagnosis aligns with policy indication: ${policy.indication}`,
      category: 'diagnosis',
      status: 'PASS',
      rationale: 'The patient diagnosis appears consistent with the evaluated policy indication.',
      matchedFact,
      documents,
      policyEvidence: {
        policyId,
        policyVersion,
        document: policy.sourceDocument.filename,
        fieldLabel: 'Covered indication',
        snippet: indications.join(' | '),
        section: 'Indications'
      }
    });
  }

  if (!caseDiagnosis && diagnosisValues.length === 0) {
    return buildChecklistItem({
      criterion: `Diagnosis aligns with policy indication: ${policy.indication}`,
      category: 'diagnosis',
      status: 'UNKNOWN',
      rationale: 'The case does not yet contain diagnosis evidence strong enough to compare with the policy indication.',
      documents,
      policyEvidence: {
        policyId,
        policyVersion,
        document: policy.sourceDocument.filename,
        fieldLabel: 'Covered indication',
        snippet: indications.join(' | '),
        section: 'Indications'
      }
    });
  }

  return buildChecklistItem({
    criterion: `Diagnosis aligns with policy indication: ${policy.indication}`,
    category: 'diagnosis',
    status: 'MISSING',
    rationale: 'The current case diagnosis does not clearly support the evaluated policy indication.',
    documents,
    policyEvidence: {
      policyId,
      policyVersion,
      document: policy.sourceDocument.filename,
      fieldLabel: 'Covered indication',
      snippet: indications.join(' | '),
      section: 'Indications'
    }
  });
}

function buildDiagnosisRequirementChecklist(
  caseRecord: PatientCase,
  policyId: string,
  policyVersion: number,
  policy: PolicyRecord
): EvaluationChecklistItem[] {
  const facts = caseFacts(caseRecord);
  const documents = caseDocuments(caseRecord);
  const diagnosisFacts = facts.filter((fact) => fact.category === 'diagnosis');

  return policy.diagnosisRequirements.map((requirement) => {
    const matchedFact = diagnosisFacts.find((fact) =>
      requirement.icd10Codes.some((code) => normalizeText(fact.label).includes(normalizeText(code.replace('.*', ''))))
      || valueLooksRelated(fact.value, requirement.description)
    );
    const status: EvaluationChecklistStatus = matchedFact
      ? 'PASS'
      : diagnosisFacts.length > 0
        ? 'MISSING'
        : 'UNKNOWN';

    return buildChecklistItem({
      criterion: requirement.description,
      category: 'diagnosis_requirement',
      status,
      rationale: matchedFact
        ? 'A diagnosis fact on the case aligns with this policy diagnosis requirement.'
        : diagnosisFacts.length > 0
          ? 'Diagnosis evidence exists on the case but does not clearly satisfy this policy diagnosis requirement.'
          : 'No diagnosis fact is available to verify this policy diagnosis requirement yet.',
      matchedFact,
      documents,
      policyEvidence: {
        policyId,
        policyVersion,
        document: requirement.source.document,
        page: requirement.source.page,
        section: requirement.source.section,
        fieldLabel: 'Diagnosis requirement',
        snippet: requirement.evidenceText
      }
    });
  });
}

function buildStepTherapyChecklist(
  caseRecord: PatientCase,
  policyId: string,
  policyVersion: number,
  policy: PolicyRecord
): EvaluationChecklistItem[] {
  const facts = caseFacts(caseRecord);
  const documents = caseDocuments(caseRecord);
  const therapyFacts = facts.filter((fact) => fact.category === 'prior_therapy' || fact.category === 'medication');

  return policy.stepTherapy.map((requirement) => {
    const matchedFact = therapyFacts.find((fact) => {
      const normalizedFactValue = normalizeDrugName(fact.value);
      const normalizedFactLabel = normalizeDrugName(fact.label);
      const normalizedRequired = normalizeDrugName(requirement.drugName);
      return normalizedFactValue.includes(normalizedRequired)
        || normalizedRequired.includes(normalizedFactValue)
        || normalizedFactLabel.includes(normalizedRequired);
    });
    const status: EvaluationChecklistStatus = matchedFact
      ? 'PASS'
      : therapyFacts.length > 0
        ? 'MISSING'
        : 'UNKNOWN';

    return buildChecklistItem({
      criterion: `Prior therapy: ${requirement.drugName}`,
      category: 'step_therapy',
      status,
      rationale: matchedFact
        ? 'The case contains prior-therapy or medication evidence that matches this policy step-therapy requirement.'
        : therapyFacts.length > 0
          ? 'The case contains medication history, but not the specific prior therapy required by the policy.'
          : 'The case does not yet contain prior-therapy evidence needed to verify this requirement.',
      matchedFact,
      documents,
      policyEvidence: {
        policyId,
        policyVersion,
        document: requirement.source.document,
        page: requirement.source.page,
        section: requirement.source.section,
        fieldLabel: 'Step therapy',
        snippet: requirement.evidenceText
      }
    });
  });
}

function buildOtherRequirementChecklist(
  caseRecord: PatientCase,
  policyId: string,
  policyVersion: number,
  policy: PolicyRecord
): EvaluationChecklistItem[] {
  const facts = caseFacts(caseRecord);
  const documents = caseDocuments(caseRecord);

  return policy.otherRequirements.map((requirement) => {
    const normalizedCategory = normalizeText(requirement.category);
    const normalizedRequirement = normalizeText(requirement.requirement);
    const relevantCategories: PatientFactRecord['category'][] = normalizedCategory.includes('prescriber')
      ? ['prescriber']
      : normalizedCategory.includes('payer') || normalizedCategory.includes('insurance')
        ? ['payer', 'coverage', 'insurance']
        : ['clinical_note', 'diagnosis', 'prior_therapy', 'medication', 'prescriber'];
    const matchedFact = facts.find((fact) =>
      relevantCategories.includes(fact.category)
      && (valueLooksRelated(fact.value, requirement.requirement) || valueLooksRelated(fact.label, requirement.category))
    );
    const status: EvaluationChecklistStatus = matchedFact
      ? 'PASS'
      : requirement.ambiguous
        ? 'NEEDS REVIEW'
        : relevantCategories.some((category) => facts.some((fact) => fact.category === category))
          ? 'NEEDS REVIEW'
          : 'UNKNOWN';

    return buildChecklistItem({
      criterion: requirement.requirement,
      category: requirement.category,
      status,
      rationale: matchedFact
        ? 'The case contains a fact that appears relevant to this policy requirement.'
        : normalizedRequirement
          ? 'This policy requirement needs human review because deterministic evidence is incomplete or indirect.'
          : 'This policy requirement could not be verified deterministically from the available case facts.',
      matchedFact,
      documents,
      policyEvidence: {
        policyId,
        policyVersion,
        document: requirement.source.document,
        page: requirement.source.page,
        section: requirement.source.section,
        fieldLabel: requirement.category,
        snippet: requirement.evidenceText
      }
    });
  });
}

function buildCoveragePostureChecklist(
  caseRecord: PatientCase,
  policyId: string,
  policyVersion: number,
  policy: PolicyRecord
): EvaluationChecklistItem {
  const documents = caseDocuments(caseRecord);
  const preferredProducts = (policy.drug.products ?? [])
    .filter((product) => product.tier === 'preferred')
    .map((product) => product.name);
  const requestedDrugFact = pickBestFact(caseFacts(caseRecord), ['requested_drug', 'medication'], [
    caseRecord.requestedDrug,
    policy.drug.brandName,
    policy.drug.genericName
  ]);
  const normalizedRequestedDrug = normalizeDrugName(caseRecord.requestedDrug);
  const preferredMatch = preferredProducts.some((product) => normalizeDrugName(product) === normalizedRequestedDrug);
  let status: EvaluationChecklistStatus = 'PASS';
  let rationale = 'The policy coverage posture is favorable for this case.';
  let snippet = `Coverage status: ${policy.coverageStatus}`;

  if (policy.coverageStatus === 'excluded') {
    status = preferredProducts.length > 0 && !preferredMatch ? 'MISSING' : 'NEEDS REVIEW';
    rationale = preferredProducts.length > 0 && !preferredMatch
      ? `The evaluated policy excludes the requested drug and lists preferred alternatives: ${preferredProducts.join(', ')}.`
      : 'The evaluated policy marks this coverage posture as excluded.';
    snippet = preferredProducts.length > 0
      ? `Coverage status is excluded. Preferred products: ${preferredProducts.join(', ')}.`
      : 'Coverage status is excluded in the normalized policy.';
  } else if (policy.coverageStatus === 'covered-with-pa' || policy.paRequired) {
    status = 'NEEDS REVIEW';
    rationale = 'The policy indicates prior authorization or conditional review before approval.';
    snippet = policy.paRequired
      ? 'Normalized policy indicates prior authorization is required.'
      : 'Coverage status is covered-with-pa in the normalized policy.';
  }

  return buildChecklistItem({
    criterion: 'Coverage posture',
    category: 'coverage',
    status,
    rationale,
    matchedFact: requestedDrugFact,
    documents,
    policyEvidence: {
      policyId,
      policyVersion,
      document: policy.sourceDocument.filename,
      fieldLabel: 'Coverage status',
      snippet,
      section: 'Coverage'
    }
  });
}

export function summarizeCoverageStatus(
  checklist: EvaluationChecklistItem[],
  policy: PolicyRecord,
  caseRecord: PatientCase
): CoverageEvaluation['coverageStatus'] {
  const hasMissing = checklist.some((item) => item.status === 'MISSING');
  const hasUnknown = checklist.some((item) => item.status === 'UNKNOWN');
  const hasNeedsReview = checklist.some((item) => item.status === 'NEEDS REVIEW');
  const preferredProducts = (policy.drug.products ?? [])
    .filter((product) => product.tier === 'preferred')
    .map((product) => normalizeDrugName(product.name));
  const normalizedRequestedDrug = normalizeDrugName(caseRecord.requestedDrug);
  const requestedDrugPreferred = preferredProducts.length === 0 || preferredProducts.includes(normalizedRequestedDrug);
  const indicationMismatch = checklist.some(
    (item) => item.category === 'diagnosis' && item.status === 'MISSING'
  );

  if (policy.coverageStatus === 'excluded') {
    if (preferredProducts.length > 0 && !requestedDrugPreferred) {
      return 'Preferred Alternative Required';
    }
    return 'Not Covered';
  }

  if (indicationMismatch) {
    return 'Not Covered';
  }

  if (hasMissing) {
    return 'Likely Eligible but Docs Missing';
  }

  if (policy.coverageStatus === 'covered-with-pa' || policy.paRequired) {
    return 'PA Required';
  }

  if (hasUnknown && !hasNeedsReview) {
    return 'Unclear';
  }

  if (hasNeedsReview || hasUnknown) {
    return 'Unclear';
  }

  return 'Covered';
}

export function getPatientPolicyOptions(caseId: string): PatientPolicyOption[] {
  const caseRecord = getPatientCase(caseId);
  if (!caseRecord) {
    throw new Error(`Case not found: ${caseId}`);
  }

  const normalizedCaseDrug = normalizeDrugName(caseRecord.requestedDrug);
  const normalizedCasePayer = normalizeText(caseRecord.payer);
  const normalizedCaseDiagnosis = normalizeText(caseRecord.diagnosis);

  return listPolicyIndex()
    .map((entry) => {
      const reasons: string[] = [];
      const normalizedPayer = normalizeText(entry.payer);
      const normalizedDrugFamily = normalizeText(entry.drugFamily);

      if (normalizedPayer === normalizedCasePayer || valueLooksRelated(entry.payer, caseRecord.payer)) {
        reasons.push('Payer matches case');
      }
      if (
        normalizeDrugName(entry.drugFamily) === normalizedCaseDrug
        || normalizedDrugFamily.includes(normalizeText(caseRecord.requestedDrug))
        || valueLooksRelated(entry.drugFamily, caseRecord.requestedDrug)
      ) {
        reasons.push('Drug family matches requested drug');
      }
      if (valueLooksRelated(entry.title, normalizedCaseDiagnosis) || valueLooksRelated(entry.drugFamily, caseRecord.requestedDrug)) {
        reasons.push('Policy appears clinically related to the case');
      }

      const relevance: PatientPolicyOption['relevance'] = reasons.includes('Payer matches case')
        && reasons.includes('Drug family matches requested drug')
        ? 'recommended'
        : reasons.length > 0
          ? 'possible'
          : 'other';

      return {
        policyId: entry.policyId,
        payer: entry.payer,
        title: entry.title,
        drugFamily: entry.drugFamily,
        versions: entry.versions,
        currentVersion: entry.currentVersion,
        relevance,
        matchReasons: reasons.length > 0 ? reasons : ['Available policy']
      };
    })
    .sort((left, right) => {
      const weight = { recommended: 0, possible: 1, other: 2 } as const;
      return weight[left.relevance] - weight[right.relevance] || left.policyId.localeCompare(right.policyId);
    });
}

export function evaluatePatientCaseAgainstPolicy(input: {
  caseId: string;
  policyId: string;
  policyVersion: number;
}): CaseEvaluationPayload {
  const caseRecord = getPatientCase(input.caseId);
  if (!caseRecord) {
    throw new Error(`Case not found: ${input.caseId}`);
  }

  const policyVersion = readPolicyVersion(input.policyId, input.policyVersion);
  if (!policyVersion) {
    throw new Error(`Policy version not found: ${input.policyId} v${input.policyVersion}`);
  }

  const policy = policyVersion.record;
  const checklist: EvaluationChecklistItem[] = [
    buildRequestedDrugChecklist(caseRecord, input.policyId, input.policyVersion, policy),
    buildIndicationChecklist(caseRecord, input.policyId, input.policyVersion, policy),
    buildCoveragePostureChecklist(caseRecord, input.policyId, input.policyVersion, policy),
    ...buildDiagnosisRequirementChecklist(caseRecord, input.policyId, input.policyVersion, policy),
    ...buildStepTherapyChecklist(caseRecord, input.policyId, input.policyVersion, policy),
    ...buildOtherRequirementChecklist(caseRecord, input.policyId, input.policyVersion, policy)
  ];

  const coverageStatus = summarizeCoverageStatus(checklist, policy, caseRecord);

  return {
    caseId: caseRecord.caseId,
    policyId: input.policyId,
    policyVersion: input.policyVersion,
    policyTitle: policy.policyTitle ?? policy.indication,
    payer: policy.payer,
    drugFamily: policy.drug.brandName,
    patientName: caseRecord.patientName,
    requestedDrug: caseRecord.requestedDrug,
    diagnosis: caseRecord.diagnosis,
    coverageStatus,
    checklist
  };
}
