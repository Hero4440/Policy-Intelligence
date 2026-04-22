# 06-01 Summary

- This plan defines the Phase 6 policy ingestion backend entry point: PDF upload, parse, persist structured policy, and persist raw source file.
- Planned artifacts are `src/server/policy-parser.ts`, `src/server/policy-routes.ts`, and `src/server/index.ts` wiring for `/api/policies/upload`, `/api/policies`, `/api/policies/:policyId`, and `/api/policies/:policyId/versions`.
- The intended parser behavior is heuristic PDF normalization into a `PolicyRecord`, with policyId slugification based on policy title plus payer and versioned persistence via the Phase 5 storage layer.
- Current repo status: this plan is documented but not implemented as specified. The closest existing backend artifact is [src/server/ingestion/pdf-policy-parser.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/server/ingestion/pdf-policy-parser.ts), and there is no dedicated `src/server/policy-routes.ts` upload/list/detail route set.
- Scope boundary: this plan belongs to Phase 6 policy management and does not include patient-case creation or patient document workflows.
