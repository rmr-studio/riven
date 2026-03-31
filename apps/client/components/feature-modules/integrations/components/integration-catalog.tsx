'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Search } from 'lucide-react';

import { Input } from '@riven/ui/input';
import { useIntegrations } from '@/components/feature-modules/integrations/hooks/query/use-integrations';
import { useIntegrationStatus } from '@/components/feature-modules/integrations/hooks/query/use-integration-status';
import { IntegrationCard } from '@/components/feature-modules/integrations/components/integration-card';
import { IntegrationCatalogSkeleton } from '@/components/feature-modules/integrations/components/integration-catalog-skeleton';
import { cn } from '@/lib/util/utils';

const CATEGORY_TABS = [
  { label: 'All', value: 'ALL' },
  { label: 'CRM', value: 'CRM' },
  { label: 'Payments', value: 'PAYMENTS' },
  { label: 'Support', value: 'SUPPORT' },
  { label: 'Communication', value: 'COMMUNICATION' },
  { label: 'Analytics', value: 'PRODUCT_ANALYTICS' },
] as const;

type CategoryValue = (typeof CATEGORY_TABS)[number]['value'];

export function IntegrationCatalog() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryValue>('ALL');

  const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();
  const { data: connections, isLoading: isLoadingConnections } = useIntegrationStatus(workspaceId);

  const connectedIds = useMemo(() => {
    if (!connections) return new Set<string>();
    return new Set(connections.map((c) => c.integrationId));
  }, [connections]);

  const filtered = useMemo(() => {
    if (!integrations) return [];
    return integrations.filter((integration) => {
      if (activeCategory !== 'ALL' && integration.category !== activeCategory) return false;
      if (search && !integration.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [integrations, activeCategory, search]);

  const isLoading = isLoadingIntegrations || isLoadingConnections;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your tools to sync data into Riven.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveCategory(tab.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                activeCategory === tab.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <IntegrationCatalogSkeleton />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">No integrations found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search
              ? 'Try adjusting your search or filter.'
              : 'No integrations are available for this category yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              isConnected={connectedIds.has(integration.id)}
              workspaceId={workspaceId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
