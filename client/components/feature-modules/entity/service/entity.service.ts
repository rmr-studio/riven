import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { handleError, validateSession, validateUuid } from "@/lib/util/service/service.util";
import { api } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";
import { Entity, SaveEntityRequest, SaveEntityResponse } from "../interface/entity.interface";

export class EntityService {
    /**
     * Create a new entity instance for a given entity type
     */
    static async saveEntity(
        session: Session | null,
        organisationId: string,
        entityTypeId: string,
        request: SaveEntityRequest
    ): Promise<SaveEntityResponse> {
        try {
            validateSession(session);
            validateUuid(organisationId);
            validateUuid(entityTypeId);
            const url = api();

            const response = await fetch(
                `${url}/v1/entity/organisation/${organisationId}/type/${encodeURIComponent(
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
        organisationId: string,
        typeId: string
    ): Promise<Entity[]> {
        try {
            validateSession(session);
            validateUuid(organisationId);
            validateUuid(typeId);
            const url = api();

            const response = await fetch(
                `${url}/v1/entity/organisation/${organisationId}/type/${typeId}`,
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
        organisationId: string,
        typeIds: string[]
    ): Promise<Record<string, Entity[]>> {
        try {
            validateSession(session);
            validateUuid(organisationId);
            typeIds.forEach((id) => validateUuid(id));
            const url = api();

            const response = await fetch(
                `${url}/v1/entity/organisation/${organisationId}?ids=${typeIds
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

    /**
     * Check if a value is unique for a given attribute
     * Returns true if unique, false if duplicate exists
     */
    static async checkUniqueValue(
        session: Session | null,
        organisationId: string,
        entityTypeKey: string,
        attributeId: string,
        value: any
    ): Promise<boolean> {
        try {
            validateSession(session);
            validateUuid(organisationId);
            validateUuid(attributeId);
            const url = api();

            const queryParams = new URLSearchParams({
                attributeId,
                value: String(value),
            });

            const response = await fetch(
                `${url}/v1/entity/organisation/${organisationId}/type/${encodeURIComponent(
                    entityTypeKey
                )}/validate-unique?${queryParams}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            );

            if (response.ok) {
                const result = await response.json();
                return result.isUnique ?? true;
            }

            throw await handleError(
                response,
                (res) => `Failed to validate unique value: ${res.status} ${res.statusText}`
            );
        } catch (error) {
            if (isResponseError(error)) throw error;
            throw fromError(error);
        }
    }
}
