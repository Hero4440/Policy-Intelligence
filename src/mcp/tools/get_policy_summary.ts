import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { policySummaryInput } from '../schemas/tool_inputs.js';
import { findPolicy, getAllPolicies } from '../policy_store/loader.js';
import { normalizeDrugName } from '../../../data/lookup/drug-aliases.js';
import { buildErrorResponse, buildStandardResponse } from '../utils/response_builder.js';
import { calculateConfidence, extractEvidenceArray } from '../utils/evidence_formatter.js';

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function getAvailableOptions() {
  const policies = getAllPolicies();
  return {
    available_payers: uniqueSorted(policies.map(policy => policy.payer)),
    available_drugs: uniqueSorted(policies.map(policy => policy.drug.genericName)),
    hint: 'Use list_policies tool to see all available policies'
  };
}

export function registerGetPolicySummary(server: McpServer): void {
  server.registerTool(
    'get_policy_summary',
    {
      description: "Get a detailed structured summary of a single medical policy including all coverage criteria, prior authorization requirements, step therapy and fail-first logic, preferred vs non-preferred product tiers, covered indications, and evidence citations from source documents. Use this when a user asks about specific requirements for a drug under a particular payer, or wants to understand a policy's full criteria. Identify the policy by its ID, or by providing both payer name and drug name.",
      inputSchema: policySummaryInput.shape
    },
    async ({ policy_id, payer, drug }) => {
      if (!policy_id && !(payer && drug)) {
        return buildErrorResponse('Must provide either policy_id OR both payer and drug params', getAvailableOptions());
      }

      const allPolicies = getAllPolicies();
      const normalizedDrug = drug ? normalizeDrugName(drug) : undefined;
      const policy = policy_id
        ? allPolicies.find(candidate => candidate.id === policy_id)
        : payer && normalizedDrug
          ? findPolicy(payer, normalizedDrug)
          : undefined;

      if (!policy) {
        const lookupDescription = policy_id
          ? `policy_id "${policy_id}"`
          : `payer "${payer}" and drug "${drug}"${normalizedDrug ? ` normalized to "${normalizedDrug}"` : ''}`;

        return buildErrorResponse(`No policy found for ${lookupDescription}`, getAvailableOptions());
      }

      const products = policy.drug.products || [];
      const preferredProducts = products
        .filter(product => product.tier === 'preferred')
        .map(product => product.name);
      const nonPreferredProducts = products
        .filter(product => product.tier === 'non-preferred')
        .map(product => product.name);
      const indications = policy.indications || [policy.indication];

      const structuredResult = {
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
        },
        source_document: {
          filename: policy.sourceDocument.filename,
          url: policy.sourceDocument.url,
          retrieval_date: policy.sourceDocument.retrievalDate,
          effective_date: policy.sourceDocument.effectiveDate
        }
      };

      const firstStep = policy.stepTherapy[0];
      const stepTherapyText = firstStep
        ? ` Step therapy: must try ${firstStep.drugName} first.`
        : '';
      const answer = `${policy.payer} ${policy.drug.genericName} policy (${policy.coverageStatus}). ${policy.paRequired ? 'Prior authorization required.' : 'No prior auth required.'}${stepTherapyText} ${preferredProducts.length} preferred, ${nonPreferredProducts.length} non-preferred products. ${indications.length} covered indications.`;

      return buildStandardResponse(
        answer,
        structuredResult,
        extractEvidenceArray(policy),
        calculateConfidence(policy)
      );
    }
  );
}
