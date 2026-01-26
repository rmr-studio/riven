import type { BlockType, CreateBlockTypeRequest } from "@/lib/types";
import { isResponseError, normalizeApiError } from "@/lib/util/error/error.util";
import { handleError, validateSession, validateUuid } from "@/lib/util/service/service.util";
import { createBlockApi } from "@/lib/api/block-api";
import { api } from "@/lib/util/utils";
import { Session } from "@/lib/auth";

export class BlockTypeService {
    /**
     * Publish (create) a block type
     */
    static async publishBlockType(
        session: Session | null,
        request: CreateBlockTypeRequest
    ): Promise<BlockType> {
        try {
            validateSession(session);

            const blockApi = createBlockApi(session);
            return await blockApi.publishBlockType({ createBlockTypeRequest: request });
        } catch (error) {
            return await normalizeApiError(error);
        }
    }

    /**
     * Update an existing block type by id
     * Note: Generated API returns void, not BlockType
     */
    static async updateBlockType(
        session: Session | null,
        blockTypeId: string,
        request: BlockType
    ): Promise<void> {
        try {
            validateSession(session);
            validateUuid(blockTypeId);

            const blockApi = createBlockApi(session);
            await blockApi.updateBlockType({ blockTypeId, blockType: request });
        } catch (error) {
            return await normalizeApiError(error);
        }
    }

    /**
     * Get block types for a workspace
     * Note: Generated API returns BlockType[], not GetBlockTypesResponse wrapper
     */
    static async getBlockTypes(
        session: Session | null,
        workspaceId: string
    ): Promise<BlockType[]> {
        try {
            validateUuid(workspaceId);
            validateSession(session);

            const blockApi = createBlockApi(session);
            return await blockApi.getBlockTypes({ workspaceId });
        } catch (error) {
            return await normalizeApiError(error);
        }
    }

    /**
     * Get a block type by key
     */
    static async getBlockTypeByKey(session: Session | null, key: string): Promise<BlockType> {
        try {
            validateSession(session);

            const blockApi = createBlockApi(session);
            return await blockApi.getBlockTypeByKey({ key });
        } catch (error) {
            return await normalizeApiError(error);
        }
    }

    /**
     * Lint a block type (no generated API coverage - manual fetch retained)
     */
    static async lintBlockType(session: Session | null, blockType: BlockType): Promise<BlockType> {
        try {
            validateSession(session);
            const url = api();

            const response = await fetch(`${url}/v1/block/schema/lint/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(blockType),
            });

            if (response.ok) return await response.json();

            throw await handleError(
                response,
                (res) => `Failed to lint block type: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            return await normalizeApiError(error);
        }
    }
}
