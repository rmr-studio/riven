import { useAuth } from '@/components/provider/auth-context';
import { CreateBusinessDefinitionRequest, WorkspaceBusinessDefinition } from '@/lib/types/models';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { toast } from 'sonner';
import { DefinitionService } from '@/components/feature-modules/knowledge/service/definition.service';
import { definitionKeys } from '@/components/feature-modules/knowledge/hooks/query/definition-query-keys';

export function useCreateDefinitionMutation(
  workspaceId: string,
  options?: { onSuccess?: (definition: WorkspaceBusinessDefinition) => void },
) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const toastRef = useRef<string | number | undefined>(undefined);

  return useMutation({
    mutationFn: (request: CreateBusinessDefinitionRequest) =>
      DefinitionService.createDefinition(session, workspaceId, request),
    onMutate: () => {
      toastRef.current = toast.loading('Creating definition...');
    },
    onError: (error: Error) => {
      toast.dismiss(toastRef.current);
      toastRef.current = undefined;
      toast.error(`Failed to create definition: ${error.message}`);
    },
    onSuccess: (response) => {
      toast.dismiss(toastRef.current);
      toastRef.current = undefined;
      toast.success('Definition created');
      queryClient.invalidateQueries({
        queryKey: definitionKeys.definitions.base(workspaceId),
      });
      options?.onSuccess?.(response);
    },
  });
}
