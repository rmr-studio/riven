package riven.core.service.identity

import io.github.oshai.kotlinlogging.KLogger
import jakarta.persistence.EntityManager
import jakarta.persistence.Query
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.bean.override.mockito.MockitoBean
import riven.core.enums.common.validation.SchemaType
import riven.core.enums.identity.MatchSignalType
import riven.core.service.util.factory.identity.IdentityFactory
import java.util.UUID

@SpringBootTest(classes = [IdentityMatchCandidateService::class, IdentityNormalizationService::class])
class IdentityMatchCandidateServiceTest {

    @MockitoBean
    private lateinit var entityManager: EntityManager

    @MockitoBean
    private lateinit var normalizationService: IdentityNormalizationService

    @MockitoBean
    private lateinit var logger: KLogger

    @Autowired
    private lateinit var identityMatchCandidateService: IdentityMatchCandidateService

    private val triggerEntityId = UUID.fromString("11111111-0000-0000-0000-000000000001")
    private val workspaceId = UUID.fromString("22222222-0000-0000-0000-000000000002")
    private val candidateEntityId = UUID.fromString("33333333-0000-0000-0000-000000000003")
    private val candidateAttributeId = UUID.fromString("44444444-0000-0000-0000-000000000004")

    @BeforeEach
    fun setupNormalizationDefault() {
        // By default, normalization returns trimmed lowercase — preserves existing test behavior
        whenever(normalizationService.normalize(any(), any())).thenAnswer { invocation ->
            invocation.arguments[0].toString().trim().lowercase()
        }
    }

    // ------ Shared mock helpers ------

    /**
     * Creates a mock Query that returns an empty list — represents a trigger entity with no IDENTIFIER attributes.
     */
    private fun emptyQuery(): Query = mock<Query>().also {
        whenever(it.setParameter(any<String>(), any())).thenReturn(it)
        whenever(it.resultList).thenReturn(emptyList<Any>())
    }

    /**
     * Creates a mock Query for trigger identifier attribute lookup.
     *
     * Returns rows for the private queryTriggerIdentifierAttributes method.
     * Each row is Array<Any>: [attributeId, attrValue, schemaType]
     */
    private fun triggerAttributeQuery(rows: List<Array<Any>>): Query = mock<Query>().also {
        whenever(it.setParameter(any<String>(), any())).thenReturn(it)
        whenever(it.resultList).thenReturn(rows)
    }

    /**
     * Creates a mock Query for the candidate similarity search.
     *
     * Each row is Array<Any>: [candidateEntityId, candidateAttributeId, candidateValue, simScore]
     */
    private fun candidateQuery(rows: List<Array<Any>>): Query = mock<Query>().also {
        whenever(it.setParameter(any<String>(), any())).thenReturn(it)
        whenever(it.resultList).thenReturn(rows)
    }

    // ------ findCandidates tests ------

    @Nested
    inner class FindCandidatesTests {

        @Test
        fun `findCandidates returns empty list when trigger entity has no IDENTIFIER attributes`() {
            val emptyTriggerQuery = emptyQuery()
            whenever(entityManager.createNativeQuery(any())).thenReturn(emptyTriggerQuery)

            val result = identityMatchCandidateService.findCandidates(triggerEntityId, workspaceId)

            assertTrue(result.isEmpty(), "Expected empty result when no IDENTIFIER attributes")
            // Only the trigger attribute query should be called — no candidate queries
            verify(entityManager, times(1)).createNativeQuery(any())
        }

        @Test
        fun `findCandidates calls candidate native query once per non-phone IDENTIFIER attribute`() {
            val attrId1 = UUID.randomUUID()
            val triggerRows = listOf(
                arrayOf<Any>(attrId1, "test@example.com", SchemaType.EMAIL.name),
            )
            val triggerQuery = triggerAttributeQuery(triggerRows)
            val candidateQ1 = candidateQuery(emptyList())

            whenever(entityManager.createNativeQuery(any()))
                .thenReturn(triggerQuery)   // first call: trigger identifier lookup
                .thenReturn(candidateQ1)    // second call: candidate scan for EMAIL

            identityMatchCandidateService.findCandidates(triggerEntityId, workspaceId)

            // 1 trigger lookup + 1 candidate query for EMAIL
            verify(entityManager, times(2)).createNativeQuery(any())
        }

        @Test
        fun `findCandidates calls both trigram and exact-digits queries for PHONE signals`() {
            val attrId = UUID.randomUUID()
            val triggerRows = listOf(
                arrayOf<Any>(attrId, "555-1234", SchemaType.PHONE.name),
            )
            val triggerQuery = triggerAttributeQuery(triggerRows)
            val trigramQ = candidateQuery(emptyList())
            val exactDigitsQ = candidateQuery(emptyList())

            whenever(entityManager.createNativeQuery(any()))
                .thenReturn(triggerQuery)   // first call: trigger identifier lookup
                .thenReturn(trigramQ)       // second call: trigram candidate scan for PHONE
                .thenReturn(exactDigitsQ)   // third call: exact-digits candidate scan for PHONE

            identityMatchCandidateService.findCandidates(triggerEntityId, workspaceId)

            // 1 trigger lookup + 1 trigram query + 1 exact-digits query for PHONE
            verify(entityManager, times(3)).createNativeQuery(any())
        }

        @Test
        fun `findCandidates deduplicates trigram and exact-digits results for same entityId and attributeId keeping higher score`() {
            /**
             * Bug: trigram and exact-digits queries for PHONE may return the same (entity, attribute) pair.
             * Fix: mergeCandidates groups by (entityId, attributeId) and keeps the highest score.
             * This test verifies that exact-digits (score=1.0) wins over trigram (score=0.7) for overlapping results.
             */
            val attrId = UUID.randomUUID()
            val triggerRows = listOf(
                arrayOf<Any>(attrId, "5551234567", SchemaType.PHONE.name),
            )
            val triggerQuery = triggerAttributeQuery(triggerRows)

            // Trigram query returns a candidate at score 0.7
            val trigramRows = listOf(
                arrayOf<Any>(candidateEntityId.toString(), candidateAttributeId.toString(), "(555) 123-4567", 0.7),
            )
            val trigramQ = candidateQuery(trigramRows)

            // Exact-digits query returns the SAME candidate at score 1.0
            val exactDigitsRows = listOf(
                arrayOf<Any>(candidateEntityId.toString(), candidateAttributeId.toString(), "(555) 123-4567", 1.0),
            )
            val exactDigitsQ = candidateQuery(exactDigitsRows)

            whenever(entityManager.createNativeQuery(any()))
                .thenReturn(triggerQuery)
                .thenReturn(trigramQ)
                .thenReturn(exactDigitsQ)

            val result = identityMatchCandidateService.findCandidates(triggerEntityId, workspaceId)

            // Dedup: overlapping (entityId, attributeId) collapses to one row, keeping score=1.0
            assertEquals(1, result.size, "Overlapping trigram+exact-digits should collapse to one row")
            assertEquals(candidateEntityId, result[0].candidateEntityId)
            assertEquals(1.0, result[0].similarityScore, 1e-6, "Exact-digits score (1.0) should win over trigram (0.7)")
        }

        @Test
        fun `findCandidates phone union includes non-overlapping results from both queries`() {
            val attrId = UUID.randomUUID()
            val triggerRows = listOf(
                arrayOf<Any>(attrId, "5551234567", SchemaType.PHONE.name),
            )
            val triggerQuery = triggerAttributeQuery(triggerRows)

            val entityFromTrigram = UUID.randomUUID()
            val attrFromTrigram = UUID.randomUUID()
            val entityFromExactDigits = UUID.randomUUID()
            val attrFromExactDigits = UUID.randomUUID()

            // Trigram returns one entity, exact-digits returns a DIFFERENT entity
            val trigramRows = listOf(
                arrayOf<Any>(entityFromTrigram.toString(), attrFromTrigram.toString(), "555-1234567", 0.85),
            )
            val exactDigitsRows = listOf(
                arrayOf<Any>(entityFromExactDigits.toString(), attrFromExactDigits.toString(), "(555) 123-4567", 1.0),
            )

            whenever(entityManager.createNativeQuery(any()))
                .thenReturn(triggerQuery)
                .thenReturn(candidateQuery(trigramRows))
                .thenReturn(candidateQuery(exactDigitsRows))

            val result = identityMatchCandidateService.findCandidates(triggerEntityId, workspaceId)

            // Both non-overlapping results should be present
            assertEquals(2, result.size, "Non-overlapping results from trigram and exact-digits should both appear")
            val resultEntityIds = result.map { it.candidateEntityId }.toSet()
            assertTrue(resultEntityIds.contains(entityFromTrigram))
            assertTrue(resultEntityIds.contains(entityFromExactDigits))
        }

        @Test
        fun `findCandidates preserves multi-attribute rows for same candidate entity`() {
            /**
             * Bug: original DISTINCT ON sql collapsed all attributes for the same candidate entity to one row.
             * Fix: DISTINCT ON removed from SQL; mergeCandidates groups by (entityId, attributeId) not (entityId, signalType).
             * This test verifies that a candidate with two matching IDENTIFIER attributes produces two result rows.
             */
            val attrId = UUID.randomUUID()
            val triggerRows = listOf(
                arrayOf<Any>(attrId, "test@example.com", SchemaType.EMAIL.name),
            )
            val triggerQuery = triggerAttributeQuery(triggerRows)

            // Two rows for the same candidateEntityId — DIFFERENT attribute IDs
            val candidateAttrId1 = UUID.randomUUID()
            val candidateAttrId2 = UUID.randomUUID()
            val candidateRows = listOf(
                arrayOf<Any>(candidateEntityId.toString(), candidateAttrId1.toString(), "test@example.com", 0.95),
                arrayOf<Any>(candidateEntityId.toString(), candidateAttrId2.toString(), "test+alias@example.com", 0.70),
            )
            val candidateQMock = candidateQuery(candidateRows)

            whenever(entityManager.createNativeQuery(any()))
                .thenReturn(triggerQuery)
                .thenReturn(candidateQMock)

            val result = identityMatchCandidateService.findCandidates(triggerEntityId, workspaceId)

            // Two different attributes on same entity: should produce 2 rows (not collapsed)
            assertEquals(2, result.size, "Different attributeIds for the same entity should produce two candidate rows")
            val scores = result.map { it.similarityScore }.toSet()
            assertTrue(scores.contains(0.95), "Row with score 0.95 should be present")
            assertTrue(scores.contains(0.70), "Row with score 0.70 should be present")
        }

        @Test
        fun `findCandidates deduplicates rows with same entityId AND same attributeId keeping max similarity`() {
            val attrId = UUID.randomUUID()
            val triggerRows = listOf(
                arrayOf<Any>(attrId, "test@example.com", SchemaType.EMAIL.name),
            )
            val triggerQuery = triggerAttributeQuery(triggerRows)

            // Two rows for the same (entityId, attributeId) pair — same attribute, different scores
            val candidateRows = listOf(
                arrayOf<Any>(candidateEntityId.toString(), candidateAttributeId.toString(), "test@example.com", 0.95),
                arrayOf<Any>(candidateEntityId.toString(), candidateAttributeId.toString(), "test@example.com", 0.70),
            )
            val candidateQMock = candidateQuery(candidateRows)

            whenever(entityManager.createNativeQuery(any()))
                .thenReturn(triggerQuery)
                .thenReturn(candidateQMock)

            val result = identityMatchCandidateService.findCandidates(triggerEntityId, workspaceId)

            // Same (entityId, attributeId): should collapse to one row keeping max score
            assertEquals(1, result.size, "Same (entityId, attributeId) should deduplicate to one row")
            assertEquals(0.95, result[0].similarityScore, 1e-6, "Should keep max similarity score")
        }

        @Test
        fun `findCandidates passes workspace ID and excludes trigger entity in query parameters`() {
            val attrId = UUID.randomUUID()
            val triggerRows = listOf(
                arrayOf<Any>(attrId, "test@example.com", SchemaType.EMAIL.name),
            )
            val triggerQuery = triggerAttributeQuery(triggerRows)
            val candidateQMock = candidateQuery(emptyList())

            whenever(entityManager.createNativeQuery(any()))
                .thenReturn(triggerQuery)
                .thenReturn(candidateQMock)

            identityMatchCandidateService.findCandidates(triggerEntityId, workspaceId)

            // Verify workspaceId and triggerEntityId params are set on the candidate query mock
            verify(candidateQMock).setParameter("workspaceId", workspaceId)
            verify(candidateQMock).setParameter("triggerEntityId", triggerEntityId)
        }

        @Test
        fun `findCandidates uses normalizationService for all value normalization`() {
            val attrId = UUID.randomUUID()
            val rawEmail = "TEST@EXAMPLE.COM"
            val triggerRows = listOf(
                arrayOf<Any>(attrId, rawEmail, SchemaType.EMAIL.name),
            )
            val triggerQuery = triggerAttributeQuery(triggerRows)
            val candidateQMock = candidateQuery(emptyList())

            whenever(entityManager.createNativeQuery(any()))
                .thenReturn(triggerQuery)
                .thenReturn(candidateQMock)

            identityMatchCandidateService.findCandidates(triggerEntityId, workspaceId)

            // normalizationService.normalize should have been called with the raw value and EMAIL signal type
            verify(normalizationService).normalize(rawEmail, MatchSignalType.EMAIL)
        }
    }

    // ------ getTriggerAttributes tests ------

    @Nested
    inner class GetTriggerAttributesTests {

        @Test
        fun `getTriggerAttributes returns empty map when entity has no IDENTIFIER attributes`() {
            val emptyTriggerQuery = emptyQuery()
            whenever(entityManager.createNativeQuery(any())).thenReturn(emptyTriggerQuery)

            val result = identityMatchCandidateService.getTriggerAttributes(triggerEntityId, workspaceId)

            assertTrue(result.isEmpty(), "Expected empty map when no IDENTIFIER attributes")
        }

        @Test
        fun `getTriggerAttributes returns correct MatchSignalType to value mapping`() {
            val attrId1 = UUID.randomUUID()
            val attrId2 = UUID.randomUUID()

            val triggerRows = listOf(
                arrayOf<Any>(attrId1, "Test@Example.COM", SchemaType.EMAIL.name),
                arrayOf<Any>(attrId2, "  555-1234  ", SchemaType.PHONE.name),
            )
            val triggerQuery = triggerAttributeQuery(triggerRows)
            whenever(entityManager.createNativeQuery(any())).thenReturn(triggerQuery)
            // Normalization default from @BeforeEach: trim + lowercase (not signal-type-aware)
            // This test verifies mapping structure, not normalization strategy

            val result = identityMatchCandidateService.getTriggerAttributes(triggerEntityId, workspaceId)

            assertEquals(2, result.size)
            // Values are whatever normalizationService.normalize returns (mocked as trim+lowercase)
            assertEquals("test@example.com", result[MatchSignalType.EMAIL])
            assertEquals("555-1234", result[MatchSignalType.PHONE])
        }

        @Test
        fun `getTriggerAttributes delegates normalization to normalizationService`() {
            val attrId = UUID.randomUUID()
            val rawValue = "  JOHN@EXAMPLE.COM  "
            val triggerRows = listOf(
                arrayOf<Any>(attrId, rawValue, SchemaType.EMAIL.name),
            )
            val triggerQuery = triggerAttributeQuery(triggerRows)
            whenever(entityManager.createNativeQuery(any())).thenReturn(triggerQuery)

            val result = identityMatchCandidateService.getTriggerAttributes(triggerEntityId, workspaceId)

            // Default mock: trim + lowercase
            assertEquals("john@example.com", result[MatchSignalType.EMAIL])
            // Verify the normalization service was called with the correct signal type
            verify(normalizationService).normalize(rawValue, MatchSignalType.EMAIL)
        }

        @Test
        fun `getTriggerAttributes maps non-EMAIL non-PHONE schema types to CUSTOM_IDENTIFIER`() {
            val attrId = UUID.randomUUID()
            val triggerRows = listOf(
                arrayOf<Any>(attrId, "custom-id-123", SchemaType.TEXT.name),
            )
            val triggerQuery = triggerAttributeQuery(triggerRows)
            whenever(entityManager.createNativeQuery(any())).thenReturn(triggerQuery)

            val result = identityMatchCandidateService.getTriggerAttributes(triggerEntityId, workspaceId)

            assertEquals(1, result.size)
            assertEquals("custom-id-123", result[MatchSignalType.CUSTOM_IDENTIFIER])
        }
    }
}
