package riven.core.util.factory.entity

object DefaultEntityTypeSchemaFactory {
    fun createOrganisationMemberTypeSchema() = """
        {
          "form": {
            "fields": [
              {
                "key": "first_name",
                "type": "text",
                "label": "First Name",
                "required": true
              },
              {
                "key": "last_name",
                "type": "text",
                "label": "Last Name",
                "required": true
              },
              {
                "key": "email",
                "type": "email",
                "label": "Email Address",
                "required": true
              },
              {
                "key": "role",
                "type": "select",
                "label": "Role",
                "options": [
                  {"value": "owner", "label": "Owner"},
                  {"value": "admin", "label": "Admin"},
                  {"value": "member", "label": "Member"}
                ],
                "required": true
              }
            ]
          },
          "summary": {
            "titleField": "first_name",
            "descriptionField": "role",
            "iconField": null
          }
        }
    """.trimIndent()
}