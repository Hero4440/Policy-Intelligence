# Phase 5: Deployment & Integration - Research

**Researched:** 2026-04-04
**Domain:** MCP server deployment, Prompt Opinion integration, SHARP FHIR context, production readiness
**Confidence:** MEDIUM-HIGH

## Summary

Phase 5 delivers the complete end-to-end system: MCP server deployed at a public URL, registered in Prompt Opinion workspace, configured with SHARP FHIR context, and published to the Prompt Opinion Marketplace. The phase spans deployment infrastructure (ngrok for dev/demo, cloud hosting for production), platform integration (MCP connection registration, FHIR context enabling, agent configuration), and validation (end-to-end testing of the complete user workflow).

The MCP ecosystem in 2026 has standardized on Streamable HTTP transport for remote servers, with ngrok as the dominant development tunneling solution and Cloudflare Workers/Fly.io/Railway as leading cloud hosting platforms. Prompt Opinion uses SHARP extension specs to propagate FHIR patient context across MCP tool calls, eliminating custom token-handling infrastructure. The platform provides workspace hub for MCP connection management, agent configuration UI, and marketplace publishing for solution discovery.

Critical success factors: (1) production-ready deployment with health checks and proper CORS, (2) understanding Prompt Opinion's SHARP context model to receive FHIR data, (3) proper agent configuration to attach all three tools, (4) marketplace publishing with clear documentation, and (5) end-to-end test validating patient selection → coverage question → grounded answer flow.

**Primary recommendation:** Use ngrok for hackathon demo (fastest path to public URL with HTTPS), configure MCP server with CORS and health endpoint, register in Prompt Opinion workspace with SHARP FHIR context enabled, create PolicyPilot agent with all three tools attached, publish to Marketplace, and validate with demo patient scenarios.

## Standard Stack

### Core (Deployment)
| Library/Service | Version | Purpose | Why Standard |
|-----------------|---------|---------|--------------|
| ngrok | Free tier | Development tunneling | Industry standard for MCP dev, HTTPS by default, authentication support, works with Express/Node.js |
| Express health endpoint | N/A | Load balancer compatibility | Standard pattern for container/cloud deployments, required by most cloud platforms |
| CORS middleware | via Express | Browser client support | MCP servers need explicit CORS for browser-based clients |

### Supporting (Production Alternative)
| Service | Pricing | Purpose | When to Use |
|---------|---------|---------|-------------|
| Cloudflare Workers | Free (100K req/day) | Serverless hosting | Production deployment, global edge distribution, zero cold start |
| Fly.io | ~$15-40/month | Container hosting | Need persistent server behavior, database proximity |
| Railway | ~$15-40/month | Managed container platform | Want minimal ops overhead, small team |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ngrok | LocalTunnel/InstaTunnel | Free alternatives but less stable, ngrok has better MCP ecosystem integration |
| Cloudflare Workers | Vercel/Render | Vercel has Deployment Protection that blocks non-browser requests by default |
| Express CORS | Manual headers | Express cors middleware is standard and well-tested |

**Installation (production features):**
```bash
# Add CORS support
npm install cors

# ngrok (global install)
npm install -g ngrok

# Or use programmatic ngrok
npm install ngrok
```

## Architecture Patterns

### Pattern 1: Development Deployment with ngrok
**What:** Tunnel localhost MCP server through ngrok for public HTTPS access
**When to use:** Hackathon demo, development, testing with Prompt Opinion before cloud deployment
**Example:**
```bash
# Terminal 1: Start MCP server
npm run dev  # or npm start

# Terminal 2: Start ngrok tunnel
ngrok http 3000

# Output: https://abc123.ngrok-free.app → http://localhost:3000
```

**Critical:** ngrok free tier provides random URLs that change on restart. For stable demos, use ngrok authtoken (free account) to get consistent domains during session.

### Pattern 2: Production-Ready Express Server with CORS and Health Check
**What:** Express server with CORS, health endpoint, proper error handling
**When to use:** Always - required for cloud deployment and browser clients
**Example:**
```typescript
// Source: Official MCP SDK Express examples + production best practices
import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';

// Create Express app with MCP defaults
const app = createMcpExpressApp();

// CORS configuration for browser clients
app.use(cors({
  origin: true, // Allow all origins for demo (restrict in production)
  credentials: true,
  exposedHeaders: ['Mcp-Session-Id'] // Required for MCP protocol
}));

// Health check endpoint (required for cloud deployments)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    tools: ['get_drug_coverage', 'get_prior_auth_criteria', 'check_patient_readiness']
  });
});

// MCP endpoint - stateless transport
app.post('/mcp', async (req, res) => {
  const server = new McpServer({
    name: 'policypilot',
    version: '1.0.0'
  }, {
    capabilities: { tools: {} }
  });

  // Register tools
  registerAllTools(server);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined // Stateless mode
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.error(`MCP server listening on port ${PORT}`);
  console.error(`Health check: http://localhost:${PORT}/health`);
  console.error(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
```

### Pattern 3: Prompt Opinion MCP Connection Registration
**What:** Register deployed MCP server in Prompt Opinion workspace hub
**When to use:** After server is deployed and accessible via public URL
**Configuration:**
```yaml
# Prompt Opinion MCP Connection Configuration (conceptual)
Connection Name: PolicyPilot MCP Server
MCP Endpoint URL: https://abc123.ngrok-free.app/mcp  # or cloud URL
Transport Type: Streamable HTTP
Authentication: None (or Basic Auth if configured)
SHARP FHIR Context: Enabled  # CRITICAL - enables patient context propagation
Health Check URL: https://abc123.ngrok-free.app/health
```

**Steps (based on Agents Assemble hackathon documentation):**
1. Navigate to Prompt Opinion workspace hub
2. Add new MCP connection
3. Enter MCP endpoint URL (must be HTTPS)
4. Enable SHARP FHIR context option
5. Test connection (health check)
6. Save configuration

### Pattern 4: SHARP FHIR Context Propagation
**What:** Prompt Opinion bridges EHR session credentials into SHARP context, MCP tools receive FHIR tokens and patient IDs
**When to use:** Always - required for patient-specific operations (check_patient_readiness)
**Expected Context Structure:**
```typescript
// SHARP context passed to MCP tools (expected structure based on SHARP specs)
interface SharpContext {
  patient_id: string;          // FHIR Patient resource ID
  fhir_server_url: string;     // FHIR server endpoint
  access_token?: string;       // OAuth2 token for FHIR API (if available)
  encounter_id?: string;       // Current encounter context (optional)
}

// MCP tool receives context via input parameters or protocol-level context
async function check_patient_readiness({
  drug,
  payer,
  sharp_context  // Injected by Prompt Opinion
}: {
  drug: string;
  payer: string;
  sharp_context: SharpContext
}) {
  // Use context to fetch patient data from FHIR server
  const patientData = await fetchFhirPatient(
    sharp_context.fhir_server_url,
    sharp_context.patient_id,
    sharp_context.access_token
  );

  // Match against PA criteria
  const gaps = analyzeCriteriaGaps(patientData, drug, payer);
  return gaps;
}
```

**Note:** Exact SHARP context structure requires Prompt Opinion documentation verification. The above is inferred from hackathon description stating "platform bridges EHR session credentials directly into SHARP context."

### Pattern 5: Prompt Opinion Agent Configuration
**What:** Create PolicyPilot agent in Prompt Opinion with MCP tools attached
**When to use:** After MCP connection is registered and tested
**Configuration:**
```yaml
# Agent Configuration (conceptual)
Agent Name: PolicyPilot
Description: Prior authorization readiness assistant
MCP Connections:
  - PolicyPilot MCP Server (SHARP context enabled)
Available Tools:
  - get_drug_coverage
  - get_prior_auth_criteria
  - check_patient_readiness
System Prompt: |
  You are a prior authorization specialist assistant. When a user asks about
  drug coverage or PA requirements, use the available MCP tools to:
  1. Check drug coverage status
  2. Retrieve PA criteria details
  3. Analyze patient readiness against criteria

  Always cite policy evidence in your responses. Use cautious clinical language
  (e.g., "may be missing", "appears to match").
```

### Pattern 6: End-to-End Test Workflow
**What:** Validate complete user journey from patient selection to grounded answer
**When to use:** Before marketplace publishing and demo
**Test Script:**
```markdown
# End-to-End Test Plan

## Setup
- Patient 01 (Full Match): All criteria met for Humira/adalimumab
- Patient 02 (Partial Match): Missing step therapy requirement
- Patient 03 (Poor Match): Missing diagnosis code and prior therapy

## Test Cases

### Test 1: Coverage Check
User: "Is Humira covered for rheumatoid arthritis under UHC?"
Expected: Tool call to get_drug_coverage, response cites UHC policy, states "covered with PA"

### Test 2: PA Criteria Inspection
User: "What are the PA requirements for Humira?"
Expected: Tool call to get_prior_auth_criteria, response lists diagnosis, step therapy, quantity limits with policy citations

### Test 3: Patient Readiness (Full Match)
User: "Is Patient 01 ready for Humira PA submission?"
Expected: Tool call to check_patient_readiness, response shows all criteria met, recommends submission

### Test 4: Patient Readiness (Gaps)
User: "Is Patient 02 ready for Humira PA submission?"
Expected: Tool call to check_patient_readiness, response identifies missing methotrexate trial, lists gap with cautious language

### Success Criteria
- All tool calls execute without errors
- Responses include policy evidence text
- SHARP context successfully provides patient data
- Agent provides grounded answers with citations
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTPS tunneling | Custom reverse proxy, self-signed certs | ngrok | HTTPS by default, no cert management, MCP ecosystem standard |
| FHIR context propagation | Custom token parsing, session management | Prompt Opinion SHARP context | Platform-provided, handles OAuth, credential bridging, multi-agent chains |
| MCP connection management | Custom integration code | Prompt Opinion workspace hub | Platform UI for registration, health checks, context configuration |
| Load balancer health checks | Custom healthcheck library | Express route + JSON response | Standard pattern, works with all cloud platforms |
| Authentication middleware | Custom auth implementation | ngrok built-in auth or OAuth middleware | ngrok supports --basic-auth, platform auth integrations available |

**Key insight:** Prompt Opinion provides the integration infrastructure (workspace hub, SHARP context, agent configuration, marketplace). Your deployment responsibility is making the MCP server accessible via HTTPS and properly configured (CORS, health checks, stateless transport).

## Common Pitfalls

### Pitfall 1: Missing CORS Headers
**What goes wrong:** Browser-based MCP clients (including Prompt Opinion UI) can't connect to server, receive CORS errors
**Why it happens:** MCP servers need CORS for browser clients, but developers forget to configure
**How to avoid:** Always include CORS middleware with `exposedHeaders: ['Mcp-Session-Id']` for MCP protocol compatibility
**Warning signs:** Connection works from Postman but fails in browser, console shows CORS errors
**Phase 5 application:** Prompt Opinion is browser-based, CORS is mandatory

### Pitfall 2: POST-Only Endpoint Breaks Health Checks
**What goes wrong:** Cloud platform health checks fail because they send GET requests to MCP endpoint
**Why it happens:** MCP endpoint only accepts POST, but default health probes use GET
**How to avoid:** Add dedicated GET /health endpoint that returns 200 OK, configure platform to use it
**Warning signs:** "Endpoint not responding" errors in cloud platform, deployment fails health checks
**Phase 5 application:** Health endpoint already implemented in codebase at /health

### Pitfall 3: Vercel Deployment Protection Blocking Requests
**What goes wrong:** Deployment succeeds but MCP calls return 403 Forbidden
**Why it happens:** Vercel Deployment Protection blocks non-browser requests by default
**How to avoid:** Use Cloudflare Workers or Fly.io instead, or disable Deployment Protection for MCP route
**Warning signs:** Works locally and via ngrok, fails on Vercel with 403
**Phase 5 application:** If choosing cloud hosting, prefer Cloudflare Workers (no deployment protection)

### Pitfall 4: Stateful Sessions Breaking on Horizontal Scale
**What goes wrong:** Server works with single instance but fails when scaled to multiple instances
**Why it happens:** Using `sessionIdGenerator: () => randomUUID()` stores state in memory per instance
**How to avoid:** Use `sessionIdGenerator: undefined` for stateless mode (already implemented in codebase)
**Warning signs:** Intermittent connection errors, works sometimes but not always, session errors
**Phase 5 application:** Codebase already uses stateless mode, safe for cloud deployment

### Pitfall 5: Ignoring SHARP Context Configuration
**What goes wrong:** MCP tools can't access patient data, check_patient_readiness fails
**Why it happens:** Forgetting to enable SHARP FHIR context when registering MCP connection
**How to avoid:** Explicitly enable SHARP context in Prompt Opinion connection settings, verify in agent config
**Warning signs:** Tools work in isolation but fail when agent tries to access patient data
**Phase 5 application:** Must enable SHARP context for requirement DEP-03

### Pitfall 6: Invalid JSON-RPC Output Breaking Protocol
**What goes wrong:** MCP client drops connection with error -32000 (97% of connection failures)
**Why it happens:** Server code or dependencies write to stdout, corrupting JSON-RPC stream
**Why it doesn't apply here:** Streamable HTTP transport doesn't use stdout (only affects STDIO transport)
**Phase 5 application:** Not a concern for HTTP-based deployment

### Pitfall 7: ngrok URL Changes Breaking Configuration
**What goes wrong:** ngrok tunnel restarts, URL changes, Prompt Opinion connection breaks
**Why it happens:** Free tier generates random URLs on each restart
**How to avoid:** Use ngrok authtoken (free account) for stable session URLs, or deploy to cloud for permanent URL
**Warning signs:** Connection works initially but breaks after ngrok restart
**Phase 5 application:** For hackathon demo, get ngrok authtoken or deploy to Cloudflare Workers before judging

## Code Examples

### Production-Ready Health Check
```typescript
// Source: MCP production deployment patterns
app.get('/health', (req, res) => {
  const policies = getAllPolicies(); // Your policy loader
  res.json({
    status: 'ok',
    tools: 3,
    policies: policies.length,
    payers: [...new Set(policies.map(p => p.payer))],
    drugs: [...new Set(policies.map(p => p.drug.genericName))],
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
```

### CORS Configuration for MCP
```typescript
// Source: MCP browser client best practices
import cors from 'cors';

app.use(cors({
  origin: true, // Allow all for demo; restrict to Prompt Opinion domain in production
  credentials: true,
  exposedHeaders: ['Mcp-Session-Id'], // Required for MCP protocol
  methods: ['GET', 'POST', 'OPTIONS']
}));
```

### Environment-Based PORT Configuration
```typescript
// Source: Node.js production deployment standards
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.error(`PolicyPilot MCP server listening on port ${PORT}`);
  console.error(`Health check: http://localhost:${PORT}/health`);
  console.error(`MCP endpoint: http://localhost:${PORT}/mcp`);
});

// Note: Use console.error for logging (console.log reserved for structured output in some environments)
```

### ngrok with Authentication (Optional)
```bash
# Add basic auth to ngrok tunnel
ngrok http 3000 --basic-auth="demo:password123"

# Or use ngrok config file for persistent settings
# ~/.ngrok2/ngrok.yml
authtoken: YOUR_AUTH_TOKEN
tunnels:
  policypilot:
    proto: http
    addr: 3000
    basic_auth:
      - "demo:password123"
```

### Cloudflare Workers Deployment (Alternative to ngrok)
```typescript
// Source: Cloudflare Workers MCP deployment guide
// wrangler.toml
name = "policypilot-mcp"
main = "src/index.ts"
compatibility_date = "2026-04-04"

[env.production]
vars = { NODE_ENV = "production" }

// Deploy command:
// npx wrangler deploy
```

### Demo Patient Selection Test
```typescript
// End-to-end test validation
async function testPatientReadiness() {
  const patients = [
    { id: 'patient-01-full-match', expectedGaps: 0 },
    { id: 'patient-02-partial-match', expectedGaps: 1 },
    { id: 'patient-03-poor-match', expectedGaps: 2 }
  ];

  for (const patient of patients) {
    const response = await mcpClient.callTool('check_patient_readiness', {
      patient_id: patient.id,
      drug: 'adalimumab',
      payer: 'UHC'
    });

    const result = JSON.parse(response.content[0].text);
    console.log(`Patient ${patient.id}: ${result.gaps.length} gaps (expected ${patient.expectedGaps})`);

    // Validate evidence citations exist
    assert(result.gaps.every(gap => gap.evidence), 'All gaps must include evidence');
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SSE + HTTP separate endpoints | Streamable HTTP unified | March 2025 | Single MCP endpoint, simpler deployment, better cloud compatibility |
| Custom FHIR token handling | SHARP context propagation | Q1 2026 | Platform-managed credentials, multi-agent context chains, no custom auth |
| Static API keys for auth | OAuth 2.1 with session-scoped auth | Late 2025 | Time-limited access, explicit approval per session, audit trails |
| Manual MCP server registration | Workspace hub UI | Q1 2026 | Visual configuration, health check validation, no manual JSON editing |
| ngrok alternatives (localtunnel) | ngrok dominance | 2024-2025 | More stable, better MCP ecosystem support, traffic policy features |

**Deprecated/outdated:**
- **SSE transport for new servers:** Streamable HTTP is current standard (SSE deprecated in MCP v1.25+)
- **Custom context propagation:** SHARP specs provide standardized FHIR context (Prompt Opinion feature, Q1 2026)
- **Static secret-based auth:** OAuth 2.1 and session-scoped authorization replacing API keys
- **Manual health check libraries:** Simple Express route is sufficient and cloud-portable

## Deployment Checklist

### Pre-Deployment Validation
- [ ] MCP server starts without errors (`npm start`)
- [ ] Health check responds at /health with status ok
- [ ] All 3 tools registered (get_drug_coverage, get_prior_auth_criteria, check_patient_readiness)
- [ ] Policy data loads (5 policies from Phase 1)
- [ ] Demo patients available (3 FHIR bundles from Phase 4)
- [ ] CORS middleware configured
- [ ] Stateless transport mode enabled

### ngrok Deployment (Demo Path)
- [ ] ngrok installed globally or via npm
- [ ] Server running on localhost:3000
- [ ] ngrok tunnel created (`ngrok http 3000`)
- [ ] HTTPS URL captured (e.g., https://abc123.ngrok-free.app)
- [ ] Health check accessible via public URL
- [ ] ngrok authtoken configured (optional, for stable URLs)

### Prompt Opinion Integration
- [ ] Navigate to Prompt Opinion workspace hub
- [ ] Add new MCP connection
- [ ] Enter MCP endpoint URL (ngrok or cloud URL + /mcp)
- [ ] **ENABLE SHARP FHIR context** (requirement DEP-03)
- [ ] Test connection (health check passes)
- [ ] Create PolicyPilot agent
- [ ] Attach MCP connection to agent
- [ ] Verify all 3 tools visible in agent config
- [ ] Configure agent system prompt

### Marketplace Publishing (DEP-05)
- [ ] Agent tested and functional
- [ ] Prepare agent description (use case, tools, capabilities)
- [ ] Add demo instructions (select patient, ask coverage question)
- [ ] Publish to Prompt Opinion Marketplace
- [ ] Verify listing visible to judges
- [ ] Test discovery flow (search for "prior authorization" or "drug coverage")

### End-to-End Validation
- [ ] **Test 1:** Coverage check (get_drug_coverage) returns policy citation
- [ ] **Test 2:** PA criteria (get_prior_auth_criteria) lists requirements with evidence
- [ ] **Test 3:** Patient readiness (patient-01-full-match) shows no gaps
- [ ] **Test 4:** Patient readiness (patient-02-partial-match) identifies missing step therapy
- [ ] **Test 5:** Agent provides grounded answer with policy citations
- [ ] All responses use cautious clinical language ("may be", "appears to")
- [ ] SHARP context successfully provides patient data to check_patient_readiness

## Open Questions

1. **Prompt Opinion SHARP context exact specification**
   - What we know: Platform bridges EHR credentials into SHARP context, propagates FHIR tokens and patient IDs
   - What's unclear: Exact parameter names, whether context is in tool input or protocol-level metadata
   - Recommendation: Check Prompt Opinion documentation or getting started video, implement flexible context parsing

2. **Marketplace publishing requirements**
   - What we know: Solutions published to Marketplace for judge discovery
   - What's unclear: Required metadata fields, approval process, discoverability features
   - Recommendation: Follow Prompt Opinion marketplace publishing UI, include clear demo instructions

3. **Cloud hosting for production (post-hackathon)**
   - What we know: Cloudflare Workers free tier (100K req/day), Fly.io (~$15-40/month), Railway similar pricing
   - What's unclear: Which platform best fits long-term product needs
   - Recommendation: Use ngrok for hackathon, evaluate cloud options post-demo based on traffic patterns

4. **Authentication requirements**
   - What we know: Prompt Opinion supports OAuth 2.1, session-scoped authorization
   - What's unclear: Is auth required for hackathon demo or optional?
   - Recommendation: Start without auth (ngrok with basic auth if needed), add OAuth post-hackathon

## Production Upgrade Path (Post-Hackathon)

**From ngrok to cloud hosting:**
1. Deploy to Cloudflare Workers (free tier, fastest cold start)
2. Update Prompt Opinion MCP connection with new permanent URL
3. Add environment variable for policy data path (if needed)
4. Enable monitoring/logging (Cloudflare Analytics)
5. Add rate limiting if public exposure increases

**Security hardening:**
1. Add OAuth 2.1 authentication
2. Restrict CORS to Prompt Opinion domain
3. Implement rate limiting (10 req/min per user)
4. Add request validation middleware
5. Enable audit logging

**Scalability improvements:**
1. Cache policy data in memory (already done on startup)
2. Add Redis for distributed caching if multi-instance
3. Implement graceful shutdown
4. Add structured logging
5. Set up health check monitoring (uptime alerts)

## Sources

### Primary (HIGH confidence)
- [Prompt Opinion Platform](https://www.promptopinion.ai/) - Official platform for healthcare AI agents
- [Agents Assemble Hackathon](https://agents-assemble.devpost.com/) - SHARP specs, integration requirements, marketplace
- [ngrok MCP Documentation](https://ngrok.com/docs/using-ngrok-with/using-mcp) - Official ngrok MCP gateway guide
- [MCP TypeScript SDK Server Docs](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md) - Official deployment patterns
- [Cloudflare Workers MCP Guide](https://developers.cloudflare.com/agents/guides/remote-mcp-server/) - Cloud deployment reference

### Secondary (MEDIUM confidence)
- [How To Access Local MCP Servers Through a Secure Tunnel](https://thenewstack.io/how-to-access-local-mcp-servers-through-a-secure-tunnel/) - ngrok patterns verified
- [MCP Server Health Checks Guide](https://mcpcat.io/guides/building-health-check-endpoint-mcp-server/) - Health endpoint patterns
- [MCP Troubleshooting Common Errors](https://mcpplaygroundonline.com/blog/mcp-server-troubleshooting-common-errors-fix) - Deployment pitfalls
- [Where to Host MCP Servers for Free (2026)](https://mcpplaygroundonline.com/blog/free-mcp-server-hosting-cloudflare-vercel-guide) - Cloud platform comparison
- [MCP CORS Best Practices](https://mcpcat.io/guides/implementing-cors-policies-web-based-mcp-servers/) - Browser client configuration

### Tertiary (LOW confidence - requires verification)
- [FHIR MCP Server Implementation](https://www.themomentum.ai/blog/introducing-fhir-mcp-server-natural-language-interface-for-healthcare-data) - FHIR context patterns (not SHARP-specific)
- [Healthcare AI Agents Demo](https://github.com/amitpuri/agentic-healthcare-ai) - Reference implementation (not Prompt Opinion)
- [MCP Production Best Practices](https://www.cdata.com/blog/mcp-server-best-practices-2026) - General guidance (not healthcare-specific)

## Metadata

**Confidence breakdown:**
- ngrok deployment: HIGH - Official docs, MCP ecosystem standard, verified patterns
- Express/CORS/health checks: HIGH - Production standards, official middleware, cloud platform requirements
- Prompt Opinion integration: MEDIUM - Platform exists, SHARP specs referenced in hackathon, exact API unclear
- SHARP FHIR context: MEDIUM - Hackathon docs confirm feature, exact structure needs verification
- Marketplace publishing: LOW - High-level description available, detailed requirements need platform access
- Cloud hosting options: HIGH - Official platform docs (Cloudflare, Fly.io), pricing verified

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (30 days - deployment patterns stable, Prompt Opinion platform evolving)

**Critical unknowns requiring verification:**
1. Prompt Opinion exact SHARP context parameter structure
2. Marketplace publishing metadata requirements
3. Agent configuration UI workflow
4. FHIR server URL and authentication details
