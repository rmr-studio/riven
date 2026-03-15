package riven.core.repository.identity

import org.springframework.data.jpa.repository.JpaRepository
import riven.core.entity.identity.MatchSuggestionEntity
import java.util.UUID

/**
 * Repository for MatchSuggestionEntity instances.
 */
interface MatchSuggestionRepository : JpaRepository<MatchSuggestionEntity, UUID>
