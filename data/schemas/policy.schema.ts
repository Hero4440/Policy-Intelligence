import { z } from 'zod';

const SourceReference = z.object({
  document: z.string(),      // PDF filename
  page: z.number(),           // Page number in PDF
  section: z.string()         // Section header
});

const StepTherapyRequirement = z.object({
  drugName: z.string(),       // e.g., "methotrexate"
  dosage: z.string().optional(), // e.g., "15mg+"
  duration: z.string(),       // e.g., "3 months"
  failureCriteria: z.string(), // e.g., "inadequate response or intolerance"
  evidenceText: z.string(),   // Lightly edited policy quote (1-2 key sentences)
  source: SourceReference
});

const DiagnosisRequirement = z.object({
  icd10Codes: z.array(z.string()), // e.g., ["M05.*", "M06.*"]
  description: z.string(),
  evidenceText: z.string(),
  source: SourceReference
});

const OtherRequirement = z.object({
  category: z.string(),       // e.g., "lab values", "prescriber qualification", "age restriction"
  requirement: z.string(),     // Structured summary
  evidenceText: z.string(),   // Policy quote
  source: SourceReference,
  ambiguous: z.boolean().default(false) // Flag unclear policy language
});

const ProductWithTier = z.object({
  name: z.string(),
  tier: z.enum(['preferred', 'non-preferred']),
  aliases: z.array(z.string()).default([])
});

export const PolicyRecordSchema = z.object({
  id: z.string(),              // Unique ID, e.g., "uhc-humira-ra"
  payer: z.enum(['UHC', 'Aetna', 'Cigna', 'BCBS-NC']),
  plan: z.string(),            // e.g., "Commercial", "Medicare Advantage"
  policyTitle: z.string().optional(),  // NEW: full policy title from document
  drug: z.object({
    brandName: z.string(),
    genericName: z.string(),
    aliases: z.array(z.string()).default([]),
    products: z.array(ProductWithTier).optional()  // NEW: oncology preferred/non-preferred
  }),
  indication: z.string(),     // "Rheumatoid Arthritis"
  indications: z.array(z.string()).optional(),  // NEW: multiple indications for oncology
  coverageStatus: z.enum(['covered', 'covered-with-pa', 'excluded']),
  paRequired: z.boolean(),
  diagnosisRequirements: z.array(DiagnosisRequirement),
  stepTherapy: z.array(StepTherapyRequirement),
  otherRequirements: z.array(OtherRequirement),
  sourceDocument: z.object({
    filename: z.string(),
    url: z.string().url().optional(),
    retrievalDate: z.string(), // ISO date
    effectiveDate: z.string().optional()
  })
});

export type PolicyRecord = z.infer<typeof PolicyRecordSchema>;
export type ProductWithTier = z.infer<typeof ProductWithTier>;
export type StepTherapy = z.infer<typeof StepTherapyRequirement>;
export type DiagnosisReq = z.infer<typeof DiagnosisRequirement>;
export type OtherReq = z.infer<typeof OtherRequirement>;
export type SourceRef = z.infer<typeof SourceReference>;
