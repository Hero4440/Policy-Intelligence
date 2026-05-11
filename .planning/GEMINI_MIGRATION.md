# Gemini Migration Plan

**Project:** Policy Intelligence  
**Current State:** Ollama/Llama-based LLM integration  
**Target State:** Google Gemini API integration  
**Date Created:** 2026-05-10

---

## 1. Executive Summary

This plan outlines the migration from a local Ollama/Llama setup to Google's Gemini API. The migration will:
- Replace all Ollama endpoints with Gemini API calls
- Maintain existing function signatures to minimize downstream changes
- Leverage the verified `GEMINI_KEY_API` from `.env.local`
- Use `gemini-2.5-flash` as the primary model
- Reduce infrastructure dependencies (no local Ollama instance needed)

**Scope:** 4 files, ~800 lines of code  
**Complexity:** Medium (API contract changes, streaming format changes)  
**Risk Level:** Medium (API key dependency, rate limits, costs)

---

## 2. Current State Analysis

### 2.1 Files to Migrate

| File | Purpose | Complexity | Lines |
|------|---------|-----------|-------|
| [src/server/chat.ts](src/server/chat.ts) | Main chat routing, tool planning, streaming responses | High | ~959 |
| [src/server/next-steps.ts](src/server/next-steps.ts) | Next steps generation for coverage decisions | Medium | ~200 |
| [src/mcp/tools/utils/llm_client.ts](src/mcp/tools/utils/llm_client.ts) | Evidence-grounded answering | Medium | ~169 |
| [src/mcp/tools/ask_policy_question.ts](src/mcp/tools/ask_policy_question.ts) | Policy question tool | Medium | ~100 |

### 2.2 Current Ollama Integration Pattern

All files follow the same pattern:
1. **Endpoint detection:** Try multiple Ollama endpoints (`/api/chat`, `/v1/chat/completions`)
2. **Model resolution:** Check installed models, fall back to defaults
3. **Request format:** Two formats depending on endpoint (Ollama native vs OpenAI-compatible)
4. **Streaming:** Server-sent events (SSE) for chat responses
5. **Error handling:** Retry logic, fallback models

### 2.3 Environment Configuration

Current `.env.local` contains:
```
OLLAMA_URL=http://127.0.0.1:11434  (implicit default)
OLLAMA_MODEL=llama3.1              (implicit default)
GEMINI_KEY_API=AQ.Ab8RN6LOYe_3...  (already present)
GEMINI_VERTEX_PROJECT_ID=policy-intelligence-493802
GEMINI_VERTEX_LOCATION=us-central1
```

---

## 3. Gemini API Overview

### 3.1 API Endpoints

**REST API (recommended for this project):**
- Base: `https://generativelanguage.googleapis.com/v1`
- Endpoint: `/models/{model}:generateContent`
- Auth: API key in query string or header
- Streaming: Server-sent events support

**Available Models:**
- `gemini-2.5-flash` ✅ (recommended, latest, tested)
- `gemini-2.5-pro` (more capable, higher latency/cost)
- `gemini-2.0-flash` (stable, lower cost)
- `gemini-2.0-flash-lite` (fastest)

### 3.2 API Differences from Ollama

| Aspect | Ollama | Gemini |
|--------|--------|--------|
| **Auth** | None (local) | API key required |
| **Request Format** | Native or OpenAI-compat | Google native only |
| **Content Format** | `messages` array | `contents` array with `parts` |
| **Roles** | system, user, assistant | user, model |
| **Streaming** | Native `stream: true` | `?alt=sse` parameter |
| **Cost** | Free (local) | Paid (per 1M tokens) |
| **Rate Limits** | None (local) | 15 RPM / 1M TPM (free tier) |

### 3.3 Request/Response Structure

**Ollama Format:**
```javascript
// Request
{ model: "llama3.1", messages: [...], stream: true }

// Response (streaming)
{ message: { content: "..." }, done: true }
```

**Gemini Format:**
```javascript
// Request
{ contents: [{ parts: [{ text: "..." }], role: "user" }] }

// Response (streaming)
{ candidates: [{ content: { parts: [{ text: "..." }] } }] }
```

---

## 4. Migration Strategy

### 4.1 Phase-by-Phase Approach

**Phase 1: Create Gemini Client Abstraction**
- New file: `src/server/gemini-client.ts`
- Functions: `geminiChat()`, `geminiStream()`
- Purpose: Encapsulate API logic, parallel to Ollama for easy comparison

**Phase 2: Migrate chat.ts**
- Replace `ollamaChat()` with `geminiChat()`
- Replace `fetchOllama()` with Gemini API calls
- Update streaming in `streamFinalAnswer()`
- Remove Ollama-specific model resolution

**Phase 3: Migrate next-steps.ts**
- Similar pattern to chat.ts
- Replace LLM client calls

**Phase 4: Migrate llm_client.ts**
- Update `answerWithGrounding()` to use Gemini
- Keep function signature identical

**Phase 5: Migrate ask_policy_question.ts**
- Update any Ollama/LLM calls
- Minimal changes expected

**Phase 6: Testing & Cleanup**
- Verify all endpoints work
- Remove Ollama environment variables (if desired)
- Update documentation

### 4.2 Key Implementation Details

#### 4.2.1 API Key Management
- Read `GEMINI_KEY_API` from `.env.local`
- Fallback: `process.env.GOOGLE_GENERATIVE_AI_API_KEY`
- Never hardcode or log keys
- Consider adding rate-limit error handling

#### 4.2.2 Content Format Conversion

**Convert user messages to Gemini format:**
```typescript
// Ollama: { role: "user", content: "text" }
// Gemini: { role: "user", parts: [{ text: "text" }] }

function toLlmContent(messages: ChatPayload) {
  return messages.map(msg => ({
    role: msg.role === 'system' ? 'user' : msg.role,  // Gemini has no system role
    parts: [{ text: msg.content }]
  }));
}
```

#### 4.2.3 System Prompts
- Gemini doesn't have explicit system role
- Solution: Prepend system message as first user message with clear separation
- Or: Include system context in the user message

#### 4.2.4 Streaming Response Parsing

**Ollama SSE:**
```
data: {"message":{"content":"text"},"done":false}
data: [DONE]
```

**Gemini SSE:**
```
data: {"candidates":[{"content":{"parts":[{"text":"text"}]}}]}
```

No explicit `[DONE]` signal; use `finishReason` or end-of-stream detection.

#### 4.2.5 Error Handling

**New error scenarios:**
- Invalid API key → 400 Bad Request
- Rate limit exceeded → 429 Too Many Requests
- Model not found → 404 Not Found (same as Ollama)
- Quota exceeded → 429 or 503

**Recommendation:** Add retry logic with exponential backoff for rate limits.

### 4.3 Testing Strategy

#### Unit Tests
- Mock Gemini API responses
- Test message format conversion
- Test streaming chunk parsing
- Test error scenarios

#### Integration Tests
- Call actual Gemini API with test prompts
- Verify tool planning accuracy
- Verify streaming responses are complete
- Cost tracking (log tokens consumed)

#### Manual Testing
- Test main chat flow
- Test tool execution (which_plans_cover_drug, etc.)
- Test streaming in frontend
- Test error fallbacks

---

## 5. Detailed Specifications

### 5.1 New File: src/server/gemini-client.ts

```typescript
// Core functions needed:
export async function geminiChat(
  messages: ChatPayload,
  options?: { model?: string; temperature?: number }
): Promise<string>

export async function geminiStream(
  messages: ChatPayload,
  options?: { model?: string; temperature?: number }
): Promise<ReadableStream<string>>  // For SSE

export async function parseGeminiStreamResponse(
  chunk: string
): Promise<{ content: string; isDone: boolean }>

// Helper functions:
function formatAsGeminiContent(messages: ChatPayload): GeminiContent[]
function extractTextFromResponse(response: GeminiResponse): string
```

### 5.2 Model Selection Strategy

**Default Model:** `gemini-2.5-flash`
- Latest and most capable
- Good balance of speed/cost
- Verified working with API key

**Fallback:** `gemini-2.0-flash`
- Stable, well-tested
- Lower cost if needed

**Configuration:**
```typescript
const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
```

### 5.3 Cost & Rate Limits

**Gemini API Pricing (as of 2026):**
- Input: ~$0.075 per 1M tokens (flash)
- Output: ~$0.30 per 1M tokens (flash)

**Estimated Monthly Cost (rough):**
- 100 conversations × 5 tool calls × 500 tokens avg = 250k tokens
- Monthly: ~$20-30 for full usage

**Rate Limits (Free Tier):**
- 15 requests per minute
- 1M tokens per minute

**Mitigation:**
- Add request queuing for rate limit handling
- Implement exponential backoff
- Log token usage for cost tracking

---

## 6. Environment Configuration

### 6.1 Required Environment Variables

```bash
# New/Updated
GEMINI_KEY_API=
GEMINI_MODEL=gemini-2.5-flash  # Optional, defaults above

# Can be removed (Ollama)
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1

# Keep but not used for LLM
GEMINI_VERTEX_PROJECT_ID=policy-intelligence-493802
GEMINI_VERTEX_LOCATION=us-central1
```

### 6.2 Configuration in Code

**Initialization (new):**
```typescript
const GEMINI_API_KEY = process.env.GEMINI_KEY_API || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1';
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_KEY_API environment variable is required');
}
```

---

## 7. Risk Assessment & Mitigation

### 7.1 Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| API key exposure | Critical | Low | Never log keys, use env vars only |
| Rate limits exceeded | High | Medium | Queue requests, implement backoff |
| API downtime | High | Low | Graceful error messages to users |
| Cost overruns | Medium | Low | Monitor token usage, set up alerts |
| Streaming format issues | Medium | Medium | Thorough testing before deploy |
| System prompt handling | Medium | High | Test with long prompts first |
| Model availability | Low | Low | Already verified working |

### 7.2 Mitigation Strategies

**API Key Security:**
- Use GitHub Secrets for CI/CD
- Rotate key annually
- Log access patterns for anomalies

**Rate Limiting:**
```typescript
// Implement simple queue
const requestQueue: Array<() => Promise<any>> = [];
const processQueue = throttle(() => {
  if (requestQueue.length > 0) {
    const fn = requestQueue.shift();
    fn?.().finally(processQueue);
  }
}, 4000); // 15 RPM = ~4s per request
```

**Cost Control:**
- Set up Google Cloud billing alerts
- Log token usage per request
- Monitor for unusual patterns

**Graceful Degradation:**
- If API down, show informative error
- Provide manual fallback options
- Log errors for debugging

---

## 8. Implementation Checklist

### Phase 1: Foundation
- [ ] Create `src/server/gemini-client.ts`
- [ ] Implement core functions (`geminiChat`, `geminiStream`)
- [ ] Test with dummy prompts
- [ ] Document API response format

### Phase 2: Migration
- [x] Update `src/server/chat.ts`
  - [x] Replace `ollamaChat()` calls with `geminiChat()`
  - [x] Remove `fetchOllama()` implementation
  - [x] Update `streamFinalAnswer()` to use `geminiStream()`
  - [x] Replace `DEFAULT_MODEL` with `getDefaultModel()`
- [x] Update `src/server/next-steps.ts`
  - [x] Replace `callLlama()` with `callGemini()`
  - [x] Remove Ollama endpoint resolution
- [x] Update `src/mcp/tools/utils/llm_client.ts`
  - [x] Replace `fetchLocalLlm()` with `geminiChat()`
  - [x] Simplify `answerWithGrounding()` function
- [x] Update `src/mcp/tools/ask_policy_question.ts`
  - [x] Update error hint for Gemini

### Phase 3: Testing
- [ ] Unit tests for format conversion
- [ ] Integration test with real API
- [ ] Manual end-to-end testing
- [ ] Streaming response verification
- [ ] Error scenario testing

### Phase 4: Cleanup & Docs
- [ ] Remove Ollama references from comments
- [ ] Update README if it mentions Ollama
- [ ] Document Gemini configuration
- [ ] Remove unused Ollama environment variables (optional)
- [ ] Update deployment docs

### Phase 5: Monitoring
- [ ] Set up token usage logging
- [ ] Create Google Cloud billing alert
- [ ] Monitor error rates
- [ ] Track API latency

---

## 9. Success Criteria

✅ **Must Have:**
1. All four files successfully migrate to Gemini API
2. Tool planning works correctly (same accuracy as Ollama)
3. Streaming responses work in frontend
4. No increase in error rates vs. baseline
5. API key is not exposed in logs or errors

✅ **Should Have:**
1. Token usage logging implemented
2. Rate limit handling with backoff
3. Error messages are user-friendly
4. Documentation updated

⚠️ **Nice to Have:**
1. Cost tracking dashboard
2. Model switching capability
3. Batch request optimization
4. Caching for repeated queries

---

## 10. Rollback Plan

**If issues occur during migration:**

1. **Immediate (emergency):**
   - Switch `DEFAULT_MODEL` back to Ollama fallback
   - Keep both implementations temporarily
   - Route percentage of traffic to each

2. **Short-term (48 hours):**
   - Deploy Gemini client as unused code
   - Keep Ollama running in parallel
   - Run A/B tests

3. **Long-term:**
   - Fix issues in Gemini implementation
   - Gradually increase traffic to Gemini
   - Eventually remove Ollama code

**Rollback Code:**
```typescript
// Temporary dual-client support
const USE_GEMINI = process.env.USE_GEMINI ?? 'true';
const response = USE_GEMINI 
  ? await geminiChat(messages)
  : await ollamaChat(messages);
```

---

## 11. Timeline Estimate

| Phase | Tasks | Duration | Notes |
|-------|-------|----------|-------|
| **1** | Foundation & gemini-client.ts | 2 hours | Straightforward API wrapper |
| **2a** | chat.ts migration | 3 hours | Most complex, streaming involved |
| **2b** | next-steps.ts, llm_client.ts, ask_policy_question.ts | 2 hours | Similar patterns |
| **3** | Testing & fixing | 3 hours | Error scenarios, edge cases |
| **4** | Cleanup & docs | 1 hour | Comments, README, configs |
| **5** | Monitoring setup | 1 hour | Logging, alerts |
| | **Total** | **~12 hours** | Can be done in 1-2 working days |

---

## 12. Post-Migration Monitoring

**First Week:**
- Daily check of error logs
- Monitor token usage and costs
- Verify tool planning accuracy
- Check for latency degradation

**Ongoing:**
- Weekly cost report
- Monthly token usage analysis
- Quarterly review of model updates
- Annual API key rotation

---

## 13. Appendix: Gemini API Quick Reference

### Request Format
```typescript
interface GeminiRequest {
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
  safetySettings?: Array<...>;
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}
```

### Response Format
```typescript
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: 'model';
    };
    finishReason: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'OTHER';
    safetyRatings?: Array<...>;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}
```

### Error Handling
```typescript
// Common error codes
400 - Bad Request (invalid format, API key)
401 - Unauthorized (invalid key)
404 - Not Found (model doesn't exist)
429 - Rate Limited (too many requests)
500 - Server Error (Google's side)
503 - Service Unavailable
```

---

## 14. References

- [Gemini API Documentation](https://ai.google.dev)
- [API Reference](https://ai.google.dev/api/rest/Generative)
- [Streaming Guide](https://ai.google.dev/tutorials/rest_quickstart#streaming)
- [Safety Settings](https://ai.google.dev/docs/safety_setting_gemini)
- [Rate Limits & Quotas](https://ai.google.dev/docs/quotas)

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-10  
**Owner:** Tanmay Bhuskute  
**Status:** Ready for Implementation
