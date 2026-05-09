import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type AskViewProps = {
  selectedDrug: string;
  selectedPayer: string;
  selectedPlanId?: string;
};

type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ToolResult = {
  tool: string;
  args: Record<string, unknown>;
  summary: {
    title: string;
    items: string[];
  };
};

type UploadedFile = {
  name: string;
  type: 'patient' | 'policy';
  summary: string;
};

const sessionId = `chat-${crypto.randomUUID()}`;

function buildStarterPrompts(selectedDrug: string, selectedPayer: string): string[] {
  const drug = selectedDrug || 'adalimumab';
  const payer = selectedPayer || 'UHC';
  return [
    `Which plans cover ${drug}?`,
    `What prior auth criteria does ${payer} require for ${drug}?`,
    `Is patient Sarah Anderson ready for ${drug} under ${payer}?`,
    `Compare ${drug} across issuers.`
  ];
}

export function AskView({ selectedDrug, selectedPayer, selectedPlanId }: AskViewProps) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState('');
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const starterPrompts = useMemo(() => buildStarterPrompts(selectedDrug, selectedPayer), [selectedDrug, selectedPayer]);

  useEffect(() => {
    void fetch(`/api/session/${sessionId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load session state');
        }
        return response.json();
      })
      .then((payload) => {
        setMessages(payload.messages.filter((message: any) => message.role !== 'tool'));
      })
      .catch(() => {
        // Fresh session, no prior messages
      });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, toolResults, isSending]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.name.endsWith('.json'));
    if (fileArray.length === 0) {
      setError('Only .json files are accepted (FHIR Bundles or Policy records).');
      return;
    }

    const filePayloads: Array<{ name: string; content: string }> = [];
    for (const file of fileArray) {
      const content = await file.text();
      filePayloads.push({ name: file.name, content });
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, files: filePayloads })
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      const newUploads: UploadedFile[] = (result.accepted || []).map((a: any) => ({
        name: a.name,
        type: a.type,
        summary: a.summary
      }));

      setUploadedFiles((current) => [...current, ...newUploads]);

      if (result.rejected?.length > 0) {
        setError(`Some files were rejected: ${result.rejected.map((r: any) => `${r.name} (${r.reason})`).join(', ')}`);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
    }
  }, []);

  async function sendMessage(rawContent: string) {
    const content = rawContent.trim();
    if (!content || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);
    setToolResults([]);

    const userMessage: UiMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content
    };
    const assistantId = crypto.randomUUID();

    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: 'assistant', content: '' }
    ]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          messages: [...messages, userMessage].map(({ role, content: body }) => ({ role, content: body })),
          context: {
            selectedDrug: selectedDrug || undefined,
            selectedIssuer: selectedPayer || undefined,
            selectedPlanId: selectedPlanId || undefined
          }
        })
      });

      if (!response.ok || !response.body) {
        throw new Error('Chat request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const applyAssistantDelta = (delta: string) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: `${message.content}${delta}` }
              : message
          )
        );
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
          const eventLine = chunk.split('\n').find((line) => line.startsWith('event:'));
          const dataLine = chunk.split('\n').find((line) => line.startsWith('data:'));
          if (!eventLine || !dataLine) {
            continue;
          }

          const event = eventLine.replace('event:', '').trim();
          const data = JSON.parse(dataLine.replace('data:', '').trim());

          if (event === 'message_delta') {
            applyAssistantDelta(data.delta);
          }

          if (event === 'message_done') {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantId ? { ...message, content: data.message } : message
              )
            );
          }

          if (event === 'tool_result') {
            setToolResults((current) => [...current, data]);
          }

          if (event === 'error') {
            throw new Error(data.message ?? 'Chat failed');
          }
        }
      }
    } catch (chatError) {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? { ...message, content: 'I could not complete that request.' }
            : message
        )
      );
      setError(chatError instanceof Error ? chatError.message : 'Chat failed');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="chat-view">
      <div className="chat-toolbar">
        <div>
          <p className="eyebrow">Ask PolicyPilot</p>
          <h3 className="chat-title">Natural-language policy intelligence</h3>
          <p className="chat-subtitle">Ask about coverage, PA criteria, patient readiness, cross-plan differences, or change watch.</p>
        </div>
        <button
          type="button"
          className="chat-upload-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.length) {
              void handleFiles(e.target.files);
              e.target.value = '';
            }
          }}
        />
      </div>

      <div
        className={`chat-upload-zone${isDragOver ? ' chat-upload-zone-active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files.length) {
            void handleFiles(e.dataTransfer.files);
          }
        }}
      >
        {uploadedFiles.length > 0 ? (
          <div className="chat-chip-row">
            {uploadedFiles.map((file, i) => (
              <span key={`${file.name}-${i}`} className={`chat-chip${file.type === 'patient' ? ' chat-chip-patient' : ''}`}>
                {file.type === 'patient' ? 'Patient' : 'Policy'}: {file.summary || file.name}
              </span>
            ))}
          </div>
        ) : (
          <>Drop FHIR patient bundles or policy JSON files here, or click Upload JSON above.</>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p className="chat-empty-title">Start with a real question</p>
            <div className="chat-starters">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="ask-chip"
                  onClick={() => {
                    setInput(prompt);
                    void sendMessage(prompt);
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message ${message.role === 'user' ? 'chat-message-user' : 'chat-message-assistant'}`}
          >
            <div className="chat-bubble">
              {message.content || (isSending && message.role === 'assistant' ? 'Thinking...' : '')}
            </div>
          </div>
        ))}

        {toolResults.length > 0 && (
          <div className="chat-tool-results">
            {toolResults.map((result, index) => (
              <details key={`${result.tool}-${index}`} className="chat-tool-card" open={index === toolResults.length - 1}>
                <summary>
                  <span>{result.summary.title}</span>
                  <span className="chat-tool-badge">{result.tool}</span>
                </summary>
                <div className="chat-tool-table-wrapper">
                  <table className="chat-tool-table">
                    <tbody>
                      {result.summary.items.map((item, i) => (
                        <tr key={`${item.slice(0, 30)}-${i}`}>
                          <td>{item}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>
        )}

        {error && <div className="chat-error">{error}</div>}
        <div ref={scrollRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          className="field-input chat-input"
          placeholder="Ask about coverage, plan criteria, patient readiness, or change watch..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void sendMessage(input);
            }
          }}
        />
        <button
          className="ask-submit"
          type="button"
          onClick={() => void sendMessage(input)}
          disabled={isSending}
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
