import { useAuth } from '@/components/provider/auth-context';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { BlockService, HydrateBlocksResponse } from '../service/block.service';

/**
 * Hook to hydrate (resolve entity references for) multiple blocks in a single batched request.
 *
 * This is more efficient than using multiple useBlockHydration hooks when you need to
 * hydrate several blocks at once (e.g., all visible blocks on a page).
 *
 * Uses React Query for caching and state management.
 * Automatically handles authentication and loading states.
 *
 * @param blockIds - Array of block UUIDs to hydrate
 * @param workspaceId - Organisation context for authorization
 * @returns Map of block ID to hydration result, loading state, and error
 *
 * @example
 * // Hydrate multiple blocks at once
 * const visibleBlockIds = ["block-1", "block-2", "block-3"];
 * const { data: results, isLoading } = useBlocksHydration(
 *   visibleBlockIds,
 *   workspaceId
 * );
 *
 * if (isLoading) return <Skeleton />;
 *
 * // Access results per block
 * const block1Result = results?.["block-1"];
 * if (block1Result && !block1Result.error) {
 * }
 */
export const useBlocksHydration = (
  blockIds: string[],
  workspaceId: string | undefined,
): UseQueryResult<HydrateBlocksResponse, Error> => {
  const { session, loading: authLoading } = useAuth();

  // Sort block IDs for consistent query key (order shouldn't matter for caching)
  const sortedBlockIds = [...blockIds].sort();

  return useQuery<HydrateBlocksResponse, Error>({
    queryKey: ['blocks-hydration', workspaceId, ...sortedBlockIds],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('Organisation ID is required');
      }

      const results = await BlockService.hydrateBlocks(session, blockIds, workspaceId);

      return results;
    },
    enabled: blockIds.length > 0 && !!workspaceId && !!session && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes - entity data doesn't change frequently
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
};
