import type { Express, Request, Response } from 'express';
import { extractPatientData } from '../mcp/fhir/extractors.js';
import { PolicyRecordSchema } from '../../data/schemas/policy.schema.ts';
import { addUploadedPolicy, getOrCreateSession, serializeSession, setUploadedPatient } from './session-store.js';

type UploadFilePayload = {
  name: string;
  content: string;
};

function extractPatientName(bundle: any): string {
  const patientResource = bundle?.entry?.find((entry: any) => entry?.resource?.resourceType === 'Patient')?.resource;
  const name = patientResource?.name?.[0];
  if (!name) {
    return 'Unknown patient';
  }

  const given = Array.isArray(name.given) ? name.given.join(' ') : '';
  const family = name.family ?? '';
  return `${given} ${family}`.trim() || 'Unknown patient';
}

function summarizePatientBundle(bundle: any): string {
  const patientName = extractPatientName(bundle);
  const extracted = extractPatientData(bundle);
  return `${patientName} · ${extracted.diagnoses.length} diagnoses · ${extracted.medications.length} medications${extracted.coverage ? ` · ${extracted.coverage.payerName}` : ''}`;
}

function summarizePolicy(policy: any): string {
  return `${policy.payer} · ${policy.plan} · ${policy.drug.brandName} (${policy.drug.genericName})`;
}

export function registerUploadRoutes(app: Express) {
  app.post('/api/upload', (req: Request, res: Response) => {
    const { sessionId, files } = req.body as { sessionId?: string; files?: UploadFilePayload[] };

    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    if (!Array.isArray(files) || files.length === 0) {
      res.status(400).json({ error: 'At least one file is required' });
      return;
    }

    const session = getOrCreateSession(sessionId);
    const accepted: Array<{ name: string; type: 'patient' | 'policy'; summary: string }> = [];
    const rejected: Array<{ name: string; reason: string }> = [];

    for (const file of files) {
      try {
        const parsed = JSON.parse(file.content);

        if (parsed?.resourceType === 'Bundle') {
          const id = `patient-${Date.now()}-${accepted.length}`;
          const summary = summarizePatientBundle(parsed);
          setUploadedPatient(sessionId, {
            id,
            fileName: file.name,
            bundle: parsed,
            summary
          });
          accepted.push({ name: file.name, type: 'patient', summary });
          continue;
        }

        const validated = PolicyRecordSchema.safeParse(parsed);
        if (validated.success) {
          const id = `policy-${Date.now()}-${accepted.length}`;
          const summary = summarizePolicy(validated.data);
          addUploadedPolicy(sessionId, {
            id,
            fileName: file.name,
            policy: validated.data,
            summary
          });
          accepted.push({ name: file.name, type: 'policy', summary });
          continue;
        }

        rejected.push({
          name: file.name,
          reason: 'JSON was not a FHIR Bundle or a valid policy record'
        });
      } catch (error) {
        rejected.push({
          name: file.name,
          reason: error instanceof Error ? error.message : 'Invalid JSON'
        });
      }
    }

    res.json({
      accepted,
      rejected,
      session: serializeSession(session)
    });
  });
}
