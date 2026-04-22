import { listPolicyIndex, readPolicyVersion } from '../storage/policy-store.js';
import type { PolicyRecord } from '../storage/types.js';

export interface EvidenceSearchResult {
  policyId: string;
  policyTitle: string;
  payer: string;
  drugFamily: string;
  version: number;
  fieldLabel: string;
  snippet: string;
  document: string;
  page: number | null;
  section: string;
}

type ScoredResult = {
  result: EvidenceSearchResult;
  score: number;
};

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function buildResult(
  record: PolicyRecord,
  policyId: string,
  version: number,
  fieldLabel: string,
  snippet: string,
  document: string,
  page: number | null,
  section: string
): EvidenceSearchResult {
  return {
    policyId,
    policyTitle: record.policyTitle ?? record.indication,
    payer: record.payer,
    drugFamily: record.drug.brandName,
    version,
    fieldLabel,
    snippet,
    document,
    page,
    section
  };
}

export function searchPolicyEvidence(query: string): EvidenceSearchResult[] {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) {
    return [];
  }

  const seen = new Set<string>();
  const results: ScoredResult[] = [];

  for (const entry of listPolicyIndex()) {
    const policyVersion = readPolicyVersion(entry.policyId, entry.currentVersion);
    if (!policyVersion) {
      continue;
    }

    const record = policyVersion.record;

    const evidenceEntries = [
      ...record.diagnosisRequirements.map((item) => ({
        fieldLabel: 'Diagnosis Requirement',
        snippet: item.evidenceText,
        document: item.source.document,
        page: item.source.page,
        section: item.source.section
      })),
      ...record.stepTherapy.map((item) => ({
        fieldLabel: 'Step Therapy',
        snippet: item.evidenceText,
        document: item.source.document,
        page: item.source.page,
        section: item.source.section
      })),
      ...record.otherRequirements.map((item) => ({
        fieldLabel: item.category || 'Other Requirement',
        snippet: item.evidenceText,
        document: item.source.document,
        page: item.source.page,
        section: item.source.section
      }))
    ];

    for (const item of evidenceEntries) {
      const snippetMatch = item.snippet.toLowerCase().includes(normalizedQuery);
      const sectionMatch = item.section.toLowerCase().includes(normalizedQuery);
      const fieldMatch = item.fieldLabel.toLowerCase().includes(normalizedQuery);

      if (!snippetMatch && !sectionMatch && !fieldMatch) {
        continue;
      }

      const dedupeKey = `${entry.policyId}:${item.snippet}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);

      const score = (snippetMatch ? 2 : 0) + (sectionMatch ? 1 : 0) + (fieldMatch ? 1 : 0);
      results.push({
        result: buildResult(
          record,
          entry.policyId,
          entry.currentVersion,
          item.fieldLabel,
          item.snippet,
          item.document,
          item.page,
          item.section
        ),
        score
      });
    }
  }

  return results
    .sort((left, right) => right.score - left.score || left.result.policyTitle.localeCompare(right.result.policyTitle))
    .map((entry) => entry.result);
}
