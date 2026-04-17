
# SortObject


## Properties

Name | Type
------------ | -------------
`empty` | boolean
`sorted` | boolean
`unsorted` | boolean

## Example

```typescript
import type { SortObject } from ''

// TODO: Update the object below with actual values
const example = {
  "empty": null,
  "sorted": null,
  "unsorted": null,
} satisfies SortObject

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SortObject
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


