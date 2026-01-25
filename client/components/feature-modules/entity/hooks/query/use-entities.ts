import { useAuth } from '@/components/provider/auth-context';
import {
  AuthenticatedMultiQueryResult,
  AuthenticatedQueryResult,
} from '@/lib/interfaces/interface';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Entity } from '../../interface/entity.interface';
import { EntityService } from '../../service/entity.service';

export function useEntities(
  workspaceId?: string,
  typeId?: string,
): AuthenticatedQueryResult<Entity[]> {
  const { session, loading } = useAuth();
  const query = useQuery({
    queryKey: ['entities', workspaceId, typeId],
    queryFn: async () => {
      return await EntityService.getEntitiesForType(session, workspaceId!!, typeId!!); // Non-null assertion as query is disabled when params are missing
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!session && !!workspaceId && !!typeId && !loading,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });

  return {
    isLoadingAuth: loading,
    ...query,
  };
}

export function useEntitiesFromManyTypes(
  workspaceId: string,
  typeIds: string[],
): AuthenticatedMultiQueryResult<Entity[]> {
  const { session, loading } = useAuth();
  const query = useQueries({
    queries: typeIds.map((typeId) => ({
      queryKey: ['entities', workspaceId, typeId],
      queryFn: () => EntityService.getEntitiesForType(session, workspaceId, typeId),
      enabled: !!session && !!workspaceId,
    })),
    combine: (results) => {
      return {
        data: results.flatMap((r) => r.data ?? []),
        isLoading: results.some((r) => r.isLoading),
        isError: results.some((r) => r.isError),
      };
    },
  });

  return {
    ...query,
    isLoadingAuth: loading,
  };
}
