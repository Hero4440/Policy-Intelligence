import { normalizeDrugName } from '../../data/lookup/drug-aliases.ts';

export type NormalizedRuleFacet =
  | 'prior_authorization'
  | 'step_therapy'
  | 'quantity_limit'
  | 'specialty_pharmacy'
  | 'age_limit'
  | 'medical_necessity'
  | 'exclusion'
  | 'site_of_care'
  | 'prescriber_specialist';

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function canonicalDrugKey(value: string): string {
  return normalizeDrugName(compactWhitespace(value))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function canonicalIssuerKey(value: string): string {
  return compactWhitespace(value)
    .toLowerCase()
    .replace(/unitedhealthcare|united health ?care/g, 'uhc')
    .replace(/ambetter from arizona complete health/g, 'ambetter')
    .replace(/blue cross blue shield of arizona|bcbs az|bcbsaz|az blue/g, 'az_blue')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function preferredIssuerLabel(value: string): string {
  const key = canonicalIssuerKey(value);
  switch (key) {
    case 'uhc':
      return 'UHC';
    case 'az_blue':
      return 'AZ Blue';
    case 'ambetter':
      return 'Ambetter';
    default:
      return compactWhitespace(value);
  }
}

export function canonicalPlanKey(issuerName: string, planName: string): string {
  return `${canonicalIssuerKey(issuerName)}__${compactWhitespace(planName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')}`;
}

export function inferRuleFacets(input: {
  requirementsText?: string;
  ruleText?: string;
  priorAuth?: boolean;
  stepTherapy?: boolean;
  quantityLimit?: string;
  ageLimit?: string;
  specialtyFlag?: boolean;
  nonFormulary?: boolean;
}): NormalizedRuleFacet[] {
  const text = compactWhitespace(`${input.requirementsText ?? ''} ${input.ruleText ?? ''}`).toLowerCase();
  const facets = new Set<NormalizedRuleFacet>();

  if (input.priorAuth || /\bprior authorization\b|\bprior auth\b|\bpa\b/.test(text)) {
    facets.add('prior_authorization');
  }
  if (input.stepTherapy || /\bstep therapy\b|\bst\b/.test(text)) {
    facets.add('step_therapy');
  }
  if ((input.quantityLimit ?? '').trim() || /\bquantity limit\b|\bql\b/.test(text)) {
    facets.add('quantity_limit');
  }
  if ((input.ageLimit ?? '').trim() || /\bage limit\b/.test(text)) {
    facets.add('age_limit');
  }
  if (input.specialtyFlag || /\bspecialty\b/.test(text)) {
    facets.add('specialty_pharmacy');
  }
  if (input.nonFormulary || /\bexcluded\b|\bnot covered\b|\bexception needed\b/.test(text)) {
    facets.add('exclusion');
  }
  if (/\bmedical necessity\b|\bmedically necessary\b/.test(text)) {
    facets.add('medical_necessity');
  }
  if (/\bsite of care\b|\bhome infusion\b|\boutpatient hospital\b/.test(text)) {
    facets.add('site_of_care');
  }
  if (/\brheumatologist\b|\boncologist\b|\bdermatologist\b|\bspecialist\b/.test(text)) {
    facets.add('prescriber_specialist');
  }

  return [...facets];
}
