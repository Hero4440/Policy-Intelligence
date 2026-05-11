import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createMcpApp } from '../src/mcp/index.js';
import express from 'express';
import cors from 'cors';
import { registerPolicyDataRoutes } from '../src/server/policy-data-routes.js';
import { registerChatRoutes } from '../src/server/chat.js';
import { registerPolicyQaChatRoute } from '../src/server/policy-qa-chat.js';
import { registerPatientRoutes } from '../src/server/patient-routes.js';
import { registerPolicyRoutes } from '../src/server/policy-routes.js';
import { registerUploadRoutes } from '../src/server/uploads.js';
import { loadStorageOnStartup } from '../src/storage/startup.js';

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json({ limit: '25mb' }));

// Load storage on startup
await loadStorageOnStartup();

app.use(createMcpApp());
registerPolicyDataRoutes(app);
registerPolicyRoutes(app);
registerPatientRoutes(app);
registerUploadRoutes(app);
registerChatRoutes(app);
registerPolicyQaChatRoute(app);

export default async (req: VercelRequest, res: VercelResponse) => {
  return app(req, res);
};
