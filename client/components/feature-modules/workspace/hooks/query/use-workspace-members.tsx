import { useAuth } from '@/components/provider/auth-context';
import { AuthenticatedQueryResult } from '@/lib/interfaces/interface';
import { useQuery } from '@tanstack/react-query';
import type { WorkspaceMember } from '@/lib/types/workspace';
import { WorkspaceService } from '../../service/workspace.service';

export function useWorkspaceMembers(
  workspaceId?: string,
): AuthenticatedQueryResult<WorkspaceMember[]> {
  const { session, loading } = useAuth();
  const query = useQuery({
    queryKey: ['members', workspaceId],
    queryFn: async () => {
      return await WorkspaceService.getWorkspaceMembers(session, workspaceId!); // non-null assertion as enabled ensures workspaceId is defined
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!session && !!workspaceId && !loading,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });

  return {
    isLoadingAuth: loading,
    ...query,
  };
}
