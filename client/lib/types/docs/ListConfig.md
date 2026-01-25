
# ListConfig


## Properties

Name | Type
------------ | -------------
`mode` | [BlockListOrderingMode](BlockListOrderingMode.md)
`sort` | [SortSpec](SortSpec.md)
`filters` | [Array&lt;FilterSpec&gt;](FilterSpec.md)
`filterLogic` | [ListFilterLogicType](ListFilterLogicType.md)

## Example

```typescript
import type { ListConfig } from ''

// TODO: Update the object below with actual values
const example = {
  "mode": null,
  "sort": null,
  "filters": null,
  "filterLogic": null,
} satisfies ListConfig

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ListConfig
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


