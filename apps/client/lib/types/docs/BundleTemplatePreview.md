
# BundleTemplatePreview


## Properties

Name | Type
------------ | -------------
`key` | string
`name` | string
`description` | string
`entityTypes` | [Array&lt;CatalogEntityTypeModel&gt;](CatalogEntityTypeModel.md)
`relationships` | [Array&lt;CatalogRelationshipModel&gt;](CatalogRelationshipModel.md)

## Example

```typescript
import type { BundleTemplatePreview } from ''

// TODO: Update the object below with actual values
const example = {
  "key": null,
  "name": null,
  "description": null,
  "entityTypes": null,
  "relationships": null,
} satisfies BundleTemplatePreview

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as BundleTemplatePreview
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


