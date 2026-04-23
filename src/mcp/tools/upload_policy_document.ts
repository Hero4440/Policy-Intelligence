import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ingestOneFile } from '../../server/ingestion/index.js';
import { buildErrorResponse, buildStandardResponse } from '../utils/response_builder.js';

const uploadPolicyDocumentInput = z.object({
  file_path: z.string().optional().describe('Absolute path to policy file on disk (PDF, JSON, CSV)'),
  url: z.string().optional().describe('URL to download the policy document from'),
  file_name: z.string().optional().describe('Override file name (used when providing URL)')
});

function detectMimeType(fileName: string, contentType?: string | null): string {
  const normalizedContentType = contentType?.split(';')[0]?.trim().toLowerCase();
  if (normalizedContentType) {
    return normalizedContentType;
  }

  switch (extname(fileName).toLowerCase()) {
    case '.pdf':
      return 'application/pdf';
    case '.json':
      return 'application/json';
    case '.csv':
      return 'text/csv';
    case '.txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
}

function deriveFileNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    return segments.at(-1) || 'downloaded-policy';
  } catch {
    return 'downloaded-policy';
  }
}

export function registerUploadPolicyDocument(server: McpServer): void {
  server.registerTool(
    'upload_policy_document',
    {
      description: 'Upload a payer medical policy document by file path or URL. Accepts PDF, JSON policy, or CSV formulary. Triggers the full parse-and-store pipeline and returns the structured policy record. Use this when a user wants to add a new policy to the system.',
      inputSchema: uploadPolicyDocumentInput.shape
    },
    async ({ file_path, url, file_name }) => {
      if (!file_path && !url) {
        return buildErrorResponse('Either file_path or url is required.', {
          hint: 'Provide a local file_path or a downloadable url.'
        });
      }

      try {
        let fileName: string;
        let mimeType: string;
        let bytes: Buffer;

        if (url) {
          const response = await fetch(url);
          if (!response.ok) {
            return buildErrorResponse(`Failed to download file from URL: ${response.status} ${response.statusText}`, {
              hint: 'Verify the URL is reachable and returns the policy document directly.'
            });
          }

          fileName = file_name?.trim() || deriveFileNameFromUrl(url);
          mimeType = detectMimeType(fileName, response.headers.get('content-type'));
          bytes = Buffer.from(await response.arrayBuffer());
        } else {
          fileName = basename(file_path!);
          mimeType = detectMimeType(fileName);
          bytes = readFileSync(file_path!);
        }

        const { source, snapshotCount } = await ingestOneFile({
          name: fileName,
          mimeType,
          base64: bytes.toString('base64')
        });

        const confidence = source.status === 'normalized'
          ? 'HIGH'
          : source.status === 'partial'
            ? 'MEDIUM'
            : 'LOW';

        return buildStandardResponse(
          `Uploaded and processed ${fileName}. Status: ${source.status}. Created ${snapshotCount} policy records.`,
          {
            sourceId: source.id,
            fileName: source.fileName,
            status: source.status,
            issuer: source.issuerName,
            effectiveDate: source.effectiveDate,
            detectedDrugs: source.detectedDrugs,
            snapshotCount,
            notes: source.notes
          },
          [],
          confidence
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return buildErrorResponse(`Failed to upload policy document: ${message}`, {
          hint: 'Check the file contents, file path, or URL and try again.'
        });
      }
    }
  );
}
