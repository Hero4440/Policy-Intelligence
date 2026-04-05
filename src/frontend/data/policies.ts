import policiesIndex from '../../../data/policies/structured/policies-index.json';
import uhcAdalimumab from '../../../data/policies/structured/uhc-adalimumab-ra.json';
import uhcEtanercept from '../../../data/policies/structured/uhc-etanercept-ra.json';
import aetnaAdalimumab from '../../../data/policies/structured/aetna-adalimumab-ra.json';
import cignaInfliximab from '../../../data/policies/structured/cigna-infliximab-ra.json';
import aetnaUpadacitinib from '../../../data/policies/structured/aetna-upadacitinib-ra.json';

export type CoverageStatus = 'covered' | 'covered-with-pa' | 'not-covered';

export type PolicyRecord = {
  id: string;
  payer: string;
  plan: string;
  indication: string;
  coverageStatus: CoverageStatus;
  paRequired: boolean;
  drug: {
    brandName: string;
    genericName: string;
    aliases: string[];
  };
  diagnosisRequirements: Array<{
    description: string;
    evidenceText: string;
    icd10Codes: string[];
    source: {
      document: string;
      page: number;
      section: string;
    };
  }>;
  stepTherapy: Array<{
    drugName: string;
    dosage: string;
    duration: string;
    failureCriteria: string;
    evidenceText: string;
    source: {
      document: string;
      page: number;
      section: string;
    };
  }>;
  otherRequirements: Array<{
    category: string;
    requirement: string;
    evidenceText: string;
    ambiguous: boolean;
    source: {
      document: string;
      page: number;
      section: string;
    };
  }>;
  sourceDocument: {
    filename: string;
    url?: string;
    retrievalDate: string;
    effectiveDate: string;
  };
};

const detailedPolicies: PolicyRecord[] = [
  uhcAdalimumab,
  uhcEtanercept,
  aetnaAdalimumab,
  cignaInfliximab,
  aetnaUpadacitinib
] as PolicyRecord[];

export const policyDataset = {
  version: policiesIndex.version,
  generatedDate: policiesIndex.generatedDate,
  therapeuticArea: policiesIndex.therapeuticArea,
  policies: detailedPolicies
};

export function getPolicyById(id: string): PolicyRecord | undefined {
  return detailedPolicies.find(policy => policy.id === id);
}

export function listDrugs(): string[] {
  return [...new Set(detailedPolicies.map(policy => policy.drug.genericName))].sort();
}

export function listPayers(): string[] {
  return [...new Set(detailedPolicies.map(policy => policy.payer))].sort();
}

export function summarizeCoverageStatus(status: CoverageStatus): string {
  switch (status) {
    case 'covered':
      return 'Covered';
    case 'covered-with-pa':
      return 'Covered with PA';
    case 'not-covered':
      return 'Not Covered';
  }
}
