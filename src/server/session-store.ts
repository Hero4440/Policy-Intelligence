import { PolicyRecordSchema } from '../../data/schemas/policy.schema.ts';

export type ChatRole = 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface UploadedPatient {
  id: string;
  fileName: string;
  bundle: any;
  summary: string;
  uploadedAt: string;
}

export interface UploadedPolicy {
  id: string;
  fileName: string;
  policy: any;
  summary: string;
  uploadedAt: string;
}

export interface SessionState {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  uploadedPatient?: UploadedPatient;
  uploadedPolicies: UploadedPolicy[];
}

const sessions = new Map<string, SessionState>();

function nowIso(): string {
  return new Date().toISOString();
}

function createSession(sessionId: string): SessionState {
  const timestamp = nowIso();
  return {
    id: sessionId,
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: [],
    uploadedPolicies: []
  };
}

export function getOrCreateSession(sessionId: string): SessionState {
  const existing = sessions.get(sessionId);
  if (existing) {
    return existing;
  }

  const created = createSession(sessionId);
  sessions.set(sessionId, created);
  return created;
}

export function getSession(sessionId: string): SessionState | undefined {
  return sessions.get(sessionId);
}

export function appendSessionMessage(
  sessionId: string,
  message: Omit<ChatMessage, 'createdAt'>
): ChatMessage {
  const session = getOrCreateSession(sessionId);
  const stored: ChatMessage = {
    ...message,
    createdAt: nowIso()
  };

  session.messages.push(stored);
  session.updatedAt = stored.createdAt;
  return stored;
}

export function setUploadedPatient(
  sessionId: string,
  patient: Omit<UploadedPatient, 'uploadedAt'>
): UploadedPatient {
  const session = getOrCreateSession(sessionId);
  const stored: UploadedPatient = {
    ...patient,
    uploadedAt: nowIso()
  };

  session.uploadedPatient = stored;
  session.updatedAt = stored.uploadedAt;
  return stored;
}

export function addUploadedPolicy(
  sessionId: string,
  policy: Omit<UploadedPolicy, 'uploadedAt'>
): UploadedPolicy {
  const session = getOrCreateSession(sessionId);
  const stored: UploadedPolicy = {
    ...policy,
    uploadedAt: nowIso()
  };

  session.uploadedPolicies.push(stored);
  session.updatedAt = stored.uploadedAt;
  return stored;
}

export function replaceSessionMessages(sessionId: string, messages: ChatMessage[]) {
  const session = getOrCreateSession(sessionId);
  session.messages = messages;
  session.updatedAt = nowIso();
}

export function listSessionPolicies(sessionId: string): any[] {
  const session = getOrCreateSession(sessionId);
  return session.uploadedPolicies
    .map((entry) => {
      const parsed = PolicyRecordSchema.safeParse(entry.policy);
      return parsed.success ? parsed.data : null;
    })
    .filter((policy): policy is NonNullable<typeof policy> => policy !== null);
}

export function serializeSession(session: SessionState) {
  return {
    id: session.id,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    messageCount: session.messages.length,
    uploadedPatient: session.uploadedPatient
      ? {
          id: session.uploadedPatient.id,
          fileName: session.uploadedPatient.fileName,
          summary: session.uploadedPatient.summary,
          uploadedAt: session.uploadedPatient.uploadedAt
        }
      : null,
    uploadedPolicies: session.uploadedPolicies.map((policy) => ({
      id: policy.id,
      fileName: policy.fileName,
      summary: policy.summary,
      uploadedAt: policy.uploadedAt
    }))
  };
}
