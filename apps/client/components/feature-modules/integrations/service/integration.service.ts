import { createIntegrationApi, createPublicIntegrationApi } from '@/lib/api/integration-api';
import { Session } from '@/lib/auth';
import { IntegrationDefinitionModel, IntegrationConnectionModel } from '@/lib/types/models';
import { normalizeApiError } from '@/lib/util/error/error.util';
import { validateSession, validateUuid } from '@/lib/util/service/service.util';

export class IntegrationService {
  static async getAvailableIntegrations(): Promise<IntegrationDefinitionModel[]> {
    const api = createPublicIntegrationApi();
    try {
      return await api.listAvailableIntegrations();
    } catch (error) {
      return await normalizeApiError(error);
    }
  }

  static async getWorkspaceIntegrationStatus(
    session: Session | null,
    workspaceId: string,
  ): Promise<IntegrationConnectionModel[]> {
    validateSession(session);
    validateUuid(workspaceId);
    const api = createIntegrationApi(session);
    try {
      return await api.getWorkspaceIntegrationStatus({ workspaceId });
    } catch (error) {
      return await normalizeApiError(error);
    }
  }

  static async disableIntegration(
    session: Session | null,
    workspaceId: string,
    integrationDefinitionId: string,
  ) {
    validateSession(session);
    validateUuid(workspaceId);
    validateUuid(integrationDefinitionId);
    const api = createIntegrationApi(session);
    try {
      return await api.disableIntegration({
        workspaceId,
        disableIntegrationRequest: { integrationDefinitionId },
      });
    } catch (error) {
      return await normalizeApiError(error);
    }
  }
}
