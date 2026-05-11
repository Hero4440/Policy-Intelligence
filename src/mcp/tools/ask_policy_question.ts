import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { askPolicyQuestionInput } from '../schemas/tool_inputs.js';
import { findPoliciesByDrug, findPolicy, getAllPolicies } from '../policy_store/loader.js';
import { buildErrorResponse, buildStandardResponse, type EvidenceItem } from '../utils/response_builder.js';
import { calculateConfidence, extractEvidenceArray } from '../utils/evidence_formatter.js';
import { extractEntities } from './utils/entity_extractor.js';
import { routeQuery } from './utils/query_router.js';
import { answerWithGrounding } from './utils/llm_client.js';
import { extractAndValidateClaims } from './utils/claim_validator.js';
import { extractQuestionKeywords, retrieveEvidence } from './utils/evidence_retriever.js';

type DeterministicStructuredResult = Record<string, unknown>;

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function buildDetectedEntities(entities: ReturnType<typeof extractEntities>) {
  return {
    drug: entities.drug ?? null,
    payer: entities.payer ?? null,
    raw_drugs: entities.rawDrugs,
    raw_payers: entities.rawPayers
  };
}

function getLoadedScope() {
  return getAllPolicies().map(policy => ({
    policy_id: policy.id,
    payer: policy.payer,
    drug_family: policy.drug.genericName
  }));
}

function buildLoadedScopeText(): string {
  return getLoadedScope()
    .map(policy => `${policy.payer} (${policy.drug_family})`)
    .join(', ');
}

function listPoliciesResult(entities: ReturnType<typeof extractEntities>): {
  answer: string;
  structuredResult: DeterministicStructuredResult;
  evidence: EvidenceItem[];
} {
  let filteredPolicies = getAllPolicies();
  const filterDescriptions: string[] = [];

  if (entities.payer) {
    const payerFilter = entities.payer.toLowerCase();
    filteredPolicies = filteredPolicies.filter(policy =>
      policy.payer.toLowerCase().includes(payerFilter)
    );
    filterDescriptions.push(`payer matching "${entities.payer}"`);
  }

  if (entities.drug) {
    filteredPolicies = filteredPolicies.filter(policy =>
      policy.drug.genericName.toLowerCase() === entities.drug?.toLowerCase()
    );
    filterDescriptions.push(`drug family "${entities.drug}"`);
  }

  const policies = filteredPolicies.map(policy => ({
    policy_id: policy.id,
    payer: policy.payer,
    policy_title: policy.policyTitle || policy.sourceDocument.filename,
    effective_date: policy.sourceDocument.effectiveDate,
    drug_family: policy.drug.genericName,
    drug_brand: policy.drug.brandName,
    indications: policy.indications || [policy.indication]
  }));

  const payers = uniqueSorted(filteredPolicies.map(policy => policy.payer));
  const drugs = uniqueSorted(filteredPolicies.map(policy => policy.drug.genericName));
  const filterText = filterDescriptions.length > 0
    ? ` matching ${filterDescriptions.join(' and ')}`
    : '';
  const answer = `Found ${policies.length} ${policies.length === 1 ? 'policy' : 'policies'}${filterText}. Payers: ${payers.join(', ')}. Drug families: ${drugs.join(', ')}.`;

  return {
    answer,
    structuredResult: {
      route: 'deterministic',
      routed_tool: 'list_policies',
      detected_entities: buildDetectedEntities(entities),
      total_count: policies.length,
      policies
    },
    evidence: []
  };
}

function getPolicySummaryResult(entities: ReturnType<typeof extractEntities>): {
  answer: string;
  structuredResult: DeterministicStructuredResult;
  evidence: EvidenceItem[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
} | undefined {
  if (!entities.payer || !entities.drug) {
    return undefined;
  }

  const policy = findPolicy(entities.payer, entities.drug);
  if (!policy) {
    return undefined;
  }

  const products = policy.drug.products || [];
  const preferredProducts = products
    .filter(product => product.tier === 'preferred')
    .map(product => product.name);
  const nonPreferredProducts = products
    .filter(product => product.tier === 'non-preferred')
    .map(product => product.name);
  const indications = policy.indications || [policy.indication];
  const firstStep = policy.stepTherapy[0];
  const stepTherapyText = firstStep
    ? ` Step therapy: must try ${firstStep.drugName} first.`
    : '';

  return {
    answer: `${policy.payer} ${policy.drug.genericName} policy (${policy.coverageStatus}). ${policy.paRequired ? 'Prior authorization required.' : 'No prior auth required.'}${stepTherapyText} ${preferredProducts.length} preferred, ${nonPreferredProducts.length} non-preferred products. ${indications.length} covered indications.`,
    structuredResult: {
      route: 'deterministic',
      routed_tool: 'get_policy_summary',
      detected_entities: buildDetectedEntities(entities),
      policy_id: policy.id,
      payer: policy.payer,
      plan: policy.plan,
      policy_title: policy.policyTitle || policy.sourceDocument.filename,
      effective_date: policy.sourceDocument.effectiveDate,
      drug: {
        generic_name: policy.drug.genericName,
        brand_name: policy.drug.brandName,
        products: products.map(product => ({
          name: product.name,
          tier: product.tier,
          aliases: product.aliases
        })),
        preferred_products: preferredProducts,
        non_preferred_products: nonPreferredProducts
      },
      coverage: {
        status: policy.coverageStatus,
        prior_auth_required: policy.paRequired,
        indications
      },
      requirements: {
        diagnosis: policy.diagnosisRequirements.map(requirement => ({
          icd10_codes: requirement.icd10Codes,
          description: requirement.description,
          evidence_ref: 'diagnosis_requirements'
        })),
        step_therapy: policy.stepTherapy.map(requirement => ({
          prior_drug: requirement.drugName,
          dosage: requirement.dosage,
          duration: requirement.duration,
          failure_criteria: requirement.failureCriteria,
          evidence_ref: 'step_therapy'
        })),
        other: policy.otherRequirements.map(requirement => ({
          category: requirement.category,
          requirement: requirement.requirement,
          ambiguous: requirement.ambiguous,
          evidence_ref: requirement.category
        }))
      }
    },
    evidence: extractEvidenceArray(policy),
    confidence: calculateConfidence(policy)
  };
}

function compareDrugResult(entities: ReturnType<typeof extractEntities>): {
  answer: string;
  structuredResult: DeterministicStructuredResult;
  evidence: EvidenceItem[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
} | undefined {
  if (!entities.drug) {
    return undefined;
  }

  const policies = findPoliciesByDrug(entities.drug);
  if (policies.length === 0) {
    return undefined;
  }

  const comparison = policies.map(policy => ({
    payer: policy.payer,
    preferred_products: (policy.drug.products || [])
      .filter(product => product.tier === 'preferred')
      .map(product => product.name),
    non_preferred_products: (policy.drug.products || [])
      .filter(product => product.tier === 'non-preferred')
      .map(product => product.name),
    prior_auth_required: policy.paRequired,
    step_therapy: policy.stepTherapy.map(step => ({
      prior_drug: step.drugName,
      duration: step.duration,
      failure_criteria: step.failureCriteria
    })),
    indications: policy.indications || [policy.indication],
    coverage_status: policy.coverageStatus
  }));

  const keyDifferences = comparison.flatMap(entry => {
    const differences: string[] = [];

    if (entry.preferred_products.length > 0 || entry.non_preferred_products.length > 0) {
      differences.push(
        `${entry.payer}: preferred ${entry.preferred_products.join(', ') || 'none'}; non-preferred ${entry.non_preferred_products.join(', ') || 'none'}.`
      );
    }

    if (entry.step_therapy.length > 0) {
      const firstStep = entry.step_therapy[0];
      differences.push(
        `${entry.payer}: step therapy requires ${firstStep?.prior_drug} with ${firstStep?.failure_criteria}.`
      );
    }

    return differences;
  });

  const evidence = policies.flatMap(policy => extractEvidenceArray(policy));
  const payerList = policies.map(policy => policy.payer).join(', ');
  const answer = `Compared ${entities.drug} coverage across ${policies.length} payer${policies.length === 1 ? '' : 's'}: ${payerList}. ${keyDifferences.length} key difference${keyDifferences.length === 1 ? '' : 's'} found.`;

  return {
    answer,
    structuredResult: {
      route: 'deterministic',
      routed_tool: 'compare_drug_across_payers',
      detected_entities: buildDetectedEntities(entities),
      drug_family: entities.drug,
      payers_compared: policies.map(policy => policy.payer),
      comparison,
      key_differences: keyDifferences,
      key_takeaway: keyDifferences[0] || `Loaded policies do not show a major difference for ${entities.drug}.`
    },
    evidence,
    confidence: policies.length >= 2 ? 'HIGH' : 'MEDIUM'
  };
}

function mapEvidenceToClaims(evidence: EvidenceItem[], validClaims: Array<{ claim_id: string; evidence_refs: string[] }>) {
  return evidence.map((item, index) => {
    const ref = `E${index}`;
    const claimIds = validClaims
      .filter(claim => claim.evidence_refs.includes(ref))
      .map(claim => claim.claim_id);

    return claimIds.length > 0
      ? { ...item, claim_ids: claimIds }
      : item;
  });
}

function buildInsufficientEvidenceResponse(
  entities: ReturnType<typeof extractEntities>,
  reason: string,
  policiesSearched: string[] = []
) {
  const loadedPolicies = getLoadedScope();

  return buildStandardResponse(
    `Insufficient evidence to answer this question. ${reason}. Loaded policies: ${buildLoadedScopeText()}`,
    {
      route: 'insufficient_evidence',
      detected_entities: buildDetectedEntities(entities),
      loaded_policies: loadedPolicies,
      policies_searched: policiesSearched
    },
    [],
    'LOW'
  );
}

export function registerAskPolicyQuestion(server: McpServer): void {
  server.registerTool(
    'ask_policy_question',
    {
      description: 'Answer natural language questions about loaded medical insurance policies. Uses hybrid deterministic routing first, then LLM grounding for complex questions. Returns answer, structured evidence, confidence, and route metadata.',
      inputSchema: askPolicyQuestionInput.shape
    },
    async ({ question }) => {
      try {
        const entities = extractEntities(question);
        const route = routeQuery(question, entities);

        if (route.route === 'out_of_scope') {
          return buildStandardResponse(
            'This question is outside the scope of loaded insurance policies. I can answer questions about coverage criteria, prior authorization, step therapy, and drug policy comparisons.',
            {
              route: 'out_of_scope',
              detected_entities: buildDetectedEntities(entities)
            },
            [],
            'LOW'
          );
        }

        if (route.route === 'insufficient_evidence') {
          return buildInsufficientEvidenceResponse(
            entities,
            route.reason || 'The detected entities are not covered by loaded policies'
          );
        }

        if (route.route === 'deterministic') {
          if (route.toolName === 'list_policies') {
            const result = listPoliciesResult(entities);
            return buildStandardResponse(result.answer, result.structuredResult, result.evidence, 'HIGH');
          }

          if (route.toolName === 'get_policy_summary') {
            const result = getPolicySummaryResult(entities);
            if (result) {
              return buildStandardResponse(result.answer, result.structuredResult, result.evidence, 'HIGH');
            }
          }

          if (route.toolName === 'compare_drug_across_payers') {
            const result = compareDrugResult(entities);
            if (result) {
              return buildStandardResponse(result.answer, result.structuredResult, result.evidence, result.confidence);
            }
          }

          return buildInsufficientEvidenceResponse(
            entities,
            'The deterministic route did not find a matching loaded policy result'
          );
        }

        const keywords = extractQuestionKeywords(question);
        const evidence = retrieveEvidence(entities, keywords);

        if (evidence.items.length === 0) {
          return buildInsufficientEvidenceResponse(
            entities,
            'No grounded evidence snippets matched the detected entities and question keywords',
            evidence.policies_searched
          );
        }

        try {
          const llmResponse = await answerWithGrounding(question, evidence.items, entities);
          const { validClaims, filteredCount, cleanedAnswer } = extractAndValidateClaims(
            llmResponse,
            evidence.items.length
          );

          if (validClaims.length === 0 && cleanedAnswer.length === 0) {
            return buildInsufficientEvidenceResponse(
              entities,
              'The LLM response did not contain any grounded claims',
              evidence.policies_searched
            );
          }

          const linkedEvidence = mapEvidenceToClaims(evidence.items, validClaims);
          const confidence = filteredCount > 0 ? 'LOW' : 'MEDIUM';

          return buildStandardResponse(
            cleanedAnswer,
            {
              route: 'llm',
              detected_entities: buildDetectedEntities(entities),
              grounded_claims: validClaims,
              filtered_claims: filteredCount,
              policies_searched: evidence.policies_searched,
              note: filteredCount > 0
                ? `${filteredCount} claim${filteredCount === 1 ? '' : 's'} removed due to invalid evidence references.`
                : undefined
            },
            linkedEvidence,
            confidence
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown LLM error';
          return buildErrorResponse(message, {
            hint: 'Check that GEMINI_KEY_API environment variable is set.',
            available_payers: uniqueSorted(getAllPolicies().map(policy => policy.payer)),
            available_drugs: uniqueSorted(getAllPolicies().map(policy => policy.drug.genericName))
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown ask_policy_question failure';
        return buildErrorResponse(message, {
          hint: 'Review the loaded policies and ask a question about coverage criteria, policy summaries, or payer comparisons.'
        });
      }
    }
  );
}
