import { readFileSync } from 'fs';
import { basename } from 'path';
import { ingestFiles } from '../../src/server/ingestion/index.js';
import { compareDrugAcrossPlans, getPlanDrugDetail } from '../../src/server/antonrx-data.js';

type UploadCase = {
  name: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
};

function makeCaseFromFile(name: string, filePath: string, mimeType: string): UploadCase {
  return {
    name,
    fileName: basename(filePath),
    mimeType,
    bytes: readFileSync(filePath)
  };
}

function makeJsonCase(name: string, fileName: string, payload: unknown): UploadCase {
  return {
    name,
    fileName,
    mimeType: 'application/json',
    bytes: Buffer.from(JSON.stringify(payload))
  };
}

async function main() {
  const validStructured = makeCaseFromFile(
    'valid_structured_json',
    'data/policies/structured/uhc-adalimumab-ra.json',
    'application/json'
  );

  const csvSeed = readFileSync('docs/hackaathon2/insurance_hackathon_final_data_package/query_ready_formulary.csv', 'utf-8')
    .split('\n')
    .slice(0, 4)
    .join('\n');

  const validCsv: UploadCase = {
    name: 'valid_csv_formulary',
    fileName: 'mini-formulary.csv',
    mimeType: 'text/csv',
    bytes: Buffer.from(csvSeed)
  };

  const validFhir = makeCaseFromFile(
    'valid_fhir_bundle',
    'data/patients/demo-patients/patient-01-full-match.json',
    'application/json'
  );

  const validPdfUhc = makeCaseFromFile(
    'valid_pdf_uhc',
    'docs/hackaathon2/Medical Drug Coverage Policy Examples/UHC Botulinum Toxins A and B – Commercial Medical Benefit Drug Policy.pdf',
    'application/pdf'
  );

  const validPdfCigna = makeCaseFromFile(
    'valid_pdf_cigna',
    'docs/hackaathon2/Medical Drug Coverage Policy Examples/Cigna Rituximab Intravenous Products for Non-Oncology Indications.pdf',
    'application/pdf'
  );

  const invalidJson = {
    name: 'invalid_json_schema',
    fileName: 'bad-policy.json',
    mimeType: 'application/json',
    bytes: Buffer.from(JSON.stringify({ payer: 'UHC', foo: 'bar' }))
  } satisfies UploadCase;

  const invalidCsv = {
    name: 'invalid_csv_schema',
    fileName: 'notes.csv',
    mimeType: 'text/csv',
    bytes: Buffer.from('alpha,beta\none,two\nthree,four\n')
  } satisfies UploadCase;

  const unknownTxt = {
    name: 'unknown_text_payload',
    fileName: 'notes.txt',
    mimeType: 'text/plain',
    bytes: Buffer.from('This is an internal memo about formulary operations but not a policy artifact.')
  } satisfies UploadCase;

  const malformedJson = {
    name: 'malformed_json',
    fileName: 'broken.json',
    mimeType: 'application/json',
    bytes: Buffer.from('{"payer": "UHC", ')
  } satisfies UploadCase;

  const cases = [
    validStructured,
    validCsv,
    validFhir,
    validPdfUhc,
    validPdfCigna,
    invalidJson,
    invalidCsv,
    unknownTxt,
    malformedJson
  ];

  const uploadPayload = cases.map((testCase) => ({
    name: testCase.fileName,
    mimeType: testCase.mimeType,
    base64: testCase.bytes.toString('base64')
  }));

  const result = await ingestFiles(uploadPayload);
  const accepted = result.accepted;

  const byFile = new Map(accepted.map((entry) => [entry.source.fileName, entry]));
  const summary = cases.map((testCase) => {
    const entry = byFile.get(testCase.fileName);
    return {
      case: testCase.name,
      fileName: testCase.fileName,
      sourceKind: entry?.source.sourceKind,
      status: entry?.source.status,
      issuerName: entry?.source.issuerName,
      effectiveDate: entry?.source.effectiveDate,
      detectedDrugs: entry?.source.detectedDrugs,
      snapshotCount: entry?.snapshotCount
    };
  });

  const compare = compareDrugAcrossPlans('adalimumab');
  const uploadedMatch = compare.find((match) => match.sourceKind === 'uploaded_policy_json' && match.sourceFile === 'uhc-adalimumab-ra.json');
  const csvDrugQuery = 'clonidine hcl er';
  const csvCompare = compareDrugAcrossPlans(csvDrugQuery);
  const uploadedCsvMatch = csvCompare.find((match) => match.sourceKind === 'uploaded_csv' && match.sourceFile === 'mini-formulary.csv');
  const detail = uploadedMatch ? getPlanDrugDetail(uploadedMatch.planId, 'adalimumab') : null;

  console.log(JSON.stringify({
    matrix: summary,
    aggregate: result.summary,
    compareChecks: {
      adalimumabMatchCount: compare.length,
      csvDrugQuery,
      hasUploadedPolicyJson: Boolean(uploadedMatch),
      hasUploadedCsv: Boolean(uploadedCsvMatch),
      uploadedPolicyCoverageLabel: uploadedMatch?.coverageLabel ?? null,
      uploadedPolicyDetailRequirements: detail?.requirementsSummary.length ?? 0
    }
  }, null, 2));
}

await main();
