package riven.core.entity.entity

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.context.annotation.Import
import org.springframework.data.auditing.DateTimeProvider
import org.springframework.data.domain.AuditorAware
import org.springframework.data.jpa.repository.TestEntityManager
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import org.springframework.test.context.ActiveProfiles
import riven.core.enums.integration.SourceType
import riven.core.service.util.factory.entity.EntityFactory
import java.time.ZonedDateTime
import java.time.temporal.TemporalAccessor
import java.util.Optional
import java.util.UUID

/**
 * Verifies [SourceType.CUSTOM_SOURCE] round-trips through JPA on
 * [EntityTypeEntity.sourceType] without loss.
 *
 * Uses the existing H2 `test` profile (ddl-auto: create-drop, PostgreSQL compat mode).
 * No migration required: `source_type` is VARCHAR(50) with `@Enumerated(STRING)`.
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Import(SourceTypeJpaRoundTripTest.JpaAuditingConfig::class)
class SourceTypeJpaRoundTripTest {

    @org.springframework.boot.test.context.TestConfiguration
    @EnableJpaAuditing(
        auditorAwareRef = "testAuditorProvider",
        dateTimeProviderRef = "testDateTimeProvider",
    )
    class JpaAuditingConfig {

        @org.springframework.context.annotation.Bean
        fun testAuditorProvider(): AuditorAware<UUID> = AuditorAware { Optional.empty() }

        @org.springframework.context.annotation.Bean
        fun testDateTimeProvider(): DateTimeProvider =
            DateTimeProvider { Optional.of<TemporalAccessor>(ZonedDateTime.now()) }
    }

    @Autowired
    private lateinit var entityManager: TestEntityManager

    @Test
    fun `EntityTypeEntity with CUSTOM_SOURCE round-trips through JPA`() {
        val entity = EntityFactory.createEntityType(
            id = null, // let JPA generate
            key = "custom_source_roundtrip_${UUID.randomUUID().toString().take(8)}",
            sourceType = SourceType.CUSTOM_SOURCE,
        ).copy(id = null) // ensure no pre-set id triggers merge()

        val persisted = entityManager.persistAndFlush(entity)
        val persistedId = requireNotNull(persisted.id) {
            "id should be assigned after flush"
        }

        entityManager.clear()

        val reloaded = entityManager.find(EntityTypeEntity::class.java, persistedId)

        assertThat(reloaded).isNotNull
        assertThat(reloaded.sourceType).isEqualTo(SourceType.CUSTOM_SOURCE)
    }
}
