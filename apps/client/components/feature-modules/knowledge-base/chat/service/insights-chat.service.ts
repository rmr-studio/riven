import { createInsightsApi } from '@/lib/api/insights-api';
import { Session } from '@/lib/auth';
import {
  CreateSessionRequest,
  InsightsChatSessionModel,
  InsightsMessageModel,
  PageInsightsChatSessionModel,
  Pageable,
  SendMessageRequest,
} from '@/lib/types';
import { normalizeApiError } from '@/lib/util/error/error.util';
import { validateSession, validateUuid } from '@/lib/util/service/service.util';
import { InsightsMessageSchema } from '@/components/feature-modules/knowledge-base/chat/schema/insights-message.schema';

export class InsightsChatService {
  static async createSession(
    session: Session | null,
    workspaceId: string,
    request: CreateSessionRequest = {},
  ): Promise<InsightsChatSessionModel> {
    validateSession(session);
    validateUuid(workspaceId);
    const api = createInsightsApi(session);

    try {
      return await api.createSession({
        workspaceId,
        createSessionRequest: request,
      });
    } catch (error) {
      return await normalizeApiError(error);
    }
  }

  static async sendMessage(
    session: Session | null,
    workspaceId: string,
    sessionId: string,
    request: SendMessageRequest,
  ): Promise<InsightsMessageModel> {
    validateSession(session);
    validateUuid(workspaceId);
    validateUuid(sessionId);
    const api = createInsightsApi(session);

    try {
      const raw = await api.sendMessage({
        workspaceId,
        sessionId,
        sendMessageRequest: request,
      });
      return InsightsMessageSchema.parse(raw) as InsightsMessageModel;
    } catch (error) {
      return await normalizeApiError(error);
    }
  }

  static async listSessions(
    session: Session | null,
    workspaceId: string,
    pageable: Pageable = {},
  ): Promise<PageInsightsChatSessionModel> {
    validateSession(session);
    validateUuid(workspaceId);
    const api = createInsightsApi(session);

    try {
      return await api.listSessions({ workspaceId, pageable });
    } catch (error) {
      return await normalizeApiError(error);
    }
  }

  static async getMessages(
    session: Session | null,
    workspaceId: string,
    sessionId: string,
  ): Promise<InsightsMessageModel[]> {
    validateSession(session);
    validateUuid(workspaceId);
    validateUuid(sessionId);
    const api = createInsightsApi(session);

    try {
      const raw = await api.getMessages({ workspaceId, sessionId });
      return raw.map((m) => InsightsMessageSchema.parse(m) as InsightsMessageModel);
    } catch (error) {
      return await normalizeApiError(error);
    }
  }

  static async deleteSession(
    session: Session | null,
    workspaceId: string,
    sessionId: string,
  ): Promise<void> {
    validateSession(session);
    validateUuid(workspaceId);
    validateUuid(sessionId);
    const api = createInsightsApi(session);

    try {
      await api.deleteSession({ workspaceId, sessionId });
    } catch (error) {
      await normalizeApiError(error);
    }
  }
}
