import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/provider/auth-context";
import type { AuthenticatedQueryResult } from "@/lib/interfaces/interface";
import type { WorkflowNodeConfigField } from "@/lib/types/models/WorkflowNodeConfigField";
import { WorkflowService } from "../../service/workflow.service";

/**
 * Fetches node configuration schemas from the backend
 * Schemas define what fields each node type requires for configuration
 *
 * Returns a map where keys are backend node type identifiers (e.g., "TRIGGER.ENTITY_EVENT")
 * and values are arrays of field definitions
 *
 * @example
 * const { data: schemas, isLoading } = useNodeConfigSchemas();
 * if (schemas) {
 *   const triggerFields = schemas["TRIGGER.ENTITY_EVENT"];
 * }
 */
export function useNodeConfigSchemas(): AuthenticatedQueryResult<
  Record<string, WorkflowNodeConfigField[]>
> {
  const { session, loading } = useAuth();

  const query = useQuery({
    queryKey: ["nodeConfigSchemas"],
    queryFn: async () => {
      return await WorkflowService.getNodeConfigSchemas(session);
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
