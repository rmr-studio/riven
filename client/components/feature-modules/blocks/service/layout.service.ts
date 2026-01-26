import { fromError, normalizeApiError } from "@/lib/util/error/error.util";
import { validateSession, validateUuid } from "@/lib/util/service/service.util";
import { createBlockApi } from "@/lib/api/block-api";
import { Session } from "@/lib/auth";
import type {
    ApplicationEntityType,
    BlockEnvironment,
    SaveEnvironmentRequest,
    SaveEnvironmentResponse,
} from "@/lib/types";

/**
 * Layout Service - HTTP API Integration for Block Environment operations
 */
export class LayoutService {
    /**
     * Load a specific layout for an entity
     *
     * @param session - User session for authentication
     * @param workspaceId - UUID of the workspace
     * @param entityId - UUID of the entity (client, invoice, etc.)
     * @param entityType - Type of entity (from ApplicationEntityType enum)
     * @returns Promise<BlockEnvironment>
     *
     * Backend API:
     * - Endpoint: GET /api/v1/block/environment/workspace/:workspaceId/type/:type/id/:entityId
     * - Response: BlockEnvironment object
     */
    static async loadLayout(
        session: Session | null,
        workspaceId: string | undefined,
        entityId: string | undefined,
        entityType: ApplicationEntityType
    ): Promise<BlockEnvironment> {
        try {
            if (!workspaceId || !entityId) {
                throw fromError({
                    message: "Workspace ID and Entity ID are required to load layout",
                    status: 400,
                    error: "MISSING_PARAMETERS",
                });
            }

            validateUuid(workspaceId);
            validateUuid(entityId);
            validateSession(session);

            const api = createBlockApi(session);
            return await api.getBlockEnvironment({
                workspaceId,
                type: entityType,
                entityId,
            });
        } catch (error) {
            return await normalizeApiError(error);
        }
    }

    /**
     * Saves the current layout snapshot to the backend with all pending changes
     *
     * This is called when:
     * - User clicks "Save All" with pending layout changes
     *
     * @param session - User session for authentication
     * @param request - All data needed to save the layout
     * @returns Promise<SaveEnvironmentResponse>
     *
     * Backend API:
     * - Endpoint: POST /api/v1/block/environment/
     * - Request Body:  SaveEnvironmentRequest
     * - Response: SaveEnvironmentResponse
     */
    static async saveLayoutSnapshot(
        session: Session | null,
        request: SaveEnvironmentRequest
    ): Promise<SaveEnvironmentResponse> {
        try {
            validateSession(session);

            const api = createBlockApi(session);
            return await api.saveBlockEnvironment({ saveEnvironmentRequest: request });
        } catch (error) {
            return await normalizeApiError(error);
        }
    }
}
