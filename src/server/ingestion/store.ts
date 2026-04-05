import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import { dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';
import type { NormalizedRuleFacet } from '../normalization.js';

export type IngestionSourceKind = 'pdf' | 'json_policy' | 'csv_formulary' | 'jsonl_records' | 'fhir_bundle' | 'docx' | 'unknown';
export type IngestionStatus = 'normalized' | 'partial' | 'stored' | 'rejected';

export interface IngestedSourceRecord {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sourceKind: IngestionSourceKind;
  status: IngestionStatus;
  uploadedAt: string;
  issuerName: string;
  effectiveDate: string;
  detectedDrugs: string[];
  notes: string[];
  summary: string;
  rawPath: string;
  extractedTextPath?: string;
  normalizedSnapshotIds: string[];
}

export interface IngestedCoverageSnapshot {
  snapshotId: string;
  sourceId: string;
  planId: string;
  issuerName: string;
  issuerKey: string;
  planName: string;
  planKey: string;
  market: string;
  metalLevel: string;
  sourceKind: 'uploaded_policy_json' | 'uploaded_csv' | 'uploaded_pdf_policy' | 'uploaded_jsonl' | 'uploaded_docx_policy';
  sourcePosture: 'deep_medical_policy' | 'uploaded_normalized';
  sourceFile: string;
  sourceEffectiveDate: string;
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
  structuredPolicy?: unknown;
}

interface IngestionDatabase {
  sources: IngestedSourceRecord[];
  snapshots: IngestedCoverageSnapshot[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');
const ingestionDir = join(projectRoot, 'data/ingestion');
const rawDir = join(ingestionDir, 'raw');
const extractedDir = join(ingestionDir, 'extracted');
const dbPath = join(ingestionDir, 'db.json');

function ensureStore() {
  mkdirSync(ingestionDir, { recursive: true });
  mkdirSync(rawDir, { recursive: true });
  mkdirSync(extractedDir, { recursive: true });
  if (!existsSync(dbPath)) {
    writeFileSync(dbPath, JSON.stringify({ sources: [], snapshots: [] }, null, 2), 'utf-8');
  }
}

function readDb(): IngestionDatabase {
  ensureStore();
  return JSON.parse(readFileSync(dbPath, 'utf-8')) as IngestionDatabase;
}

function writeDb(db: IngestionDatabase) {
  ensureStore();
  writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
}

function safeFileName(fileName: string): string {
  const extension = extname(fileName);
  const stem = fileName.slice(0, Math.max(0, fileName.length - extension.length));
  const normalizedStem = stem.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const normalizedExtension = extension.replace(/[^a-zA-Z0-9.]+/g, '');
  return `${normalizedStem || 'upload'}${normalizedExtension || ''}`;
}

export async function persistRawUpload(sourceId: string, fileName: string, bytes: Uint8Array): Promise<string> {
  ensureStore();
  const outputPath = join(rawDir, `${sourceId}-${safeFileName(fileName)}`);
  await writeFile(outputPath, bytes);
  return outputPath;
}

export async function persistExtractedText(sourceId: string, fileName: string, text: string): Promise<string> {
  ensureStore();
  const outputPath = join(extractedDir, `${sourceId}-${safeFileName(fileName)}.txt`);
  await writeFile(outputPath, text, 'utf-8');
  return outputPath;
}

export function saveIngestionResult(
  source: IngestedSourceRecord,
  snapshots: IngestedCoverageSnapshot[]
): IngestionDatabase {
  const db = readDb();
  const existingSourceIndex = db.sources.findIndex((entry) => entry.id === source.id);
  if (existingSourceIndex >= 0) {
    db.sources[existingSourceIndex] = source;
  } else {
    db.sources.unshift(source);
  }

  const snapshotIds = new Set(snapshots.map((snapshot) => snapshot.snapshotId));
  db.snapshots = db.snapshots.filter((snapshot) => !snapshotIds.has(snapshot.snapshotId));
  db.snapshots.unshift(...snapshots);
  writeDb(db);
  return db;
}

export function listIngestedSources(): IngestedSourceRecord[] {
  return readDb().sources;
}

export function listIngestedSnapshots(): IngestedCoverageSnapshot[] {
  return readDb().snapshots;
}

export function getIngestionSummary() {
  const db = readDb();
  return {
    sourceCount: db.sources.length,
    normalizedSourceCount: db.sources.filter((source) => source.status === 'normalized').length,
    partialSourceCount: db.sources.filter((source) => source.status === 'partial').length,
    snapshotCount: db.snapshots.length
  };
}

export function createSourceId() {
  return `src-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function ensureIngestionDirectories() {
  await mkdir(rawDir, { recursive: true });
  await mkdir(extractedDir, { recursive: true });
}
