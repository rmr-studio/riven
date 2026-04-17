import { useAuth } from '@/components/provider/auth-context';
import { InsightsChatService } from '@/components/feature-modules/knowledge-base/chat/service/insights-chat.service';
import { useChatActions } from '@/components/feature-modules/knowledge-base/chat/context/insights-chat-provider';
import {
  CreateSessionRequest,
  InsightsChatSessionModel,
  InsightsMessageModel,
  SendMessageRequest,
} from '@/lib/types';
import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Exposes the bound deps needed by the chat store provider. The store owns the
 * transcript; these bound functions let it call the API without knowing about
 * sessions/tokens.
 */
export function useInsightsChatDeps(workspaceId: string) {
  const { session } = useAuth();

  const createSession = useCallback(
    (request: CreateSessionRequest): Promise<InsightsChatSessionModel> =>
      InsightsChatService.createSession(session, workspaceId, request),
    [session, workspaceId],
  );

  const sendMessage = useCallback(
    (sessionId: string, request: SendMessageRequest): Promise<InsightsMessageModel> =>
      InsightsChatService.sendMessage(session, workspaceId, sessionId, request),
    [session, workspaceId],
  );

  return { createSession, sendMessage };
}

/**
 * Thin wrapper that invokes the store's sendMessage action and surfaces toast
 * feedback. Transcript state lives in the store; this hook is the UI seam.
 */
export function useSendInsightsMessage() {
  const { sendMessage } = useChatActions();

  return useCallback(
    async (content: string) => {
      try {
        await sendMessage(content);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to send message';
        toast.error(message);
      }
    },
    [sendMessage],
  );
}
