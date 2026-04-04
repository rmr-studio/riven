import { useAuth } from '@/components/provider/auth-context';
import { UpdateBusinessDefinitionRequest, WorkspaceBusinessDefinition } from '@/lib/types/models';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { toast } from 'sonner';
import { DefinitionService } from '@/components/feature-modules/knowledge/service/definition.service';
import { definitionKeys } from '@/components/feature-modules/knowledge/hooks/query/definition-query-keys';

export function useUpdateDefinitionMutation(
  workspaceId: string,
  definitionId: string,
  options?: { onSuccess?: (definition: WorkspaceBusinessDefinition) => void },
) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const toastRef = useRef<string | number | undefined>(undefined);

  return useMutation({
    mutationFn: (request: UpdateBusinessDefinitionRequest) =>
      DefinitionService.updateDefinition(session, workspaceId, definitionId, request),
    onMutate: () => {
      toastRef.current = toast.loading('Updating definition...');
    },
    onError: (error: Error) => {
      toast.dismiss(toastRef.current);
      toastRef.current = undefined;
      toast.error(`Failed to update definition: ${error.message}`);
    },
    onSuccess: (response) => {
      toast.dismiss(toastRef.current);
      toastRef.current = undefined;
      toast.success('Definition updated');
      queryClient.invalidateQueries({
        queryKey: definitionKeys.definitions.base(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: definitionKeys.definition.detail(workspaceId, definitionId),
      });
      options?.onSuccess?.(response);
    },
  });
}
