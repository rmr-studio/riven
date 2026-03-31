import { useQuery } from '@tanstack/react-query';
import { IntegrationDefinitionModel } from '@/lib/types/models';
import { IntegrationService } from '@/components/feature-modules/integrations/service/integration.service';
import { integrationKeys } from '@/components/feature-modules/integrations/hooks/query/integration-query-keys';

export function useIntegrations() {
  return useQuery<IntegrationDefinitionModel[]>({
    queryKey: integrationKeys.definitions.all,
    queryFn: () => IntegrationService.getAvailableIntegrations(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
