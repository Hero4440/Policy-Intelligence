import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { PolicyRecord } from './types.js';
import { PolicyRecordSchema } from '../../../data/schemas/policy.schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');

// In-memory policy store
let policies: PolicyRecord[] = [];

// Load all policies at module initialization
function loadPolicies(): PolicyRecord[] {
  if (policies.length > 0) {
    return policies; // Already loaded
  }

  try {
    const indexPath = join(projectRoot, 'data/policies/structured/policies-index.json');
    const indexContent = readFileSync(indexPath, 'utf-8');
    const index = JSON.parse(indexContent);

    for (const entry of index.policies) {
      try {
        const policyPath = join(projectRoot, 'data/policies/structured', entry.file);
        const policyContent = readFileSync(policyPath, 'utf-8');
        const policyData = JSON.parse(policyContent);

        // Validate against schema
        const validatedPolicy = PolicyRecordSchema.parse(policyData);
        policies.push(validatedPolicy);
      } catch (error) {
        console.error(`Failed to load policy ${entry.file}:`, error);
      }
    }

    console.error(`Loaded ${policies.length} policies`);
  } catch (error) {
    console.error('Failed to load policy index:', error);
  }

  return policies;
}

// Load policies on module import
loadPolicies();

/**
 * Find a policy by payer and drug generic name.
 * Payer matching is case-insensitive and handles plan identifiers (e.g., "uhc-commercial" -> "UHC").
 * Drug must already be normalized to generic name by the caller.
 */
export function findPolicy(payer: string, drugGeneric: string): PolicyRecord | undefined {
  // Extract payer prefix if plan identifier format (e.g., "uhc-commercial" -> "uhc")
  const payerQuery = payer.toLowerCase();
  const payerKey = payerQuery.split('-')[0];

  return policies.find(p =>
    (p.payer.toLowerCase() === payerQuery || p.payer.toLowerCase() === payerKey) &&
    p.drug.genericName.toLowerCase() === drugGeneric.toLowerCase()
  );
}

/**
 * Find all policies for a given drug (across all payers).
 */
export function findPoliciesByDrug(drugGeneric: string): PolicyRecord[] {
  return policies.filter(p =>
    p.drug.genericName.toLowerCase() === drugGeneric.toLowerCase()
  );
}

/**
 * Get all loaded policies.
 */
export function getAllPolicies(): PolicyRecord[] {
  return policies;
}
