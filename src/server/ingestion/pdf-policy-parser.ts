import { normalizeDrugName } from '../../../data/lookup/drug-aliases.js';

export interface ParsedPdfPolicy {
  title: string;
  issuerName: string;
  effectiveDate: string;
  firstPageText: string;
  drugLabels: string[];
  priorAuth: boolean;
  stepTherapy: boolean;
  quantityLimit: string;
  medicalBenefit: boolean;
  requirementsSummary: string[];
  evidenceSummary: string[];
  notes: string[];
}

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function getFirstPageText(text: string): string {
  const marker = text.indexOf('-- 1 of');
  const slice = marker > 0 ? text.slice(0, marker) : text.slice(0, 8000);
  return compactWhitespace(slice);
}

function getInterestingLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 120);
}

function detectTitle(lines: string[], fileName: string): string {
  const explicitPolicyTitle = lines.find((line) => /policy title/i.test(line));
  if (explicitPolicyTitle) {
    const cleaned = explicitPolicyTitle
      .replace(/policy title[^a-z0-9]*/i, '')
      .replace(/[.…]+/g, ' ')
      .trim();
    if (cleaned) {
      return compactWhitespace(cleaned);
    }
  }

  const candidate = lines.find((line) =>
    /(drug coverage policy|medical benefit drug policy|coverage policy)/i.test(line)
  );
  if (candidate) {
    return compactWhitespace(candidate.replace(/(drug coverage policy|medical benefit drug policy|coverage policy)/ig, '').trim()) || fileName;
  }

  return fileName.replace(/\.pdf$/i, '').trim();
}

function scoreDrugCandidate(candidate: string, title: string, firstPageText: string, lines: string[]): number {
  const normalized = normalizeDrugName(candidate).toLowerCase();
  const raw = candidate.toLowerCase();
  const titleText = title.toLowerCase();
  let score = 0;

  if (titleText.includes(raw) || titleText.includes(normalized)) {
    score += 10;
  }
  if (firstPageText.includes(raw) || firstPageText.includes(normalized)) {
    score += 4;
  }
  if (lines.some((line) => /^[-*•]/.test(line) && (line.toLowerCase().includes(raw) || line.toLowerCase().includes(normalized)))) {
    score += 4;
  }
  return score;
}

function dedupeDrugs(candidates: string[]): string[] {
  const seen = new Set<string>();
  const results: string[] = [];
  for (const candidate of candidates) {
    const normalized = normalizeDrugName(candidate).toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    results.push(candidate);
  }
  return results;
}

function cleanDrugLabel(label: string): string {
  return compactWhitespace(
    label
      .replace(/[®™]/g, '')
      .replace(/\s+[-–]\s+.*$/, '')
      .trim()
  );
}

function extractMedicationHeaderLabels(firstPageText: string): string[] {
  const match = firstPageText.match(/Medication\s+[A-Za-z0-9-]+:\s*([\s\S]{0,1600}?)(?:\*\s*Abrilada|P&T Approval Date|Effective Date|1\. Background:)/i);
  if (!match) {
    return [];
  }

  const rawList = match[1]
    .replace(/\s+/g, ' ')
    .replace(/\*/g, '')
    .replace(/\band\b/g, ',');

  const parts = rawList
    .split(',')
    .map((part) => cleanDrugLabel(part.replace(/\(unbranded[^)]*\)/gi, '').replace(/\([^)]*\)/g, '')))
    .filter((part) => part.length >= 4)
    .filter((part) => part.split(/\s+/).filter(Boolean).length <= 3)
    .filter((part) => !/\b(excluded|coverage|benefits)\b/i.test(part));

  return dedupeDrugs(parts).slice(0, 16);
}

function extractExplicitDrugLabels(lines: string[], firstPageText: string): string[] {
  const headerLabels = extractMedicationHeaderLabels(firstPageText);
  if (headerLabels.length > 0) {
    return headerLabels;
  }

  const labels: string[] = [];
  const rejectPattern = /\b(requirements|diagnosis|dystonia|overactivity|spasm|leukemia|lymphoma|polyangiitis|syndrome|disease|therapy)\b/i;

  for (const line of lines.slice(0, 40)) {
    const bulletMatch = line.match(/^[•*\-]\s*([^()]+)\(([^)]+)\)/);
    if (bulletMatch) {
      const label = cleanDrugLabel(bulletMatch[1]);
      if (!rejectPattern.test(label)) {
        labels.push(label);
      }
      continue;
    }

    const parentheticalMatch = line.match(/^([^()]{3,80})\(([^)]+)\)/);
    if (parentheticalMatch && /[A-Za-z]/.test(parentheticalMatch[1])) {
      const rawLabel = cleanDrugLabel(parentheticalMatch[1]);
      const wordCount = rawLabel.split(/\s+/).filter(Boolean).length;
      const hasTrademark = /[®™]/.test(line);
      const looksLikeShortProductName = wordCount <= 4 && !/[.,:;]/.test(rawLabel);
      if ((hasTrademark || looksLikeShortProductName) && !rejectPattern.test(rawLabel)) {
        labels.push(rawLabel);
      }
    }
  }

  return dedupeDrugs(labels).filter((label) => label.length >= 4).slice(0, 10);
}

function extractDrugCandidates(title: string, firstPageText: string, lines: string[], knownDrugLexicon: string[]): string[] {
  const explicit = extractExplicitDrugLabels(lines, firstPageText);
  if (explicit.length > 0) {
    return explicit;
  }

  const scored = knownDrugLexicon
    .map((drug) => [drug, scoreDrugCandidate(drug, title, firstPageText, lines)] as const)
    .filter(([, score]) => score > 0)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

  const topScore = scored[0]?.[1] ?? 0;
  const accepted = scored
    .filter(([, score]) => score >= Math.max(4, topScore - 2))
    .slice(0, 10)
    .map(([drug]) => drug);

  return dedupeDrugs(accepted);
}

function extractRequirements(lines: string[], text: string): string[] {
  const results: string[] = [];
  const sectionLabels = [
    'General Requirements',
    'Diagnosis-Specific Requirements',
    'Coverage Rationale',
    'Coverage Criteria'
  ];

  for (const label of sectionLabels) {
    const index = lines.findIndex((line) => line.toLowerCase().includes(label.toLowerCase()));
    if (index >= 0) {
      const nextLines = lines.slice(index, index + 12);
      for (const line of nextLines) {
        if (line === label || /^table of contents/i.test(line)) {
          continue;
        }
        if (/^(related|references|background|benefit considerations|instructions)/i.test(line)) {
          break;
        }
        if (line.length > 24) {
          results.push(line);
        }
      }
    }
  }

  if (results.length === 0) {
    const sentences = compactWhitespace(text)
      .split(/(?<=[.?!])\s+/)
      .filter((sentence) => /(coverage|requirement|diagnosis|medically necessary|prior authorization|step therapy)/i.test(sentence));
    results.push(...sentences.slice(0, 4));
  }

  return [...new Set(results)].slice(0, 6);
}

export function parsePdfPolicyText(input: {
  fileName: string;
  text: string;
  issuerName: string;
  effectiveDate: string;
  knownDrugLexicon: string[];
}): ParsedPdfPolicy {
  const lines = getInterestingLines(input.text);
  const firstPageText = getFirstPageText(input.text);
  const title = detectTitle(lines, input.fileName);
  const drugLabels = extractDrugCandidates(title, firstPageText, lines, input.knownDrugLexicon);
  const requirementsSummary = extractRequirements(lines, input.text);
  const priorAuth = /\bprior authorization\b|\bprior auth\b|\bpa\b/i.test(firstPageText);
  const stepTherapy = /\bstep therapy\b|\bst\b/i.test(firstPageText);
  const quantityLimit = /\bquantity limit\b|\bql\b/i.test(firstPageText) ? 'QL signaled in policy text' : '';
  const medicalBenefit = /(medical benefit drug policy|drug coverage policy|medical policy)/i.test(firstPageText);

  return {
    title,
    issuerName: input.issuerName,
    effectiveDate: input.effectiveDate,
    firstPageText,
    drugLabels,
    priorAuth,
    stepTherapy,
    quantityLimit,
    medicalBenefit,
    requirementsSummary,
    evidenceSummary: requirementsSummary.slice(0, 3),
    notes: [
      `Parsed policy title: ${title}`,
      drugLabels.length > 0
        ? `Detected ${drugLabels.length} policy-targeted drug label${drugLabels.length === 1 ? '' : 's'}.`
        : 'No high-confidence drug labels were extracted from the policy title and first-page content.'
    ]
  };
}
