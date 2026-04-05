import express from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createMcpApp } from '../mcp/index.js';
import { registerAntonRxRoutes } from './antonrx-routes.js';
import { registerChatRoutes } from './chat.js';
import { registerIngestionRoutes } from './ingestion/index.js';
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
registerAntonRxRoutes(app);
registerIngestionRoutes(app);
registerUploadRoutes(app);
registerChatRoutes(app);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'policypilot-chat',
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'production' && existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/mcp' || req.path === '/health') {
      next();
      return;
    }

    res.sendFile(join(distDir, 'index.html'));
  });
}

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.error(`PolicyPilot server listening on port ${PORT}`);
  console.error(`API health: http://localhost:${PORT}/api/health`);
  console.error(`MCP health: http://localhost:${PORT}/health`);
});

export { app };
