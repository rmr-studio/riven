
# Attribute

Filter by attribute value comparison.

## Properties

Name | Type
------------ | -------------
`attributeId` | string
`operator` | [FilterOperator](FilterOperator.md)
`value` | [FilterValue](FilterValue.md)

## Example

```typescript
import type { Attribute } from ''

// TODO: Update the object below with actual values
const example = {
  "attributeId": null,
  "operator": null,
  "value": null,
} satisfies Attribute

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Attribute
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


