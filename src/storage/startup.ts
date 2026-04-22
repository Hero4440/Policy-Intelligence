import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  derivePolicyId,
  ensurePolicyTextSnapshot,
  getCurrentPolicyCache,
  getCurrentPolicyFromCache,
  replaceCurrentPolicyCache
} from './policy-store.js';
import {
  POLICIES_STRUCTURED_DIR,
  POLICY_INDEX_PATH,
  ensureDataDirectories
} from './paths.js';
import type { PolicyIndex, PolicyIndexEntry, PolicyRecord, PolicyVersion } from './types.js';

function rebuildAndSaveIndex(entries: PolicyIndexEntry[]): void {
  const index: PolicyIndex = {
    updatedAt: new Date().toISOString(),
    policies: [...entries].sort((a, b) => a.policyId.localeCompare(b.policyId))
  };
  const tmpPath = `${POLICY_INDEX_PATH}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(index, null, 2), 'utf-8');
  renameSync(tmpPath, POLICY_INDEX_PATH);
}

export function loadStorageOnStartup(): void {
  ensureDataDirectories();

  const structuredFiles = existsSync(POLICIES_STRUCTURED_DIR)
    ? readdirSync(POLICIES_STRUCTURED_DIR)
    : [];
  const latestPolicies = new Map<
    string,
    { version: number; policyVersion: PolicyVersion; fileName: string }
  >();
  const versionsByPolicyId = new Map<string, number[]>();

  for (const fileName of structuredFiles) {
    const match = /^(?!.*_diff_v)(.+)_v(\d+)\.json$/.exec(fileName);
    if (!match) {
      continue;
    }

    const [, policyId, versionText] = match;
    const version = Number(versionText);
    const filePath = join(POLICIES_STRUCTURED_DIR, fileName);

    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf-8')) as PolicyVersion;
      const existing = latestPolicies.get(policyId);
      const knownVersions = versionsByPolicyId.get(policyId) ?? [];
      knownVersions.push(version);
      versionsByPolicyId.set(policyId, knownVersions);
      if (!existing || version > existing.version) {
        latestPolicies.set(policyId, { version, policyVersion: parsed, fileName });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[startup] skipping malformed file:', fileName, message);
    }
  }

  const cacheEntries: Array<[string, PolicyRecord]> = [];
  const indexEntries: PolicyIndexEntry[] = [];

  for (const [policyId, { version, policyVersion, fileName }] of latestPolicies.entries()) {
    const record = policyVersion.record;
    cacheEntries.push([policyId, record]);

    const versionNumbers = [...(versionsByPolicyId.get(policyId) ?? [])].sort((a, b) => a - b);
    for (const versionNumber of versionNumbers) {
      ensurePolicyTextSnapshot(policyId, versionNumber);
    }

    indexEntries.push({
      policyId: derivePolicyId(record),
      payer: record.payer,
      title: record.policyTitle ?? record.indication,
      drugFamily: record.drug.brandName,
      versions: versionNumbers,
      currentVersion: version,
      currentVersionFile: fileName,
      lastUpdatedAt: policyVersion.savedAt
    });
  }

  replaceCurrentPolicyCache(cacheEntries);
  rebuildAndSaveIndex(indexEntries);
  console.error('[startup] index rebuilt:', indexEntries.length, 'policies');
  console.error('[startup] loaded:', cacheEntries.length, 'policies from disk');
}

export function getPoliciesFromMemory(): PolicyRecord[] {
  return getCurrentPolicyCache();
}

export function getPolicyFromMemory(policyId: string): PolicyRecord | undefined {
  return getCurrentPolicyFromCache(policyId);
}
