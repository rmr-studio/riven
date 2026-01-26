// Re-export core block model types from generated code

export type {
    // Core block types
    Block,
    BlockType,
    BlockDisplay,
    BlockBinding,
    BlockBindingSource,
    BlockComponentNode,
    BlockMeta,
    BlockPayload,
    BlockTypeNesting,
    BlockRenderStructure,
    BlockSchema,
    ComponentType,

    // Tree types
    BlockTree,
    BlockTreeRoot,
    BlockTreeLayout,
    BlockTreeReference,
    BlockEnvironment,
    TreeLayout,
    TreeLayoutColumn,

    // Node types
    Node,
    ContentNode,
    ReferenceNode,

    // Metadata types
    BlockContentMetadata,
    BlockReferenceMetadata,
    EntityReferenceMetadata,
    Metadata,
    ReferenceMetadata,

    // Reference types
    EntityReference,
    ReferenceItem,
    ReferenceItemBlockTree,
    ReferenceItemEntity,
    ReferencePayload,
    ReferenceType,

    // Layout types
    GridRect,
    LayoutGrid,
    LayoutGridItem,
    Widget,
    BreakpointConfig,
    ColumnOptions,
    DraggableOptions,
    ResizableOptions,

    // Configuration types
    BlockListConfiguration,
    ListConfig,
    ListDisplayConfig,
    FormStructure,
    FormWidgetConfig,
    RenderContent,
    Presentation,
    ThemeTokens,

    // Operations
    BlockOperation,
    BlockOperationType,
    AddBlockOperation,
    AddBlockOperationAllOfBlock,
    RemoveBlockOperation,
    MoveBlockOperation,
    UpdateBlockOperation,
    UpdateBlockOperationAllOfUpdatedContent,
    ReorderBlockOperation,
    StructuralOperationRequest,
    StructuralOperationRequestData,

    // Hydration
    BlockHydrationResult,
    HydrateBlocksRequest,
    BlockFetchPolicy,
    BlockReferenceFetchPolicy,
    BlockReferenceWarning,

    // Save environment
    SaveEnvironmentRequest,
    SaveEnvironmentResponse,

    // Binding
    BindingSource,
    Computed,
    Condition,
    ConditionLeft,
    DataPath,
    FilterSpec,
    ListFilterLogicType,
    Op,
    Operand,
    Option,
    OptionSortingType,
    PagingSpec,
    Path,
    Projection,
    SortDir,
    SortSpec,
    ValidationScope,
    Value,
} from "@/lib/types/models";
