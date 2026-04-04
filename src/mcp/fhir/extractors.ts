/**
 * FHIR Bundle Extractors
 *
 * Extracts diagnoses, medications, and coverage information from
 * FHIR Patient/$everything bundles. Uses defensive null handling
 * to gracefully handle missing or malformed FHIR data.
 */

import { normalizeDrugName } from '../../../data/lookup/drug-aliases.js';
import {
  ExtractedPatientData,
  ExtractedDiagnosis,
  ExtractedMedication,
  ExtractedCoverage,
} from './types.js';

// Supported ICD-10 system URIs
const ICD10_SYSTEMS = [
  'http://hl7.org/fhir/sid/icd-10',
  'http://hl7.org/fhir/sid/icd-10-cm',
  'http://www.cms.gov/Medicare/Coding/ICD10',
];

/**
 * Main orchestrator - extracts all patient data from a FHIR bundle
 */
export function extractPatientData(bundle: any): ExtractedPatientData {
  return {
    diagnoses: extractDiagnoses(bundle),
    medications: extractMedications(bundle),
    coverage: extractCoverage(bundle),
  };
}

/**
 * Extracts diagnosis codes from Condition resources
 * Supports multiple ICD-10 system URIs
 */
export function extractDiagnoses(bundle: any): ExtractedDiagnosis[] {
  const diagnoses: ExtractedDiagnosis[] = [];

  if (!bundle?.entry || !Array.isArray(bundle.entry)) {
    return diagnoses;
  }

  for (const entry of bundle.entry) {
    const resource = entry?.resource;
    if (resource?.resourceType !== 'Condition') {
      continue;
    }

    // Extract ICD-10 codes from code.coding array
    const codings = resource?.code?.coding;
    if (!codings || !Array.isArray(codings)) {
      continue;
    }

    for (const coding of codings) {
      const system = coding?.system;
      const code = coding?.code;
      const display = coding?.display;

      if (code && system && ICD10_SYSTEMS.includes(system)) {
        diagnoses.push({
          code,
          system,
          display: display || code,
        });
      }
    }
  }

  return diagnoses;
}

/**
 * Extracts medications from MedicationRequest and MedicationStatement resources
 * Normalizes drug names using the drug alias lookup
 */
export function extractMedications(bundle: any): ExtractedMedication[] {
  const medications: ExtractedMedication[] = [];

  if (!bundle?.entry || !Array.isArray(bundle.entry)) {
    return medications;
  }

  for (const entry of bundle.entry) {
    const resource = entry?.resource;
    const resourceType = resource?.resourceType;

    if (resourceType !== 'MedicationRequest' && resourceType !== 'MedicationStatement') {
      continue;
    }

    // Extract medication name from medicationCodeableConcept
    const medCodeable = resource?.medicationCodeableConcept;
    if (!medCodeable?.coding || !Array.isArray(medCodeable.coding)) {
      continue;
    }

    // Prefer RxNorm, but fall back to any coding with a display name
    let medicationName: string | undefined;

    for (const coding of medCodeable.coding) {
      if (coding?.display) {
        if (coding.system === 'http://www.nlm.nih.gov/research/umls/rxnorm') {
          medicationName = coding.display;
          break; // Prefer RxNorm
        } else if (!medicationName) {
          medicationName = coding.display; // Fallback
        }
      }
    }

    if (!medicationName) {
      continue;
    }

    // Extract status and date
    const status = resource?.status || 'unknown';
    const dateWritten = resource?.authoredOn || resource?.dateAsserted;

    medications.push({
      name: medicationName,
      normalizedName: normalizeDrugName(medicationName),
      status,
      dateWritten,
    });
  }

  return medications;
}

/**
 * Extracts coverage information from Coverage resources
 * Returns the first active coverage found, or null
 */
export function extractCoverage(bundle: any): ExtractedCoverage | null {
  if (!bundle?.entry || !Array.isArray(bundle.entry)) {
    return null;
  }

  for (const entry of bundle.entry) {
    const resource = entry?.resource;
    if (resource?.resourceType !== 'Coverage') {
      continue;
    }

    // Extract payor information
    const payor = resource?.payor?.[0]; // FHIR allows multiple payors, take first
    if (!payor) {
      continue;
    }

    const payerName = payor?.display || 'Unknown Payor';
    const planName = resource?.class?.find((c: any) => c?.type?.coding?.[0]?.code === 'plan')?.name;
    const status = resource?.status || 'unknown';

    return {
      payerName,
      planName,
      status,
    };
  }

  return null;
}
