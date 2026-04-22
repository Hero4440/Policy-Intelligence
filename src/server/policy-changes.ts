import type { PolicyRecord } from '../storage/types.js';
import type {
  ChangeSeverity,
  ChangeType,
  ClassifiedDiffField,
  DiffField,
  DiffRecord,
  PolicyChangeEvent,
  PolicyIndexEntry
} from '../storage/types.js';
import {
  diffPolicyVersions,
  ensurePolicyTextSnapshot,
  listPolicyIndex,
  listPolicyVersionPairs,
  readPolicyVersion
} from '../storage/policy-store.js';

interface PolicyChangeFilters {
  policyId?: string;
  payer?: string;
  drugFamily?: string;
  severity?: ChangeSeverity;
}

export interface PolicyChangesResponse {
  events: PolicyChangeEvent[];
  filters: {
    payerOptions: string[];
    drugFamilyOptions: string[];
    severityOptions: ChangeSeverity[];
  };
}

export interface PolicyVersionDiffPayload {
  policyId: string;
  policyTitle: string;
  payer: string;
  drugFamily: string;
  fromVersion: number;
  toVersion: number;
  structuredChanges: ClassifiedDiffField[];
  textSnapshot: {
    leftLabel: string;
    rightLabel: string;
    leftText: string;
    rightText: string;
  };
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function valuesEquivalent(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function formattingOnly(oldValue: unknown, newValue: unknown): boolean {
  return typeof oldValue === 'string'
    && typeof newValue === 'string'
    && oldValue !== newValue
    && normalizeWhitespace(oldValue) === normalizeWhitespace(newValue);
}

function inferChangeType(oldValue: unknown, newValue: unknown): ChangeType {
  const oldMissing = oldValue === undefined || oldValue === null || oldValue === '';
  const newMissing = newValue === undefined || newValue === null || newValue === '';
  if (oldMissing && !newMissing) {
    return 'added';
  }
  if (!oldMissing && newMissing) {
    return 'removed';
  }
  return 'updated';
}

function normalizeForDisplay(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return 'None';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? 'None' : value.map((item) => normalizeForDisplay(item)).join(', ');
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function classifyFieldPath(fieldPath: string, oldValue: unknown, newValue: unknown): {
  severity: ChangeSeverity;
  rationale: string;
} {
  if (formattingOnly(oldValue, newValue)) {
    return {
      severity: 'cosmetic',
      rationale: 'Only formatting or whitespace changed; coverage meaning did not change.'
    };
  }

  if (
    fieldPath === 'coverageStatus'
    || fieldPath === 'paRequired'
    || fieldPath.startsWith('stepTherapy')
    || fieldPath.startsWith('diagnosisRequirements')
    || fieldPath.startsWith('otherRequirements')
    || fieldPath.startsWith('indications')
    || fieldPath.startsWith('drug.products')
  ) {
    return {
      severity: 'clinical',
      rationale: 'This field changes coverage posture, criteria, or product positioning.'
    };
  }

  if (
    fieldPath === 'payer'
    || fieldPath === 'plan'
    || fieldPath === 'policyTitle'
    || fieldPath === 'indication'
    || fieldPath === 'drug.brandName'
    || fieldPath === 'drug.genericName'
    || fieldPath === 'sourceDocument.effectiveDate'
  ) {
    return {
      severity: 'operational',
      rationale: 'This field affects policy interpretation or workflow metadata without directly changing coverage criteria.'
    };
  }

  if (
    fieldPath === 'sourceDocument.filename'
    || fieldPath === 'sourceDocument.url'
    || fieldPath === 'sourceDocument.retrievalDate'
    || fieldPath === 'drug.aliases'
  ) {
    return {
      severity: 'cosmetic',
      rationale: 'This field is source or presentation metadata rather than a coverage-driving rule.'
    };
  }

  return {
    severity: 'operational',
    rationale: 'This field changes structured policy content but is not a primary coverage-rule signal.'
  };
}

export function classifyPolicyDiffField(field: string, oldValue: unknown, newValue: unknown): ClassifiedDiffField {
  const { severity, rationale } = classifyFieldPath(field, oldValue, newValue);
  return {
    field,
    oldValue: normalizeForDisplay(oldValue),
    newValue: normalizeForDisplay(newValue),
    severity,
    rationale,
    changeType: inferChangeType(oldValue, newValue)
  };
}

function mapByKey<T>(items: T[], getKey: (item: T) => string): Map<string, T> {
  const mapped = new Map<string, T>();
  for (const item of items) {
    mapped.set(getKey(item), item);
  }
  return mapped;
}

function flattenArrayDelta<T>(
  field: string,
  oldItems: T[] | undefined,
  newItems: T[] | undefined,
  getKey: (item: T) => string,
  toFields: (basePath: string, oldItem: T | undefined, newItem: T | undefined) => Array<{ field: string; oldValue: unknown; newValue: unknown }>
): ClassifiedDiffField[] {
  const oldMap = mapByKey(oldItems ?? [], getKey);
  const newMap = mapByKey(newItems ?? [], getKey);
  const keys = uniqueSorted([...oldMap.keys(), ...newMap.keys()]);
  const flattened: ClassifiedDiffField[] = [];

  for (const key of keys) {
    const basePath = `${field}.${key}`;
    const oldItem = oldMap.get(key);
    const newItem = newMap.get(key);
    for (const entry of toFields(basePath, oldItem, newItem)) {
      if (!valuesEquivalent(entry.oldValue, entry.newValue)) {
        flattened.push(classifyPolicyDiffField(entry.field, entry.oldValue, entry.newValue));
      }
    }
  }

  return flattened;
}

function flattenDrugDiff(oldValue: any, newValue: any): ClassifiedDiffField[] {
  const flattened: ClassifiedDiffField[] = [];
  const oldDrug = oldValue ?? {};
  const newDrug = newValue ?? {};

  for (const field of ['brandName', 'genericName', 'aliases'] as const) {
    if (!valuesEquivalent(oldDrug[field], newDrug[field])) {
      flattened.push(classifyPolicyDiffField(`drug.${field}`, oldDrug[field], newDrug[field]));
    }
  }

  flattened.push(
    ...flattenArrayDelta(
      'drug.products',
      oldDrug.products as Array<{ name: string; tier?: string; aliases?: string[] }> | undefined,
      newDrug.products as Array<{ name: string; tier?: string; aliases?: string[] }> | undefined,
      (item) => item.name,
      (basePath, oldItem, newItem) => [
        { field: `${basePath}.tier`, oldValue: oldItem?.tier, newValue: newItem?.tier },
        { field: `${basePath}.aliases`, oldValue: oldItem?.aliases ?? [], newValue: newItem?.aliases ?? [] }
      ]
    )
  );

  return flattened;
}

function flattenDiagnosisDiff(oldValue: any, newValue: any): ClassifiedDiffField[] {
  return flattenArrayDelta(
    'diagnosisRequirements',
    oldValue as Array<{ description: string; icd10Codes?: string[]; evidenceText?: string }> | undefined,
    newValue as Array<{ description: string; icd10Codes?: string[]; evidenceText?: string }> | undefined,
    (item) => item.description,
    (basePath, oldItem, newItem) => [
      { field: `${basePath}.description`, oldValue: oldItem?.description, newValue: newItem?.description },
      { field: `${basePath}.icd10Codes`, oldValue: oldItem?.icd10Codes ?? [], newValue: newItem?.icd10Codes ?? [] },
      { field: `${basePath}.evidenceText`, oldValue: oldItem?.evidenceText, newValue: newItem?.evidenceText }
    ]
  );
}

function flattenStepTherapyDiff(oldValue: any, newValue: any): ClassifiedDiffField[] {
  return flattenArrayDelta(
    'stepTherapy',
    oldValue as Array<{
      drugName: string;
      dosage?: string;
      duration?: string;
      failureCriteria?: string;
    }> | undefined,
    newValue as Array<{
      drugName: string;
      dosage?: string;
      duration?: string;
      failureCriteria?: string;
    }> | undefined,
    (item) => item.drugName,
    (basePath, oldItem, newItem) => [
      { field: `${basePath}.drugName`, oldValue: oldItem?.drugName, newValue: newItem?.drugName },
      { field: `${basePath}.dosage`, oldValue: oldItem?.dosage, newValue: newItem?.dosage },
      { field: `${basePath}.duration`, oldValue: oldItem?.duration, newValue: newItem?.duration },
      { field: `${basePath}.failureCriteria`, oldValue: oldItem?.failureCriteria, newValue: newItem?.failureCriteria }
    ]
  );
}

function flattenOtherRequirementsDiff(oldValue: any, newValue: any): ClassifiedDiffField[] {
  return flattenArrayDelta(
    'otherRequirements',
    oldValue as Array<{ category: string; requirement: string; ambiguous?: boolean }> | undefined,
    newValue as Array<{ category: string; requirement: string; ambiguous?: boolean }> | undefined,
    (item) => `${item.category}:${item.requirement}`,
    (basePath, oldItem, newItem) => [
      { field: `${basePath}.category`, oldValue: oldItem?.category, newValue: newItem?.category },
      { field: `${basePath}.requirement`, oldValue: oldItem?.requirement, newValue: newItem?.requirement },
      { field: `${basePath}.ambiguous`, oldValue: oldItem?.ambiguous, newValue: newItem?.ambiguous }
    ]
  );
}

function flattenSourceDocumentDiff(oldValue: any, newValue: any): ClassifiedDiffField[] {
  const oldDoc = oldValue ?? {};
  const newDoc = newValue ?? {};
  return ['filename', 'url', 'retrievalDate', 'effectiveDate']
    .filter((field) => !valuesEquivalent(oldDoc[field], newDoc[field]))
    .map((field) => classifyPolicyDiffField(`sourceDocument.${field}`, oldDoc[field], newDoc[field]));
}

function flattenDiffField(diffField: DiffField): ClassifiedDiffField[] {
  if (diffField.field === 'drug') {
    return flattenDrugDiff(diffField.oldValue, diffField.newValue);
  }
  if (diffField.field === 'diagnosisRequirements') {
    return flattenDiagnosisDiff(diffField.oldValue, diffField.newValue);
  }
  if (diffField.field === 'stepTherapy') {
    return flattenStepTherapyDiff(diffField.oldValue, diffField.newValue);
  }
  if (diffField.field === 'otherRequirements') {
    return flattenOtherRequirementsDiff(diffField.oldValue, diffField.newValue);
  }
  if (diffField.field === 'sourceDocument') {
    return flattenSourceDocumentDiff(diffField.oldValue, diffField.newValue);
  }
  if (diffField.field === 'indications') {
    const oldValues = new Set((diffField.oldValue as string[] | undefined) ?? []);
    const newValues = new Set((diffField.newValue as string[] | undefined) ?? []);
    const allValues = uniqueSorted([...oldValues, ...newValues]);
    return allValues
      .filter((value) => oldValues.has(value) !== newValues.has(value))
      .map((value) =>
        classifyPolicyDiffField(
          `indications.${value}`,
          oldValues.has(value) ? value : undefined,
          newValues.has(value) ? value : undefined
        )
      );
  }

  return [classifyPolicyDiffField(diffField.field, diffField.oldValue, diffField.newValue)];
}

function compareValues(field: string, oldValue: unknown, newValue: unknown): DiffField[] {
  return valuesEquivalent(oldValue, newValue) ? [] : [{ field, oldValue, newValue }];
}

function buildFallbackDiffRecord(policyId: string, fromVersion: number, toVersion: number, oldRecord: PolicyRecord, newRecord: PolicyRecord): DiffRecord {
  return {
    policyId,
    fromVersion,
    toVersion,
    timestamp: new Date().toISOString(),
    changes: [
      ...compareValues('payer', oldRecord.payer, newRecord.payer),
      ...compareValues('plan', oldRecord.plan, newRecord.plan),
      ...compareValues('policyTitle', oldRecord.policyTitle, newRecord.policyTitle),
      ...compareValues('indication', oldRecord.indication, newRecord.indication),
      ...compareValues('coverageStatus', oldRecord.coverageStatus, newRecord.coverageStatus),
      ...compareValues('paRequired', oldRecord.paRequired, newRecord.paRequired),
      ...compareValues('drug', oldRecord.drug, newRecord.drug),
      ...compareValues('indications', oldRecord.indications, newRecord.indications),
      ...compareValues('diagnosisRequirements', oldRecord.diagnosisRequirements, newRecord.diagnosisRequirements),
      ...compareValues('stepTherapy', oldRecord.stepTherapy, newRecord.stepTherapy),
      ...compareValues('otherRequirements', oldRecord.otherRequirements, newRecord.otherRequirements),
      ...compareValues('sourceDocument', oldRecord.sourceDocument, newRecord.sourceDocument)
    ]
  };
}

function summarizeEventChanges(changes: ClassifiedDiffField[]): { summary: string; severityCounts: Record<ChangeSeverity, number> } {
  const severityCounts: Record<ChangeSeverity, number> = {
    cosmetic: 0,
    operational: 0,
    clinical: 0
  };

  for (const change of changes) {
    severityCounts[change.severity] += 1;
  }

  const summaryParts = [
    severityCounts.clinical ? `${severityCounts.clinical} clinical` : '',
    severityCounts.operational ? `${severityCounts.operational} operational` : '',
    severityCounts.cosmetic ? `${severityCounts.cosmetic} cosmetic` : ''
  ].filter(Boolean);

  return {
    summary: summaryParts.length > 0
      ? `Version update introduced ${summaryParts.join(', ')} changes.`
      : 'Version update recorded with no classified field changes.',
    severityCounts
  };
}

function buildChangeEvent(entry: PolicyIndexEntry, fromVersion: number, toVersion: number): PolicyChangeEvent | null {
  const fromPolicy = readPolicyVersion(entry.policyId, fromVersion);
  const toPolicy = readPolicyVersion(entry.policyId, toVersion);
  if (!fromPolicy || !toPolicy) {
    return null;
  }

  const storedDiff = diffPolicyVersions(entry.policyId, fromVersion, toVersion);
  const diffRecord = storedDiff ?? buildFallbackDiffRecord(entry.policyId, fromVersion, toVersion, fromPolicy.record, toPolicy.record);
  const changes = diffRecord.changes.flatMap(flattenDiffField);
  const { summary, severityCounts } = summarizeEventChanges(changes);

  return {
    policyId: entry.policyId,
    policyTitle: entry.title,
    payer: entry.payer,
    drugFamily: entry.drugFamily,
    fromVersion,
    toVersion,
    timestamp: diffRecord.timestamp,
    summary,
    severityCounts,
    changes,
    warning: storedDiff ? undefined : 'Stored diff record was missing; the diff was recomputed from saved policy versions.'
  };
}

export function listPolicyChangeEvents(filters: PolicyChangeFilters = {}): PolicyChangesResponse {
  const entries = listPolicyIndex();
  const payerOptions = uniqueSorted(entries.map((entry) => entry.payer));
  const drugFamilyOptions = uniqueSorted(entries.map((entry) => entry.drugFamily));

  const filteredEntries = entries.filter((entry) => {
    if (filters.policyId && entry.policyId !== filters.policyId) {
      return false;
    }
    if (filters.payer && entry.payer !== filters.payer) {
      return false;
    }
    if (filters.drugFamily && entry.drugFamily !== filters.drugFamily) {
      return false;
    }
    return true;
  });

  const events = filteredEntries
    .flatMap((entry) =>
      listPolicyVersionPairs(entry.policyId)
        .map((pair) => buildChangeEvent(entry, pair.fromVersion, pair.toVersion))
        .filter((event): event is PolicyChangeEvent => Boolean(event))
    )
    .filter((event) => !filters.severity || event.changes.some((change) => change.severity === filters.severity))
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());

  return {
    events,
    filters: {
      payerOptions,
      drugFamilyOptions,
      severityOptions: ['cosmetic', 'operational', 'clinical']
    }
  };
}

export function getPolicyChangeEvent(policyId: string, fromVersion: number, toVersion: number): PolicyChangeEvent | null {
  const entry = listPolicyIndex().find((item) => item.policyId === policyId);
  if (!entry) {
    return null;
  }
  return buildChangeEvent(entry, fromVersion, toVersion);
}

export function buildPolicyVersionDiff(policyId: string, fromVersion: number, toVersion: number): PolicyVersionDiffPayload {
  if (fromVersion === toVersion) {
    throw new Error('Select two different versions to diff.');
  }

  const entry = listPolicyIndex().find((item) => item.policyId === policyId);
  if (!entry) {
    throw new Error('Policy not found.');
  }

  const event = getPolicyChangeEvent(policyId, fromVersion, toVersion);
  if (!event) {
    throw new Error('Version pair not found.');
  }

  const leftText = ensurePolicyTextSnapshot(policyId, fromVersion);
  const rightText = ensurePolicyTextSnapshot(policyId, toVersion);
  if (!leftText || !rightText) {
    throw new Error('Version text snapshot is unavailable.');
  }

  return {
    policyId,
    policyTitle: entry.title,
    payer: entry.payer,
    drugFamily: entry.drugFamily,
    fromVersion,
    toVersion,
    structuredChanges: event.changes,
    textSnapshot: {
      leftLabel: `Version ${fromVersion}`,
      rightLabel: `Version ${toVersion}`,
      leftText,
      rightText
    }
  };
}
