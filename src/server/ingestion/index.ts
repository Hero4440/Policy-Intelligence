import type { Express, Request, Response } from 'express';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { inflateRawSync } from 'zlib';
import { PDFParse } from 'pdf-parse';
import { cleanPolicyText } from '../../extraction/text-cleaner.js';
import { normalizeDrugName } from '../../../data/lookup/drug-aliases.js';
import { PolicyRecordSchema } from '../../../data/schemas/policy.schema.js';
import {
  canonicalDrugKey,
  canonicalIssuerKey,
  canonicalPlanKey,
  inferRuleFacets
} from '../normalization.js';
import { parsePdfPolicyText } from './pdf-policy-parser.js';
import {
  createSourceId,
  ensureIngestionDirectories,
  getIngestionSummary,
  listIngestedSources,
  persistExtractedText,
  persistRawUpload,
  saveIngestionResult,
  type IngestedCoverageSnapshot,
  type IngestedSourceRecord,
  type IngestionSourceKind,
  type IngestionStatus
} from './store.js';
import { invalidatePolicyCatalog } from '../policy-data.js';

type UploadPayload = {
  name: string;
  mimeType: string;
  base64: string;
};

type CsvRow = Record<string, string>;

const issuerPatterns: Array<{ issuer: string; pattern: RegExp }> = [
  { issuer: 'UHC', pattern: /\b(unitedhealthcare|uhc)\b/i },
  { issuer: 'Aetna', pattern: /\baetna\b/i },
  { issuer: 'Cigna', pattern: /\bcigna\b/i },
  { issuer: 'AZ Blue', pattern: /\b(az blue|blue cross blue shield of arizona|bcbs az|bcbsaz)\b/i },
  { issuer: 'Ambetter', pattern: /\bambetter\b/i },
  { issuer: 'Oscar', pattern: /\boscar\b/i }
];

let knownDrugLexicon: string[] | null = null;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');
const packageDir = join(projectRoot, 'docs/hackaathon2/insurance_hackathon_final_data_package');

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function classifySourceKind(fileName: string, mimeType: string, text: string): IngestionSourceKind {
  const lowerName = fileName.toLowerCase();
  const lowerMime = mimeType.toLowerCase();
  if (lowerMime.includes('pdf') || lowerName.endsWith('.pdf')) {
    return 'pdf';
  }
  if (lowerName.endsWith('.jsonl')) {
    return 'jsonl_records';
  }
  if (lowerName.endsWith('.csv') || lowerMime.includes('csv')) {
    return 'csv_formulary';
  }
  if (lowerName.endsWith('.docx') || lowerMime.includes('wordprocessingml') || lowerMime.includes('msword')) {
    return 'docx';
  }
  if (lowerName.endsWith('.json') || lowerMime.includes('json')) {
    if (text.includes('"resourceType"') && text.includes('"Bundle"')) {
      return 'fhir_bundle';
    }
    return 'json_policy';
  }
  return 'unknown';
}

function inferIssuer(fileName: string, text: string): string {
  const haystack = `${fileName}\n${text}`;
  const match = issuerPatterns.find((entry) => entry.pattern.test(haystack));
  return match?.issuer ?? 'Unknown issuer';
}

function inferEffectiveDate(text: string): string {
  const isoMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    return isoMatch[1];
  }
  const yearMatch = text.match(/\b(20\d{2})\b/g);
  return yearMatch?.[0] ?? 'Unknown';
}

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

function asBool(value: string): boolean {
  return value.trim().toLowerCase() === 'true';
}

function getKnownDrugLexicon(): string[] {
  if (knownDrugLexicon) {
    return knownDrugLexicon;
  }

  const seedRows = parseCsv(readFileSync(join(packageDir, 'query_ready_formulary.csv'), 'utf-8'));
  const seedDrugs = seedRows
    .map((row) => compactWhitespace(row.drug_name_display || ''))
    .filter((drug) => drug.length >= 5);
  const structuredDrugs = [
    'adalimumab',
    'Humira',
    'etanercept',
    'Enbrel',
    'infliximab',
    'Remicade',
    'upadacitinib',
    'Rinvoq'
  ];
  knownDrugLexicon = [...new Set([...seedDrugs, ...structuredDrugs])];
  return knownDrugLexicon;
}

function detectDrugs(text: string): string[] {
  const headText = compactWhitespace(text.slice(0, 8000)).toLowerCase();
  const fullText = compactWhitespace(text).toLowerCase();
  const scored = new Map<string, number>();

  for (const drug of getKnownDrugLexicon()) {
    const normalizedDrug = normalizeDrugName(drug).toLowerCase();
    const candidates = [...new Set([drug.toLowerCase(), normalizedDrug])].filter((value) => value.length >= 4);
    let score = 0;

    for (const candidate of candidates) {
      const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
      if (regex.test(headText)) {
        score += 5;
      }
      if (regex.test(fullText)) {
        score += 1;
      }
    }

    if (score > 0) {
      scored.set(drug, score);
    }
  }

  const ranked = [...scored.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  const highestScore = ranked[0]?.[1] ?? 0;
  const minimumScore = highestScore >= 5 ? 5 : Math.max(2, highestScore);

  return ranked
    .filter(([, score]) => score >= minimumScore)
    .slice(0, 8)
    .map(([drug]) => drug);
}

function detectDrugsForSource(fileName: string, text: string): string[] {
  const filenameHits = detectDrugs(fileName).slice(0, 6);
  const textHits = detectDrugs(text);
  return [...new Set([...filenameHits, ...textHits])].slice(0, 8);
}

function detectRequirementSignals(text: string): string[] {
  const normalized = text.toLowerCase();
  const signals: string[] = [];
  if (/\bprior authorization\b|\bprior auth\b|\bpa\b/.test(normalized)) {
    signals.push('Document contains prior authorization language.');
  }
  if (/\bstep therapy\b|\bst\b/.test(normalized)) {
    signals.push('Document contains step therapy language.');
  }
  if (/\bquantity limit\b|\bql\b/.test(normalized)) {
    signals.push('Document contains quantity limit language.');
  }
  if (/\bmedical benefit\b|\bmedical policy\b/.test(normalized)) {
    signals.push('Document appears to describe medical benefit coverage or a medical policy.');
  }
  return signals;
}

function buildSourceRecord(
  sourceId: string,
  file: UploadPayload,
  rawPath: string,
  values: {
    sourceKind: IngestionSourceKind;
    status: IngestionStatus;
    issuerName: string;
    effectiveDate: string;
    detectedDrugs: string[];
    notes: string[];
    extractedTextPath?: string;
    normalizedSnapshotIds: string[];
    summary: string;
  }
): IngestedSourceRecord {
  return {
    id: sourceId,
    fileName: file.name,
    mimeType: file.mimeType,
    sizeBytes: Buffer.from(file.base64, 'base64').length,
    sourceKind: values.sourceKind,
    status: values.status,
    uploadedAt: new Date().toISOString(),
    issuerName: values.issuerName,
    effectiveDate: values.effectiveDate,
    detectedDrugs: values.detectedDrugs,
    notes: values.notes,
    summary: values.summary,
    rawPath,
    extractedTextPath: values.extractedTextPath,
    normalizedSnapshotIds: values.normalizedSnapshotIds
  };
}

function normalizePolicyJson(sourceId: string, fileName: string, payload: unknown): IngestedCoverageSnapshot[] {
  const parsed = PolicyRecordSchema.safeParse(payload);
  if (!parsed.success) {
    return [];
  }

  const policy = parsed.data;
  return [
    {
      snapshotId: `${sourceId}-policy`,
      sourceId,
      planId: `UPLOADED-${policy.payer.toUpperCase()}-${policy.plan.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`,
      issuerName: policy.payer,
      issuerKey: canonicalIssuerKey(policy.payer),
      planName: `${policy.payer} ${policy.plan}`,
      planKey: canonicalPlanKey(policy.payer, `${policy.payer} ${policy.plan}`),
      market: policy.plan,
      metalLevel: '',
      sourceKind: 'uploaded_policy_json',
      sourcePosture: 'deep_medical_policy',
      sourceFile: fileName,
      sourceEffectiveDate: policy.sourceDocument.effectiveDate ?? policy.sourceDocument.retrievalDate,
      primaryDrugLabel: `${policy.drug.brandName} (${policy.drug.genericName})`,
      canonicalDrugKey: canonicalDrugKey(policy.drug.genericName),
      alternateDrugLabels: policy.drug.aliases.slice(0, 6),
      alternateDrugKeys: policy.drug.aliases.slice(0, 6).map((alias) => canonicalDrugKey(alias)),
      coverageLabel: policy.coverageStatus === 'covered'
        ? 'Covered'
        : policy.coverageStatus === 'covered-with-pa'
          ? 'Covered with PA'
          : 'No policy support / excluded',
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
      notes: 'Uploaded structured policy JSON normalized into policy compare shape.',
      confidenceLabel: 'high',
      confidenceRationale: 'Uploaded JSON validated against the structured policy schema.',
      requirementsSummary: [
        ...policy.diagnosisRequirements.map((item) => `Diagnosis: ${item.description}`),
        ...policy.stepTherapy.map((item) => `Step therapy: ${item.drugName} for ${item.duration}`),
        ...policy.otherRequirements.map((item) => `${item.category}: ${item.requirement}`)
      ].slice(0, 8),
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
      ].filter(Boolean),
      structuredPolicy: policy
    }
  ];
}

type CsvSchema = 'formulary_drug_plan' | 'formulary_drugs_only' | 'plans_only' | 'coverage_rules' | 'unknown';

function detectCsvSchema(headers: string[]): CsvSchema {
  const has = (col: string) => headers.includes(col);
  if (has('drug_name_display') && has('plan_id')) return 'formulary_drug_plan';
  if (has('drug_name_display') && !has('plan_id')) return 'formulary_drugs_only';
  if (has('plan_id') && has('issuer_name') && !has('drug_name_display') && !has('rule_type')) return 'plans_only';
  if (has('rule_type') || has('rule_text') || has('rule_name')) return 'coverage_rules';
  if (has('drug_name') || has('generic_name') || has('brand_name')) return 'formulary_drugs_only';
  return 'unknown';
}

function normalizeCsvUpload(sourceId: string, fileName: string, text: string): { snapshots: IngestedCoverageSnapshot[]; notes: string[] } {
  const rows = parseCsv(text);
  if (rows.length === 0) {
    return { snapshots: [], notes: ['CSV file was empty or had no data rows.'] };
  }

  const headers = Object.keys(rows[0]);
  const schema = detectCsvSchema(headers);
  const notes: string[] = [`Detected CSV schema: ${schema} (columns: ${headers.slice(0, 8).join(', ')}${headers.length > 8 ? '...' : ''})`];

  if (schema === 'formulary_drug_plan') {
    const snapshots = rows
      .filter((row) => row.drug_name_display && row.plan_id)
      .slice(0, 500)
      .map((row, index) => buildCsvDrugSnapshot(sourceId, fileName, row, index));
    return { snapshots, notes };
  }

  if (schema === 'formulary_drugs_only') {
    const drugCol = headers.includes('drug_name_display') ? 'drug_name_display' : headers.includes('drug_name') ? 'drug_name' : headers.includes('generic_name') ? 'generic_name' : 'brand_name';
    const issuerCol = headers.includes('issuer_name') ? 'issuer_name' : undefined;
    const snapshots = rows
      .filter((row) => row[drugCol])
      .slice(0, 500)
      .map((row, index) => {
        const issuer = (issuerCol ? row[issuerCol] : '') || inferIssuer(fileName, '');
        const drugLabel = row[drugCol];
        return {
          snapshotId: `${sourceId}-csv-${index}`,
          sourceId,
          planId: row.plan_id || `UPLOADED-CSV-${issuer.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`,
          issuerName: issuer,
          issuerKey: canonicalIssuerKey(issuer),
          planName: row.plan_name || `${issuer} formulary`,
          planKey: canonicalPlanKey(issuer, row.plan_name || `${issuer} formulary`),
          market: row.market || '',
          metalLevel: row.metal_level || '',
          sourceKind: 'uploaded_csv' as const,
          sourcePosture: 'uploaded_normalized' as const,
          sourceFile: fileName,
          sourceEffectiveDate: row.source_effective_date || row.plan_year || 'Unknown',
          primaryDrugLabel: drugLabel,
          canonicalDrugKey: canonicalDrugKey(drugLabel),
          alternateDrugLabels: [] as string[],
          alternateDrugKeys: [] as string[],
          coverageLabel: 'Uploaded formulary row',
          coveredFlag: row.covered_flag ? asBool(row.covered_flag) : true,
          priorAuth: asBool(row.prior_auth || row.prior_authorization || ''),
          stepTherapy: asBool(row.step_therapy || ''),
          quantityLimit: row.quantity_limit || '',
          ageLimit: row.age_limit || '',
          specialtyFlag: asBool(row.specialty_flag || row.specialty || ''),
          nonFormulary: asBool(row.non_formulary || ''),
          medicalBenefit: asBool(row.medical_benefit || ''),
          therapeuticCategory: row.therapeutic_category || row.drug_class || '',
          therapeuticSubcategory: row.therapeutic_subcategory || '',
          notes: `Uploaded CSV (drugs-only schema) normalized into policy compare shape.`,
          confidenceLabel: 'medium' as const,
          confidenceRationale: 'Uploaded CSV row matched a recognized drug formulary schema.',
          requirementsSummary: row.requirements_limits ? [row.requirements_limits] : [],
          normalizedRuleFacets: inferRuleFacets({
            requirementsText: row.requirements_limits || '',
            priorAuth: asBool(row.prior_auth || ''),
            stepTherapy: asBool(row.step_therapy || ''),
            nonFormulary: asBool(row.non_formulary || '')
          }),
          evidenceSummary: [`Imported from uploaded CSV ${fileName}`]
        };
      });
    return { snapshots, notes };
  }

  if (schema === 'plans_only') {
    notes.push('Plans-only CSV stored as metadata. No drug-level snapshots created, but plan metadata is available for enrichment.');
    return { snapshots: [], notes };
  }

  if (schema === 'coverage_rules') {
    notes.push(`Coverage rules CSV with ${rows.length} rule rows. Rules stored for enrichment but no drug-level snapshots created from rules alone.`);
    return { snapshots: [], notes };
  }

  notes.push('CSV columns did not match any recognized schema. Stored as raw upload.');
  return { snapshots: [], notes };
}

function buildCsvDrugSnapshot(sourceId: string, fileName: string, row: CsvRow, index: number): IngestedCoverageSnapshot {
  return {
    snapshotId: `${sourceId}-csv-${index}`,
    sourceId,
    planId: row.plan_id,
    issuerName: row.issuer_name || 'Unknown issuer',
    issuerKey: canonicalIssuerKey(row.issuer_name || 'Unknown issuer'),
    planName: row.plan_name || row.plan_id,
    planKey: canonicalPlanKey(row.issuer_name || 'Unknown issuer', row.plan_name || row.plan_id),
    market: row.market || '',
    metalLevel: row.metal_level || '',
    sourceKind: 'uploaded_csv',
    sourcePosture: 'uploaded_normalized',
    sourceFile: fileName,
    sourceEffectiveDate: row.source_effective_date || row.plan_year || 'Unknown',
    primaryDrugLabel: row.drug_name_display,
    canonicalDrugKey: canonicalDrugKey(row.drug_name_display),
    alternateDrugLabels: [],
    alternateDrugKeys: [],
    coverageLabel: row.covered_flag ? (asBool(row.covered_flag) ? 'Listed on uploaded formulary' : 'Not covered / exception needed') : 'Uploaded formulary row',
    coveredFlag: row.covered_flag ? asBool(row.covered_flag) : !asBool(row.non_formulary || ''),
    priorAuth: asBool(row.prior_auth || ''),
    stepTherapy: asBool(row.step_therapy || ''),
    quantityLimit: row.quantity_limit || '',
    ageLimit: row.age_limit || '',
    specialtyFlag: asBool(row.specialty_flag || ''),
    nonFormulary: asBool(row.non_formulary || ''),
    medicalBenefit: asBool(row.medical_benefit || ''),
    therapeuticCategory: row.therapeutic_category || '',
    therapeuticSubcategory: row.therapeutic_subcategory || '',
    notes: row.notes || 'Uploaded CSV normalized into policy compare shape.',
    confidenceLabel: 'medium',
    confidenceRationale: 'Uploaded CSV row matched the expected formulary schema.',
    requirementsSummary: row.requirements_limits ? [row.requirements_limits] : [],
    normalizedRuleFacets: inferRuleFacets({
      requirementsText: row.requirements_limits || '',
      priorAuth: asBool(row.prior_auth || ''),
      stepTherapy: asBool(row.step_therapy || ''),
      quantityLimit: row.quantity_limit || '',
      ageLimit: row.age_limit || '',
      specialtyFlag: asBool(row.specialty_flag || ''),
      nonFormulary: asBool(row.non_formulary || '')
    }),
    evidenceSummary: [
      `Imported from uploaded CSV ${fileName}`
    ]
  };
}

async function normalizePdfUpload(sourceId: string, fileName: string, bytes: Buffer) {
  const parser = new PDFParse({ data: bytes });
  const result = await parser.getText();
  const cleanedText = cleanPolicyText(result.text);
  const issuerName = inferIssuer(fileName, cleanedText);
  const effectiveDate = inferEffectiveDate(cleanedText);
  const parsedPolicy = parsePdfPolicyText({
    fileName,
    text: cleanedText,
    issuerName,
    effectiveDate,
    knownDrugLexicon: getKnownDrugLexicon()
  });
  const detectedDrugs = parsedPolicy.drugLabels;
  const notes = [
    `Extracted ${result.pages.length} page${result.pages.length === 1 ? '' : 's'} of text for manual or downstream normalization.`,
    ...detectRequirementSignals(cleanedText),
    ...parsedPolicy.notes
  ];

  const extractedTextPath = await persistExtractedText(sourceId, fileName, cleanedText);
  const snapshots: IngestedCoverageSnapshot[] = parsedPolicy.drugLabels.map((drugLabel, index) => ({
    snapshotId: `${sourceId}-pdf-${index}`,
    sourceId,
    planId: `UPLOADED-${parsedPolicy.issuerName.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${drugLabel.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`,
    issuerName: parsedPolicy.issuerName,
    issuerKey: canonicalIssuerKey(parsedPolicy.issuerName),
    planName: parsedPolicy.title,
    planKey: canonicalPlanKey(parsedPolicy.issuerName, parsedPolicy.title),
    market: 'Uploaded policy',
    metalLevel: '',
    sourceKind: 'uploaded_pdf_policy',
    sourcePosture: 'uploaded_normalized',
    sourceFile: fileName,
    sourceEffectiveDate: parsedPolicy.effectiveDate,
    primaryDrugLabel: drugLabel,
    canonicalDrugKey: canonicalDrugKey(drugLabel),
    alternateDrugLabels: [],
    alternateDrugKeys: [],
    coverageLabel: 'Uploaded policy extract',
    coveredFlag: true,
    priorAuth: parsedPolicy.priorAuth,
    stepTherapy: parsedPolicy.stepTherapy,
    quantityLimit: parsedPolicy.quantityLimit,
    ageLimit: '',
    specialtyFlag: false,
    nonFormulary: false,
    medicalBenefit: parsedPolicy.medicalBenefit,
    therapeuticCategory: 'Policy-derived',
    therapeuticSubcategory: '',
    notes: `Provisional snapshot parsed from uploaded PDF policy: ${parsedPolicy.title}`,
    confidenceLabel: 'medium',
    confidenceRationale: 'Derived from policy title, first-page content, and requirement section heuristics. Preserve provenance before using for hard adjudication.',
    requirementsSummary: parsedPolicy.requirementsSummary,
    normalizedRuleFacets: inferRuleFacets({
      requirementsText: `${parsedPolicy.firstPageText} ${parsedPolicy.requirementsSummary.join(' ')}`,
      priorAuth: parsedPolicy.priorAuth,
      stepTherapy: parsedPolicy.stepTherapy,
      quantityLimit: parsedPolicy.quantityLimit
    }),
    evidenceSummary: parsedPolicy.evidenceSummary
  }));
  return {
    extractedTextPath,
    issuerName,
    effectiveDate,
    detectedDrugs,
    notes,
    snapshots
  };
}

function normalizeJsonlUpload(sourceId: string, fileName: string, text: string): { snapshots: IngestedCoverageSnapshot[]; notes: string[] } {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  const notes: string[] = [`JSONL file has ${lines.length} record lines.`];
  const snapshots: IngestedCoverageSnapshot[] = [];
  let parseErrors = 0;
  let snapshotIndex = 0;

  for (let i = 0; i < lines.length && snapshotIndex < 2000; i++) {
    let record: unknown;
    try {
      record = JSON.parse(lines[i]);
    } catch {
      parseErrors++;
      continue;
    }

    const rec = record as Record<string, unknown>;
    const plan = rec.plan as Record<string, string> | undefined;
    const formularyDrugs = rec.formulary_drugs as Array<Record<string, string>> | undefined;

    if (plan && Array.isArray(formularyDrugs)) {
      const planId = plan.plan_id || `JSONL-${sourceId}-${i}`;
      const issuer = plan.issuer_name || 'Unknown issuer';
      const planName = plan.plan_name || planId;

      for (const drug of formularyDrugs.slice(0, 50)) {
        const drugLabel = drug.drug_name_display || drug.drug_name || '';
        if (!drugLabel) continue;

        snapshots.push({
          snapshotId: `${sourceId}-jsonl-${snapshotIndex}`,
          sourceId,
          planId,
          issuerName: issuer,
          issuerKey: canonicalIssuerKey(issuer),
          planName,
          planKey: canonicalPlanKey(issuer, planName),
          market: plan.market || '',
          metalLevel: plan.metal_level || '',
          sourceKind: 'uploaded_jsonl',
          sourcePosture: 'uploaded_normalized',
          sourceFile: fileName,
          sourceEffectiveDate: plan.plan_year || plan.source_effective_date || 'Unknown',
          primaryDrugLabel: drugLabel,
          canonicalDrugKey: canonicalDrugKey(drugLabel),
          alternateDrugLabels: [],
          alternateDrugKeys: [],
          coverageLabel: drug.covered_flag ? (asBool(drug.covered_flag) ? 'Listed on formulary' : 'Not covered') : 'JSONL formulary row',
          coveredFlag: drug.covered_flag ? asBool(drug.covered_flag) : true,
          priorAuth: asBool(drug.prior_auth || drug.prior_authorization || ''),
          stepTherapy: asBool(drug.step_therapy || ''),
          quantityLimit: drug.quantity_limit || '',
          ageLimit: drug.age_limit || '',
          specialtyFlag: asBool(drug.specialty_flag || drug.specialty || ''),
          nonFormulary: asBool(drug.non_formulary || ''),
          medicalBenefit: asBool(drug.medical_benefit || ''),
          therapeuticCategory: drug.therapeutic_category || drug.drug_class || '',
          therapeuticSubcategory: drug.therapeutic_subcategory || '',
          notes: 'JSONL record normalized into policy compare shape.',
          confidenceLabel: 'medium',
          confidenceRationale: 'Parsed from structured JSONL plan record with formulary drug data.',
          requirementsSummary: drug.requirements_limits ? [drug.requirements_limits] : [],
          normalizedRuleFacets: inferRuleFacets({
            requirementsText: drug.requirements_limits || '',
            priorAuth: asBool(drug.prior_auth || ''),
            stepTherapy: asBool(drug.step_therapy || ''),
            nonFormulary: asBool(drug.non_formulary || '')
          }),
          evidenceSummary: [`Imported from JSONL ${fileName}, plan ${planId}`]
        });
        snapshotIndex++;
      }
    } else {
      // Flat JSONL record (one drug per line)
      const drugLabel = (rec as Record<string, string>).drug_name_display || (rec as Record<string, string>).drug_name || '';
      const issuer = (rec as Record<string, string>).issuer_name || inferIssuer(fileName, '');
      if (drugLabel) {
        snapshots.push({
          snapshotId: `${sourceId}-jsonl-${snapshotIndex}`,
          sourceId,
          planId: (rec as Record<string, string>).plan_id || `JSONL-${sourceId}-${i}`,
          issuerName: issuer,
          issuerKey: canonicalIssuerKey(issuer),
          planName: (rec as Record<string, string>).plan_name || `${issuer} plan`,
          planKey: canonicalPlanKey(issuer, (rec as Record<string, string>).plan_name || `${issuer} plan`),
          market: '',
          metalLevel: '',
          sourceKind: 'uploaded_jsonl',
          sourcePosture: 'uploaded_normalized',
          sourceFile: fileName,
          sourceEffectiveDate: 'Unknown',
          primaryDrugLabel: drugLabel,
          canonicalDrugKey: canonicalDrugKey(drugLabel),
          alternateDrugLabels: [],
          alternateDrugKeys: [],
          coverageLabel: 'JSONL record',
          coveredFlag: true,
          priorAuth: asBool((rec as Record<string, string>).prior_auth || ''),
          stepTherapy: asBool((rec as Record<string, string>).step_therapy || ''),
          quantityLimit: '',
          ageLimit: '',
          specialtyFlag: false,
          nonFormulary: false,
          medicalBenefit: false,
          therapeuticCategory: '',
          therapeuticSubcategory: '',
          notes: 'Flat JSONL record normalized into policy compare shape.',
          confidenceLabel: 'medium',
          confidenceRationale: 'Parsed from flat JSONL record.',
          requirementsSummary: [],
          normalizedRuleFacets: [],
          evidenceSummary: [`Imported from JSONL ${fileName}`]
        });
        snapshotIndex++;
      }
    }
  }

  if (parseErrors > 0) {
    notes.push(`Skipped ${parseErrors} lines with JSON parse errors.`);
  }
  notes.push(`Created ${snapshots.length} drug snapshots from JSONL records.`);
  return { snapshots, notes };
}

function extractDocxText(bytes: Buffer): string {
  // DOCX is a ZIP containing word/document.xml.
  // Minimal ZIP + XML extraction without external dependencies.
  const text: string[] = [];

  // Find PK\x03\x04 local file headers and locate word/document.xml
  const pkSig = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  let offset = 0;
  while (offset < bytes.length - 30) {
    const sigPos = bytes.indexOf(pkSig, offset);
    if (sigPos < 0) break;

    const nameLen = bytes.readUInt16LE(sigPos + 26);
    const extraLen = bytes.readUInt16LE(sigPos + 28);
    const compressedSize = bytes.readUInt32LE(sigPos + 18);
    const compressionMethod = bytes.readUInt16LE(sigPos + 8);
    const dataStart = sigPos + 30 + nameLen + extraLen;
    const name = bytes.toString('utf-8', sigPos + 30, sigPos + 30 + nameLen);

    if (name === 'word/document.xml') {
      let xml: string;
      if (compressionMethod === 0) {
        xml = bytes.toString('utf-8', dataStart, dataStart + compressedSize);
      } else if (compressionMethod === 8) {
        // Deflate compressed — use Node's built-in zlib
        try {
          const compressed = bytes.subarray(dataStart, dataStart + compressedSize);
          xml = inflateRawSync(compressed).toString('utf-8');
        } catch {
          xml = '';
        }
      } else {
        xml = '';
      }

      if (xml) {
        const stripped = xml
          .replace(/<w:br[^>]*\/>/gi, '\n')
          .replace(/<\/w:p>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
        text.push(stripped);
      }
      break;
    }

    offset = dataStart + compressedSize;
    if (offset <= sigPos) break; // prevent infinite loop
  }

  // Fallback: scan for w:t text fragments in raw bytes
  if (text.length === 0) {
    const rawStr = bytes.toString('utf-8');
    // Extract text fragments between XML tags
    const fragments = rawStr.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
    if (fragments) {
      text.push(
        fragments
          .map((f) => f.replace(/<[^>]*>/g, ''))
          .join(' ')
      );
    }
  }

  return text.join('\n').replace(/\s+/g, ' ').trim();
}

function normalizeDocxUpload(sourceId: string, fileName: string, bytes: Buffer): {
  snapshots: IngestedCoverageSnapshot[];
  notes: string[];
  issuerName: string;
  effectiveDate: string;
  detectedDrugs: string[];
  extractedTextPath?: string;
} {
  const extractedText = extractDocxText(bytes);
  const notes: string[] = [];

  if (!extractedText || extractedText.length < 50) {
    notes.push('DOCX text extraction yielded minimal content. File stored for manual review.');
    return {
      snapshots: [],
      notes,
      issuerName: inferIssuer(fileName, ''),
      effectiveDate: 'Unknown',
      detectedDrugs: []
    };
  }

  notes.push(`Extracted ${extractedText.length} characters of text from DOCX.`);

  const issuerName = inferIssuer(fileName, extractedText);
  const effectiveDate = inferEffectiveDate(extractedText);
  const parsedPolicy = parsePdfPolicyText({
    fileName,
    text: extractedText,
    issuerName,
    effectiveDate,
    knownDrugLexicon: getKnownDrugLexicon()
  });
  const detectedDrugs = parsedPolicy.drugLabels;
  notes.push(
    ...detectRequirementSignals(extractedText),
    ...parsedPolicy.notes
  );

  const snapshots: IngestedCoverageSnapshot[] = parsedPolicy.drugLabels.map((drugLabel, index) => ({
    snapshotId: `${sourceId}-docx-${index}`,
    sourceId,
    planId: `UPLOADED-${parsedPolicy.issuerName.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${drugLabel.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}`,
    issuerName: parsedPolicy.issuerName,
    issuerKey: canonicalIssuerKey(parsedPolicy.issuerName),
    planName: parsedPolicy.title,
    planKey: canonicalPlanKey(parsedPolicy.issuerName, parsedPolicy.title),
    market: 'Uploaded policy',
    metalLevel: '',
    sourceKind: 'uploaded_docx_policy' as const,
    sourcePosture: 'uploaded_normalized' as const,
    sourceFile: fileName,
    sourceEffectiveDate: parsedPolicy.effectiveDate,
    primaryDrugLabel: drugLabel,
    canonicalDrugKey: canonicalDrugKey(drugLabel),
    alternateDrugLabels: [],
    alternateDrugKeys: [],
    coverageLabel: 'Uploaded DOCX policy extract',
    coveredFlag: true,
    priorAuth: parsedPolicy.priorAuth,
    stepTherapy: parsedPolicy.stepTherapy,
    quantityLimit: parsedPolicy.quantityLimit,
    ageLimit: '',
    specialtyFlag: false,
    nonFormulary: false,
    medicalBenefit: parsedPolicy.medicalBenefit,
    therapeuticCategory: 'Policy-derived',
    therapeuticSubcategory: '',
    notes: `Provisional snapshot parsed from uploaded DOCX policy: ${parsedPolicy.title}`,
    confidenceLabel: 'medium' as const,
    confidenceRationale: 'Derived from DOCX text extraction and policy heuristics.',
    requirementsSummary: parsedPolicy.requirementsSummary,
    normalizedRuleFacets: inferRuleFacets({
      requirementsText: `${parsedPolicy.firstPageText} ${parsedPolicy.requirementsSummary.join(' ')}`,
      priorAuth: parsedPolicy.priorAuth,
      stepTherapy: parsedPolicy.stepTherapy,
      quantityLimit: parsedPolicy.quantityLimit
    }),
    evidenceSummary: parsedPolicy.evidenceSummary
  }));

  return {
    snapshots,
    notes,
    issuerName,
    effectiveDate,
    detectedDrugs,
    extractedTextPath: undefined // Text persisted by caller
  };
}

export async function ingestOneFile(file: UploadPayload) {
  const sourceId = createSourceId();
  const rawBytes = Buffer.from(file.base64, 'base64');
  const rawText = rawBytes.toString('utf-8');
  const sourceKind = classifySourceKind(file.name, file.mimeType, rawText);

  await ensureIngestionDirectories();
  const rawPath = await persistRawUpload(sourceId, file.name, rawBytes);

  let snapshots: IngestedCoverageSnapshot[] = [];
  let status: IngestionStatus = 'stored';
  let issuerName = inferIssuer(file.name, rawText);
  let effectiveDate = inferEffectiveDate(rawText);
  let detectedDrugs: string[] = [];
  let notes: string[] = [];
  let extractedTextPath: string | undefined;

  if (sourceKind === 'json_policy') {
    try {
      snapshots = normalizePolicyJson(sourceId, file.name, JSON.parse(rawText));
      status = snapshots.length > 0 ? 'normalized' : 'rejected';
      if (snapshots[0]) {
        issuerName = snapshots[0].issuerName;
        effectiveDate = snapshots[0].sourceEffectiveDate;
        detectedDrugs = [snapshots[0].primaryDrugLabel];
        notes.push('Structured policy JSON validated and normalized.');
      }
    } catch (error) {
      status = 'rejected';
      notes.push(error instanceof Error ? error.message : 'Invalid JSON policy payload.');
    }
  } else if (sourceKind === 'csv_formulary') {
    const csv = normalizeCsvUpload(sourceId, file.name, rawText);
    snapshots = csv.snapshots;
    notes.push(...csv.notes);
    status = snapshots.length > 0 ? 'normalized' : 'stored';
    detectedDrugs = [...new Set(snapshots.slice(0, 8).map((snapshot) => snapshot.primaryDrugLabel))];
    issuerName = snapshots[0]?.issuerName ?? issuerName;
    effectiveDate = snapshots[0]?.sourceEffectiveDate ?? effectiveDate;
    notes.push(
      snapshots.length > 0
        ? `Normalized ${snapshots.length} row${snapshots.length === 1 ? '' : 's'} from uploaded CSV.`
        : 'CSV stored as metadata. Schema may be plans-only, rules-only, or unrecognized.'
    );
  } else if (sourceKind === 'jsonl_records') {
    const jsonl = normalizeJsonlUpload(sourceId, file.name, rawText);
    snapshots = jsonl.snapshots;
    notes.push(...jsonl.notes);
    status = snapshots.length > 0 ? 'normalized' : 'stored';
    detectedDrugs = [...new Set(snapshots.slice(0, 8).map((snapshot) => snapshot.primaryDrugLabel))];
    issuerName = snapshots[0]?.issuerName ?? issuerName;
    effectiveDate = snapshots[0]?.sourceEffectiveDate ?? effectiveDate;
  } else if (sourceKind === 'docx') {
    const docxText = extractDocxText(rawBytes);
    if (docxText.length > 50) {
      extractedTextPath = await persistExtractedText(sourceId, file.name, docxText);
    }
    const docx = normalizeDocxUpload(sourceId, file.name, rawBytes);
    snapshots = docx.snapshots;
    notes.push(...docx.notes);
    status = snapshots.length > 0 ? 'normalized' : 'partial';
    issuerName = docx.issuerName;
    effectiveDate = docx.effectiveDate;
    detectedDrugs = docx.detectedDrugs;
  } else if (sourceKind === 'pdf') {
    const pdf = await normalizePdfUpload(sourceId, file.name, rawBytes);
    snapshots = pdf.snapshots;
    status = snapshots.length > 0 ? 'normalized' : 'partial';
    issuerName = pdf.issuerName;
    effectiveDate = pdf.effectiveDate;
    detectedDrugs = pdf.detectedDrugs;
    notes = pdf.notes;
    extractedTextPath = pdf.extractedTextPath;
  } else if (sourceKind === 'fhir_bundle') {
    status = 'stored';
    issuerName = 'Clinical patient bundle';
    effectiveDate = 'N/A';
    notes.push('FHIR patient bundles are supported separately from payer policy normalization.');
  } else {
    status = 'stored';
    detectedDrugs = detectDrugsForSource(file.name, rawText);
    notes.push('Stored raw upload. No normalization adapter matched this file yet.');
  }

  const source = buildSourceRecord(sourceId, file, rawPath, {
    sourceKind,
    status,
    issuerName,
    effectiveDate,
    detectedDrugs,
    notes,
    extractedTextPath,
    normalizedSnapshotIds: snapshots.map((snapshot) => snapshot.snapshotId),
    summary:
      status === 'normalized'
        ? `${file.name} normalized into ${snapshots.length} searchable record${snapshots.length === 1 ? '' : 's'}.`
        : status === 'partial'
          ? `${file.name} ingested as a source artifact and queued for deeper normalization.`
          : status === 'stored'
            ? `${file.name} stored with metadata only.`
            : `${file.name} was rejected during normalization.`
  });

  saveIngestionResult(source, snapshots);
  if (snapshots.length > 0) {
    invalidatePolicyCatalog();
  }

  return {
    source,
    snapshotCount: snapshots.length
  };
}

export async function ingestFiles(files: UploadPayload[]) {
  const results = [];
  for (const file of files) {
    results.push(await ingestOneFile(file));
  }

  return {
    accepted: results,
    summary: getIngestionSummary()
  };
}

export function registerIngestionRoutes(app: Express) {
  app.post('/api/ingestion/upload', async (req: Request, res: Response) => {
    const { files } = req.body as { files?: UploadPayload[] };
    if (!Array.isArray(files) || files.length === 0) {
      res.status(400).json({ error: 'At least one file is required.' });
      return;
    }

    try {
      res.json(await ingestFiles(files));
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  });

  app.get('/api/ingestion/sources', (req: Request, res: Response) => {
    res.json({
      sources: listIngestedSources(),
      summary: getIngestionSummary()
    });
  });
}
