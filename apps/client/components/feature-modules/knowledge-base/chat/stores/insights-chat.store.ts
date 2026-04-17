import {
  CitationRef,
  CreateSessionRequest,
  InsightsChatSessionModel,
  InsightsMessageModel,
  InsightsMessageRole,
  SendMessageRequest,
  TokenUsage,
} from '@/lib/types';
import { v4 as uuid } from 'uuid';
import { createStore, StoreApi } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type ChatMessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

export interface ChatMessageError {
  code: string;
  message: string;
}

export interface ChatMessage {
  clientId: string;
  serverId?: string;
  sessionId?: string;
  role: InsightsMessageRole;
  content: string;
  citations: CitationRef[];
  tokenUsage?: TokenUsage | null;
  createdAt?: Date | null;
  status: ChatMessageStatus;
  error?: ChatMessageError;
}

export interface InsightsChatStoreDeps {
  createSession: (request: CreateSessionRequest) => Promise<InsightsChatSessionModel>;
  sendMessage: (
    sessionId: string,
    request: SendMessageRequest,
  ) => Promise<InsightsMessageModel>;
  generateId?: () => string;
  now?: () => Date;
}

interface InsightsChatState {
  workspaceId: string;
  session: InsightsChatSessionModel | null;
  messages: ChatMessage[];
  pendingAssistantClientId: string | null;
}

interface InsightsChatActions {
  sendMessage: (content: string) => Promise<void>;
  retryMessage: (clientId: string) => Promise<void>;
  resetSession: () => void;
  hydrate: (
    session: InsightsChatSessionModel,
    messages: InsightsMessageModel[],
  ) => void;
}

export type InsightsChatStore = InsightsChatState & InsightsChatActions;
export type InsightsChatStoreApi = StoreApi<InsightsChatStore>;

const messageFromServer = (
  server: InsightsMessageModel,
  clientId: string,
  status: ChatMessageStatus = 'complete',
): ChatMessage => ({
  clientId,
  serverId: server.id,
  sessionId: server.sessionId,
  role: server.role,
  content: server.content,
  citations: server.citations ?? [],
  tokenUsage: server.tokenUsage,
  createdAt: server.createdAt,
  status,
});

const toErrorPayload = (error: unknown): ChatMessageError => {
  if (typeof error === 'object' && error !== null) {
    const e = error as { error?: unknown; message?: unknown };
    return {
      code: typeof e.error === 'string' ? e.error : 'UNKNOWN_ERROR',
      message: typeof e.message === 'string' ? e.message : 'An unexpected error occurred',
    };
  }
  return { code: 'UNKNOWN_ERROR', message: String(error) };
};

export const createInsightsChatStore = (
  workspaceId: string,
  deps: InsightsChatStoreDeps,
): InsightsChatStoreApi => {
  const generateId = deps.generateId ?? uuid;
  const now = deps.now ?? (() => new Date());

  return createStore<InsightsChatStore>()(
    subscribeWithSelector((set, get) => {
      const ensureSession = async (): Promise<InsightsChatSessionModel> => {
        const current = get().session;
        if (current) return current;
        const created = await deps.createSession({});
        set({ session: created });
        return created;
      };

      const dispatchSend = async (
        userMessage: ChatMessage,
        assistantClientId: string,
      ): Promise<void> => {
        try {
          const session = await ensureSession();

          // Stamp user message with the sessionId once we have one.
          set((state) => ({
            messages: state.messages.map((m) =>
              m.clientId === userMessage.clientId
                ? { ...m, sessionId: session.id }
                : m,
            ),
          }));

          const response = await deps.sendMessage(session.id, {
            message: userMessage.content,
          });

          set((state) => {
            // Swap the pending assistant for the real one.
            // If the pending id was already cleared (e.g. reset), drop the update.
            if (state.pendingAssistantClientId !== assistantClientId) {
              return state;
            }
            const messages = state.messages.map((m) =>
              m.clientId === assistantClientId
                ? messageFromServer(response, assistantClientId, 'complete')
                : m,
            );
            return { messages, pendingAssistantClientId: null };
          });
        } catch (error) {
          const payload = toErrorPayload(error);
          set((state) => {
            if (state.pendingAssistantClientId !== assistantClientId) {
              return state;
            }
            const messages = state.messages.map((m) =>
              m.clientId === assistantClientId
                ? { ...m, status: 'error' as const, error: payload }
                : m,
            );
            return { messages, pendingAssistantClientId: null };
          });
          throw error;
        }
      };

      return {
        workspaceId,
        session: null,
        messages: [],
        pendingAssistantClientId: null,

        sendMessage: async (content: string) => {
          const trimmed = content.trim();
          if (!trimmed) return;
          if (get().pendingAssistantClientId) return;

          const userMessage: ChatMessage = {
            clientId: generateId(),
            role: InsightsMessageRole.User,
            content: trimmed,
            citations: [],
            createdAt: now(),
            status: 'complete',
          };

          const assistantClientId = generateId();
          const assistantPending: ChatMessage = {
            clientId: assistantClientId,
            role: InsightsMessageRole.Assistant,
            content: '',
            citations: [],
            createdAt: now(),
            status: 'pending',
          };

          set((state) => ({
            messages: [...state.messages, userMessage, assistantPending],
            pendingAssistantClientId: assistantClientId,
          }));

          await dispatchSend(userMessage, assistantClientId);
        },

        retryMessage: async (clientId: string) => {
          const state = get();
          if (state.pendingAssistantClientId) return;

          const index = state.messages.findIndex((m) => m.clientId === clientId);
          if (index === -1) return;
          const failed = state.messages[index];
          if (failed.role !== InsightsMessageRole.Assistant) return;
          if (failed.status !== 'error') return;

          const userMessage = [...state.messages.slice(0, index)]
            .reverse()
            .find((m) => m.role === InsightsMessageRole.User);
          if (!userMessage) return;

          set((s) => ({
            messages: s.messages.map((m) =>
              m.clientId === clientId
                ? { ...m, status: 'pending' as const, error: undefined, content: '' }
                : m,
            ),
            pendingAssistantClientId: clientId,
          }));

          await dispatchSend(userMessage, clientId);
        },

        resetSession: () => {
          set({ session: null, messages: [], pendingAssistantClientId: null });
        },

        hydrate: (
          session: InsightsChatSessionModel,
          serverMessages: InsightsMessageModel[],
        ) => {
          const messages: ChatMessage[] = serverMessages.map((m) =>
            messageFromServer(m, generateId(), 'complete'),
          );
          set({ session, messages, pendingAssistantClientId: null });
        },
      };
    }),
  );
};
