import patient01 from '../../../data/patients/demo-patients/patient-01-full-match.json';
import patient02 from '../../../data/patients/demo-patients/patient-02-partial-match.json';
import patient03 from '../../../data/patients/demo-patients/patient-03-poor-match.json';

export { extractPatientData } from '../../mcp/fhir/extractors.js';
export { matchPatientAgainstPolicy } from '../../mcp/matching/criteria_matcher.js';
export type { CriterionResult } from '../../mcp/matching/criteria_matcher.js';
export type { ClinicalStatus } from '../../mcp/matching/language.js';
export { DISCLAIMER } from '../../mcp/matching/language.js';

export interface DemoPatient {
  id: string;
  name: string;
  summary: string;
  payer: string;
  bundle: any;
}

export const demoPatients: DemoPatient[] = [
  {
    id: 'patient-01',
    name: 'Sarah Anderson',
    summary: 'RA with seropositive dx, active methotrexate, UHC coverage',
    payer: 'UHC',
    bundle: patient01,
  },
  {
    id: 'patient-02',
    name: 'Michael Chen',
    summary: 'RA unspecified dx, recent methotrexate start, UHC coverage',
    payer: 'UHC',
    bundle: patient02,
  },
  {
    id: 'patient-03',
    name: 'Linda Washington',
    summary: 'RA unspecified dx, no DMARD history, Aetna coverage',
    payer: 'Aetna',
    bundle: patient03,
  },
];

export function getPatientById(id: string): DemoPatient | undefined {
  return demoPatients.find(p => p.id === id);
}
