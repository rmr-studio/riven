
# EntityType


## Properties

Name | Type
------------ | -------------
`id` | string
`key` | string
`version` | number
`icon` | [Icon](Icon.md)
`name` | [DisplayName](DisplayName.md)
`_protected` | boolean
`identifierKey` | string
`description` | string
`workspaceId` | string
`type` | [EntityCategory](EntityCategory.md)
`schema` | [SchemaUUID](SchemaUUID.md)
`relationships` | [Array&lt;EntityRelationshipDefinition&gt;](EntityRelationshipDefinition.md)
`columns` | [Array&lt;EntityTypeAttributeColumn&gt;](EntityTypeAttributeColumn.md)
`entitiesCount` | number
`createdAt` | Date
`updatedAt` | Date
`createdBy` | string
`updatedBy` | string
`attributes` | [PairIntegerInteger](PairIntegerInteger.md)

## Example

```typescript
import type { EntityType } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "key": null,
  "version": null,
  "icon": null,
  "name": null,
  "_protected": null,
  "identifierKey": null,
  "description": null,
  "workspaceId": null,
  "type": null,
  "schema": null,
  "relationships": null,
  "columns": null,
  "entitiesCount": null,
  "createdAt": null,
  "updatedAt": null,
  "createdBy": null,
  "updatedBy": null,
  "attributes": null,
} satisfies EntityType

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EntityType
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


