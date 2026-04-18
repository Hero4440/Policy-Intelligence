# Phase 4: Deployment + Integration - Research

**Researched:** 2026-04-18
**Domain:** MCP server production deployment via ngrok tunnel with Prompt Opinion integration
**Confidence:** HIGH

## Summary

Phase 4 deploys the existing MCP server to public HTTPS via ngrok and validates full integration with Prompt Opinion. The server already has StreamableHTTP transport, CORS, and a health endpoint configured. The core challenge is not technical architecture—it's operational: establishing the ngrok tunnel with proper host validation, testing remote access, and documenting the Prompt Opinion connection workflow.

The existing codebase shows strong MCP deployment foundation: `/mcp` endpoint uses stateless per-request server instances, CORS allows `origin: true`, health endpoint returns policy/payer/drug counts, and smoke tests validate both local and remote deployments. The deployment runbook in `docs/prompt-opinion/` confirms this pattern has been validated previously.

**Primary recommendation:** This is primarily an execution phase, not a design phase. Use the existing `deployment-runbook.md` as the blueprint, validate ngrok tunnel setup with `PUBLIC_BASE_URL` environment variable for host validation, run smoke tests at each stage, and document Prompt Opinion connection steps as they're performed.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@modelcontextprotocol/sdk` | 1.29.0 | MCP protocol implementation | Official TypeScript SDK from Anthropic, includes StreamableHTTP transport and Express helpers |
| `@ngrok/ngrok` | latest | Secure tunnel to localhost | Official ngrok Node.js SDK—no binaries, production-ready, programmatic control |
| `express` | 5.2.1 | HTTP server framework | Already in use; MCP SDK provides `createMcpExpressApp()` integration |
| `cors` | 2.8.5 | CORS middleware | Already configured; required for browser-based MCP clients like Prompt Opinion |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ngrok` (community) | 5.x | Alternative tunnel wrapper | Fallback if official SDK has issues; similar API but wraps ngrok binary |
| `tsx` | 4.21.0 | TypeScript execution | Already used for `npm start` and smoke tests |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ngrok | LocalTunnel, Cloudflare Tunnel, serveo.net | Free alternatives exist but ngrok has best stability, dev domains (`.ngrok-free.dev`), and ecosystem support |
| Programmatic ngrok | CLI only | CLI is simpler for hackathons but programmatic approach enables automated deployment scripts |
| StreamableHTTP | SSE transport | SSE deprecated June 2025; StreamableHTTP is current standard |

**Installation:**
```bash
npm install @ngrok/ngrok
# Already installed: @modelcontextprotocol/sdk, express, cors
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── mcp/
│   ├── index.ts              # MCP server with StreamableHTTP (already exists)
│   └── tools/                # Tool registrations (already exists)
scripts/
├── deploy-ngrok.ts           # Programmatic ngrok tunnel startup
└── dev-stack.sh              # Local dev orchestration (already exists)
tests/
└── mcp/
    └── smoke-remote-server.ts # Remote validation (already exists)
docs/
└── prompt-opinion/
    ├── deployment-runbook.md  # Deployment steps (already exists)
    └── workspace-integration.md # Prompt Opinion setup (already exists)
```

### Pattern 1: Stateless StreamableHTTP with Per-Request Server Instances

**What:** Each POST to `/mcp` creates a new `McpServer` instance and `StreamableHTTPServerTransport`, registers tools, connects, handles the request, then disposes. No session state persists between requests.

**When to use:** Required for horizontal scaling and load balancer compatibility. Matches current codebase implementation.

**Example (from existing code):**
```typescript
// Source: /Users/hero4440/Documents/Code/inovationhacks_2/src/mcp/index.ts
app.post('/mcp', async (req, res) => {
  const server = new McpServer(
    { name: 'policypilot', version: '1.0.0' },
    { capabilities: { tools: {}, extensions: { 'ai.promptopinion/fhir-context': {} } } }
  );

  registerGetDrugCoverage(server);
  registerGetPriorAuthCriteria(server);
  registerCheckPatientReadiness(server);
  registerListPolicies(server);
  registerGetPolicySummary(server);
  registerCompareDrug(server);
  registerAskPolicyQuestion(server);

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
```

### Pattern 2: Host Header Validation with ngrok

**What:** MCP SDK includes DNS rebinding protection that validates the `Host` header. When deploying via ngrok, you must explicitly allow the ngrok hostname or disable validation entirely.

**When to use:** Always when using ngrok, cloud proxies, or any deployment where the public hostname differs from localhost.

**Example:**
```typescript
// Option 1: Disable host validation (simplest for hackathon)
const app = createMcpExpressApp({ host: '0.0.0.0' });

// Option 2: Explicit allowed hosts (more secure)
const app = createMcpExpressApp({
  allowedHosts: [
    'localhost:*',
    '127.0.0.1:*',
    '*.ngrok-free.app:*'
  ]
});

// Option 3: Environment variable pattern (recommended)
const allowedHosts = process.env.PUBLIC_BASE_URL
  ? [new URL(process.env.PUBLIC_BASE_URL).host]
  : undefined;
const app = createMcpExpressApp({ allowedHosts });
```

### Pattern 3: CORS Configuration for Remote MCP Clients

**What:** Prompt Opinion and other browser-based MCP clients require CORS headers to make cross-origin requests. Must allow credentials, POST/OPTIONS methods, and expose `Mcp-Session-Id` header.

**When to use:** Required for all remote StreamableHTTP deployments accessed by web clients.

**Example (from existing code):**
```typescript
// Source: /Users/hero4440/Documents/Code/inovationhacks_2/src/mcp/index.ts
app.use(
  cors({
    origin: true,           // Allow all origins (hackathon mode)
    credentials: true,      // Allow cookies/auth headers
    methods: ['GET', 'POST', 'OPTIONS'],
    exposedHeaders: ['Mcp-Session-Id']  // MCP-specific header
  })
);
```

### Pattern 4: Health Endpoint with Server Metadata

**What:** Separate `/health` endpoint that returns server status without requiring MCP protocol negotiation. Returns policy/payer/drug counts and timestamp.

**When to use:** Always. Used by Prompt Opinion for connection validation and by smoke tests for remote verification.

**Example (from existing code):**
```typescript
// Source: /Users/hero4440/Documents/Code/inovationhacks_2/src/mcp/index.ts
app.get('/health', (req, res) => {
  const policies = getAllPolicies();
  res.json({
    status: 'ok',
    tools: 7,
    policies: policies.length,
    payers: [...new Set(policies.map(p => p.payer))],
    drugs: [...new Set(policies.map(p => p.drug.genericName))],
    timestamp: new Date().toISOString()
  });
});
```

### Pattern 5: Programmatic ngrok Tunnel with Authtoken

**What:** Use `@ngrok/ngrok` to start tunnel programmatically, pass authtoken via environment variable, capture public URL, and configure server with it.

**When to use:** When you want automated deployment scripts or need to capture the ngrok URL for configuration.

**Example:**
```typescript
// Source: https://ngrok.com/docs/getting-started/javascript
import ngrok from '@ngrok/ngrok';

// Start tunnel with authtoken from env
const listener = await ngrok.forward({
  addr: 3000,
  authtoken_from_env: true  // Reads NGROK_AUTHTOKEN env var
});

const publicUrl = listener.url();
console.log(`Tunnel: ${publicUrl}`);
console.log(`MCP endpoint: ${publicUrl}/mcp`);
console.log(`Health check: ${publicUrl}/health`);

// Set PUBLIC_BASE_URL for host validation
process.env.PUBLIC_BASE_URL = publicUrl;
```

### Pattern 6: Smoke Test for Remote Validation

**What:** TypeScript script that validates `/health` endpoint and performs `tools/list` JSON-RPC call. Accepts `BASE_URL` environment variable to test remote deployments.

**When to use:** After every deployment, before connecting Prompt Opinion. Already exists in codebase.

**Example (from existing code):**
```typescript
// Source: /Users/hero4440/Documents/Code/inovationhacks_2/tests/mcp/smoke-remote-server.ts
const baseUrl = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// 1. Validate health endpoint
const health = await fetchJson(`${baseUrl}/health`);
if (health.status !== 'ok') fail(`health status was ${health.status}`);

// 2. Validate tools/list JSON-RPC call
const toolsResponse = await fetchJsonRpc(`${baseUrl}/mcp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
});
```

### Anti-Patterns to Avoid

- **In-memory session state:** Don't store sessions in memory when using stateless StreamableHTTP. Each request must be self-contained. Current implementation correctly creates per-request server instances.

- **stdout pollution:** Don't log to stdout in the MCP server process. MCP stdio transport uses stdout for JSON-RPC messages. Use stderr (`console.error`) for all logging. Current code correctly uses `console.error`.

- **Ignoring Host header validation:** Don't ignore "Invalid Host header" errors. They indicate DNS rebinding protection is active. Either configure `allowedHosts` or disable validation explicitly.

- **Using SSE transport:** SSE was deprecated in June 2025. Use StreamableHTTP for all new deployments. Current code correctly uses StreamableHTTP.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP tunneling | Custom reverse proxy, port forwarding rules, manual SSH tunnels | ngrok with official SDK | Handles HTTPS certs, DNS, firewalls, NAT traversal automatically; free tier sufficient for hackathon |
| MCP session management | Custom session stores, Redis-backed sessions, sticky load balancing | Stateless per-request instances | StreamableHTTP designed for stateless mode; no external state store needed |
| CORS configuration | Custom header logic, conditional origin checks | `cors` npm package with `origin: true` | Handles preflight OPTIONS, credential modes, header exposure correctly |
| Host validation bypass | Reverse proxies, header rewriting, DNS tricks | MCP SDK `allowedHosts` or `host: '0.0.0.0'` | SDK provides safe override mechanisms; hacks break future updates |
| Remote server testing | Manual curl calls, Postman collections | Existing smoke test with `BASE_URL` env var | Already written and proven; validates both health and MCP protocol |

**Key insight:** The existing codebase already implements MCP deployment best practices. Don't rebuild what's working—validate it, add ngrok automation, and document Prompt Opinion connection workflow.

## Common Pitfalls

### Pitfall 1: ngrok URL Changes After Restart (Free Tier)

**What goes wrong:** Free ngrok URLs are random and change every tunnel restart. Prompt Opinion connection breaks when URL changes.

**Why it happens:** Free tier doesn't include persistent domains. Random URLs rotate on restart.

**How to avoid:**
- Use ngrok authenticated account with free dev domain (`.ngrok-free.dev`) for persistent URLs across restarts
- For hackathon: Accept URL rotation, update Prompt Opinion connection when needed
- For production: Upgrade to paid ngrok plan or use cloud deployment

**Warning signs:**
- Prompt Opinion shows "connection failed" after restarting local server
- ngrok URL in terminal doesn't match URL in Prompt Opinion config

### Pitfall 2: "Invalid Host Header" Error on Remote Access

**What goes wrong:** MCP server returns HTTP 421 Misdirected Request when accessed via ngrok URL. Health endpoint works locally but fails remotely.

**Why it happens:** MCP SDK's `createMcpExpressApp()` includes DNS rebinding protection that validates the `Host` header. By default, only `localhost` is allowed. Ngrok URLs (e.g., `abc123.ngrok-free.app`) are rejected.

**How to avoid:**
- Pass `PUBLIC_BASE_URL` environment variable with ngrok base URL when starting server
- Extract hostname from `PUBLIC_BASE_URL` and add to `allowedHosts` array
- OR: Use `host: '0.0.0.0'` to disable host validation (current approach in codebase)

**Warning signs:**
- curl to `https://.../health` works locally, fails remotely with 421
- Browser shows "Invalid Host header" in response body
- Smoke test passes locally, fails with `BASE_URL` set to ngrok URL

**Example fix:**
```bash
# Set PUBLIC_BASE_URL before starting server
PUBLIC_BASE_URL=https://abc123.ngrok-free.app npm start
```

### Pitfall 3: CORS Preflight Failures

**What goes wrong:** Prompt Opinion shows CORS errors in browser console. `tools/list` call never reaches server. Network tab shows OPTIONS request failed or missing headers.

**Why it happens:** Browser sends preflight OPTIONS request before POST to `/mcp`. If server doesn't respond correctly to OPTIONS or doesn't include required CORS headers, browser blocks the actual request.

**How to avoid:**
- Ensure `cors` middleware is registered BEFORE MCP routes
- Include `OPTIONS` in allowed methods
- Set `credentials: true` if using authentication
- Expose `Mcp-Session-Id` header for MCP protocol

**Warning signs:**
- Browser console: "CORS policy: No 'Access-Control-Allow-Origin' header"
- Network tab shows OPTIONS request with 404 or missing headers
- curl works but browser requests fail

**Current code already handles this correctly (verified in `src/mcp/index.ts`).**

### Pitfall 4: Forgetting to Update Smoke Test Expected Tools

**What goes wrong:** Smoke test passes locally but reports missing tools after new tools are registered. Test expects 3 tools but server now has 7.

**Why it happens:** `smoke-remote-server.ts` has hardcoded `expectedTools` array that must be manually updated when new tools are added.

**How to avoid:**
- Update `expectedTools` array in smoke test when registering new tools
- Consider making test check tool count dynamically instead of hardcoded list
- Run smoke test locally after every tool addition

**Warning signs:**
- Smoke test fails with "missing tool X" even though tool exists
- `/health` shows correct tool count (7) but test expects old count (3)

**Fix required:**
```typescript
// Current: expects 3 tools
const expectedTools = ['get_drug_coverage', 'get_prior_auth_criteria', 'check_patient_readiness'];

// Should be updated to expect 7 tools:
const expectedTools = [
  'get_drug_coverage',
  'get_prior_auth_criteria',
  'check_patient_readiness',
  'list_policies',
  'get_policy_summary',
  'compare_drug_across_payers',
  'ask_policy_question'
];
```

### Pitfall 5: ngrok Free Tier Interstitial Warning Page

**What goes wrong:** First request to ngrok URL shows ngrok warning page instead of server response. Prompt Opinion connection test fails on first attempt, succeeds on retry.

**Why it happens:** ngrok free tier adds interstitial warning page for first browser visit to new tunnel URL. User must click "Visit Site" to continue.

**How to avoid:**
- Visit ngrok URL in browser manually first and click through warning
- Use authenticated ngrok account (still free) to reduce interstitial frequency
- Document this as expected behavior for hackathon demo

**Warning signs:**
- First curl to ngrok URL returns HTML instead of JSON
- Prompt Opinion connection test fails first time, works on retry
- Browser shows "You are about to visit..." warning page

### Pitfall 6: Missing ANTHROPIC_API_KEY for ask_policy_question

**What goes wrong:** First 3 tools work but `ask_policy_question` returns tool error about missing Anthropic credentials. Demo fails when asking natural language questions.

**Why it happens:** Phase 3 configured `ask_policy_question` to fail closed when `ANTHROPIC_API_KEY` environment variable is missing. Tool works deterministically but LLM fallback requires valid API key.

**How to avoid:**
- Set `ANTHROPIC_API_KEY` environment variable before starting server
- Test Q&A tool specifically during smoke test validation
- Document API key requirement in deployment runbook

**Warning signs:**
- `list_policies`, `get_policy_summary`, `compare_drug_across_payers` work
- `ask_policy_question` returns "Missing Anthropic API credentials" error
- Tool returns route metadata but fails to execute LLM queries

## Code Examples

Verified patterns from existing codebase and official sources:

### Starting MCP Server with ngrok Support

```typescript
// Start local server (existing pattern)
npm start

// Verify locally before ngrok
npm run smoke:mcp

// Start ngrok tunnel
ngrok http 3000
# Captures URL: https://abc123.ngrok-free.app

// Restart server with ngrok hostname allowed
PUBLIC_BASE_URL=https://abc123.ngrok-free.app npm start

// Verify remote access
BASE_URL=https://abc123.ngrok-free.app npm run smoke:mcp
```

### Programmatic ngrok Tunnel (for automation)

```typescript
// scripts/deploy-ngrok.ts
import ngrok from '@ngrok/ngrok';
import { spawn } from 'child_process';

async function deploy() {
  // Start ngrok tunnel
  const listener = await ngrok.forward({
    addr: 3000,
    authtoken_from_env: true  // Reads NGROK_AUTHTOKEN
  });

  const publicUrl = listener.url();
  console.error(`Tunnel established: ${publicUrl}`);
  console.error(`MCP endpoint: ${publicUrl}/mcp`);
  console.error(`Health check: ${publicUrl}/health`);

  // Start server with PUBLIC_BASE_URL set
  const server = spawn('npm', ['start'], {
    env: { ...process.env, PUBLIC_BASE_URL: publicUrl },
    stdio: 'inherit'
  });

  // Cleanup on exit
  process.on('SIGINT', () => {
    server.kill();
    process.exit(0);
  });
}

deploy();
```

### Validating Prompt Opinion Connection

```bash
# 1. Health check (should return status: ok)
curl https://abc123.ngrok-free.app/health

# 2. Tools list (should return 7 tools)
curl -X POST https://abc123.ngrok-free.app/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# 3. Run smoke test
BASE_URL=https://abc123.ngrok-free.app npm run smoke:mcp
```

### Environment Variable Configuration

```bash
# .env (add to .gitignore)
NGROK_AUTHTOKEN=your_ngrok_authtoken_here
ANTHROPIC_API_KEY=your_anthropic_key_here
PUBLIC_BASE_URL=https://abc123.ngrok-free.app  # Set after starting ngrok

# Start server with env vars loaded
export $(cat .env | xargs) && npm start
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SSE transport | StreamableHTTP transport | June 2025 | SSE deprecated; StreamableHTTP is standard for remote servers |
| Session-based transport | Stateless per-request | Q1 2026 roadmap | Enables horizontal scaling without sticky sessions |
| Manual CORS headers | `cors` middleware with MCP-specific config | Current best practice | Cleaner code, fewer bugs, handles OPTIONS preflight correctly |
| Binary ngrok wrapper | `@ngrok/ngrok` official SDK | 2024+ | No binaries to download, programmatic control, production-ready |
| `.well-known/mcp.json` | Emerging discovery standard (SEP-1649, SEP-1960) | Q1 2026 active development | Enables clients to discover server capabilities before connecting |

**Deprecated/outdated:**
- **SSE transport:** Deprecated June 2025. Use StreamableHTTP for all new deployments.
- **In-memory session stores with StreamableHTTP:** 2026 roadmap explicitly removed session state requirements for stateless deployments.
- **Manual host header validation:** MCP SDK now includes built-in DNS rebinding protection via `createMcpExpressApp()`.

## Open Questions

1. **Does Prompt Opinion require .well-known/mcp.json discovery endpoint?**
   - What we know: SEP-1649 and SEP-1960 define `.well-known/mcp.json` and `.well-known/mcp/server-card.json` standards for capability discovery
   - What's unclear: Whether Prompt Opinion requires these endpoints or if manual URL configuration is sufficient for hackathon
   - Recommendation: Test without discovery endpoints first (manual URL config). Add if Prompt Opinion requires it. Existing `docs/prompt-opinion/workspace-integration.md` shows manual URL config was sufficient previously.

2. **What is the exact SHARP context payload shape from Prompt Opinion?**
   - What we know: Code supports 4 different shapes (flat, alias-based, nested SHARP, nested patient object)
   - What's unclear: Which shape Prompt Opinion actually sends as of April 2026
   - Recommendation: Log incoming payload during first Prompt Opinion test and validate against existing parsers in `src/mcp/fhir/client.ts`

3. **Should smoke test be extended to validate all 7 tools, not just tools/list?**
   - What we know: Current smoke test only validates health endpoint and tools/list discovery
   - What's unclear: Whether demo validation requires proof that each tool executes successfully
   - Recommendation: Extend smoke test to call one tool per category (deterministic tool, comparison tool, Q&A tool) for complete validation. Priority: medium (nice-to-have for confidence, not blocking).

4. **Does ngrok free tier 1 GB/month bandwidth limit affect hackathon demos?**
   - What we know: Free tier includes 1 GB/month bandwidth limit
   - What's unclear: Whether typical hackathon demo usage (health checks, tool discovery, ~10-20 tool calls) exceeds limit
   - Recommendation: Monitor ngrok dashboard during testing. Estimate ~1-5 KB per request × ~100 requests = ~500 KB total well under limit. Not a concern for hackathon timeframe.

## Sources

### Primary (HIGH confidence)

- [ngrok JavaScript SDK Documentation](https://ngrok.com/docs/getting-started/javascript) - Official quickstart and API reference
- [ngrok npm package (@ngrok/ngrok)](https://www.npmjs.com/package/@ngrok/ngrok) - Official SDK installation and usage
- [MCP TypeScript SDK Server Documentation](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md) - StreamableHTTP patterns and Express integration
- [MCP Transports Specification](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports) - Official transport types and requirements
- Existing codebase documentation:
  - `/Users/hero4440/Documents/Code/inovationhacks_2/src/mcp/index.ts` - Current MCP server implementation
  - `/Users/hero4440/Documents/Code/inovationhacks_2/docs/prompt-opinion/deployment-runbook.md` - Proven deployment workflow
  - `/Users/hero4440/Documents/Code/inovationhacks_2/tests/mcp/smoke-remote-server.ts` - Remote validation patterns

### Secondary (MEDIUM confidence)

- [CORS Policies for Web-Based MCP Servers](https://mcpcat.io/guides/implementing-cors-policies-web-based-mcp-servers/) - CORS configuration patterns
- [MCP StreamableHTTP Production Guide](https://mcpcat.io/guides/building-streamablehttp-mcp-server/) - Deployment best practices
- [ngrok Free Plan Limits](https://ngrok.com/docs/pricing-limits/free-plan-limits) - Free tier bandwidth and domain constraints
- [Static dev domains for all ngrok users](https://ngrok.com/blog/free-static-domains-ngrok-users) - Persistent `.ngrok-free.dev` domains
- [Model Context Protocol Inspector](https://github.com/modelcontextprotocol/inspector) - Visual testing tool for MCP servers
- [How to Test MCP Servers](https://www.stainless.com/mcp/how-to-test-mcp-servers) - Testing strategies and tools

### Tertiary (LOW confidence - ecosystem patterns, not verified)

- [MCP Server Discovery SEP-1649](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1649) - `.well-known/mcp.json` proposal (active development, not finalized)
- [2026 MCP Roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) - Future direction (not current implementation)
- [StreamableHTTP Horizontal Scaling Discussion](https://github.com/modelcontextprotocol/python-sdk/issues/880) - Session persistence patterns (Python-specific, may not apply to TypeScript SDK)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use or official SDKs with stable APIs
- Architecture: HIGH - Existing codebase implements current best practices; deployment runbook proven in prior testing
- Pitfalls: HIGH - Documented from MCP deployment issues GitHub issues, ngrok limitations docs, and existing troubleshooting runbook
- Prompt Opinion integration: MEDIUM - Docs exist showing successful prior integration, but specific UI flow may have changed since docs were written

**Research date:** 2026-04-18
**Valid until:** 2026-05-18 (30 days - stable domain with mature tooling)

**Key insight:** This phase is execution-focused, not design-focused. The infrastructure is built, tested, and documented. Success depends on following the existing deployment runbook, validating each step with smoke tests, and documenting Prompt Opinion UI interactions as they occur.
