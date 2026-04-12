import { useAuth } from '@/components/provider/auth-context';
import { DevService } from '@/components/feature-modules/dev/service/dev.service';
import { TemplateInstallationResponse } from '@/lib/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ReinstallTemplateArgs {
  templateKey: string;
}

export function useReinstallTemplateMutation(workspaceId: string | undefined) {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<TemplateInstallationResponse, Error, ReinstallTemplateArgs>({
    mutationFn: async ({ templateKey }) => {
      if (!session) throw new Error('Not authenticated');
      if (!workspaceId) throw new Error('No workspace selected');
      if (!templateKey.trim()) throw new Error('Template key required');
      return DevService.reinstallTemplate(session, workspaceId, templateKey.trim());
    },
    onMutate: () => {
      toast.loading('Reinstalling template...', { id: 'dev-reinstall' });
    },
    onSuccess: (data) => {
      toast.dismiss('dev-reinstall');
      toast.success(
        `Reinstalled ${data.templateName}: ${data.entityTypesCreated} types, ${data.relationshipsCreated} relationships`,
      );
      if (workspaceId) {
        queryClient.invalidateQueries({ queryKey: ['entities', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['entityTypes', workspaceId] });
      }
    },
    onError: (error) => {
      toast.dismiss('dev-reinstall');
      toast.error(`Reinstall failed: ${error.message}`);
    },
  });
}
