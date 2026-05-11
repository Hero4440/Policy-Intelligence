import { drugAliases, normalizeDrugName } from '../../../../data/lookup/drug-aliases.ts';

export interface ExtractedEntities {
  drug?: string;
  payer?: string;
  rawDrugs: string[];
  rawPayers: string[];
}

type MatchResult = {
  value: string;
  index: number;
};

const biosimilarSuffixes = [
  'bevacizumab-awwb',
  'bevacizumab-bvzr',
  'bevacizumab-maly',
  'bevacizumab-adcd',
  'bevacizumab-tnjn',
  'rituximab-abbs',
  'rituximab-pvvr',
  'rituximab-arrx'
] as const;

const drugTerms = [
  ...Object.keys(drugAliases),
  ...Object.values(drugAliases).flatMap(drug => [
    ...drug.brandNames,
    ...drug.biosimilars
  ]),
  ...biosimilarSuffixes
].sort((left, right) => right.length - left.length);

const payerMatchers: Array<{ normalized: string; pattern: RegExp }> = [
  { normalized: 'BCBS-NC', pattern: /\b(?:bcbs[-\s]?nc|blue\s+cross\s+blue\s+shield)\b/gi },
  { normalized: 'Cigna', pattern: /\bcigna\b/gi },
  { normalized: 'UHC', pattern: /\b(?:uhc|united\s*health)\b/gi },
  { normalized: 'Aetna', pattern: /\baetna\b/gi }
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectMatches(question: string, pattern: RegExp, normalize: (value: string) => string): MatchResult[] {
  const matches: MatchResult[] = [];

  for (const match of question.matchAll(pattern)) {
    const rawValue = match[0];
    const index = match.index ?? question.indexOf(rawValue);

    matches.push({
      value: normalize(rawValue),
      index
    });
  }

  return matches;
}

function uniqueByFirstMention(matches: MatchResult[]): string[] {
  const seen = new Set<string>();
  const ordered = matches.sort((left, right) => left.index - right.index);

  return ordered.flatMap(match => {
    if (seen.has(match.value)) {
      return [];
    }

    seen.add(match.value);
    return [match.value];
  });
}

export function extractEntities(question: string): ExtractedEntities {
  const drugMatches = drugTerms.flatMap(term =>
    collectMatches(
      question,
      new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi'),
      value => normalizeDrugName(value)
    )
  );

  const payerMatches = payerMatchers.flatMap(({ normalized, pattern }) =>
    collectMatches(question, pattern, () => normalized)
  );

  const rawDrugs = uniqueByFirstMention(drugMatches);
  const rawPayers = uniqueByFirstMention(payerMatches);

  return {
    drug: rawDrugs[0],
    payer: rawPayers[0],
    rawDrugs,
    rawPayers
  };
}
