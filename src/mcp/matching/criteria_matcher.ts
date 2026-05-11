/**
 * Criteria Matcher
 *
 * Compares extracted patient FHIR data against policy requirements
 * using cautious clinical language. Handles diagnosis matching with
 * ICD-10 wildcards, step therapy with drug name normalization, and
 * other requirements that may need documentation.
 */

import { PolicyRecord, DiagnosisReq, StepTherapy, OtherReq, SourceRef } from '../../../data/schemas/policy.schema.ts';
import { ExtractedPatientData } from '../fhir/types.js';
import { ClinicalStatus, ClinicalLanguage } from './language.js';
import { normalizeDrugName } from '../../../data/lookup/drug-aliases.ts';

export interface CriterionResult {
  criterion: string;
  category: string;
  status: ClinicalStatus;
  message: string;
  evidence: string;
  source: SourceRef;
  matched_data?: any;
  is_ambiguous?: boolean;
}

/**
 * Main orchestrator - matches patient data against all policy requirements
 */
export function matchPatientAgainstPolicy(
  patientData: ExtractedPatientData,
  policy: PolicyRecord
): CriterionResult[] {
  const results: CriterionResult[] = [];

  // Match diagnosis requirements
  const diagnosisResults = matchDiagnosisRequirements(
    patientData.diagnoses,
    policy.diagnosisRequirements
  );
  results.push(...diagnosisResults);

  // Match step therapy requirements
  const stepTherapyResults = matchStepTherapyRequirements(
    patientData.medications,
    policy.stepTherapy
  );
  results.push(...stepTherapyResults);

  // Match other requirements
  const otherResults = matchOtherRequirements(
    patientData,
    policy.otherRequirements
  );
  results.push(...otherResults);

  return results;
}

/**
 * Match diagnosis requirements with ICD-10 wildcard support
 */
export function matchDiagnosisRequirements(
  diagnoses: ExtractedPatientData['diagnoses'],
  diagnosisReqs: DiagnosisReq[]
): CriterionResult[] {
  const results: CriterionResult[] = [];

  for (const req of diagnosisReqs) {
    const matchedCodes: string[] = [];

    // Check if we have any diagnoses to evaluate
    if (!diagnoses || diagnoses.length === 0) {
      results.push({
        criterion: req.description,
        category: 'diagnosis',
        status: 'unable_to_verify',
        message: ClinicalLanguage.unverifiable(req.description),
        evidence: req.evidenceText,
        source: req.source,
      });
      continue;
    }

    // Check each required ICD-10 code (with wildcard support)
    for (const requiredCode of req.icd10Codes) {
      for (const patientDiagnosis of diagnoses) {
        if (icd10CodesMatch(requiredCode, patientDiagnosis.code)) {
          matchedCodes.push(patientDiagnosis.code);
        }
      }
    }

    if (matchedCodes.length > 0) {
      results.push({
        criterion: req.description,
        category: 'diagnosis',
        status: 'appears_to_match',
        message: ClinicalLanguage.matched(req.description),
        evidence: req.evidenceText,
        source: req.source,
        matched_data: { icd10_codes: matchedCodes },
      });
    } else {
      results.push({
        criterion: req.description,
        category: 'diagnosis',
        status: 'may_be_missing',
        message: ClinicalLanguage.missing(req.description),
        evidence: req.evidenceText,
        source: req.source,
      });
    }
  }

  return results;
}

/**
 * Match step therapy requirements with drug name normalization
 */
export function matchStepTherapyRequirements(
  medications: ExtractedPatientData['medications'],
  stepTherapyReqs: StepTherapy[]
): CriterionResult[] {
  const results: CriterionResult[] = [];

  for (const req of stepTherapyReqs) {
    // Check if we have any medications to evaluate
    if (!medications || medications.length === 0) {
      results.push({
        criterion: `Prior trial of ${req.drugName}`,
        category: 'step_therapy',
        status: 'unable_to_verify',
        message: ClinicalLanguage.unverifiable(`Prior trial of ${req.drugName} for ${req.duration}`),
        evidence: req.evidenceText,
        source: req.source,
      });
      continue;
    }

    // Parse multi-drug requirements (e.g., "methotrexate, leflunomide, or sulfasalazine")
    const requiredDrugs = parseDrugList(req.drugName);
    const matchedMeds: any[] = [];

    for (const requiredDrug of requiredDrugs) {
      const normalizedRequired = normalizeDrugName(requiredDrug.trim());

      for (const patientMed of medications) {
        if (patientMed.normalizedName === normalizedRequired) {
          matchedMeds.push({
            name: patientMed.name,
            normalized: patientMed.normalizedName,
            status: patientMed.status,
          });
        }
      }
    }

    if (matchedMeds.length > 0) {
      results.push({
        criterion: `Prior trial of ${req.drugName}`,
        category: 'step_therapy',
        status: 'appears_to_match',
        message: ClinicalLanguage.matched(
          `Prior trial of ${req.drugName} (note: duration and dosage cannot be verified from FHIR data alone)`
        ),
        evidence: req.evidenceText,
        source: req.source,
        matched_data: { medications: matchedMeds },
      });
    } else {
      results.push({
        criterion: `Prior trial of ${req.drugName}`,
        category: 'step_therapy',
        status: 'may_be_missing',
        message: ClinicalLanguage.missing(`Prior trial of ${req.drugName} for ${req.duration}`),
        evidence: req.evidenceText,
        source: req.source,
      });
    }
  }

  return results;
}

/**
 * Match other requirements (typically require documentation)
 */
export function matchOtherRequirements(
  patientData: ExtractedPatientData,
  otherReqs: OtherReq[]
): CriterionResult[] {
  const results: CriterionResult[] = [];

  for (const req of otherReqs) {
    // Most "other" requirements need clinical documentation beyond FHIR data
    const status: ClinicalStatus = 'documentation_may_be_needed';

    results.push({
      criterion: req.requirement,
      category: req.category,
      status,
      message: ClinicalLanguage.needsDoc(req.requirement),
      evidence: req.evidenceText,
      source: req.source,
      is_ambiguous: req.ambiguous,
    });
  }

  return results;
}

/**
 * ICD-10 code matching with wildcard support
 * Handles patterns like "M05.*" matching "M05.79", "M05.811", etc.
 */
function icd10CodesMatch(policyCode: string, patientCode: string): boolean {
  // Handle wildcard matching
  if (policyCode.endsWith('.*')) {
    const prefix = policyCode.slice(0, -2); // Remove ".*"
    return patientCode.startsWith(prefix);
  }

  // Exact match
  return policyCode === patientCode;
}

/**
 * Parse drug list that may contain multiple options
 * Handles formats like:
 * - "methotrexate"
 * - "methotrexate or leflunomide"
 * - "methotrexate, leflunomide, sulfasalazine, or hydroxychloroquine"
 */
function parseDrugList(drugString: string): string[] {
  // Split by comma or "or", then trim whitespace
  return drugString
    .split(/,|\s+or\s+/)
    .map((drug) => drug.trim())
    .filter((drug) => drug.length > 0);
}
