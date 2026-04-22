import type { Express, Request, Response } from 'express';
import { getEvaluation, listEvaluations, saveEvaluation } from '../storage/evaluation-store.js';
import {
  addCaseDocument,
  createPatientCase,
  getPatientCase,
  listPatientCases
} from '../storage/patient-store.js';
import { updateCaseStatus } from '../storage/patient-store.js';
import { evaluatePatientCaseAgainstPolicy, getPatientPolicyOptions } from './patient-evaluation.js';
import { EvaluationNotFoundError, generateNextSteps } from './next-steps.js';

type CreatePatientCasePayload = {
  patientName?: string;
  payer?: string;
  requestedDrug?: string;
  diagnosis?: string;
};

type UploadPatientDocumentPayload = {
  fileName?: string;
  content?: string;
  contentType?: string;
  documentType?: string;
};

type CreateEvaluationPayload = {
  policyId?: string;
  policyVersion?: number;
};

function readCaseId(req: Request): string {
  return Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId;
}

export function registerPatientRoutes(app: Express) {
  app.get('/api/patients/cases', (_req: Request, res: Response) => {
    res.json({
      cases: listPatientCases()
    });
  });

  app.post('/api/patients/cases', (req: Request, res: Response) => {
    const { patientName, payer, requestedDrug, diagnosis } = req.body as CreatePatientCasePayload;

    if (!patientName?.trim() || !payer?.trim() || !requestedDrug?.trim() || !diagnosis?.trim()) {
      res.status(400).json({ error: 'patientName, payer, requestedDrug, and diagnosis are required' });
      return;
    }

    const patientCase = createPatientCase({
      patientName: patientName.trim(),
      payer: payer.trim(),
      requestedDrug: requestedDrug.trim(),
      diagnosis: diagnosis.trim()
    });

    res.status(201).json({
      case: patientCase
    });
  });

  app.get('/api/patients/cases/:caseId', (req: Request, res: Response) => {
    const caseId = readCaseId(req);
    const patientCase = getPatientCase(caseId);
    if (!patientCase) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    res.json({
      case: patientCase
    });
  });

  app.get('/api/patients/cases/:caseId/policy-options', (req: Request, res: Response) => {
    const caseId = readCaseId(req);

    try {
      res.json({
        caseId,
        policies: getPatientPolicyOptions(caseId)
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load patient policy options';
      res.status(message.includes('Case not found') ? 404 : 400).json({ error: message });
    }
  });

  app.post('/api/patients/cases/:caseId/documents', (req: Request, res: Response) => {
    const caseId = readCaseId(req);
    const { fileName, content, contentType, documentType } = req.body as UploadPatientDocumentPayload;

    if (!fileName?.trim() || typeof content !== 'string' || !content.length) {
      res.status(400).json({ error: 'fileName and content are required' });
      return;
    }

    try {
      const result = addCaseDocument({
        caseId,
        fileName: fileName.trim(),
        content,
        contentType: contentType?.trim() || 'text/plain',
        documentType: documentType?.trim() || 'uploaded_document'
      });

      res.status(201).json({
        case: result.caseRecord,
        document: result.document
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload document';
      res.status(message.includes('Case not found') ? 404 : 400).json({ error: message });
    }
  });

  app.get('/api/patients/cases/:caseId/evaluations', (req: Request, res: Response) => {
    const caseId = readCaseId(req);
    res.json({
      evaluations: listEvaluations({ caseId })
    });
  });

  app.post('/api/patients/cases/:caseId/evaluations', (req: Request, res: Response) => {
    const caseId = readCaseId(req);
    const { policyId, policyVersion } = req.body as CreateEvaluationPayload;

    if (!policyId?.trim() || !Number.isFinite(policyVersion)) {
      res.status(400).json({ error: 'policyId and numeric policyVersion are required' });
      return;
    }

    try {
      const evaluation = saveEvaluation(
        evaluatePatientCaseAgainstPolicy({
          caseId,
          policyId: policyId.trim(),
          policyVersion: Number(policyVersion)
        })
      );
      updateCaseStatus(caseId, 'complete');
      res.status(201).json({ evaluation });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to evaluate patient case';
      res.status(/not found/i.test(message) ? 404 : 400).json({ error: message });
    }
  });

  app.get('/api/patients/evaluations/:evalId', (req: Request, res: Response) => {
    const evalId = Array.isArray(req.params.evalId) ? req.params.evalId[0] : req.params.evalId;
    const evaluation = getEvaluation(evalId);
    if (!evaluation) {
      res.status(404).json({ error: 'Evaluation not found' });
      return;
    }

    res.json({ evaluation });
  });

  app.get('/api/patients/evaluations/:evalId/next-steps', async (req: Request, res: Response) => {
    const evalId = Array.isArray(req.params.evalId) ? req.params.evalId[0] : req.params.evalId;

    try {
      const payload = await generateNextSteps(evalId);
      res.json(payload);
    } catch (error) {
      if (error instanceof EvaluationNotFoundError) {
        res.status(404).json({ error: 'Evaluation not found' });
        return;
      }

      const message = error instanceof Error ? error.message : 'Failed to generate next steps';
      res.status(500).json({ error: message });
    }
  });
}
