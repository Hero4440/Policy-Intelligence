import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { PolicyRecordSchema } from '../../data/schemas/policy.schema.ts';
import {
  derivePolicyId,
  listPolicyIndex,
  readPolicyVersion,
} from '../storage/policy-store.js';
import { POLICIES_STRUCTURED_DIR } from '../storage/paths.js';
import type { PolicyIndexEntry, PolicyRecord } from '../storage/types.js';

export type PolicyCompareRowKey =
  | 'preferred_products'
  | 'non_preferred_products'
  | 'prior_auth'
  | 'step_therapy'
  | 'covered_indications'
  | 'key_restrictions';

export type PolicyStatusTone = 'favorable' | 'conditional' | 'restrictive' | 'unknown';

export interface PolicyEvidenceRef {
  id: string;
  snippet: string;
  document: string;
  page: number | null;
  section: string;
  fieldLabel: string;
  policyId: string;
  policyVersion: number;
  payer: string;
}

export interface PolicyCompareCell {
  rowKey: PolicyCompareRowKey;
  value: string;
  status: PolicyStatusTone;
  evidence: PolicyEvidenceRef[];
}

export interface PolicyCompareColumn {
  policyId: string;
  payer: string;
  plan: string;
  title: string;
  drugFamilyKey: string;
  drugFamilyLabel: string;
  policyVersion: number;
  effectiveDate: string;
  coverageStatus: PolicyRecord['coverageStatus'];
  cells: Record<PolicyCompareRowKey, PolicyCompareCell>;
}

export interface PolicyCompareRowDefinition {
  key: PolicyCompareRowKey;
  label: string;
  description: string;
}

export interface PolicyCompareHighlight {
  kind:
    | 'prior_auth_mismatch'
    | 'step_therapy_mismatch'
    | 'preferred_product_split'
    | 'non_preferred_product_split'
    | 'covered_indication_mismatch'
    | 'restriction_difference'
    | 'coverage_difference';
  text: string;
  payers: string[];
  rowKeys: PolicyCompareRowKey[];
}

export interface PolicyDrugFamilyOption {
  key: string;
  label: string;
  payers: string[];
}

export interface PolicyCompareOptions {
  drugFamilies: PolicyDrugFamilyOption[];
  payers: string[];
  versions: number[];
  ruleTypes: Array<{ key: PolicyCompareRowKey; label: string }>;
}

export interface PolicyComparePayload {
  drugFamily: PolicyDrugFamilyOption;
  selectedPayers: string[];
  rows: PolicyCompareRowDefinition[];
  columns: PolicyCompareColumn[];
  highlights: PolicyCompareHighlight[];
}

interface ComparablePolicyRecord {
  policyId: string;
  version: number;
  record: PolicyRecord;
}

const compareRows: PolicyCompareRowDefinition[] = [
  {
    key: 'preferred_products',
    label: 'Preferred Products',
    description: 'Products explicitly identified as preferred for the selected payer.'
  },
  {
    key: 'non_preferred_products',
    label: 'Non-Preferred Products',
    description: 'Products identified as non-preferred or brand products subject to extra review.'
  },
  {
    key: 'prior_auth',
    label: 'Prior Auth',
    description: 'Whether prior authorization is required for the selected drug family.'
  },
  {
    key: 'step_therapy',
    label: 'Step Therapy',
    description: 'Whether prerequisite therapy or fail/intolerance criteria are signaled.'
  },
  {
    key: 'covered_indications',
    label: 'Covered Indications',
    description: 'Indications explicitly represented in the normalized policy.'
  },
  {
    key: 'key_restrictions',
    label: 'Key Restrictions',
    description: 'Condensed restrictions sourced from diagnosis, preferred-product, and other requirement criteria.'
  }
];

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeList(values: string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter(Boolean);
}

function uniqueValues<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function compareValueSignature(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function canonicalDrugFamily(record: PolicyRecord): PolicyDrugFamilyOption {
  const generic = normalizeKey(record.drug.genericName || record.drug.brandName);
  const label = record.drug.genericName
    ? `${record.drug.brandName} (${record.drug.genericName})`
    : record.drug.brandName;
  return { key: generic, label, payers: [record.payer] };
}

function buildEvidenceRef(
  policyId: string,
  version: number,
  payer: string,
  fieldLabel: string,
  snippet: string,
  source?: { document: string; page: number; section: string }
): PolicyEvidenceRef {
  return {
    id: `${policyId}:${version}:${fieldLabel}:${source?.page ?? 'na'}:${snippet.slice(0, 18)}`,
    snippet,
    document: source?.document ?? 'Derived from normalized policy record',
    page: source?.page ?? null,
    section: source?.section ?? 'Normalized field',
    fieldLabel,
    policyId,
    policyVersion: version,
    payer
  };
}

function fallbackEvidence(
  policyId: string,
  version: number,
  record: PolicyRecord,
  fieldLabel: string,
  snippet: string
): PolicyEvidenceRef[] {
  return [
    buildEvidenceRef(policyId, version, record.payer, fieldLabel, snippet, {
      document: record.sourceDocument.filename,
      page: 1,
      section: 'Normalized policy record'
    })
  ];
}

function productEvidence(
  policyId: string,
  version: number,
  record: PolicyRecord,
  tier: 'preferred' | 'non-preferred'
): PolicyEvidenceRef[] {
  const matchedOtherRequirements = record.otherRequirements.filter((requirement) =>
    normalizeKey(requirement.category).includes('preferred')
      || normalizeKey(requirement.requirement).includes(tier === 'preferred' ? 'preferred' : 'non preferred')
      || normalizeKey(requirement.requirement).includes(tier === 'preferred' ? 'biosimilar' : 'brand')
  );

  const refs = matchedOtherRequirements.map((requirement) =>
    buildEvidenceRef(
      policyId,
      version,
      record.payer,
      tier === 'preferred' ? 'Preferred products' : 'Non-preferred products',
      requirement.evidenceText,
      requirement.source
    )
  );

  if (refs.length > 0) {
    return refs;
  }

  const stepRefs = record.stepTherapy
    .filter((entry) =>
      normalizeKey(entry.drugName).includes('preferred')
      || normalizeKey(entry.failureCriteria).includes('preferred')
      || normalizeKey(entry.failureCriteria).includes('biosimilar')
    )
    .map((entry) =>
      buildEvidenceRef(
        policyId,
        version,
        record.payer,
        tier === 'preferred' ? 'Preferred products' : 'Non-preferred products',
        entry.evidenceText,
        entry.source
      )
    );

  if (stepRefs.length > 0) {
    return stepRefs;
  }

  const productNames = (record.drug.products ?? [])
    .filter((product) => product.tier === tier)
    .map((product) => product.name);

  return fallbackEvidence(
    policyId,
    version,
    record,
    tier === 'preferred' ? 'Preferred products' : 'Non-preferred products',
    productNames.length > 0
      ? `${tier === 'preferred' ? 'Preferred' : 'Non-preferred'} products listed in normalized policy: ${productNames.join(', ')}.`
      : `No ${tier === 'preferred' ? 'preferred' : 'non-preferred'} products explicitly listed in the normalized policy.`
  );
}

function buildPreferredProductsCell(policyId: string, version: number, record: PolicyRecord): PolicyCompareCell {
  const values = (record.drug.products ?? [])
    .filter((product) => product.tier === 'preferred')
    .map((product) => product.name);

  return {
    rowKey: 'preferred_products',
    value: values.length > 0 ? values.join(', ') : 'Not specified',
    status: values.length > 0 ? 'favorable' : 'unknown',
    evidence: productEvidence(policyId, version, record, 'preferred')
  };
}

function buildNonPreferredProductsCell(policyId: string, version: number, record: PolicyRecord): PolicyCompareCell {
  const values = (record.drug.products ?? [])
    .filter((product) => product.tier === 'non-preferred')
    .map((product) => product.name);

  return {
    rowKey: 'non_preferred_products',
    value: values.length > 0 ? values.join(', ') : 'Not specified',
    status: values.length > 0 ? 'restrictive' : 'unknown',
    evidence: productEvidence(policyId, version, record, 'non-preferred')
  };
}

function buildPriorAuthCell(policyId: string, version: number, record: PolicyRecord): PolicyCompareCell {
  const evidence = record.diagnosisRequirements.slice(0, 2).map((requirement) =>
    buildEvidenceRef(
      policyId,
      version,
      record.payer,
      'Prior auth',
      requirement.evidenceText,
      requirement.source
    )
  );

  return {
    rowKey: 'prior_auth',
    value: record.paRequired ? 'Required' : 'Not required',
    status: record.paRequired ? 'conditional' : 'favorable',
    evidence: evidence.length > 0
      ? evidence
      : fallbackEvidence(
          policyId,
          version,
          record,
          'Prior auth',
          record.paRequired
            ? 'Normalized policy indicates prior authorization is required.'
            : 'Normalized policy indicates no prior authorization requirement.'
        )
  };
}

function buildStepTherapyCell(policyId: string, version: number, record: PolicyRecord): PolicyCompareCell {
  const values = record.stepTherapy.map((entry) =>
    `${entry.drugName}: ${entry.failureCriteria}`
  );

  return {
    rowKey: 'step_therapy',
    value: values.length > 0 ? values.join(' | ') : 'No step therapy signaled',
    status: values.length > 0 ? 'restrictive' : 'favorable',
    evidence: values.length > 0
      ? record.stepTherapy.map((entry) =>
          buildEvidenceRef(policyId, version, record.payer, 'Step therapy', entry.evidenceText, entry.source)
        )
      : fallbackEvidence(
          policyId,
          version,
          record,
          'Step therapy',
          'No step therapy criteria are present in the normalized policy record.'
        )
  };
}

function buildCoveredIndicationsCell(policyId: string, version: number, record: PolicyRecord): PolicyCompareCell {
  const values = uniqueValues(normalizeList(record.indications ?? [record.indication]));
  const evidence = record.diagnosisRequirements.length > 0
    ? record.diagnosisRequirements.map((requirement) =>
        buildEvidenceRef(
          policyId,
          version,
          record.payer,
          'Covered indications',
          requirement.evidenceText,
          requirement.source
        )
      )
    : fallbackEvidence(
        policyId,
        version,
        record,
        'Covered indications',
        `Normalized policy indication: ${values.join(', ')}.`
      );

  return {
    rowKey: 'covered_indications',
    value: values.join(', '),
    status: record.coverageStatus === 'excluded' ? 'restrictive' : 'favorable',
    evidence
  };
}

function buildKeyRestrictionsCell(policyId: string, version: number, record: PolicyRecord): PolicyCompareCell {
  const restrictions = uniqueValues([
    ...record.diagnosisRequirements.map((requirement) => requirement.description),
    ...record.otherRequirements.map((requirement) => requirement.requirement),
  ]);

  const evidence = [
    ...record.diagnosisRequirements.slice(0, 2).map((requirement) =>
      buildEvidenceRef(
        policyId,
        version,
        record.payer,
        'Key restrictions',
        requirement.evidenceText,
        requirement.source
      )
    ),
    ...record.otherRequirements.slice(0, 3).map((requirement) =>
      buildEvidenceRef(
        policyId,
        version,
        record.payer,
        'Key restrictions',
        requirement.evidenceText,
        requirement.source
      )
    )
  ];

  return {
    rowKey: 'key_restrictions',
    value: restrictions.length > 0 ? restrictions.slice(0, 4).join(' | ') : 'No additional restrictions captured',
    status: restrictions.length > 0 ? 'conditional' : 'favorable',
    evidence: evidence.length > 0
      ? evidence
      : fallbackEvidence(
          policyId,
          version,
          record,
          'Key restrictions',
          'No additional restrictions were captured in the normalized policy record.'
        )
  };
}

function buildCompareColumn(policy: ComparablePolicyRecord): PolicyCompareColumn {
  const { policyId, version, record } = policy;
  const family = canonicalDrugFamily(record);

  return {
    policyId,
    payer: record.payer,
    plan: record.plan,
    title: record.policyTitle ?? record.indication,
    drugFamilyKey: family.key,
    drugFamilyLabel: family.label,
    policyVersion: version,
    effectiveDate: record.sourceDocument.effectiveDate ?? record.sourceDocument.retrievalDate,
    coverageStatus: record.coverageStatus,
    cells: {
      preferred_products: buildPreferredProductsCell(policyId, version, record),
      non_preferred_products: buildNonPreferredProductsCell(policyId, version, record),
      prior_auth: buildPriorAuthCell(policyId, version, record),
      step_therapy: buildStepTherapyCell(policyId, version, record),
      covered_indications: buildCoveredIndicationsCell(policyId, version, record),
      key_restrictions: buildKeyRestrictionsCell(policyId, version, record)
    }
  };
}

function loadSeedPolicies(existingPolicyIds: Set<string>, versionFilter?: number): ComparablePolicyRecord[] {
  if (versionFilter !== undefined && versionFilter !== 1) {
    return [];
  }
  if (!existsSync(POLICIES_STRUCTURED_DIR)) {
    return [];
  }

  const seedPolicies: ComparablePolicyRecord[] = [];
  for (const fileName of readdirSync(POLICIES_STRUCTURED_DIR)) {
    if (!fileName.endsWith('.json') || fileName.includes('_diff_') || /_v\d+\.json$/.test(fileName) || fileName === 'policies-index.json' || fileName === 'index.json') {
      continue;
    }

    try {
      const raw = JSON.parse(readFileSync(join(POLICIES_STRUCTURED_DIR, fileName), 'utf-8')) as unknown;
      const parsed = PolicyRecordSchema.safeParse(raw);
      if (!parsed.success) {
        continue;
      }
      const logicalPolicyId = derivePolicyId(parsed.data);
      if (existingPolicyIds.has(logicalPolicyId)) {
        continue;
      }
      existingPolicyIds.add(logicalPolicyId);
      seedPolicies.push({
        policyId: logicalPolicyId,
        version: 1,
        record: parsed.data
      });
    } catch {
      continue;
    }
  }

  return seedPolicies;
}

function loadComparablePolicies(versionFilter?: number): ComparablePolicyRecord[] {
  const currentPolicies: ComparablePolicyRecord[] = [];
  const takenPolicyIds = new Set<string>();

  for (const entry of listPolicyIndex()) {
    const selectedVersion = versionFilter ?? entry.currentVersion;
    if (!entry.versions.includes(selectedVersion)) {
      continue;
    }
    const versionRecord = readPolicyVersion(entry.policyId, selectedVersion);
    if (!versionRecord) {
      continue;
    }
    currentPolicies.push({
      policyId: entry.policyId,
      version: selectedVersion,
      record: versionRecord.record
    });
    takenPolicyIds.add(entry.policyId);
  }

  return [...currentPolicies, ...loadSeedPolicies(takenPolicyIds, versionFilter)];
}

function pickBestColumnsByPayer(
  policies: ComparablePolicyRecord[],
  selectedPayers: string[]
): PolicyCompareColumn[] {
  const byPayer = new Map<string, ComparablePolicyRecord>();
  for (const policy of policies) {
    if (!selectedPayers.includes(policy.record.payer)) {
      continue;
    }
    const existing = byPayer.get(policy.record.payer);
    if (!existing || policy.version > existing.version) {
      byPayer.set(policy.record.payer, policy);
    }
  }

  return selectedPayers
    .map((payer) => byPayer.get(payer))
    .filter((policy): policy is ComparablePolicyRecord => Boolean(policy))
    .map(buildCompareColumn);
}

function coverageSummary(column: PolicyCompareColumn): string {
  switch (column.coverageStatus) {
    case 'covered':
      return 'covered';
    case 'covered-with-pa':
      return 'covered with prior auth';
    case 'excluded':
      return 'excluded';
  }
}

function describePayers(columns: PolicyCompareColumn[], rowKey: PolicyCompareRowKey, valueMatch: string): string[] {
  return columns
    .filter((column) => compareValueSignature(column.cells[rowKey].value) === valueMatch)
    .map((column) => column.payer);
}

function buildComparisonHighlights(columns: PolicyCompareColumn[]): PolicyCompareHighlight[] {
  const highlights: PolicyCompareHighlight[] = [];

  if (columns.length < 2) {
    return highlights;
  }

  const paValues = uniqueValues(columns.map((column) => compareValueSignature(column.cells.prior_auth.value)));
  if (paValues.length > 1) {
    const required = describePayers(columns, 'prior_auth', 'required');
    const notRequired = describePayers(columns, 'prior_auth', 'not required');
    highlights.push({
      kind: 'prior_auth_mismatch',
      text: `${required.join(', ')} require prior auth; ${notRequired.join(', ')} do not.`,
      payers: [...required, ...notRequired],
      rowKeys: ['prior_auth']
    });
  }

  const stepValues = uniqueValues(columns.map((column) => compareValueSignature(column.cells.step_therapy.value)));
  if (stepValues.length > 1) {
    const restrictive = columns
      .filter((column) => column.cells.step_therapy.status === 'restrictive')
      .map((column) => column.payer);
    const favorable = columns
      .filter((column) => column.cells.step_therapy.status === 'favorable')
      .map((column) => column.payer);
    highlights.push({
      kind: 'step_therapy_mismatch',
      text: `${restrictive.join(', ')} signal step therapy; ${favorable.join(', ')} do not.`,
      payers: [...restrictive, ...favorable],
      rowKeys: ['step_therapy']
    });
  }

  const preferredValues = uniqueValues(columns.map((column) => compareValueSignature(column.cells.preferred_products.value)));
  if (preferredValues.length > 1) {
    highlights.push({
      kind: 'preferred_product_split',
      text: `Preferred product posture differs across payers for the selected drug family.`,
      payers: columns.map((column) => column.payer),
      rowKeys: ['preferred_products']
    });
  }

  const nonPreferredValues = uniqueValues(columns.map((column) => compareValueSignature(column.cells.non_preferred_products.value)));
  if (nonPreferredValues.length > 1) {
    highlights.push({
      kind: 'non_preferred_product_split',
      text: `Non-preferred product lists are not aligned across selected payers.`,
      payers: columns.map((column) => column.payer),
      rowKeys: ['non_preferred_products']
    });
  }

  const indicationValues = uniqueValues(columns.map((column) => compareValueSignature(column.cells.covered_indications.value)));
  if (indicationValues.length > 1) {
    highlights.push({
      kind: 'covered_indication_mismatch',
      text: `Covered indications differ across payers for this drug family.`,
      payers: columns.map((column) => column.payer),
      rowKeys: ['covered_indications']
    });
  }

  const restrictionValues = uniqueValues(columns.map((column) => compareValueSignature(column.cells.key_restrictions.value)));
  if (restrictionValues.length > 1) {
    highlights.push({
      kind: 'restriction_difference',
      text: `Key restrictions diverge across selected payers.`,
      payers: columns.map((column) => column.payer),
      rowKeys: ['key_restrictions']
    });
  }

  const coverageValues = uniqueValues(columns.map((column) => coverageSummary(column)));
  if (coverageValues.length > 1) {
    highlights.push({
      kind: 'coverage_difference',
      text: `Overall coverage posture differs: ${columns.map((column) => `${column.payer} is ${coverageSummary(column)}`).join('; ')}.`,
      payers: columns.map((column) => column.payer),
      rowKeys: ['prior_auth', 'step_therapy', 'covered_indications']
    });
  }

  return highlights.slice(0, 5);
}

export function listComparableDrugFamilies(versionFilter?: number): PolicyDrugFamilyOption[] {
  const families = new Map<string, { label: string; payers: Set<string> }>();
  for (const policy of loadComparablePolicies(versionFilter)) {
    const family = canonicalDrugFamily(policy.record);
    if (!families.has(family.key)) {
      families.set(family.key, { label: family.label, payers: new Set<string>() });
    }
    families.get(family.key)?.payers.add(policy.record.payer);
  }

  return [...families.entries()]
    .map(([key, value]) => ({
      key,
      label: value.label,
      payers: [...value.payers].sort()
    }))
    .filter((family) => family.payers.length >= 2)
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function getPolicyCompareOptions(): PolicyCompareOptions {
  const drugFamilies = listComparableDrugFamilies();
  const policies = loadComparablePolicies().filter((policy) =>
    drugFamilies.some((family) => family.key === canonicalDrugFamily(policy.record).key)
  );
  const payers = uniqueValues(policies.map((policy) => policy.record.payer)).sort();
  const versions = uniqueValues(policies.map((policy) => policy.version)).sort((a, b) => a - b);

  return {
    drugFamilies,
    payers,
    versions,
    ruleTypes: compareRows.map((row) => ({ key: row.key, label: row.label }))
  };
}

export function buildPolicyComparison(drugFamily: string, payers: string[], versionFilter?: number): PolicyComparePayload {
  const selectedDrugFamily = normalizeKey(drugFamily);
  const selectedPayers = uniqueValues(normalizeList(payers));

  if (!selectedDrugFamily) {
    throw new Error('drugFamily is required');
  }
  if (selectedPayers.length < 2) {
    throw new Error('At least two payers are required');
  }

  const matchingPolicies = loadComparablePolicies(versionFilter)
    .filter((policy) => canonicalDrugFamily(policy.record).key === selectedDrugFamily);

  const availablePayers = uniqueValues(matchingPolicies.map((policy) => policy.record.payer)) as string[];
  const missingPayers = selectedPayers.filter((payer) => !availablePayers.includes(payer));
  if (missingPayers.length > 0) {
    throw new Error(`Selected payers are unavailable for this drug family: ${missingPayers.join(', ')}`);
  }

  const columns = pickBestColumnsByPayer(matchingPolicies, selectedPayers);
  if (columns.length < 2) {
    throw new Error('Not enough comparable payer records were found');
  }

  return {
    drugFamily: canonicalDrugFamily(matchingPolicies[0].record),
    selectedPayers,
    rows: compareRows,
    columns,
    highlights: buildComparisonHighlights(columns)
  };
}

export {
  compareRows,
  loadComparablePolicies,
  buildCompareColumn,
  canonicalDrugFamily,
  type ComparablePolicyRecord
};
