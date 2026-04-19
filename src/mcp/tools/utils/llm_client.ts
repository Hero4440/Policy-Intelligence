import type { EvidenceItem } from '../../utils/response_builder.js';
import type { ExtractedEntities } from './entity_extractor.js';

type LocalLlmMode = 'ollama' | 'openai';
type OllamaChatResponse = { message?: { content?: string } };
type OpenAiChatResponse = { choices?: Array<{ message?: { content?: string } }> };

const OLLAMA_BASE_URL = (process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434').replace(/\/+$/, '');
const DEFAULT_MODEL = process.env.LOCAL_LLM_MODEL ?? process.env.OLLAMA_MODEL ?? 'llama3.1';

function ollamaEndpointCandidates(): string[] {
  const explicit = process.env.OLLAMA_URL;
  if (explicit && /\/api\/chat$|\/v1\/chat\/completions$/.test(explicit)) {
    return [explicit];
  }

  return [
    `${OLLAMA_BASE_URL}/api/chat`,
    `${OLLAMA_BASE_URL}/v1/chat/completions`
  ];
}

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

async function resolveInstalledModel(requestedModel: string): Promise<string> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) {
      return requestedModel;
    }

    const payload = await response.json() as { models?: Array<{ name?: string; model?: string }> };
    const installed = (payload.models ?? [])
      .map(entry => entry.name ?? entry.model)
      .filter((name): name is string => Boolean(name));

    if (installed.includes(requestedModel)) {
      return requestedModel;
    }

    const prefixMatch = installed.find(name => name.startsWith(`${requestedModel}:`));
    if (prefixMatch) {
      return prefixMatch;
    }

    if (requestedModel === DEFAULT_MODEL) {
      const preferredFallbacks = ['llama3.1:8b', 'llama3.2:3b', 'llama3:8b'];
      const fallback = preferredFallbacks.find(name => installed.includes(name));
      if (fallback) {
        return fallback;
      }
    }
  } catch {
    return requestedModel;
  }

  return requestedModel;
}

async function fetchLocalLlm(bodyFactory: (mode: LocalLlmMode) => unknown) {
  let lastStatus: number | undefined;
  let lastError: Error | undefined;

  for (const endpoint of ollamaEndpointCandidates()) {
    const mode: LocalLlmMode = endpoint.includes('/v1/') ? 'openai' : 'ollama';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyFactory(mode))
      });

      if (response.status === 404) {
        lastStatus = response.status;
        continue;
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Local LLM request failed with ${response.status}: ${text || response.statusText}`);
      }

      return { response, mode };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error(`Local LLM request failed with ${lastStatus ?? 'unknown status'}`);
}

export async function answerWithGrounding(
  question: string,
  evidenceSnippets: EvidenceItem[],
  entities: ExtractedEntities
): Promise<string> {
  const resolvedModel = await resolveInstalledModel(DEFAULT_MODEL);
  const userPrompt = [
    `Question: ${question}`,
    '',
    'Evidence snippets:',
    formatEvidence(evidenceSnippets)
  ].join('\n');

  const { response, mode } = await fetchLocalLlm(
    selectedMode => selectedMode === 'openai'
      ? {
          model: resolvedModel,
          stream: false,
          temperature: 0,
          messages: [
            { role: 'system', content: buildSystemPrompt(entities) },
            { role: 'user', content: userPrompt }
          ]
        }
      : {
          model: resolvedModel,
          stream: false,
          options: { temperature: 0 },
          messages: [
            { role: 'system', content: buildSystemPrompt(entities) },
            { role: 'user', content: userPrompt }
          ]
        }
  );

  const payload = await response.json();
  const content = mode === 'openai'
    ? (payload as OpenAiChatResponse).choices?.[0]?.message?.content?.trim()
    : (payload as OllamaChatResponse).message?.content?.trim();

  if (!content) {
    throw new Error('Local LLM returned an empty response');
  }

  return content;
}
