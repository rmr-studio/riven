import { createWorkflowApi } from '@/lib/api/workflow-api';
import { Session } from '@/lib/auth';
import { WorkflowNodeMetadata } from '@/lib/types';
import { validateSession } from '@/lib/util/service/service.util';

/**
 * Service layer for workflow API operations
 * Uses static methods following codebase conventions
 */
export class WorkflowService {
  /**
   * Fetch configuration schemas for all workflow node types
   * Returns a map of node type identifiers to their config field definitions
   *
   * @example
   * const schemas = await WorkflowService.getNodeConfigSchemas(session);
   * const triggerFields = schemas["TRIGGER.ENTITY_EVENT"];
   */
  static async getNodeConfigSchemas(
    session: Session | null,
  ): Promise<Record<string, WorkflowNodeMetadata>> {
    validateSession(session);
    const api = createWorkflowApi(session);
    return api.getNodeConfigSchemas();
  }
}
