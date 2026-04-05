import { compareDrugAcrossPlans, listIssuers, searchDrugs, getPlanDrugDetail } from '../../src/server/antonrx-data.js';

type Failure = { check: string; details: string };

function expect(condition: boolean, check: string, details: string, failures: Failure[]) {
  if (!condition) {
    failures.push({ check, details });
  }
}

async function main() {
  const failures: Failure[] = [];

  const adalimumab = compareDrugAcrossPlans('adalimumab');
  const humira = compareDrugAcrossPlans('Humira');
  const rituxan = compareDrugAcrossPlans('Rituxan');
  const issuers = listIssuers();
  const rituxSuggestions = searchDrugs('ritux');

  expect(adalimumab.length > 0, 'adalimumab-has-results', 'adalimumab query returned no results', failures);
  expect(humira.length === adalimumab.length, 'humira-alias-count', `Humira count ${humira.length} did not match adalimumab count ${adalimumab.length}`, failures);
  expect(rituxan.length > 0, 'rituxan-has-results', 'Rituxan query returned no results', failures);
  expect(issuers.includes('UHC'), 'issuer-uhc-present', 'UHC missing from issuer list', failures);
  expect(!issuers.includes('UnitedHealthcare'), 'issuer-uhc-deduped', 'UnitedHealthcare still appears separately from UHC', failures);
  expect(rituxSuggestions.filter((item) => item.toLowerCase() === 'rituxan').length <= 1, 'drug-suggestions-deduped', `Rituxan suggestions still duplicated: ${rituxSuggestions.join(', ')}`, failures);

  const structuredDetail = getPlanDrugDetail('STRUCTURED-UHC-COMMERCIAL', 'Humira');
  expect(Boolean(structuredDetail), 'structured-detail-humira', 'Humira detail lookup failed for structured UHC policy', failures);
  if (structuredDetail) {
    expect(structuredDetail.coverageLabel === 'Covered with PA', 'structured-detail-coverage', `unexpected coverage ${structuredDetail.coverageLabel}`, failures);
    expect(structuredDetail.normalizedRuleFacets.includes('prior_authorization'), 'structured-detail-facets', 'structured detail missing prior_authorization facet', failures);
  }

  console.log(JSON.stringify({
    issuers,
    rituxSuggestions,
    counts: {
      adalimumab: adalimumab.length,
      humira: humira.length,
      rituxan: rituxan.length
    },
    failures
  }, null, 2));

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

await main();
