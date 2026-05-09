/**
 * One-time script to convert flat seed policy files into versioned policy files
 * with meaningful v1→v2 diffs so the Changes tab has data for multiple payers.
 *
 * Run: npx tsx scripts/seed-policy-versions.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const STRUCTURED_DIR = join(import.meta.dirname, '..', 'data', 'policies', 'structured');

interface PolicyVersion {
  policyId: string;
  version: number;
  fileName: string;
  savedAt: string;
  record: any;
}

interface DiffField {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

interface DiffRecord {
  policyId: string;
  fromVersion: number;
  toVersion: number;
  timestamp: string;
  changes: DiffField[];
}

function compareValues(field: string, oldValue: unknown, newValue: unknown): DiffField[] {
  return JSON.stringify(oldValue) === JSON.stringify(newValue)
    ? []
    : [{ field, oldValue, newValue }];
}

function computeDiff(oldRecord: any, newRecord: any): DiffField[] {
  return [
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
    ...compareValues('sourceDocument', oldRecord.sourceDocument, newRecord.sourceDocument),
  ];
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function writeVersion(policyId: string, version: number, record: any, savedAt: string): void {
  const fileName = `${policyId}_v${version}.json`;
  const filePath = join(STRUCTURED_DIR, fileName);
  if (existsSync(filePath)) {
    console.log(`  skipping ${fileName} (already exists)`);
    return;
  }
  const pv: PolicyVersion = { policyId, version, fileName, savedAt, record };
  writeFileSync(filePath, JSON.stringify(pv, null, 2), 'utf-8');
  console.log(`  wrote ${fileName}`);
}

function writeDiff(policyId: string, fromVersion: number, toVersion: number, oldRecord: any, newRecord: any, timestamp: string): void {
  const fileName = `${policyId}_diff_v${fromVersion}_to_v${toVersion}.json`;
  const filePath = join(STRUCTURED_DIR, fileName);
  if (existsSync(filePath)) {
    console.log(`  skipping ${fileName} (already exists)`);
    return;
  }
  const diff: DiffRecord = {
    policyId,
    fromVersion,
    toVersion,
    timestamp,
    changes: computeDiff(oldRecord, newRecord),
  };
  writeFileSync(filePath, JSON.stringify(diff, null, 2), 'utf-8');
  console.log(`  wrote ${fileName} (${diff.changes.length} changes)`);
}

// --- UHC Humira (adalimumab) ---
function seedUhcHumira() {
  console.log('\nUHC Humira (uhc-humira):');
  const raw = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'uhc-adalimumab-ra.json'), 'utf-8'));

  const v1 = deepClone(raw);
  v1.sourceDocument.effectiveDate = '2025-07-01';
  v1.sourceDocument.retrievalDate = '2025-06-15';

  const v2 = deepClone(raw);
  // v2 changes: extended step therapy duration, added biosimilar preference, updated effective date
  v2.stepTherapy[0].duration = '6 months';
  v2.stepTherapy[0].failureCriteria = 'inadequate response, contraindication, or clinically significant adverse effects after adequate trial';
  v2.otherRequirements.push({
    category: 'biosimilar preference',
    requirement: 'For new starts, a biosimilar adalimumab product must be tried before brand Humira unless clinically contraindicated',
    evidenceText: 'Effective January 2026, new patients initiating adalimumab therapy must trial a biosimilar product (e.g., Amjevita, Hadlima, Hyrimoz) prior to authorization of brand Humira, unless the prescriber documents a clinical reason the biosimilar is inappropriate.',
    source: { document: 'uhc-adalimumab-pa-policy.pdf', page: 3, section: 'Biosimilar Step Therapy' },
    ambiguous: false,
  });

  const t1 = '2025-07-01T00:00:00.000Z';
  const t2 = '2026-01-15T00:00:00.000Z';
  writeVersion('uhc-humira', 1, v1, t1);
  writeVersion('uhc-humira', 2, v2, t2);
  writeDiff('uhc-humira', 1, 2, v1, v2, t2);
}

// --- UHC Enbrel (etanercept) ---
function seedUhcEnbrel() {
  console.log('\nUHC Enbrel (uhc-enbrel):');
  const raw = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'uhc-etanercept-ra.json'), 'utf-8'));

  const v1 = deepClone(raw);
  v1.sourceDocument.effectiveDate = '2025-06-01';
  v1.sourceDocument.retrievalDate = '2025-05-20';

  const v2 = deepClone(raw);
  // v2 changes: added TB screening requirement, updated diagnosis evidence text
  v2.otherRequirements.push({
    category: 'infection screening',
    requirement: 'Tuberculosis screening required prior to initiation',
    evidenceText: 'Patients must be screened for latent tuberculosis prior to initiating etanercept therapy. Active TB must be treated before starting TNF inhibitor.',
    source: { document: 'UHC Commercial Medical Policy - TNF Inhibitors', page: 3, section: 'Safety Requirements' },
    ambiguous: false,
  });
  v2.diagnosisRequirements[0].evidenceText = 'Diagnosis of moderately to severely active rheumatoid arthritis confirmed by DAS28 score >= 3.2 or equivalent validated measure.';

  const t1 = '2025-06-01T00:00:00.000Z';
  const t2 = '2026-01-20T00:00:00.000Z';
  writeVersion('uhc-enbrel', 1, v1, t1);
  writeVersion('uhc-enbrel', 2, v2, t2);
  writeDiff('uhc-enbrel', 1, 2, v1, v2, t2);
}

// --- Aetna Humira (adalimumab) ---
function seedAetnaHumira() {
  console.log('\nAetna Humira (aetna-humira):');
  const raw = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'aetna-adalimumab-ra.json'), 'utf-8'));

  const v1 = deepClone(raw);
  v1.sourceDocument.effectiveDate = '2025-04-01';
  v1.sourceDocument.retrievalDate = '2025-03-15';
  // v1 had less strict step therapy
  v1.stepTherapy[0].dosage = 'standard doses';

  const v2 = deepClone(raw);
  // v2 changes: tightened methotrexate dose requirement, added Hepatitis B screening
  v2.otherRequirements.push({
    category: 'hepatitis screening',
    requirement: 'Hepatitis B screening required prior to initiation in addition to TB screening',
    evidenceText: 'Member must have documented hepatitis B virus screening (HBsAg, anti-HBc, anti-HBs) within 6 months prior to therapy initiation.',
    source: { document: 'Aetna Clinical Policy Bulletin 0726 - Biologic Response Modifiers', page: 15, section: 'Hepatitis B Screening' },
    ambiguous: false,
  });

  const t1 = '2025-04-01T00:00:00.000Z';
  const t2 = '2026-01-10T00:00:00.000Z';
  writeVersion('aetna-humira', 1, v1, t1);
  writeVersion('aetna-humira', 2, v2, t2);
  writeDiff('aetna-humira', 1, 2, v1, v2, t2);
}

// --- Aetna Rinvoq (upadacitinib) ---
function seedAetnaRinvoq() {
  console.log('\nAetna Rinvoq (aetna-rinvoq):');
  const raw = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'aetna-upadacitinib-ra.json'), 'utf-8'));

  const v1 = deepClone(raw);
  v1.sourceDocument.effectiveDate = '2025-07-01';
  v1.sourceDocument.retrievalDate = '2025-06-15';
  // v1 didn't require the lower dose for high-risk patients
  v1.otherRequirements = v1.otherRequirements.filter((r: any) => r.category !== 'dosing restriction');

  const v2 = deepClone(raw);
  // v2: added dosing restriction for high-risk patients (FDA boxed warning update)

  const t1 = '2025-07-01T00:00:00.000Z';
  const t2 = '2026-02-01T00:00:00.000Z';
  writeVersion('aetna-rinvoq', 1, v1, t1);
  writeVersion('aetna-rinvoq', 2, v2, t2);
  writeDiff('aetna-rinvoq', 1, 2, v1, v2, t2);
}

// --- Cigna Remicade (infliximab) ---
function seedCignaRemicade() {
  console.log('\nCigna Remicade (cigna-remicade):');
  const raw = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'cigna-infliximab-ra.json'), 'utf-8'));

  const v1 = deepClone(raw);
  v1.sourceDocument.effectiveDate = '2025-06-01';
  v1.sourceDocument.retrievalDate = '2025-05-20';
  // v1 did not require biosimilar preference
  v1.otherRequirements = v1.otherRequirements.filter((r: any) => r.category !== 'biosimilar preference');

  const v2 = deepClone(raw);
  // v2 adds biosimilar preference requirement

  const t1 = '2025-06-01T00:00:00.000Z';
  const t2 = '2026-01-05T00:00:00.000Z';
  writeVersion('cigna-remicade', 1, v1, t1);
  writeVersion('cigna-remicade', 2, v2, t2);
  writeDiff('cigna-remicade', 1, 2, v1, v2, t2);
}

// --- BCBS-NC Avastin (bevacizumab) ---
function seedBcbsAvastin() {
  console.log('\nBCBS-NC Avastin (bcbs-nc-avastin):');
  const raw = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'bcbs-nc-bevacizumab-oncology.json'), 'utf-8'));

  const v1 = deepClone(raw);
  v1.sourceDocument.effectiveDate = '2025-05-01';
  v1.sourceDocument.retrievalDate = '2025-04-20';
  // v1 had fewer indications
  v1.indications = [
    'Metastatic colorectal cancer',
    'Non-squamous non-small cell lung cancer',
    'Recurrent glioblastoma',
    'Metastatic renal cell carcinoma',
    'Persistent, recurrent, or metastatic cervical cancer',
  ];
  // v1 had one fewer product
  v1.drug.products = v1.drug.products.filter((p: any) => p.name !== 'Jobevne (bevacizumab-nwgd)');

  const v2 = deepClone(raw);
  // v2 added hepatocellular carcinoma and ovarian cancer indications, added Jobevne product

  const t1 = '2025-05-01T00:00:00.000Z';
  const t2 = '2026-01-25T00:00:00.000Z';
  writeVersion('bcbs-nc-avastin', 1, v1, t1);
  writeVersion('bcbs-nc-avastin', 2, v2, t2);
  writeDiff('bcbs-nc-avastin', 1, 2, v1, v2, t2);
}

// --- Cigna Rituxan (rituximab) ---
function seedCignaRituxan() {
  console.log('\nCigna Rituxan (cigna-rituxan):');
  const raw = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'cigna-rituximab-nononcology.json'), 'utf-8'));

  const v1 = deepClone(raw);
  v1.sourceDocument.effectiveDate = '2025-08-01';
  v1.sourceDocument.retrievalDate = '2025-07-15';
  // v1 had fewer indications
  v1.indications = (v1.indications as string[]).filter(
    (ind: string) => !ind.includes('Systemic Lupus') && !ind.includes('Thrombotic Thrombocytopenic')
  );

  const v2 = deepClone(raw);
  // v2 added SLE and TTP indications

  const t1 = '2025-08-01T00:00:00.000Z';
  const t2 = '2026-02-10T00:00:00.000Z';
  writeVersion('cigna-rituxan', 1, v1, t1);
  writeVersion('cigna-rituxan', 2, v2, t2);
  writeDiff('cigna-rituxan', 1, 2, v1, v2, t2);
}

// Run all
seedUhcHumira();
seedUhcEnbrel();
seedAetnaHumira();
seedAetnaRinvoq();
seedCignaRemicade();
seedBcbsAvastin();
seedCignaRituxan();

console.log('\nDone. Restart the server to rebuild the index.');
