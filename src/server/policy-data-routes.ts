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
  app.get('/api/policy/summary', (req: Request, res: Response) => {
    res.json({
      summary: getCatalogSummary()
    });
  });

  app.get('/api/policy/issuers', (req: Request, res: Response) => {
    res.json({
      issuers: listIssuers()
    });
  });

  app.get('/api/policy/drugs', (req: Request, res: Response) => {
    const query = typeof req.query.query === 'string' ? req.query.query : '';
    res.json({
      drugs: searchDrugs(query)
    });
  });

  app.get('/api/policy/compare', (req: Request, res: Response) => {
    const drug = typeof req.query.drug === 'string' ? req.query.drug : '';
    const issuer = typeof req.query.issuer === 'string' ? req.query.issuer : undefined;

    if (!drug.trim()) {
      res.status(400).json({ error: 'drug query is required' });
      return;
    }

    res.json({
      drug,
      issuer: issuer ?? null,
      matches: compareDrugAcrossPlans(drug, issuer)
    });
  });

  app.get('/api/policy/detail', (req: Request, res: Response) => {
    const drug = typeof req.query.drug === 'string' ? req.query.drug : '';
    const planId = typeof req.query.planId === 'string' ? req.query.planId : '';

    if (!drug.trim() || !planId.trim()) {
      res.status(400).json({ error: 'planId and drug are required' });
      return;
    }

    const detail = getPlanDrugDetail(planId, drug);
    if (!detail) {
      res.status(404).json({ error: 'No detail found for that plan and drug' });
      return;
    }

    res.json({ detail });
  });

  app.get('/api/policy/changes', (req: Request, res: Response) => {
    const drug = typeof req.query.drug === 'string' ? req.query.drug : '';
    const issuer = typeof req.query.issuer === 'string' ? req.query.issuer : undefined;

    if (!drug.trim()) {
      res.status(400).json({ error: 'drug query is required' });
      return;
    }

    res.json({
      changeWatch: getChangeWatch(drug, issuer)
    });
  });

  registerPolicyQaChatRoute(app);
}
