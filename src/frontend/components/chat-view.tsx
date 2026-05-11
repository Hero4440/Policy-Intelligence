import { useEffect, useMemo, useRef, useState } from 'react';
import { marked } from 'marked';
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

const SUGGESTED_QUESTIONS = [
  "What are UHC's rituximab requirements?",
  "Compare prior auth for adalimumab across payers",
  "What are the step therapy rules for Humira?"
];

function getContextualSuggestions(messages: ChatMessage[]): string[] {
  // If no messages yet, show default suggestions
  if (messages.length === 0) {
    return SUGGESTED_QUESTIONS;
  }

  // Get the last user message to provide context
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
  
  if (!lastUserMessage) {
    return SUGGESTED_QUESTIONS;
  }

  const content = lastUserMessage.content.toLowerCase();

  // Contextual suggestions based on conversation
  if (content.includes('humira') || content.includes('adalimumab')) {
    return [
      "What are the step therapy requirements for Humira?",
      "Compare Humira coverage across different payers",
      "What diagnosis codes are required for Humira?"
    ];
  }

  if (content.includes('prior auth') || content.includes('pa')) {
    return [
      "Which biologics require prior authorization?",
      "Compare PA requirements across payers",
      "What's the typical PA approval timeline?"
    ];
  }

  if (content.includes('step therapy')) {
    return [
      "Which drugs have step therapy requirements?",
      "How does step therapy differ by payer?",
      "What are alternatives to step therapy drugs?"
    ];
  }

  if (content.includes('aetna') || content.includes('uhc') || content.includes('cigna')) {
    return [
      "Compare coverage policies across major payers",
      "What are the key differences in payer requirements?",
      "Which payer has the most restrictive policies?"
    ];
  }

  if (content.includes('coverage') || content.includes('covered')) {
    return [
      "What are common coverage exclusions?",
      "How do medical necessity criteria vary?",
      "What documentation is needed for coverage?"
    ];
  }

  // Default contextual follow-ups
  return [
    "Can you provide more details about that?",
    "How does this compare to other payers?",
    "What are the specific requirements?"
  ];
}

export function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEvidence, setActiveEvidence] = useState<{ title: string; evidence: PolicyEvidenceRef[] } | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(() => getContextualSuggestions([]));
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const hasSidebar = useMemo(() => Boolean(activeEvidence && activeEvidence.evidence.length > 0), [activeEvidence]);

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file (FHIR patient bundle or policy JSON)');
      return;
    }

    setUploadStatus(`Uploading ${file.name}...`);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/json', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: `Upload failed: ${response.status}` }));
        throw new Error(typeof payload.error === 'string' ? payload.error : `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      setUploadStatus(`✓ Successfully uploaded ${file.name}`);
      
      // Clear status after 3 seconds
      setTimeout(() => setUploadStatus(null), 3000);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'File upload failed');
      setUploadStatus(null);
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFileUpload(event.dataTransfer.files);
  }

  function handleFileInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    handleFileUpload(event.target.files);
  }

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
      const sessionId = crypto.randomUUID();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          context: {}
        })
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let assistantContent = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              // Handle message_delta events (streaming chunks)
              if (parsed.delta) {
                assistantContent += parsed.delta;
              }
              // Handle message_done event (final message)
              if (parsed.message) {
                assistantContent = parsed.message;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      if (assistantContent) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: assistantContent
        };

        setMessages((current) => {
          const updatedMessages = [...current, assistantMessage];
          setSuggestedQuestions(getContextualSuggestions(updatedMessages));
          return updatedMessages;
        });
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Chat request failed');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSuggestedQuestion(question: string) {
    setInput(question);
    // Trigger form submission programmatically
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question
    };

    setMessages((current) => [...current, userMessage]);
    setError(null);
    setIsLoading(true);

    void (async () => {
      try {
        const sessionId = crypto.randomUUID();
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId,
            messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
            context: {}
          })
        });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        let assistantContent = '';
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                // Handle message_delta events (streaming chunks)
                if (parsed.delta) {
                  assistantContent += parsed.delta;
                }
                // Handle message_done event (final message)
                if (parsed.message) {
                  assistantContent = parsed.message;
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }

        if (assistantContent) {
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: assistantContent
          };

          setMessages((current) => {
            const updatedMessages = [...current, assistantMessage];
            setSuggestedQuestions(getContextualSuggestions(updatedMessages));
            return updatedMessages;
          });
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Chat request failed');
      } finally {
        setIsLoading(false);
        setInput('');
      }
    })();
  }

  return (
    <div className={`chat-layout${hasSidebar ? ' chat-layout-with-sidebar' : ''}`}>
      <div className="chat-main">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Chat</p>
            <h2>Ask natural-language questions about policies</h2>
          </div>
        </div>

        {/* File Upload Section */}
        <div 
          className={`chat-upload-zone${isDragging ? ' chat-upload-zone-dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="chat-upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Upload JSON
          </button>
          <p className="chat-upload-hint">
            Drop FHIR patient bundles or policy JSON files here, or click Upload JSON above.
          </p>
          {uploadStatus && <p className="chat-upload-status">{uploadStatus}</p>}
        </div>

        <div className="chat-messages">
          {messages.length === 0 && !isLoading && (
            <div className="empty-state">Ask about prior authorization, step therapy, payer differences, or policy wording.</div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`chat-message chat-message-${message.role}`}>
              {message.role === 'assistant' ? (
                <div
                  className="chat-markdown"
                  dangerouslySetInnerHTML={{ __html: marked(message.content) }}
                />
              ) : (
                <p>{message.content}</p>
              )}
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

        <div className="suggested-questions-inline">
          <p className="suggested-questions-label">Try asking:</p>
          <div className="suggested-questions-bubbles">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                type="button"
                className="suggested-question-bubble"
                onClick={() => handleSuggestedQuestion(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <form className="chat-input-form" onSubmit={handleSubmit}>
          <div className="chat-input-wrapper">
            <textarea
              ref={textareaRef}
              className="chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
                }
              }}
              placeholder="Ask about prior authorization, step therapy, or coverage requirements..."
              rows={1}
            />
            <button 
              type="submit" 
              className="chat-submit-btn" 
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              {isLoading ? (
                <svg className="chat-loading-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="32">
                    <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite" />
                  </circle>
                </svg>
              ) : (
                <svg className="chat-send-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          <p className="chat-input-hint">Press Enter to send, Shift+Enter for new line</p>
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
