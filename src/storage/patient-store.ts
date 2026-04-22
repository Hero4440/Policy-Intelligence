import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import demoPatient01 from '../../data/patients/demo-patients/patient-01-full-match.json';
import demoPatient02 from '../../data/patients/demo-patients/patient-02-partial-match.json';
import demoPatient03 from '../../data/patients/demo-patients/patient-03-poor-match.json';
import { extractPatientData } from '../mcp/fhir/extractors.js';
import { PATIENTS_DIR, ensureDataDirectories } from './paths.js';
import type { PatientCase, PatientDocumentRecord, PatientFactRecord } from './types.js';

type DocumentExtractionResult = {
  summary: string;
  facts: PatientFactRecord[];
  patientName?: string;
  payer?: string;
  diagnosis?: string;
  requestedDrug?: string;
  documentType: string;
};

function now(): string {
  return new Date().toISOString();
}

function factId(): string {
  return crypto.randomUUID();
}

function documentId(): string {
  return crypto.randomUUID();
}

function extractPatientNameFromBundle(bundle: any): string | undefined {
  const patientResource = bundle?.entry?.find((entry: any) => entry?.resource?.resourceType === 'Patient')?.resource;
  const name = patientResource?.name?.[0];
  if (!name) {
    return undefined;
  }

  const given = Array.isArray(name.given) ? name.given.join(' ') : '';
  const family = name.family ?? '';
  const fullName = `${given} ${family}`.trim();
  return fullName || undefined;
}

function upgradeLegacyCase(patientCase: PatientCase): PatientCase {
  const upgradedCase: PatientCase = {
    ...patientCase,
    documentFiles: patientCase.documentFiles ?? [],
    documents: patientCase.documents ?? (patientCase.documentFiles ?? []).map((fileName) => ({
      documentId: crypto.randomUUID(),
      fileName,
      documentType: 'uploaded_document',
      contentType: 'application/octet-stream',
      storedAt: patientCase.updatedAt ?? patientCase.createdAt,
      summary: 'Legacy uploaded document',
      factCount: 0
    })),
    extractedFacts: patientCase.extractedFacts ?? []
  };

  upgradedCase.status = upgradedCase.status === 'complete' ? 'complete' : deriveCaseStatus(upgradedCase);
  return upgradedCase;
}

function safeReadCase(caseId: string): PatientCase | null {
  const filePath = join(casePath(caseId), 'case.json');
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf-8')) as PatientCase;
    return upgradeLegacyCase(parsed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[patient-store] malformed file:', filePath, message);
    return null;
  }
}

function writeCaseRecord(patientCase: PatientCase): void {
  writeFileSync(
    join(casePath(patientCase.caseId), 'case.json'),
    JSON.stringify(patientCase, null, 2),
    'utf-8'
  );
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

function buildFact(
  sourceDocumentId: string,
  category: PatientFactRecord['category'],
  label: string,
  value: string,
  evidenceSnippet: string | undefined,
  confidence: PatientFactRecord['confidence']
): PatientFactRecord {
  return {
    factId: factId(),
    category,
    label,
    value,
    sourceDocumentId,
    evidenceSnippet,
    confidence
  };
}

function extractFactsFromBundle(bundle: any, sourceDocumentId: string): DocumentExtractionResult {
  const extracted = extractPatientData(bundle);
  const facts: PatientFactRecord[] = [];

  for (const diagnosis of extracted.diagnoses) {
    facts.push(
      buildFact(
        sourceDocumentId,
        'diagnosis',
        diagnosis.code,
        diagnosis.display || diagnosis.code,
        diagnosis.display,
        'high'
      )
    );
  }

  for (const medication of extracted.medications) {
    facts.push(
      buildFact(
        sourceDocumentId,
        'medication',
        medication.normalizedName || medication.name,
        medication.name,
        medication.status,
        'high'
      )
    );
  }

  if (extracted.coverage?.payerName) {
    facts.push(
      buildFact(
        sourceDocumentId,
        'coverage',
        'payer',
        extracted.coverage.payerName,
        extracted.coverage.planName,
        'high'
      )
    );
  }

  const firstMedication = extracted.medications[0]?.normalizedName || extracted.medications[0]?.name;
  return {
    summary: `${extractPatientNameFromBundle(bundle) ?? 'Patient'} · ${extracted.diagnoses.length} diagnoses · ${extracted.medications.length} medications`,
    facts,
    patientName: extractPatientNameFromBundle(bundle),
    payer: extracted.coverage?.payerName,
    diagnosis: extracted.diagnoses[0]?.display ?? extracted.diagnoses[0]?.code,
    requestedDrug: firstMedication,
    documentType: 'fhir_bundle'
  };
}

function matchField(text: string, expression: RegExp): string | undefined {
  const match = expression.exec(text);
  const value = match?.[1]?.trim();
  return value || undefined;
}

function matchSecondField(text: string, expression: RegExp): string | undefined {
  const match = expression.exec(text);
  const value = match?.[2]?.trim();
  return value || undefined;
}

function extractFactsFromText(text: string, sourceDocumentId: string): DocumentExtractionResult {
  const facts: PatientFactRecord[] = [];
  const diagnosis = matchField(text, /diagnosis\s*[:\-]\s*(.+)/i);
  const requestedDrug = matchField(text, /requested drug\s*[:\-]\s*(.+)/i);
  const payer = matchSecondField(text, /(payer|insurance)\s*[:\-]\s*(.+)/i);
  const prescriber = matchField(text, /prescriber\s*[:\-]\s*(.+)/i);
  const priorTherapy = matchField(text, /prior therap(?:y|ies)\s*[:\-]\s*(.+)/i);

  const medicationLine = matchField(text, /medications?\s*[:\-]\s*(.+)/i);
  const medications = medicationLine
    ? medicationLine.split(/[,;]\s*/).map((item) => item.trim()).filter(Boolean)
    : [];

  if (diagnosis) {
    facts.push(buildFact(sourceDocumentId, 'diagnosis', 'diagnosis', diagnosis, diagnosis, 'medium'));
  }
  if (requestedDrug) {
    facts.push(buildFact(sourceDocumentId, 'requested_drug', 'requested drug', requestedDrug, requestedDrug, 'medium'));
  }
  if (payer) {
    facts.push(buildFact(sourceDocumentId, 'payer', 'payer', payer, payer, 'medium'));
  }
  if (prescriber) {
    facts.push(buildFact(sourceDocumentId, 'prescriber', 'prescriber', prescriber, prescriber, 'medium'));
  }
  if (priorTherapy) {
    facts.push(buildFact(sourceDocumentId, 'prior_therapy', 'prior therapy', priorTherapy, priorTherapy, 'medium'));
  }
  for (const medication of medications) {
    facts.push(buildFact(sourceDocumentId, 'medication', 'medication', medication, medication, 'medium'));
  }

  if (facts.length === 0) {
    const excerpt = text.trim().slice(0, 220);
    facts.push(buildFact(sourceDocumentId, 'clinical_note', 'clinical note', excerpt || 'Uploaded text document', excerpt, 'medium'));
  }

  return {
    summary: facts.slice(0, 3).map((fact) => `${fact.label}: ${fact.value}`).join(' · '),
    facts,
    patientName: matchField(text, /patient\s*[:\-]\s*(.+)/i),
    payer,
    diagnosis,
    requestedDrug,
    documentType: 'clinical_note'
  };
}

function extractFactsFromDocumentContent(contentText: string, sourceDocumentId: string): DocumentExtractionResult {
  try {
    const parsed = JSON.parse(contentText);
    if (parsed?.resourceType === 'Bundle') {
      return extractFactsFromBundle(parsed, sourceDocumentId);
    }
  } catch {
    // Fall through to text extraction.
  }

  return extractFactsFromText(contentText, sourceDocumentId);
}

function mergeFacts(existingFacts: PatientFactRecord[], incomingFacts: PatientFactRecord[], sourceDocumentId: string) {
  const retained = existingFacts.filter((fact) => fact.sourceDocumentId !== sourceDocumentId);
  return [...retained, ...incomingFacts];
}

function deriveCaseStatus(patientCase: PatientCase): PatientCase['status'] {
  const documentCount = patientCase.documents?.length ?? patientCase.documentFiles.length;
  const factCount = patientCase.extractedFacts?.length ?? 0;
  if (documentCount === 0 || factCount === 0) {
    return 'missing-docs';
  }
  return 'ready-for-eval';
}

function createSeedCaseRecord(input: {
  caseId: string;
  payer: string;
  requestedDrug: string;
  diagnosis: string;
  patientName: string;
}): PatientCase {
  const timestamp = now();
  return {
    caseId: input.caseId,
    payer: input.payer,
    requestedDrug: input.requestedDrug,
    diagnosis: input.diagnosis,
    patientName: input.patientName,
    status: 'missing-docs',
    createdAt: timestamp,
    updatedAt: timestamp,
    documentFiles: [],
    documents: [],
    extractedFacts: [],
    seeded: true
  };
}

export function casePath(caseId: string): string {
  return join(PATIENTS_DIR, caseId);
}

export function createPatientCase(input: {
  payer: string;
  requestedDrug: string;
  diagnosis: string;
  patientName: string;
}): PatientCase {
  ensureDataDirectories();
  const caseId = crypto.randomUUID();
  const createdAt = now();
  mkdirSync(casePath(caseId), { recursive: true });

  const patientCase: PatientCase = {
    caseId,
    payer: input.payer,
    requestedDrug: input.requestedDrug,
    diagnosis: input.diagnosis,
    patientName: input.patientName,
    status: 'missing-docs',
    createdAt,
    updatedAt: createdAt,
    documentFiles: [],
    documents: [],
    extractedFacts: []
  };

  writeCaseRecord(patientCase);
  return patientCase;
}

export function getPatientCase(caseId: string): PatientCase | null {
  return safeReadCase(caseId);
}

export function listPatientCases(): PatientCase[] {
  ensureDataDirectories();
  if (!existsSync(PATIENTS_DIR)) {
    return [];
  }

  return readdirSync(PATIENTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => getPatientCase(entry.name))
    .filter((entry): entry is PatientCase => entry !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function addCaseDocument(input: {
  caseId: string;
  fileName: string;
  content: Buffer | Uint8Array | string;
  contentType?: string;
  documentType?: string;
}): { filePath: string; caseRecord: PatientCase; document: PatientDocumentRecord } {
  const caseRecord = getPatientCase(input.caseId);
  if (!caseRecord) {
    throw new Error(`Case not found: ${input.caseId}`);
  }

  mkdirSync(casePath(input.caseId), { recursive: true });
  const safeFileName = sanitizeFileName(input.fileName);
  const filePath = join(casePath(input.caseId), safeFileName);
  const contentBuffer = typeof input.content === 'string' ? Buffer.from(input.content, 'utf-8') : Buffer.from(input.content);
  writeFileSync(filePath, contentBuffer);

  const newDocumentId = documentId();
  const extraction = extractFactsFromDocumentContent(contentBuffer.toString('utf-8'), newDocumentId);
  const document: PatientDocumentRecord = {
    documentId: newDocumentId,
    fileName: safeFileName,
    documentType: input.documentType ?? extraction.documentType,
    contentType: input.contentType ?? 'text/plain',
    storedAt: now(),
    summary: extraction.summary,
    factCount: extraction.facts.length
  };

  if (!caseRecord.documentFiles.includes(safeFileName)) {
    caseRecord.documentFiles.push(safeFileName);
  }

  caseRecord.documents = [...(caseRecord.documents ?? []), document];
  caseRecord.extractedFacts = mergeFacts(caseRecord.extractedFacts ?? [], extraction.facts, newDocumentId);
  caseRecord.patientName = extraction.patientName ?? caseRecord.patientName;
  caseRecord.payer = extraction.payer ?? caseRecord.payer;
  caseRecord.diagnosis = extraction.diagnosis ?? caseRecord.diagnosis;
  caseRecord.requestedDrug = extraction.requestedDrug ?? caseRecord.requestedDrug;
  caseRecord.status = deriveCaseStatus(caseRecord);
  caseRecord.updatedAt = now();
  writeCaseRecord(caseRecord);

  return { filePath, caseRecord, document };
}

export function updateCaseStatus(caseId: string, status: PatientCase['status']): PatientCase | null {
  const caseRecord = getPatientCase(caseId);
  if (!caseRecord) {
    return null;
  }

  caseRecord.status = status;
  caseRecord.updatedAt = now();
  writeCaseRecord(caseRecord);
  return caseRecord;
}

export function ensureSeedPatientCases(): void {
  ensureDataDirectories();
  if (listPatientCases().length > 0) {
    return;
  }

  const seeds = [
    {
      caseId: 'seed-sarah-anderson',
      bundle: demoPatient01,
      patientName: 'Sarah Anderson',
      payer: 'UHC',
      diagnosis: 'Rheumatoid arthritis with rheumatoid factor',
      requestedDrug: 'adalimumab',
      fileName: 'patient-everything.json'
    },
    {
      caseId: 'seed-michael-chen',
      bundle: demoPatient02,
      patientName: 'Michael Chen',
      payer: 'UHC',
      diagnosis: 'Rheumatoid arthritis, unspecified',
      requestedDrug: 'adalimumab',
      fileName: 'patient-everything.json'
    },
    {
      caseId: 'seed-linda-washington',
      bundle: demoPatient03,
      patientName: 'Linda Washington',
      payer: 'Aetna',
      diagnosis: 'Rheumatoid arthritis, unspecified',
      requestedDrug: 'adalimumab',
      fileName: 'patient-everything.json'
    }
  ];

  for (const seed of seeds) {
    mkdirSync(casePath(seed.caseId), { recursive: true });
    const patientCase = createSeedCaseRecord(seed);
    writeCaseRecord(patientCase);
    addCaseDocument({
      caseId: seed.caseId,
      fileName: seed.fileName,
      content: JSON.stringify(seed.bundle, null, 2),
      contentType: 'application/json',
      documentType: 'fhir_bundle'
    });
  }
}
