/**
 * Ingest the 6 example medical policy PDFs provided in the hackathon data package.
 * Run with: npx tsx scripts/ingest-example-policies.ts
 *
 * Requires the server to be running on port 3000.
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const policyDir = join(projectRoot, 'docs/hackaathon2/Medical Drug Coverage Policy Examples');
const SERVER = process.env.SERVER_URL || 'http://localhost:3000';

async function main() {
  const files = readdirSync(policyDir).filter(f => f.endsWith('.pdf'));

  console.log(`Found ${files.length} PDF policy files to ingest:\n`);
  files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  console.log('');

  const payloads = files.map(fileName => {
    const filePath = join(policyDir, fileName);
    const buffer = readFileSync(filePath);
    return {
      name: fileName,
      mimeType: 'application/pdf',
      base64: buffer.toString('base64')
    };
  });

  console.log(`Uploading ${payloads.length} files to ${SERVER}/api/ingestion/upload...\n`);

  const response = await fetch(`${SERVER}/api/ingestion/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: payloads })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Upload failed (${response.status}): ${text}`);
    process.exit(1);
  }

  const result = await response.json() as any;

  console.log('=== Ingestion Results ===\n');

  for (const entry of result.accepted || []) {
    const source = entry.source;
    console.log(`[${source.status.toUpperCase()}] ${source.fileName}`);
    console.log(`  Issuer: ${source.issuerName || 'Unknown'}`);
    console.log(`  Detected drugs: ${source.detectedDrugs.join(', ') || 'none'}`);
    console.log(`  Snapshots created: ${entry.snapshotCount}`);
    console.log(`  Summary: ${source.summary}`);
    console.log('');
  }

  console.log('=== Summary ===');
  console.log(`  Total sources: ${result.summary.sourceCount}`);
  console.log(`  Normalized: ${result.summary.normalizedSourceCount}`);
  console.log(`  Partial: ${result.summary.partialSourceCount}`);
  console.log(`  Total snapshots: ${result.summary.snapshotCount}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
