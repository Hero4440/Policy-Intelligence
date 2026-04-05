import { readFileSync } from 'fs';
import {
  canonicalDrugKey,
  canonicalIssuerKey,
  canonicalPlanKey,
  inferRuleFacets
} from '../../src/server/normalization.js';
import { ingestFiles } from '../../src/server/ingestion/index.js';
import { compareDrugAcrossPlans } from '../../src/server/antonrx-data.js';

type Failure = { check: string; details: string };

function expect(condition: boolean, check: string, details: string, failures: Failure[]) {
  if (!condition) {
    failures.push({ check, details });
  }
}

async function main() {
  const failures: Failure[] = [];

  expect(canonicalDrugKey('Humira') === canonicalDrugKey('adalimumab'), 'canonical-drug-alias', `Humira and adalimumab did not normalize to same key`, failures);
  expect(canonicalIssuerKey('Blue Cross Blue Shield of Arizona') === canonicalIssuerKey('AZ Blue'), 'canonical-issuer-alias', `issuer aliases did not normalize to same key`, failures);
  expect(canonicalPlanKey('UHC', 'Commercial') !== canonicalPlanKey('UHC', 'Medicare'), 'canonical-plan-distinct', 'distinct plans collapsed to same key', failures);

  const facets = inferRuleFacets({
    requirementsText: 'Prior authorization required. Step therapy applies. Quantity limit 30-day supply. Must be prescribed by a rheumatologist.',
    priorAuth: true,
    stepTherapy: true,
    quantityLimit: '30-day supply'
  });
  expect(facets.includes('prior_authorization'), 'facet-pa', 'prior_authorization facet missing', failures);
  expect(facets.includes('step_therapy'), 'facet-st', 'step_therapy facet missing', failures);
  expect(facets.includes('quantity_limit'), 'facet-ql', 'quantity_limit facet missing', failures);
  expect(facets.includes('prescriber_specialist'), 'facet-specialist', 'prescriber_specialist facet missing', failures);

  const structuredBytes = readFileSync('data/policies/structured/uhc-adalimumab-ra.json');
  const pdfBytes = readFileSync('docs/hackaathon2/Medical Drug Coverage Policy Examples/Cigna Rituximab Intravenous Products for Non-Oncology Indications.pdf');

  await ingestFiles([
    {
      name: 'uhc-adalimumab-ra.json',
      mimeType: 'application/json',
      base64: structuredBytes.toString('base64')
    },
    {
      name: 'Cigna Rituximab Intravenous Products for Non-Oncology Indications.pdf',
      mimeType: 'application/pdf',
      base64: pdfBytes.toString('base64')
    }
  ]);

  const adalimumabMatches = compareDrugAcrossPlans('humira');
  const structured = adalimumabMatches.find((match) => match.sourceKind === 'uploaded_policy_json' && match.sourceFile === 'uhc-adalimumab-ra.json');
  expect(Boolean(structured), 'uploaded-structured-compare', 'uploaded structured record missing from compare', failures);
  if (structured) {
    expect(structured.canonicalDrugKey === canonicalDrugKey('adalimumab'), 'structured-canonical-drug', `unexpected canonicalDrugKey ${structured.canonicalDrugKey}`, failures);
    expect(structured.issuerKey === canonicalIssuerKey('UHC'), 'structured-issuer-key', `unexpected issuerKey ${structured.issuerKey}`, failures);
    expect(structured.planKey === canonicalPlanKey('UHC', 'UHC Commercial'), 'structured-plan-key', `unexpected planKey ${structured.planKey}`, failures);
    expect(structured.normalizedRuleFacets.includes('prior_authorization'), 'structured-facet-pa', 'structured match missing prior_authorization facet', failures);
    expect(structured.normalizedRuleFacets.includes('step_therapy'), 'structured-facet-st', 'structured match missing step_therapy facet', failures);
  }

  const rituximabMatches = compareDrugAcrossPlans('rituxan');
  const uploadedPdf = rituximabMatches.find((match) => match.sourceKind === 'uploaded_pdf_policy' && /Cigna/i.test(match.sourceFile));
  expect(Boolean(uploadedPdf), 'uploaded-pdf-compare', 'uploaded PDF record missing from compare', failures);
  if (uploadedPdf) {
    expect(uploadedPdf.issuerKey === canonicalIssuerKey('Cigna'), 'pdf-issuer-key', `unexpected pdf issuerKey ${uploadedPdf.issuerKey}`, failures);
    expect(uploadedPdf.canonicalDrugKey === canonicalDrugKey(uploadedPdf.primaryDrugLabel), 'pdf-canonical-drug', `unexpected pdf canonicalDrugKey ${uploadedPdf.canonicalDrugKey}`, failures);
    expect(uploadedPdf.normalizedRuleFacets.length > 0, 'pdf-facets-present', 'uploaded PDF match missing normalized facets', failures);
  }

  const canonicalAliasMatches = compareDrugAcrossPlans('adalimumab');
  expect(
    canonicalAliasMatches.some((match) => match.canonicalDrugKey === canonicalDrugKey('Humira')),
    'canonical-query-alias',
    'adalimumab query did not align with canonical Humira key',
    failures
  );

  console.log(JSON.stringify({ failures }, null, 2));
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

await main();
