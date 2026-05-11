import type { EvidenceItem } from '../../utils/response_builder.js';
import type { ExtractedEntities } from './entity_extractor.js';
import { geminiChat, getDefaultModel } from '../../../server/gemini-client.js';

type ChatPayload = Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;

function formatEvidence(evidenceSnippets: EvidenceItem[]): string {
  return evidenceSnippets
    .map((item, index) => {
      const title = item.source.policy_title;
      const section = item.source.section;
      return `[E${index}] ${item.text}\nSource: ${title} | Section: ${section} | Page: ${item.source.page}`;
    })
    .join('\n\n');
}

function buildSystemPrompt(entities: ExtractedEntities): string {
  const entityContext = [
    entities.payer ? `payer=${entities.payer}` : undefined,
    entities.drug ? `drug=${entities.drug}` : undefined
  ].filter(Boolean).join(', ');

  return [
    'You answer medical policy questions using ONLY the provided evidence snippets.',
    'Every factual claim must include one or more inline evidence citations like [E0] or [E1].',
    'Transitional or framing sentences may appear without citations, but unsupported facts are forbidden.',
    'If evidence is insufficient for part of the answer, say what is missing instead of guessing.',
    'Cross-payer synthesis is allowed only when each factual statement is cited.',
    entityContext ? `Detected entities: ${entityContext}.` : undefined
  ].filter(Boolean).join(' ');
}

export async function answerWithGrounding(
  question: string,
  evidenceSnippets: EvidenceItem[],
  entities: ExtractedEntities
): Promise<string> {
  const userPrompt = [
    `Question: ${question}`,
    '',
    'Evidence snippets:',
    formatEvidence(evidenceSnippets)
  ].join('\n');

  const messages: ChatPayload = [
    { role: 'system', content: buildSystemPrompt(entities) },
    { role: 'user', content: userPrompt }
  ];

  const content = await geminiChat(messages, getDefaultModel());

  if (!content) {
    throw new Error('Gemini returned an empty response');
  }

  return content;
}
