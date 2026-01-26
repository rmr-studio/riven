// Re-export block-related response types from generated code

export type {
    BlockHydrationResult,
    OverwriteEnvironmentResponse,
    SaveEnvironmentResponse,
} from "@/lib/types/models";

import type { BlockType } from "@/lib/types/models";

// Response type for getBlockTypes operation (returns array of BlockType)
export type GetBlockTypesResponse = BlockType[];
