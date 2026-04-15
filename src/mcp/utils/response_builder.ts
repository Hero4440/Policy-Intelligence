export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface EvidenceItem {
  field: string;
  text: string;
  source: {
    policy_id: string;
    policy_title: string;
    effective_date?: string;
    page: number;
    section: string;
  };
}

export interface StandardToolResponse {
  answer: string;
  structured_result: Record<string, unknown>;
  evidence: EvidenceItem[];
  confidence: ConfidenceLevel;
}

export interface ErrorSuggestions {
  available_payers?: string[];
  available_drugs?: string[];
  hint?: string;
  [key: string]: unknown;
}

export interface StandardErrorResponse {
  error: string;
  message: string;
  suggestions: ErrorSuggestions;
  hint: string;
}

type TextResponse = {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
};

export function buildStandardResponse(
  answer: string,
  structured_result: Record<string, unknown>,
  evidence: EvidenceItem[],
  confidence: ConfidenceLevel
): TextResponse {
  const response: StandardToolResponse = {
    answer,
    structured_result,
    evidence,
    confidence
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }
    ]
  };
}

export function buildErrorResponse(
  message: string,
  suggestions: ErrorSuggestions = {}
): TextResponse {
  const hint = typeof suggestions.hint === 'string'
    ? suggestions.hint
    : 'Use available_payers and available_drugs to adjust the query.';

  const response: StandardErrorResponse = {
    error: 'Tool error',
    message,
    suggestions,
    hint
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response, null, 2)
      }
    ],
    isError: true
  };
}
