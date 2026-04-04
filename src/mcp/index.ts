import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import { registerGetDrugCoverage } from './tools/get_drug_coverage.js';
import { registerGetPriorAuthCriteria } from './tools/get_prior_auth_criteria.js';
import { registerCheckPatientReadiness } from './tools/check_patient_readiness.js';
import { getAllPolicies } from './policy_store/loader.js';

// Create Express app with MCP defaults
const app = createMcpExpressApp();

// Health check endpoint
app.get('/health', (req, res) => {
  const policies = getAllPolicies();
  res.json({
    status: 'ok',
    tools: 3,
    policies: policies.length,
    payers: [...new Set(policies.map(p => p.payer))],
    drugs: [...new Set(policies.map(p => p.drug.genericName))]
  });
});

// MCP endpoint - create server and transport per request (stateless)
app.post('/mcp', async (req, res) => {
  // Create server instance
  const server = new McpServer(
    {
      name: 'policypilot',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // Register tools
  registerGetDrugCoverage(server);
  registerGetPriorAuthCriteria(server);
  registerCheckPatientReadiness(server);

  // Create stateless transport
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined // Stateless mode
  });

  // Connect server to transport
  await server.connect(transport);

  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const policies = getAllPolicies();
  console.error(`PolicyPilot MCP server listening on port ${PORT}`);
  console.error(`Loaded ${policies.length} policies`);
  console.error(`Health check: http://localhost:${PORT}/health`);
  console.error(`MCP endpoint: http://localhost:${PORT}/mcp`);
});

export { app };
