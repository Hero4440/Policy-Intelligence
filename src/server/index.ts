import '../env-loader.js';
import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createMcpApp } from '../mcp/index.js';
import { getPoliciesFromMemory, loadStorageOnStartup } from '../storage/startup.js';
import { ensureSeedPatientCases, listPatientCases } from '../storage/patient-store.js';
import { listEvaluations } from '../storage/evaluation-store.js';
import { registerPolicyDataRoutes } from './policy-data-routes.js';
import { registerChatRoutes } from './chat.js';
import { registerPolicyQaChatRoute } from './policy-qa-chat.js';
import { registerIngestionRoutes } from './ingestion/index.js';
import { registerPatientRoutes } from './patient-routes.js';
import { registerPolicyRoutes } from './policy-routes.js';
import { registerUploadRoutes } from './uploads.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');
const distDir = join(projectRoot, 'dist');

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json({ limit: '25mb' }));

app.use(createMcpApp());
registerPolicyDataRoutes(app);
registerPolicyRoutes(app);
registerPatientRoutes(app);
registerIngestionRoutes(app);
registerUploadRoutes(app);
registerChatRoutes(app);
registerPolicyQaChatRoute(app);

app.get('/api/health', (req, res) => {
  const policies = getPoliciesFromMemory();
  const payers = [...new Set(policies.map((policy) => policy.payer))];
  res.json({
    status: 'ok',
    service: 'policypilot-chat',
    timestamp: new Date().toISOString(),
    storage: {
      policiesLoaded: policies.length,
      payers,
      payerCount: payers.length,
      patientCases: listPatientCases().length,
      evaluations: listEvaluations().length
    }
  });
});

if (process.env.NODE_ENV === 'production' && existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api|\/mcp|\/health)/, (req, res) => {
    res.sendFile(join(distDir, 'index.html'));
  });
}

const PORT = Number(process.env.PORT || 3000);
loadStorageOnStartup();
ensureSeedPatientCases();
app.listen(PORT, () => {
  console.error(`PolicyPilot server listening on port ${PORT}`);
  console.error(`API health: http://localhost:${PORT}/api/health`);
  console.error(`MCP health: http://localhost:${PORT}/health`);
});

export { app };
