import { useAuth } from '@/components/provider/auth-context';
import { InsightsChatService } from '@/components/feature-modules/knowledge-base/chat/service/insights-chat.service';
import { useAuthenticatedQuery } from '@/hooks/query/use-authenticated-query';
import { AuthenticatedQueryResult } from '@/lib/interfaces/interface';
import { PageInsightsChatSessionModel } from '@/lib/types';

export const insightsSessionKeys = {
  all: (workspaceId: string) => ['insights-sessions', workspaceId] as const,
};

export function useInsightsSessions(
  workspaceId: string,
): AuthenticatedQueryResult<PageInsightsChatSessionModel> {
  const { session } = useAuth();
  return useAuthenticatedQuery({
    queryKey: insightsSessionKeys.all(workspaceId),
    queryFn: () =>
      InsightsChatService.listSessions(session, workspaceId, { page: 0, size: 50 }),
    staleTime: 5 * 60 * 1000,
    enabled: !!workspaceId,
  });
}
