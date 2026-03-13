
# CatalogEntityTypeModel


## Properties

Name | Type
------------ | -------------
`id` | string
`key` | string
`displayNameSingular` | string
`displayNamePlural` | string
`iconType` | [IconType](IconType.md)
`iconColour` | [IconColour](IconColour.md)
`semanticGroup` | [SemanticGroup](SemanticGroup.md)
`identifierKey` | string
`readonly` | boolean
`schema` | { [key: string]: object; }
`columns` | Array&lt;{ [key: string]: object; }&gt;
`semanticMetadata` | [Array&lt;CatalogSemanticMetadataModel&gt;](CatalogSemanticMetadataModel.md)

## Example

```typescript
import type { CatalogEntityTypeModel } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "key": null,
  "displayNameSingular": null,
  "displayNamePlural": null,
  "iconType": null,
  "iconColour": null,
  "semanticGroup": null,
  "identifierKey": null,
  "readonly": null,
  "schema": null,
  "columns": null,
  "semanticMetadata": null,
} satisfies CatalogEntityTypeModel

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CatalogEntityTypeModel
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


