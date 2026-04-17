import {
  ChatMessage,
  createInsightsChatStore,
  InsightsChatStoreDeps,
} from '@/components/feature-modules/knowledge-base/chat/stores/insights-chat.store';
import {
  InsightsChatSessionModel,
  InsightsMessageModel,
  InsightsMessageRole,
  SendMessageRequest,
} from '@/lib/types';

const WORKSPACE_ID = 'ws-1';

const buildSession = (
  overrides: Partial<InsightsChatSessionModel> = {},
): InsightsChatSessionModel => ({
  id: 'sess-1',
  workspaceId: WORKSPACE_ID,
  demoPoolSeeded: false,
  ...overrides,
});

const buildAssistantResponse = (
  overrides: Partial<InsightsMessageModel> = {},
): InsightsMessageModel => ({
  id: 'srv-msg-1',
  sessionId: 'sess-1',
  role: InsightsMessageRole.Assistant,
  content: 'Server reply',
  citations: [],
  ...overrides,
});

// Deferred promise helper so we can interleave state assertions.
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const buildDeps = (
  overrides: Partial<InsightsChatStoreDeps> = {},
): InsightsChatStoreDeps => {
  let counter = 0;
  return {
    createSession: jest.fn(async (): Promise<ReturnType<typeof buildSession>> =>
      buildSession(),
    ) as unknown as InsightsChatStoreDeps['createSession'],
    sendMessage: jest.fn(async (): Promise<ReturnType<typeof buildAssistantResponse>> =>
      buildAssistantResponse(),
    ) as unknown as InsightsChatStoreDeps['sendMessage'],
    generateId: () => `id-${++counter}`,
    now: () => new Date('2026-04-15T00:00:00.000Z'),
    ...overrides,
  };
};

describe('createInsightsChatStore', () => {
  describe('initial state', () => {
    it('exposes workspaceId and empty transcript', () => {
      const store = createInsightsChatStore(WORKSPACE_ID, buildDeps());
      const state = store.getState();
      expect(state.workspaceId).toBe(WORKSPACE_ID);
      expect(state.session).toBeNull();
      expect(state.messages).toEqual([]);
      expect(state.pendingAssistantClientId).toBeNull();
    });
  });

  describe('sendMessage', () => {
    it('appends user + pending assistant, then swaps assistant on success', async () => {
      const deps = buildDeps();
      const store = createInsightsChatStore(WORKSPACE_ID, deps);

      await store.getState().sendMessage('Hello');

      const { messages, session, pendingAssistantClientId } = store.getState();
      expect(session?.id).toBe('sess-1');
      expect(pendingAssistantClientId).toBeNull();
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe(InsightsMessageRole.User);
      expect(messages[0].content).toBe('Hello');
      expect(messages[1].role).toBe(InsightsMessageRole.Assistant);
      expect(messages[1].status).toBe('complete');
      expect(messages[1].serverId).toBe('srv-msg-1');
      expect(messages[1].content).toBe('Server reply');
    });

    it('trims whitespace and ignores empty submits', async () => {
      const deps = buildDeps();
      const store = createInsightsChatStore(WORKSPACE_ID, deps);

      await store.getState().sendMessage('   ');
      await store.getState().sendMessage('');

      expect(store.getState().messages).toHaveLength(0);
      expect(deps.createSession).not.toHaveBeenCalled();
      expect(deps.sendMessage).not.toHaveBeenCalled();
    });

    it('reuses the session for subsequent sends', async () => {
      const deps = buildDeps();
      const store = createInsightsChatStore(WORKSPACE_ID, deps);

      await store.getState().sendMessage('first');
      await store.getState().sendMessage('second');

      expect(deps.createSession).toHaveBeenCalledTimes(1);
      expect(deps.sendMessage).toHaveBeenCalledTimes(2);
      expect(store.getState().messages).toHaveLength(4);
    });

    it('flags pending assistant message while in-flight', async () => {
      const gate = deferred<InsightsMessageModel>();
      const deps = buildDeps({
        sendMessage: jest.fn(async () => gate.promise),
      });
      const store = createInsightsChatStore(WORKSPACE_ID, deps);

      const sendPromise = store.getState().sendMessage('Hi');

      // Microtask so the user + pending assistant are appended.
      await Promise.resolve();
      await Promise.resolve();

      const pendingState = store.getState();
      expect(pendingState.messages).toHaveLength(2);
      expect(pendingState.messages[1].status).toBe('pending');
      expect(pendingState.pendingAssistantClientId).toBe(
        pendingState.messages[1].clientId,
      );

      gate.resolve(buildAssistantResponse());
      await sendPromise;

      expect(store.getState().messages[1].status).toBe('complete');
    });

    it('ignores concurrent sends while one is pending', async () => {
      const gate = deferred<InsightsMessageModel>();
      const deps = buildDeps({
        sendMessage: jest.fn(async () => gate.promise),
      });
      const store = createInsightsChatStore(WORKSPACE_ID, deps);

      const first = store.getState().sendMessage('first');
      // Flush microtasks so ensureSession + stamping + sendMessage are reached.
      for (let i = 0; i < 5; i++) await Promise.resolve();

      await store.getState().sendMessage('second');

      expect(store.getState().messages).toHaveLength(2); // second was dropped
      expect(deps.sendMessage).toHaveBeenCalledTimes(1);

      gate.resolve(buildAssistantResponse());
      await first;
    });

    it('marks the assistant message errored on failure', async () => {
      const deps = buildDeps({
        sendMessage: jest.fn(async () => {
          throw Object.assign(new Error('boom'), {
            status: 500,
            error: 'SERVER_ERROR',
            message: 'boom',
          });
        }),
      });
      const store = createInsightsChatStore(WORKSPACE_ID, deps);

      await expect(store.getState().sendMessage('Hi')).rejects.toThrow('boom');

      const [, assistant] = store.getState().messages;
      expect(assistant.status).toBe('error');
      expect(assistant.error).toEqual({ code: 'SERVER_ERROR', message: 'boom' });
      expect(store.getState().pendingAssistantClientId).toBeNull();
    });

    it('stamps sessionId on the user message once resolved', async () => {
      const deps = buildDeps();
      const store = createInsightsChatStore(WORKSPACE_ID, deps);

      await store.getState().sendMessage('Hi');

      const user = store.getState().messages[0];
      expect(user.sessionId).toBe('sess-1');
    });
  });

  describe('retryMessage', () => {
    const buildErroredStore = async () => {
      const sendMessage = jest
        .fn<Promise<InsightsMessageModel>, [string, SendMessageRequest]>()
        .mockRejectedValueOnce(
          Object.assign(new Error('fail'), {
            status: 500,
            error: 'SERVER_ERROR',
            message: 'fail',
          }),
        )
        .mockResolvedValue(buildAssistantResponse({ content: 'Recovered' }));
      const deps = buildDeps({ sendMessage });
      const store = createInsightsChatStore(WORKSPACE_ID, deps);

      await expect(store.getState().sendMessage('Original question')).rejects.toThrow();

      return { store, deps, sendMessage };
    };

    it('retries a failed assistant message with the original user content', async () => {
      const { store, sendMessage } = await buildErroredStore();
      const failed = store.getState().messages[1];

      await store.getState().retryMessage(failed.clientId);

      expect(sendMessage).toHaveBeenCalledTimes(2);
      expect(sendMessage.mock.calls[1][1]).toEqual({ message: 'Original question' });

      const assistant = store.getState().messages[1];
      expect(assistant.status).toBe('complete');
      expect(assistant.content).toBe('Recovered');
      expect(assistant.error).toBeUndefined();
    });

    it('no-ops when clientId does not match a message', async () => {
      const deps = buildDeps();
      const store = createInsightsChatStore(WORKSPACE_ID, deps);

      await store.getState().retryMessage('does-not-exist');
      expect(deps.sendMessage).not.toHaveBeenCalled();
    });

    it('no-ops when the target message is not in error status', async () => {
      const deps = buildDeps();
      const store = createInsightsChatStore(WORKSPACE_ID, deps);

      await store.getState().sendMessage('Hi');
      const assistant = store.getState().messages[1];
      expect(assistant.status).toBe('complete');

      const initialCalls = (deps.sendMessage as jest.Mock).mock.calls.length;
      await store.getState().retryMessage(assistant.clientId);
      expect((deps.sendMessage as jest.Mock).mock.calls.length).toBe(initialCalls);
    });

    it('no-ops when another send is pending', async () => {
      const gate = deferred<InsightsMessageModel>();
      const deps = buildDeps({ sendMessage: jest.fn(async () => gate.promise) });
      const store = createInsightsChatStore(WORKSPACE_ID, deps);

      const first = store.getState().sendMessage('Hi');
      await Promise.resolve();
      const pendingId = store.getState().messages[1].clientId;

      await store.getState().retryMessage(pendingId);
      expect(deps.sendMessage).toHaveBeenCalledTimes(1);

      gate.resolve(buildAssistantResponse());
      await first;
    });
  });

  describe('hydrate', () => {
    it('replaces session and messages with server-provided data', () => {
      const store = createInsightsChatStore(WORKSPACE_ID, buildDeps());
      const session = buildSession({ id: 'sess-42' });

      store.getState().hydrate(session, [
        buildAssistantResponse({
          id: 'm-1',
          sessionId: 'sess-42',
          role: InsightsMessageRole.User,
          content: 'prior user',
          citations: [],
        }),
        buildAssistantResponse({
          id: 'm-2',
          sessionId: 'sess-42',
          content: 'prior assistant',
          citations: [{ entityId: 'e-1', entityType: 'Customer', label: 'Acme' }],
        }),
      ]);

      const state = store.getState();
      expect(state.session?.id).toBe('sess-42');
      expect(state.messages).toHaveLength(2);
      expect(state.messages[0].content).toBe('prior user');
      expect(state.messages[1].citations[0].entityId).toBe('e-1');
      expect(state.pendingAssistantClientId).toBeNull();
    });

    it('drops any pending indicator', async () => {
      const gate = deferred<InsightsMessageModel>();
      const deps = buildDeps({ sendMessage: jest.fn(async () => gate.promise) });
      const store = createInsightsChatStore(WORKSPACE_ID, deps);

      const pending = store.getState().sendMessage('Hi');
      await Promise.resolve();
      await Promise.resolve();
      expect(store.getState().pendingAssistantClientId).not.toBeNull();

      store.getState().hydrate(buildSession({ id: 'other' }), []);
      expect(store.getState().pendingAssistantClientId).toBeNull();
      expect(store.getState().session?.id).toBe('other');

      gate.resolve(buildAssistantResponse());
      await pending;
    });
  });

  describe('resetSession', () => {
    it('clears session and messages', async () => {
      const deps = buildDeps();
      const store = createInsightsChatStore(WORKSPACE_ID, deps);

      await store.getState().sendMessage('Hi');
      expect(store.getState().messages).toHaveLength(2);

      store.getState().resetSession();
      const state = store.getState();
      expect(state.session).toBeNull();
      expect(state.messages).toEqual([]);
      expect(state.pendingAssistantClientId).toBeNull();
    });

    it('drops an in-flight response if reset happens mid-pending', async () => {
      const gate = deferred<InsightsMessageModel>();
      const deps = buildDeps({ sendMessage: jest.fn(async () => gate.promise) });
      const store = createInsightsChatStore(WORKSPACE_ID, deps);

      const sendPromise = store.getState().sendMessage('Hi');
      await Promise.resolve();
      await Promise.resolve();

      store.getState().resetSession();
      gate.resolve(buildAssistantResponse());
      await sendPromise;

      expect(store.getState().messages).toEqual([]);
      expect(store.getState().pendingAssistantClientId).toBeNull();
    });
  });

  describe('chained scenarios', () => {
    it('send → fail → retry → success produces a truthful transcript', async () => {
      const sendMessage = jest
        .fn<Promise<InsightsMessageModel>, [string, SendMessageRequest]>()
        .mockRejectedValueOnce(
          Object.assign(new Error('fail'), {
            status: 500,
            error: 'X',
            message: 'fail',
          }),
        )
        .mockResolvedValue(buildAssistantResponse({ content: 'OK' }));
      const deps = buildDeps({ sendMessage });
      const store = createInsightsChatStore(WORKSPACE_ID, deps);

      await expect(store.getState().sendMessage('Q')).rejects.toThrow();
      const failedId = store.getState().messages[1].clientId;

      await store.getState().retryMessage(failedId);

      const messages: ChatMessage[] = store.getState().messages;
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe(InsightsMessageRole.User);
      expect(messages[0].content).toBe('Q');
      expect(messages[1].status).toBe('complete');
      expect(messages[1].content).toBe('OK');
    });
  });
});
