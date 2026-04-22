import type { Express, Request, Response } from 'express';
import { extractEntities } from '../mcp/tools/utils/entity_extractor.js';
import { extractQuestionKeywords, retrieveEvidence } from '../mcp/tools/utils/evidence_retriever.js';
import { answerWithGrounding } from '../mcp/tools/utils/llm_client.js';
import type { EvidenceItem } from '../mcp/utils/response_builder.js';

export interface ChatEvidenceCitation {
  policyId: string;
  policyName: string;
  page: number | null;
  section: string;
  snippet: string;
}

export interface PolicyQaChatResponse {
  answer: string;
  evidence: ChatEvidenceCitation[];
  query: string;
}

function mapCitation(item: EvidenceItem): ChatEvidenceCitation {
  return {
    policyId: item.source.policy_id,
    policyName: item.source.policy_title || item.source.policy_id,
    page: Number.isFinite(item.source.page) ? item.source.page : null,
    section: item.source.section || '',
    snippet: item.text || ''
  };
}

function buildInlineCitationSuffix(citations: ChatEvidenceCitation[]): string {
  const seen = new Set<string>();
  const unique = citations.filter((citation) => {
    const key = `${citation.policyId}:${citation.page ?? 'na'}:${citation.section}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return unique
    .filter((citation) => citation.policyName)
    .map((citation) => `(${citation.policyName}${citation.page ? ` · page ${citation.page}` : ''}${citation.section ? ` · ${citation.section}` : ''})`)
    .join(' ');
}

export function registerPolicyQaChatRoute(app: Express): void {
  app.post('/api/chat/policy-qa', async (req: Request, res: Response) => {
    const { question } = req.body as { question?: string };
    if (!question || !question.trim()) {
      res.status(400).json({ error: 'question is required' });
      return;
    }

    try {
      const entities = extractEntities(question);
      const keywords = extractQuestionKeywords(question);
      const evidenceResult = retrieveEvidence(entities, keywords);
      const evidenceItems: EvidenceItem[] = evidenceResult.items;

      if (evidenceItems.length === 0) {
        const payload: PolicyQaChatResponse = {
          answer: 'No grounded policy evidence matched that question. Try including a payer, drug family, or a more specific rule keyword.',
          evidence: [],
          query: question.trim()
        };
        res.json(payload);
        return;
      }

      const rawAnswer = await answerWithGrounding(question, evidenceItems, entities);
      const citations = evidenceItems.map(mapCitation);
      const citationSuffix = buildInlineCitationSuffix(citations);
      const answer = citationSuffix ? `${rawAnswer}\n\n${citationSuffix}` : rawAnswer;

      const payload: PolicyQaChatResponse = {
        answer,
        evidence: citations,
        query: question.trim()
      };

      res.json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  });
}
