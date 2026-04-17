import { InsightsChatService } from '@/components/feature-modules/knowledge-base/chat/service/insights-chat.service';
import { Session } from '@/lib/auth';
import { InsightsMessageRole } from '@/lib/types';

jest.mock('@/lib/api/insights-api', () => ({
  createInsightsApi: jest.fn(),
}));

jest.mock('@/lib/util/service/service.util', () => ({
  validateSession: jest.fn(),
  validateUuid: jest.fn(),
}));

jest.mock('@/lib/util/error/error.util', () => ({
  normalizeApiError: jest.fn(),
}));

import { createInsightsApi } from '@/lib/api/insights-api';
import { normalizeApiError } from '@/lib/util/error/error.util';
import { validateSession, validateUuid } from '@/lib/util/service/service.util';

const mockSession: Session = {
  access_token: 'token',
  expires_at: 9999999999,
  user: { id: 'u-1', email: 't@t.com', metadata: {} },
};

const mockApi = {
  createSession: jest.fn(),
  sendMessage: jest.fn(),
  listSessions: jest.fn(),
  getMessages: jest.fn(),
  deleteSession: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (createInsightsApi as jest.Mock).mockReturnValue(mockApi);
});

const workspaceId = '123e4567-e89b-12d3-a456-426614174000';
const sessionId = '223e4567-e89b-12d3-a456-426614174001';

describe('InsightsChatService.createSession', () => {
  it('validates session and workspace id', async () => {
    mockApi.createSession.mockResolvedValue({
      id: sessionId,
      workspaceId,
      demoPoolSeeded: false,
    });
    await InsightsChatService.createSession(mockSession, workspaceId);
    expect(validateSession).toHaveBeenCalledWith(mockSession);
    expect(validateUuid).toHaveBeenCalledWith(workspaceId);
  });

  it('passes title in body when provided', async () => {
    mockApi.createSession.mockResolvedValue({
      id: sessionId,
      workspaceId,
      demoPoolSeeded: false,
    });
    await InsightsChatService.createSession(mockSession, workspaceId, {
      title: 'Q4 review',
    });
    expect(mockApi.createSession).toHaveBeenCalledWith({
      workspaceId,
      createSessionRequest: { title: 'Q4 review' },
    });
  });

  it('normalizes errors', async () => {
    const err = new Error('boom');
    mockApi.createSession.mockRejectedValue(err);
    (normalizeApiError as jest.Mock).mockRejectedValue(err);
    await expect(
      InsightsChatService.createSession(mockSession, workspaceId),
    ).rejects.toThrow('boom');
    expect(normalizeApiError).toHaveBeenCalledWith(err);
  });
});

describe('InsightsChatService.sendMessage', () => {
  const validResponse = {
    id: 'msg-1',
    sessionId,
    role: InsightsMessageRole.Assistant,
    content: 'Hello',
    citations: [],
  };

  it('validates session, workspace, and session id', async () => {
    mockApi.sendMessage.mockResolvedValue(validResponse);
    await InsightsChatService.sendMessage(mockSession, workspaceId, sessionId, {
      message: 'hi',
    });
    expect(validateSession).toHaveBeenCalledWith(mockSession);
    expect(validateUuid).toHaveBeenCalledWith(workspaceId);
    expect(validateUuid).toHaveBeenCalledWith(sessionId);
  });

  it('passes message body to API', async () => {
    mockApi.sendMessage.mockResolvedValue(validResponse);
    await InsightsChatService.sendMessage(mockSession, workspaceId, sessionId, {
      message: 'hi',
    });
    expect(mockApi.sendMessage).toHaveBeenCalledWith({
      workspaceId,
      sessionId,
      sendMessageRequest: { message: 'hi' },
    });
  });

  it('throws when backend response fails schema validation', async () => {
    mockApi.sendMessage.mockResolvedValue({ id: 'msg-1' }); // missing required fields
    (normalizeApiError as jest.Mock).mockImplementation(async (e: unknown) => {
      throw e;
    });
    await expect(
      InsightsChatService.sendMessage(mockSession, workspaceId, sessionId, {
        message: 'hi',
      }),
    ).rejects.toThrow();
  });

  it('normalizes API errors', async () => {
    const err = new Error('network');
    mockApi.sendMessage.mockRejectedValue(err);
    (normalizeApiError as jest.Mock).mockRejectedValue(err);
    await expect(
      InsightsChatService.sendMessage(mockSession, workspaceId, sessionId, {
        message: 'hi',
      }),
    ).rejects.toThrow('network');
    expect(normalizeApiError).toHaveBeenCalledWith(err);
  });
});

describe('InsightsChatService.listSessions', () => {
  it('validates session and workspace, forwards pageable', async () => {
    mockApi.listSessions.mockResolvedValue({ content: [], empty: true });
    await InsightsChatService.listSessions(mockSession, workspaceId, { page: 0, size: 20 });
    expect(validateSession).toHaveBeenCalledWith(mockSession);
    expect(validateUuid).toHaveBeenCalledWith(workspaceId);
    expect(mockApi.listSessions).toHaveBeenCalledWith({
      workspaceId,
      pageable: { page: 0, size: 20 },
    });
  });

  it('normalizes errors', async () => {
    const err = new Error('boom');
    mockApi.listSessions.mockRejectedValue(err);
    (normalizeApiError as jest.Mock).mockRejectedValue(err);
    await expect(
      InsightsChatService.listSessions(mockSession, workspaceId),
    ).rejects.toThrow('boom');
  });
});

describe('InsightsChatService.getMessages', () => {
  const validMessage = {
    id: 'msg-1',
    sessionId,
    role: InsightsMessageRole.Assistant,
    content: 'Hello',
    citations: [],
  };

  it('validates ids and maps responses through the schema', async () => {
    mockApi.getMessages.mockResolvedValue([validMessage]);
    const out = await InsightsChatService.getMessages(mockSession, workspaceId, sessionId);
    expect(validateUuid).toHaveBeenCalledWith(sessionId);
    expect(out).toHaveLength(1);
    expect(out[0].content).toBe('Hello');
  });

  it('throws when any message fails schema validation', async () => {
    mockApi.getMessages.mockResolvedValue([validMessage, { id: 'bad' }]);
    (normalizeApiError as jest.Mock).mockImplementation(async (e: unknown) => {
      throw e;
    });
    await expect(
      InsightsChatService.getMessages(mockSession, workspaceId, sessionId),
    ).rejects.toThrow();
  });
});

describe('InsightsChatService.deleteSession', () => {
  it('validates ids and calls deleteSession', async () => {
    mockApi.deleteSession.mockResolvedValue(undefined);
    await InsightsChatService.deleteSession(mockSession, workspaceId, sessionId);
    expect(validateUuid).toHaveBeenCalledWith(workspaceId);
    expect(validateUuid).toHaveBeenCalledWith(sessionId);
    expect(mockApi.deleteSession).toHaveBeenCalledWith({ workspaceId, sessionId });
  });

  it('normalizes errors', async () => {
    const err = new Error('denied');
    mockApi.deleteSession.mockRejectedValue(err);
    (normalizeApiError as jest.Mock).mockRejectedValue(err);
    await expect(
      InsightsChatService.deleteSession(mockSession, workspaceId, sessionId),
    ).rejects.toThrow('denied');
  });
});
