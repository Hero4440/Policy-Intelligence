/**
 * Clinical Language Helpers
 *
 * Provides cautious, hedging language for clinical decision support.
 * No definitive statements - all outputs acknowledge limitations of
 * automated analysis and the need for clinical verification.
 */

export type ClinicalStatus =
  | 'appears_to_match'
  | 'may_be_missing'
  | 'documentation_may_be_needed'
  | 'unable_to_verify';

export const ClinicalLanguage = {
  /**
   * Used when patient data appears to match a criterion
   */
  matched(criterion: string): string {
    return `Appears to match: ${criterion}`;
  },

  /**
   * Used when patient data suggests a criterion may not be met
   */
  missing(criterion: string): string {
    return `May be missing: ${criterion}`;
  },

  /**
   * Used when criterion requires documentation not typically in FHIR data
   */
  needsDoc(criterion: string): string {
    return `Documentation may be needed: ${criterion}`;
  },

  /**
   * Used when insufficient data exists to evaluate criterion
   */
  unverifiable(criterion: string): string {
    return `Unable to verify: ${criterion}`;
  },
};

/**
 * Standard disclaimer for all automated clinical analyses
 */
export const DISCLAIMER =
  'This analysis is based on automated extraction of available patient data and should be verified by a qualified clinician. Clinical judgment is required for final prior authorization determination.';
