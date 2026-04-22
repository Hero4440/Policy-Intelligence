import type { Express, Request, Response } from 'express';
import { buildPolicyComparison, getPolicyCompareOptions } from './policy-compare.js';
import { buildPolicyInsights } from './policy-insights.js';

function parseCsvQuery(value: unknown): string[] {
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseVersionQuery(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  const version = Number(value);
  return Number.isFinite(version) ? version : undefined;
}

export function registerPolicyRoutes(app: Express) {
  app.get('/api/policies/compare/options', (_req: Request, res: Response) => {
    res.json(getPolicyCompareOptions());
  });

  app.get('/api/policies/compare', (req: Request, res: Response) => {
    const drugFamily = typeof req.query.drugFamily === 'string' ? req.query.drugFamily : '';
    const payers = parseCsvQuery(req.query.payers);
    const version = parseVersionQuery(req.query.version);

    try {
      const payload = buildPolicyComparison(drugFamily, payers, version);
      res.json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to build policy comparison';
      res.status(400).json({ error: message });
    }
  });

  app.get('/api/policies/insights', (req: Request, res: Response) => {
    const drugFamily = typeof req.query.drugFamily === 'string' ? req.query.drugFamily : '';
    const payers = parseCsvQuery(req.query.payers);
    const ruleType = typeof req.query.ruleType === 'string' ? req.query.ruleType : undefined;
    const version = parseVersionQuery(req.query.version);

    try {
      const payload = buildPolicyInsights({
        drugFamily,
        payers,
        ruleType: ruleType as Parameters<typeof buildPolicyInsights>[0]['ruleType'],
        version
      });
      res.json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to build policy insights';
      res.status(400).json({ error: message });
    }
  });
}
