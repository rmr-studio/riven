
import { createEntityApi } from '@/lib/api/entity-api';
import { Session } from '@/lib/auth';
import { ResponseError } from '@/lib/types';
import {
  DeleteEntityResponse,
  Entity,
  SaveEntityRequest,
  SaveEntityResponse,
} from '@/lib/types/entity';
import { validateSession, validateUuid } from '@/lib/util/service/service.util';

export class EntityService {
  /**
   * Create a new entity instance for a given entity type
   */
  static async saveEntity(
    session: Session | null,
    workspaceId: string,
    entityTypeId: string,
    request: SaveEntityRequest,
  ): Promise<SaveEntityResponse> {
    validateSession(session);
    validateUuid(workspaceId);
    validateUuid(entityTypeId);
    const api = createEntityApi(session);

    try {
      return await api.saveEntity({
        workspaceId,
        entityTypeId,
        saveEntityRequest: request,
      });
    } catch (error) {
      // Both 400 (validation) and 409 (impact) return SaveEntityResponse payload
      if (
        error instanceof ResponseError &&
        (error.response.status === 400 || error.response.status === 409)
      ) {
        return await error.response.json();
      }
      throw error;
    }
  }

  /**
   * Get all entity instances
   */
  static async getEntitiesForType(
    session: Session | null,
    workspaceId: string,
    typeId: string,
  ): Promise<Entity[]> {
    validateSession(session);
    validateUuid(workspaceId);
    validateUuid(typeId);
    const api = createEntityApi(session!);
    return api.getEntityByTypeIdForWorkspace({ workspaceId, id: typeId });
  }

  /**
   * Get all entity instances for multiple keys
   */
  static async getEntitiesForTypes(
    session: Session | null,
    workspaceId: string,
    typeIds: string[],
  ): Promise<Record<string, Entity[]>> {
    validateSession(session);
    validateUuid(workspaceId);
    typeIds.forEach((id) => validateUuid(id));
    const api = createEntityApi(session!);
    return api.getEntityByTypeIdInForWorkspace({ workspaceId, ids: typeIds });
  }

  static async deleteEntities(
    session: Session | null,
    workspaceId: string,
    entityIds: string[],
  ): Promise<DeleteEntityResponse> {
    validateSession(session);
    validateUuid(workspaceId);
    entityIds.forEach((id) => validateUuid(id));
    const api = createEntityApi(session!);
    return api.deleteEntity({ workspaceId, requestBody: entityIds });
  }
}
