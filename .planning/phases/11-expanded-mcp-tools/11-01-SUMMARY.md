# 11-01 Summary

- Added the `upload_policy_document` MCP tool in [src/mcp/tools/upload_policy_document.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/mcp/tools/upload_policy_document.ts).
- The tool accepts either `file_path` or `url`, downloads or reads the file, infers MIME type, and forwards the payload into the existing ingestion pipeline through `ingestOneFile`.
- Responses use the standard MCP wrapper shape: `answer`, `structured_result`, `evidence`, and `confidence`.
- Added the `parse_policy_document` MCP tool in [src/mcp/tools/parse_policy_document.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/mcp/tools/parse_policy_document.ts).
- The parse tool supports:
  - re-parsing an uploaded source via `source_id`
  - parsing a text-based local file via `file_path`
- Direct binary PDF parsing is intentionally rejected in `parse_policy_document`; PDF extraction remains routed through `upload_policy_document` and the ingestion pipeline.
- Wired both tools into the MCP server in [src/mcp/index.ts](/Users/tanmaybhuskute/Documents/Policy-Intelligence/src/mcp/index.ts).
- Updated the MCP health payload to report `9` registered tools instead of `7`.
- Phase plan note: the current ingestion store persists source records in `data/ingestion/db.json`, so `parse_policy_document` resolves `source_id` through that database rather than a per-source JSON file path.
- TODO follow-up: consider adding per-source metadata files under `data/ingestion/sources/{source_id}.json` if the ingestion storage layer is refactored beyond the current single-file database approach.

**Verification**

- `npx tsc --noEmit` passes
- `grep -n "registerUploadPolicyDocument\|ingestOneFile\|buildStandardResponse" src/mcp/tools/upload_policy_document.ts` passes
- `grep -n "registerParsePolicyDocument\|parsePdfPolicyText\|buildStandardResponse" src/mcp/tools/parse_policy_document.ts` passes
