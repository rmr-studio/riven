package riven.core.configuration.properties

import org.springframework.boot.context.properties.ConfigurationProperties

/**
 * Configuration properties for the custom-source subsystem (Phase 2).
 *
 * @property credentialEncryptionKey Base64-encoded 32-byte (256-bit) AES key used by
 *   [riven.core.service.connector.CredentialEncryptionService]. Supplied via the
 *   `RIVEN_CREDENTIAL_ENCRYPTION_KEY` environment variable; must be set at boot or
 *   the encryption service fails fast.
 */
@ConfigurationProperties(prefix = "riven.connector")
data class DataConnectorConfigurationProperties(
    val credentialEncryptionKey: String = "",
)
