/**
 * FHIR Integration Types
 *
 * Defines the extracted patient data structure that will be used
 * for matching against policy requirements.
 */

export interface ExtractedDiagnosis {
  code: string;
  system: string;
  display: string;
}

export interface ExtractedMedication {
  name: string;
  normalizedName: string;
  status: string;
  dateWritten?: string;
}

export interface ExtractedCoverage {
  payerName: string;
  planName?: string;
  status: string;
}

export interface ExtractedPatientData {
  diagnoses: ExtractedDiagnosis[];
  medications: ExtractedMedication[];
  coverage: ExtractedCoverage | null;
}

export interface FhirToken {
  fhir_token: string;
  patient_id: string;
  fhir_server_url?: string;
}
