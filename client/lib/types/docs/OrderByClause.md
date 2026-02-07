
# OrderByClause

Single ordering clause.

## Properties

Name | Type
------------ | -------------
`attributeId` | string
`direction` | [SortDirection](SortDirection.md)

## Example

```typescript
import type { OrderByClause } from ''

// TODO: Update the object below with actual values
const example = {
  "attributeId": null,
  "direction": null,
} satisfies OrderByClause

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as OrderByClause
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


