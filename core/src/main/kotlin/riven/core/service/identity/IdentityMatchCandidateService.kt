package riven.core.service.identity

import io.github.oshai.kotlinlogging.KLogger
import jakarta.persistence.EntityManager
import org.springframework.stereotype.Service
import riven.core.enums.common.validation.SchemaType
import riven.core.enums.identity.MatchSignalType
import riven.core.enums.identity.MatchSource
import riven.core.models.identity.CandidateMatch
import java.util.UUID

/**
 * Finds candidate entities for identity matching using a two-phase pg_trgm similarity query.
 *
 * This service is called from a Temporal activity — workspace ID is always passed explicitly;
 * no Spring Security context is required.
 */
@Service
class IdentityMatchCandidateService(
    private val entityManager: EntityManager,
    private val normalizationService: IdentityNormalizationService,
    private val logger: KLogger,
) {

    companion object {
        /**
         * Maximum rows returned per individual query (trigram or exact-digits).
         * This is a per-query limit, not a global cap — PHONE signals may return up to
         * 2x this count before mergeCandidates deduplication.
         */
        private const val CANDIDATE_LIMIT = 100
    }

    // ------ Public operations ------

    /**
     * Returns candidate matches for a given trigger entity using signal-type-aware normalization
     * and pg_trgm blocking on IDENTIFIER attributes.
     *
     * For each IDENTIFIER-classified attribute of the trigger entity, runs a native SQL query
     * that uses the `%` pg_trgm operator for GIN-index blocking, then filters by `similarity()`
     * score. For PHONE signals, an additional exact-digits query is unioned in Kotlin to catch
     * differently-formatted numbers that share the same digits.
     *
     * Results are merged and deduplicated by (candidateEntityId, candidateAttributeId),
     * keeping the highest-scoring match per group.
     *
     * @param triggerEntityId the entity whose attributes are used as matching signals
     * @param workspaceId workspace scope — candidate entities must be in the same workspace
     * @return deduplicated list of candidate matches, at most [CANDIDATE_LIMIT] per query
     */
    fun findCandidates(triggerEntityId: UUID, workspaceId: UUID): List<CandidateMatch> {
        val triggerAttrs = queryTriggerIdentifierAttributes(triggerEntityId, workspaceId)
        if (triggerAttrs.isEmpty()) {
            logger.debug { "No IDENTIFIER attributes found for entity $triggerEntityId — skipping candidate scan" }
            return emptyList()
        }

        val allCandidates = mutableListOf<CandidateMatch>()

        for (row in triggerAttrs) {
            val attributeId = parseUuid(row[0])
            val rawValue = row[1].toString()
            val schemaType = SchemaType.valueOf(row[2].toString())
            // signal_type from semantic metadata takes precedence over schema type derivation —
            // allows NAME/COMPANY signals even though SchemaType has no NAME/COMPANY variants.
            val rawSignalType = row[3]?.toString()
            val signalType = MatchSignalType.fromColumnValue(rawSignalType)
                ?: MatchSignalType.fromSchemaType(schemaType)
            val normalizedValue = normalizationService.normalize(rawValue, signalType)

            logger.debug { "Scanning candidates for attribute $attributeId (type=$signalType) value='$normalizedValue'" }

            val candidates = runCandidateQuery(triggerEntityId, workspaceId, normalizedValue, signalType)

            // For NAME signals, re-score trigram candidates with token overlap BEFORE adding
            val processedCandidates = if (signalType == MatchSignalType.NAME) {
                candidates.map { candidate ->
                    val tokenOverlap = TokenSimilarity.overlap(normalizedValue, candidate.candidateValue)
                    val finalScore = maxOf(candidate.similarityScore, tokenOverlap)
                    if (finalScore > candidate.similarityScore) candidate.copy(similarityScore = finalScore) else candidate
                }
            } else {
                candidates
            }
            allCandidates.addAll(processedCandidates)

            if (signalType == MatchSignalType.PHONE) {
                val exactCandidates = findPhoneExactDigitsCandidates(triggerEntityId, workspaceId, normalizedValue)
                allCandidates.addAll(exactCandidates)
            }

            if (signalType == MatchSignalType.NAME) {
                val nicknameCandidates = findNicknameCandidates(triggerEntityId, workspaceId, normalizedValue, signalType)
                allCandidates.addAll(nicknameCandidates)
            }

            if (signalType == MatchSignalType.EMAIL) {
                val domain = EmailMatcher.extractDomain(normalizedValue)
                if (domain != null && !EmailMatcher.isFreeEmailDomain(domain)) {
                    val emailDomainCandidates = findEmailDomainCandidates(
                        triggerEntityId, workspaceId, normalizedValue, domain, signalType
                    )
                    allCandidates.addAll(emailDomainCandidates)
                }
            }
        }

        return mergeCandidates(allCandidates)
    }

    /**
     * Returns a map of [MatchSignalType] to normalized attribute value for the given entity's
     * IDENTIFIER-classified attributes.
     *
     * Used by the scoring activity to supply source values when building [riven.core.models.identity.MatchSignal] breakdown.
     *
     * @param entityId the entity whose IDENTIFIER attributes to retrieve
     * @param workspaceId workspace scope
     * @return map from signal type to normalized string value; empty if entity has no IDENTIFIER attributes
     */
    fun getTriggerAttributes(entityId: UUID, workspaceId: UUID): Map<MatchSignalType, String> {
        val rows = queryTriggerIdentifierAttributes(entityId, workspaceId)
        if (rows.isEmpty()) return emptyMap()

        val result = mutableMapOf<MatchSignalType, String>()
        for (row in rows) {
            val rawValue = row[1].toString()
            val schemaType = SchemaType.valueOf(row[2].toString())
            val rawSignalType = row[3]?.toString()
            val signalType = MatchSignalType.fromColumnValue(rawSignalType)
                ?: MatchSignalType.fromSchemaType(schemaType)
            if (!result.containsKey(signalType)) {
                result[signalType] = normalizationService.normalize(rawValue, signalType)
            }
        }
        return result
    }

    // ------ Private helpers ------

    /**
     * Queries IDENTIFIER-classified attributes for the given entity.
     *
     * Returns a list of rows, each as:
     * [attributeId (UUID/String), attrValue (String), schemaType (String), signalType (String?)].
     *
     * The `signal_type` column from semantic metadata takes precedence over the derived schema type
     * for signal routing. This allows NAME and COMPANY signals to be identified even though
     * [SchemaType] has no NAME/COMPANY variants — the workspace configures these via `signal_type`.
     */
    @Suppress("UNCHECKED_CAST")
    private fun queryTriggerIdentifierAttributes(entityId: UUID, workspaceId: UUID): List<Array<Any>> {
        val sql = """
            SELECT ea.attribute_id, ea.value->>'value' AS attr_value, ea.schema_type, sm.signal_type
            FROM entity_attributes ea
            JOIN entity_type_semantic_metadata sm
                ON sm.workspace_id = :workspaceId
               AND sm.target_type = 'ATTRIBUTE'
               AND sm.target_id = ea.attribute_id
               AND sm.classification = 'IDENTIFIER'
               AND sm.deleted = false
            WHERE ea.entity_id = :entityId
              AND ea.workspace_id = :workspaceId
              AND ea.deleted = false
        """.trimIndent()

        val query = entityManager.createNativeQuery(sql)
        query.setParameter("entityId", entityId)
        query.setParameter("workspaceId", workspaceId)

        return query.resultList as List<Array<Any>>
    }

    /**
     * Executes the pg_trgm candidate blocking query for a single trigger attribute value.
     *
     * Uses `%` for GIN index leverage and `similarity()` for score extraction.
     * DISTINCT ON has been intentionally removed so that a candidate entity with multiple
     * IDENTIFIER attributes can appear as multiple rows — one per matching attribute.
     */
    @Suppress("UNCHECKED_CAST")
    private fun runCandidateQuery(
        triggerEntityId: UUID,
        workspaceId: UUID,
        inputValue: String,
        signalType: MatchSignalType,
    ): List<CandidateMatch> {
        val sql = """
            SELECT ea.entity_id AS candidate_entity_id,
                   ea.attribute_id AS candidate_attribute_id,
                   ea.value->>'value' AS candidate_value,
                   similarity(ea.value->>'value', :inputValue) AS sim_score,
                   sm.signal_type AS candidate_signal_type
            FROM entity_attributes ea
            JOIN entity_type_semantic_metadata sm
                ON sm.workspace_id = :workspaceId
               AND sm.target_type = 'ATTRIBUTE'
               AND sm.target_id = ea.attribute_id
               AND sm.classification = 'IDENTIFIER'
               AND sm.deleted = false
            WHERE ea.workspace_id = :workspaceId
              AND ea.entity_id != :triggerEntityId
              AND ea.deleted = false
              AND (ea.value->>'value') % :inputValue
              AND similarity(ea.value->>'value', :inputValue) > 0.3
            ORDER BY sim_score DESC
            LIMIT $CANDIDATE_LIMIT
        """.trimIndent()

        // NOTE: Candidates are not filtered by schema type — cross-type matches use the trigger's
        // signal type. candidateSignalType from sm.signal_type enables cross-type discounting downstream.
        val query = entityManager.createNativeQuery(sql)
        query.setParameter("workspaceId", workspaceId)
        query.setParameter("triggerEntityId", triggerEntityId)
        query.setParameter("inputValue", inputValue)

        val rows = query.resultList as List<Array<Any>>
        return rows.map { row ->
            val rawSignalType = row[4]?.toString()
            val candidateSignalType = MatchSignalType.fromColumnValue(rawSignalType)
            CandidateMatch(
                candidateEntityId = parseUuid(row[0]),
                candidateAttributeId = parseUuid(row[1]),
                candidateValue = row[2].toString(),
                signalType = signalType,
                similarityScore = (row[3] as Number).toDouble(),
                candidateSignalType = candidateSignalType,
                matchSource = MatchSource.TRIGRAM,
            )
        }
    }

    /**
     * Runs an exact-digits candidate lookup for PHONE signals.
     *
     * Strips all non-digit characters from stored values and compares against [normalizedDigits]
     * (already a digits-only string from [IdentityNormalizationService]). Returns sim_score=1.0
     * for all matches since equality is exact.
     *
     * This query runs in parallel with the trigram query for PHONE signals; [mergeCandidates]
     * deduplicates overlapping results by (entityId, attributeId), keeping the higher score.
     *
     * @param triggerEntityId the entity to exclude from results
     * @param workspaceId workspace scope
     * @param normalizedDigits digits-only phone number (as returned by IdentityNormalizationService for PHONE)
     */
    @Suppress("UNCHECKED_CAST")
    private fun findPhoneExactDigitsCandidates(
        triggerEntityId: UUID,
        workspaceId: UUID,
        normalizedDigits: String,
    ): List<CandidateMatch> {
        val sql = """
            SELECT ea.entity_id   AS candidate_entity_id,
                   ea.attribute_id AS candidate_attribute_id,
                   ea.value->>'value' AS candidate_value,
                   1.0            AS sim_score,
                   sm.signal_type AS candidate_signal_type
            FROM entity_attributes ea
            JOIN entity_type_semantic_metadata sm
                ON sm.workspace_id = :workspaceId
               AND sm.target_type = 'ATTRIBUTE'
               AND sm.target_id = ea.attribute_id
               AND sm.classification = 'IDENTIFIER'
               AND sm.deleted = false
            WHERE ea.workspace_id = :workspaceId
              AND ea.entity_id != :triggerEntityId
              AND ea.deleted = false
              AND regexp_replace(ea.value->>'value', '[^0-9]', '', 'g') = :normalizedDigits
            LIMIT $CANDIDATE_LIMIT
        """.trimIndent()

        val query = entityManager.createNativeQuery(sql)
        query.setParameter("workspaceId", workspaceId)
        query.setParameter("triggerEntityId", triggerEntityId)
        query.setParameter("normalizedDigits", normalizedDigits)

        val rows = query.resultList as List<Array<Any>>
        return rows.map { row ->
            val rawSignalType = row[4]?.toString()
            val candidateSignalType = MatchSignalType.fromColumnValue(rawSignalType)
            CandidateMatch(
                candidateEntityId = parseUuid(row[0]),
                candidateAttributeId = parseUuid(row[1]),
                candidateValue = row[2].toString(),
                signalType = MatchSignalType.PHONE,
                similarityScore = (row[3] as Number).toDouble(),
                candidateSignalType = candidateSignalType,
                matchSource = MatchSource.EXACT_NORMALIZED,
            )
        }
    }

    /**
     * Runs a nickname expansion candidate lookup for NAME signals.
     *
     * Tokenizes [normalizedValue] by whitespace, expands each token via [NicknameExpander],
     * and queries the DB for attribute values matching any nickname variant using an IN-clause.
     * Returns an empty list immediately if no known nickname variants exist for any token —
     * this avoids an empty IN-clause SQL error.
     *
     * All matches receive a fixed similarity score of 0.95 and [MatchSource.NICKNAME].
     *
     * @param triggerEntityId the entity to exclude from results
     * @param workspaceId workspace scope
     * @param normalizedValue normalized trigger name value (space-separated tokens)
     * @param signalType the signal type to assign to returned candidates (NAME)
     */
    @Suppress("UNCHECKED_CAST")
    private fun findNicknameCandidates(
        triggerEntityId: UUID,
        workspaceId: UUID,
        normalizedValue: String,
        signalType: MatchSignalType,
    ): List<CandidateMatch> {
        // Tokenize trigger value and expand each token to all known nickname variants
        val tokens = normalizedValue.lowercase().split(Regex("\\s+")).filter { it.isNotEmpty() }
        val variants: Set<String> = tokens.flatMap { token ->
            NicknameExpander.expand(token) + token
        }.map { it.lowercase() }.toSet()

        // Empty variants means no known nicknames for any token — skip SQL to avoid empty IN-clause
        if (variants.isEmpty()) return emptyList()

        val sql = """
            SELECT ea.entity_id   AS candidate_entity_id,
                   ea.attribute_id AS candidate_attribute_id,
                   ea.value->>'value' AS candidate_value,
                   0.95            AS sim_score,
                   sm.signal_type  AS candidate_signal_type
            FROM entity_attributes ea
            JOIN entity_type_semantic_metadata sm
                ON sm.workspace_id = :workspaceId
               AND sm.target_type = 'ATTRIBUTE'
               AND sm.target_id = ea.attribute_id
               AND sm.classification = 'IDENTIFIER'
               AND sm.deleted = false
            WHERE ea.workspace_id = :workspaceId
              AND ea.entity_id != :triggerEntityId
              AND ea.deleted = false
              AND LOWER(ea.value->>'value') IN (:variants)
            LIMIT $CANDIDATE_LIMIT
        """.trimIndent()

        val query = entityManager.createNativeQuery(sql)
        query.setParameter("workspaceId", workspaceId)
        query.setParameter("triggerEntityId", triggerEntityId)
        query.setParameter("variants", variants)

        val rows = query.resultList as List<Array<Any>>
        return rows.map { row ->
            val rawSignalType = row[4]?.toString()
            val candidateSignalType = MatchSignalType.fromColumnValue(rawSignalType)
            CandidateMatch(
                candidateEntityId = parseUuid(row[0]),
                candidateAttributeId = parseUuid(row[1]),
                candidateValue = row[2].toString(),
                signalType = signalType,
                similarityScore = (row[3] as Number).toDouble(),
                candidateSignalType = candidateSignalType,
                matchSource = MatchSource.NICKNAME,
            )
        }
    }

    /**
     * Finds candidates sharing the same corporate email domain as the trigger entity.
     *
     * Two-phase approach:
     * 1. SQL phase: fetches all same-domain candidates in the workspace using a domain substring
     *    match. Only the domain is checked at this stage — no similarity filtering in SQL.
     * 2. Kotlin phase: extracts the local part from each candidate email and computes overlap
     *    coefficient via [EmailMatcher.localPartSimilarity]. Candidates with overlap below 0.5
     *    are discarded; the remainder are returned with [MatchSource.EMAIL_DOMAIN].
     *
     * The free-domain guard (skip gmail.com, yahoo.com, etc.) is enforced in the [findCandidates]
     * loop before calling this method — so this method assumes the domain is already known to
     * be corporate.
     *
     * @param triggerEntityId the entity to exclude from results
     * @param workspaceId workspace scope
     * @param normalizedEmail normalized trigger email address
     * @param domain the corporate domain extracted from [normalizedEmail]
     * @param signalType the signal type to assign to returned candidates (EMAIL)
     */
    @Suppress("UNCHECKED_CAST")
    private fun findEmailDomainCandidates(
        triggerEntityId: UUID,
        workspaceId: UUID,
        normalizedEmail: String,
        domain: String,
        signalType: MatchSignalType,
    ): List<CandidateMatch> {
        val sql = """
            SELECT ea.entity_id   AS candidate_entity_id,
                   ea.attribute_id AS candidate_attribute_id,
                   ea.value->>'value' AS candidate_value,
                   sm.signal_type  AS candidate_signal_type
            FROM entity_attributes ea
            JOIN entity_type_semantic_metadata sm
                ON sm.workspace_id = :workspaceId
               AND sm.target_type = 'ATTRIBUTE'
               AND sm.target_id = ea.attribute_id
               AND sm.classification = 'IDENTIFIER'
               AND sm.deleted = false
            WHERE ea.workspace_id = :workspaceId
              AND ea.entity_id != :triggerEntityId
              AND ea.deleted = false
              AND substring(ea.value->>'value' from '@(.+)${'$'}') = :domain
            LIMIT $CANDIDATE_LIMIT
        """.trimIndent()

        val query = entityManager.createNativeQuery(sql)
        query.setParameter("workspaceId", workspaceId)
        query.setParameter("triggerEntityId", triggerEntityId)
        query.setParameter("domain", domain)

        val rows = query.resultList as List<Array<Any>>

        val triggerLocal = EmailMatcher.extractLocal(normalizedEmail) ?: return emptyList()

        return rows.mapNotNull { row ->
            val candidateValue = row[2].toString()
            val candidateLocal = EmailMatcher.extractLocal(candidateValue) ?: return@mapNotNull null
            val overlap = EmailMatcher.localPartSimilarity(triggerLocal, candidateLocal)
            if (overlap < 0.5) return@mapNotNull null

            val rawSignalType = row[3]?.toString()
            val candidateSignalType = MatchSignalType.fromColumnValue(rawSignalType)
            CandidateMatch(
                candidateEntityId = parseUuid(row[0]),
                candidateAttributeId = parseUuid(row[1]),
                candidateValue = candidateValue,
                signalType = signalType,
                similarityScore = overlap,
                candidateSignalType = candidateSignalType,
                matchSource = MatchSource.EMAIL_DOMAIN,
            )
        }
    }

    /**
     * Merges candidate rows by (candidateEntityId, candidateAttributeId), keeping the entry
     * with the highest similarity score per group.
     *
     * Grouping by attribute (not signal type) preserves multi-attribute matches — a candidate
     * entity with two distinct IDENTIFIER attributes produces two result rows. Deduplication
     * only collapses trigram vs exact-digits results for the same (entity, attribute) pair.
     */
    private fun mergeCandidates(candidates: List<CandidateMatch>): List<CandidateMatch> {
        return candidates
            .groupBy { it.candidateEntityId to it.candidateAttributeId }
            .values
            .map { group ->
                requireNotNull(
                    group.maxWithOrNull(
                        compareBy<CandidateMatch> { it.similarityScore }
                            .thenBy {
                                when (it.matchSource) {
                                    MatchSource.NICKNAME, MatchSource.EMAIL_DOMAIN -> 1
                                    else -> 0
                                }
                            }
                    )
                ) {
                    "Candidate group was empty - groupBy should never produce an empty group"
                }
            }
    }

    /** Parses a UUID from either a [UUID] instance or its string representation. */
    private fun parseUuid(value: Any): UUID = when (value) {
        is UUID -> value
        else -> UUID.fromString(value.toString())
    }
}
