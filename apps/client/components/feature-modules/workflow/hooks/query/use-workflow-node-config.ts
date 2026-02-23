import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/provider/auth-context';
import type { AuthenticatedQueryResult } from '@/lib/interfaces/interface';
import { WorkflowService } from '../../service/workflow.service';
import { WorkflowNodeMetadata } from '@/lib/types/workflow';

/**
 * Fetches node configuration schemas from the backend
 * Schemas define what fields each node type requires for configuration
 *
 * Returns a map where keys are backend node type identifiers (e.g., "TRIGGER.ENTITY_EVENT")
 * and values are arrays of field definitions
 *
 * @example
 * const { data: nodeConfigs, isLoading } = useWorkflowNodeConfigs();
 * if (nodeConfigs) {
 *   const triggerFields = nodeConfigs["TRIGGER.ENTITY_EVENT"];
 * }
 */
export function useWorkflowNodeConfigs(): AuthenticatedQueryResult<
  Record<string, WorkflowNodeMetadata>
> {
  const { session, loading } = useAuth();

  const query = useQuery({
    queryKey: ['node-config'],
    queryFn: async () => {
      return await WorkflowService.getWorkflowNodeDefinitions(session);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - schemas change rarely
    enabled: !!session && !loading,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    gcTime: 60 * 60 * 1000, // 1 hour garbage collection
  });

  return {
    isLoadingAuth: loading,
    ...query,
  };
}
