import { existsSync, writeFileSync } from 'fs';
import { loadStorageOnStartup, getPoliciesFromMemory } from '../../src/storage/startup.js';
import {
  diffPolicyVersions,
  listPolicyIndex,
  readCurrentPolicy,
  registerRawPolicy,
  writePolicyVersion
} from '../../src/storage/policy-store.js';
import {
  addCaseDocument,
  createPatientCase,
  getPatientCase,
  listPatientCases,
  updateCaseStatus
} from '../../src/storage/patient-store.js';
import {
  getEvaluation,
  listEvaluations,
  saveEvaluation
} from '../../src/storage/evaluation-store.js';

function section(title: string): void {
  console.log(`\n== ${title} ==`);
}

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function runPolicySmoke(): void {
  section('Policy Store');

  const record = {
    id: 'test-1',
    payer: 'Cigna' as const,
    plan: 'Commercial',
    drug: {
      brandName: 'Herceptin',
      genericName: 'trastuzumab',
      aliases: []
    },
    indication: 'Breast Cancer',
    coverageStatus: 'covered-with-pa' as const,
    paRequired: true,
    diagnosisRequirements: [],
    stepTherapy: [],
    otherRequirements: [],
    sourceDocument: {
      filename: 'test.pdf',
      retrievalDate: '2026-01-01'
    }
  };

  const firstWrite = writePolicyVersion(record);
  record.paRequired = false;
  const secondWrite = writePolicyVersion(record);
  const current = readCurrentPolicy('cigna-herceptin');
  const diff = diffPolicyVersions('cigna-herceptin', firstWrite.version, secondWrite.version);

  writeFileSync('/tmp/test-policy.pdf', 'fake pdf content');
  const rawPath = registerRawPolicy(
    '/tmp/test-policy.pdf',
    'cigna-herceptin',
    'herceptin policy.pdf'
  );

  assert(firstWrite.version >= 1, 'first policy write did not return a version');
  assert(secondWrite.version === firstWrite.version + 1, 'second write did not increment version');
  assert(current?.paRequired === false, 'current policy did not reflect updated paRequired');
  assert(Boolean(diff), 'diff record was not created');
  assert(existsSync(rawPath), 'raw policy file was not copied');

  console.log({
    firstVersion: firstWrite.version,
    secondVersion: secondWrite.version,
    diffCreated: Boolean(diff),
    currentPaRequired: current?.paRequired,
    indexEntries: listPolicyIndex().length,
    rawPath
  });
}

function runPatientSmoke(): string {
  section('Patient Store');

  const patientCase = createPatientCase({
    payer: 'Cigna',
    requestedDrug: 'Herceptin',
    diagnosis: 'Breast Cancer',
    patientName: 'Jane Test'
  });

  addCaseDocument(patientCase.caseId, 'clinical note.pdf', Buffer.from('fake note'));
  const updated = updateCaseStatus(patientCase.caseId, 'ready-for-eval');
  const found = getPatientCase(patientCase.caseId);

  assert(Boolean(found), 'patient case was not found after creation');
  assert(updated?.status === 'ready-for-eval', 'patient case status was not updated');
  assert(updated?.documentFiles.length === 1, 'patient case document was not saved');

  console.log({
    caseId: patientCase.caseId,
    status: updated?.status,
    documents: updated?.documentFiles.length,
    listedCases: listPatientCases().length
  });

  return patientCase.caseId;
}

function runEvaluationSmoke(caseId: string): void {
  section('Evaluation Store');

  const evaluation = saveEvaluation({
    caseId,
    policyId: 'cigna-herceptin',
    policyVersion: 1,
    coverageStatus: 'PA Required',
    checklist: [{ criterion: 'Prior Auth Required', status: 'PASS' }]
  });

  const found = getEvaluation(evaluation.evalId);
  const missing = getEvaluation('00000000-0000-0000-0000-000000000000');
  const filtered = listEvaluations({ caseId });

  assert(Boolean(found), 'evaluation was not found after save');
  assert(missing === null, 'missing evaluation did not return null');
  assert(filtered.some((entry) => entry.evalId === evaluation.evalId), 'evaluation filter missed saved item');

  console.log({
    evalId: evaluation.evalId,
    found: Boolean(found),
    missing,
    filteredCount: filtered.length
  });
}

function runStartupSmoke(): void {
  section('Startup Reload');
  loadStorageOnStartup();
  const policies = getPoliciesFromMemory();
  assert(Array.isArray(policies), 'startup reload did not return policies array');
  console.log({
    policiesInMemory: policies.length
  });
}

function main(): void {
  runPolicySmoke();
  const caseId = runPatientSmoke();
  runEvaluationSmoke(caseId);
  runStartupSmoke();
  section('Done');
  console.log('Phase 5 storage smoke passed');
}

main();
