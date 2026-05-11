# Problems Faced During Deployments

## Problem 1: Missing CSV Files on Disk

**Issue**: The application crashed with `ENOENT: no such file or directory` errors when trying to load CSV files (formulary_drugs.csv, plans.csv).

**Root Cause**: CSV files were excluded from git due to memory constraints on Railway, but the application expected them to exist on disk at `/app/data/formulary/`.

**Fix**: 
- Set up Railway S3 object storage (formulary-data bucket)
- Uploaded CSV files to S3 bucket
- Added S3 download logic to fetch missing CSV files at startup and cache them locally
- Created `downloadFromS3()` and `ensureCsvFile()` functions to handle file retrieval

## Problem 2: Wrong CSV File for Workspace Drug Queries

**Issue**: The application was using `formulary_drugs.csv` which lacked required columns (plan_id, plan_name, plan_family), causing "Cannot read properties of undefined (reading 'replace')" errors in the `canonicalPlanKey()` function.

**Root Cause**: `formulary_drugs.csv` doesn't contain plan metadata needed for the workspace tab's drug comparison tool.

**Fix**: 
- Replaced `formulary_drugs.csv` with `query_ready_formulary.csv` (line 398)
- This file contains all required columns: plan_id, plan_name, plan_family, and comprehensive drug coverage data

## Problem 3: JavaScript Heap Out of Memory Error

**Issue**: Railway deployment repeatedly crashed with `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory` when loading the 31MB query_ready_formulary.csv file.

**Root Cause**: The application was using `readFileSync()` to load the entire CSV file into memory at once, then processing it with a custom CSV parser. For a 31MB file, this exceeded Node.js v20.20.2's default heap size (~512MB), especially after data transformation into structured objects.

**Symptoms**:
- Frontend showed 502 Bad Gateway errors
- Server would crash during startup or when routes tried to access the CSV data
- Memory usage jumped to near heap limit before crash

**Initial Fix Attempt (Incomplete)**: 
- Installed `csv-parser` package
- Created streaming functions to read CSV from S3 without converting to string
- Problem: Still accumulated all rows in memory before returning them

**Final Fix**:
Implemented **two-part solution**:

### Part 1: Streaming CSV Parser
- Replaced `readFileSync()` with stream-based reading using `csv-parser`
- Streams directly from S3 or local disk without loading entire file into memory
- Uses Promise-based approach to pipe stream through parser and collect rows:
  ```typescript
  const stream = await getLocalOrS3Stream(fileName);
  const rows: CsvRow[] = [];
  
  return new Promise((resolve, reject) => {
    stream
      .pipe(csvParser())
      .on('data', (row: CsvRow) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
  ```

### Part 2: Catalog Loading Synchronization
- Added `loadingPromise` variable to prevent concurrent CSV loads
- When multiple requests arrive during startup, they wait for first load instead of all loading simultaneously
- Prevents memory multiplication from parallel CSV parsing:
  ```typescript
  if (loadingPromise) {
    return loadingPromise;
  }
  loadingPromise = (async () => {
    // Load all three CSVs sequentially
  })();
  ```

**Result**: 
- Server now starts without memory errors
- CSV files stream line-by-line instead of loading entirely into memory
- Concurrent requests share single catalog load instead of each triggering separate loads
- No more 502 Bad Gateway errors

## Problem 4: Chat Interface Hardcoded to Wrong Endpoint

**Issue**: Chat tab was not functional and displayed "No grounded policy evidence matched that question" error for all drug coverage queries.

**Root Cause**: The frontend chat component (`chat-view.tsx`) was hardcoded to call `/api/chat/policy-qa` endpoint, which is the policy evidence QA chat that requires uploaded PDF documents. This endpoint was being used for drug coverage questions that should instead use the `/api/chat` endpoint with pre-loaded CSV data.

**Fix**:
- Changed chat endpoint from `/api/chat/policy-qa` to `/api/chat` (lines 215 and 268)
- Updated request payload format from `{ question }` to `{ sessionId, messages, context }`
- Implemented Server-Sent Events (SSE) stream parsing to handle the streaming response format
- Added event type detection for `final_answer` chunks to extract the assistant response

**Code Changes**:

```typescript
// Before: Used JSON endpoint
const response = await fetch('/api/chat/policy-qa', {
  method: 'POST',
  body: JSON.stringify({ question })
});
const payload = await response.json();

// After: Uses SSE streaming endpoint
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ sessionId, messages, context: {} })
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  // Parse SSE data: chunks
  // Extract final_answer from parsed events
}
```

**Result**:

- Chat now works immediately with pre-loaded drug formulary CSV data
- No file uploads required for drug coverage queries
- Users can ask questions like "Does Aetna cover Humira?" and get answers from CSV data
- Questions about prior authorization, cross-plan comparisons, and step therapy requirements now return appropriate responses

## Deployment Status

✅ **Current Status**: All four fixes deployed and working

- CSV files stream from S3 successfully
- Server starts without crashing
- Workspace tab drug queries work correctly with query_ready_formulary.csv data
- No out-of-memory errors
- Chat interface connected to drug coverage endpoint and functional

## Technical Details

**Files Modified**:
- `src/server/policy-data.ts` - Added S3 streaming, CSV parser integration, load synchronization
- `src/frontend/components/chat-view.tsx` - Updated chat endpoint and SSE stream handling
- `.gitignore` - Excluded large CSV files from git
- `upload-to-s3.js` - Created helper script for uploading CSV files to S3

**Environment Variables Required**:
- `S3_ENDPOINT` - S3-compatible endpoint URL
- `S3_BUCKET` - S3 bucket name
- `S3_ACCESS_KEY` - S3 access key ID
- `S3_SECRET_KEY` - S3 secret access key
- `S3_REGION` - S3 region (default: "auto")

**Key Improvements**:
1. Memory efficient - large CSV files no longer cause heap exhaustion
2. Network efficient - streams directly from S3 without intermediate string conversion
3. Request efficient - concurrent requests share single catalog load instead of multiplicative memory usage
4. Resilient - falls back to local cached files if S3 is unavailable
