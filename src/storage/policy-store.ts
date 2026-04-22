import {
  copyFileSync,
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync
} from 'fs';
import { join } from 'path';
import type { PolicyRecord } from './types.js';
import type { DiffField, DiffRecord, PolicyIndex, PolicyIndexEntry, PolicyVersion } from './types.js';
import {
  POLICIES_RAW_DIR,
  POLICIES_STRUCTURED_DIR,
  POLICY_INDEX_PATH,
  ensureDataDirectories
} from './paths.js';

const currentPolicyCache = new Map<string, PolicyRecord>();

function now(): string {
  return new Date().toISOString();
}

function structuredPolicyPath(policyId: string, version: number): string {
  return join(POLICIES_STRUCTURED_DIR, `${policyId}_v${version}.json`);
}

function diffPath(policyId: string, fromVersion: number, toVersion: number): string {
  return join(POLICIES_STRUCTURED_DIR, `${policyId}_diff_v${fromVersion}_to_v${toVersion}.json`);
}

function textSnapshotPath(policyId: string, version: number): string {
  return join(POLICIES_STRUCTURED_DIR, `${policyId}_text_v${version}.txt`);
}

function safeReadJson<T>(filePath: string, logPrefix: string): T | null {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`${logPrefix} malformed file:`, filePath, message);
    return null;
  }
}

function saveIndex(index: PolicyIndex): void {
  const tmpPath = `${POLICY_INDEX_PATH}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(index, null, 2), 'utf-8');
  renameSync(tmpPath, POLICY_INDEX_PATH);
}

export function loadIndex(): PolicyIndex {
  ensureDataDirectories();
  const index = safeReadJson<PolicyIndex>(POLICY_INDEX_PATH, '[policy-store]');
  if (!index) {
    return { updatedAt: now(), policies: [] };
  }
  return index;
}

function compareValues(field: string, oldValue: unknown, newValue: unknown): DiffField[] {
  return JSON.stringify(oldValue) === JSON.stringify(newValue)
    ? []
    : [{ field, oldValue, newValue }];
}

function computeDiff(oldRecord: PolicyRecord, newRecord: PolicyRecord): DiffField[] {
  return [
    ...compareValues('payer', oldRecord.payer, newRecord.payer),
    ...compareValues('plan', oldRecord.plan, newRecord.plan),
    ...compareValues('policyTitle', oldRecord.policyTitle, newRecord.policyTitle),
    ...compareValues('indication', oldRecord.indication, newRecord.indication),
    ...compareValues('coverageStatus', oldRecord.coverageStatus, newRecord.coverageStatus),
    ...compareValues('paRequired', oldRecord.paRequired, newRecord.paRequired),
    ...compareValues('drug', oldRecord.drug, newRecord.drug),
    ...compareValues('indications', oldRecord.indications, newRecord.indications),
    ...compareValues(
      'diagnosisRequirements',
      oldRecord.diagnosisRequirements,
      newRecord.diagnosisRequirements
    ),
    ...compareValues('stepTherapy', oldRecord.stepTherapy, newRecord.stepTherapy),
    ...compareValues('otherRequirements', oldRecord.otherRequirements, newRecord.otherRequirements),
    ...compareValues('sourceDocument', oldRecord.sourceDocument, newRecord.sourceDocument)
  ];
}

function renderPolicyTextSnapshot(record: PolicyRecord): string {
  const preferredProducts = (record.drug.products ?? [])
    .filter((product) => product.tier === 'preferred')
    .map((product) => product.name);
  const nonPreferredProducts = (record.drug.products ?? [])
    .filter((product) => product.tier === 'non-preferred')
    .map((product) => product.name);

  const sections = [
    `Policy Title: ${record.policyTitle ?? record.indication}`,
    `Payer: ${record.payer}`,
    `Plan: ${record.plan}`,
    `Drug Family: ${record.drug.brandName} (${record.drug.genericName})`,
    `Coverage Status: ${record.coverageStatus}`,
    `Prior Auth Required: ${record.paRequired ? 'Yes' : 'No'}`,
    `Indication: ${record.indication}`,
    `Effective Date: ${record.sourceDocument.effectiveDate ?? 'Not specified'}`,
    `Source File: ${record.sourceDocument.filename}`,
    '',
    'Preferred Products:',
    preferredProducts.length > 0 ? preferredProducts.map((product) => `- ${product}`).join('\n') : '- None listed',
    '',
    'Non-Preferred Products:',
    nonPreferredProducts.length > 0 ? nonPreferredProducts.map((product) => `- ${product}`).join('\n') : '- None listed',
    '',
    'Covered Indications:',
    (record.indications ?? []).length > 0
      ? (record.indications ?? []).map((item) => `- ${item}`).join('\n')
      : `- ${record.indication}`,
    '',
    'Diagnosis Requirements:',
    record.diagnosisRequirements.length > 0
      ? record.diagnosisRequirements
        .map((requirement) => {
          const codes = requirement.icd10Codes.length > 0 ? ` (${requirement.icd10Codes.join(', ')})` : '';
          return `- ${requirement.description}${codes}`;
        })
        .join('\n')
      : '- None listed',
    '',
    'Step Therapy:',
    record.stepTherapy.length > 0
      ? record.stepTherapy
        .map((entry) =>
          `- ${entry.drugName}: ${entry.failureCriteria}; duration ${entry.duration}${entry.dosage ? `; dosage ${entry.dosage}` : ''}`
        )
        .join('\n')
      : '- None listed',
    '',
    'Other Requirements:',
    record.otherRequirements.length > 0
      ? record.otherRequirements
        .map((entry) => `- ${entry.category}: ${entry.requirement}`)
        .join('\n')
      : '- None listed'
  ];

  return sections.join('\n').trim();
}

function buildIndexEntry(
  policyId: string,
  record: PolicyRecord,
  version: number,
  existing?: PolicyIndexEntry
): PolicyIndexEntry {
  const versions = existing ? [...existing.versions, version] : [version];
  const dedupedVersions = [...new Set(versions)].sort((a, b) => a - b);
  return {
    policyId,
    payer: record.payer,
    title: record.policyTitle ?? record.indication,
    drugFamily: record.drug.brandName,
    versions: dedupedVersions,
    currentVersion: version,
    currentVersionFile: `${policyId}_v${version}.json`,
    lastUpdatedAt: now()
  };
}

export function derivePolicyId(record: PolicyRecord): string {
  const payer = record.payer.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const drug = record.drug.brandName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${payer}-${drug}`;
}

export function replaceCurrentPolicyCache(records: Iterable<[string, PolicyRecord]>): void {
  currentPolicyCache.clear();
  for (const [policyId, record] of records) {
    currentPolicyCache.set(policyId, record);
  }
}

export function setCurrentPolicyCache(policyId: string, record: PolicyRecord): void {
  currentPolicyCache.set(policyId, record);
}

export function getCurrentPolicyCache(): PolicyRecord[] {
  return [...currentPolicyCache.values()];
}

export function getCurrentPolicyFromCache(policyId: string): PolicyRecord | undefined {
  return currentPolicyCache.get(policyId);
}

export function readPolicyVersion(policyId: string, version: number): PolicyVersion | null {
  const filePath = structuredPolicyPath(policyId, version);
  return safeReadJson<PolicyVersion>(filePath, '[policy-store]');
}

export function readPolicyTextSnapshot(policyId: string, version: number): string | null {
  const filePath = textSnapshotPath(policyId, version);
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return readFileSync(filePath, 'utf-8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[policy-store] failed to read text snapshot:', filePath, message);
    return null;
  }
}

export function ensurePolicyTextSnapshot(policyId: string, version: number): string | null {
  ensureDataDirectories();

  const existing = readPolicyTextSnapshot(policyId, version);
  if (existing) {
    return existing;
  }

  const policyVersion = readPolicyVersion(policyId, version);
  if (!policyVersion) {
    return null;
  }

  const snapshot = renderPolicyTextSnapshot(policyVersion.record);
  writeFileSync(textSnapshotPath(policyId, version), snapshot, 'utf-8');
  return snapshot;
}

export function listPolicyVersionPairs(policyId: string): Array<{ fromVersion: number; toVersion: number }> {
  const entry = loadIndex().policies.find((item) => item.policyId === policyId);
  if (!entry || entry.versions.length < 2) {
    return [];
  }

  const pairs: Array<{ fromVersion: number; toVersion: number }> = [];
  for (let index = 1; index < entry.versions.length; index += 1) {
    pairs.push({
      fromVersion: entry.versions[index - 1],
      toVersion: entry.versions[index]
    });
  }
  return pairs;
}

export function writePolicyVersion(record: PolicyRecord): {
  version: number;
  filePath: string;
  diffRecord: DiffRecord | null;
} {
  ensureDataDirectories();

  const policyId = derivePolicyId(record);
  const index = loadIndex();
  const existingEntry = index.policies.find((entry) => entry.policyId === policyId);
  const version = existingEntry ? existingEntry.currentVersion + 1 : 1;
  const fileName = `${policyId}_v${version}.json`;
  const filePath = structuredPolicyPath(policyId, version);
  const savedAt = now();

  const policyVersion: PolicyVersion = {
    policyId,
    version,
    fileName,
    savedAt,
    record
  };

  writeFileSync(filePath, JSON.stringify(policyVersion, null, 2), 'utf-8');
  writeFileSync(textSnapshotPath(policyId, version), renderPolicyTextSnapshot(record), 'utf-8');

  let diffRecord: DiffRecord | null = null;
  if (version > 1) {
    const previousVersion = readPolicyVersion(policyId, version - 1);
    if (previousVersion) {
      diffRecord = {
        policyId,
        fromVersion: version - 1,
        toVersion: version,
        timestamp: savedAt,
        changes: computeDiff(previousVersion.record, record)
      };
      writeFileSync(
        diffPath(policyId, version - 1, version),
        JSON.stringify(diffRecord, null, 2),
        'utf-8'
      );
    }
  }

  const nextEntry = buildIndexEntry(policyId, record, version, existingEntry);
  index.updatedAt = savedAt;
  index.policies = index.policies.filter((entry) => entry.policyId !== policyId);
  index.policies.push(nextEntry);
  index.policies.sort((a, b) => a.policyId.localeCompare(b.policyId));
  saveIndex(index);
  setCurrentPolicyCache(policyId, record);

  return { version, filePath, diffRecord };
}

export function readCurrentPolicy(policyId: string): PolicyRecord | null {
  const cached = getCurrentPolicyFromCache(policyId);
  if (cached) {
    return cached;
  }

  const index = loadIndex();
  const entry = index.policies.find((policy) => policy.policyId === policyId);
  if (!entry) {
    return null;
  }

  const currentVersion = safeReadJson<PolicyVersion>(
    join(POLICIES_STRUCTURED_DIR, entry.currentVersionFile),
    '[policy-store]'
  );
  if (!currentVersion) {
    return null;
  }

  setCurrentPolicyCache(policyId, currentVersion.record);
  return currentVersion.record;
}

export function listPolicyIndex(): PolicyIndexEntry[] {
  return loadIndex().policies;
}

export function diffPolicyVersions(
  policyId: string,
  fromVersion: number,
  toVersion: number
): DiffRecord | null {
  return safeReadJson<DiffRecord>(diffPath(policyId, fromVersion, toVersion), '[policy-store]');
}

export function rawPolicyPath(policyId: string, originalFileName: string): string {
  const sanitizedName = originalFileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  return join(POLICIES_RAW_DIR, `${policyId}-${sanitizedName}`);
}

export function registerRawPolicy(
  sourceFilePath: string,
  policyId: string,
  originalFileName: string
): string {
  ensureDataDirectories();
  const targetPath = rawPolicyPath(policyId, originalFileName);
  copyFileSync(sourceFilePath, targetPath);
  return targetPath;
}
