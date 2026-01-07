import {
    BlockListOrderingMode,
    BlockMetadataType,
    BlockReferenceFetchPolicy,
    BlockValidationScope,
    EntityType,
    ListFilterLogicType,
    NodeType,
    Presentation,
    ReferenceType,
} from "@/lib/types/types";
import { now } from "@/lib/util/utils";
import { v4 as uuid } from "uuid";
import {
    Block,
    BlockContentMetadata,
    BlockDisplay,
    BlockListConfiguration,
    BlockMeta,
    BlockReferenceMetadata,
    BlockReferencePayload,
    BlockSchema,
    BlockTree,
    BlockType,
    BlockTypeNesting,
    ContentNode,
    EntityReference,
    EntityReferenceMetadata,
    Metadata,
    Reference,
    Referenceable,
    ReferenceNode,
    ReferencePayload,
    ReferenceWarning,
} from "../../../interface/block.interface";

const createMeta = (overrides?: Partial<BlockMeta>): BlockMeta => ({
    validationErrors: overrides?.validationErrors ?? [],
    computedFields: overrides?.computedFields,
    lastValidatedVersion: overrides?.lastValidatedVersion,
});

export const createContentMetadata = (
    data?: Record<string, unknown>,
    overrides?: Partial<BlockMeta>,
    deletable: boolean = true,
    listConfig?: BlockListConfiguration
): BlockContentMetadata => ({
    type: BlockMetadataType.CONTENT,
    deletable,
    data: data ?? {},
    meta: createMeta(overrides),
    listConfig,
});

/**
 * Creates BlockListConfiguration for list blocks.
 * Used when creating blocks that manage lists of child blocks.
 */
export const createListConfiguration = (listType?: string[]): BlockListConfiguration => ({
    listType,
    allowDuplicates: false,
    display: {
        itemSpacing: 8,
        showDragHandles: true,
        emptyMessage: "No items yet",
    },
    config: {
        mode: BlockListOrderingMode.MANUAL,
        filters: [],
        filterLogic: ListFilterLogicType.AND,
    },
});

/**
 * Creates EntityReferenceMetadata for entity reference blocks.
 * Used when creating blocks that reference external entities (clients, organizations, etc.)
 *
 * @param listType - The entity type that this reference block is restricted to (CLIENT, INVOICE, etc.)
 * @param overrides - Optional metadata overrides
 * @param deletable - Whether the block can be deleted
 */
export const createEntityReferenceMetadata = (
    listType?: EntityType,
    overrides?: Partial<BlockMeta>,
    deletable: boolean = true
): EntityReferenceMetadata => ({
    type: BlockMetadataType.ENTITY_REFERENCE,
    deletable,
    meta: createMeta(overrides),
    path: "$.items",
    fetchPolicy: BlockReferenceFetchPolicy.LAZY,
    presentation: Presentation.ENTITY,
    items: [],
    projection: {
        fields: [],
    },
    listType, // Set the entity type restriction
    display: {
        itemSpacing: 8,
        showDragHandles: false,
        emptyMessage: listType ? `No ${listType.toLowerCase()}s selected` : "No entities selected",
    },
    config: {
        mode: BlockListOrderingMode.MANUAL,
        filters: [],
        filterLogic: ListFilterLogicType.AND,
    },
    allowDuplicates: false,
});

/**
 * Creates BlockReferenceMetadata for block reference blocks.
 * Used when creating blocks that reference other block trees.
 */
export const createBlockReferenceMetadata = (
    overrides?: Partial<BlockMeta>,
    deletable: boolean = true
): BlockReferenceMetadata => ({
    type: BlockMetadataType.BLOCK_REFERENCE,
    deletable,
    meta: createMeta(overrides),
    path: "",
    fetchPolicy: BlockReferenceFetchPolicy.LAZY,
    expandDepth: 1,
    item: {
        type: EntityType.BLOCK_TREE,
        id: "",
    },
});

export const createBlockBase = ({
    id,
    workspaceId,
    type,
    name,
    payload,
    archived = false,
}: {
    id?: string;
    workspaceId: string;
    type: BlockType;
    name?: string;
    payload: Metadata;
    archived?: boolean;
}): Block => ({
    id: id ?? uuid(),
    name,
    workspaceId: workspaceId,
    type,
    payload,
    archived,
    createdAt: now(),
    updatedAt: now(),
});

export const createContentNode = ({
    workspaceId,
    type,
    data,
    name,
    id,
    children,
    payloadOverride,
    deletable = true,
}: {
    workspaceId: string;
    type: BlockType;
    data?: Record<string, unknown>;
    name?: string;
    id?: string;
    deletable?: boolean;
    children?: ContentNode[];
    payloadOverride?: Metadata;
}): ContentNode => ({
    type: NodeType.CONTENT,
    block: createBlockBase({
        id,
        workspaceId,
        type,
        name,
        payload: payloadOverride ?? createContentMetadata(data, undefined, deletable),
    }),
    children,
    warnings: [],
});

/**
 * Creates a ReferenceNode for entity or block references.
 * Reference nodes are used to embed external entities or other block trees.
 */
export const createReferenceNode = ({
    workspaceId,
    type,
    name,
    id,
    payload,
    deletable = true,
}: {
    workspaceId: string;
    type: BlockType;
    name?: string;
    id?: string;
    payload: EntityReferenceMetadata | BlockReferenceMetadata;
    deletable?: boolean;
}): ReferenceNode => {
    // Create empty reference payload based on metadata type

    const reference: ReferencePayload =
        payload.type === BlockMetadataType.ENTITY_REFERENCE
            ? createBlankEntityReference()
            : createBlankBlockTreeReference();

    return {
        type: NodeType.REFERENCE,
        block: createBlockBase({
            id,
            workspaceId,
            type,
            name,
            payload,
        }),
        reference,
        warnings: [],
    };
};

const createBlankEntityReference = (): EntityReference => ({
    type: ReferenceType.ENTITY,
    reference: [],
});

const createBlankBlockTreeReference = (): BlockReferencePayload => ({
    type: ReferenceType.BLOCK,
    reference: undefined,
});

export const createBlockReference = ({ block }: { block: BlockTree }): BlockReferencePayload => {
    const reference = createReference({
        type: EntityType.BLOCK_TREE,
        entityId: block.root.block.id,
        entity: block,
    });

    return {
        type: ReferenceType.BLOCK,
        reference,
    };
};

export const createReference = ({
    type,
    entityId,
    path,
    order,
    entity,
    warning,
}: {
    type: EntityType;
    entityId: string;
    path?: string;
    order?: number;
    entity: Referenceable;
    warning?: ReferenceWarning;
}): Reference => {
    return {
        id: uuid(),
        entityType: type,
        entityId,
        path,
        orderIndex: order,
        entity,
        warning,
    };
};

export const createBlockType = ({
    key,
    name,
    description,
    workspaceId,
    schema,
    display,
    nesting,
}: {
    key: string;
    name: string;
    description?: string;
    workspaceId: string;
    schema: BlockSchema;
    display: BlockDisplay;
    nesting?: BlockTypeNesting | null;
}): BlockType => ({
    id: uuid(),
    key,
    version: 1,
    name,
    description,
    workspaceId: workspaceId,
    archived: false,
    strictness: BlockValidationScope.SOFT,
    system: false,
    schema,
    display,
    nesting: nesting ?? undefined,
    createdAt: now(),
    updatedAt: now(),
});
