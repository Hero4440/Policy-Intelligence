/**
 * Clean raw PDF text by removing artifacts while preserving policy substance.
 *
 * @param rawText - Raw text extracted from PDF
 * @returns Cleaned text with artifacts removed
 */
export function cleanPolicyText(rawText: string): string {
  let text = rawText;

  // 1. Remove form feed characters
  text = text.replace(/\f/g, '');

  // 2. Remove common PDF artifacts (page numbers, headers/footers)
  // Pattern: "Page X of Y" or "Page X"
  text = text.replace(/Page \d+ of \d+/gi, '');
  text = text.replace(/Page \d+/gi, '');

  // 3. Trim each line
  text = text.split('\n').map(line => line.trim()).join('\n');

  // 4. Collapse 3+ newlines to max 2 (paragraph breaks)
  text = text.replace(/\n{3,}/g, '\n\n');

  // 5. Collapse 2+ spaces/tabs to single space
  text = text.replace(/[ \t]{2,}/g, ' ');

  // 6. Final trim
  text = text.trim();

  return text;
}
