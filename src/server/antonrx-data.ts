import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { normalizeDrugName } from '../../data/lookup/drug-aliases.js';
import type { PolicyRecord as StructuredPolicyRecord } from '../../data/schemas/policy.schema.js';
import { listIngestedSnapshots, type IngestedCoverageSnapshot } from './ingestion/store.js';
import {
  canonicalDrugKey,
  canonicalIssuerKey,
  canonicalPlanKey,
  inferRuleFacets,
  preferredIssuerLabel,
  type NormalizedRuleFacet
} from './normalization.js';
import uhcAdalimumab from '../../data/policies/structured/uhc-adalimumab-ra.json';
import uhcEtanercept from '../../data/policies/structured/uhc-etanercept-ra.json';
import aetnaAdalimumab from '../../data/policies/structured/aetna-adalimumab-ra.json';
import cignaInfliximab from '../../data/policies/structured/cigna-infliximab-ra.json';
import aetnaUpadacitinib from '../../data/policies/structured/aetna-upadacitinib-ra.json';

type CsvRow = Record<string, string>;

export interface AntonRxPlan {
  planId: string;
  issuerName: string;
  issuerKey: string;
  planName: string;
  planKey: string;
  planFamily: string;
  planYear: string;
  market: string;
  metalLevel: string;
  state: string;
  county: string;
  formularyGroup: string;
  sourceRef: string;
  notes: string;
}

export interface AntonRxCoverageMatch {
  planId: string;
  issuerName: string;
  issuerKey: string;
  planName: string;
  planKey: string;
  market: string;
  metalLevel: string;
  sourceKind: 'formulary' | 'structured_policy' | 'uploaded_policy_json' | 'uploaded_csv' | 'uploaded_pdf_policy' | 'uploaded_jsonl' | 'uploaded_docx_policy';
  sourcePosture: 'broad_formulary' | 'deep_medical_policy' | 'uploaded_normalized';
  sourceFile: string;
  sourceEffectiveDate: string;
  matchedDrugQuery: string;
  primaryDrugLabel: string;
  canonicalDrugKey: string;
  alternateDrugLabels: string[];
  alternateDrugKeys: string[];
  coverageLabel: string;
  coveredFlag: boolean;
  priorAuth: boolean;
  stepTherapy: boolean;
  quantityLimit: string;
  ageLimit: string;
  specialtyFlag: boolean;
  nonFormulary: boolean;
  medicalBenefit: boolean;
  therapeuticCategory: string;
  therapeuticSubcategory: string;
  notes: string;
  confidenceLabel: 'high' | 'medium';
  confidenceRationale: string;
  requirementsSummary: string[];
  evidenceSummary: string[];
  normalizedRuleFacets: NormalizedRuleFacet[];
}

export interface AntonRxPlanDrugDetail extends AntonRxCoverageMatch {
  planRules: AntonRxRule[];
  matchedRows: Array<{
    drugNameDisplay: string;
    tier: string;
    requirementsLimits: string;
    priorAuth: boolean;
    stepTherapy: boolean;
    quantityLimit: string;
    ageLimit: string;
    specialtyFlag: boolean;
    nonFormulary: boolean;
    medicalBenefit: boolean;
    sourceFile: string;
    sourceEffectiveDate: string;
  }>;
  structuredPolicy?: StructuredPolicyRecord;
}

export interface AntonRxRule {
  planId: string;
  issuerName: string;
  appliesTo: string;
  ruleType: string;
  ruleCode: string;
  ruleName: string;
  ruleText: string;
  sourceFile: string;
  sourcePage: string;
}

export interface AntonRxChangeWatch {
  drugQuery: string;
  sourceDates: Array<{ issuerName: string; sourceFile: string; sourceEffectiveDate: string; note: string }>;
  notableSignals: string[];
  summary: {
    planMatches: number;
    issuers: number;
    priorAuthPlans: number;
    stepTherapyPlans: number;
    deepPolicyMatches: number;
    proxySourceMatches: number;
  };
}

interface FormularyRow {
  planId: string;
  issuerName: string;
  issuerKey: string;
  planName: string;
  planKey: string;
  planFamily: string;
  planYear: string;
  formularyGroup: string;
  drugNameDisplay: string;
  therapeuticCategory: string;
  therapeuticSubcategory: string;
  tier: string;
  requirementsLimits: string;
  priorAuth: boolean;
  stepTherapy: boolean;
  quantityLimit: string;
  ageLimit: string;
  specialtyFlag: boolean;
  nonFormulary: boolean;
  medicalBenefit: boolean;
  sourceFile: string;
  sourceEffectiveDate: string;
  notes: string;
  coveredFlag: boolean;
  canonicalDrugKey: string;
  alternateDrugKeys: string[];
  normalizedRuleFacets: NormalizedRuleFacet[];
  searchText: string;
}

interface CatalogData {
  plans: AntonRxPlan[];
  formularyRows: FormularyRow[];
  rulesByPlan: Map<string, AntonRxRule[]>;
  plansById: Map<string, AntonRxPlan>;
  structuredPolicies: StructuredPolicyRecord[];
  ingestedSnapshots: IngestedCoverageSnapshot[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');
const packageDir = join(projectRoot, 'docs/hackaathon2/insurance_hackathon_final_data_package');

let cache: CatalogData | null = null;

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let current = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      row.push(current);
      current = '';
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  const [header = [], ...body] = rows;
  return body.map((cells) =>
    header.reduce<CsvRow>((acc, key, index) => {
      acc[key] = cells[index] ?? '';
      return acc;
    }, {})
  );
}

function readCsv(fileName: string): CsvRow[] {
  const fullPath = join(packageDir, fileName);
  return parseCsv(readFileSync(fullPath, 'utf-8'));
}

function asBool(value: string): boolean {
  return value.trim().toLowerCase() === 'true';
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function titleCaseWord(word: string): string {
  if (!word) {
    return word;
  }
  if (/^[A-Z0-9-]+$/.test(word)) {
    return word;
  }
  return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
}

function preferredDrugLabel(value: string): string {
  return compactWhitespace(value)
    .split(/\s+/)
    .map(titleCaseWord)
    .join(' ');
}

function makeSearchText(...values: Array<string | undefined>): string {
  return values
    .filter(Boolean)
    .map((value) => compactWhitespace(String(value)).toLowerCase())
    .join(' ');
}

function matchesDrugQuery(searchText: string, drugQuery: string): boolean {
  const query = compactWhitespace(drugQuery).toLowerCase();
  if (!query) {
    return false;
  }

  const normalizedQuery = normalizeDrugName(query).toLowerCase();
  return searchText.includes(query) || searchText.includes(normalizedQuery);
}

function matchesCanonicalDrugKey(
  candidateKey: string,
  alternateKeys: string[] | undefined,
  drugQuery: string
): boolean {
  const queryKey = canonicalDrugKey(drugQuery);
  if (!queryKey) {
    return false;
  }
  return candidateKey === queryKey || (alternateKeys ?? []).includes(queryKey);
}

function structuredPlanId(policy: StructuredPolicyRecord): string {
  return `STRUCTURED-${policy.payer.toUpperCase()}-${policy.plan.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`;
}

function structuredSearchText(policy: StructuredPolicyRecord): string {
  return makeSearchText(
    policy.drug.brandName,
    policy.drug.genericName,
    ...policy.drug.aliases,
    policy.indication
  );
}

function summarizeStructuredCoverage(policy: StructuredPolicyRecord): string {
  switch (policy.coverageStatus) {
    case 'covered':
      return 'Covered';
    case 'covered-with-pa':
      return 'Covered with PA';
    case 'excluded':
      return 'No policy support / excluded';
  }
}

function loadCatalog(): CatalogData {
  if (cache) {
    return cache;
  }

  const plansRows = readCsv('plans.csv');
  const formularyRows = readCsv('query_ready_formulary.csv');
  const rulesRows = readCsv('coverage_rules_by_plan.csv');

  const plans = plansRows.map<AntonRxPlan>((row) => ({
    planId: row.plan_id,
    issuerName: preferredIssuerLabel(row.issuer_name),
    issuerKey: canonicalIssuerKey(row.issuer_name),
    planName: row.plan_name,
    planKey: canonicalPlanKey(row.issuer_name, row.plan_name),
    planFamily: row.plan_family,
    planYear: row.plan_year,
    market: row.market,
    metalLevel: row.metal_level,
    state: row.state,
    county: row.county,
    formularyGroup: row.formulary_group,
    sourceRef: row.source_ref,
    notes: row.notes
  }));

  const plansById = new Map(plans.map((plan) => [plan.planId, plan]));

  const normalizedFormularyRows = formularyRows.map<FormularyRow>((row) => {
    const plan = plansById.get(row.plan_id);
    return {
      planId: row.plan_id,
      issuerName: preferredIssuerLabel(row.issuer_name),
      issuerKey: canonicalIssuerKey(row.issuer_name),
      planName: row.plan_name,
      planKey: canonicalPlanKey(row.issuer_name, row.plan_name),
      planFamily: row.plan_family,
      planYear: row.plan_year,
      formularyGroup: row.formulary_group,
      drugNameDisplay: row.drug_name_display,
      therapeuticCategory: row.therapeutic_category,
      therapeuticSubcategory: row.therapeutic_subcategory,
      tier: row.tier,
      requirementsLimits: row.requirements_limits,
      priorAuth: asBool(row.prior_auth),
      stepTherapy: asBool(row.step_therapy),
      quantityLimit: row.quantity_limit,
      ageLimit: row.age_limit,
      specialtyFlag: asBool(row.specialty_flag),
      nonFormulary: asBool(row.non_formulary),
      medicalBenefit: asBool(row.medical_benefit),
      sourceFile: row.source_file,
      sourceEffectiveDate: row.source_effective_date,
      notes: row.notes || plan?.notes || '',
      coveredFlag: row.covered_flag ? asBool(row.covered_flag) : !asBool(row.non_formulary),
      canonicalDrugKey: canonicalDrugKey(row.drug_name_display),
      alternateDrugKeys: [],
      normalizedRuleFacets: inferRuleFacets({
        requirementsText: row.requirements_limits,
        priorAuth: asBool(row.prior_auth),
        stepTherapy: asBool(row.step_therapy),
        quantityLimit: row.quantity_limit,
        ageLimit: row.age_limit,
        specialtyFlag: asBool(row.specialty_flag),
        nonFormulary: asBool(row.non_formulary)
      }),
      searchText: makeSearchText(
        row.drug_name_display,
        row.therapeutic_category,
        row.therapeutic_subcategory
      )
    };
  });

  const rulesByPlan = new Map<string, AntonRxRule[]>();
  for (const row of rulesRows) {
    const existing = rulesByPlan.get(row.plan_id) ?? [];
    if (row.rule_name || row.rule_text) {
      existing.push({
        planId: row.plan_id,
        issuerName: row.issuer_name,
        appliesTo: row.applies_to,
        ruleType: row.rule_type,
        ruleCode: row.rule_code,
        ruleName: row.rule_name,
        ruleText: row.rule_text,
        sourceFile: row.source_file,
        sourcePage: row.source_page
      });
    }
    rulesByPlan.set(row.plan_id, existing);
  }

  const structuredPolicies = [
    uhcAdalimumab,
    uhcEtanercept,
    aetnaAdalimumab,
    cignaInfliximab,
    aetnaUpadacitinib
  ] as StructuredPolicyRecord[];
  const ingestedSnapshots = listIngestedSnapshots();

  cache = {
    plans,
    formularyRows: normalizedFormularyRows,
    rulesByPlan,
    plansById,
    structuredPolicies,
    ingestedSnapshots
  };

  return cache;
}

function aggregateFormularyMatches(rows: FormularyRow[], plansById: Map<string, AntonRxPlan>, drugQuery: string): AntonRxCoverageMatch[] {
  const grouped = new Map<string, FormularyRow[]>();
  for (const row of rows) {
    const group = grouped.get(row.planId) ?? [];
    group.push(row);
    grouped.set(row.planId, group);
  }

  return [...grouped.entries()].map(([planId, matches]) => {
    const plan = plansById.get(planId);
    const uniqueRequirements = [...new Set(matches.map((match) => match.requirementsLimits).filter(Boolean))];
    const uniqueLabels = [...new Set(matches.map((match) => match.drugNameDisplay))];

    return {
      planId,
      issuerName: matches[0].issuerName,
      issuerKey: matches[0].issuerKey,
      planName: matches[0].planName,
      planKey: matches[0].planKey,
      market: plan?.market ?? '',
      metalLevel: plan?.metalLevel ?? '',
      sourceKind: 'formulary',
      sourcePosture: 'broad_formulary',
      sourceFile: matches[0].sourceFile,
      sourceEffectiveDate: matches[0].sourceEffectiveDate,
      matchedDrugQuery: drugQuery,
      primaryDrugLabel: uniqueLabels[0],
      canonicalDrugKey: matches[0].canonicalDrugKey,
      alternateDrugLabels: uniqueLabels.slice(1, 4),
      alternateDrugKeys: [...new Set(matches.flatMap((match) => match.alternateDrugKeys))],
      coverageLabel: matches.some((match) => match.coveredFlag) ? 'Listed on formulary' : 'Not covered / exception needed',
      coveredFlag: matches.some((match) => match.coveredFlag),
      priorAuth: matches.some((match) => match.priorAuth),
      stepTherapy: matches.some((match) => match.stepTherapy),
      quantityLimit: matches.map((match) => match.quantityLimit).find(Boolean) ?? '',
      ageLimit: matches.map((match) => match.ageLimit).find(Boolean) ?? '',
      specialtyFlag: matches.some((match) => match.specialtyFlag),
      nonFormulary: matches.every((match) => match.nonFormulary),
      medicalBenefit: matches.some((match) => match.medicalBenefit),
      therapeuticCategory: matches.map((match) => match.therapeuticCategory).find(Boolean) ?? '',
      therapeuticSubcategory: matches.map((match) => match.therapeuticSubcategory).find(Boolean) ?? '',
      notes: matches.map((match) => match.notes).find(Boolean) ?? '',
      confidenceLabel: matches.some((match) => match.medicalBenefit) ? 'medium' : 'medium',
      confidenceRationale: matches.some((match) => match.medicalBenefit)
        ? 'Matched packaged formulary rows and at least one row is explicitly flagged as medical benefit.'
        : 'Matched packaged formulary rows, but the evidence is broader formulary coverage rather than a deep structured medical-benefit policy extract.',
      requirementsSummary: uniqueRequirements.slice(0, 5),
      normalizedRuleFacets: [...new Set(matches.flatMap((match) => match.normalizedRuleFacets))],
      evidenceSummary: [
        `Matched ${matches.length} formulary row${matches.length === 1 ? '' : 's'} in ${matches[0].sourceFile}`,
        matches.some((match) => match.medicalBenefit)
          ? 'At least one matched row is explicitly flagged as medical benefit.'
          : 'Most matched rows come from formulary-style coverage data rather than explicit medical-benefit policy text.'
      ]
    };
  });
}

function aggregateStructuredMatches(policies: StructuredPolicyRecord[], drugQuery: string): AntonRxCoverageMatch[] {
  return policies.map((policy) => ({
    planId: structuredPlanId(policy),
    issuerName: policy.payer,
    issuerKey: canonicalIssuerKey(policy.payer),
    planName: `${policy.payer} ${policy.plan}`,
    planKey: canonicalPlanKey(policy.payer, `${policy.payer} ${policy.plan}`),
    market: 'Commercial',
    metalLevel: '',
    sourceKind: 'structured_policy',
    sourcePosture: 'deep_medical_policy',
    sourceFile: policy.sourceDocument.filename,
    sourceEffectiveDate: policy.sourceDocument.effectiveDate ?? policy.sourceDocument.retrievalDate,
    matchedDrugQuery: drugQuery,
    primaryDrugLabel: `${policy.drug.brandName} (${policy.drug.genericName})`,
    canonicalDrugKey: canonicalDrugKey(policy.drug.genericName),
    alternateDrugLabels: policy.drug.aliases.slice(0, 4),
    alternateDrugKeys: policy.drug.aliases.slice(0, 4).map((alias) => canonicalDrugKey(alias)),
    coverageLabel: summarizeStructuredCoverage(policy),
    coveredFlag: policy.coverageStatus !== 'excluded',
    priorAuth: policy.paRequired,
    stepTherapy: policy.stepTherapy.length > 0,
    quantityLimit: '',
    ageLimit: '',
    specialtyFlag: false,
    nonFormulary: policy.coverageStatus === 'excluded',
    medicalBenefit: true,
    therapeuticCategory: policy.indication,
    therapeuticSubcategory: '',
    notes: 'Structured medical-benefit policy extracted from payer document.',
    confidenceLabel: 'high',
    confidenceRationale: 'Backed by a structured medical-benefit policy record with extracted criteria and source-linked evidence.',
    requirementsSummary: [
      ...policy.diagnosisRequirements.map((item) => `Diagnosis: ${item.description}`),
      ...policy.stepTherapy.map((item) => `Step therapy: ${item.drugName} for ${item.duration}`),
      ...policy.otherRequirements.map((item) => `${item.category}: ${item.requirement}`)
    ].slice(0, 6),
    normalizedRuleFacets: inferRuleFacets({
      requirementsText: [
        ...policy.diagnosisRequirements.map((item) => item.description),
        ...policy.stepTherapy.map((item) => item.evidenceText),
        ...policy.otherRequirements.map((item) => item.requirement)
      ].join(' '),
      priorAuth: policy.paRequired,
      stepTherapy: policy.stepTherapy.length > 0,
      nonFormulary: policy.coverageStatus === 'excluded'
    }),
    evidenceSummary: [
      policy.diagnosisRequirements[0]?.evidenceText ?? '',
      policy.stepTherapy[0]?.evidenceText ?? '',
      policy.otherRequirements[0]?.evidenceText ?? ''
    ].filter(Boolean)
  }));
}

export function searchDrugs(query: string, limit = 12): string[] {
  const { formularyRows, structuredPolicies, ingestedSnapshots } = loadCatalog();
  const normalized = compactWhitespace(query).toLowerCase();
  const candidates = new Map<string, string>();

  function addCandidate(label: string) {
    const key = canonicalDrugKey(label);
    if (!key) {
      return;
    }
    if (!candidates.has(key)) {
      candidates.set(key, preferredDrugLabel(label));
    }
  }

  if (normalized.length === 0) {
    structuredPolicies.forEach((policy) => {
      addCandidate(policy.drug.genericName);
      addCandidate(policy.drug.brandName);
    });
    return [...candidates.values()].sort().slice(0, limit);
  }

  for (const row of formularyRows) {
    if (row.searchText.includes(normalized)) {
      addCandidate(row.drugNameDisplay);
    }
    if (candidates.size >= limit * 3) {
      break;
    }
  }

  for (const policy of structuredPolicies) {
    if (structuredSearchText(policy).includes(normalized)) {
      addCandidate(policy.drug.genericName);
      addCandidate(policy.drug.brandName);
    }
  }

  for (const snapshot of ingestedSnapshots) {
    if (makeSearchText(snapshot.primaryDrugLabel, ...snapshot.alternateDrugLabels).includes(normalized)) {
      addCandidate(snapshot.primaryDrugLabel);
      snapshot.alternateDrugLabels.forEach((label) => addCandidate(label));
    }
  }

  return [...candidates.values()].sort().slice(0, limit);
}

export function listIssuers(): string[] {
  const { plans, ingestedSnapshots } = loadCatalog();
  const byKey = new Map<string, string>();
  for (const plan of plans) {
    byKey.set(plan.issuerKey, plan.issuerName);
  }
  for (const snapshot of ingestedSnapshots) {
    byKey.set(snapshot.issuerKey, preferredIssuerLabel(snapshot.issuerName));
  }
  return [...new Set(byKey.values())].sort();
}

export function compareDrugAcrossPlans(drugQuery: string, issuerFilter?: string): AntonRxCoverageMatch[] {
  const { formularyRows, plansById, structuredPolicies, ingestedSnapshots } = loadCatalog();
  const normalizedFilter = issuerFilter?.trim().toLowerCase();

  const formularyMatches = formularyRows.filter((row) =>
    (matchesCanonicalDrugKey(row.canonicalDrugKey, row.alternateDrugKeys, drugQuery)
      || matchesDrugQuery(row.searchText, drugQuery))
    && (!normalizedFilter || row.issuerName.toLowerCase() === normalizedFilter)
  );

  const structuredMatches = structuredPolicies.filter((policy) =>
    (matchesCanonicalDrugKey(
      canonicalDrugKey(policy.drug.genericName),
      policy.drug.aliases.map((alias) => canonicalDrugKey(alias)),
      drugQuery
    ) || matchesDrugQuery(structuredSearchText(policy), drugQuery))
    && (!normalizedFilter || policy.payer.toLowerCase() === normalizedFilter)
  );

  const aggregated = [
    ...aggregateFormularyMatches(formularyMatches, plansById, drugQuery),
    ...aggregateStructuredMatches(structuredMatches, drugQuery),
    ...ingestedSnapshots
      .filter((snapshot) =>
        (matchesCanonicalDrugKey(snapshot.canonicalDrugKey, snapshot.alternateDrugKeys, drugQuery)
          || matchesDrugQuery(makeSearchText(snapshot.primaryDrugLabel, ...snapshot.alternateDrugLabels), drugQuery))
        && (!normalizedFilter || snapshot.issuerName.toLowerCase() === normalizedFilter)
      )
      .map((snapshot) => ({
        ...snapshot,
        matchedDrugQuery: drugQuery
      }))
  ];

  return aggregated.sort((left, right) => {
    if (left.sourceKind !== right.sourceKind) {
      return left.sourceKind === 'structured_policy' ? -1 : 1;
    }
    return left.issuerName.localeCompare(right.issuerName) || left.planName.localeCompare(right.planName);
  });
}

function findStructuredPolicy(planId: string, drugQuery: string): StructuredPolicyRecord | undefined {
  const { structuredPolicies } = loadCatalog();
  return structuredPolicies.find((policy) =>
    structuredPlanId(policy) === planId && matchesDrugQuery(structuredSearchText(policy), drugQuery)
  );
}

export function getPlanDrugDetail(planId: string, drugQuery: string): AntonRxPlanDrugDetail | null {
  const { formularyRows, rulesByPlan, plansById, ingestedSnapshots } = loadCatalog();
  const matches = formularyRows.filter((row) =>
    row.planId === planId
    && (matchesCanonicalDrugKey(row.canonicalDrugKey, row.alternateDrugKeys, drugQuery)
      || matchesDrugQuery(row.searchText, drugQuery))
  );
  const plan = plansById.get(planId);
  const planRules = rulesByPlan.get(planId) ?? [];

  if (matches.length > 0) {
    const summary = aggregateFormularyMatches(matches, plansById, drugQuery)[0];
    return {
      ...summary,
      planRules,
      matchedRows: matches.slice(0, 30).map((row) => ({
        drugNameDisplay: row.drugNameDisplay,
        tier: row.tier,
        requirementsLimits: row.requirementsLimits,
        priorAuth: row.priorAuth,
        stepTherapy: row.stepTherapy,
        quantityLimit: row.quantityLimit,
        ageLimit: row.ageLimit,
        specialtyFlag: row.specialtyFlag,
        nonFormulary: row.nonFormulary,
        medicalBenefit: row.medicalBenefit,
        sourceFile: row.sourceFile,
        sourceEffectiveDate: row.sourceEffectiveDate
      })),
      structuredPolicy: undefined
    };
  }

  const uploaded = ingestedSnapshots.find((snapshot) =>
    snapshot.planId === planId
    && (matchesCanonicalDrugKey(snapshot.canonicalDrugKey, snapshot.alternateDrugKeys, drugQuery)
      || matchesDrugQuery(makeSearchText(snapshot.primaryDrugLabel, ...snapshot.alternateDrugLabels), drugQuery))
  );
  if (uploaded) {
    return {
      ...uploaded,
      matchedDrugQuery: drugQuery,
      planRules,
      matchedRows: [
        {
          drugNameDisplay: uploaded.primaryDrugLabel,
          tier: '',
          requirementsLimits: uploaded.requirementsSummary.join(' | '),
          priorAuth: uploaded.priorAuth,
          stepTherapy: uploaded.stepTherapy,
          quantityLimit: uploaded.quantityLimit,
          ageLimit: uploaded.ageLimit,
          specialtyFlag: uploaded.specialtyFlag,
          nonFormulary: uploaded.nonFormulary,
          medicalBenefit: uploaded.medicalBenefit,
          sourceFile: uploaded.sourceFile,
          sourceEffectiveDate: uploaded.sourceEffectiveDate
        }
      ],
      structuredPolicy: uploaded.structuredPolicy as StructuredPolicyRecord | undefined
    };
  }

  const structured = findStructuredPolicy(planId, drugQuery);
  if (!structured) {
    return null;
  }

  const summary = aggregateStructuredMatches([structured], drugQuery)[0];
  return {
    ...summary,
    market: plan?.market ?? summary.market,
    metalLevel: plan?.metalLevel ?? summary.metalLevel,
    planRules,
    matchedRows: [
      {
        drugNameDisplay: `${structured.drug.brandName} (${structured.drug.genericName})`,
        tier: '',
        requirementsLimits: summary.requirementsSummary.join(' | '),
        priorAuth: structured.paRequired,
        stepTherapy: structured.stepTherapy.length > 0,
        quantityLimit: '',
        ageLimit: '',
        specialtyFlag: false,
        nonFormulary: structured.coverageStatus === 'excluded',
        medicalBenefit: true,
        sourceFile: structured.sourceDocument.filename,
        sourceEffectiveDate: structured.sourceDocument.effectiveDate ?? structured.sourceDocument.retrievalDate
      }
    ],
    structuredPolicy: structured
  };
}

export function getChangeWatch(drugQuery: string, issuerFilter?: string): AntonRxChangeWatch {
  const matches = compareDrugAcrossPlans(drugQuery, issuerFilter);
  const sourceDates = matches.map((match) => ({
    issuerName: match.issuerName,
    sourceFile: match.sourceFile,
    sourceEffectiveDate: match.sourceEffectiveDate || 'Unknown',
    note: match.notes
  }));

  const notableSignals: string[] = [];
  if (matches.some((match) => match.sourceEffectiveDate.startsWith('2023'))) {
    notableSignals.push('Some visible coverage rows come from older proxy source files and should be treated as demo-era references.');
  }
  if (matches.some((match) => match.priorAuth)) {
    notableSignals.push('Prior authorization appears in at least one visible plan for this drug query.');
  }
  if (matches.some((match) => match.stepTherapy)) {
    notableSignals.push('Step therapy appears in at least one visible plan for this drug query.');
  }
  if (matches.some((match) => match.medicalBenefit)) {
    notableSignals.push('At least one visible match is explicitly flagged as medical benefit or backed by a medical-benefit policy extract.');
  }
  if (notableSignals.length === 0) {
    notableSignals.push('Current package provides a single visible snapshot per issuer for this query. Historical version diffs are version-ready but not yet loaded.');
  }

  return {
    drugQuery,
    sourceDates,
    notableSignals,
    summary: {
      planMatches: matches.length,
      issuers: new Set(matches.map((match) => match.issuerName)).size,
      priorAuthPlans: matches.filter((match) => match.priorAuth).length,
      stepTherapyPlans: matches.filter((match) => match.stepTherapy).length,
      deepPolicyMatches: matches.filter((match) => match.sourcePosture === 'deep_medical_policy').length,
      proxySourceMatches: matches.filter((match) => match.sourceEffectiveDate.startsWith('2023')).length
    }
  };
}

export function getCatalogSummary() {
  const { plans, formularyRows, structuredPolicies, ingestedSnapshots } = loadCatalog();
  return {
    planCount: plans.length,
    formularyRowCount: formularyRows.length,
    medicalBenefitRowCount: formularyRows.filter((row) => row.medicalBenefit).length,
    structuredPolicyCount: structuredPolicies.length,
    ingestedSnapshotCount: ingestedSnapshots.length,
    issuers: listIssuers()
  };
}

export function invalidateAntonRxCatalog() {
  cache = null;
}
