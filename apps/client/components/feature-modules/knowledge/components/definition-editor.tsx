'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@riven/ui/input';
import { Button } from '@riven/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { DefinitionCategory } from '@/lib/types/models';
import { cn } from '@/lib/util/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FC } from 'react';
import { useDefinition } from '@/components/feature-modules/knowledge/hooks/query/use-definition';
import { useDefinitionForm } from '@/components/feature-modules/knowledge/hooks/form/use-definition-form';

const CATEGORY_OPTIONS: Array<{ value: DefinitionCategory; label: string }> = [
  { value: DefinitionCategory.Metric, label: 'Metric' },
  { value: DefinitionCategory.Segment, label: 'Segment' },
  { value: DefinitionCategory.Status, label: 'Status' },
  { value: DefinitionCategory.LifecycleStage, label: 'Lifecycle Stage' },
  { value: DefinitionCategory.Custom, label: 'Custom' },
];

function EditorSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      <Skeleton className="mb-8 h-5 w-24" />
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  );
}

function DefinitionEditorForm({
  workspaceId,
  definitionId,
}: {
  workspaceId: string;
  definitionId?: string;
}) {
  const router = useRouter();
  const isEdit = !!definitionId;

  const { data: existing, isLoading } = useDefinition(
    isEdit ? workspaceId : undefined,
    definitionId,
  );

  const { form, handleSubmit, isSubmitting } = useDefinitionForm(
    workspaceId,
    existing ?? undefined,
    {
      onSuccess: () => {
        router.push(`/dashboard/workspace/${workspaceId}/definitions`);
      },
    },
  );

  if (isEdit && isLoading) return <EditorSkeleton />;

  const selectedCategory = form.watch('category');

  return (
    <div className="mx-auto max-w-2xl px-8 py-8">
      <Link
        href={`/dashboard/workspace/${workspaceId}/definitions`}
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" />
        Definitions
      </Link>

      <h1 className="text-heading mb-8 text-3xl font-bold tracking-tight">
        {isEdit ? 'Edit Definition' : 'New Definition'}
      </h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-6"
        >
          <p className="font-mono text-muted-foreground text-xs font-bold uppercase tracking-widest">
            Details
          </p>

          <FormField
            control={form.control}
            name="term"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Term</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. MRR, Churn Rate, Enterprise" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="definition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Definition</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What does this term mean to your business?"
                    rows={6}
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={() => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => form.setValue('category', value, { shouldValidate: true })}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                        selectedCategory === value
                          ? 'border-primary bg-primary/5 font-medium ring-2 ring-primary'
                          : 'border-border hover:border-muted-foreground/40',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" asChild>
              <Link href={`/dashboard/workspace/${workspaceId}/definitions`}>
                Cancel
              </Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export const DefinitionEditor: FC = () => {
  const { workspaceId, id } = useParams<{ workspaceId: string; id?: string }>();
  return <DefinitionEditorForm workspaceId={workspaceId} definitionId={id} />;
};
