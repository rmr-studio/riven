package riven.core.entity.workflow

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import org.hibernate.annotations.Type
import riven.core.entity.util.AuditableEntity
import riven.core.enums.workflow.WorkflowNodeType
import riven.core.models.common.SoftDeletable
import riven.core.models.workflow.WorkflowNode
import java.time.ZonedDateTime
import java.util.*

/**
 * JPA entity for storing workflow nodes with polymorphic configuration.
 *
 * The `config` field stores the complete WorkflowNode as JSONB, which is deserialized
 * to the correct concrete type (e.g., WorkflowScheduleTriggerNode) by WorkflowNodeDeserializer.
 *
 * This entity uses immutable copy-on-write versioning pattern (like BlockTypeEntity):
 * - Creating: version=1, source_id=null
 * - Updating: Creates new row with version++, source_id points to original
 *
 * @see WorkflowNode
 * @see riven.core.deserializer.WorkflowNodeDeserializer
 */
@Entity
@Table(
    name = "workflow_nodes",
    uniqueConstraints = [
        UniqueConstraint(
            name = "uq_workflow_nodes_workspace_key_version",
            columnNames = ["workspace_id", "key", "version"]
        )
    ],
    indexes = [
        Index(name = "idx_workflow_nodes_workspace_id", columnList = "workspace_id"),
        Index(name = "idx_workflow_nodes_type", columnList = "workspace_id, type"),
        Index(name = "idx_workflow_nodes_source_id", columnList = "workspace_id, source_id"),
        Index(name = "idx_workflow_nodes_key", columnList = "workspace_id, key"),
    ]
)
data class WorkflowNodeEntity(

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Column(name = "workspace_id", nullable = false, columnDefinition = "uuid")
    val workspaceId: UUID? = null,

    @Column(name = "key", nullable = false)
    val key: String,

    @Column(name = "name", nullable = false)
    val name: String,

    @Column(name = "description", nullable = true)
    val description: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    val type: WorkflowNodeType,

    @Column(name = "version", nullable = false)
    val version: Int = 1,

    @Column(name = "source_id", columnDefinition = "uuid", nullable = true)
    val sourceId: UUID? = null,

    @Type(JsonBinaryType::class)
    @Column(name = "config", columnDefinition = "jsonb", nullable = false)
    val config: WorkflowNode,

    @Column(name = "system", nullable = false)
    val system: Boolean = false,

    @Column(name = "deleted", nullable = false, columnDefinition = "boolean default false")
    override var deleted: Boolean = false,

    @Column(name = "deleted_at", nullable = true)
    override var deletedAt: ZonedDateTime? = null

) : AuditableEntity(), SoftDeletable {

    /**
     * Converts this entity to a domain WorkflowNode model.
     *
     * The config field contains the fully deserialized WorkflowNode subtype
     * (e.g., WorkflowScheduleTriggerNode, WorkflowEntityEventTriggerNode, etc.)
     * thanks to the WorkflowNodeDeserializer.
     *
     * @return The deserialized WorkflowNode with all type-specific properties
     * @throws IllegalArgumentException if the entity's id is null
     */
    fun toModel(): WorkflowNode {
        requireNotNull(this.id) { "WorkflowNodeEntity ID cannot be null when converting to model" }

        // The config field already contains the correct concrete type!
        // WorkflowNodeDeserializer has already routed to the correct class.
        return this.config
    }

    companion object {
        /**
         * Creates a WorkflowNodeEntity from a WorkflowNode model.
         *
         * @param workspaceId The workspace this node belongs to
         * @param key Unique identifier for this node within the workspace
         * @param name Human-readable name
         * @param description Optional description
         * @param node The WorkflowNode model (will be serialized to config JSONB)
         * @param system Whether this is a system node
         * @return A WorkflowNodeEntity ready to persist
         */
        fun fromModel(
            workspaceId: UUID?,
            key: String,
            name: String,
            description: String?,
            node: WorkflowNode,
            system: Boolean = false
        ): WorkflowNodeEntity {
            return WorkflowNodeEntity(
                workspaceId = workspaceId,
                key = key,
                name = name,
                description = description,
                type = node.type,
                version = node.version,
                config = node, // Serialized to JSONB automatically
                system = system
            )
        }

        /**
         * Creates a new version of an existing node (copy-on-write pattern).
         *
         * @param original The original WorkflowNodeEntity
         * @param updatedNode The updated WorkflowNode model
         * @return A new WorkflowNodeEntity with incremented version and source_id set
         */
        fun createNewVersion(
            original: WorkflowNodeEntity,
            updatedNode: WorkflowNode
        ): WorkflowNodeEntity {
            return original.copy(
                id = null, // New entity, let JPA generate new ID
                version = original.version + 1,
                sourceId = original.id, // Link back to original
                config = updatedNode,
                deleted = false,
                deletedAt = null
            )
        }
    }
}