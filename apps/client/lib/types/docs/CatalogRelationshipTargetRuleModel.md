
# CatalogRelationshipTargetRuleModel


## Properties

Name | Type
------------ | -------------
`id` | string
`targetEntityTypeKey` | string
`cardinalityOverride` | [EntityRelationshipCardinality](EntityRelationshipCardinality.md)
`inverseVisible` | boolean
`inverseName` | string

## Example

```typescript
import type { CatalogRelationshipTargetRuleModel } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "targetEntityTypeKey": null,
  "cardinalityOverride": null,
  "inverseVisible": null,
  "inverseName": null,
} satisfies CatalogRelationshipTargetRuleModel

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CatalogRelationshipTargetRuleModel
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


