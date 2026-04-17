
# PageInsightsChatSessionModel


## Properties

Name | Type
------------ | -------------
`totalPages` | number
`totalElements` | number
`first` | boolean
`last` | boolean
`size` | number
`content` | [Array&lt;InsightsChatSessionModel&gt;](InsightsChatSessionModel.md)
`number` | number
`sort` | [SortObject](SortObject.md)
`pageable` | [PageableObject](PageableObject.md)
`numberOfElements` | number
`empty` | boolean

## Example

```typescript
import type { PageInsightsChatSessionModel } from ''

// TODO: Update the object below with actual values
const example = {
  "totalPages": null,
  "totalElements": null,
  "first": null,
  "last": null,
  "size": null,
  "content": null,
  "number": null,
  "sort": null,
  "pageable": null,
  "numberOfElements": null,
  "empty": null,
} satisfies PageInsightsChatSessionModel

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PageInsightsChatSessionModel
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


