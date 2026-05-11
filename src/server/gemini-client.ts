import { TextDecoder } from 'util';

type GeminiRole = 'user' | 'model';

interface GeminiPart {
  text: string;
}

interface GeminiContent {
  role: GeminiRole;
  parts: GeminiPart[];
}

interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

interface GeminiCandidate {
  content: {
    parts: GeminiPart[];
    role: 'model';
  };
  finishReason: string;
}

interface GeminiResponse {
  candidates: GeminiCandidate[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface GeminiStreamChunk {
  candidates?: GeminiCandidate[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

type ChatPayload = Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;

const GEMINI_API_KEY = process.env.GEMINI_KEY_API || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1';
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_KEY_API environment variable is not set');
}

function validateApiKey() {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_KEY_API environment variable is required');
  }
}

function formatAsGeminiContent(messages: ChatPayload): GeminiContent[] {
  return messages
    .filter(msg => msg.role !== 'system')
    .map((msg) => {
      let role: GeminiRole = 'user';
      if (msg.role === 'assistant') {
        role = 'model';
      }

      return {
        role,
        parts: [{ text: msg.content }]
      };
    });
}

function prependSystemPrompt(messages: ChatPayload): GeminiContent[] {
  const systemMessage = messages.find(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');

  const contents = formatAsGeminiContent(nonSystemMessages);

  if (systemMessage && contents.length > 0) {
    const firstMessage = contents[0];
    if (firstMessage.role === 'user') {
      firstMessage.parts[0].text = `${systemMessage.content}\n\n${firstMessage.parts[0].text}`;
    }
  }

  return contents;
}

function extractTextFromResponse(response: GeminiResponse): string {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No candidates in Gemini response');
  }

  const candidate = response.candidates[0];
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    throw new Error('No text content in Gemini response');
  }

  return candidate.content.parts.map(part => part.text).join('');
}

function parseGeminiStreamChunk(chunk: string): { content: string; isDone: boolean; metadata?: any } {
  try {
    const data = JSON.parse(chunk) as GeminiStreamChunk;

    if (!data.candidates || data.candidates.length === 0) {
      return { content: '', isDone: false };
    }

    const candidate = data.candidates[0];
    const content = candidate.content?.parts?.map(part => part.text).join('') || '';
    const isDone = candidate.finishReason === 'STOP' || candidate.finishReason !== undefined;

    return {
      content,
      isDone,
      metadata: data.usageMetadata
    };
  } catch (error) {
    return { content: '', isDone: false };
  }
}

export async function geminiChat(
  messages: ChatPayload,
  model: string = DEFAULT_MODEL
): Promise<string> {
  validateApiKey();

  const contents = prependSystemPrompt(messages);

  const request: GeminiRequest = {
    contents,
    generationConfig: {
      temperature: 0
    }
  };

  const response = await fetch(
    `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    }
  );

  if (!response.ok) {
    const text = await response.text();
    let errorMessage = `Gemini API request failed with ${response.status}`;

    try {
      const error = JSON.parse(text);
      errorMessage = error.error?.message || errorMessage;
    } catch {
      errorMessage = `${errorMessage}: ${text || response.statusText}`;
    }

    throw new Error(errorMessage);
  }

  const payload = await response.json() as GeminiResponse;
  const content = extractTextFromResponse(payload);

  if (!content) {
    throw new Error('Gemini returned an empty response');
  }

  return content;
}

export async function geminiStream(
  messages: ChatPayload,
  model: string = DEFAULT_MODEL
): Promise<ReadableStream<string>> {
  validateApiKey();

  const contents = prependSystemPrompt(messages);

  const request: GeminiRequest = {
    contents,
    generationConfig: {
      temperature: 0
    }
  };

  const response = await fetch(
    `${GEMINI_BASE_URL}/models/${model}:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    }
  );

  if (!response.ok) {
    const text = await response.text();
    let errorMessage = `Gemini API streaming request failed with ${response.status}`;

    try {
      const error = JSON.parse(text);
      errorMessage = error.error?.message || errorMessage;
    } catch {
      errorMessage = `${errorMessage}: ${text || response.statusText}`;
    }

    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error('Gemini streaming response was empty');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  const readable = new ReadableStream<string>({
    async start(controller) {
      try {
        const reader = response.body!.getReader();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) {
              continue;
            }

            if (trimmed.startsWith('data: ')) {
              const jsonStr = trimmed.slice(6);
              const parsed = parseGeminiStreamChunk(jsonStr);

              if (parsed.content) {
                controller.enqueue(parsed.content);
              }

              if (parsed.isDone) {
                controller.close();
                return;
              }
            }
          }
        }

        if (buffer.trim()) {
          if (buffer.trim().startsWith('data: ')) {
            const jsonStr = buffer.trim().slice(6);
            const parsed = parseGeminiStreamChunk(jsonStr);
            if (parsed.content) {
              controller.enqueue(parsed.content);
            }
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return readable;
}

export async function parseStreamResponse(
  chunk: string
): Promise<{ content: string; isDone: boolean }> {
  const parsed = parseGeminiStreamChunk(chunk);
  return {
    content: parsed.content,
    isDone: parsed.isDone
  };
}

export function getDefaultModel(): string {
  return DEFAULT_MODEL;
}
