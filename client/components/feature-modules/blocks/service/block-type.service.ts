import {
    BlockType,
    CreateBlockTypeRequest,
    GetBlockTypesResponse,
} from "@/components/feature-modules/blocks/interface/block.interface";
import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { handleError, validateSession, validateUuid } from "@/lib/util/service/service.util";
import { api } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";

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
            const url = api();

            const response = await fetch(`${url}/v1/block/schema/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(request),
            });

            if (response.ok) return await response.json();
            throw await handleError(
                response,
                (res) => `Failed to publish block type: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

    /**
     * Update an existing block type by id
     */
    static async updateBlockType(
        session: Session | null,
        blockTypeId: string,
        request: BlockType
    ): Promise<BlockType> {
        try {
            validateSession(session);
            validateUuid(blockTypeId);

            const url = api();

            const response = await fetch(`${url}/v1/block/schema/${blockTypeId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(request),
            });

            if (response.ok) return await response.json();

            throw await handleError(
                response,
                (res) => `Failed to update block type: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }



    /**
     * Get block types for a workspace
     */
    static async getBlockTypes(
        session: Session | null,
        workspaceId: string
    ): Promise<GetBlockTypesResponse> {
        try {
            validateUuid(workspaceId);
            validateSession(session);

            const url = api();

            const response = await fetch(`${url}/v1/block/schema/workspace/${workspaceId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) return await response.json();

            throw await handleError(
                response,
                (res) => `Failed to fetch block types: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

    /**
     * Get a block type by key
     */
    static async getBlockTypeByKey(session: Session | null, key: string): Promise<BlockType> {
        try {
            validateSession(session);

            const url = api();

            const response = await fetch(`${url}/v1/block/schema/key/${encodeURIComponent(key)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) return await response.json();

            throw await handleError(
                response,
                (res) => `Failed to fetch block type by key: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

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
            throw fromError(error);
        }
    }
}
