import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/components/provider/auth-context';
import { IntegrationService } from '@/components/feature-modules/integrations/service/integration.service';
import { integrationKeys } from '@/components/feature-modules/integrations/hooks/query/integration-query-keys';

export function useDisableIntegration(workspaceId: string) {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (integrationDefinitionId: string) =>
      IntegrationService.disableIntegration(session, workspaceId, integrationDefinitionId),
    onMutate: () => {
      toast.loading('Disconnecting integration...');
    },
    onSuccess: (data) => {
      toast.dismiss();
      toast.success(
        `${data.integrationName} disconnected. ${data.entityTypesSoftDeleted} entity types removed.`,
      );
      queryClient.invalidateQueries({
        queryKey: integrationKeys.connections.byWorkspace(workspaceId),
      });
    },
    onError: (error) => {
      toast.dismiss();
      toast.error(error.message || 'Failed to disconnect integration');
    },
  });
}
