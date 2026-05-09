import type { Express, Request, Response } from 'express';
import { buildPolicyComparison, getPolicyCompareOptions } from './policy-compare.js';
import { buildPolicyVersionDiff, listPolicyChangeEvents } from './policy-changes.js';
import { searchPolicyEvidence } from './evidence-search.js';
import { buildPolicyInsights, getPolicyInsightsOptions } from './policy-insights.js';

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

function parseSeverityQuery(value: unknown): 'cosmetic' | 'operational' | 'clinical' | undefined {
  if (value === 'cosmetic' || value === 'operational' || value === 'clinical') {
    return value;
  }
  return undefined;
}

export function registerPolicyRoutes(app: Express) {
  app.get('/api/evidence/search', (req: Request, res: Response) => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    if (!query.trim()) {
      res.status(400).json({ error: 'Query parameter q is required' });
      return;
    }

    try {
      const results = searchPolicyEvidence(query.trim());
      res.json({
        query: query.trim(),
        count: results.length,
        results
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search evidence';
      res.status(500).json({ error: message });
    }
  });

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

  app.get('/api/policies/insights/options', (_req: Request, res: Response) => {
    res.json(getPolicyInsightsOptions());
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

  app.get('/api/policies/changes', (req: Request, res: Response) => {
    try {
      res.json(
        listPolicyChangeEvents({
          policyId: typeof req.query.policyId === 'string' ? req.query.policyId : undefined,
          payer: typeof req.query.payer === 'string' ? req.query.payer : undefined,
          drugFamily: typeof req.query.drugFamily === 'string' ? req.query.drugFamily : undefined,
          severity: parseSeverityQuery(req.query.severity)
        })
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load policy changes';
      res.status(400).json({ error: message });
    }
  });

  app.get('/api/policies/:policyId/changes', (req: Request, res: Response) => {
    const policyId = typeof req.params.policyId === 'string' ? req.params.policyId : undefined;
    if (!policyId) {
      res.status(400).json({ error: 'policyId route param is required.' });
      return;
    }
    try {
      res.json(listPolicyChangeEvents({ policyId }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load policy changes';
      res.status(400).json({ error: message });
    }
  });

  app.get('/api/policies/:policyId/diff', (req: Request, res: Response) => {
    const policyId = typeof req.params.policyId === 'string' ? req.params.policyId : undefined;
    const fromVersion = parseVersionQuery(req.query.fromVersion);
    const toVersion = parseVersionQuery(req.query.toVersion);
    if (!policyId || !fromVersion || !toVersion) {
      res.status(400).json({ error: 'policyId, fromVersion, and toVersion are required.' });
      return;
    }

    try {
      res.json(buildPolicyVersionDiff(policyId, fromVersion, toVersion));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to build policy version diff';
      const statusCode = /not found|unavailable/i.test(message) ? 404 : 400;
      res.status(statusCode).json({ error: message });
    }
  });
}
