
# QueryPagination

Pagination and ordering configuration.

## Properties

Name | Type
------------ | -------------
`limit` | number
`offset` | number
`orderBy` | [Array&lt;OrderByClause&gt;](OrderByClause.md)

## Example

```typescript
import type { QueryPagination } from ''

// TODO: Update the object below with actual values
const example = {
  "limit": null,
  "offset": null,
  "orderBy": null,
} satisfies QueryPagination

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as QueryPagination
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


