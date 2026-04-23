import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import cors from 'cors';
import { registerGetDrugCoverage } from './tools/get_drug_coverage.js';
import { registerGetPriorAuthCriteria } from './tools/get_prior_auth_criteria.js';
import { registerCheckPatientReadiness } from './tools/check_patient_readiness.js';
import { registerListPolicies } from './tools/list_policies.js';
import { registerGetPolicySummary } from './tools/get_policy_summary.js';
import { registerCompareDrug } from './tools/compare_drug_across_payers.js';
import { registerAskPolicyQuestion } from './tools/ask_policy_question.js';
import { registerUploadPolicyDocument } from './tools/upload_policy_document.js';
import { registerParsePolicyDocument } from './tools/parse_policy_document.js';
import { registerListPolicyVersions } from './tools/list_policy_versions.js';
import { registerDiffPolicyVersions } from './tools/diff_policy_versions.js';
import { registerGetPolicyEvidence } from './tools/get_policy_evidence.js';
import { registerSearchPolicyRules } from './tools/search_policy_rules.js';
import { registerExtractPatientFacts } from './tools/extract_patient_facts.js';
import { registerEvaluatePatientAgainstPolicy } from './tools/evaluate_patient_against_policy.js';
import { registerGenerateNextSteps } from './tools/generate_next_steps.js';
import { registerGetCaseSummary } from './tools/get_case_summary.js';
import { getAllPolicies } from './policy_store/loader.js';
import { fileURLToPath } from 'url';

export function createMcpApp() {
  // No allowedHosts — we handle host validation ourselves to support rotating ngrok URLs
  const app = createMcpExpressApp({ host: '0.0.0.0' });

  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      exposedHeaders: ['Mcp-Session-Id']
    })
  );

  // Health check endpoint
  app.get('/health', (req, res) => {
    const policies = getAllPolicies();
    res.json({
      status: 'ok',
      tools: 17,
      policies: policies.length,
      payers: [...new Set(policies.map(p => p.payer))],
      drugs: [...new Set(policies.map(p => p.drug.genericName))],
      timestamp: new Date().toISOString()
    });
  });

  // MCP endpoint - create server and transport per request (stateless)
  app.post('/mcp', async (req, res) => {
    const server = new McpServer(
      {
        name: 'policypilot',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          extensions: {
            'ai.promptopinion/fhir-context': {}
          }
        }
      }
    );

    registerGetDrugCoverage(server);
    registerGetPriorAuthCriteria(server);
    registerCheckPatientReadiness(server);
    registerListPolicies(server);
    registerGetPolicySummary(server);
    registerCompareDrug(server);
    registerAskPolicyQuestion(server);
    registerUploadPolicyDocument(server);
    registerParsePolicyDocument(server);
    registerListPolicyVersions(server);
    registerDiffPolicyVersions(server);
    registerGetPolicyEvidence(server);
    registerSearchPolicyRules(server);
    registerExtractPatientFacts(server);
    registerEvaluatePatientAgainstPolicy(server);
    registerGenerateNextSteps(server);
    registerGetCaseSummary(server);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  return app;
}

export const app = createMcpApp();

const isEntrypoint = process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === process.argv[1];

if (isEntrypoint) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    const policies = getAllPolicies();
    console.error(`PolicyPilot MCP server listening on port ${PORT}`);
    console.error(`Loaded ${policies.length} policies`);
    console.error(`Health check: http://localhost:${PORT}/health`);
    console.error(`MCP endpoint: http://localhost:${PORT}/mcp`);
  });
}
