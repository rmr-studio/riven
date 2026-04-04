'use client';

import { Button } from '@riven/ui/button';
import { Input } from '@riven/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DefinitionCategory,
  DefinitionStatus,
  WorkspaceBusinessDefinition,
} from '@/lib/types/models';
import { cn } from '@/lib/util/utils';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FC, useMemo, useState } from 'react';
import { useDefinitions } from '@/components/feature-modules/knowledge/hooks/query/use-definitions';

const CATEGORY_LABELS: Record<DefinitionCategory, string> = {
  [DefinitionCategory.Metric]: 'Metric',
  [DefinitionCategory.Segment]: 'Segment',
  [DefinitionCategory.Status]: 'Status',
  [DefinitionCategory.LifecycleStage]: 'Lifecycle',
  [DefinitionCategory.Custom]: 'Custom',
};

const STATUS_DOT: Record<DefinitionStatus, string> = {
  [DefinitionStatus.Active]: 'bg-emerald-500',
  [DefinitionStatus.Suggested]: 'bg-amber-500',
};

const CATEGORY_FILTERS: Array<{ value: DefinitionCategory | undefined; label: string }> = [
  { value: undefined, label: 'All' },
  { value: DefinitionCategory.Metric, label: 'Metrics' },
  { value: DefinitionCategory.Segment, label: 'Segments' },
  { value: DefinitionCategory.Status, label: 'Statuses' },
  { value: DefinitionCategory.LifecycleStage, label: 'Lifecycle' },
  { value: DefinitionCategory.Custom, label: 'Custom' },
];

function DefinitionRow({ definition, workspaceId }: { definition: WorkspaceBusinessDefinition; workspaceId: string }) {
  return (
    <Link
      href={`/dashboard/workspace/${workspaceId}/definitions/${definition.id}`}
      className="hover:bg-muted flex items-center gap-4 border-b px-4 py-3 transition-colors"
    >
      <div
        className={cn('size-2 shrink-0 rounded-full', STATUS_DOT[definition.status])}
        title={definition.status === DefinitionStatus.Active ? 'Active' : 'Needs review'}
      />
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium">{definition.term}</span>
        <p className="text-muted-foreground line-clamp-1 text-xs">{definition.definition}</p>
      </div>
      <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-xs">
        {CATEGORY_LABELS[definition.category]}
      </span>
    </Link>
  );
}

function DefinitionsSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3">
          <Skeleton className="size-2 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function DefinitionsEmpty({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <h2 className="text-heading text-2xl font-semibold tracking-tight">
        Define Your Business Language
      </h2>
      <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
        Business definitions create a shared vocabulary across your workspace.
        Define what terms like MRR, churn rate, or enterprise mean to your team.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href={`/dashboard/workspace/${workspaceId}/definitions/new`}>
            Add Definition
          </Link>
        </Button>
      </div>
    </div>
  );
}

export const DefinitionsManagement: FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DefinitionCategory | undefined>(undefined);

  const { data: definitions, isLoading, isLoadingAuth } = useDefinitions(
    workspaceId,
    undefined,
    categoryFilter,
  );

  const filtered = useMemo(() => {
    if (!definitions) return [];
    if (!search.trim()) return definitions;
    const q = search.toLowerCase();
    return definitions.filter(
      (d) =>
        d.term.toLowerCase().includes(q) ||
        d.definition.toLowerCase().includes(q),
    );
  }, [definitions, search]);

  if (isLoading || isLoadingAuth) {
    return (
      <div className="mx-auto max-w-5xl px-8 py-8">
        <Skeleton className="mb-6 h-8 w-48" />
        <DefinitionsSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-heading text-3xl font-bold tracking-tight">Definitions</h1>
        <Button asChild size="sm">
          <Link href={`/dashboard/workspace/${workspaceId}/definitions/new`}>
            <Plus className="mr-1.5 size-4" />
            New Definition
          </Link>
        </Button>
      </div>

      {definitions && definitions.length === 0 ? (
        <DefinitionsEmpty workspaceId={workspaceId} />
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search definitions..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              {CATEGORY_FILTERS.map(({ value, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCategoryFilter(value)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs transition-colors',
                    categoryFilter === value
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg border">
            {filtered.length === 0 ? (
              <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                No definitions match your search.
              </p>
            ) : (
              filtered.map((def) => (
                <DefinitionRow
                  key={def.id}
                  definition={def}
                  workspaceId={workspaceId}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
