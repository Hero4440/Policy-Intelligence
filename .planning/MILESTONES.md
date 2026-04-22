# Milestones

## v1.0 POC (Shipped: 2026-04-22)

**Phases completed:** 5 phases, 12 plans
**Timeline:** 2026-04-03 → 2026-04-22 (18 days)
**Codebase:** 7,611 lines TypeScript

**Key accomplishments:**
1. Extended PolicyRecordSchema with oncology fields and added bevacizumab/rituximab drug alias families with biosimilar + FDA suffix resolution
2. Extracted BCBS NC (bevacizumab oncology) and Cigna (rituximab non-oncology) policies into structured JSON with evidence snippets
3. Built 7 MCP tools (list, summary, compare, Q&A, coverage, PA criteria, patient readiness) with evidence grounding and StreamableHTTP transport
4. Deployed via ngrok with full Prompt Opinion integration — all 7 tools callable end-to-end
5. Established file-based storage layer: versioned policy files, diff engine, UUID-backed patient case folders, evaluation records, startup disk reload

**Git range:** bf2114a → c538b3a

---

