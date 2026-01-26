import { useAuth } from '@/components/provider/auth-context';
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { toast } from 'sonner';
import { EntityType } from '../../../interface/entity.interface';
import { EntityTypeService } from '../../../service/entity-type.service';

export function useSaveEntityTypeConfiguration(
  workspaceId: string,
  options?: UseMutationOptions<EntityType, Error, EntityType>,
) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const submissionToastRef = useRef<string | number | undefined>(undefined);

  return useMutation({
    mutationFn: (type: EntityType) =>
      EntityTypeService.saveEntityTypeConfiguration(session, workspaceId, type),
    onMutate: (data) => {
      options?.onMutate?.(data);
      submissionToastRef.current = toast.loading('Updating entity type...');
    },
    onError: (error: Error, variables: EntityType, context: unknown) => {
      options?.onError?.(error, variables, context);
      toast.dismiss(submissionToastRef.current);
      submissionToastRef.current = undefined;
      toast.error(`Failed to update entity type: ${error.message}`);
    },
    onSuccess: (response: EntityType, variables: EntityType, context: unknown) => {
      options?.onSuccess?.(response, variables, context);
      toast.dismiss(submissionToastRef.current);
      toast.success(`Entity type updated successfully!`);

      // Update cache for all entity types that were updated

      // Update individual entity type query cache
      queryClient.setQueryData(['entityType', response.key, workspaceId], response);

      // Update the entity types list in cache
      queryClient.setQueryData<EntityType[]>(['entityTypes', workspaceId], (oldData) => {
        if (!oldData) return [response];

        // Replace all updated entity types in the list
        return oldData.map((et) => (et.key === response.key ? response : et));
      });

      // Stay on the same page after update
      return response;
    },
  });
}
