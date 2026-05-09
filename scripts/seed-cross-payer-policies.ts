/**
 * Seed script to create cross-payer policy files so every drug family
 * has policies from at least 3 payers, making the Compare tab functional.
 *
 * Run: npx tsx scripts/seed-cross-payer-policies.ts
 *
 * This is idempotent — it skips files that already exist.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const STRUCTURED_DIR = join(import.meta.dirname, '..', 'data', 'policies', 'structured');
const INDEX_PATH = join(import.meta.dirname, '..', 'data', 'policies', 'index.json');

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function writeIfMissing(filePath: string, data: unknown): boolean {
  if (existsSync(filePath)) {
    console.log(`  skip ${filePath.split('/').pop()} (exists)`);
    return false;
  }
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  wrote ${filePath.split('/').pop()}`);
  return true;
}

interface VersionWrapper {
  policyId: string;
  version: number;
  fileName: string;
  savedAt: string;
  record: any;
}

interface DiffRecord {
  policyId: string;
  fromVersion: number;
  toVersion: number;
  timestamp: string;
  changes: Array<{ field: string; oldValue: unknown; newValue: unknown }>;
}

function compareValues(field: string, a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b) ? [] : [{ field, oldValue: a, newValue: b }];
}

function computeDiff(old: any, next: any) {
  return [
    ...compareValues('payer', old.payer, next.payer),
    ...compareValues('plan', old.plan, next.plan),
    ...compareValues('policyTitle', old.policyTitle, next.policyTitle),
    ...compareValues('coverageStatus', old.coverageStatus, next.coverageStatus),
    ...compareValues('paRequired', old.paRequired, next.paRequired),
    ...compareValues('diagnosisRequirements', old.diagnosisRequirements, next.diagnosisRequirements),
    ...compareValues('stepTherapy', old.stepTherapy, next.stepTherapy),
    ...compareValues('otherRequirements', old.otherRequirements, next.otherRequirements),
  ];
}

function writePolicyVersions(
  policyId: string,
  v1Record: any,
  v2Record: any,
  t1: string,
  t2: string
) {
  const v1File = `${policyId}_v1.json`;
  const v2File = `${policyId}_v2.json`;
  const diffFile = `${policyId}_diff_v1_to_v2.json`;

  const v1: VersionWrapper = { policyId, version: 1, fileName: v1File, savedAt: t1, record: v1Record };
  const v2: VersionWrapper = { policyId, version: 2, fileName: v2File, savedAt: t2, record: v2Record };
  const diff: DiffRecord = {
    policyId,
    fromVersion: 1,
    toVersion: 2,
    timestamp: t2,
    changes: computeDiff(v1Record, v2Record),
  };

  writeIfMissing(join(STRUCTURED_DIR, v1File), v1);
  writeIfMissing(join(STRUCTURED_DIR, v2File), v2);
  writeIfMissing(join(STRUCTURED_DIR, diffFile), diff);

  // Write flat seed file too
  const flatFile = `${policyId.replace(/-([a-z])/g, (_, c) => `-${c}`)}-seed.json`;
  writeIfMissing(join(STRUCTURED_DIR, flatFile), v2Record);
}

// ─── Adalimumab (Humira): already has Aetna + UHC, add BCBS-NC and Cigna ───

function seedBcbsHumira() {
  console.log('\nBCBS-NC Humira (bcbs-nc-humira):');
  const base = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'aetna-adalimumab-ra.json'), 'utf-8'));

  const v1 = deepClone(base);
  v1.id = 'bcbs-nc-humira-seed';
  v1.payer = 'BCBS-NC';
  v1.policyTitle = 'BCBS-NC Adalimumab Prior Authorization Policy';
  v1.coverageStatus = 'covered-with-pa';
  v1.stepTherapy[0].dosage = 'standard doses';
  v1.stepTherapy[0].duration = '3 months';
  v1.otherRequirements = v1.otherRequirements.filter((r: any) => r.category !== 'hepatitis screening');
  v1.sourceDocument = {
    filename: 'BCBS-NC Medical Policy - Biologic Response Modifiers for RA',
    retrievalDate: '2025-05-01',
    effectiveDate: '2025-05-01',
  };

  const v2 = deepClone(v1);
  v2.stepTherapy[0].dosage = 'at least 15 mg weekly';
  v2.stepTherapy[0].duration = '3 months';
  v2.otherRequirements.push({
    category: 'biosimilar preference',
    requirement: 'Biosimilar adalimumab product preferred for new starts',
    evidenceText: 'For new initiations, a biosimilar adalimumab product (e.g., Hadlima, Hyrimoz) is preferred over brand Humira. Brand Humira requires additional clinical justification.',
    source: { document: 'BCBS-NC Medical Policy - Biologic Response Modifiers for RA', page: 5, section: 'Biosimilar Preference' },
    ambiguous: false,
  });
  v2.sourceDocument.effectiveDate = '2026-01-15';
  v2.sourceDocument.retrievalDate = '2026-01-10';

  writePolicyVersions('bcbs-nc-humira', v1, v2, '2025-05-01T00:00:00.000Z', '2026-01-15T00:00:00.000Z');
}

function seedCignaHumira() {
  console.log('\nCigna Humira (cigna-humira):');
  const base = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'aetna-adalimumab-ra.json'), 'utf-8'));

  const v1 = deepClone(base);
  v1.id = 'cigna-humira-seed';
  v1.payer = 'Cigna';
  v1.policyTitle = 'Cigna Adalimumab Coverage Policy';
  v1.coverageStatus = 'covered-with-pa';
  v1.stepTherapy[0].duration = '3 months';
  v1.stepTherapy[0].failureCriteria = 'inadequate clinical response or documented intolerance';
  v1.otherRequirements = v1.otherRequirements.filter((r: any) => r.category === 'prescriber qualification');
  v1.otherRequirements.push({
    category: 'infection screening',
    requirement: 'TB and Hepatitis B screening required before initiating therapy',
    evidenceText: 'Individual must have documented screening for latent tuberculosis and hepatitis B virus prior to starting adalimumab therapy.',
    source: { document: 'Cigna Coverage Policy 0330 - TNF Inhibitors', page: 6, section: 'Safety Screening' },
    ambiguous: false,
  });
  v1.sourceDocument = {
    filename: 'Cigna Coverage Policy 0330 - TNF Inhibitors',
    retrievalDate: '2025-06-01',
    effectiveDate: '2025-06-01',
  };

  const v2 = deepClone(v1);
  v2.stepTherapy[0].duration = '4 months';
  v2.otherRequirements.push({
    category: 'combination therapy restriction',
    requirement: 'Not to be used with other biologic DMARDs',
    evidenceText: 'Adalimumab must not be used in combination with another biologic DMARD or JAK inhibitor due to increased infection risk.',
    source: { document: 'Cigna Coverage Policy 0330 - TNF Inhibitors', page: 8, section: 'Combination Therapy' },
    ambiguous: false,
  });
  v2.sourceDocument.effectiveDate = '2026-02-01';
  v2.sourceDocument.retrievalDate = '2026-01-20';

  writePolicyVersions('cigna-humira', v1, v2, '2025-06-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');
}

// ─── Etanercept (Enbrel): has UHC, add Aetna and Cigna ───

function seedAetnaEnbrel() {
  console.log('\nAetna Enbrel (aetna-enbrel):');
  const base = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'uhc-etanercept-ra.json'), 'utf-8'));

  const v1 = deepClone(base);
  v1.id = 'aetna-enbrel-seed';
  v1.payer = 'Aetna';
  v1.policyTitle = 'Aetna Etanercept Prior Authorization Policy';
  v1.stepTherapy[0].dosage = 'at least 15 mg weekly';
  v1.stepTherapy[0].duration = '3 months';
  v1.otherRequirements = [
    {
      category: 'prescriber qualification',
      requirement: 'Prescribed by a rheumatologist',
      evidenceText: 'The medication must be prescribed by a board-certified rheumatologist.',
      source: { document: 'Aetna Clinical Policy Bulletin 0726 - Biologic Response Modifiers', page: 14, section: 'Prescriber Requirements' },
      ambiguous: false,
    },
    {
      category: 'infection screening',
      requirement: 'TB screening required prior to initiation',
      evidenceText: 'Member must be screened for latent tuberculosis prior to starting etanercept therapy. Active TB must be treated before initiating.',
      source: { document: 'Aetna Clinical Policy Bulletin 0726 - Biologic Response Modifiers', page: 15, section: 'Safety Requirements' },
      ambiguous: false,
    },
  ];
  v1.sourceDocument = {
    filename: 'Aetna Clinical Policy Bulletin 0726 - Biologic Response Modifiers',
    retrievalDate: '2025-05-15',
    effectiveDate: '2025-06-01',
  };

  const v2 = deepClone(v1);
  v2.stepTherapy[0].dosage = 'maximally tolerated dose';
  v2.otherRequirements.push({
    category: 'biosimilar preference',
    requirement: 'Biosimilar etanercept product must be tried first for new starts',
    evidenceText: 'New patients must trial a biosimilar etanercept product (Erelzi or Eticovo) prior to brand Enbrel authorization, unless clinically contraindicated.',
    source: { document: 'Aetna Clinical Policy Bulletin 0726 - Biologic Response Modifiers', page: 16, section: 'Biosimilar Step Therapy' },
    ambiguous: false,
  });
  v2.sourceDocument.effectiveDate = '2026-01-10';
  v2.sourceDocument.retrievalDate = '2026-01-05';

  writePolicyVersions('aetna-enbrel', v1, v2, '2025-06-01T00:00:00.000Z', '2026-01-10T00:00:00.000Z');
}

function seedCignaEnbrel() {
  console.log('\nCigna Enbrel (cigna-enbrel):');
  const base = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'uhc-etanercept-ra.json'), 'utf-8'));

  const v1 = deepClone(base);
  v1.id = 'cigna-enbrel-seed';
  v1.payer = 'Cigna';
  v1.policyTitle = 'Cigna Etanercept Coverage Policy';
  v1.stepTherapy[0].duration = '3 months';
  v1.stepTherapy[0].failureCriteria = 'inadequate clinical response or documented intolerance';
  v1.otherRequirements = [
    {
      category: 'prescriber qualification',
      requirement: 'Prescribed by or in consultation with a rheumatologist',
      evidenceText: 'Request must be from a rheumatologist or physician specialist experienced in managing rheumatoid arthritis.',
      source: { document: 'Cigna Coverage Policy 0330 - TNF Inhibitors', page: 5, section: 'Prescriber Requirements' },
      ambiguous: false,
    },
  ];
  v1.sourceDocument = {
    filename: 'Cigna Coverage Policy 0330 - TNF Inhibitors',
    retrievalDate: '2025-07-01',
    effectiveDate: '2025-07-01',
  };

  const v2 = deepClone(v1);
  v2.coverageStatus = 'covered-with-pa';
  v2.otherRequirements.push({
    category: 'infection screening',
    requirement: 'Screening for tuberculosis and hepatitis B required',
    evidenceText: 'Individual has been screened for latent tuberculosis and hepatitis B virus prior to initiating therapy.',
    source: { document: 'Cigna Coverage Policy 0330 - TNF Inhibitors', page: 7, section: 'Safety Screening' },
    ambiguous: false,
  });
  v2.sourceDocument.effectiveDate = '2026-01-15';
  v2.sourceDocument.retrievalDate = '2026-01-10';

  writePolicyVersions('cigna-enbrel', v1, v2, '2025-07-01T00:00:00.000Z', '2026-01-15T00:00:00.000Z');
}

// ─── Infliximab (Remicade): has Cigna, add UHC and Aetna ───

function seedUhcRemicade() {
  console.log('\nUHC Remicade (uhc-remicade):');
  const base = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'cigna-infliximab-ra.json'), 'utf-8'));

  const v1 = deepClone(base);
  v1.id = 'uhc-remicade-seed';
  v1.payer = 'UHC';
  v1.policyTitle = 'UHC Infliximab Prior Authorization Policy';
  v1.stepTherapy[0].duration = '3 months';
  v1.stepTherapy[0].dosage = 'maximally indicated doses';
  v1.otherRequirements = v1.otherRequirements.filter((r: any) =>
    r.category === 'prescriber qualification' || r.category === 'infection screening'
  );
  v1.sourceDocument = {
    filename: 'UHC Commercial Medical Policy - TNF Inhibitors',
    retrievalDate: '2025-06-01',
    effectiveDate: '2025-06-01',
  };

  const v2 = deepClone(v1);
  v2.otherRequirements.push({
    category: 'biosimilar preference',
    requirement: 'Biosimilar infliximab required for new starts unless contraindicated',
    evidenceText: 'New patients initiating infliximab therapy must trial a biosimilar product (Inflectra, Renflexis, or Avsola) prior to authorization of brand Remicade.',
    source: { document: 'UHC Commercial Medical Policy - TNF Inhibitors', page: 5, section: 'Biosimilar Step Therapy' },
    ambiguous: false,
  });
  v2.sourceDocument.effectiveDate = '2026-01-20';
  v2.sourceDocument.retrievalDate = '2026-01-15';

  writePolicyVersions('uhc-remicade', v1, v2, '2025-06-01T00:00:00.000Z', '2026-01-20T00:00:00.000Z');
}

function seedAetnaRemicade() {
  console.log('\nAetna Remicade (aetna-remicade):');
  const base = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'cigna-infliximab-ra.json'), 'utf-8'));

  const v1 = deepClone(base);
  v1.id = 'aetna-remicade-seed';
  v1.payer = 'Aetna';
  v1.policyTitle = 'Aetna Infliximab Prior Authorization Policy';
  v1.stepTherapy[0].dosage = 'at least 15 mg weekly';
  v1.stepTherapy[0].duration = '3 months';
  v1.otherRequirements = [
    {
      category: 'prescriber qualification',
      requirement: 'Prescribed by a rheumatologist or gastroenterologist',
      evidenceText: 'The medication must be prescribed by a rheumatologist or gastroenterologist with experience managing autoimmune conditions.',
      source: { document: 'Aetna Clinical Policy Bulletin 0726 - Biologic Response Modifiers', page: 18, section: 'Prescriber Requirements' },
      ambiguous: false,
    },
    {
      category: 'administration setting',
      requirement: 'IV infusion in appropriate clinical setting required',
      evidenceText: 'Infliximab must be administered via intravenous infusion in a healthcare setting with personnel trained in biologic administration.',
      source: { document: 'Aetna Clinical Policy Bulletin 0726 - Biologic Response Modifiers', page: 19, section: 'Administration Requirements' },
      ambiguous: false,
    },
    {
      category: 'infection screening',
      requirement: 'TB and hepatitis B screening required',
      evidenceText: 'Member must have documented TB and hepatitis B screening prior to initiating infliximab therapy.',
      source: { document: 'Aetna Clinical Policy Bulletin 0726 - Biologic Response Modifiers', page: 20, section: 'Safety Screening' },
      ambiguous: false,
    },
  ];
  v1.sourceDocument = {
    filename: 'Aetna Clinical Policy Bulletin 0726 - Biologic Response Modifiers',
    retrievalDate: '2025-04-15',
    effectiveDate: '2025-05-01',
  };

  const v2 = deepClone(v1);
  v2.stepTherapy[0].duration = '4 months';
  v2.otherRequirements.push({
    category: 'biosimilar preference',
    requirement: 'Biosimilar infliximab required before brand Remicade',
    evidenceText: 'New patients must trial a biosimilar infliximab product before brand Remicade will be authorized.',
    source: { document: 'Aetna Clinical Policy Bulletin 0726 - Biologic Response Modifiers', page: 21, section: 'Biosimilar Step Therapy' },
    ambiguous: false,
  });
  v2.sourceDocument.effectiveDate = '2026-02-01';
  v2.sourceDocument.retrievalDate = '2026-01-25';

  writePolicyVersions('aetna-remicade', v1, v2, '2025-05-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');
}

// ─── Bevacizumab (Avastin): has BCBS-NC, add Cigna and UHC ───

function seedCignaAvastin() {
  console.log('\nCigna Avastin (cigna-avastin):');
  const base = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'bcbs-nc-bevacizumab-oncology.json'), 'utf-8'));

  const v1 = deepClone(base);
  v1.id = 'cigna-avastin-seed';
  v1.payer = 'Cigna';
  v1.policyTitle = 'Cigna Bevacizumab Coverage Policy - Oncology';
  v1.sourceDocument = {
    filename: 'Cigna Coverage Policy - Injectable Oncology Agents',
    retrievalDate: '2025-06-01',
    effectiveDate: '2025-06-01',
  };

  const v2 = deepClone(v1);
  v2.otherRequirements = [...(v2.otherRequirements || []), {
    category: 'biosimilar preference',
    requirement: 'Preferred biosimilar bevacizumab product required for new starts',
    evidenceText: 'For new initiations, a preferred biosimilar bevacizumab product (Mvasi, Zirabev) must be tried before brand Avastin.',
    source: { document: 'Cigna Coverage Policy - Injectable Oncology Agents', page: 8, section: 'Biosimilar Preference' },
    ambiguous: false,
  }];
  v2.sourceDocument.effectiveDate = '2026-01-25';
  v2.sourceDocument.retrievalDate = '2026-01-20';

  writePolicyVersions('cigna-avastin', v1, v2, '2025-06-01T00:00:00.000Z', '2026-01-25T00:00:00.000Z');
}

function seedUhcAvastin() {
  console.log('\nUHC Avastin (uhc-avastin):');
  const base = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'bcbs-nc-bevacizumab-oncology.json'), 'utf-8'));

  const v1 = deepClone(base);
  v1.id = 'uhc-avastin-seed';
  v1.payer = 'UHC';
  v1.policyTitle = 'UHC Bevacizumab Prior Authorization Policy';
  // Fewer indications in v1
  v1.indications = (v1.indications || []).filter(
    (ind: string) => !ind.includes('Hepatocellular') && !ind.includes('ovarian')
  );
  v1.sourceDocument = {
    filename: 'UHC Commercial Medical Policy - Oncology Biologics',
    retrievalDate: '2025-05-15',
    effectiveDate: '2025-06-01',
  };

  const v2 = deepClone(base);
  v2.id = 'uhc-avastin-seed';
  v2.payer = 'UHC';
  v2.policyTitle = 'UHC Bevacizumab Prior Authorization Policy';
  v2.sourceDocument = {
    filename: 'UHC Commercial Medical Policy - Oncology Biologics',
    retrievalDate: '2026-01-15',
    effectiveDate: '2026-02-01',
  };

  writePolicyVersions('uhc-avastin', v1, v2, '2025-06-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');
}

// ─── Upadacitinib (Rinvoq): has Aetna, add UHC and Cigna ───

function seedUhcRinvoq() {
  console.log('\nUHC Rinvoq (uhc-rinvoq):');
  const base = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'aetna-upadacitinib-ra.json'), 'utf-8'));

  const v1 = deepClone(base);
  v1.id = 'uhc-rinvoq-seed';
  v1.payer = 'UHC';
  v1.policyTitle = 'UHC Upadacitinib Prior Authorization Policy';
  // UHC less strict — no dosing restriction in v1
  v1.otherRequirements = v1.otherRequirements.filter((r: any) =>
    r.category !== 'dosing restriction' && r.category !== 'malignancy risk assessment'
  );
  v1.sourceDocument = {
    filename: 'UHC Commercial Medical Policy - JAK Inhibitors',
    retrievalDate: '2025-07-01',
    effectiveDate: '2025-07-01',
  };

  const v2 = deepClone(v1);
  v2.otherRequirements.push({
    category: 'dosing restriction',
    requirement: 'Lower dose (15 mg) required for patients age 65+',
    evidenceText: 'For members age 65 or older, the 15 mg dose must be used. Higher doses require additional clinical justification and risk documentation.',
    source: { document: 'UHC Commercial Medical Policy - JAK Inhibitors', page: 7, section: 'Dosing Requirements' },
    ambiguous: true,
  });
  v2.sourceDocument.effectiveDate = '2026-02-01';
  v2.sourceDocument.retrievalDate = '2026-01-20';

  writePolicyVersions('uhc-rinvoq', v1, v2, '2025-07-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');
}

function seedCignaRinvoq() {
  console.log('\nCigna Rinvoq (cigna-rinvoq):');
  const base = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'aetna-upadacitinib-ra.json'), 'utf-8'));

  const v1 = deepClone(base);
  v1.id = 'cigna-rinvoq-seed';
  v1.payer = 'Cigna';
  v1.policyTitle = 'Cigna Upadacitinib Coverage Policy';
  v1.otherRequirements = v1.otherRequirements.filter((r: any) =>
    ['prescriber qualification', 'age restriction', 'cardiovascular risk assessment', 'combination therapy restriction'].includes(r.category)
  );
  v1.sourceDocument = {
    filename: 'Cigna Coverage Policy - JAK Inhibitors for RA',
    retrievalDate: '2025-08-01',
    effectiveDate: '2025-08-01',
  };

  const v2 = deepClone(v1);
  v2.otherRequirements.push({
    category: 'laboratory monitoring',
    requirement: 'Baseline and periodic CBC and liver function tests required',
    evidenceText: 'Member must have baseline CBC and hepatic function panel. Periodic monitoring every 3 months during the first year.',
    source: { document: 'Cigna Coverage Policy - JAK Inhibitors for RA', page: 9, section: 'Laboratory Monitoring' },
    ambiguous: false,
  });
  v2.sourceDocument.effectiveDate = '2026-02-15';
  v2.sourceDocument.retrievalDate = '2026-02-01';

  writePolicyVersions('cigna-rinvoq', v1, v2, '2025-08-01T00:00:00.000Z', '2026-02-15T00:00:00.000Z');
}

// ─── Rituximab (Rituxan): has Cigna, add UHC and BCBS-NC ───

function seedUhcRituxan() {
  console.log('\nUHC Rituxan (uhc-rituxan):');
  const base = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'cigna-rituximab-nononcology.json'), 'utf-8'));

  const v1 = deepClone(base);
  v1.id = 'uhc-rituxan-seed';
  v1.payer = 'UHC';
  v1.policyTitle = 'UHC Rituximab Coverage Policy - Non-Oncology';
  // UHC: fewer indications
  v1.indications = (v1.indications || []).filter((ind: string) =>
    !ind.includes('Systemic Lupus') && !ind.includes('Thrombotic') && !ind.includes('Solid Organ')
  );
  v1.otherRequirements = v1.otherRequirements.filter((r: any) =>
    ['prescriber qualification', 'combination therapy restriction', 'preferred product requirement'].includes(r.category)
  );
  v1.sourceDocument = {
    filename: 'UHC Commercial Medical Policy - Anti-CD20 Agents',
    retrievalDate: '2025-06-15',
    effectiveDate: '2025-07-01',
  };

  const v2 = deepClone(v1);
  v2.indications = base.indications; // v2 adds all indications
  v2.otherRequirements.push({
    category: 'infection screening',
    requirement: 'Hepatitis B screening required prior to treatment',
    evidenceText: 'Member must be screened for hepatitis B virus prior to initiating rituximab therapy due to risk of reactivation.',
    source: { document: 'UHC Commercial Medical Policy - Anti-CD20 Agents', page: 6, section: 'Safety Screening' },
    ambiguous: false,
  });
  v2.sourceDocument.effectiveDate = '2026-01-15';
  v2.sourceDocument.retrievalDate = '2026-01-10';

  writePolicyVersions('uhc-rituxan', v1, v2, '2025-07-01T00:00:00.000Z', '2026-01-15T00:00:00.000Z');
}

function seedBcbsRituxan() {
  console.log('\nBCBS-NC Rituxan (bcbs-nc-rituxan):');
  const base = JSON.parse(readFileSync(join(STRUCTURED_DIR, 'cigna-rituximab-nononcology.json'), 'utf-8'));

  const v1 = deepClone(base);
  v1.id = 'bcbs-nc-rituxan-seed';
  v1.payer = 'BCBS-NC';
  v1.policyTitle = 'BCBS-NC Rituximab Medical Policy - Non-Oncology';
  v1.indications = (v1.indications || []).filter((ind: string) =>
    !ind.includes('Minimal Change') && !ind.includes('Pediatric')
  );
  v1.otherRequirements = v1.otherRequirements.filter((r: any) =>
    ['prescriber qualification', 'preferred product requirement'].includes(r.category)
  );
  v1.sourceDocument = {
    filename: 'BCBS-NC Corporate Medical Policy - Anti-CD20 Monoclonal Antibodies',
    retrievalDate: '2025-07-15',
    effectiveDate: '2025-08-01',
  };

  const v2 = deepClone(v1);
  v2.indications = base.indications;
  v2.sourceDocument.effectiveDate = '2026-02-01';
  v2.sourceDocument.retrievalDate = '2026-01-25';

  writePolicyVersions('bcbs-nc-rituxan', v1, v2, '2025-08-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');
}

// ─── Trastuzumab (Herceptin): has Cigna, add UHC and Aetna ───

function seedHerceptinBase() {
  // Cigna Herceptin uses the versioned files, read the v2 as base
  const v2Path = join(STRUCTURED_DIR, 'cigna-herceptin_v2.json');
  if (!existsSync(v2Path)) {
    console.log('  WARNING: cigna-herceptin_v2.json not found, skipping herceptin cross-payer');
    return null;
  }
  const wrapper = JSON.parse(readFileSync(v2Path, 'utf-8'));
  return wrapper.record || wrapper;
}

function seedUhcHerceptin() {
  console.log('\nUHC Herceptin (uhc-herceptin):');
  const base = seedHerceptinBase();
  if (!base) return;

  const v1 = deepClone(base);
  v1.id = 'uhc-herceptin-seed';
  v1.payer = 'UHC';
  v1.policyTitle = 'UHC Trastuzumab Prior Authorization Policy';
  v1.sourceDocument = {
    filename: 'UHC Commercial Medical Policy - HER2-Targeted Agents',
    retrievalDate: '2025-06-01',
    effectiveDate: '2025-06-01',
  };

  const v2 = deepClone(v1);
  v2.otherRequirements = [...(v2.otherRequirements || []), {
    category: 'biomarker testing',
    requirement: 'HER2 testing by IHC or FISH required before authorization',
    evidenceText: 'Documentation of HER2 overexpression (IHC 3+ or FISH positive) is required prior to authorization of trastuzumab.',
    source: { document: 'UHC Commercial Medical Policy - HER2-Targeted Agents', page: 4, section: 'Biomarker Requirements' },
    ambiguous: false,
  }];
  v2.sourceDocument.effectiveDate = '2026-01-15';
  v2.sourceDocument.retrievalDate = '2026-01-10';

  writePolicyVersions('uhc-herceptin', v1, v2, '2025-06-01T00:00:00.000Z', '2026-01-15T00:00:00.000Z');
}

function seedAetnaHerceptin() {
  console.log('\nAetna Herceptin (aetna-herceptin):');
  const base = seedHerceptinBase();
  if (!base) return;

  const v1 = deepClone(base);
  v1.id = 'aetna-herceptin-seed';
  v1.payer = 'Aetna';
  v1.policyTitle = 'Aetna Trastuzumab Prior Authorization Policy';
  v1.sourceDocument = {
    filename: 'Aetna Clinical Policy Bulletin - HER2-Directed Therapy',
    retrievalDate: '2025-05-01',
    effectiveDate: '2025-05-01',
  };

  const v2 = deepClone(v1);
  v2.otherRequirements = [...(v2.otherRequirements || []), {
    category: 'biosimilar preference',
    requirement: 'Biosimilar trastuzumab preferred for new starts',
    evidenceText: 'For new therapy initiations, a biosimilar trastuzumab product is preferred over brand Herceptin unless clinically contraindicated.',
    source: { document: 'Aetna Clinical Policy Bulletin - HER2-Directed Therapy', page: 6, section: 'Biosimilar Preference' },
    ambiguous: false,
  }];
  v2.sourceDocument.effectiveDate = '2026-02-01';
  v2.sourceDocument.retrievalDate = '2026-01-25';

  writePolicyVersions('aetna-herceptin', v1, v2, '2025-05-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z');
}

// ─── Update index.json ───

function updateIndex() {
  console.log('\nUpdating index.json...');
  const index = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
  const existingIds = new Set(index.policies.map((p: any) => p.policyId));

  const newEntries = [
    // Adalimumab cross-payer
    { policyId: 'bcbs-nc-humira', payer: 'BCBS-NC', title: 'BCBS-NC Adalimumab Prior Authorization Policy', drugFamily: 'Humira', versions: [1, 2], currentVersion: 2, currentVersionFile: 'bcbs-nc-humira_v2.json', lastUpdatedAt: '2026-01-15T00:00:00.000Z' },
    { policyId: 'cigna-humira', payer: 'Cigna', title: 'Cigna Adalimumab Coverage Policy', drugFamily: 'Humira', versions: [1, 2], currentVersion: 2, currentVersionFile: 'cigna-humira_v2.json', lastUpdatedAt: '2026-02-01T00:00:00.000Z' },
    // Etanercept cross-payer
    { policyId: 'aetna-enbrel', payer: 'Aetna', title: 'Aetna Etanercept Prior Authorization Policy', drugFamily: 'Enbrel', versions: [1, 2], currentVersion: 2, currentVersionFile: 'aetna-enbrel_v2.json', lastUpdatedAt: '2026-01-10T00:00:00.000Z' },
    { policyId: 'cigna-enbrel', payer: 'Cigna', title: 'Cigna Etanercept Coverage Policy', drugFamily: 'Enbrel', versions: [1, 2], currentVersion: 2, currentVersionFile: 'cigna-enbrel_v2.json', lastUpdatedAt: '2026-01-15T00:00:00.000Z' },
    // Infliximab cross-payer
    { policyId: 'uhc-remicade', payer: 'UHC', title: 'UHC Infliximab Prior Authorization Policy', drugFamily: 'Remicade', versions: [1, 2], currentVersion: 2, currentVersionFile: 'uhc-remicade_v2.json', lastUpdatedAt: '2026-01-20T00:00:00.000Z' },
    { policyId: 'aetna-remicade', payer: 'Aetna', title: 'Aetna Infliximab Prior Authorization Policy', drugFamily: 'Remicade', versions: [1, 2], currentVersion: 2, currentVersionFile: 'aetna-remicade_v2.json', lastUpdatedAt: '2026-02-01T00:00:00.000Z' },
    // Bevacizumab cross-payer
    { policyId: 'cigna-avastin', payer: 'Cigna', title: 'Cigna Bevacizumab Coverage Policy - Oncology', drugFamily: 'Avastin', versions: [1, 2], currentVersion: 2, currentVersionFile: 'cigna-avastin_v2.json', lastUpdatedAt: '2026-01-25T00:00:00.000Z' },
    { policyId: 'uhc-avastin', payer: 'UHC', title: 'UHC Bevacizumab Prior Authorization Policy', drugFamily: 'Avastin', versions: [1, 2], currentVersion: 2, currentVersionFile: 'uhc-avastin_v2.json', lastUpdatedAt: '2026-02-01T00:00:00.000Z' },
    // Upadacitinib cross-payer
    { policyId: 'uhc-rinvoq', payer: 'UHC', title: 'UHC Upadacitinib Prior Authorization Policy', drugFamily: 'Rinvoq', versions: [1, 2], currentVersion: 2, currentVersionFile: 'uhc-rinvoq_v2.json', lastUpdatedAt: '2026-02-01T00:00:00.000Z' },
    { policyId: 'cigna-rinvoq', payer: 'Cigna', title: 'Cigna Upadacitinib Coverage Policy', drugFamily: 'Rinvoq', versions: [1, 2], currentVersion: 2, currentVersionFile: 'cigna-rinvoq_v2.json', lastUpdatedAt: '2026-02-15T00:00:00.000Z' },
    // Rituximab cross-payer
    { policyId: 'uhc-rituxan', payer: 'UHC', title: 'UHC Rituximab Coverage Policy - Non-Oncology', drugFamily: 'Rituxan', versions: [1, 2], currentVersion: 2, currentVersionFile: 'uhc-rituxan_v2.json', lastUpdatedAt: '2026-01-15T00:00:00.000Z' },
    { policyId: 'bcbs-nc-rituxan', payer: 'BCBS-NC', title: 'BCBS-NC Rituximab Medical Policy - Non-Oncology', drugFamily: 'Rituxan', versions: [1, 2], currentVersion: 2, currentVersionFile: 'bcbs-nc-rituxan_v2.json', lastUpdatedAt: '2026-02-01T00:00:00.000Z' },
    // Trastuzumab cross-payer
    { policyId: 'uhc-herceptin', payer: 'UHC', title: 'UHC Trastuzumab Prior Authorization Policy', drugFamily: 'Herceptin', versions: [1, 2], currentVersion: 2, currentVersionFile: 'uhc-herceptin_v2.json', lastUpdatedAt: '2026-01-15T00:00:00.000Z' },
    { policyId: 'aetna-herceptin', payer: 'Aetna', title: 'Aetna Trastuzumab Prior Authorization Policy', drugFamily: 'Herceptin', versions: [1, 2], currentVersion: 2, currentVersionFile: 'aetna-herceptin_v2.json', lastUpdatedAt: '2026-02-01T00:00:00.000Z' },
  ];

  let added = 0;
  for (const entry of newEntries) {
    if (!existingIds.has(entry.policyId)) {
      index.policies.push(entry);
      existingIds.add(entry.policyId);
      added++;
      console.log(`  added ${entry.policyId}`);
    } else {
      console.log(`  skip ${entry.policyId} (exists)`);
    }
  }

  index.updatedAt = new Date().toISOString();
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2), 'utf-8');
  console.log(`  index updated (${added} new entries, ${index.policies.length} total)`);
}

// ─── Run ───

seedBcbsHumira();
seedCignaHumira();
seedAetnaEnbrel();
seedCignaEnbrel();
seedUhcRemicade();
seedAetnaRemicade();
seedCignaAvastin();
seedUhcAvastin();
seedUhcRinvoq();
seedCignaRinvoq();
seedUhcRituxan();
seedBcbsRituxan();
seedUhcHerceptin();
seedAetnaHerceptin();
updateIndex();

console.log('\nDone! Restart the server to pick up new policies.');
console.log('Expected result: All 7 drug families should now have 3+ payers in Compare tab.');
