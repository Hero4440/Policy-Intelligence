import type { Express, Request, Response } from 'express';
import { registerPolicyQaChatRoute } from './policy-qa-chat.js';
import {
  compareDrugAcrossPlans,
  getCatalogSummary,
  getChangeWatch,
  getPlanDrugDetail,
  listIssuers,
  searchDrugs
} from './policy-data.js';

export function registerPolicyDataRoutes(app: Express) {
  app.get('/api/policy/summary', async (req: Request, res: Response) => {
    res.json({
      summary: await getCatalogSummary()
    });
  });

  app.get('/api/policy/issuers', async (req: Request, res: Response) => {
    res.json({
      issuers: await listIssuers()
    });
  });

  app.get('/api/policy/drugs', async (req: Request, res: Response) => {
    const query = typeof req.query.query === 'string' ? req.query.query : '';
    res.json({
      drugs: await searchDrugs(query, query ? 12 : 100)
    });
  });

  app.get('/api/policy/compare', async (req: Request, res: Response) => {
    const drug = typeof req.query.drug === 'string' ? req.query.drug : '';
    const issuer = typeof req.query.issuer === 'string' ? req.query.issuer : undefined;

    if (!drug.trim()) {
      res.status(400).json({ error: 'drug query is required' });
      return;
    }

    res.json({
      drug,
      issuer: issuer ?? null,
      matches: await compareDrugAcrossPlans(drug, issuer)
    });
  });

  app.get('/api/policy/detail', async (req: Request, res: Response) => {
    const drug = typeof req.query.drug === 'string' ? req.query.drug : '';
    const planId = typeof req.query.planId === 'string' ? req.query.planId : '';

    if (!drug.trim() || !planId.trim()) {
      res.status(400).json({ error: 'planId and drug are required' });
      return;
    }

    const detail = await getPlanDrugDetail(planId, drug);
    if (!detail) {
      res.status(404).json({ error: 'No detail found for that plan and drug' });
      return;
    }

    res.json({ detail });
  });

  app.get('/api/policy/changes', async (req: Request, res: Response) => {
    const drug = typeof req.query.drug === 'string' ? req.query.drug : '';
    const issuer = typeof req.query.issuer === 'string' ? req.query.issuer : undefined;

    if (!drug.trim()) {
      res.status(400).json({ error: 'drug query is required' });
      return;
    }

    res.json({
      changeWatch: await getChangeWatch(drug, issuer)
    });
  });

  registerPolicyQaChatRoute(app);
}
