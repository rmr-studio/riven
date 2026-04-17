import { useAuth } from '@/components/provider/auth-context';
import { InsightsChatService } from '@/components/feature-modules/knowledge-base/chat/service/insights-chat.service';
import { useAuthenticatedQuery } from '@/hooks/query/use-authenticated-query';
import { AuthenticatedQueryResult } from '@/lib/interfaces/interface';
import { InsightsMessageModel } from '@/lib/types';

export const insightsMessageKeys = {
  list: (workspaceId: string, sessionId: string) =>
    ['insights-messages', workspaceId, sessionId] as const,
};

export function useInsightsMessages(
  workspaceId: string,
  sessionId: string | null,
): AuthenticatedQueryResult<InsightsMessageModel[]> {
  const { session } = useAuth();
  return useAuthenticatedQuery({
    queryKey: insightsMessageKeys.list(workspaceId, sessionId ?? ''),
    queryFn: () =>
      InsightsChatService.getMessages(session, workspaceId, sessionId as string),
    staleTime: 5 * 60 * 1000,
    enabled: !!workspaceId && !!sessionId,
  });
}
