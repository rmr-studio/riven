import { fromError, normalizeApiError } from "@/lib/util/error/error.util";
import { validateSession, validateUuid } from "@/lib/util/service/service.util";
import { createBlockApi } from "@/lib/api/block-api";
import { Session } from "@/lib/auth";
import type { EntityReferenceHydrationRequest, HydrateBlockResponse } from "@/lib/types/block";

// Re-export for hook compatibility (hook expects plural name)
export type { HydrateBlockResponse as HydrateBlocksResponse } from "@/lib/types/block";

/**
 * Block Service - HTTP API Integration for Block operations
 */
export class BlockService {
    /**
     * Hydrate (resolve entity references for) one or more blocks in a single batched request.
     *
     * This method is used for progressive loading of entity data without fetching everything upfront.
     * Only blocks with entity reference metadata will be hydrated; other blocks are skipped.
     *
     * @param session - User session for authentication
     * @param entities - Record of block UUIDs to hydrate with their entity reference requests
     * @param workspaceId - Workspace context for authorization
     * @returns Promise<HydrateBlocksResponse> - Map of block ID to hydration result
     *
     * Backend API:
     * - Endpoint: POST /api/v1/block/environment/hydrate
     * - Request Body: HydrateBlocksRequest
     * - Response: HydrateBlocksResponse (map of blockId to BlockHydrationResult)
     *
     * @example
     * const results = await BlockService.hydrateBlocks(
     *   session,
     *   ["block-uuid-1", "block-uuid-2"],
     *   "workspace-uuid"
     * );
     *
     * // Access results per block
     * const block1Result = results["block-uuid-1"];
     * if (block1Result && !block1Result.error) {
     * }
     */
    static async hydrateBlocks(
        session: Session | null,
        entities: Record<string, EntityReferenceHydrationRequest[]>,
        workspaceId: string
    ): Promise<HydrateBlockResponse> {
        try {
            // Validate inputs
            if (!entities || Object.keys(entities).length === 0) {
                throw fromError({
                    message: "At least one block ID is required",
                    status: 400,
                    error: "MISSING_PARAMETERS",
                });
            }

            validateSession(session);
            validateUuid(workspaceId);
            Object.keys(entities).forEach(validateUuid);

            const api = createBlockApi(session);
            return await api.hydrateBlocks({
                hydrateBlocksRequest: {
                    references: entities,
                    workspaceId,
                },
            });
        } catch (error) {
            throw await normalizeApiError(error);
        }
    }
}
