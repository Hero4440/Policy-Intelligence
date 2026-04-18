import Anthropic from '@anthropic-ai/sdk';
import type { EvidenceItem } from '../../utils/response_builder.js';
import type { ExtractedEntities } from './entity_extractor.js';

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
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required for LLM-powered Q&A');
  }

  const client = new Anthropic({
    apiKey,
    maxRetries: 2,
    timeout: 30000
  });

  const userPrompt = [
    `Question: ${question}`,
    '',
    'Evidence snippets:',
    formatEvidence(evidenceSnippets)
  ].join('\n');

  try {
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      temperature: 0,
      system: buildSystemPrompt(entities),
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
      .trim();

    if (!text) {
      throw new Error('Anthropic returned an empty response');
    }

    return text;
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(`LLM API error (${error.status ?? 'unknown'}): ${error.message}`);
    }

    throw error;
  }
}
