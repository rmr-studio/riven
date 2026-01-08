package riven.core.models.common.http

import riven.core.enums.common.http.SignatureAlgorithmType
import riven.core.enums.common.http.SignatureHeaderType

data class Signature(
    val signatureHeader: SignatureHeaderType,
    val signatureAlgorithm: SignatureAlgorithmType
)