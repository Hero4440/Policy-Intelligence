import { useEffect, useMemo, useRef, useState } from 'react';
import { PolicyEvidencePanel } from './policy-evidence-panel.js';
import type { PolicyEvidenceRef } from '../data/policies.js';

type ChatEvidenceCitation = {
  policyId: string;
  policyName: string;
  page: number | null;
  section: string;
  snippet: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  evidence?: ChatEvidenceCitation[];
};

type PolicyQaChatResponse = {
  answer: string;
  evidence: ChatEvidenceCitation[];
  query: string;
};

function mapEvidence(citations: ChatEvidenceCitation[]): PolicyEvidenceRef[] {
  return citations.map((citation, index) => ({
    id: `${citation.policyId || 'policy'}-${index}`,
    snippet: citation.snippet,
    document: citation.policyName,
    page: citation.page,
    section: citation.section,
    fieldLabel: 'Chat citation',
    policyId: citation.policyId,
    policyVersion: 0,
    payer: citation.policyName
  }));
}

export function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEvidence, setActiveEvidence] = useState<{ title: string; evidence: PolicyEvidenceRef[] } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const hasSidebar = useMemo(() => Boolean(activeEvidence && activeEvidence.evidence.length > 0), [activeEvidence]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/policy-qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: `Request failed: ${response.status}` }));
        throw new Error(typeof payload.error === 'string' ? payload.error : `Request failed: ${response.status}`);
      }

      const payload = await response.json() as PolicyQaChatResponse;
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: payload.answer,
        evidence: payload.evidence
      };

      setMessages((current) => [...current, assistantMessage]);
      if (payload.evidence.length > 0) {
        setActiveEvidence({
          title: 'Sources',
          evidence: mapEvidence(payload.evidence)
        });
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Chat request failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={`chat-layout${hasSidebar ? ' chat-layout-with-sidebar' : ''}`}>
      <div className="chat-main">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Chat</p>
            <h2>Ask natural-language questions about loaded policies</h2>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && !isLoading && (
            <div className="empty-state">Ask about prior authorization, step therapy, payer differences, or policy wording.</div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`chat-message chat-message-${message.role}`}>
              <p>{message.content}</p>
              {message.role === 'assistant' && message.evidence && message.evidence.length > 0 && (
                <button
                  type="button"
                  className="page-nav-btn chat-source-btn"
                  onClick={() => setActiveEvidence({ title: 'Sources', evidence: mapEvidence(message.evidence ?? []) })}
                >
                  View {message.evidence.length} source{message.evidence.length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          ))}

          {isLoading && <div className="chat-message chat-message-assistant"><p>Thinking…</p></div>}
          {error && <p className="error-text">{error}</p>}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSubmit}>
          <textarea
            className="chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="What does UHC require before rituximab approval?"
            rows={4}
          />
          <div className="chat-input-actions">
            <button type="submit" className="primary-button" disabled={isLoading || !input.trim()}>
              {isLoading ? 'Sending…' : 'Ask'}
            </button>
          </div>
        </form>
      </div>

      {hasSidebar && activeEvidence && (
        <div className="chat-sidebar">
          <PolicyEvidencePanel
            title={activeEvidence.title}
            evidence={activeEvidence.evidence}
            onClose={() => setActiveEvidence(null)}
          />
        </div>
      )}
    </div>
  );
}
