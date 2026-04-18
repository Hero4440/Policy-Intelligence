import { getAllPolicies } from '../../policy_store/loader.js';
import type { ExtractedEntities } from './entity_extractor.js';

export interface RouteResult {
  route: 'deterministic' | 'llm' | 'insufficient_evidence' | 'out_of_scope';
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  reason?: string;
}

function normalizePayer(value: string): string {
  return value.toLowerCase().replace(/[\s-]+/g, '');
}

function buildLoadedScope(): string {
  const scope = getAllPolicies().map(policy => `${policy.payer} (${policy.drug.genericName})`);
  return [...new Set(scope)].join(', ');
}

function matchesLoadedPolicies(entities: ExtractedEntities): boolean {
  const normalizedDrug = entities.drug?.toLowerCase();
  const normalizedPayer = entities.payer ? normalizePayer(entities.payer) : undefined;

  return getAllPolicies().some(policy => {
    const drugMatches = normalizedDrug
      ? policy.drug.genericName.toLowerCase() === normalizedDrug
      : true;
    const payerMatches = normalizedPayer
      ? normalizePayer(policy.payer) === normalizedPayer
      : true;

    return drugMatches && payerMatches;
  });
}

export function routeQuery(question: string, entities: ExtractedEntities): RouteResult {
  if (/what policies (are|were) loaded|list.*policies|show.*policies/i.test(question)) {
    return {
      route: 'deterministic',
      toolName: 'list_policies',
      toolArgs: {
        payer: entities.payer,
        drug_family: entities.drug
      }
    };
  }

  if (
    /compare .+ across (payers|plans|insurers)|difference.*between .+ and/i.test(question)
    && entities.drug
  ) {
    return {
      route: 'deterministic',
      toolName: 'compare_drug_across_payers',
      toolArgs: {
        drug_family: entities.drug
      }
    };
  }

  if (
    /summarize|summary of|what (does|are) .+ (require|cover)|tell me about .+ policy/i.test(question)
    && entities.payer
    && entities.drug
  ) {
    return {
      route: 'deterministic',
      toolName: 'get_policy_summary',
      toolArgs: {
        payer: entities.payer,
        drug: entities.drug
      }
    };
  }

  if (!entities.drug && !entities.payer) {
    return {
      route: 'out_of_scope',
      reason: 'No policy-related entities detected in question'
    };
  }

  if (!matchesLoadedPolicies(entities)) {
    return {
      route: 'insufficient_evidence',
      reason: `Detected entities do not match loaded policy scope. Loaded policies: ${buildLoadedScope()}`
    };
  }

  return {
    route: 'llm',
    reason: 'Entities matched loaded policies, but the question requires synthesized reasoning'
  };
}
