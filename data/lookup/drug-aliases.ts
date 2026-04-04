export interface DrugAlias {
  genericName: string;
  brandNames: string[];
  biosimilars: string[];
  class: string;
}

export const drugAliases: Record<string, DrugAlias> = {
  'adalimumab': {
    genericName: 'adalimumab',
    brandNames: ['Humira'],
    biosimilars: ['Amjevita', 'Cyltezo', 'Hadlima', 'Hyrimoz'],
    class: 'TNF inhibitor'
  },
  'etanercept': {
    genericName: 'etanercept',
    brandNames: ['Enbrel'],
    biosimilars: ['Erelzi', 'Eticovo'],
    class: 'TNF inhibitor'
  },
  'infliximab': {
    genericName: 'infliximab',
    brandNames: ['Remicade'],
    biosimilars: ['Inflectra', 'Renflexis', 'Avsola'],
    class: 'TNF inhibitor'
  },
  'upadacitinib': {
    genericName: 'upadacitinib',
    brandNames: ['Rinvoq'],
    biosimilars: [],
    class: 'JAK inhibitor'
  }
};

// Create reverse lookup map for fast resolution
const reverseLookup = new Map<string, string>();

for (const [genericName, drug] of Object.entries(drugAliases)) {
  // Add generic name
  reverseLookup.set(genericName.toLowerCase(), genericName);

  // Add brand names
  for (const brand of drug.brandNames) {
    reverseLookup.set(brand.toLowerCase(), genericName);
  }

  // Add biosimilars
  for (const biosimilar of drug.biosimilars) {
    reverseLookup.set(biosimilar.toLowerCase(), genericName);
  }
}

/**
 * Normalize a drug name to its canonical generic name.
 * Accepts brand names, generic names, or biosimilar names (case-insensitive).
 *
 * @param query - Drug name to normalize
 * @returns Canonical generic name, or the original query if not found
 */
export function normalizeDrugName(query: string): string {
  const normalized = reverseLookup.get(query.toLowerCase());
  return normalized || query;
}

/**
 * Get full drug information for a given name.
 *
 * @param query - Drug name to look up
 * @returns DrugAlias object if found, undefined otherwise
 */
export function getDrugInfo(query: string): DrugAlias | undefined {
  const genericName = normalizeDrugName(query);
  return drugAliases[genericName];
}
