import type { Express, Request, Response } from 'express';
import {
  addCaseDocument,
  createPatientCase,
  getPatientCase,
  listPatientCases
} from '../storage/patient-store.js';

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
    const caseId = Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId;
    const patientCase = getPatientCase(caseId);
    if (!patientCase) {
      res.status(404).json({ error: 'Case not found' });
      return;
    }

    res.json({
      case: patientCase
    });
  });

  app.post('/api/patients/cases/:caseId/documents', (req: Request, res: Response) => {
    const caseId = Array.isArray(req.params.caseId) ? req.params.caseId[0] : req.params.caseId;
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
}
