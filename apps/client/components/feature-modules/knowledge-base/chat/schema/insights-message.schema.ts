import { InsightsMessageRole } from '@/lib/types';
import { z } from 'zod';

export const CitationRefSchema = z.object({
  entityId: z.string().min(1),
  entityType: z.string().min(1),
  label: z.string(),
});

export const TokenUsageSchema = z.object({
  inputTokens: z.number(),
  outputTokens: z.number(),
  cacheReadTokens: z.number(),
  cacheWriteTokens: z.number(),
});

export const InsightsMessageSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  role: z.nativeEnum(InsightsMessageRole),
  content: z.string(),
  citations: z.array(CitationRefSchema),
  tokenUsage: TokenUsageSchema.nullish(),
  createdAt: z.union([z.date(), z.string()]).nullish(),
  createdBy: z.string().nullish(),
});

export type ValidatedInsightsMessage = z.infer<typeof InsightsMessageSchema>;
