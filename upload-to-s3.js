#!/usr/bin/env node

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);
const filePath = args[0] || '/tmp/query_ready_formulary.csv';

if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

const fileName = path.basename(filePath);
const s3Key = `formulary/${fileName}`;

const s3Client = new S3Client({
  region: 'auto',
  endpoint: 'https://t3.storageapi.dev',
  credentials: {
    accessKeyId: 'tid_LkzHoTVKBZxVrbdGOHIXuQTDDITynmLOTiynARQPQzaIHyR_gg',
    secretAccessKey: 'tsec_AMpOXM_uAtdKfygYYTrb1plLJ7B9K4bSYO1JNDE0pJOo6fg2tZEKJxxT8wAFyvrIApE8ws'
  }
});

(async () => {
  try {
    const fileContent = fs.readFileSync(filePath);
    const fileSizeMB = (fileContent.length / (1024 * 1024)).toFixed(2);

    console.log(`Uploading ${fileName} (${fileSizeMB} MB)...`);

    const command = new PutObjectCommand({
      Bucket: 'formulary-data-r1trx7etu9',
      Key: s3Key,
      Body: fileContent,
      ContentType: 'text/csv'
    });

    await s3Client.send(command);
    console.log(`✓ Successfully uploaded to s3://formulary-data-r1trx7etu9/${s3Key}`);
  } catch (error) {
    console.error(`✗ Upload failed: ${error.message}`);
    process.exit(1);
  }
})();
