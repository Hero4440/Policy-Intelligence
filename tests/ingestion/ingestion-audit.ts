import { readFileSync, existsSync } from 'fs';
import { ingestFiles } from '../../src/server/ingestion/index.js';
import { compareDrugAcrossPlans, getPlanDrugDetail } from '../../src/server/antonrx-data.js';

type UploadSpec = {
  label: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
};

type AuditFailure = {
  check: string;
  details: string;
};

function makeUpload(label: string, fileName: string, mimeType: string, filePath: string): UploadSpec {
  return {
    label,
    fileName,
    mimeType,
    bytes: readFileSync(filePath)
  };
}

function expect(condition: boolean, check: string, details: string, failures: AuditFailure[]) {
  if (!condition) {
    failures.push({ check, details });
  }
}

async function main() {
  const failures: AuditFailure[] = [];

  const uploads: UploadSpec[] = [
    makeUpload('structured_json', 'uhc-adalimumab-ra.json', 'application/json', 'data/policies/structured/uhc-adalimumab-ra.json'),
    {
      label: 'normalized_csv',
      fileName: 'mini-formulary.csv',
      mimeType: 'text/csv',
      bytes: Buffer.from(
        readFileSync('docs/hackaathon2/insurance_hackathon_final_data_package/query_ready_formulary.csv', 'utf-8')
          .split('\n')
          .slice(0, 4)
          .join('\n')
      )
    },
    makeUpload('fhir_bundle', 'patient-01-full-match.json', 'application/json', 'data/patients/demo-patients/patient-01-full-match.json'),
    makeUpload('local_pdf_uhc_botulinum', 'UHC Botulinum Toxins A and B – Commercial Medical Benefit Drug Policy.pdf', 'application/pdf', 'docs/hackaathon2/Medical Drug Coverage Policy Examples/UHC Botulinum Toxins A and B – Commercial Medical Benefit Drug Policy.pdf'),
    makeUpload('local_pdf_cigna_rituximab', 'Cigna Rituximab Intravenous Products for Non-Oncology Indications.pdf', 'application/pdf', 'docs/hackaathon2/Medical Drug Coverage Policy Examples/Cigna Rituximab Intravenous Products for Non-Oncology Indications.pdf'),
    {
      label: 'invalid_json_schema',
      fileName: 'bad-policy.json',
      mimeType: 'application/json',
      bytes: Buffer.from(JSON.stringify({ payer: 'UHC', foo: 'bar' }))
    },
    {
      label: 'invalid_csv_schema',
      fileName: 'notes.csv',
      mimeType: 'text/csv',
      bytes: Buffer.from('alpha,beta\none,two\nthree,four\n')
    },
    {
      label: 'unknown_text_payload',
      fileName: 'notes.txt',
      mimeType: 'text/plain',
      bytes: Buffer.from('This is a memo, not a policy artifact.')
    }
  ];

  if (existsSync('/tmp/uhc_adalimumab_online.pdf')) {
    uploads.push(makeUpload('online_pdf_uhc_adalimumab', 'uhc_adalimumab_online.pdf', 'application/pdf', '/tmp/uhc_adalimumab_online.pdf'));
  }
  if (existsSync('/tmp/cigna_rituximab_online.pdf')) {
    uploads.push(makeUpload('online_pdf_cigna_rituximab', 'cigna_rituximab_online.pdf', 'application/pdf', '/tmp/cigna_rituximab_online.pdf'));
  }

  const result = await ingestFiles(
    uploads.map((upload) => ({
      name: upload.fileName,
      mimeType: upload.mimeType,
      base64: upload.bytes.toString('base64')
    }))
  );

  const entries = new Map(result.accepted.map((entry) => [entry.source.fileName, entry]));

  const structured = entries.get('uhc-adalimumab-ra.json');
  expect(Boolean(structured), 'structured-json-present', 'structured JSON upload missing from ingest results', failures);
  expect(structured?.source.status === 'normalized', 'structured-json-status', `expected normalized, got ${structured?.source.status}`, failures);
  expect(structured?.snapshotCount === 1, 'structured-json-snapshot-count', `expected 1 snapshot, got ${structured?.snapshotCount}`, failures);
  expect(structured?.source.detectedDrugs.includes('Humira (adalimumab)') ?? false, 'structured-json-drug-detect', `expected Humira (adalimumab), got ${structured?.source.detectedDrugs.join(', ')}`, failures);

  const csv = entries.get('mini-formulary.csv');
  expect(Boolean(csv), 'csv-present', 'normalized CSV upload missing from ingest results', failures);
  expect(csv?.source.status === 'normalized', 'csv-status', `expected normalized, got ${csv?.source.status}`, failures);
  expect((csv?.snapshotCount ?? 0) >= 3, 'csv-snapshot-count', `expected >= 3 snapshots, got ${csv?.snapshotCount}`, failures);
  expect(csv?.source.issuerName === 'AZ Blue', 'csv-issuer', `expected AZ Blue, got ${csv?.source.issuerName}`, failures);

  const fhir = entries.get('patient-01-full-match.json');
  expect(Boolean(fhir), 'fhir-present', 'FHIR bundle missing from ingest results', failures);
  expect(fhir?.source.status === 'stored', 'fhir-status', `expected stored, got ${fhir?.source.status}`, failures);
  expect(fhir?.source.issuerName === 'Clinical patient bundle', 'fhir-issuer-label', `expected Clinical patient bundle, got ${fhir?.source.issuerName}`, failures);
  expect(fhir?.snapshotCount === 0, 'fhir-no-snapshots', `expected 0 snapshots, got ${fhir?.snapshotCount}`, failures);

  const localUhcPdf = entries.get('UHC Botulinum Toxins A and B – Commercial Medical Benefit Drug Policy.pdf');
  expect(Boolean(localUhcPdf), 'local-uhc-pdf-present', 'local UHC PDF missing from ingest results', failures);
  expect(localUhcPdf?.source.status === 'normalized', 'local-uhc-pdf-status', `expected normalized, got ${localUhcPdf?.source.status}`, failures);
  expect((localUhcPdf?.snapshotCount ?? 0) >= 5, 'local-uhc-pdf-snapshots', `expected >= 5 snapshots, got ${localUhcPdf?.snapshotCount}`, failures);
  expect(localUhcPdf?.source.detectedDrugs.includes('Botox') ?? false, 'local-uhc-pdf-drugs', `expected Botox in detected drugs, got ${localUhcPdf?.source.detectedDrugs.join(', ')}`, failures);

  const localCignaPdf = entries.get('Cigna Rituximab Intravenous Products for Non-Oncology Indications.pdf');
  expect(Boolean(localCignaPdf), 'local-cigna-pdf-present', 'local Cigna PDF missing from ingest results', failures);
  expect(localCignaPdf?.source.status === 'normalized', 'local-cigna-pdf-status', `expected normalized, got ${localCignaPdf?.source.status}`, failures);
  expect((localCignaPdf?.snapshotCount ?? 0) === 4, 'local-cigna-pdf-snapshots', `expected 4 snapshots, got ${localCignaPdf?.snapshotCount}`, failures);
  expect(localCignaPdf?.source.detectedDrugs.includes('Rituxan') ?? false, 'local-cigna-pdf-drugs', `expected Rituxan in detected drugs, got ${localCignaPdf?.source.detectedDrugs.join(', ')}`, failures);

  const invalidJson = entries.get('bad-policy.json');
  expect(invalidJson?.source.status === 'rejected', 'invalid-json-rejected', `expected rejected, got ${invalidJson?.source.status}`, failures);
  const invalidCsv = entries.get('notes.csv');
  expect(invalidCsv?.source.status === 'rejected', 'invalid-csv-rejected', `expected rejected, got ${invalidCsv?.source.status}`, failures);
  const unknownTxt = entries.get('notes.txt');
  expect(unknownTxt?.source.status === 'stored', 'unknown-text-stored', `expected stored, got ${unknownTxt?.source.status}`, failures);

  if (entries.has('uhc_adalimumab_online.pdf')) {
    const onlineUhc = entries.get('uhc_adalimumab_online.pdf');
    expect(onlineUhc?.source.status === 'normalized', 'online-uhc-status', `expected normalized, got ${onlineUhc?.source.status}`, failures);
    expect((onlineUhc?.snapshotCount ?? 0) >= 6, 'online-uhc-snapshots', `expected >= 6 snapshots, got ${onlineUhc?.snapshotCount}`, failures);
    expect(onlineUhc?.source.detectedDrugs.some((drug) => /Humira|Amjevita|Abrilada/.test(drug)) ?? false, 'online-uhc-drugs', `expected known adalimumab family drug, got ${onlineUhc?.source.detectedDrugs.join(', ')}`, failures);
  }

  if (entries.has('cigna_rituximab_online.pdf')) {
    const onlineCigna = entries.get('cigna_rituximab_online.pdf');
    expect(onlineCigna?.source.status === 'normalized', 'online-cigna-status', `expected normalized, got ${onlineCigna?.source.status}`, failures);
    expect((onlineCigna?.snapshotCount ?? 0) === 4, 'online-cigna-snapshots', `expected 4 snapshots, got ${onlineCigna?.snapshotCount}`, failures);
    expect(onlineCigna?.source.detectedDrugs.includes('Ruxience') ?? false, 'online-cigna-drugs', `expected Ruxience, got ${onlineCigna?.source.detectedDrugs.join(', ')}`, failures);
  }

  const adalimumabMatches = compareDrugAcrossPlans('adalimumab');
  const uploadedStructuredMatch = adalimumabMatches.find((match) => match.sourceKind === 'uploaded_policy_json' && match.sourceFile === 'uhc-adalimumab-ra.json');
  expect(Boolean(uploadedStructuredMatch), 'compare-structured-presence', 'uploaded structured JSON did not appear in compareDrugAcrossPlans(adalimumab)', failures);

  const csvMatches = compareDrugAcrossPlans('clonidine hcl er');
  const uploadedCsvMatch = csvMatches.find((match) => match.sourceKind === 'uploaded_csv' && match.sourceFile === 'mini-formulary.csv');
  expect(Boolean(uploadedCsvMatch), 'compare-csv-presence', 'uploaded CSV did not appear in compareDrugAcrossPlans(clonidine hcl er)', failures);

  const rituxanMatches = compareDrugAcrossPlans('rituxan');
  const uploadedPdfMatch = rituxanMatches.find((match) => match.sourceKind === 'uploaded_pdf_policy' && /cigna/i.test(match.sourceFile));
  expect(Boolean(uploadedPdfMatch), 'compare-pdf-presence', 'uploaded PDF did not appear in compareDrugAcrossPlans(rituxan)', failures);

  if (uploadedPdfMatch) {
    const detail = getPlanDrugDetail(uploadedPdfMatch.planId, 'rituxan');
    expect(Boolean(detail), 'detail-pdf-present', 'detail lookup failed for uploaded PDF snapshot', failures);
    expect((detail?.requirementsSummary.length ?? 0) > 0, 'detail-pdf-requirements', 'uploaded PDF detail has no requirement summary', failures);
    expect(detail?.confidenceLabel === 'medium', 'detail-pdf-confidence', `expected medium confidence, got ${detail?.confidenceLabel}`, failures);
  }

  const output = {
    auditedFiles: uploads.map((upload) => upload.fileName),
    sourceCountAfterAudit: result.summary.sourceCount,
    snapshotCountAfterAudit: result.summary.snapshotCount,
    failures
  };

  console.log(JSON.stringify(output, null, 2));
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

await main();
