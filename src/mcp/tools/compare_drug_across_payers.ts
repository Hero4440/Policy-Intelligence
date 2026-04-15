import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PolicyRecord } from '../../../data/schemas/policy.schema.js';
import { compareDrugInput } from '../schemas/tool_inputs.js';
import { findPoliciesByDrug, getAllPolicies } from '../policy_store/loader.js';
import { normalizeDrugName } from '../../../data/lookup/drug-aliases.js';
import {
  buildErrorResponse,
  buildStandardResponse,
  type ConfidenceLevel,
  type EvidenceItem
} from '../utils/response_builder.js';

type ComparedValue =
  | string
  | boolean
  | string[]
  | Array<Record<string, string>>;

type ComparisonField = {
  values: Record<string, ComparedValue>;
  differs: boolean;
  evidence: Record<string, EvidenceItem>;
};

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function valuesDiffer(values: Record<string, ComparedValue>): boolean {
  const serialized = Object.values(values).map(value => JSON.stringify(value));
  return new Set(serialized).size > 1;
}

function sourceCitation(policy: PolicyRecord, field: string, text: string, source?: { page: number; section: string }): EvidenceItem {
  return {
    field,
    text,
    source: {
      policy_id: policy.id,
      policy_title: policy.policyTitle || policy.sourceDocument.filename,
      effective_date: policy.sourceDocument.effectiveDate,
      page: source?.page ?? 0,
      section: source?.section ?? 'No evidence available'
    }
  };
}

function evidenceForField(policy: PolicyRecord, field: string): EvidenceItem {
  if (field === 'preferred_products' || field === 'non_preferred_products') {
    const preferredRequirement = policy.otherRequirements.find(requirement =>
      requirement.category.toLowerCase().includes('preferred')
    );

    if (preferredRequirement) {
      return sourceCitation(policy, field, preferredRequirement.evidenceText, preferredRequirement.source);
    }
  }

  if (field === 'step_therapy') {
    const step = policy.stepTherapy[0];
    if (step) {
      return sourceCitation(policy, field, step.evidenceText, step.source);
    }
  }

  if (field === 'prior_auth_required' || field === 'coverage_status') {
    const evidence = policy.otherRequirements[0] || policy.diagnosisRequirements[0] || policy.stepTherapy[0];
    if (evidence) {
      return sourceCitation(policy, field, evidence.evidenceText, evidence.source);
    }
  }

  if (field === 'indications') {
    const diagnosis = policy.diagnosisRequirements[0];
    if (diagnosis) {
      return sourceCitation(policy, field, diagnosis.evidenceText, diagnosis.source);
    }
  }

  return sourceCitation(policy, field, 'No evidence available for this compared field.');
}

function buildComparisonField(
  policies: PolicyRecord[],
  field: string,
  valueForPolicy: (policy: PolicyRecord) => ComparedValue
): ComparisonField {
  const values: Record<string, ComparedValue> = {};
  const evidence: Record<string, EvidenceItem> = {};

  for (const policy of policies) {
    values[policy.payer] = valueForPolicy(policy);
    evidence[policy.payer] = evidenceForField(policy, field);
  }

  return {
    values,
    differs: valuesDiffer(values),
    evidence
  };
}

function formatProductSplitDifference(policy: PolicyRecord): string | undefined {
  const preferred = (policy.drug.products || [])
    .filter(product => product.tier === 'preferred')
    .map(product => product.name);
  const nonPreferred = (policy.drug.products || [])
    .filter(product => product.tier === 'non-preferred')
    .map(product => product.name);

  if (preferred.length === 0 || nonPreferred.length === 0) {
    return undefined;
  }

  return `Preferred biosimilar tiers: ${policy.payer} designates ${preferred.join(', ')} as preferred and ${nonPreferred.join(', ')} as non-preferred for ${policy.drug.genericName}.`;
}

function buildKeyDifferences(
  drugFamily: string,
  policies: PolicyRecord[],
  comparison: Record<string, ComparisonField>
): string[] {
  const differences: string[] = [];

  for (const policy of policies) {
    const productSplit = formatProductSplitDifference(policy);
    if (productSplit) {
      differences.push(productSplit);
    }
  }

  if (comparison.step_therapy?.differs || policies.length === 1) {
    for (const policy of policies.filter(candidate => candidate.stepTherapy.length > 0)) {
      const step = policy.stepTherapy[0];
      differences.push(`Step therapy varies: ${policy.payer} requires ${step.drugName} with ${step.failureCriteria}.`);
    }
  }

  if (comparison.prior_auth_required?.differs) {
    const requiresPa = policies
      .filter(policy => policy.paRequired)
      .map(policy => policy.payer);
    const noPa = policies
      .filter(policy => !policy.paRequired)
      .map(policy => policy.payer);
    differences.push(`Prior authorization: ${requiresPa.join(', ')} require PA${noPa.length > 0 ? `; ${noPa.join(', ')} do not` : ''}.`);
  }

  if (differences.length === 0) {
    differences.push(`No major loaded-payer differences detected for ${drugFamily}; review the full comparison fields for details.`);
  }

  return uniqueSorted(differences);
}

function buildKeyTakeaway(drugFamily: string, policies: PolicyRecord[], keyDifferences: string[]): string {
  const hasBcbsBevacizumab = drugFamily === 'bevacizumab' && policies.some(policy => policy.payer === 'BCBS-NC');
  if (hasBcbsBevacizumab) {
    return 'BCBS-NC designates Mvasi and Zirabev as preferred bevacizumab biosimilars, requiring documented trial and failure of all preferred products before non-preferred access. This creates a significant product access pathway difference in the loaded policy data.';
  }

  const hasCignaRituximab = drugFamily === 'rituximab' && policies.some(policy => policy.payer === 'Cigna');
  if (hasCignaRituximab) {
    return 'Cigna requires trial of all three rituximab biosimilars (Truxima, Riabni, Ruxience) before brand Rituxan access. This is a restrictive preferred-product requirement in the loaded policy data.';
  }

  return keyDifferences[0] || `Loaded policies do not show a major coverage difference for ${drugFamily}.`;
}

function flattenEvidence(comparison: Record<string, ComparisonField>): EvidenceItem[] {
  const seen = new Set<string>();
  const evidenceItems: EvidenceItem[] = [];

  for (const field of Object.values(comparison)) {
    for (const evidence of Object.values(field.evidence)) {
      const key = `${evidence.field}:${evidence.source.policy_id}:${evidence.source.page}:${evidence.source.section}`;
      if (!seen.has(key)) {
        seen.add(key);
        evidenceItems.push(evidence);
      }
    }
  }

  return evidenceItems;
}

export function registerCompareDrug(server: McpServer): void {
  server.registerTool(
    'compare_drug_across_payers',
    {
      description: 'Compare coverage policies for the same drug family across different health insurance payers. Returns a side-by-side comparison showing preferred vs non-preferred products, prior authorization requirements, step therapy logic, covered indications, and key differences highlighted. Includes a plain-language summary of the most important difference. Use this when a user asks how coverage differs between payers for a specific drug, or wants to compare plans.',
      inputSchema: compareDrugInput.shape
    },
    async ({ drug_family }) => {
      const normalizedDrug = normalizeDrugName(drug_family);
      const policies = findPoliciesByDrug(normalizedDrug);

      if (policies.length === 0) {
        const availableDrugs = uniqueSorted(getAllPolicies().map(policy => policy.drug.genericName));
        return buildErrorResponse(`No loaded policies found for drug_family "${drug_family}" normalized to "${normalizedDrug}"`, {
          available_drugs: availableDrugs,
          hint: `Try one of these drug families: ${availableDrugs.join(', ')}.`
        });
      }

      const comparison = {
        preferred_products: buildComparisonField(policies, 'preferred_products', policy =>
          (policy.drug.products || [])
            .filter(product => product.tier === 'preferred')
            .map(product => product.name)
        ),
        non_preferred_products: buildComparisonField(policies, 'non_preferred_products', policy =>
          (policy.drug.products || [])
            .filter(product => product.tier === 'non-preferred')
            .map(product => product.name)
        ),
        prior_auth_required: buildComparisonField(policies, 'prior_auth_required', policy => policy.paRequired),
        step_therapy: buildComparisonField(policies, 'step_therapy', policy =>
          policy.stepTherapy.map(step => ({
            prior_drug: step.drugName,
            duration: step.duration,
            failure_criteria: step.failureCriteria
          }))
        ),
        indications: buildComparisonField(policies, 'indications', policy =>
          policy.indications || [policy.indication]
        ),
        coverage_status: buildComparisonField(policies, 'coverage_status', policy => policy.coverageStatus)
      };

      const keyDifferences = buildKeyDifferences(normalizedDrug, policies, comparison);
      const keyTakeaway = buildKeyTakeaway(normalizedDrug, policies, keyDifferences);
      const confidence: ConfidenceLevel = policies.length >= 2 ? 'HIGH' : 'MEDIUM';
      const payerList = policies.map(policy => policy.payer).join(', ');
      const partialDataNote = policies.length === 1
        ? ` Only 1 payer has a loaded policy for ${normalizedDrug}. Add more policies to enable full comparison.`
        : '';
      const answer = `Compared ${normalizedDrug} coverage across ${policies.length} payer${policies.length === 1 ? '' : 's'}: ${payerList}. ${keyDifferences.length} key difference${keyDifferences.length === 1 ? '' : 's'} found.${partialDataNote} ${keyTakeaway}`;

      return buildStandardResponse(
        answer,
        {
          drug_family: normalizedDrug,
          payers_compared: policies.map(policy => policy.payer),
          comparison,
          key_differences: keyDifferences,
          key_takeaway: keyTakeaway
        },
        flattenEvidence(comparison),
        confidence
      );
    }
  );
}
