import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { PATIENTS_DIR, ensureDataDirectories } from './paths.js';
import type { PatientCase } from './types.js';

function now(): string {
  return new Date().toISOString();
}

function safeReadCase(caseId: string): PatientCase | null {
  const filePath = join(casePath(caseId), 'case.json');
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as PatientCase;
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
    documentFiles: []
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
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addCaseDocument(caseId: string, fileName: string, content: Buffer | Uint8Array): string {
  const caseRecord = getPatientCase(caseId);
  if (!caseRecord) {
    throw new Error(`Case not found: ${caseId}`);
  }

  mkdirSync(casePath(caseId), { recursive: true });
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
  const filePath = join(casePath(caseId), sanitizedFileName);
  writeFileSync(filePath, content);

  if (!caseRecord.documentFiles.includes(sanitizedFileName)) {
    caseRecord.documentFiles.push(sanitizedFileName);
  }
  caseRecord.updatedAt = now();
  writeCaseRecord(caseRecord);
  return filePath;
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
