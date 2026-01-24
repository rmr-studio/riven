
# EntityRelationshipDefinition


## Properties

Name | Type
------------ | -------------
`id` | string
`icon` | [Icon](Icon.md)
`name` | string
`relationshipType` | [EntityTypeRelationshipType](EntityTypeRelationshipType.md)
`sourceEntityTypeKey` | string
`originRelationshipId` | string
`entityTypeKeys` | Array&lt;string&gt;
`allowPolymorphic` | boolean
`required` | boolean
`cardinality` | [EntityRelationshipCardinality](EntityRelationshipCardinality.md)
`bidirectional` | boolean
`bidirectionalEntityTypeKeys` | Array&lt;string&gt;
`inverseName` | string
`_protected` | boolean
`createdAt` | Date
`updatedAt` | Date
`createdBy` | string
`updatedBy` | string

## Example

```typescript
import type { EntityRelationshipDefinition } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "icon": null,
  "name": null,
  "relationshipType": null,
  "sourceEntityTypeKey": null,
  "originRelationshipId": null,
  "entityTypeKeys": null,
  "allowPolymorphic": null,
  "required": null,
  "cardinality": null,
  "bidirectional": null,
  "bidirectionalEntityTypeKeys": null,
  "inverseName": null,
  "_protected": null,
  "createdAt": null,
  "updatedAt": null,
  "createdBy": null,
  "updatedBy": null,
} satisfies EntityRelationshipDefinition

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EntityRelationshipDefinition
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


