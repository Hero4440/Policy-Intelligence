# 09-02 Summary

- Strengthened deterministic extraction in [src/storage/patient-store.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/storage/patient-store.ts) for supported patient documents.
- Reused the existing FHIR bundle extraction flow and added explicit fact emission for:
  - diagnosis
  - requested drug
  - payer / insurance
  - medication history
- Improved plain-text note heuristics for:
  - diagnosis
  - requested drug
  - payer / insurance
  - prescriber
  - prior therapies
  - medication list
- Every extracted fact now persists with:
  - `sourceDocumentId`
  - `label`
  - `value`
  - `confidence`
  - `evidenceSnippet`
- Case detail payloads continue to return documents and facts together, which is enough for the Phase 9 UI and the later evaluation engine.

**Intentional limits**

- Extraction remains deterministic and heuristic-driven
- scanned PDFs and OCR are still out of scope
- sparse notes fall back to a generic clinical-note fact instead of inventing missing medical structure

**Verification**

- `npx tsc --noEmit` passes
- direct smoke with a synthetic note confirms diagnosis, requested drug, payer, prescriber, and prior therapy facts are extracted

