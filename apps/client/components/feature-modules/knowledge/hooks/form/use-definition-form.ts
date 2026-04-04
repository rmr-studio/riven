import {
  DefinitionCategory,
  DefinitionSource,
  WorkspaceBusinessDefinition,
} from '@/lib/types/models';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { useCreateDefinitionMutation } from '@/components/feature-modules/knowledge/hooks/mutation/use-create-definition-mutation';
import { useUpdateDefinitionMutation } from '@/components/feature-modules/knowledge/hooks/mutation/use-update-definition-mutation';

export const definitionSchema = z.object({
  term: z.string().min(1, 'Term is required').max(200),
  definition: z.string().min(1, 'Definition is required').max(5000),
  category: z.nativeEnum(DefinitionCategory),
  entityTypeRefs: z.array(z.string().uuid()).default([]),
  attributeRefs: z.array(z.string().uuid()).default([]),
});

export type DefinitionFormValues = z.infer<typeof definitionSchema>;

export interface UseDefinitionFormReturn {
  form: UseFormReturn<DefinitionFormValues>;
  handleSubmit: (values: DefinitionFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function useDefinitionForm(
  workspaceId: string,
  existing?: WorkspaceBusinessDefinition,
  options?: { onSuccess?: (definition: WorkspaceBusinessDefinition) => void },
): UseDefinitionFormReturn {
  const isUpdate = !!existing;

  const form = useForm<DefinitionFormValues>({
    defaultValues: {
      term: existing?.term ?? '',
      definition: existing?.definition ?? '',
      category: existing?.category ?? DefinitionCategory.Custom,
      entityTypeRefs: existing?.entityTypeRefs ?? [],
      attributeRefs: existing?.attributeRefs ?? [],
    },
    resolver: zodResolver(definitionSchema),
  });

  const createMutation = useCreateDefinitionMutation(workspaceId, {
    onSuccess: options?.onSuccess,
  });

  const updateMutation = useUpdateDefinitionMutation(
    workspaceId,
    existing?.id ?? '',
    { onSuccess: options?.onSuccess },
  );

  const handleSubmit = async (values: DefinitionFormValues): Promise<void> => {
    if (isUpdate) {
      await updateMutation.mutateAsync({
        term: values.term,
        definition: values.definition,
        category: values.category,
        entityTypeRefs: values.entityTypeRefs,
        attributeRefs: values.attributeRefs,
        version: existing.version,
      });
    } else {
      await createMutation.mutateAsync({
        term: values.term,
        definition: values.definition,
        category: values.category,
        source: DefinitionSource.Manual,
        entityTypeRefs: values.entityTypeRefs,
        attributeRefs: values.attributeRefs,
      });
    }
  };

  return {
    form,
    handleSubmit,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
  };
}
