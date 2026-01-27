import { useMemo } from "react";
import { useBlockHydrationContext } from "../context/block-hydration-provider";
import type { BlockHydrationResult } from "@/lib/types/block";

/**
 * Result type for useBlockHydration hook.
 * Mirrors React Query's UseQueryResult interface for consistency.
 */
export interface UseBlockHydrationResult {
  /**
   * Hydration result for the block with resolved entity references.
   * Undefined if not yet hydrated or if block doesn't exist.
   */
  data: BlockHydrationResult | undefined;

  /**
   * Whether the hydration request is currently loading.
   * True during initial fetch, false once data or error is available.
   */
  isLoading: boolean;

  /**
   * Error from the hydration request.
   * Network errors and auth errors appear here.
   * Individual entity errors are in data.error field.
   */
  error: Error | null;

  /**
   * Refetch hydration data for all blocks.
   * Note: This refetches ALL blocks in the environment, not just this one.
   */
  refetch: () => void;

  /**
   * Whether a refetch is currently in progress.
   */
  isRefetching: boolean;
}

/**
 * Hook to access hydration data for a single block.
 *
 * This hook reads from the BlockHydrationProvider context, which batches
 * all entity reference requests into a single HTTP call for performance.
 *
 * The hook automatically reactively updates when:
 * - The block's entity references change
 * - New blocks are added to the environment
 * - Blocks are removed from the environment
 *
 * @param blockId - UUID of the block to get hydration data for
 * @returns Hydration result with loading state, data, and error
 *
 * @example
 * const { data: hydrationResult, isLoading, error } = useBlockHydration("block-uuid");
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Alert>Failed to load</Alert>;
 *
 * const references = hydrationResult?.references || [];
 * return <div>{references.map(ref => ...)}</div>;
 */
export const useBlockHydration = (blockId: string | undefined): UseBlockHydrationResult => {
  const { getBlockHydration, isLoading, error, refetch, isRefetching } = useBlockHydrationContext();

  // Get hydration data for this specific block
  const data = useMemo(() => {
    if (!blockId) return undefined;
    return getBlockHydration(blockId);
  }, [blockId, getBlockHydration]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  };
};
