'use client';

import { useAuth } from '@/components/provider/auth-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import {
  BlockHydrationResult,
  BlockNode,
  EntityReferenceHydrationRequest,
  EntityReferenceMetadata,
  HydrateBlockResponse,
  isContentNode,
  isEntityReferenceMetadata,
  isReferenceNode,
} from '../interface/block.interface';
import { BlockService } from '../service/block.service';
import { useBlockEnvironment } from './block-environment-provider';

/**
 * Context value for block hydration.
 * Provides access to hydrated entity data for all reference blocks in the environment.
 */
interface BlockHydrationContextValue {
  /**
   * Get hydration result for a specific block.
   * Returns undefined if block is not a reference block or hasn't been hydrated yet.
   */
  getBlockHydration: (blockId: string) => BlockHydrationResult | undefined;

  /**
   * Whether the initial hydration request is loading.
   */
  isLoading: boolean;

  /**
   * Error from the hydration request (network errors, auth errors, etc.)
   * Individual entity errors are in the BlockHydrationResult.error field.
   */
  error: Error | null;

  /**
   * Refetch all hydration data.
   */
  refetch: () => void;

  /**
   * Whether a refetch is in progress.
   */
  isRefetching: boolean;
}

const BlockHydrationContext = createContext<BlockHydrationContextValue | null>(null);

/**
 * Props for BlockHydrationProvider.
 */
interface BlockHydrationProviderProps {
  children: React.ReactNode;
}

/**
 * Recursively collects all reference blocks from a node tree.
 */
const collectReferenceBlocks = (
  node: BlockNode,
  accumulator: Map<string, EntityReferenceMetadata>,
): void => {
  // Check if this node is a reference node with entity references
  if (isReferenceNode(node) && isEntityReferenceMetadata(node.block.payload)) {
    accumulator.set(node.block.id, node.block.payload);
  }

  // Recurse into children
  if (isContentNode(node) && node.children) {
    node.children.forEach((child) => collectReferenceBlocks(child, accumulator));
  }
};

/**
 * BlockHydrationProvider - Manages batched entity hydration for all reference blocks.
 *
 * This provider:
 * 1. Monitors the block environment for all reference blocks
 * 2. Collects entity references from all blocks
 * 3. Makes a single batched HTTP request to hydrate all entities
 * 4. Provides individual block access via useBlockHydration hook
 * 5. Automatically refetches when blocks are added/removed/modified
 *
 * Key Features:
 * - Single HTTP request for all blocks (performance optimization)
 * - Automatic reactivity when environment changes
 * - Per-block loading states
 * - Per-entity error handling (permission denied, not found)
 * - React Query caching and refetch capabilities
 *
 * @example
 * <BlockHydrationProvider>
 *   <EntityReferenceBlocks />
 * </BlockHydrationProvider>
 */
export const BlockHydrationProvider: React.FC<BlockHydrationProviderProps> = ({ children }) => {
  const { environment, workspaceId } = useBlockEnvironment();
  const { session, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  /**
   * Extract all reference blocks from the current environment.
   * Memoized to only recompute when the environment changes.
   */
  const referenceBlocksMap = useMemo(() => {
    const map = new Map<string, EntityReferenceMetadata>();

    environment.trees.forEach((tree) => {
      collectReferenceBlocks(tree.root, map);
    });

    return map;
  }, [environment.trees]);

  /**
   * Track previous block IDs to detect when IDs are remapped (temp → permanent).
   * When remapping occurs (during save), invalidate old cache entries.
   */
  const previousBlockIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentBlockIds = new Set(referenceBlocksMap.keys());
    const previousBlockIds = previousBlockIdsRef.current;

    // Detect removed block IDs (these were likely remapped)
    const removedBlockIds = Array.from(previousBlockIds).filter((id) => !currentBlockIds.has(id));

    // Invalidate queries for old block IDs to clean up cache
    if (removedBlockIds.length > 0) {
      console.debug(
        `[BlockHydration] Detected ID remapping, invalidating cache for old IDs:`,
        removedBlockIds,
      );

      // Invalidate the entire hydration cache when IDs change
      // This ensures we don't have stale data with old temporary IDs
      queryClient.invalidateQueries({
        queryKey: ['block-hydration', workspaceId],
        exact: false,
      });
    }

    // Update reference for next comparison
    previousBlockIdsRef.current = currentBlockIds;
  }, [referenceBlocksMap, workspaceId, queryClient]);

  /**
   * Build the hydration request payload.
   * Maps block IDs to arrays of entity reference requests.
   */
  const hydrationRequest = useMemo(() => {
    const requests: Record<string, EntityReferenceHydrationRequest[]> = {};

    referenceBlocksMap.forEach((metadata, blockId) => {
      if (metadata.items && metadata.items.length > 0) {
        requests[blockId] = metadata.items.map((item, index) => ({
          type: item.type,
          id: item.id,
          index,
        }));
      }
    });

    return requests;
  }, [referenceBlocksMap]);

  /**
   * Create a stable query key based on the current hydration request.
   * React Query will automatically refetch when this key changes.
   */
  const queryKey = useMemo(() => {
    // Create a stable, sorted representation of the request
    const blockKeys = Object.entries(hydrationRequest)
      .map(([blockId, items]) => {
        const itemKeys = items.map((item) => `${item.type}:${item.id}`).join(',');
        return `${blockId}:[${itemKeys}]`;
      })
      .sort();

    return ['block-hydration', workspaceId, blockKeys];
  }, [hydrationRequest, workspaceId]);

  /**
   * Single batched React Query for all block hydrations.
   */
  const hydrationQuery = useQuery<HydrateBlockResponse, Error>({
    queryKey,
    queryFn: async () => {
      // If no blocks need hydration, return empty result
      if (Object.keys(hydrationRequest).length === 0) {
        return {};
      }

      return BlockService.hydrateBlocks(session, hydrationRequest, workspaceId);
    },
    enabled: !!session && !authLoading && Object.keys(hydrationRequest).length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  /**
   * Get hydration result for a specific block.
   */
  const getBlockHydration = (blockId: string): BlockHydrationResult | undefined => {
    if (!hydrationQuery.data) return undefined;
    return hydrationQuery.data[blockId];
  };

  const value: BlockHydrationContextValue = {
    getBlockHydration,
    isLoading: hydrationQuery.isLoading,
    error: hydrationQuery.error,
    refetch: hydrationQuery.refetch,
    isRefetching: hydrationQuery.isRefetching,
  };

  return <BlockHydrationContext.Provider value={value}>{children}</BlockHydrationContext.Provider>;
};

/**
 * Hook to access block hydration context.
 * Must be used within a BlockHydrationProvider.
 */
export const useBlockHydrationContext = (): BlockHydrationContextValue => {
  const context = useContext(BlockHydrationContext);
  if (!context) {
    throw new Error('useBlockHydrationContext must be used within BlockHydrationProvider');
  }
  return context;
};
