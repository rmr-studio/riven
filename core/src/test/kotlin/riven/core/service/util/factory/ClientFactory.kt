package riven.core.service.util.factory

import riven.core.enums.client.ClientType
import riven.core.models.client.Client
import riven.core.models.common.Contact
import java.util.*

object ClientFactory {
    fun createClient(
        id: UUID = UUID.randomUUID(),
        organisationId: UUID = UUID.randomUUID(),
        name: String = "Name"
    ): Client {
        return Client(
            id = id,
            organisationId = organisationId,
            name = name,
            contact = Contact(
                email = "email@email.com",
            ),
            clientType = ClientType.CUSTOMER
        )
    }
}