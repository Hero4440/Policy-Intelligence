import { drugAliases } from '../../../../data/lookup/drug-aliases.ts';
import { getAllPolicies } from '../../policy_store/loader.js';
import { extractEvidenceArray } from '../../utils/evidence_formatter.js';
import type { EvidenceItem } from '../../utils/response_builder.js';
import type { ExtractedEntities } from './entity_extractor.js';

export interface FilteredEvidence {
  items: EvidenceItem[];
  policies_searched: string[];
  match_count: number;
}

const stopWords = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'does',
  'do',
  'what',
  'which',
  'how',
  'for',
  'in',
  'of',
  'to',
  'and',
  'or',
  'with',
  'by',
  'from',
  'about'
]);

const entityWords = new Set(
  [
    'bcbs',
    'bcbsnc',
    'bluecrossblueshield',
    'cigna',
    'uhc',
    'unitedhealth',
    'aetna',
    ...Object.keys(drugAliases),
    ...Object.values(drugAliases).flatMap(drug => [
      ...drug.brandNames,
      ...drug.biosimilars
    ]),
    'bevacizumab-awwb',
    'bevacizumab-bvzr',
    'bevacizumab-maly',
    'bevacizumab-adcd',
    'bevacizumab-tnjn',
    'rituximab-abbs',
    'rituximab-pvvr',
    'rituximab-arrx'
  ].map(value => value.toLowerCase().replace(/[\s-]+/g, ''))
);

function normalizePayer(value: string): string {
  return value.toLowerCase().replace(/[\s-]+/g, '');
}

function dedupeEvidence(items: EvidenceItem[]): EvidenceItem[] {
  const seen = new Set<string>();

  return items.filter(item => {
    const key = `${item.field}:${item.source.policy_id}:${item.source.page}:${item.source.section}:${item.text}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function extractQuestionKeywords(question: string): string[] {
  const rawTokens = question.toLowerCase().match(/[a-z0-9-]{2,}/g) ?? [];
  const seen = new Set<string>();

  return rawTokens.flatMap(token => {
    const normalized = token.replace(/[\s-]+/g, '');
    if (stopWords.has(token) || entityWords.has(normalized) || seen.has(token)) {
      return [];
    }

    seen.add(token);
    return [token];
  });
}

export function retrieveEvidence(
  entities: ExtractedEntities,
  questionKeywords?: string[]
): FilteredEvidence {
  if (!entities.drug && !entities.payer) {
    return {
      items: [],
      policies_searched: [],
      match_count: 0
    };
  }

  const matchingPolicies = getAllPolicies().filter(policy => {
    const drugMatches = entities.drug
      ? policy.drug.genericName.toLowerCase() === entities.drug.toLowerCase()
      : true;
    const payerMatches = entities.payer
      ? normalizePayer(policy.payer) === normalizePayer(entities.payer)
      : true;

    return drugMatches && payerMatches;
  });

  const evidenceItems = dedupeEvidence(
    matchingPolicies.flatMap(policy => extractEvidenceArray(policy))
  );

  const filteredItems = questionKeywords && questionKeywords.length > 0
    ? evidenceItems.filter(item =>
      questionKeywords.some(keyword => item.text.toLowerCase().includes(keyword))
    )
    : evidenceItems;

  return {
    items: filteredItems,
    policies_searched: matchingPolicies.map(policy => policy.id),
    match_count: filteredItems.length
  };
}
