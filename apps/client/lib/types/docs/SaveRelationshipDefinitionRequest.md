
# SaveRelationshipDefinitionRequest

Request to save a relationship definition for an entity type

## Properties

Name | Type
------------ | -------------
`key` | string
`id` | string
`type` | [EntityTypeRequestDefinition](EntityTypeRequestDefinition.md)
`relationship` | [EntityRelationshipDefinition](EntityRelationshipDefinition.md)

## Example

```typescript
import type { SaveRelationshipDefinitionRequest } from ''

// TODO: Update the object below with actual values
const example = {
  "key": null,
  "id": null,
  "type": null,
  "relationship": null,
} satisfies SaveRelationshipDefinitionRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SaveRelationshipDefinitionRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


