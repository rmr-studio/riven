
# CatalogRelationshipModel


## Properties

Name | Type
------------ | -------------
`id` | string
`key` | string
`sourceEntityTypeKey` | string
`name` | string
`iconType` | [IconType](IconType.md)
`iconColour` | [IconColour](IconColour.md)
`cardinalityDefault` | [EntityRelationshipCardinality](EntityRelationshipCardinality.md)
`_protected` | boolean
`targetRules` | [Array&lt;CatalogRelationshipTargetRuleModel&gt;](CatalogRelationshipTargetRuleModel.md)

## Example

```typescript
import type { CatalogRelationshipModel } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "key": null,
  "sourceEntityTypeKey": null,
  "name": null,
  "iconType": null,
  "iconColour": null,
  "cardinalityDefault": null,
  "_protected": null,
  "targetRules": null,
} satisfies CatalogRelationshipModel

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CatalogRelationshipModel
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


