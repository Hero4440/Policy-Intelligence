/**
 * Demo Patient Bundle Validation Script
 *
 * Validates that the three demo patient bundles are correctly parsed by
 * the FHIR extractors and return expected data structures.
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractPatientData } from '../src/mcp/fhir/extractors.js';

// ANSI color codes for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.log(`${RED}✗ FAIL${RESET}: ${message}`);
    process.exit(1);
  }
  console.log(`${GREEN}✓ PASS${RESET}: ${message}`);
}

function loadPatientBundle(filename: string): any {
  const filePath = path.join(process.cwd(), 'data', 'patients', 'demo-patients', filename);
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

console.log('\n=== Demo Patient Bundle Validation ===\n');

// Patient 1: Sarah Anderson (Full Match)
console.log(`${YELLOW}Patient 1: Sarah Anderson (Full Match)${RESET}`);
const patient1 = loadPatientBundle('patient-01-full-match.json');
const data1 = extractPatientData(patient1);

assert(data1.diagnoses.length > 0, 'Patient 1: Has diagnoses');
assert(
  data1.diagnoses.some(d => d.code === 'M05.79'),
  'Patient 1: Has M05.79 diagnosis'
);
assert(data1.medications.length > 0, 'Patient 1: Has medications');
assert(
  data1.medications.some(m => m.normalizedName.toLowerCase().includes('methotrexate')),
  'Patient 1: Has methotrexate medication'
);
assert(data1.coverage !== null, 'Patient 1: Has coverage');
assert(data1.coverage?.payerName === 'UHC', 'Patient 1: Coverage payer is UHC');

console.log('');

// Patient 2: Michael Chen (Partial Match)
console.log(`${YELLOW}Patient 2: Michael Chen (Partial Match)${RESET}`);
const patient2 = loadPatientBundle('patient-02-partial-match.json');
const data2 = extractPatientData(patient2);

assert(data2.diagnoses.length > 0, 'Patient 2: Has diagnoses');
assert(
  data2.diagnoses.some(d => d.code === 'M06.9'),
  'Patient 2: Has M06.9 diagnosis'
);
assert(data2.medications.length > 0, 'Patient 2: Has medications');
assert(
  data2.medications.some(m => m.normalizedName.toLowerCase().includes('methotrexate')),
  'Patient 2: Has methotrexate medication'
);
assert(data2.coverage !== null, 'Patient 2: Has coverage');
assert(data2.coverage?.payerName === 'UHC', 'Patient 2: Coverage payer is UHC');

console.log('');

// Patient 3: Linda Washington (Poor Match)
console.log(`${YELLOW}Patient 3: Linda Washington (Poor Match)${RESET}`);
const patient3 = loadPatientBundle('patient-03-poor-match.json');
const data3 = extractPatientData(patient3);

assert(data3.diagnoses.length > 0, 'Patient 3: Has diagnoses');
assert(
  data3.diagnoses.some(d => d.code === 'M06.9'),
  'Patient 3: Has M06.9 diagnosis'
);
assert(data3.medications.length === 0, 'Patient 3: Has NO medications (expected gap)');
assert(data3.coverage !== null, 'Patient 3: Has coverage');
assert(data3.coverage?.payerName === 'Aetna', 'Patient 3: Coverage payer is Aetna');

console.log('');

console.log(`${GREEN}=== All validations passed! ===${RESET}\n`);

// Print summary
console.log('Summary:');
console.log(`  Patient 1: ${data1.diagnoses.length} diagnoses, ${data1.medications.length} medications, payer=${data1.coverage?.payerName}`);
console.log(`  Patient 2: ${data2.diagnoses.length} diagnoses, ${data2.medications.length} medications, payer=${data2.coverage?.payerName}`);
console.log(`  Patient 3: ${data3.diagnoses.length} diagnoses, ${data3.medications.length} medications, payer=${data3.coverage?.payerName}`);
console.log('');

process.exit(0);
