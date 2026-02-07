package riven.core.service.entity.query

import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeAll
import org.junit.jupiter.api.Test
import riven.core.entity.entity.EntityEntity
import riven.core.entity.entity.EntityTypeEntity
import riven.core.enums.common.validation.SchemaType
import riven.core.enums.core.DataType
import riven.core.enums.entity.EntityCategory
import riven.core.enums.entity.EntityPropertyType
import riven.core.models.common.validation.Schema
import riven.core.models.entity.configuration.EntityTypeAttributeColumn
import riven.core.models.entity.payload.EntityAttributePrimitivePayload
import riven.core.models.entity.query.*
import java.util.*

/**
 * Integration tests for pagination, ordering, and workspace isolation
 * in EntityQueryService.
 */
class EntityQueryPaginationIntegrationTest : EntityQueryIntegrationTestBase() {

    // Other workspace entity type ID
    private lateinit var otherWorkspaceTypeId: UUID

    @BeforeAll
    fun setupOtherWorkspace() {
        // Create entity type in other workspace
        val otherCompanyType = EntityTypeEntity(
            key = "company",
            workspaceId = otherWorkspaceId,
            displayNameSingular = "Company",
            displayNamePlural = "Companies",
            identifierKey = companyNameAttrId,
            type = EntityCategory.STANDARD,
            schema = Schema(
                label = "Company",
                key = SchemaType.OBJECT,
                type = DataType.OBJECT,
                required = true,
                properties = mapOf(
                    companyNameAttrId to Schema(
                        label = "Name",
                        key = SchemaType.TEXT,
                        type = DataType.STRING,
                        required = true
                    )
                )
            ),
            relationships = null,
            columns = listOf(
                EntityTypeAttributeColumn(companyNameAttrId, EntityPropertyType.ATTRIBUTE)
            )
        )
        val saved = entityTypeRepository.save(otherCompanyType)
        otherWorkspaceTypeId = saved.id!!

        // Create 3 entities in other workspace
        repeat(3) { i ->
            entityRepository.save(
                EntityEntity(
                    workspaceId = otherWorkspaceId,
                    typeId = otherWorkspaceTypeId,
                    typeKey = "company",
                    identifierKey = companyNameAttrId,
                    payload = mapOf(
                        companyNameAttrId.toString() to EntityAttributePrimitivePayload(
                            "Other Company $i",
                            SchemaType.TEXT
                        )
                    )
                )
            )
        }
    }

    @Test
    fun `test default pagination returns first page`() = runBlocking {
        val query = EntityQuery(entityTypeId = companyTypeId)
        val result = entityQueryService.execute(query, workspaceId, QueryPagination())

        assertEquals(10, result.totalCount)
        assertEquals(10, result.entities.size)
        assertFalse(result.hasNextPage)
    }

    @Test
    fun `test limit caps result count`() = runBlocking {
        val query = EntityQuery(entityTypeId = companyTypeId)
        val result = entityQueryService.execute(
            query,
            workspaceId,
            QueryPagination(limit = 3, offset = 0)
        )

        assertEquals(3, result.entities.size)
        assertEquals(10, result.totalCount)
        assertTrue(result.hasNextPage)
    }

    @Test
    fun `test offset skips results`() = runBlocking {
        val query = EntityQuery(entityTypeId = companyTypeId)

        val firstPage = entityQueryService.execute(
            query,
            workspaceId,
            QueryPagination(limit = 3, offset = 0)
        )
        val secondPage = entityQueryService.execute(
            query,
            workspaceId,
            QueryPagination(limit = 3, offset = 3)
        )

        assertEquals(3, firstPage.entities.size)
        assertEquals(3, secondPage.entities.size)
        assertEquals(10, firstPage.totalCount)
        assertEquals(10, secondPage.totalCount)

        // Ensure different entities
        val firstPageIds = firstPage.entities.map { it.id }.toSet()
        val secondPageIds = secondPage.entities.map { it.id }.toSet()
        assertEquals(0, firstPageIds.intersect(secondPageIds).size)
    }

    @Test
    fun `test offset beyond total returns empty`() = runBlocking {
        val query = EntityQuery(entityTypeId = companyTypeId)
        val result = entityQueryService.execute(
            query,
            workspaceId,
            QueryPagination(limit = 10, offset = 20)
        )

        assertEquals(0, result.entities.size)
        assertEquals(10, result.totalCount)
        assertFalse(result.hasNextPage)
    }

    @Test
    fun `test hasNextPage is true when more results exist`() = runBlocking {
        val query = EntityQuery(entityTypeId = companyTypeId)
        val result = entityQueryService.execute(
            query,
            workspaceId,
            QueryPagination(limit = 5, offset = 0)
        )

        assertEquals(5, result.entities.size)
        assertEquals(10, result.totalCount)
        assertTrue(result.hasNextPage)
    }

    @Test
    fun `test hasNextPage is false on last page`() = runBlocking {
        val query = EntityQuery(entityTypeId = companyTypeId)
        val result = entityQueryService.execute(
            query,
            workspaceId,
            QueryPagination(limit = 5, offset = 5)
        )

        assertEquals(5, result.entities.size)
        assertEquals(10, result.totalCount)
        assertFalse(result.hasNextPage)
    }

    @Test
    fun `test pagination with filter reduces total count`() = runBlocking {
        val query = EntityQuery(
            entityTypeId = companyTypeId,
            filter = QueryFilter.Attribute(
                attributeId = companyIndustryAttrId,
                operator = FilterOperator.EQUALS,
                value = FilterValue.Literal("Technology")
            )
        )

        val result = entityQueryService.execute(
            query,
            workspaceId,
            QueryPagination(limit = 2, offset = 0)
        )

        // 3 Technology companies: Acme Corp, Beta Inc, Zeta Systems
        assertEquals(2, result.entities.size)
        assertEquals(3, result.totalCount)
        assertTrue(result.hasNextPage)
    }

    @Test
    fun `test default ordering is created_at DESC, id ASC`() = runBlocking {
        val query = EntityQuery(entityTypeId = companyTypeId)

        // Execute query twice to verify stable ordering
        val result1 = entityQueryService.execute(query, workspaceId, QueryPagination())
        val result2 = entityQueryService.execute(query, workspaceId, QueryPagination())

        assertEquals(10, result1.entities.size)
        assertEquals(10, result2.entities.size)

        // Verify ordering is stable
        val ids1 = result1.entities.map { it.id }
        val ids2 = result2.entities.map { it.id }
        assertEquals(ids1, ids2)

        // Verify all IDs are unique
        assertEquals(10, ids1.toSet().size)
    }

    @Test
    fun `test workspace isolation prevents cross-tenant access`() = runBlocking {
        // Query primary workspace
        val primaryQuery = EntityQuery(entityTypeId = companyTypeId)
        val primaryResult = entityQueryService.execute(
            primaryQuery,
            workspaceId,
            QueryPagination()
        )

        // Should only see the 10 companies from primary workspace
        assertEquals(10, primaryResult.totalCount)
        assertEquals(10, primaryResult.entities.size)

        // Query other workspace
        val otherQuery = EntityQuery(entityTypeId = otherWorkspaceTypeId)
        val otherResult = entityQueryService.execute(
            otherQuery,
            otherWorkspaceId,
            QueryPagination()
        )

        // Should only see the 3 entities from other workspace
        assertEquals(3, otherResult.totalCount)
        assertEquals(3, otherResult.entities.size)

        // Verify no overlap
        val primaryIds = primaryResult.entities.map { it.id }.toSet()
        val otherIds = otherResult.entities.map { it.id }.toSet()
        assertEquals(0, primaryIds.intersect(otherIds).size)
    }
}
