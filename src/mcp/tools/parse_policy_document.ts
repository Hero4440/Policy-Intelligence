import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { parsePdfPolicyText } from '../../server/ingestion/pdf-policy-parser.js';
import type { IngestedSourceRecord } from '../../server/ingestion/store.js';
import { buildErrorResponse, buildStandardResponse } from '../utils/response_builder.js';

const parsePolicyDocumentInput = z.object({
  source_id: z.string().optional().describe('Source ID returned from upload_policy_document'),
  file_path: z.string().optional().describe('Absolute path to a policy text or PDF file to parse directly')
});

type ParsedInput = {
  fileName: string;
  text: string;
  issuerName: string;
  effectiveDate: string;
};

function readSourceRecord(sourceId: string): IngestedSourceRecord | null {
  const dbPath = join(process.cwd(), 'data', 'ingestion', 'db.json');
  if (!existsSync(dbPath)) {
    return null;
  }

  const db = JSON.parse(readFileSync(dbPath, 'utf-8')) as {
    sources?: IngestedSourceRecord[];
  };

  return db.sources?.find((entry) => entry.id === sourceId) ?? null;
}

function loadParseInputFromSource(sourceId: string): ParsedInput | null {
  const source = readSourceRecord(sourceId);
  if (!source) {
    return null;
  }
  if (!source.extractedTextPath || !existsSync(source.extractedTextPath)) {
    return null;
  }

  return {
    fileName: source.fileName,
    text: readFileSync(source.extractedTextPath, 'utf-8'),
    issuerName: source.issuerName,
    effectiveDate: source.effectiveDate
  };
}

export function registerParsePolicyDocument(server: McpServer): void {
  server.registerTool(
    'parse_policy_document',
    {
      description: 'Parse an already-stored policy document into structured JSON fields. Use this to re-parse or inspect the structured output of a document already in the system by its source ID or file path. Returns policy fields: payer, drug, indications, prior auth, step therapy, requirements.',
      inputSchema: parsePolicyDocumentInput.shape
    },
    async ({ source_id, file_path }) => {
      if (!source_id && !file_path) {
        return buildErrorResponse('Either source_id or file_path is required.', {
          hint: 'Provide a prior upload source_id or a text-based file_path.'
        });
      }

      try {
        let input: ParsedInput | null = null;

        if (source_id) {
          input = loadParseInputFromSource(source_id);
          if (!input) {
            return buildErrorResponse(`No extracted text found for source_id "${source_id}".`, {
              hint: 'Upload the policy first or use a source_id that came from upload_policy_document.'
            });
          }
        } else if (file_path) {
          const extension = extname(file_path).toLowerCase();
          if (extension === '.pdf') {
            return buildErrorResponse('Direct PDF parsing is not supported in this tool.', {
              hint: 'Upload the PDF with upload_policy_document first so the ingestion pipeline can extract text.'
            });
          }

          input = {
            fileName: file_path.split('/').at(-1) || 'policy-document.txt',
            text: readFileSync(file_path, 'utf-8'),
            issuerName: 'Unknown issuer',
            effectiveDate: 'Unknown'
          };
        }

        if (!input) {
          return buildErrorResponse('Unable to resolve a policy document to parse.', {
            hint: 'Provide a valid source_id or file_path.'
          });
        }

        const parsedPolicy = parsePdfPolicyText({
          fileName: input.fileName,
          text: input.text,
          issuerName: input.issuerName,
          effectiveDate: input.effectiveDate,
          knownDrugLexicon: []
        });

        return buildStandardResponse(
          `Parsed policy document. Detected drugs: ${parsedPolicy.drugLabels.join(', ') || 'none'}. PA required: ${parsedPolicy.priorAuth}. Step therapy: ${parsedPolicy.stepTherapy}.`,
          {
            title: parsedPolicy.title,
            issuer: parsedPolicy.issuerName,
            effectiveDate: parsedPolicy.effectiveDate,
            drugLabels: parsedPolicy.drugLabels,
            priorAuth: parsedPolicy.priorAuth,
            stepTherapy: parsedPolicy.stepTherapy,
            quantityLimit: parsedPolicy.quantityLimit,
            medicalBenefit: parsedPolicy.medicalBenefit,
            requirementsSummary: parsedPolicy.requirementsSummary,
            evidenceSummary: parsedPolicy.evidenceSummary,
            notes: parsedPolicy.notes
          },
          parsedPolicy.evidenceSummary.map((snippet, index) => ({
            field: `evidence_${index}`,
            text: snippet,
            source: {
              policy_id: source_id ?? '',
              policy_title: parsedPolicy.title,
              page: 0,
              section: 'Parsed evidence'
            }
          })),
          parsedPolicy.drugLabels.length > 0 ? 'MEDIUM' : 'LOW'
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return buildErrorResponse(`Failed to parse policy document: ${message}`, {
          hint: 'Check that the source or file contains extracted policy text.'
        });
      }
    }
  );
}
