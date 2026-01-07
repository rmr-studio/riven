package riven.core.service.block

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.block.BlockTreeLayoutEntity
import riven.core.entity.block.BlockTypeEntity
import riven.core.enums.block.layout.RenderType
import riven.core.enums.block.node.NodeType
import riven.core.enums.block.node.SystemBlockTypes
import riven.core.enums.core.ApplicationEntityType
import riven.core.models.block.layout.RenderContent
import riven.core.models.block.layout.TreeLayout
import riven.core.models.block.layout.Widget
import riven.core.models.block.layout.options.BreakpointConfig
import riven.core.models.block.layout.options.ColumnOptions
import riven.core.models.block.layout.options.DraggableOptions
import riven.core.models.block.layout.options.ResizableOptions
import riven.core.models.block.metadata.EntityReferenceMetadata
import riven.core.models.block.metadata.ReferenceItem
import riven.core.models.block.tree.BlockTreeLayout
import riven.core.models.request.block.CreateBlockRequest
import riven.core.repository.block.BlockTreeLayoutRepository
import java.util.*

/**
 * Service for creating default block environments for entities.
 * Handles lazy initialization of block layouts when entities are first accessed.
 */
@Service
class DefaultBlockEnvironmentService(
    private val blockTreeLayoutRepository: BlockTreeLayoutRepository,
    private val blockService: BlockService,
    private val blockTypeService: BlockTypeService
) {

    /**
     * Creates a default block environment for an entity.
     * This includes:
     * 1. A default TreeLayout with Gridstack configuration
     * 2. A reference block (marked as non-deletable)
     * 3. Optional starter blocks (to be implemented)
     *
     * @param entityId The ID of the entity (e.g., client ID)
     * @param entityType The type of entity (e.g., CLIENT, WORKSPACE)
     * @param workspaceId The workspace this entity belongs to
     * @return The created BlockTreeLayout model
     */
    @Transactional
    fun createDefaultEnvironmentForEntity(
        entityId: UUID,
        entityType: ApplicationEntityType,
        workspaceId: UUID
    ): BlockTreeLayout {
        val defaultLayout = buildDefaultLayoutForEntityType(workspaceId, entityId, entityType)

        // Persist layout entity
        val layoutEntity = BlockTreeLayoutEntity(
            entityId = entityId,
            workspaceId = workspaceId,
            layout = defaultLayout,
            version = 1
        )

        return blockTreeLayoutRepository.save(layoutEntity).toModel()
    }

    /**
     * Builds a default TreeLayout structure based on entity type.
     * Currently returns an empty layout with grid configuration.
     *
     * TODO: Implement reference block and starter blocks creation
     * TODO: Add entity-specific layout templates
     */
    private fun buildDefaultLayoutForEntityType(
        workspaceId: UUID,
        entityId: UUID,
        entityType: ApplicationEntityType
    ): TreeLayout {
        return when (entityType) {

            ApplicationEntityType.WORKSPACE -> buildDefaultWorkspaceLayout(entityId)
            ApplicationEntityType.USER -> buildDefaultUserLayout(entityId)
            ApplicationEntityType.ENTITY -> buildDefaultEntityLayout(entityId)
            else -> buildGenericDefaultLayout(entityId)
        }
    }


    /**
     * Builds default layout for WORKSPACE entities.
     */
    private fun buildDefaultWorkspaceLayout(entityId: UUID): TreeLayout {
        // Similar structure to client layout
        return buildGenericDefaultLayout(entityId)
    }

    /**
     * Builds default layout for USER entities (ie. Members of an workspace).
     * They would also have an associated Entity type. that may have direct relationship with
     * other entities. So we would need to add reference blocks for those relationships as well.
     */
    private fun buildDefaultUserLayout(entityId: UUID): TreeLayout {
        return buildGenericDefaultLayout(entityId)
    }

    /**
     * Builds default layout for all custom ENTITY entities.
     * This would involve creating supporting entity reference blocks for each relationship
     * The entity has with other entities.
     */
    private fun buildDefaultEntityLayout(entityId: UUID): TreeLayout {
        return buildGenericDefaultLayout(entityId)
    }

    /**
     * Generic default layout template used as fallback.
     */
    private fun buildGenericDefaultLayout(entityId: UUID): TreeLayout {
        return TreeLayout(
            resizable = ResizableOptions(handles = "se, sw"),
            draggable = DraggableOptions(cancel = ".block-no-drag", pause = 5),
            cellHeight = 25,
            column = 23,
            columnOpts = ColumnOptions(
                breakpoints = listOf(
                    BreakpointConfig(width = 1024, columns = 12),
                    BreakpointConfig(width = 768, columns = 1)
                )
            ),
            animate = true,
            acceptWidgets = true,
            children = null  // Empty layout initially
        )
    }

    /**
     * Creates a reference block widget for the layout.
     * Reference blocks display entity data and are marked as non-deletable.
     *
     */
    private fun createEntityReferenceWidget(
        workspaceId: UUID,
        entityId: UUID,
    ): Widget {
        val type: BlockTypeEntity = blockTypeService.getSystemBlockType(SystemBlockTypes.ENTITY_REFERENCE)
        val payload = EntityReferenceMetadata(
            deletable = false,
            readonly = true,
            items = listOf(
                ReferenceItem(
                    id = entityId
                )
            )
        )
        val name = "Entity Overview"
        return blockService.createBlock(
            workspaceId,
            CreateBlockRequest(
                type = type.toModel(),
                payload = payload,
                name = name,
                parentId = null,
                index = null
            )
        ).let {
            val id = requireNotNull(it.id)
            Widget(
                id = id.toString(),
                x = 0,
                y = 0,
                w = 12,
                h = 6,
                locked = false,
                content = RenderContent(
                    id = id.toString(),
                    key = "reference",
                    renderType = RenderType.COMPONENT,
                    blockType = NodeType.REFERENCE
                )
            )
        }
    }

}
