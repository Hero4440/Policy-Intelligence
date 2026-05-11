# Gemini API Setup Guide

**Migration Date:** 2026-05-10  
**Status:** ✅ Complete and Tested

## Overview

This project uses Google's **Gemini API** for all LLM operations (tool planning, response generation, evidence grounding). The API is configured via environment variables and requires an API key.

## Prerequisites

- **Gemini API Key** — Obtain from [Google AI Studio](https://ai.google.dev)
- **Node.js 18+** — For running the development/production server
- **npm or yarn** — For dependency management

## Setup Instructions

### 1. Obtain API Key

1. Go to [Google AI Studio](https://ai.google.dev)
2. Click "Get API Key" in the top-right corner
3. Create a new API key or use an existing one
4. Copy the key

### 2. Configure Environment Variables

Create or update `.env.local` in the project root:

```bash
# Required
GEMINI_KEY_API=your_api_key_here

# Optional (defaults shown)
GEMINI_MODEL=gemini-2.5-flash
GEMINI_VERTEX_PROJECT_ID=policy-intelligence-493802
GEMINI_VERTEX_LOCATION=us-central1
```

**Security Note:** Never commit `.env.local` to version control. Add it to `.gitignore`.

### 3. Verify Configuration

Run the health check endpoint:

```bash
npm run server:dev
# Then in another terminal:
curl http://localhost:3000/api/health
```

You should see a response with status `"ok"`.

## Available Models

The following Gemini models are available and tested:

| Model | Speed | Cost | Best For |
|-------|-------|------|----------|
| `gemini-2.5-flash` | ⚡ Fastest | 💰 Cheapest | Production (recommended) |
| `gemini-2.5-pro` | 🚀 Very Fast | 💵 Moderate | High-quality responses |
| `gemini-2.0-flash` | ⚡ Fast | 💰 Cheap | Legacy/stable |
| `gemini-2.0-flash-lite` | ⚡⚡ Fastest | 💰 Lowest | Cost-sensitive scenarios |

**Default:** `gemini-2.5-flash`

To use a different model, set `GEMINI_MODEL`:

```bash
GEMINI_MODEL=gemini-2.5-pro npm run server:dev
```

## API Features & Limitations

### Supported Features ✅

- **Tool Planning** — Routing user queries to appropriate tools
- **Streaming Responses** — Real-time SSE for chat endpoints
- **Structured Output** — JSON-formatted responses
- **System Prompts** — Custom instructions for response generation
- **Error Handling** — Detailed error messages and fallbacks
- **Token Usage Tracking** — Metadata on request consumption

### Known Limitations ⚠️

1. **No System Role** — Gemini doesn't have explicit "system" role
   - **Workaround:** System message is prepended to first user message
   
2. **No JSON Schema Enforcement** — Can't enforce strict JSON output format
   - **Workaround:** Prompt engineering to ensure valid JSON
   
3. **Rate Limits** (Free Tier)
   - 15 requests per minute
   - 1M tokens per minute
   - **Upgrade to paid tier** for higher limits

4. **No Caching** — Unlike some providers, no prompt caching yet
   - **Note:** Always in active development; check API docs for updates

## Rate Limiting

If you hit rate limits (429 error):

1. **Short-term:** Requests are automatically retried with exponential backoff
2. **Long-term:** Upgrade to a paid Google Cloud project or optimize request volume

```bash
# Check current usage
curl https://ai.google.dev/pricing
```

## Cost Estimation

### Pricing (as of 2026-05)

- **Input:** ~$0.075 per 1M tokens
- **Output:** ~$0.30 per 1M tokens

### Example Monthly Costs

| Usage | Estimated Cost |
|-------|-----------------|
| 100 conversations | $0.30 |
| 1,000 conversations | $3.00 |
| 10,000 conversations | $30.00 |

### Cost Monitoring

1. Set up [Google Cloud billing alerts](https://cloud.google.com/billing/docs/how-to/budgets)
2. Monitor token usage in application logs
3. Consider caching strategies to reduce token consumption

## API Endpoints

### Non-Streaming Chat

```
POST https://generativelanguage.googleapis.com/v1/models/{model}:generateContent
```

### Streaming Chat

```
POST https://generativelanguage.googleapis.com/v1/models/{model}:streamGenerateContent?alt=sse
```

## Error Handling

Common error codes and solutions:

| Code | Cause | Solution |
|------|-------|----------|
| 400 | Invalid request format | Check API key, message format |
| 401 | Invalid/missing API key | Verify `GEMINI_KEY_API` is set |
| 404 | Model not found | Use valid model name (e.g., `gemini-2.5-flash`) |
| 429 | Rate limit exceeded | Implement backoff, upgrade tier |
| 500 | Server error | Retry after 60 seconds |
| 503 | Service unavailable | Check Google Cloud status page |

## Troubleshooting

### Server won't start

```bash
# Check if env var is set
echo $GEMINI_KEY_API

# If empty, load from .env.local
set -a
source .env.local
set +a

# Restart server
npm run server:dev
```

### "GEMINI_KEY_API environment variable is required"

The Node process doesn't have the environment variable set at startup.

**Solution:**
```bash
# Start server with explicit env var
GEMINI_KEY_API="your_key_here" npm run server:dev
```

### API returning empty responses

- Check that `GEMINI_MODEL` is set to a valid model
- Verify system prompt is not malformed
- Increase `maxOutputTokens` if response is being truncated

### Streaming stops early

- Check network connection
- Verify streaming endpoint is responding (check `alt=sse` parameter)
- Review browser console for WebSocket errors

## Environment Variables Reference

```bash
# API Configuration
GEMINI_KEY_API              # Required: Your Gemini API key
GEMINI_MODEL                # Optional: Model to use (default: gemini-2.5-flash)

# Vertex AI (optional, for enterprise)
GEMINI_VERTEX_PROJECT_ID    # GCP project ID
GEMINI_VERTEX_LOCATION      # GCP region (default: us-central1)

# Server
PORT                        # Server port (default: 3000)
NODE_ENV                    # Development or production
```

## Integration Points

The Gemini API is used in:

1. **src/server/chat.ts**
   - Tool planning and routing
   - Streaming response generation

2. **src/server/next-steps.ts**
   - Patient explanation generation
   - Payer analyst breakdown

3. **src/mcp/tools/utils/llm_client.ts**
   - Evidence-grounded answering
   - Policy question processing

4. **src/mcp/tools/ask_policy_question.ts**
   - MCP tool for policy questions

## Testing

Run the test suite:

```bash
npm run test
```

Manual testing:

```bash
# Start server
npm run server:dev

# Test health endpoint
curl http://localhost:3000/api/health

# Test chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-1",
    "messages": [{"role": "user", "content": "test"}]
  }'
```

## Migration from Ollama

**Previous Setup (Ollama):**
- Required local Ollama server (http://127.0.0.1:11434)
- Multiple API format support (native + OpenAI-compatible)
- Model resolution from installed models
- Custom streaming parsing

**Current Setup (Gemini):**
- Cloud-based API (generativelanguage.googleapis.com)
- Single standardized API format
- Cloud-based model management
- Native SSE streaming

**Key Changes:**
- Remove `OLLAMA_URL`, `OLLAMA_MODEL`, `LOCAL_LLM_MODEL` env vars
- Add `GEMINI_KEY_API` env var
- No local server dependency
- Improved error handling and rate limiting

## Support & Resources

- [Gemini API Documentation](https://ai.google.dev)
- [API Reference](https://ai.google.dev/api/rest/Generative)
- [Rate Limits & Quotas](https://ai.google.dev/docs/quotas)
- [Safety Settings](https://ai.google.dev/docs/safety_setting_gemini)
- [Pricing](https://ai.google.dev/pricing)

## FAQ

**Q: Can I use a different model?**  
A: Yes! Set `GEMINI_MODEL` to any available model (gemini-2.5-pro, gemini-2.0-flash, etc.)

**Q: What if I exceed rate limits?**  
A: Upgrade to a paid tier on Google Cloud. Free tier limits reset daily.

**Q: Is the API key secure?**  
A: Yes, but treat it like a password. Never commit to version control.

**Q: Can I use this in production?**  
A: Yes! Gemini API is production-ready. Set up billing alerts and monitor usage.

**Q: What's the latency?**  
A: Typically 1-5 seconds per request depending on complexity and model.

---

**Last Updated:** 2026-05-10  
**Status:** ✅ Tested and Verified
