import type { PolicyRecord } from '../../../data/schemas/policy.schema.ts';

export type { PolicyRecord };

export interface PolicyStore {
  findPolicy(payer: string, drugGeneric: string): PolicyRecord | undefined;
  getAllPolicies(): PolicyRecord[];
}
