# Phase 5: File-Based Storage Foundation - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a reliable, versioned file storage layer for policies, patients, and evaluations. All data persists across server restarts. This phase covers the storage primitives only — how data is written, versioned, diffed, indexed, and reloaded. UI, search, and retrieval APIs are separate concerns.

</domain>

<decisions>
## Implementation Decisions

### Policy Index Sync
- Index updates immediately on every write (atomic rewrite of index.json)
- Index is always derived from files on disk — files are authoritative, not the index
- On startup, always rebuild index from disk scan (self-healing against crashes)
- index.json tracks per policy: payer, title, drug family, version list, current version pointer — nothing else

### Version & Diff Record Structure
- Versioned policy files named: `{policy-id}_v{N}.json` (e.g., `aetna-humira_v1.json`)
- Diff records stored alongside policy files: `{policy-id}_diff_v{N-1}_to_v{N}.json`
- Diff records capture field-level changes: which fields changed, old value, new value (structured, not raw diff)
- Diff record metadata: timestamp + from_version + to_version only

### Startup Reload Behavior
- On startup: scan disk → rebuild index → load all policies into memory
- Malformed policy files: log error + skip that file, continue loading others (server starts regardless)
- Only policies are loaded into memory at startup; patients and evaluations stay on disk, read on demand
- No hot-reload endpoint — restart is sufficient for now

### File Naming & Folder Conventions
- Policy IDs derived from slugified payer + drug family (e.g., `aetna-humira`) — human-readable, predictable
- Patient case IDs: Claude's discretion (UUID preferred for privacy)
- Evaluation IDs: Claude's discretion (UUID preferred for simplicity)
- data/ directory handling: Claude's discretion (git-ignore recommended as runtime state)

### Claude's Discretion
- Patient case ID format (UUID recommended — avoid PII in filenames)
- Evaluation ID format (UUID recommended — no dependency on other IDs)
- Whether data/ is committed or git-ignored (git-ignore recommended)
- Exact error logging format for malformed files on startup
- Atomic write strategy (temp file + rename) for index.json

</decisions>

<specifics>
## Specific Ideas

- Policy filenames should be human-readable from the filesystem — no opaque hashes for policies
- The system should be self-healing: a crash mid-write shouldn't require manual repair
- Keep it simple for now — no hot-reload, no admin endpoints, restart is acceptable

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-file-based-storage-foundation*
*Context gathered: 2026-04-21*
