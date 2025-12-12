import { fromError, isResponseError } from "@/lib/util/error/error.util";
import { handleError, validateSession } from "@/lib/util/service/service.util";
import { api } from "@/lib/util/utils";
import { Session } from "@supabase/supabase-js";
import { EntityType } from "../interface/entity.interface";

export class EntityTypeService {
    static async getEntityTypes(
        session: Session | null,
        organisationId: string
    ): Promise<EntityType[]> {
        try {
            validateSession(session);
            const url = api();

            const response = await fetch(`${url}/v1/entity/schema/organisation/${organisationId}`, {
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
        organisationId: string,
        key: string
    ): Promise<EntityType> {
        try {
            validateSession(session);
            const url = api();
            const response = await fetch(
                `${url}/v1/entity/schema/organisation/${organisationId}/key/${encodeURIComponent(
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
}
