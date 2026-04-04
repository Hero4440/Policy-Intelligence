import type { PolicyRecord } from '../../../data/schemas/policy.schema.js';

export type { PolicyRecord };

export interface PolicyStore {
  findPolicy(payer: string, drugGeneric: string): PolicyRecord | undefined;
  getAllPolicies(): PolicyRecord[];
}
