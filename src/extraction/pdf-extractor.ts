import fs from 'fs/promises';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import { cleanPolicyText } from './text-cleaner.js';

/**
 * Extract and clean text from a PDF file.
 *
 * @param pdfPath - Path to PDF file
 * @returns Cleaned text content
 */
export async function extractPdfText(pdfPath: string): Promise<string> {
  // Read PDF file
  const dataBuffer = await fs.readFile(pdfPath);

  // Extract text using pdf-parse
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();

  console.log(`Extracted ${result.pages.length} pages from ${path.basename(pdfPath)}`);

  // Clean and return text
  return cleanPolicyText(result.text);
}

// CLI usage: tsx src/extraction/pdf-extractor.ts <pdf-path>
if (import.meta.url === `file://${process.argv[1]}`) {
  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.error('Usage: tsx src/extraction/pdf-extractor.ts <pdf-path>');
    process.exit(1);
  }

  try {
    const text = await extractPdfText(pdfPath);
    const basename = path.basename(pdfPath, '.pdf');
    const outputPath = path.join('data/policies/extracted', `${basename}.txt`);

    await fs.writeFile(outputPath, text, 'utf-8');
    console.log(`Extracted text written to ${outputPath}`);
  } catch (error) {
    console.error('Error extracting PDF:', error);
    process.exit(1);
  }
}
