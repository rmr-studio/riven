import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { handleError, validateSession, validateUuid } from "@/lib/util/service/service.util";
import { api } from "@/lib/util/utils";
import { Session } from "@/lib/auth";
import {
    CreateEntityTypeRequest,
    DeleteTypeDefinitionRequest,
    EntityType,
    EntityTypeImpactResponse,
    SaveTypeDefinitionRequest,
} from "../interface/entity.interface";

export class EntityTypeService {
    static async getEntityTypes(
        session: Session | null,
        workspaceId: string
    ): Promise<EntityType[]> {
        try {
            validateSession(session);
            validateUuid(workspaceId);
            const url = api();

            const response = await fetch(`${url}/v1/entity/schema/workspace/${workspaceId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) return await response.json();

            throw await handleError(
                response,
                (res) => `Failed to fetch entity types: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

    static async getEntityTypeByKey(
        session: Session | null,
        workspaceId: string,
        key: string
    ): Promise<EntityType> {
        try {
            validateSession(session);
            validateUuid(workspaceId);
            const url = api();
            const response = await fetch(
                `${url}/v1/entity/schema/workspace/${workspaceId}/key/${encodeURIComponent(
                    key
                )}`,
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
                (res) => `Failed to fetch entity type by key: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

    static async publishEntityType(
        session: Session | null,
        workspaceId: string,
        request: CreateEntityTypeRequest
    ): Promise<EntityType> {
        try {
            validateSession(session);
            validateUuid(workspaceId);
            const url = api();

            const response = await fetch(`${url}/v1/entity/schema/workspace/${workspaceId}`, {
                method: "POST",
                body: JSON.stringify(request),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (response.ok) return await response.json();
            throw await handleError(
                response,
                (res) => `Failed to fetch entity type by key: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

    static async saveEntityTypeConfiguration(
        session: Session | null,
        workspaceId: string,
        entityType: EntityType
    ): Promise<EntityType> {
        try {
            validateSession(session);
            validateUuid(workspaceId);
            const url = api();
            const response = await fetch(
                `${url}/v1/entity/schema/workspace/${workspaceId}/configuration`,
                {
                    method: "PUT",
                    body: JSON.stringify(entityType),
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            );

            // Both 200 (success) and 409 (conflict with impact) return UpdateEntityTypeResponse
            if (response.ok) {
                return await response.json();
            }

            throw await handleError(
                response,
                (res) => `Failed to update entity type: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

    static async removeEntityTypeDefinition(
        session: Session | null,
        workspaceId: string,
        definition: DeleteTypeDefinitionRequest,
        impactConfirmed: boolean = false
    ): Promise<EntityTypeImpactResponse> {
        try {
            validateSession(session);
            validateUuid(workspaceId);
            const url = api();

            const queryParams = new URLSearchParams({
                impactConfirmed: String(impactConfirmed),
            });

            const response = await fetch(
                `${url}/v1/entity/schema/workspace/${workspaceId}/definition?${queryParams}`,
                {
                    method: "DELETE",
                    body: JSON.stringify(definition),
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            );

            // Both 200 (success) and 409 (conflict with impact) return EntityTypeImpactResponse
            if (response.ok || response.status === 409) return await response.json();

            throw await handleError(
                response,
                (res) => `Failed to delete entity type definition: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

    /**
     * This will handle saving (ie. Publishing/Updating) new entity schema attributes and definitions
     */
    static async saveEntityTypeDefinition(
        session: Session | null,
        workspaceId: string,
        definition: SaveTypeDefinitionRequest,
        impactConfirmed: boolean = false
    ): Promise<EntityTypeImpactResponse> {
        try {
            validateSession(session);
            validateUuid(workspaceId);
            const url = api();

            const queryParams = new URLSearchParams({
                impactConfirmed: String(impactConfirmed),
            });

            const response = await fetch(
                `${url}/v1/entity/schema/workspace/${workspaceId}/definition?${queryParams}`,
                {
                    method: "POST",
                    body: JSON.stringify(definition),
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            );

            // Both 200 (success) and 409 (conflict with impact) return EntityTypeImpactResponse
            if (response.ok || response.status === 409) return await response.json();

            throw await handleError(
                response,
                (res) => `Failed to save entity type definition: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }

    static async deleteEntityType(
        session: Session | null,
        workspaceId: string,
        entityTypeKey: string,
        impactConfirmed: boolean = false
    ): Promise<EntityTypeImpactResponse> {
        try {
            validateSession(session);
            validateUuid(workspaceId);
            const url = api();

            const queryParams = new URLSearchParams({
                impactConfirmed: String(impactConfirmed),
            });

            const response = await fetch(
                `${url}/v1/entity/schema/workspace/${workspaceId}/key/${encodeURIComponent(
                    entityTypeKey
                )}?${queryParams}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            );

            // Both 200 (success) and 409 (conflict with impact) return DeleteEntityTypeResponse
            if (response.ok || response.status === 409) return await response.json();

            throw await handleError(
                response,
                (res) => `Failed to delete entity type: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }
}
