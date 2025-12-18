package riven.core.service.util.factory.block

import riven.core.entity.block.BlockChildEntity
import riven.core.entity.block.BlockEntity
import riven.core.entity.block.BlockTreeLayoutEntity
import riven.core.entity.block.BlockTypeEntity
import riven.core.enums.block.node.NodeType
import riven.core.enums.common.SchemaType
import riven.core.enums.common.ValidationScope
import riven.core.enums.core.ComponentType
import riven.core.models.block.Block
import riven.core.models.block.BlockType
import riven.core.models.block.display.BlockComponentNode
import riven.core.models.block.display.BlockDisplay
import riven.core.models.block.display.BlockRenderStructure
import riven.core.models.block.display.BlockTypeNesting
import riven.core.models.block.layout.TreeLayout
import riven.core.models.block.metadata.BlockContentMetadata
import riven.core.models.block.metadata.BlockMeta
import riven.core.models.block.operation.*
import riven.core.models.block.tree.ContentNode
import riven.core.models.block.tree.Node
import riven.core.models.common.grid.GridRect
import riven.core.models.common.grid.LayoutGrid
import riven.core.models.common.structure.FormStructure
import riven.core.models.common.validation.Schema
import riven.core.models.request.block.SaveEnvironmentRequest
import riven.core.models.request.block.StructuralOperationRequest
import java.time.ZonedDateTime
import java.util.*

object BlockFactory {

    fun createComponent(): BlockComponentNode = BlockComponentNode(
        id = "component_1",
        type = ComponentType.CONTACT_CARD,
        props = mapOf(
            "title" to "Contact Card",
            "showEmail" to true
        )
    )

    fun createType(
        orgId: UUID,
        key: String = "contact_card",
        version: Int = 1,
        strictness: ValidationScope = ValidationScope.SOFT,
        schema: Schema = Schema(
            key = SchemaType.OBJECT
        ),
        archived: Boolean = false,
        nesting: BlockTypeNesting = BlockTypeNesting(
            max = null,
            allowedTypes = listOf("contact_card")
        )
    ): BlockTypeEntity = BlockTypeEntity(
        id = UUID.randomUUID(),
        key = key,
        displayName = "Contact",
        description = "Contact type",
        organisationId = orgId,
        system = false,
        version = version,
        strictness = strictness,
        schema = schema,
        archived = archived,
        displayStructure = BlockDisplay(
            form = FormStructure(emptyMap()),
            render = BlockRenderStructure(
                version = 1,
                layoutGrid = LayoutGrid(
                    layout = GridRect(
                        x = 0,
                        y = 0,
                        width = 12,
                        height = 12,
                        locked = false,
                        margin = null
                    ),
                    items = emptyList()
                ),
                components = emptyMap()
            )
        ),
        nesting = nesting
    )

    fun createBlock(
        id: UUID,
        orgId: UUID,
        type: BlockTypeEntity,
    ): BlockEntity = BlockEntity(
        id = id,
        organisationId = orgId,
        type = type,
        name = "Test Block",
        payload = BlockContentMetadata(data = emptyMap(), meta = BlockMeta()),
        archived = false
    )


    /**
     * Creates a default root schema for a block.
     *
     * @return A BlockSchema whose name is "root".
     */
    fun generateSchema(): Schema = Schema(
        key = SchemaType.OBJECT,
    )

    /**
     * Creates a default BlockDisplay with an empty form structure and a text render.
     *
     * @return A BlockDisplay whose form is an empty FormStructure and whose render is a BlockRenderStructure using `ComponentType.TEXT` with no properties.
     */
    fun generateDisplay(): BlockDisplay = BlockDisplayFactory.display(
        render = BlockDisplayFactory.contactWithAccountSummary()
    )

    /**
     * Creates a simple Block model for testing.
     */
    fun createBlockModel(
        id: UUID = UUID.randomUUID(),
        orgId: UUID,
        type: BlockType,
        name: String? = "Test Block",
        payload: BlockContentMetadata = BlockContentMetadata(data = emptyMap(), meta = BlockMeta()),
        archived: Boolean = false
    ): Block = Block(
        id = id,
        name = name,
        organisationId = orgId,
        type = type,
        payload = payload,
        archived = archived
    )

    /**
     * Creates a simple ContentNode for testing.
     */
    fun createNode(
        orgId: UUID,
        blockId: UUID = UUID.randomUUID(),
        type: BlockType,
        name: String? = "Test Node",
        children: List<Node>? = null
    ): ContentNode = ContentNode(
        type = NodeType.CONTENT,
        block = createBlockModel(
            id = blockId,
            orgId = orgId,
            type = type,
            name = name
        ),
        children = children
    )

    /**
     * Creates an AddBlockOperation for testing.
     */
    fun createAddOperation(
        blockId: UUID = UUID.randomUUID(),
        orgId: UUID,
        type: BlockType,
        parentId: UUID? = null,
        index: Int? = null
    ): AddBlockOperation = AddBlockOperation(
        blockId = blockId,
        block = createNode(orgId = orgId, blockId = blockId, type = type),
        parentId = parentId,
        index = index
    )

    /**
     * Creates a RemoveBlockOperation for testing.
     */
    fun createRemoveOperation(
        blockId: UUID,
        parentId: UUID? = null,
        childrenIds: Map<UUID, UUID> = emptyMap()
    ): RemoveBlockOperation = RemoveBlockOperation(
        blockId = blockId,
        parentId = parentId,
        childrenIds = childrenIds
    )

    /**
     * Creates an UpdateBlockOperation for testing.
     */
    fun createUpdateOperation(
        blockId: UUID,
        orgId: UUID,
        type: BlockType
    ): UpdateBlockOperation = UpdateBlockOperation(
        blockId = blockId,
        updatedContent = createNode(orgId = orgId, blockId = blockId, type = type)
    )

    /**
     * Creates a MoveBlockOperation for testing.
     */
    fun createMoveOperation(
        blockId: UUID,
        fromParentId: UUID? = null,
        toParentId: UUID? = null
    ): MoveBlockOperation = MoveBlockOperation(
        blockId = blockId,
        fromParentId = fromParentId,
        toParentId = toParentId
    )

    /**
     * Creates a ReorderBlockOperation for testing.
     */
    fun createReorderOperation(
        blockId: UUID,
        parentId: UUID,
        fromIndex: Int,
        toIndex: Int
    ): ReorderBlockOperation = ReorderBlockOperation(
        blockId = blockId,
        parentId = parentId,
        fromIndex = fromIndex,
        toIndex = toIndex
    )

    /**
     * Creates a StructuralOperationRequest for testing.
     */
    fun createOperationRequest(
        operation: BlockOperation,
        timestamp: ZonedDateTime = ZonedDateTime.now(),
        id: UUID = UUID.randomUUID()
    ): StructuralOperationRequest = StructuralOperationRequest(
        id = id,
        timestamp = timestamp,
        data = operation
    )

    /**
     * Creates a BlockTreeLayoutEntity for testing.
     */
    fun createTreeLayoutEntity(
        id: UUID? = UUID.randomUUID(),
        entityId: UUID = UUID.randomUUID(),
        organisationId: UUID,
        version: Int = 1,
        layout: TreeLayout = TreeLayout()
    ): BlockTreeLayoutEntity = BlockTreeLayoutEntity(
        id = id,
        entityId = entityId,
        organisationId = organisationId,
        version = version,
        layout = layout
    )

    /**
     * Creates a BlockChildEntity for testing.
     */
    fun createBlockChildEntity(
        parentId: UUID,
        childId: UUID,
        orderIndex: Int = 0
    ): BlockChildEntity = BlockChildEntity(
        id = UUID.randomUUID(),
        parentId = parentId,
        childId = childId,
        orderIndex = orderIndex
    )

    /**
     * Creates a SaveEnvironmentRequest for testing.
     */
    fun createSaveEnvironmentRequest(
        layoutId: UUID,
        organisationId: UUID,
        operations: List<StructuralOperationRequest>,
        version: Int = 1,
        layout: TreeLayout = TreeLayout(),
        force: Boolean = false
    ): SaveEnvironmentRequest = SaveEnvironmentRequest(
        layoutId = layoutId,
        organisationId = organisationId,
        layout = layout,
        version = version,
        operations = operations,
    )

    /**
     * Creates a BlockTypeEntity for testing (alias for createType).
     */
    fun createTypeEntity(
        orgId: UUID,
        key: String = "test_block",
        version: Int = 1
    ): BlockTypeEntity = createType(orgId = orgId, key = key, version = version)

    /**
     * Creates a BlockEntity for testing (alias for createBlock).
     */
    fun createBlockEntity(
        id: UUID = UUID.randomUUID(),
        organisationId: UUID,
        type: BlockTypeEntity
    ): BlockEntity = createBlock(id = id, orgId = organisationId, type = type)
}
