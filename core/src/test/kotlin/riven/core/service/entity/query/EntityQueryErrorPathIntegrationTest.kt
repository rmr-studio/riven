package riven.core.service.entity.query

import kotlinx.coroutines.runBlocking
import riven.core.exceptions.NotFoundException
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import riven.core.exceptions.query.*
import riven.core.exceptions.SchemaValidationException
import riven.core.models.entity.query.*
import java.util.*

/**
 * Integration tests for error paths in EntityQueryService.
 *
 * Tests validation errors for:
 * - Invalid attribute references
 * - Invalid relationship references
 * - Depth exceeded
 * - Entity type not found
 * - Bad pagination parameters
 */
class EntityQueryErrorPathIntegrationTest : EntityQueryIntegrationTestBase() {

    @Test
    fun `test invalid attribute reference throws QueryValidationException`() {
        val randomAttributeId = UUID.randomUUID()

        val query = EntityQuery(
            entityTypeId = companyTypeId,
            filter = QueryFilter.Attribute(
                attributeId = randomAttributeId,
                operator = FilterOperator.EQUALS,
                value = FilterValue.Literal("test")
            )
        )

        val exception = assertThrows<QueryValidationException> {
            runBlocking {
                entityQueryService.execute(query, workspaceId, QueryPagination())
            }
        }

        // Should contain InvalidAttributeReferenceException
        assertTrue(exception.validationErrors.any { it is InvalidAttributeReferenceException })
        val attrError = exception.validationErrors.filterIsInstance<InvalidAttributeReferenceException>().first()
        assertTrue(attrError.attributeId == randomAttributeId)
    }

    @Test
    fun `test invalid relationship reference throws QueryValidationException`() {
        val randomRelationshipId = UUID.randomUUID()

        val query = EntityQuery(
            entityTypeId = companyTypeId,
            filter = QueryFilter.Relationship(
                relationshipId = randomRelationshipId,
                condition = RelationshipCondition.Exists
            )
        )

        val exception = assertThrows<QueryValidationException> {
            runBlocking {
                entityQueryService.execute(query, workspaceId, QueryPagination())
            }
        }

        // Should contain InvalidRelationshipReferenceException
        assertTrue(exception.validationErrors.any { it is InvalidRelationshipReferenceException })
        val relError = exception.validationErrors.filterIsInstance<InvalidRelationshipReferenceException>().first()
        assertTrue(relError.relationshipId == randomRelationshipId)
    }

    @Test
    fun `test depth exceeded throws QueryValidationException`() {
        val query = EntityQuery(
            entityTypeId = companyTypeId,
            filter = QueryFilter.Relationship(
                relationshipId = companyEmployeesRelId,
                condition = RelationshipCondition.TargetMatches(
                    filter = QueryFilter.Relationship(
                        relationshipId = employeeProjectsRelId,
                        condition = RelationshipCondition.Exists
                    )
                )
            ),
            maxDepth = 1 // Only allow 1 level, but we have 2
        )

        val exception = assertThrows<QueryValidationException> {
            runBlocking {
                entityQueryService.execute(query, workspaceId, QueryPagination())
            }
        }

        // Should contain RelationshipDepthExceededException
        assertTrue(exception.validationErrors.any { it is RelationshipDepthExceededException })
        val depthError = exception.validationErrors.filterIsInstance<RelationshipDepthExceededException>().first()
        assertTrue(depthError.depth == 2)
        assertTrue(depthError.maxDepth == 1)
    }

    @Test
    fun `test entity type not found throws NotFoundException`() {
        val randomTypeId = UUID.randomUUID()

        val query = EntityQuery(entityTypeId = randomTypeId)

        assertThrows<NotFoundException> {
            runBlocking {
                entityQueryService.execute(query, workspaceId, QueryPagination())
            }
        }
    }

    @Test
    fun `test bad pagination limit throws SchemaValidationException`() {
        val query = EntityQuery(entityTypeId = companyTypeId)

        assertThrows<SchemaValidationException> {
            runBlocking {
                entityQueryService.execute(
                    query,
                    workspaceId,
                    QueryPagination(limit = 0, offset = 0)
                )
            }
        }
    }

    @Test
    fun `test bad pagination offset throws SchemaValidationException`() {
        val query = EntityQuery(entityTypeId = companyTypeId)

        assertThrows<SchemaValidationException> {
            runBlocking {
                entityQueryService.execute(
                    query,
                    workspaceId,
                    QueryPagination(limit = 10, offset = -1)
                )
            }
        }
    }
}
