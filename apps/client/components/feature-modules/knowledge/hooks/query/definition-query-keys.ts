import { DefinitionCategory, DefinitionStatus } from '@/lib/types/models';

export const definitionKeys = {
  definitions: {
    base: (workspaceId: string) => ['definitions', workspaceId] as const,
    list: (workspaceId: string, status?: DefinitionStatus, category?: DefinitionCategory) =>
      ['definitions', workspaceId, { status, category }] as const,
  },
  definition: {
    detail: (workspaceId: string, definitionId: string) =>
      ['definition', workspaceId, definitionId] as const,
  },
} as const;
