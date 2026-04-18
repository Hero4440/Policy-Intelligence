export interface GroundedClaim {
  claim_id: string;
  claim_text: string;
  evidence_refs: string[];
}

function splitIntoSentences(llmResponse: string): string[] {
  const sentences = llmResponse
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(Boolean);

  if (sentences.length > 0) {
    return sentences;
  }

  const fallback = llmResponse.trim();
  return fallback ? [fallback] : [];
}

export function extractAndValidateClaims(
  llmResponse: string,
  evidenceCount: number
): { validClaims: GroundedClaim[]; filteredCount: number; cleanedAnswer: string } {
  const sentences = splitIntoSentences(llmResponse);
  const validClaims: GroundedClaim[] = [];
  const keptSentences: string[] = [];
  let filteredCount = 0;

  for (const sentence of sentences) {
    const evidenceRefs = Array.from(sentence.matchAll(/\[E(\d+)\]/gi))
      .map(match => ({
        label: `E${match[1]}`,
        index: Number.parseInt(match[1] ?? '', 10)
      }));

    if (evidenceRefs.length === 0) {
      keptSentences.push(sentence);
      continue;
    }

    const invalidReference = evidenceRefs.some(ref => Number.isNaN(ref.index) || ref.index >= evidenceCount);
    if (invalidReference) {
      filteredCount += 1;
      continue;
    }

    validClaims.push({
      claim_id: `claim_${validClaims.length}`,
      claim_text: sentence.replace(/\s*\[E\d+\]/gi, '').trim(),
      evidence_refs: evidenceRefs.map(ref => ref.label)
    });
    keptSentences.push(sentence);
  }

  const cleanedAnswer = keptSentences
    .join(' ')
    .replace(/\s*\[E\d+\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    validClaims,
    filteredCount,
    cleanedAnswer
  };
}
