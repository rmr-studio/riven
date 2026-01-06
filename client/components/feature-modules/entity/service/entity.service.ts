import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { handleError, validateSession, validateUuid } from "@/lib/util/service/service.util";
import { api } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";
import {
    DeleteEntityResponse,
    Entity,
    SaveEntityRequest,
    SaveEntityResponse,
} from "../interface/entity.interface";

export class EntityService {
    /**
     * Create a new entity instance for a given entity type
     */
    static async saveEntity(
        session: Session | null,
        workspaceId: string,
        entityTypeId: string,
        request: SaveEntityRequest
    ): Promise<SaveEntityResponse> {
        try {
            validateSession(session);
            validateUuid(workspaceId);
            validateUuid(entityTypeId);
            const url = api();

            const response = await fetch(
                `${url}/v1/entity/workspace/${workspaceId}/type/${encodeURIComponent(
                    entityTypeId
                )}`,
                {
                    method: "POST",
                    body: JSON.stringify(request),
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            );

            // A payload of validation errors and impact errors are also returned with 400 and 409 status codes
            if (response.ok || response.status === 400 || response.status === 409)
                return await response.json();

            throw await handleError(
                response,
                (res) => `Failed to create entity instance: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

    /**
     * Get all entity instances
     */
    static async getEntitiesForType(
        session: Session | null,
        workspaceId: string,
        typeId: string
    ): Promise<Entity[]> {
        try {
            validateSession(session);
            validateUuid(workspaceId);
            validateUuid(typeId);
            const url = api();

            const response = await fetch(
                `${url}/v1/entity/workspace/${workspaceId}/type/${typeId}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            );

            if (response.ok) return await response.json();

            throw await handleError(
                response,
                (res) => `Failed to fetch entity instances: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

    /**
     * Get all entity instances for multiple keys
     */
    static async getEntitiesForTypes(
        session: Session | null,
        workspaceId: string,
        typeIds: string[]
    ): Promise<Record<string, Entity[]>> {
        try {
            validateSession(session);
            validateUuid(workspaceId);
            typeIds.forEach((id) => validateUuid(id));
            const url = api();

            const response = await fetch(
                `${url}/v1/entity/workspace/${workspaceId}?ids=${typeIds
                    .map((id) => encodeURIComponent(id))
                    .join(",")}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            );

            if (response.ok) return await response.json();

            throw await handleError(
                response,
                (res) => `Failed to fetch entity instances: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

    static async deleteEntities(
        session: Session | null,
        workspaceId: string,
        entityIds: string[]
    ): Promise<DeleteEntityResponse> {
        try {
            validateSession(session);
            validateUuid(workspaceId);
            entityIds.forEach((id) => validateUuid(id));
            const url = api();

            const response = await fetch(`${url}/v1/entity/workspace/${workspaceId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(entityIds),
            });

            if (response.ok) return await response.json();

            throw await handleError(
                response,
                (res) => `Failed to delete entity instances: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }
}
