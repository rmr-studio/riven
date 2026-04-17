import { useAuth } from '@/components/provider/auth-context';
import { InsightsChatService } from '@/components/feature-modules/knowledge-base/chat/service/insights-chat.service';
import { insightsSessionKeys } from '@/components/feature-modules/knowledge-base/chat/hooks/query/use-insights-sessions';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useDeleteInsightsSession(workspaceId: string) {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (sessionId) =>
      InsightsChatService.deleteSession(session, workspaceId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: insightsSessionKeys.all(workspaceId) });
      toast.success('Conversation deleted');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete conversation');
    },
  });
}
