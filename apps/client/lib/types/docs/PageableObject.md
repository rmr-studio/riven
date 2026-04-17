
# PageableObject


## Properties

Name | Type
------------ | -------------
`offset` | number
`sort` | [SortObject](SortObject.md)
`paged` | boolean
`pageNumber` | number
`pageSize` | number
`unpaged` | boolean

## Example

```typescript
import type { PageableObject } from ''

// TODO: Update the object below with actual values
const example = {
  "offset": null,
  "sort": null,
  "paged": null,
  "pageNumber": null,
  "pageSize": null,
  "unpaged": null,
} satisfies PageableObject

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PageableObject
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


