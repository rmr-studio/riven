package riven.core.service.block

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import riven.core.entity.block.BlockTreeLayoutEntity
import riven.core.entity.block.BlockTypeEntity
import riven.core.enums.block.layout.RenderType
import riven.core.enums.block.node.NodeType
import riven.core.enums.block.node.SystemBlockTypes
import riven.core.enums.core.EntityType
import riven.core.models.block.layout.RenderContent
import riven.core.models.block.layout.TreeLayout
import riven.core.models.block.layout.Widget
import riven.core.models.block.layout.options.BreakpointConfig
import riven.core.models.block.layout.options.ColumnOptions
import riven.core.models.block.layout.options.DraggableOptions
import riven.core.models.block.layout.options.ResizableOptions
import riven.core.models.block.metadata.EntityReferenceMetadata
import riven.core.models.block.metadata.ReferenceItem
import riven.core.models.block.request.CreateBlockRequest
import riven.core.models.block.tree.BlockTreeLayout
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
     * @param entityType The type of entity (e.g., CLIENT, ORGANISATION)
     * @param organisationId The organisation this entity belongs to
     * @return The created BlockTreeLayout model
     */
    @Transactional
    fun createDefaultEnvironmentForEntity(
        entityId: UUID,
        entityType: EntityType,
        organisationId: UUID
    ): BlockTreeLayout {
        val defaultLayout = buildDefaultLayoutForEntityType(organisationId, entityId, entityType)

        // Persist layout entity
        val layoutEntity = BlockTreeLayoutEntity(
            entityId = entityId,
            entityType = entityType,
            organisationId = organisationId,
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
        organisationId: UUID,
        entityId: UUID,
        entityType: EntityType
    ): TreeLayout {
        return when (entityType) {
            EntityType.CLIENT -> buildDefaultClientLayout(organisationId, entityId)
            EntityType.ORGANISATION -> buildDefaultOrganisationLayout(entityId)
            EntityType.PROJECT -> buildDefaultProjectLayout(entityId)
            EntityType.INVOICE -> buildDefaultInvoiceLayout(entityId)
            else -> buildGenericDefaultLayout(entityId)
        }
    }

    /**
     * Builds default layout for CLIENT entities.
     *
     * Layout structure:
     * - Reference block at top (full width)
     * - Empty space for user-added blocks
     */
    private fun buildDefaultClientLayout(organisationId: UUID, entityId: UUID): TreeLayout {
        val widgets = mutableListOf<Widget>()

        // TODO: Create actual reference block and add to widgets
        // For now, return empty layout with proper grid configuration
        createEntityReferenceWidget(organisationId, entityId, EntityType.CLIENT).also {
            widgets.add(it)
        }

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
            children = widgets.ifEmpty { null }
        )
    }

    /**
     * Builds default layout for ORGANISATION entities.
     */
    private fun buildDefaultOrganisationLayout(entityId: UUID): TreeLayout {
        // Similar structure to client layout
        return buildGenericDefaultLayout(entityId)
    }

    /**
     * Builds default layout for PROJECT entities.
     */
    private fun buildDefaultProjectLayout(entityId: UUID): TreeLayout {
        return buildGenericDefaultLayout(entityId)
    }

    /**
     * Builds default layout for INVOICE entities.
     */
    private fun buildDefaultInvoiceLayout(entityId: UUID): TreeLayout {
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
     * TODO: Implement actual block creation
     * TODO: Store deletable=false metadata
     */
    private fun createEntityReferenceWidget(
        organisationId: UUID,
        entityId: UUID,
        entityType: EntityType
    ): Widget {
        val type: BlockTypeEntity = blockTypeService.getSystemBlockType(SystemBlockTypes.ENTITY_REFERENCE)
        val payload = EntityReferenceMetadata(
            deletable = false,
            readonly = true,
            items = listOf(
                ReferenceItem(
                    type = entityType,
                    id = entityId
                )
            )
        )
        val name = "${entityType.name} Overview"
        return blockService.createBlock(
            organisationId,
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
