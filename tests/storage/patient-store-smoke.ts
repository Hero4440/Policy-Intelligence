import { addCaseDocument, createPatientCase, getPatientCase } from '../../src/storage/patient-store.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const created = createPatientCase({
  patientName: 'Milestone Six Smoke',
  payer: 'UHC',
  requestedDrug: 'adalimumab',
  diagnosis: 'Rheumatoid arthritis'
});

const uploaded = addCaseDocument({
  caseId: created.caseId,
  fileName: 'clinical-note.txt',
  content: [
    'Patient: Milestone Six Smoke',
    'Diagnosis: Rheumatoid arthritis',
    'Requested Drug: adalimumab',
    'Payer: UHC',
    'Prior Therapy: methotrexate for 90 days',
    'Prescriber: rheumatologist'
  ].join('\n'),
  contentType: 'text/plain'
});

const reloaded = getPatientCase(created.caseId);

assert(Boolean(reloaded), 'case should be reloadable after upload');
assert((uploaded.caseRecord.documents?.length ?? 0) === 1, 'uploaded case should track one document');
assert((uploaded.caseRecord.extractedFacts?.length ?? 0) >= 4, 'uploaded case should extract multiple facts');
assert(reloaded?.status === 'ready-for-eval', 'case should move to ready-for-eval after facts are extracted');

console.log('Patient store smoke passed');
