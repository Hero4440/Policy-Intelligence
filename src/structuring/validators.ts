import fs from 'fs/promises';
import { PolicyRecordSchema, type PolicyRecord } from '../../data/schemas/policy.schema.ts';
import { ZodError } from 'zod';

/**
 * Validate a single policy record.
 *
 * @param data - Unknown data to validate
 * @returns Validated PolicyRecord
 * @throws ZodError if validation fails
 */
export function validatePolicy(data: unknown): PolicyRecord {
  return PolicyRecordSchema.parse(data);
}

/**
 * Validate an array of policy records.
 *
 * @param data - Array of unknown data to validate
 * @returns Array of validated PolicyRecords
 * @throws ZodError if validation fails
 */
export function validatePolicies(data: unknown[]): PolicyRecord[] {
  return data.map((item, index) => {
    try {
      return validatePolicy(item);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation failed for policy at index ${index}: ${error.message}`);
      }
      throw error;
    }
  });
}

/**
 * Read and validate a policy from a JSON file.
 *
 * @param filePath - Path to JSON file
 * @returns Validated PolicyRecord
 * @throws Error if file cannot be read or validation fails
 */
export async function validatePolicyFile(filePath: string): Promise<PolicyRecord> {
  const content = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(content);
  return validatePolicy(data);
}

// CLI usage: tsx src/structuring/validators.ts <json-file-path>
if (import.meta.url === `file://${process.argv[1]}`) {
  const filePath = process.argv[2];

  if (!filePath) {
    console.log('Usage: tsx src/structuring/validators.ts <json-file-path>');
    console.log('\nValidates a policy JSON file against the PolicyRecordSchema.');
    process.exit(0);
  }

  try {
    const policy = await validatePolicyFile(filePath);
    console.log('✓ Validation successful!');
    console.log(`Policy ID: ${policy.id}`);
    console.log(`Payer: ${policy.payer}`);
    console.log(`Drug: ${policy.drug.brandName} (${policy.drug.genericName})`);
    console.log(`Indication: ${policy.indication}`);
    console.log(`Coverage: ${policy.coverageStatus}`);
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('✗ Validation failed:');
      console.error(error.format());
    } else {
      console.error('✗ Error:', error instanceof Error ? error.message : error);
    }
    process.exit(1);
  }
}
